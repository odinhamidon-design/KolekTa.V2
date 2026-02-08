# App.js Modularization Design

**Date**: 2026-02-09
**Status**: Approved
**Scope**: Split 15,260-line monolithic `public/app.js` into 17 focused modules

---

## Problem

`public/app.js` is a 15,260-line monolithic file containing ALL dashboard logic:
- 183+ functions across 14+ domains (users, trucks, routes, GPS, fuel, complaints, etc.)
- 40+ global `let`/`const` variables with no centralized state
- Impossible to unit test (no module exports, all globals)
- Hard to navigate, maintain, and extend
- Load-order dependent with no explicit dependency management

## Solution

Split into **17 IIFE modules** loaded via `<script>` tags. No build tooling required — keeps the existing vanilla JS approach. A shared `window.App` namespace replaces scattered globals.

---

## Module Structure

### Core Layer (must load first, in order)

| # | File | Lines | Responsibility |
|---|------|-------|---------------|
| 1 | `js/app-state.js` | ~60 | `window.App` namespace, shared state, API_URL, auth tokens |
| 2 | `js/utils.js` | ~300 | escapeHtml, showToast, showAlertModal, showConfirmModal, showPageLoading, showModal/closeModal, showPage/closePage, getTimeAgo |
| 3 | `js/table-utils.js` | ~350 | sortData, filterData, toggleSort, createSortableHeader, createSearchInput, handleSearch, clearSearch, all filter handlers |
| 4 | `js/offline-sync.js` | ~200 | offlineQueue object, window online/offline event listeners |
| 5 | `js/auth.js` | ~150 | initializeApp, logout, loadHeaderProfilePicture, sidebar button listeners |
| 6 | `js/map-core.js` | ~250 | Leaflet map init, MATI_CENTER/MATI_BOUNDS, tile layer, loadBins, displayBins, showMapView/showPageContent, map loading overlay |

### Feature Modules (order doesn't matter between them)

| # | File | Lines | Responsibility |
|---|------|-------|---------------|
| 7 | `js/gps-tracking.js` | ~1200 | startGPSTracking, stopGPSTracking, updateTruckMarker, snapToRoad, animateTruckAlongPath, drawNavigationLine, drawAssignedRouteLine, drawRouteVisualization, clearRouteVisualization, updateETAPanel, updateLocationOnServer, fetchTripData, startTripDataPolling |
| 8 | `js/driver-dashboard.js` | ~1500 | updateDriverQuickStats, showVehicleInspection, submitInspection, showDriverStats, reportIncident, initDriverNotifications, showDriverNotifications, showDriverPerformance, initMobileDriverNav, loadMobileDriverData, loadDriverAssignments, driver overlay/mobile sync |
| 9 | `js/driver-routes.js` | ~500 | showActiveRouteNavigation, showNavigationPanel, markStopCompleted, skipStop, closeNavigationPanel, viewDriverRoute, startCollection, stopCollection, markRouteComplete |
| 10 | `js/admin-users.js` | ~450 | showUserManagement, renderUserTable, showAddUserForm, editUser, deleteUser |
| 11 | `js/admin-trucks.js` | ~600 | showTruckManagement, renderTruckTable, showAddTruckForm, editTruck, assignDriver, unassignTruck, deleteTruck |
| 12 | `js/admin-routes.js` | ~1400 | showRoutesManagement, renderRoutesTable, showAddRouteForm, openMapPicker, drawRoadPath, viewRoute, showRouteInfoPanel, deleteRoute, assignRouteToDriver, createScheduleFromRoute |
| 13 | `js/admin-fuel.js` | ~600 | showFuelManagement, renderFuelCards, showRefuelForm, submitRefuel, showFuelEstimator, calculateFuelEstimate, showFuelHistory |
| 14 | `js/admin-complaints.js` | ~750 | showComplaints, renderComplaintsTable, viewComplaint, showUpdateComplaintForm, submitComplaintUpdate, deleteComplaint, checkNewComplaints, updateComplaintsBadge |
| 15 | `js/admin-schedules.js` | ~1600 | showScheduleManagement, renderSchedulesTable, renderScheduleCalendar, showAddScheduleForm, handleScheduleSubmit, showSpecialPickupsAdmin, showAnnouncementsAdmin, createAnnouncement |
| 16 | `js/admin-reports.js` | ~1300 | showReportsModule, renderCollectionReport, renderDriverReport, renderComplaintReport, renderFuelReport, renderScheduleReport, renderFleetReport, all generateXxxPDF functions, destroyReportCharts |
| 17 | `js/admin-analytics.js` | ~350 | showAnalyticsModule, initAnalyticsMap, loadAnalyticsData, renderCoverageHeatmap, renderComplaintHeatmap, renderBarangayOverlay |

### Admin Live Tracking

| # | File | Lines | Responsibility |
|---|------|-------|---------------|
| 18 | `js/live-tracking.js` | ~450 | showLiveTruckLocations, updateLiveTruckLocations, createTruckPopup, geocoding queue, createLiveTrackingPanel |

### Notifications & History

| # | File | Lines | Responsibility |
|---|------|-------|---------------|
| 19 | `js/notifications-history.js` | ~700 | createNotificationIcon, checkCompletionNotifications, showCompletionNotifications, viewCompletionDetails, openPhotoModal, showNotificationHistory, viewCompletionPhotos, deleteHistoryItem |

### Entry Point (must be last)

| # | File | Lines | Responsibility |
|---|------|-------|---------------|
| 20 | `js/app-init.js` | ~30 | DOMContentLoaded listener, calls initializeApp() |

---

## Shared State Design

All shared state lives on `window.App`:

```javascript
window.App = {
  API_URL: '/api',
  token: localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || '{}'),

  // Map (set by map-core.js)
  map: null,
  tileLayer: null,
  bins: [],
  markers: {},

  // Data caches (populated by each module)
  cache: {
    users: [], trucks: [], routes: [],
    fuel: { trucks: [], fleet: {} },
    complaints: [], schedules: []
  },

  // UI state
  filters: {
    userRole: 'all', userStatus: 'all', truckStatus: 'all',
    routeExpiration: 'all', fuelLevel: 'all',
    complaintStatus: 'all', complaintType: 'all',
    scheduleStatus: 'all'
  },
  search: {},
  sort: { current: null, direction: 'asc' },

  // GPS state (set by gps-tracking.js)
  gps: {
    enabled: false, interval: null, position: null,
    truckMarker: null, truckPath: null, pathCoords: [],
    routingControl: null, speed: 0
  },

  // Interval registry (for cleanup on logout)
  intervals: {}
};
```

**Rules:**
- Shared data uses `App.cache.*`, `App.filters.*`, `App.gps.*`
- Module-private state stays as `let` inside the module IIFE
- `App.intervals` tracks all setInterval IDs; `logout()` clears them all

---

## Module Pattern

Each module uses an IIFE:

```javascript
(function() {
  'use strict';
  // Private state
  let privateVar = null;

  // Functions reference shared state via App.*
  async function showUserManagement() {
    const response = await fetchWithRetry(`${App.API_URL}/users`, { ... });
    App.cache.users = await response.json();
    renderUserTable();
  }

  // Expose to window for inline onclick handlers
  window.showUserManagement = showUserManagement;
  window.editUser = editUser;
  window.deleteUser = deleteUser;
})();
```

---

## Script Loading Order in index.html

```html
<!-- Vendor libraries (unchanged) -->
<script src="/vendor/tailwindcss/tailwind.min.js"></script>
<script src="/vendor/lucide/lucide.min.js"></script>
<script src="/vendor/leaflet/leaflet.js"></script>
<script src="/vendor/leaflet-routing-machine/leaflet-routing-machine.js"></script>
<script src="/vendor/leaflet-heat/leaflet-heat.js"></script>
<script src="/vendor/jspdf/jspdf.umd.min.js"></script>
<script src="/vendor/jspdf/jspdf.plugin.autotable.min.js"></script>
<script src="/vendor/chartjs/chart.umd.js"></script>

<!-- Core layer (order matters) -->
<script src="/js/fetch-retry.js"></script>
<script src="/js/app-state.js"></script>
<script src="/js/utils.js"></script>
<script src="/js/table-utils.js"></script>
<script src="/js/offline-sync.js"></script>
<script src="/js/offline-db.js"></script>
<script src="/js/sync-manager.js"></script>
<script src="/js/auth.js"></script>
<script src="/js/map-core.js"></script>

<!-- Feature modules (order independent) -->
<script src="/js/gps-tracking.js"></script>
<script src="/js/driver-dashboard.js"></script>
<script src="/js/driver-routes.js"></script>
<script src="/js/admin-users.js"></script>
<script src="/js/admin-trucks.js"></script>
<script src="/js/admin-routes.js"></script>
<script src="/js/admin-fuel.js"></script>
<script src="/js/admin-complaints.js"></script>
<script src="/js/admin-schedules.js"></script>
<script src="/js/admin-reports.js"></script>
<script src="/js/admin-analytics.js"></script>
<script src="/js/live-tracking.js"></script>
<script src="/js/notifications-history.js"></script>

<!-- Entry point (must be last) -->
<script src="/js/app-init.js"></script>
```

---

## Implementation Strategy

### Phase 1: Foundations (do first)
1. Create `js/app-state.js` with App namespace
2. Extract `js/utils.js` (escapeHtml, showToast, modal system, loading)
3. Extract `js/table-utils.js` (sorting, filtering, search)
4. Extract `js/offline-sync.js` (offlineQueue)
5. Extract `js/auth.js` (initializeApp, logout, sidebar)
6. Extract `js/map-core.js` (Leaflet init, bins, view switching)
7. Create `js/app-init.js` entry point
8. Update `index.html` script tags
9. Run E2E tests — all 253 must pass

### Phase 2: Admin Modules (independent, can parallelize)
10. Extract `js/admin-users.js`
11. Extract `js/admin-trucks.js`
12. Extract `js/admin-routes.js`
13. Extract `js/admin-fuel.js`
14. Extract `js/admin-complaints.js`
15. Extract `js/admin-schedules.js`
16. Extract `js/admin-reports.js`
17. Extract `js/admin-analytics.js`
18. Run E2E tests after each extraction

### Phase 3: Driver & Tracking Modules
19. Extract `js/gps-tracking.js`
20. Extract `js/driver-dashboard.js`
21. Extract `js/driver-routes.js`
22. Extract `js/live-tracking.js`
23. Extract `js/notifications-history.js`
24. Run full E2E suite

### Phase 4: Cleanup
25. Delete old `app.js`
26. Update `sw.js` STATIC_ASSETS with new file paths
27. Final E2E run — 253/253 must pass
28. Commit and push

---

## Service Worker Update

`sw.js` STATIC_ASSETS must list all new JS files:

```javascript
const STATIC_ASSETS = [
  // ... existing entries ...
  '/js/app-state.js',
  '/js/utils.js',
  '/js/table-utils.js',
  '/js/offline-sync.js',
  '/js/auth.js',
  '/js/map-core.js',
  '/js/gps-tracking.js',
  '/js/driver-dashboard.js',
  '/js/driver-routes.js',
  '/js/admin-users.js',
  '/js/admin-trucks.js',
  '/js/admin-routes.js',
  '/js/admin-fuel.js',
  '/js/admin-complaints.js',
  '/js/admin-schedules.js',
  '/js/admin-reports.js',
  '/js/admin-analytics.js',
  '/js/live-tracking.js',
  '/js/notifications-history.js',
  '/js/app-init.js'
];
```

Remove `/app.js` from STATIC_ASSETS after deletion.

---

## Verification

After each phase:
- Run `npx playwright test` — all 253 E2E tests must pass
- Manual smoke test: login as admin, click through all sidebar sections
- Manual smoke test: login as driver, start GPS, complete a stop
- Check browser console for any ReferenceError (missing function/variable)

---

## Risk Mitigation

- **Incremental extraction**: Move one module at a time, test after each
- **No functionality changes**: Pure refactor — identical behavior
- **Keep old app.js as backup**: Don't delete until Phase 4 passes all tests
- **Git commit per phase**: Easy to revert if something breaks
