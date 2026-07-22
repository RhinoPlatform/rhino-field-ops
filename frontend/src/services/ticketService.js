import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://rhino-field-ops.com';

export const ticketService = {
  submitFieldTicket: async (ticketMetadata, telemetryState, consumablesUsed, isOfflineSync = false) => {
    const payload = {
      customerId: ticketMetadata.customerId,
      leaseWellId: ticketMetadata.leaseWellId,
      assetId: ticketMetadata.assetId,
      technicianId: ticketMetadata.technicianId,
      truckId: ticketMetadata.truckId,
      customerPoAfe: ticketMetadata.poNumber || null,
      rigName: ticketMetadata.rigName || '',
      companyMan: ticketMetadata.companyMan || '',
      rigPhone: ticketMetadata.rigPhone || null,
      rigFax: ticketMetadata.rigFax || null,
      chkVacuumWaste: ticketMetadata.checklist.vacuumWaste,
      chkPressureWashBlueChemical: ticketMetadata.checklist.washChemical,
      chkDeepWipeTrashLiner: ticketMetadata.checklist.wipeTrash,
      chkReplenishConsumables: ticketMetadata.checklist.replenish,
      usageTier: ticketMetadata.usageTier,
      personnelCount: ticketMetadata.personnelCount || null,
      daysSinceLastService: ticketMetadata.daysSinceLastService || null,
      arriveTime: ticketMetadata.timestamps.arrival,
      finishTime: ticketMetadata.timestamps.finish,
      travelTime_duration: ticketMetadata.timestamps.travelDuration,
      travelEndTime: ticketMetadata.timestamps.travelEnd,
      fuelCharges: ticketMetadata.fuelCharges || 0.00,
      subTotal: ticketMetadata.calculatedSubTotal,
      serviceLines: ticketMetadata.itemsMatrix,
      consumablesUsed,
      isOfflineSync
    };

    try {
      const token = localStorage.getItem('rhino_token');
      const response = await axios.post(`${API_URL}/api/tickets`, payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 423) {
        throw new Error(error.response.data.error || 'CRITICAL_LOCKOUT: Capacity exceeded.');
      }
      if (error.response?.status === 403) {
        throw new Error('Security Exclusion: Identity validation rule violation.');
      }
      throw new Error('NETWORK_DISCONNECTED');
    }
  },

  getOptimizedRoute: async (targetDay, latitude, longitude) => {
    const token = localStorage.getItem('rhino_token');
    const response = await axios.get(`${API_URL}/api/tickets/optimized-route`, {
      params: { day: targetDay, lat: latitude, lng: longitude },
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  }
};
