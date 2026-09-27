import { openDB } from 'idb';

const DB_NAME = 'resqteam_offline_db';
const DB_VERSION = 1;

export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Offline SOS Queue store for store-and-forward syncing
      if (!db.objectStoreNames.contains('sos_queue')) {
        const store = db.createObjectStore('sos_queue', { keyPath: 'clientRequestId' });
        store.createIndex('synced', 'synced');
        store.createIndex('offlineCreatedAt', 'offlineCreatedAt');
      }

      // Offline incident cache store
      if (!db.objectStoreNames.contains('incidents_cache')) {
        db.createObjectStore('incidents_cache', { keyPath: '_id' });
      }

      // App metadata store (last sync time, responder contacts)
      if (!db.objectStoreNames.contains('app_meta')) {
        db.createObjectStore('app_meta', { keyPath: 'key' });
      }
    },
  });
};

/**
 * Save SOS distress signal into IndexedDB while device has no connection
 */
export const saveSOSToIndexedDB = async (sosPayload) => {
  const db = await initDB();
  const record = {
    ...sosPayload,
    synced: false,
    offlineCreatedAt: sosPayload.offlineCreatedAt || new Date().toISOString(),
  };

  await db.put('sos_queue', record);
  console.log(`[IndexedDB] Cached distress signal offline: ${record.clientRequestId}`);
  return record;
};

/**
 * Get all queued SOS signals waiting to be synced to the server
 */
export const getPendingSOSFromDB = async () => {
  const db = await initDB();
  const allInQueue = await db.getAll('sos_queue');
  return allInQueue.filter((item) => !item.synced);
};

/**
 * Remove or mark records as synced once the server acknowledges bulk ingestion
 */
export const markSOSAsSynced = async (clientRequestIds) => {
  if (!clientRequestIds || clientRequestIds.length === 0) return;
  const db = await initDB();
  const tx = db.transaction('sos_queue', 'readwrite');
  
  for (const id of clientRequestIds) {
    await tx.store.delete(id);
  }
  await tx.done;
  console.log(`[IndexedDB] Cleaned up ${clientRequestIds.length} synced signals from local queue.`);
};

/**
 * Get total number of requests waiting in the offline queue
 */
export const getOfflineQueueCount = async () => {
  try {
    const db = await initDB();
    const all = await db.getAll('sos_queue');
    return all.filter((r) => !r.synced).length;
  } catch (err) {
    console.warn('[IndexedDB] Error checking queue count:', err);
    return 0;
  }
};

/**
 * Cache incidents retrieved from server for offline viewing
 */
export const cacheIncidentsLocally = async (incidents) => {
  if (!Array.isArray(incidents)) return;
  try {
    const db = await initDB();
    const tx = db.transaction('incidents_cache', 'readwrite');
    for (const inc of incidents) {
      if (inc._id) {
        await tx.store.put(inc);
      }
    }
    await tx.done;
  } catch (err) {
    console.warn('[IndexedDB] Cache incidents error:', err);
  }
};

/**
 * Retrieve cached incidents for offline map view
 */
export const getCachedIncidents = async () => {
  try {
    const db = await initDB();
    return await db.getAll('incidents_cache');
  } catch {
    return [];
  }
};
