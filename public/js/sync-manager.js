/**
 * Kolek-Ta Sync Manager
 * Handles synchronization of offline data when connection is restored
 */

const SyncManager = {
  API_URL: '/api',
  isSyncing: false,
  lastSyncTime: null,
  syncInterval: null,

  /**
   * Initialize the sync manager
   */
  init() {
    console.log('[SyncManager] Initializing');

    // Listen for online/offline events
    window.addEventListener('online', () => this.onOnline());
    window.addEventListener('offline', () => this.onOffline());

    // Listen for Service Worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'SYNC_GPS_QUEUE') {
          this.syncGPSQueue();
        }
        if (event.data.type === 'SYNC_COMPLETIONS_QUEUE') {
          this.syncCompletionsQueue();
        }
      });
    }

    // Check for pending sync on init
    this.updateSyncIndicator();

    // Start periodic sync check when online
    if (navigator.onLine) {
      this.startPeriodicSync();
    }

    console.log('[SyncManager] Initialized');
  },

  /**
   * Handle coming back online
   * Note: Sync is triggered by offlineQueue.processQueue() in app.js
   * to avoid duplicate sync calls. SyncManager only handles periodic sync
   * and Service Worker-triggered sync here.
   */
  async onOnline() {
    console.log('[SyncManager] Back online');
    // Do NOT call syncAll() here - app.js offlineQueue.processQueue() handles it
    this.startPeriodicSync();
  },

  /**
   * Handle going offline
   */
  onOffline() {
    console.log('[SyncManager] Gone offline');
    this.stopPeriodicSync();
    this.updateOfflineIndicator(true);
  },

  /**
   * Start periodic sync every 30 seconds
   */
  startPeriodicSync() {
    if (this.syncInterval) return;

    this.syncInterval = setInterval(() => {
      if (navigator.onLine) {
        this.syncAll();
      }
    }, 30000); // Every 30 seconds
  },

  /**
   * Stop periodic sync
   */
  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  },

  /**
   * Sync all queued data
   */
  async syncAll() {
    if (this.isSyncing) {
      console.log('[SyncManager] Sync already in progress');
      return;
    }

    if (!navigator.onLine) {
      console.log('[SyncManager] Offline - skipping sync');
      return;
    }

    this.isSyncing = true;
    console.log('[SyncManager] Starting full sync');

    try {
      // Sync GPS points first (batch)
      await this.syncGPSQueue();

      // Then sync completions
      await this.syncCompletionsQueue();

      this.lastSyncTime = new Date();
      this.updateSyncIndicator();

      console.log('[SyncManager] Full sync complete');
    } catch (error) {
      console.error('[SyncManager] Sync error:', error);
    } finally {
      this.isSyncing = false;
    }
  },

  /**
   * Sync queued GPS points using batch endpoint.
   * Sends in chunks of up to 1000 to match server limit.
   * Only removes points that were successfully processed.
   */
  async syncGPSQueue() {
    if (typeof OfflineDB === 'undefined') {
      console.warn('[SyncManager] OfflineDB not available');
      return;
    }

    try {
      const unsyncedPoints = await OfflineDB.getUnsyncedGPSPoints();

      if (unsyncedPoints.length === 0) {
        console.log('[SyncManager] No GPS points to sync');
        return;
      }

      console.log(`[SyncManager] Syncing ${unsyncedPoints.length} GPS points`);

      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('[SyncManager] No auth token, skipping GPS sync');
        return;
      }

      // Send in chunks to respect server batch size limit
      const CHUNK_SIZE = 1000;
      let totalProcessed = 0;
      let totalFailed = 0;

      for (let i = 0; i < unsyncedPoints.length; i += CHUNK_SIZE) {
        const chunk = unsyncedPoints.slice(i, i + CHUNK_SIZE);

        const response = await fetch(`${this.API_URL}/tracking/batch-update`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            points: chunk.map(p => ({
              lat: p.lat,
              lng: p.lng,
              speed: p.speed || 0,
              heading: p.heading || 0,
              routeId: p.routeId || null,
              timestamp: p.timestamp
            }))
          })
        });

        if (response.ok) {
          const result = await response.json();
          totalProcessed += result.processed;
          totalFailed += result.failed;

          // Only remove points that were successfully processed
          // Remove from the front of the chunk (sorted by timestamp)
          const processedCount = result.processed;
          const idsToRemove = chunk.slice(0, processedCount).map(p => p.id);
          if (idsToRemove.length > 0) {
            await OfflineDB.markGPSPointsSynced(idsToRemove);
          }
        } else {
          const error = await response.text();
          console.error('[SyncManager] GPS batch sync failed:', error);
          break;
        }
      }

      if (totalProcessed > 0 && typeof showToast === 'function') {
        showToast(`Synced ${totalProcessed} GPS points`, 'success');
      }
      if (totalFailed > 0) {
        console.warn(`[SyncManager] ${totalFailed} GPS points failed to process, kept in queue`);
      }
    } catch (error) {
      console.error('[SyncManager] Error syncing GPS queue:', error);
    }
  },

  /**
   * Sync queued completions (stops, route completions)
   */
  async syncCompletionsQueue() {
    if (typeof OfflineDB === 'undefined') {
      console.warn('[SyncManager] OfflineDB not available');
      return;
    }

    try {
      const unsyncedItems = await OfflineDB.getUnsyncedCompletions();

      if (unsyncedItems.length === 0) {
        console.log('[SyncManager] No completions to sync');
        return;
      }

      console.log(`[SyncManager] Syncing ${unsyncedItems.length} completion actions`);

      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('[SyncManager] No auth token, skipping completions sync');
        return;
      }

      const syncedIds = [];
      let successCount = 0;
      let failCount = 0;

      for (const item of unsyncedItems) {
        try {
          let endpoint = '';
          let body = {};

          switch (item.type) {
            case 'STOP_COMPLETE':
              endpoint = `${this.API_URL}/driver/stops/complete`;
              body = {
                routeId: item.routeId,
                stopIndex: item.stopIndex,
                stopName: item.stopName,
                location: item.location,
                gpsLocation: item.gpsLocation,
                binsCollected: item.binsCollected || 1,
                wasteType: item.wasteType || 'mixed'
              };
              break;

            case 'STOP_SKIP':
              endpoint = `${this.API_URL}/driver/stops/skip`;
              body = {
                routeId: item.routeId,
                stopIndex: item.stopIndex,
                stopName: item.stopName,
                location: item.location,
                gpsLocation: item.gpsLocation,
                skipReason: item.skipReason,
                skipNotes: item.skipNotes,
                skipPhoto: item.skipPhoto
              };
              break;

            case 'ROUTE_COMPLETE':
              endpoint = `${this.API_URL}/completions`;
              body = item.completionData;
              break;

            default:
              console.warn(`[SyncManager] Unknown action type: ${item.type}`);
              continue;
          }

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
          });

          if (response.ok) {
            syncedIds.push(item.id);
            successCount++;
            console.log(`[SyncManager] Synced: ${item.type}`);
          } else {
            failCount++;
            console.error(`[SyncManager] Failed to sync: ${item.type}`, await response.text());
          }
        } catch (error) {
          failCount++;
          console.error(`[SyncManager] Error syncing item:`, error);
        }
      }

      // Remove successfully synced items
      if (syncedIds.length > 0) {
        await OfflineDB.removeCompletions(syncedIds);
      }

      if (successCount > 0 && typeof showToast === 'function') {
        showToast(`Synced ${successCount} action(s)`, 'success');
      }

      if (failCount > 0 && typeof showToast === 'function') {
        showToast(`${failCount} action(s) failed to sync`, 'warning');
      }

    } catch (error) {
      console.error('[SyncManager] Error syncing completions queue:', error);
    }
  },

  /**
   * Update the sync indicator in the UI
   */
  async updateSyncIndicator() {
    if (typeof OfflineDB === 'undefined') return;

    try {
      const pendingCount = await OfflineDB.getTotalPendingCount();
      const indicator = document.getElementById('offlineSyncIndicator');
      const countBadge = document.getElementById('offlinePendingCount');

      if (indicator) {
        if (pendingCount > 0) {
          indicator.classList.remove('hidden');
          if (countBadge) countBadge.textContent = pendingCount;
        } else {
          indicator.classList.add('hidden');
        }
      }
    } catch (error) {
      console.error('[SyncManager] Error updating sync indicator:', error);
    }
  },

  /**
   * Update offline status indicator
   */
  updateOfflineIndicator(isOffline) {
    const offlineBadge = document.getElementById('offlineStatusBadge');

    if (offlineBadge) {
      if (isOffline) {
        offlineBadge.classList.remove('hidden');
      } else {
        offlineBadge.classList.add('hidden');
      }
    }
  },

  /**
   * Request background sync (if supported)
   */
  async requestBackgroundSync(tag = 'sync-all') {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register(tag);
        console.log(`[SyncManager] Background sync registered: ${tag}`);
      } catch (error) {
        console.warn('[SyncManager] Background sync not supported:', error);
      }
    }
  },

  /**
   * Get sync status
   */
  async getStatus() {
    if (typeof OfflineDB === 'undefined') {
      return { available: false };
    }

    const stats = await OfflineDB.getStats();

    return {
      available: true,
      isOnline: navigator.onLine,
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      pendingGPS: stats.gpsQueueCount,
      pendingCompletions: stats.completionsQueueCount,
      totalPending: stats.totalPending,
      cachedRoutes: stats.routesCount,
      cachedTrucks: stats.trucksCount
    };
  },

  /**
   * Force sync now
   */
  async forceSyncNow() {
    if (!navigator.onLine) {
      if (typeof showToast === 'function') {
        showToast('Cannot sync while offline', 'warning');
      }
      return false;
    }

    await this.syncAll();
    return true;
  }
};

// Initialize on load
if (typeof window !== 'undefined') {
  // Wait for OfflineDB to be available
  if (typeof OfflineDB !== 'undefined') {
    SyncManager.init();
  } else {
    // Wait for OfflineDB to load
    window.addEventListener('load', () => {
      setTimeout(() => SyncManager.init(), 500);
    });
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SyncManager;
}
