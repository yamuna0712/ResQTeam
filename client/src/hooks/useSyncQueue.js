import { useState, useEffect, useCallback } from 'react';
import { getPendingSOSFromDB, markSOSAsSynced, getOfflineQueueCount } from '../db/indexedDB.js';
import { syncBulkSOS } from '../services/api.js';

export const useSyncQueue = (isOnline, onSyncSuccess) => {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState(null);

  const refreshCount = useCallback(async () => {
    const count = await getOfflineQueueCount();
    setPendingCount(count);
  }, []);

  // Poll local queue count periodically & whenever component mounts
  useEffect(() => {
    refreshCount();
    const interval = setInterval(refreshCount, 2500);
    return () => clearInterval(interval);
  }, [refreshCount]);

  // Flush and synchronize all offline queued requests to the backend
  const flushQueue = useCallback(async () => {
    if (isSyncing || !isOnline) return;

    try {
      const pending = await getPendingSOSFromDB();
      if (pending.length === 0) {
        setPendingCount(0);
        return;
      }

      setIsSyncing(true);
      console.log(`[Store-and-Forward] Signal restored! Initiating bulk sync of ${pending.length} distress requests...`);

      const result = await syncBulkSOS(pending);

      if (result.success) {
        const syncedIds = pending.map((item) => item.clientRequestId);
        await markSOSAsSynced(syncedIds);
        await refreshCount();

        setLastSyncResult({
          timestamp: new Date(),
          count: pending.length,
          stats: result.stats,
        });

        console.log(`[Store-and-Forward] Successfully bulk-synced ${pending.length} requests.`);
        if (onSyncSuccess) {
          onSyncSuccess(result);
        }
      }
    } catch (err) {
      console.error('[Store-and-Forward] Bulk sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, refreshCount, onSyncSuccess]);

  // Auto-sync the exact millisecond connection is restored
  useEffect(() => {
    if (isOnline) {
      flushQueue();
    }
  }, [isOnline, flushQueue]);

  return {
    pendingCount,
    isSyncing,
    lastSyncResult,
    triggerSyncNow: flushQueue,
    refreshCount,
  };
};
