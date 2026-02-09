/**
 * Kolek-Ta IndexedDB Manager
 * Manages offline data storage for drivers
 */

const OfflineDB = {
  DB_NAME: 'KolektaOfflineDB',
  DB_VERSION: 1,
  db: null,

  // Store names
  STORES: {
    ROUTES: 'routes',
    TRUCKS: 'trucks',
    GPS_QUEUE: 'gps_queue',
    COMPLETIONS_QUEUE: 'completions_queue',
    USER_SESSION: 'user_session'
  },

  /**
   * Initialize the IndexedDB database
   */
  async init() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = (event) => {
        console.error('[OfflineDB] Error opening database:', event.target.error);
        reject(event.target.error);
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        console.log('[OfflineDB] Database opened successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        console.log('[OfflineDB] Upgrading database schema');
        const db = event.target.result;

        // Routes store
        if (!db.objectStoreNames.contains(this.STORES.ROUTES)) {
          const routesStore = db.createObjectStore(this.STORES.ROUTES, { keyPath: '_id' });
          routesStore.createIndex('routeId', 'routeId', { unique: false });
          routesStore.createIndex('assignedDriver', 'assignedDriver', { unique: false });
          routesStore.createIndex('status', 'status', { unique: false });
        }

        // Trucks store
        if (!db.objectStoreNames.contains(this.STORES.TRUCKS)) {
          const trucksStore = db.createObjectStore(this.STORES.TRUCKS, { keyPath: '_id' });
          trucksStore.createIndex('truckId', 'truckId', { unique: false });
          trucksStore.createIndex('assignedDriver', 'assignedDriver', { unique: false });
        }

        // GPS queue store
        if (!db.objectStoreNames.contains(this.STORES.GPS_QUEUE)) {
          const gpsStore = db.createObjectStore(this.STORES.GPS_QUEUE, {
            keyPath: 'id',
            autoIncrement: true
          });
          gpsStore.createIndex('synced', 'synced', { unique: false });
          gpsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Completions queue store
        if (!db.objectStoreNames.contains(this.STORES.COMPLETIONS_QUEUE)) {
          const completionsStore = db.createObjectStore(this.STORES.COMPLETIONS_QUEUE, {
            keyPath: 'id',
            autoIncrement: true
          });
          completionsStore.createIndex('routeId', 'routeId', { unique: false });
          completionsStore.createIndex('synced', 'synced', { unique: false });
        }

        // User session store
        if (!db.objectStoreNames.contains(this.STORES.USER_SESSION)) {
          db.createObjectStore(this.STORES.USER_SESSION, { keyPath: 'username' });
        }

        console.log('[OfflineDB] Schema upgrade complete');
      };
    });
  },

  /**
   * Get database instance
   */
  async getDB() {
    if (!this.db) {
      await this.init();
    }
    return this.db;
  },

  // ==========================================
  // ROUTES OPERATIONS
  // ==========================================

  /**
   * Save routes to IndexedDB.
   * Uses put() to upsert each route, then removes stale entries.
   * This avoids the clear-then-write pattern that risks data loss.
   */
  async saveRoutes(routes) {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORES.ROUTES], 'readwrite');
      const store = transaction.objectStore(this.STORES.ROUTES);

      const newIds = new Set();

      // Upsert new routes
      routes.forEach(route => {
        const id = route._id || route.routeId;
        if (!id) return; // Skip routes without a valid key
        newIds.add(id);
        const routeToSave = {
          ...route,
          _id: id,
          cachedAt: new Date().toISOString()
        };
        store.put(routeToSave);
      });

      // Remove stale routes not in the new set
      const getAllRequest = store.getAllKeys();
      getAllRequest.onsuccess = () => {
        const existingKeys = getAllRequest.result;
        existingKeys.forEach(key => {
          if (!newIds.has(key)) {
            store.delete(key);
          }
        });
      };

      transaction.oncomplete = () => {
        console.log(`[OfflineDB] Saved ${routes.length} routes`);
        resolve();
      };

      transaction.onerror = (event) => {
        console.error('[OfflineDB] Error saving routes:', event.target.error);
        reject(event.target.error);
      };
    });
  },

  /**
   * Get all routes from IndexedDB
   */
  async getRoutes() {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORES.ROUTES], 'readonly');
      const store = transaction.objectStore(this.STORES.ROUTES);
      const request = store.getAll();

      request.onsuccess = () => {
        console.log(`[OfflineDB] Retrieved ${request.result.length} routes`);
        resolve(request.result);
      };

      request.onerror = (event) => {
        console.error('[OfflineDB] Error getting routes:', event.target.error);
        reject(event.target.error);
      };
    });
  },

  /**
   * Get routes for a specific driver
   */
  async getDriverRoutes(driverUsername) {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORES.ROUTES], 'readonly');
      const store = transaction.objectStore(this.STORES.ROUTES);
      const index = store.index('assignedDriver');
      const request = index.getAll(driverUsername);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  },

  /**
   * Get a single route by ID
   */
  async getRoute(routeId) {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORES.ROUTES], 'readonly');
      const store = transaction.objectStore(this.STORES.ROUTES);
      const request = store.get(routeId);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  },

  // ==========================================
  // TRUCKS OPERATIONS
  // ==========================================

  /**
   * Save trucks to IndexedDB.
   * Uses put() to upsert each truck, then removes stale entries.
   */
  async saveTrucks(trucks) {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORES.TRUCKS], 'readwrite');
      const store = transaction.objectStore(this.STORES.TRUCKS);

      const newIds = new Set();

      // Upsert new trucks
      trucks.forEach(truck => {
        const id = truck._id || truck.truckId;
        if (!id) return; // Skip trucks without a valid key
        newIds.add(id);
        const truckToSave = {
          ...truck,
          _id: id,
          cachedAt: new Date().toISOString()
        };
        store.put(truckToSave);
      });

      // Remove stale trucks not in the new set
      const getAllRequest = store.getAllKeys();
      getAllRequest.onsuccess = () => {
        const existingKeys = getAllRequest.result;
        existingKeys.forEach(key => {
          if (!newIds.has(key)) {
            store.delete(key);
          }
        });
      };

      transaction.oncomplete = () => {
        console.log(`[OfflineDB] Saved ${trucks.length} trucks`);
        resolve();
      };

      transaction.onerror = (event) => {
        console.error('[OfflineDB] Error saving trucks:', event.target.error);
        reject(event.target.error);
      };
    });
  },

  /**
   * Get all trucks from IndexedDB
   */
  async getTrucks() {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORES.TRUCKS], 'readonly');
      const store = transaction.objectStore(this.STORES.TRUCKS);
      const request = store.getAll();

      request.onsuccess = () => {
        console.log(`[OfflineDB] Retrieved ${request.result.length} trucks`);
        resolve(request.result);
      };

      request.onerror = (event) => {
        console.error('[OfflineDB] Error getting trucks:', event.target.error);
        reject(event.target.error);
      };
    });
  },

  /**
   * Get trucks for a specific driver
   */
  async getDriverTrucks(driverUsername) {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORES.TRUCKS], 'readonly');
      const store = transaction.objectStore(this.STORES.TRUCKS);
      const index = store.index('assignedDriver');
      const request = index.getAll(driverUsername);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  },

  // ==========================================
  // GPS QUEUE OPERATIONS
  // ==========================================

  /**
   * Add a GPS point to the offline queue
   */
  async queueGPSPoint(gpsData) {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORES.GPS_QUEUE], 'readwrite');
      const store = transaction.objectStore(this.STORES.GPS_QUEUE);

      const point = {
        ...gpsData,
        timestamp: new Date().toISOString(),
        synced: 0
      };

      const request = store.add(point);

      request.onsuccess = () => {
        console.log('[OfflineDB] GPS point queued:', point.lat, point.lng);
        resolve(request.result);
      };

      request.onerror = (event) => {
        console.error('[OfflineDB] Error queuing GPS point:', event.target.error);
        reject(event.target.error);
      };
    });
  },

  /**
   * Get all unsynced GPS points
   */
  async getUnsyncedGPSPoints() {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORES.GPS_QUEUE], 'readonly');
      const store = transaction.objectStore(this.STORES.GPS_QUEUE);
      const index = store.index('synced');
      const request = index.getAll(IDBKeyRange.only(0));

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  },

  /**
   * Mark GPS points as synced
   */
  async markGPSPointsSynced(ids) {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORES.GPS_QUEUE], 'readwrite');
      const store = transaction.objectStore(this.STORES.GPS_QUEUE);

      ids.forEach(id => {
        store.delete(id);
      });

      transaction.oncomplete = () => {
        console.log(`[OfflineDB] Removed ${ids.length} synced GPS points`);
        resolve();
      };

      transaction.onerror = (event) => {
        reject(event.target.error);
      };
    });
  },

  /**
   * Get GPS queue count
   */
  async getGPSQueueCount() {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORES.GPS_QUEUE], 'readonly');
      const store = transaction.objectStore(this.STORES.GPS_QUEUE);
      const request = store.count();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  },

  /**
   * Clear all GPS queue
   */
  async clearGPSQueue() {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORES.GPS_QUEUE], 'readwrite');
      const store = transaction.objectStore(this.STORES.GPS_QUEUE);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('[OfflineDB] GPS queue cleared');
        resolve();
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  },

  // ==========================================
  // COMPLETIONS QUEUE OPERATIONS
  // ==========================================

  /**
   * Queue a route completion or stop action
   */
  async queueCompletion(completionData) {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORES.COMPLETIONS_QUEUE], 'readwrite');
      const store = transaction.objectStore(this.STORES.COMPLETIONS_QUEUE);

      const item = {
        ...completionData,
        queuedAt: new Date().toISOString(),
        synced: 0
      };

      const request = store.add(item);

      request.onsuccess = () => {
        console.log('[OfflineDB] Completion queued:', completionData.type);
        resolve(request.result);
      };

      request.onerror = (event) => {
        console.error('[OfflineDB] Error queuing completion:', event.target.error);
        reject(event.target.error);
      };
    });
  },

  /**
   * Get all unsynced completions
   */
  async getUnsyncedCompletions() {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORES.COMPLETIONS_QUEUE], 'readonly');
      const store = transaction.objectStore(this.STORES.COMPLETIONS_QUEUE);
      const index = store.index('synced');
      const request = index.getAll(IDBKeyRange.only(0));

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  },

  /**
   * Remove synced completions
   */
  async removeCompletions(ids) {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORES.COMPLETIONS_QUEUE], 'readwrite');
      const store = transaction.objectStore(this.STORES.COMPLETIONS_QUEUE);

      ids.forEach(id => {
        store.delete(id);
      });

      transaction.oncomplete = () => {
        console.log(`[OfflineDB] Removed ${ids.length} synced completions`);
        resolve();
      };

      transaction.onerror = (event) => {
        reject(event.target.error);
      };
    });
  },

  /**
   * Get completions queue count
   */
  async getCompletionsQueueCount() {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORES.COMPLETIONS_QUEUE], 'readonly');
      const store = transaction.objectStore(this.STORES.COMPLETIONS_QUEUE);
      const request = store.count();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  },

  // ==========================================
  // USER SESSION OPERATIONS
  // ==========================================

  /**
   * Save user session for offline access
   */
  async saveUserSession(userData) {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORES.USER_SESSION], 'readwrite');
      const store = transaction.objectStore(this.STORES.USER_SESSION);

      const session = {
        ...userData,
        cachedAt: new Date().toISOString()
      };

      const request = store.put(session);

      request.onsuccess = () => {
        console.log('[OfflineDB] User session saved');
        resolve();
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  },

  /**
   * Get cached user session
   */
  async getUserSession(username) {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORES.USER_SESSION], 'readonly');
      const store = transaction.objectStore(this.STORES.USER_SESSION);
      const request = store.get(username);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  },

  /**
   * Clear user session
   */
  async clearUserSession() {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORES.USER_SESSION], 'readwrite');
      const store = transaction.objectStore(this.STORES.USER_SESSION);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('[OfflineDB] User session cleared');
        resolve();
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  },

  // ==========================================
  // UTILITY OPERATIONS
  // ==========================================

  /**
   * Get total pending sync count
   */
  async getTotalPendingCount() {
    const [gpsCount, completionsCount] = await Promise.all([
      this.getGPSQueueCount(),
      this.getCompletionsQueueCount()
    ]);
    return gpsCount + completionsCount;
  },

  /**
   * Clear all offline data
   */
  async clearAll() {
    const db = await this.getDB();
    const storeNames = Object.values(this.STORES);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeNames, 'readwrite');

      storeNames.forEach(storeName => {
        transaction.objectStore(storeName).clear();
      });

      transaction.oncomplete = () => {
        console.log('[OfflineDB] All data cleared');
        resolve();
      };

      transaction.onerror = (event) => {
        reject(event.target.error);
      };
    });
  },

  /**
   * Get database statistics
   */
  async getStats() {
    const [routes, trucks, gpsCount, completionsCount] = await Promise.all([
      this.getRoutes(),
      this.getTrucks(),
      this.getGPSQueueCount(),
      this.getCompletionsQueueCount()
    ]);

    return {
      routesCount: routes.length,
      trucksCount: trucks.length,
      gpsQueueCount: gpsCount,
      completionsQueueCount: completionsCount,
      totalPending: gpsCount + completionsCount
    };
  }
};

// Initialize on load
if (typeof window !== 'undefined') {
  OfflineDB.init().catch(err => {
    console.error('[OfflineDB] Failed to initialize:', err);
  });
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OfflineDB;
}
