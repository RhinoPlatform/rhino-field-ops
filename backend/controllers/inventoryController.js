const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const inventoryController = {
  getTruckStock: async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM truck_consumables_inventory WHERE truck_id = $1;', [req.user.id]);
      if (result.rows.length === 0) {
        return res.status(200).json({ success: true, inventory: { toilet_paper: 50, blue_chemical: 0, deodorizer_pills: 100, hand_soap: 50, paper_towels: 100, trash_bags: 200 } });
      }
      res.status(200).json({ success: true, inventory: result.rows[0] });
    } catch (error) {
      res.status(500).json({ error: 'Failed logging current vehicle matrix balance.' });
    }
  },

  restockTruck: async (req, res) => {
    const { truckId, toiletPaper, blueChemical, deodorizerPills, handSoap, paperTowels, trashBags } = req.body;
    try {
      const query = `
        INSERT INTO truck_consumables_inventory (truck_id, toilet_paper, blue_chemical, deodorizer_pills, hand_soap, paper_towels, trash_bags)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (truck_id) DO UPDATE SET
          toilet_paper = truck_consumables_inventory.toilet_paper + EXCLUDED.toilet_paper,
          deodorizer_pills = truck_consumables_inventory.deodorizer_pills + EXCLUDED.deodorizer_pills,
          trash_bags = truck_consumables_inventory.trash_bags + EXCLUDED.trash_bags,
          last_restocked_at = CURRENT_TIMESTAMP
        RETURNING *;
      `;
      const result = await pool.query(query, [truckId, toiletPaper, blueChemical, deodorizerPills, handSoap, paperTowels, trashBags]);
      res.status(200).json({ success: true, stock: result.rows[0] });
    } catch (error) {
      res.status(500).json({ error: 'Stock update transaction crash.' });
    }
  }
};

module.exports = inventoryController;
