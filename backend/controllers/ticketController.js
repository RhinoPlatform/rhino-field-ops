const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const ticketController = {
  createTicket: async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const authenticatedUserId = req.user.id;
      const authenticatedUserRole = req.user.role;

      const {
        customerId, leaseWellId, assetId, technicianId, truckId,
        customerPoAfe, rigName, companyMan, rigPhone, rigFax,
        chkVacuumWaste, chkPressureWashBlueChemical, chkDeepWipeTrashLiner, chkReplenishConsumables,
        usageTier, personnelCount, daysSinceLastService,
        arriveTime, finishTime, travelTime_duration, travelEndTime, fuelCharges,
        subTotal, customerSignature, technicianSignature,
        serviceLines, isOfflineSync
      } = req.body;

      if (authenticatedUserRole === 'Technician' && Number(technicianId) !== authenticatedUserId) {
        await client.query('ROLLBACK');
        return res.status(403).json({ success: false, error: 'Security Violation: RLS Enforcement Restriction.' });
      }

      const truckResult = await client.query('SELECT * FROM truck_consumables_inventory WHERE truck_id = $1;', [truckId]);
      if (truckResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, error: 'Service Vehicle ID not found.' });
      }
      const truckInventory = truckResult.rows[0];

      const assetResult = await client.query('SELECT asset_type FROM assets WHERE id = $1;', [assetId]);
      if (assetResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, error: 'Asset serial mismatch.' });
      }
      const unitMultiplier = assetResult.rows[0].asset_type === 'Combo Trailer' ? 2 : 1;

      let vaultVolume = 10; 
      if (usageTier === 'Light') vaultVolume += 17.5;
      else if (usageTier === 'Standard') vaultVolume += 25.0;
      else if (usageTier === 'Dynamic') vaultVolume += (personnelCount * 0.15 * daysSinceLastService);

      const incomingWaste = vaultVolume * unitMultiplier;
      const prospectiveWaste = Number(truckInventory.blue_chemical) + incomingWaste; 

      if (prospectiveWaste >= 510) {
        await client.query('ROLLBACK');
        return res.status(423).json({ success: false, error: `CRITICAL_LOCKOUT: Capacity exceeded (${prospectiveWaste} GAL). Route suspended.` });
      }

      const ticketQuery = `
        INSERT INTO service_tickets (
          customer_id, lease_well_id, asset_id, technician_id, customer_po_afe, rig_name, company_man, rig_phone, rig_fax,
          chk_vacuum_waste, chk_pressure_wash_blue_chemical, chk_deep_wipe_trash_liner, chk_replenish_consumables,
          usage_tier, personnel_count, days_since_last_service, arrive_time_job_site, finish_time_job_site, 
          travel_time_duration, travel_end_time, fuel_charges, sub_total, customer_signature, technician_signature,
          is_offline_sync, sync_processed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
        RETURNING folio;
      `;
      const ticketValues = [
        customerId, leaseWellId, assetId, technicianId, customerPoAfe, rigName, companyMan, rigPhone, rigFax,
        chkVacuumWaste, chkPressureWashBlueChemical, chkDeepWipeTrashLiner, chkReplenishConsumables,
        usageTier, personnelCount, daysSinceLastService, arriveTime, finishTime, travelTime_duration, travelEndTime, fuelCharges,
        subTotal, customerSignature, technicianSignature, typeof isOfflineSync === 'boolean' ? isOfflineSync : false, isOfflineSync ? new Date().toISOString() : null
      ];
      const ticketResult = await client.query(ticketQuery, ticketValues);
      const generatedFolio = ticketResult.rows[0].folio;

      if (serviceLines && serviceLines.length > 0) {
        const lineQuery = 'INSERT INTO service_ticket_lines (ticket_folio, quantity, description, day_rate) VALUES ($1, $2, $3, $4);';
        for (const line of serviceLines) {
          await client.query(lineQuery, [generatedFolio, line.quantity, line.description, line.dayRate]);
        }
      }

      const deductions = { tp: 1 * unitMultiplier, bc: 0.5 * unitMultiplier, dp: 2 * unitMultiplier, hs: 0.25 * unitMultiplier, pt: 1 * unitMultiplier, tb: 3 * unitMultiplier };
      await client.query(`
        INSERT INTO consumables_usage_log (ticket_folio, toilet_paper_used, blue_chemical_used, deodorizer_pills_used, hand_soap_used, paper_towels_used, trash_bags_used)
        VALUES ($1, $2, $3, $4, $5, $6, $7);
      `, [generatedFolio, deductions.tp, deductions.bc, deductions.dp, deductions.hs, deductions.pt, deductions.tb]);

      await client.query(`
        UPDATE truck_consumables_inventory 
        SET toilet_paper = toilet_paper - $1, blue_chemical = blue_chemical + $2, deodorizer_pills = deodorizer_pills - $3, hand_soap = hand_soap - $4, paper_towels = paper_towels - $5, trash_bags = trash_bags - $6
        WHERE truck_id = $7;
      `, [deductions.tp, incomingWaste, deductions.dp, deductions.hs, deductions.pt, deductions.tb, truckId]);

      await client.query("INSERT INTO audit_queue (ticket_folio, submitted_by, status) VALUES ($1, $2, 'Pending');", [generatedFolio, technicianId]);

      await client.query('COMMIT');
      res.status(201).json({ success: true, folio: generatedFolio, message: 'Ticket routed to Admin Audit Inbox.' });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(error);
      res.status(500).json({ success: false, error: 'Database transaction failed.' });
    } finally {
      client.release();
    }
  },

  getPendingAuditQueue: async (req, res) => {
    try {
      const query = `
        SELECT st.folio, st.service_date, c.name as "customerName", c.mailing_address as "mailingAddress", c.city, c.state,
               lw.lease_name as "leaseName", lw.well_number as "wellNumber", lw.county, lw.specific_location as "specificLocation",
               st.customer_po_afe as "customerPoAfe", st.rig_name as "rigName", st.company_man as "companyMan",
               st.rig_phone as "rigPhone", st.rig_fax as "rigFax", st.chk_vacuum_waste as "chkVacuumWaste",
               st.chk_pressure_wash_blue_chemical as "chkPressureWashBlueChemical", st.chk_deep_wipe_trash_liner as "chkDeepWipeTrashLiner",
               st.chk_replenish_consumables as "chkReplenishConsumables", st.arrive_time_job_site as "arriveTimeJobSite",
               st.finish_time_job_site as "finishTimeJobSite", st.fuel_charges as "fuelCharges", st.sub_total as "subTotal",
               st.customer_signature as "customerSignature", st.technician_signature as "technicianSignature",
               json_agg(json_build_object('quantity', sl.quantity, 'description', sl.description, 'dayRate', sl.day_rate)) as "serviceLines"
        FROM service_tickets st
        JOIN customers c ON st.customer_id = c.id
        JOIN leases_wells lw ON st.lease_well_id = lw.id
        LEFT JOIN service_ticket_lines sl ON st.folio = sl.ticket_folio
        WHERE st.is_audited_and_approved = FALSE
        GROUP BY st.folio, c.name, c.mailing_address, c.city, c.state, lw.lease_name, lw.well_number, lw.county, lw.specific_location;
      `;
      const result = await pool.query(query);
      res.status(200).json(result.rows);
    } catch (error) {
      res.status(500).json({ error: 'Failed retrieving audit index arrays.' });
    }
  },

  approveTicket: async (req, res) => {
    const { folio } = req.params;
    try {
      await pool.query('UPDATE service_tickets SET is_audited_and_approved = TRUE, audited_at = CURRENT_TIMESTAMP WHERE folio = $1;', [folio]);
      res.status(200).json({ success: true, message: `Ticket ${folio} approved and locked.` });
    } catch (error) {
      res.status(500).json({ error: 'Database approval lock failure.' });
    }
  },

  getGeoOptimizedRoute: async (req, res) => {
    const { day, lat, lng } = req.query;
    try {
      const query = `
        SELECT stop_order, asset_id, asset_type, customer_name, lease_name, well_number, latitude, longitude, delivery_date, cleaning_counter
        FROM get_optimized_technician_route($1, $2, $3);
      `;
      const result = await pool.query(query, [day, parseFloat(lat), parseFloat(lng)]);
      res.status(200).json(result.rows);
    } catch (error) {
      res.status(500).json({ error: 'Spatial calculation engine crash.' });
    }
  }
};

module.exports = ticketController;
