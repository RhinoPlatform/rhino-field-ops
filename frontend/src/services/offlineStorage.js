import { openDB } from 'idb';

const DB_NAME = 'RhinoFieldOpsCache';
const STORE_NAME = 'outbound_tickets_queue';

const dbPromise = openDB(DB_NAME, 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME, { keyPath: 'localId', autoIncrement: true });
    }
  },
});

export const OfflineStorage = {
  queueTicket: async (ticketPayload) => {
    const db = await dbPromise;
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const id = await store.add({
      ...ticketPayload,
      queuedAt: new Date().toISOString()
    });
    await tx.done;

    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('rhino-sync-tickets');
    }
    return id;
  }
};
