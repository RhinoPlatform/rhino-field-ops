import { openDB } from 'https://unpkg.com';

const DB_NAME = 'RhinoFieldOpsCache';
const STORE_NAME = 'outbound_tickets_queue';

self.addEventListener('sync', (event) => {
  if (event.tag === 'rhino-sync-tickets') {
    event.waitUntil(flushOfflineTicketQueue());
  }
});

async function flushOfflineTicketQueue() {
  const db = await openDB(DB_NAME, 1);
  const queuedTickets = await db.getAll(STORE_NAME);
  
  if (queuedTickets.length === 0) return;

  const API_URL = 'https://rhino-field-ops.com';

  for (const ticket of queuedTickets) {
    try {
      const { localId, queuedAt, syncAttempts, tokenContext, ...cleanPayload } = ticket;
      cleanPayload.isOfflineSync = true; 

      const response = await fetch(`${API_URL}/api/tickets`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenContext || ''}`
        },
        body: JSON.stringify(cleanPayload)
      });

      if (response.ok) {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        await tx.objectStore(STORE_NAME).delete(ticket.localId);
        await tx.done;
        console.log(`[PWA Sync] Dequeued record reference ID: ${ticket.localId}`);
      } else {
        break;
      }
    } catch (networkError) {
      console.error('[PWA Sync] Network target gateway unreachable.', networkError);
      break; 
    }
  }
}
