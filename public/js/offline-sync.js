/**
 * Kolek-Ta Offline Queue System
 * Stores actions when offline, replays on reconnect.
 * Uses IndexedDB (via OfflineDB) with localStorage fallback.
 */
(function() {
  'use strict';

  var offlineQueue = {
    QUEUE_KEY: 'kolekta_offline_queue',

    getQueue: function() {
      try {
        return JSON.parse(localStorage.getItem(this.QUEUE_KEY) || '[]');
      } catch (e) {
        console.error('Error reading offline queue:', e);
        return [];
      }
    },

    addAction: async function(action) {
      var actionWithMeta = Object.assign({}, action, {
        queuedAt: new Date().toISOString(),
        id: 'offline_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      });

      if (typeof OfflineDB !== 'undefined') {
        try {
          await OfflineDB.queueCompletion(actionWithMeta);
          console.log('[OfflineSync] Queued to IndexedDB: ' + action.type);
          this.updateSyncIndicator();
          return;
        } catch (e) {
          console.warn('IndexedDB queue failed, falling back to localStorage:', e);
        }
      }

      var queue = this.getQueue();
      queue.push(actionWithMeta);
      localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
      this.updateSyncIndicator();
      console.log('[OfflineSync] Queued to localStorage: ' + action.type);
    },

    removeAction: function(actionId) {
      var queue = this.getQueue().filter(function(a) { return a.id !== actionId; });
      localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
      this.updateSyncIndicator();
    },

    clear: function() {
      localStorage.removeItem(this.QUEUE_KEY);
      this.updateSyncIndicator();
    },

    getPendingCount: async function() {
      var count = this.getQueue().length;

      if (typeof OfflineDB !== 'undefined') {
        try {
          var idbCount = await OfflineDB.getTotalPendingCount();
          count += idbCount;
        } catch (e) {
          console.warn('Could not get IndexedDB count:', e);
        }
      }

      return count;
    },

    updateSyncIndicator: async function() {
      var count = await this.getPendingCount();
      var indicator = document.getElementById('offlineSyncIndicator');
      var countBadge = document.getElementById('offlinePendingCount');

      if (indicator) {
        if (count > 0) {
          indicator.classList.remove('hidden');
          if (countBadge) countBadge.textContent = count;
        } else {
          indicator.classList.add('hidden');
        }
      }
    },

    processQueue: async function() {
      var queue = this.getQueue();
      if (queue.length > 0) {
        console.log('[OfflineSync] Processing ' + queue.length + ' offline actions from localStorage...');
        showToast('Syncing ' + queue.length + ' offline action(s)...', 'info');

        var token = localStorage.getItem('token');
        var successCount = 0;
        var failCount = 0;

        for (var i = 0; i < queue.length; i++) {
          var action = queue[i];
          try {
            var endpoint = '';
            var body = {};

            switch (action.type) {
              case 'STOP_COMPLETE':
                endpoint = App.API_URL + '/driver/stops/complete';
                body = {
                  routeId: action.routeId,
                  stopIndex: action.stopIndex,
                  stopName: action.stopName,
                  location: action.location,
                  gpsLocation: action.gpsLocation,
                  binsCollected: action.binsCollected || 1,
                  wasteType: action.wasteType || 'mixed'
                };
                break;

              case 'STOP_SKIP':
                endpoint = App.API_URL + '/driver/stops/skip';
                body = {
                  routeId: action.routeId,
                  stopIndex: action.stopIndex,
                  stopName: action.stopName,
                  location: action.location,
                  gpsLocation: action.gpsLocation,
                  skipReason: action.skipReason,
                  skipNotes: action.skipNotes,
                  skipPhoto: action.skipPhoto
                };
                break;

              case 'ROUTE_COMPLETE':
                endpoint = App.API_URL + '/completions';
                body = action.completionData;
                break;

              default:
                console.warn('[OfflineSync] Unknown action type: ' + action.type);
                continue;
            }

            var response = await fetchWithRetry(endpoint, {
              method: 'POST',
              headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(body)
            });

            if (response.ok) {
              this.removeAction(action.id);
              successCount++;
              console.log('[OfflineSync] Synced: ' + action.type + ' - ' + action.id);
            } else {
              failCount++;
              console.error('[OfflineSync] Failed to sync: ' + action.type, await response.text());
            }
          } catch (e) {
            failCount++;
            console.error('[OfflineSync] Error syncing action:', e);
          }
        }

        if (successCount > 0) {
          showToast('Synced ' + successCount + ' action(s) successfully!', 'success');
        }
        if (failCount > 0) {
          showToast(failCount + ' action(s) failed to sync. Will retry later.', 'warning');
        }
      }

      if (typeof SyncManager !== 'undefined') {
        SyncManager.syncAll();
      }

      this.updateSyncIndicator();
    }
  };

  // Online/offline event listeners
  window.addEventListener('online', function() {
    console.log('[OfflineSync] Back online!');
    showToast('Back online! Syncing data...', 'info');
    offlineQueue.processQueue();

    var offlineBadge = document.getElementById('offlineStatusBadge');
    if (offlineBadge) offlineBadge.classList.add('hidden');
  });

  window.addEventListener('offline', function() {
    console.log('[OfflineSync] Gone offline');
    showToast('You are offline. Data will be saved locally.', 'warning');

    var offlineBadge = document.getElementById('offlineStatusBadge');
    if (offlineBadge) offlineBadge.classList.remove('hidden');
  });

  // Check for pending offline actions on page load
  document.addEventListener('DOMContentLoaded', async function() {
    var pendingCount = await offlineQueue.getPendingCount();
    if (navigator.onLine && pendingCount > 0) {
      setTimeout(function() { offlineQueue.processQueue(); }, 2000);
    }
    offlineQueue.updateSyncIndicator();
  });

  window.offlineQueue = offlineQueue;

})();
