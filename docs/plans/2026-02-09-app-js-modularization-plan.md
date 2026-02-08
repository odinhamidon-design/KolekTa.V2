# App.js Modularization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Split the 15,260-line monolithic `public/app.js` into 20 focused IIFE modules with a shared `window.App` namespace, maintaining 100% behavioral compatibility verified by 253 E2E tests.

**Architecture:** Each module is a self-contained IIFE that reads/writes shared state via `window.App` and exposes public functions on `window.*` for inline `onclick` compatibility. No build tooling — vanilla `<script>` tags. Core layer loads first (state, utils, auth, map), feature modules load after (order-independent), entry point loads last.

**Tech Stack:** Vanilla JavaScript (IIFE modules), Leaflet.js (maps), Chart.js (reports), jsPDF (PDF export), Playwright (E2E testing)

**Key Reference Files:**
- Design doc: `docs/plans/2026-02-09-app-js-modularization-design.md`
- Source: `public/app.js` (15,260 lines — the file being split)
- HTML: `public/index.html` (script tags at lines 917-930)
- Service Worker: `public/sw.js` (STATIC_ASSETS array at line 11)
- Playwright config: `playwright.config.js`

**Test command:** `npx playwright test` (runs from `kolekta/` dir, auto-starts server on port 3004)
**Expected result:** 253 passed

---

## Phase 1: Core Layer Foundation

### Task 1: Create `js/app-state.js` — shared App namespace

**Files:**
- Create: `public/js/app-state.js`

**Step 1: Create the App namespace file**

Create `public/js/app-state.js` with the following content. This replaces all scattered `let`/`const` globals with a single organized namespace:

```javascript
/**
 * Kolek-Ta Application State
 * Central namespace replacing scattered globals.
 * Loaded first — all other modules read/write via App.*
 */
window.App = {
  API_URL: '/api',
  token: localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || '{}'),

  // Map state (set by map-core.js after Leaflet init)
  map: null,
  tileLayer: null,
  bins: [],
  markers: {},

  // Data caches (populated by each admin module on data fetch)
  cache: {
    users: [],
    trucks: [],
    truckDrivers: [],
    routes: [],
    routeDrivers: [],
    fuel: { trucks: [], fleet: {} },
    complaints: [],
    complaintsStats: {},
    complaintsDrivers: [],
    schedules: [],
    schedulesStats: {},
    scheduleRoutes: [],
    scheduleDrivers: [],
    scheduleTrucks: []
  },

  // UI filter state
  filters: {
    userRole: 'all',
    userStatus: 'all',
    truckStatus: 'all',
    routeExpiration: 'all',
    fuelLevel: 'all',
    complaintStatus: 'all',
    complaintType: 'all',
    scheduleStatus: 'all'
  },

  // Search and sort state (shared by table-utils.js)
  search: {},
  sort: { current: null, direction: 'asc' },
  sortHandlers: {},

  // GPS tracking state (set by gps-tracking.js)
  gps: {
    enabled: false,
    interval: null,
    position: null,
    lastPosition: null,
    truckMarker: null,
    truckPath: null,
    pathCoords: [],
    routingControl: null,
    speed: 0,
    navigationLine: null,
    nextDestination: null,
    etaPanel: null,
    distanceToDestination: 0,
    currentPathLine: null,
    assignedRouteLine: null,
    routeWaypointMarkers: []
  },

  // Interval registry — logout() clears all
  intervals: {},

  // Constants
  MATI_CENTER: [6.9549, 126.2185],
  MATI_BOUNDS: [[6.88, 126.14], [7.03, 126.30]]
};
```

**Step 2: Commit**

```bash
git add public/js/app-state.js
git commit -m "refactor: create App namespace (app-state.js)"
```

---

### Task 2: Extract `js/utils.js` — shared UI utilities

**Files:**
- Create: `public/js/utils.js`
- Modify: `public/app.js` — remove lines 4-231 (escapeHtml), lines 233-586 (loading/toast), lines 1226-1271 (showModal/closeModal), lines 1273-1330 (showPage/closePage), and the `getTimeAgo` function (~lines 5599-5614)

**Step 1: Create `public/js/utils.js`**

Extract the following functions from `app.js` into `public/js/utils.js`, wrapped in an IIFE. The functions to extract are:

- `escapeHtml(str)` — lines 13-18
- `showPageLoading(text)` / `hidePageLoading()` — lines 237-255
- `ensureToastContainer()` / `showToast(...)` — lines 262-586
- `showAlertModal(...)` / `showConfirmModal(...)` / `showConfirm(...)` — lines 325-586
- `showModal(...)` / `closeModal(...)` / `closeModalWithSuccess(...)` — lines 1226-1271
- `showPage(...)` / `closePage()` — lines 1277-1330
- `getTimeAgo(date)` — ~line 5599

Wrap in IIFE. Expose all functions on `window.*` (they're already called via window scope from inline onclick and other modules).

**Step 2: Remove extracted code from `app.js`**

Delete the extracted function blocks from `app.js`. Leave `const API_URL = '/api'` (will be replaced by `App.API_URL` later) and any remaining code.

**Step 3: Add `<script src="/js/utils.js"></script>` to `index.html`**

Insert after the `app-state.js` script tag, before `app.js`.

**Step 4: Run E2E tests**

```bash
cd kolekta && npx playwright test
```

Expected: 253 passed. If any fail, check browser console for ReferenceError.

**Step 5: Commit**

```bash
git add public/js/utils.js public/app.js public/index.html
git commit -m "refactor: extract utils.js (escapeHtml, toast, modal, page system)"
```

---

### Task 3: Extract `js/table-utils.js` — sorting, filtering, search

**Files:**
- Create: `public/js/table-utils.js`
- Modify: `public/app.js` — remove lines 591-904 (sorting + filtering + search systems)

**Step 1: Create `public/js/table-utils.js`**

Extract these functions from `app.js`:

- `sortData(data, column, direction, customSort)` — line 606
- `toggleSort(module, column)` — line 655
- `createSortableHeader(module, columns)` — line 667
- `handleSort(module, column)` — line 695
- All filter handlers: `filterTrucksByFuelLevel`, `handleFuelLevelFilter`, `handleUserRoleFilter`, `handleUserStatusFilter`, `handleTruckStatusFilter`, `handleComplaintStatusFilter`, `handleComplaintTypeFilter`, `handleScheduleStatusFilter`, `filterRoutesByExpiration`, `handleExpirationFilter`, `createExpirationFilter` — lines 721-848
- `filterData(data, searchTerm, searchFields)` — line 849
- `createSearchInput(module, placeholder)` — line 865
- `handleSearch(module, value)` — line 885
- `clearSearch(module)` — line 893

Replace references to standalone `sortState`, `searchState`, `sortHandlers` variables with `App.sort`, `App.search`, `App.sortHandlers`. Replace filter state variables (`userRoleFilter`, `truckStatusFilter`, etc.) with `App.filters.userRole`, `App.filters.truckStatus`, etc.

Wrap in IIFE. Expose all on `window.*`.

**Step 2: Remove from `app.js`, add script tag to `index.html`**

**Step 3: Run E2E tests** — Expected: 253 passed

**Step 4: Commit**

```bash
git add public/js/table-utils.js public/app.js public/index.html
git commit -m "refactor: extract table-utils.js (sort, filter, search)"
```

---

### Task 4: Extract `js/offline-sync.js` — offline queue system

**Files:**
- Create: `public/js/offline-sync.js`
- Modify: `public/app.js` — remove lines 20-231 (offlineQueue object + online/offline listeners + DOMContentLoaded)

**Step 1: Create `public/js/offline-sync.js`**

Extract the `offlineQueue` object and its associated event listeners (online, offline, DOMContentLoaded). Replace `API_URL` references with `App.API_URL`. Wrap in IIFE, expose `offlineQueue` on `window`.

**Step 2: Remove from `app.js`, add script tag to `index.html`**

**Step 3: Run E2E tests** — Expected: 253 passed

**Step 4: Commit**

```bash
git add public/js/offline-sync.js public/app.js public/index.html
git commit -m "refactor: extract offline-sync.js (offlineQueue, online/offline events)"
```

---

### Task 5: Extract `js/map-core.js` — Leaflet initialization and bin management

**Files:**
- Create: `public/js/map-core.js`
- Modify: `public/app.js` — remove lines 1083-1225 (map init, bins, landmarks, status colors) and view switching functions

**Step 1: Create `public/js/map-core.js`**

Extract:
- Map initialization: `MATI_CENTER`, `MATI_BOUNDS`, `L.map()`, tile layer, boundary rectangle, landmarks — lines 1083-1165
- `hideMapLoadingOverlay()` / `showMapLoadingOverlay()` — lines 1116-1136
- `loadBins()` / `displayBins()` — lines 1169-1205
- `getStatusColor(status)` — line 1206
- `showMapView()` / `showPageContent()` — lines 1846-1859
- Map-related globals: `mapTilesLoaded`, `bins`, `markers`

Store map on `App.map`, bins on `App.bins`, markers on `App.markers`. Wrap in IIFE, expose utility functions on `window`.

**Step 2: Remove from `app.js`, add script tag to `index.html`**

**Step 3: Run E2E tests** — Expected: 253 passed

**Step 4: Commit**

```bash
git add public/js/map-core.js public/app.js public/index.html
git commit -m "refactor: extract map-core.js (Leaflet init, bins, view switching)"
```

---

### Task 6: Extract `js/auth.js` — initialization, auth, sidebar navigation

**Files:**
- Create: `public/js/auth.js`
- Modify: `public/app.js` — remove `initializeApp()` (~lines 915-1030), `logout()` (~line 1031), `loadHeaderProfilePicture()` (~line 9740), sidebar button listeners (~lines 1337-1425), `showDashboard()` (~lines 1433-1860), `setActiveSidebarButton()`, `showPageContent()`, `showMapView()`

**Step 1: Create `public/js/auth.js`**

Extract:
- `initializeApp()` — handles token check, role routing, dashboard init
- `logout()` — clears token, clears intervals, redirects
- `loadHeaderProfilePicture()` — fetches and renders profile pic
- Sidebar button addEventListener wiring (dashboardBtn, userManagementBtn, etc.)
- `setActiveSidebarButton(activeId)`
- `showDashboard()` — renders dashboard cards, stats, recent activity

Replace `token` / `user` with `App.token` / `App.user`. Replace `API_URL` with `App.API_URL`. In `logout()`, iterate `App.intervals` and clear all.

Wrap in IIFE. Expose `initializeApp`, `logout`, `showDashboard`, `setActiveSidebarButton` on `window`.

**Step 2: Remove from `app.js`, add script tag to `index.html`**

**Step 3: Run E2E tests** — Expected: 253 passed

**Step 4: Commit**

```bash
git add public/js/auth.js public/app.js public/index.html
git commit -m "refactor: extract auth.js (init, logout, sidebar, dashboard)"
```

---

### Task 7: Create `js/app-init.js` entry point and wire index.html

**Files:**
- Create: `public/js/app-init.js`
- Modify: `public/index.html` — update all script tags to new module layout

**Step 1: Create `public/js/app-init.js`**

```javascript
/**
 * Kolek-Ta App Entry Point
 * Loaded last — calls initializeApp() after all modules are ready.
 */
(function() {
  'use strict';
  document.addEventListener('DOMContentLoaded', function() {
    if (typeof initializeApp === 'function') {
      initializeApp();
    }
  });
})();
```

**Step 2: Update `index.html` script tags**

Replace the single `<script src="app.js"></script>` (line 930) with the full module list. Keep `app.js` loaded AFTER the new modules — it still contains unextracted code at this point. The order:

```html
<!-- Core layer -->
<script src="/js/fetch-retry.js"></script>
<script src="/js/app-state.js"></script>
<script src="/js/utils.js"></script>
<script src="/js/table-utils.js"></script>
<script src="/js/offline-sync.js"></script>
<script src="/js/offline-db.js"></script>
<script src="/js/sync-manager.js"></script>
<script src="/js/auth.js"></script>
<script src="/js/map-core.js"></script>

<!-- Remaining unextracted code (shrinks as we extract more) -->
<script src="app.js"></script>

<!-- Entry point -->
<script src="/js/app-init.js"></script>
```

**Step 3: Run E2E tests** — Expected: 253 passed

**Step 4: Commit**

```bash
git add public/js/app-init.js public/index.html
git commit -m "refactor: add app-init.js entry point, update index.html script order"
```

---

### Task 8: Phase 1 verification checkpoint

**Step 1: Run full E2E suite**

```bash
cd kolekta && npx playwright test
```

Expected: 253 passed

**Step 2: Verify app.js is smaller**

```bash
wc -l public/app.js
```

Expected: ~12,000-13,000 lines (down from 15,260)

**Step 3: Commit phase checkpoint**

```bash
git commit --allow-empty -m "checkpoint: Phase 1 complete — core layer extracted (6 modules)"
```

---

## Phase 2: Admin Modules

Each task in Phase 2 follows the same pattern:
1. Create the module file with IIFE wrapper
2. Move functions from `app.js` into the module
3. Replace global variable references with `App.*`
4. Add `<script>` tag to `index.html` (before `app.js`)
5. Remove extracted code from `app.js`
6. Run E2E tests — 253 must pass
7. Commit

### Task 9: Extract `js/admin-users.js`

**Files:**
- Create: `public/js/admin-users.js`
- Modify: `public/app.js` — remove lines ~1864-2289

**Functions to extract:**
- `showUserManagement()` — line 1864
- `renderUserTable()` — line 1889
- `showAddUserForm()` — line 2078
- `editUser(userId)` — line 2152
- `deleteUser(userId)` — line 2266

**Global variables to migrate:**
- `cachedUsersData` → `App.cache.users`

**Expose on window:** `showUserManagement`, `showAddUserForm`, `editUser`, `deleteUser`

**Test & commit:**
```bash
npx playwright test tests/admin-user-management.spec.js
git add public/js/admin-users.js public/app.js public/index.html
git commit -m "refactor: extract admin-users.js"
```

---

### Task 10: Extract `js/admin-trucks.js`

**Files:**
- Create: `public/js/admin-trucks.js`
- Modify: `public/app.js` — remove lines ~2292-2887

**Functions to extract:**
- `showTruckManagement()`, `renderTruckTable()`, `showAddTruckForm()`, `editTruck()`, `assignDriver()`, `unassignTruck()`, `deleteTruck()`

**Global variables to migrate:**
- `cachedTrucksData` → `App.cache.trucks`
- `cachedTruckDrivers` → `App.cache.truckDrivers`

**Expose on window:** `showTruckManagement`, `showAddTruckForm`, `editTruck`, `assignDriver`, `unassignTruck`, `deleteTruck`

**Test & commit:**
```bash
npx playwright test tests/admin-truck-management.spec.js
git add public/js/admin-trucks.js public/app.js public/index.html
git commit -m "refactor: extract admin-trucks.js"
```

---

### Task 11: Extract `js/admin-routes.js`

**Files:**
- Create: `public/js/admin-routes.js`
- Modify: `public/app.js` — remove lines ~2887-4400

**Functions to extract:**
- `showRoutesManagement()`, `renderRoutesTable()`, `showAddRouteForm()`, `openMapPicker()`, `drawRoadPath()`, `drawStraightLine()`, `updatePickerLocationsList()`, `removePickerLocation()`, `clearPickerMarkersAndPaths()`, `clearPickerLocations()`, `saveAndCloseMapPicker()`, `closeMapPicker()`, `updateLocationsList()`, `removeLocation()`, `clearLocations()`, `clearTempMarkers()`, `cancelAddRoute()`, `viewRoute()`, `showRouteInfoPanel()`, `closeRouteInfoPanel()`, `createScheduleFromRoute()`, `deleteRoute()`, `unassignRoute()`, `assignRouteToDriver()`

**Global variables to migrate:**
- `routeLocations` / `tempMarkers` / `isAddingLocation` → keep as module-private `let`
- `cachedRoutesData` → `App.cache.routes`
- `cachedRouteDrivers` → `App.cache.routeDrivers`

**Test & commit:**
```bash
npx playwright test tests/admin-routes-management.spec.js
git add public/js/admin-routes.js public/app.js public/index.html
git commit -m "refactor: extract admin-routes.js"
```

---

### Task 12: Extract `js/admin-fuel.js`

**Files:**
- Create: `public/js/admin-fuel.js`
- Modify: `public/app.js` — remove lines ~10182-10782

**Functions to extract:**
- `showFuelManagement()`, `renderFuelCards()`, `showRefuelForm()`, `submitRefuel()`, `showFuelEstimator()`, `calculateFuelEstimate()`, `logEstimatedConsumption()`, `showFuelHistory()`

**Global variables to migrate:**
- `cachedFuelData` → `App.cache.fuel`
- `lastEstimation` → module-private `let`

**Test & commit:**
```bash
npx playwright test tests/fuel-management.spec.js
git add public/js/admin-fuel.js public/app.js public/index.html
git commit -m "refactor: extract admin-fuel.js"
```

---

### Task 13: Extract `js/admin-complaints.js`

**Files:**
- Create: `public/js/admin-complaints.js`
- Modify: `public/app.js` — remove lines ~11135-11970

**Functions to extract:**
- `checkNewComplaints()`, `updateComplaintsBadge()`, `renderComplaintsTable()`, `showComplaints()`, `viewComplaint()`, `showUpdateComplaintForm()`, `submitComplaintUpdate()`, `deleteComplaint()`

**Global variables/constants to migrate:**
- `BARANGAYS` → keep as module-private `const`
- `complaintsColumns`, `complaintsStatusColors`, `reportTypeLabels` → module-private
- `cachedComplaintsData` → `App.cache.complaints`
- `cachedComplaintsStats` → `App.cache.complaintsStats`
- `cachedComplaintsDrivers` → `App.cache.complaintsDrivers`

**Test & commit:**
```bash
npx playwright test tests/complaints.spec.js
git add public/js/admin-complaints.js public/app.js public/index.html
git commit -m "refactor: extract admin-complaints.js"
```

---

### Task 14: Extract `js/admin-schedules.js`

**Files:**
- Create: `public/js/admin-schedules.js`
- Modify: `public/app.js` — remove lines ~11972-13551

**Functions to extract:**
- `setScheduleView()`, `navigateCalendarMonth()`, `getSchedulesForDate()`, `renderScheduleCalendar()`, `showDayScheduleDetails()`, `closeDayModal()`, `renderSchedulesTable()`, `showScheduleManagement()`, `updateRecurrenceOptions()`, `showAddScheduleForm()`, `closeScheduleModal()`, `handleScheduleSubmit()`
- Special Pickups: `showSpecialPickupsAdmin()`, `viewPickupDetails()`, `schedulePickup()`, `completePickup()`
- Announcements: `showAnnouncementsAdmin()`, `showCreateAnnouncementModal()`, `toggleBarangaySelect()`, `createAnnouncement()`, `toggleAnnouncementStatus()`, `deleteAnnouncement()`, `editAnnouncement()`, `toggleEditBarangaySelect()`, `updateAnnouncement()`

**Global variables to migrate:**
- `DAYS_OF_WEEK` → module-private `const`
- `currentCalendarDate`, `currentScheduleView` → module-private `let`
- `schedulesColumns` → module-private
- `cachedSchedulesData` → `App.cache.schedules`
- `cachedSchedulesStats` → `App.cache.schedulesStats`
- `cachedScheduleRoutes/Drivers/Trucks` → `App.cache.scheduleRoutes/Drivers/Trucks`

**Test & commit:**
```bash
npx playwright test tests/schedules.spec.js
git add public/js/admin-schedules.js public/app.js public/index.html
git commit -m "refactor: extract admin-schedules.js"
```

---

### Task 15: Extract `js/admin-reports.js`

**Files:**
- Create: `public/js/admin-reports.js`
- Modify: `public/app.js` — remove lines ~13552-14851

**Functions to extract:**
- `showReportsModule()`, `renderCollectionReport()`, `renderDriverReport()`, `renderComplaintReport()`, `renderFuelReport()`, `renderScheduleReport()`, `renderFleetReport()`, `destroyReportCharts()`
- PDF generators: `generateCollectionPDF()`, `generateDriverPDF()`, `generateComplaintPDF()`, `generateFuelPDF()`, `generateSchedulePDF()`, `generateFleetPDF()`

**Global variables to migrate:**
- `currentReportType`, `currentReportData`, `reportCharts` → module-private `let`

**Test & commit:**
```bash
npx playwright test
git add public/js/admin-reports.js public/app.js public/index.html
git commit -m "refactor: extract admin-reports.js"
```

---

### Task 16: Extract `js/admin-analytics.js`

**Files:**
- Create: `public/js/admin-analytics.js`
- Modify: `public/app.js` — remove lines ~14852-15260 (end of file)

**Functions to extract:**
- `showAnalyticsModule()`, `initAnalyticsMap()`, `loadAnalyticsData()`, `updateAnalyticsSummary()`, `renderCoverageHeatmap()`, `renderComplaintHeatmap()`, `renderBarangayOverlay()`, `renderBarangayTable()`, `setupLayerToggles()`

**Global variables to migrate:**
- `analyticsMap`, `coverageHeatLayer`, `complaintHeatLayer`, `barangayMarkers`, `currentAnalyticsData`, `coverageHeatConfig`, `complaintHeatConfig` → module-private

**Test & commit:**
```bash
npx playwright test
git add public/js/admin-analytics.js public/app.js public/index.html
git commit -m "refactor: extract admin-analytics.js"
```

---

### Task 17: Phase 2 verification checkpoint

**Step 1: Run full E2E suite**

```bash
cd kolekta && npx playwright test
```

Expected: 253 passed

**Step 2: Verify app.js is smaller**

```bash
wc -l public/app.js
```

Expected: ~5,000-6,000 lines (driver/tracking code remains)

**Step 3: Commit checkpoint**

```bash
git commit --allow-empty -m "checkpoint: Phase 2 complete — 8 admin modules extracted"
```

---

## Phase 3: Driver & Tracking Modules

### Task 18: Extract `js/gps-tracking.js`

**Files:**
- Create: `public/js/gps-tracking.js`
- Modify: `public/app.js` — remove lines ~7422-8860

**Functions to extract:**
- GPS core: `startGPSTracking()`, `stopGPSTracking()`, `updateGPSButtonState()`, `showTrackingStatus()`
- Truck visualization: `positionTruckAtFirstBin()`, `updateTruckMarker()`, `snapToRoad()`, `animateTruckAlongPath()`, `calculateBearing()`, `updateTruckRotation()`
- Navigation: `drawNavigationLine()`, `drawCurrentPathLine()`, `drawAssignedRouteLine()`, `drawRouteVisualization()`, `clearRouteVisualization()`, `showRouteLegend()`, `hideRouteLegend()`, `updateCurrentPathToNextWaypoint()`, `updateETAPanel()`, `getNextDestination()`, `initializeNavigation()`, `updateNavigationToDestination()`
- Server sync: `updateLocationOnServer()`
- Trip data: `updateLiveFuelDisplay()`, `fetchTripData()`, `updateFullFuelDisplay()`, `startTripDataPolling()`, `stopTripDataPolling()`, `getCurrentActiveRoute()`

**Global variables to migrate:**
- All GPS globals (`trackingInterval`, `trackingEnabled`, `currentPosition`, `truckMarker`, `truckPath`, etc.) → `App.gps.*`
- `truckIcon` → module-private `const`
- `tripDataInterval` → `App.intervals.tripData`

**Test & commit:**
```bash
npx playwright test tests/live-tracking.spec.js tests/driver-dashboard.spec.js
git add public/js/gps-tracking.js public/app.js public/index.html
git commit -m "refactor: extract gps-tracking.js"
```

---

### Task 19: Extract `js/driver-dashboard.js`

**Files:**
- Create: `public/js/driver-dashboard.js`
- Modify: `public/app.js` — remove lines ~4405-5783 and ~10782-11134

**Functions to extract:**
- Quick stats: `updateDriverQuickStats()`, `updateActiveRoutePanel()`
- Vehicle inspection: `showVehicleInspection()`, `markInspectionItem()`, `submitInspection()`
- Driver stats: `showDriverStats()`
- Incident reporting: `reportIncident()`, `selectIncidentType()`, `previewIncidentPhoto()`, `submitIncident()`
- Notifications: `initDriverNotifications()`, `loadDriverNotifications()`, `showDriverNotifications()`, `markNotificationRead()`, `markAllNotificationsRead()`
- Performance: `showDriverPerformance()`, `renderPerformanceStats()`, `showPerformancePeriod()`
- Mobile nav: `initMobileDriverNav()`, `setMobileNavActive()`, `updateMobileGpsButton()`, `updateMobileRouteIndicator()`, `showMobileDriverHome()`, `loadMobileDriverData()`, `showMobileActiveRoute()`, `closeMobilePanel()`, `toggleMobilePanel()`, `loadDriverAssignments()`
- Overlay: `loadDriverAssignmentsOverlay()`, `updateOverlayActiveRoute()`, `updateDriverOverlayStats()`, `syncOverlayGPSState()`, `updateMobileGpsStatus()`, `updateMobileRoutePill()`, `updateMobileStats()`, `syncMobileOverlay()`

**Test & commit:**
```bash
npx playwright test tests/driver-dashboard.spec.js
git add public/js/driver-dashboard.js public/app.js public/index.html
git commit -m "refactor: extract driver-dashboard.js"
```

---

### Task 20: Extract `js/driver-routes.js`

**Files:**
- Create: `public/js/driver-routes.js`
- Modify: `public/app.js` — remove lines ~4943-5431 and ~6089-6700

**Functions to extract:**
- Route navigation: `showActiveRouteNavigation()`, `showNavigationPanel()`, `closeNavigationPanel()`
- Stop management: `markStopCompleted()`, `skipStop()`, `previewSkipPhoto()`, `submitSkipStop()`
- Route actions: `viewDriverRoute()`, `startCollection()`, `stopCollection()`, `markRouteComplete()`, `updateRouteStatus()`

**Test & commit:**
```bash
npx playwright test tests/driver-dashboard.spec.js
git add public/js/driver-routes.js public/app.js public/index.html
git commit -m "refactor: extract driver-routes.js"
```

---

### Task 21: Extract `js/live-tracking.js`

**Files:**
- Create: `public/js/live-tracking.js`
- Modify: `public/app.js` — remove lines ~8860-9740

**Functions to extract:**
- Admin live view: `showLiveTruckLocations()`, `updateLiveTruckLocations()`, `createTruckPopup()`, `createLiveTrackingPanel()`
- Geocoding: `getCachedLocationName()`, `geocodeLocation()`, `queueGeocodeRequest()`, `processGeocodeQueue()`, `updateDriverLocationName()`
- Truck info: `clearRouteOnlyMarkers()`, `showTruckInfoPanel()`

**Global variables to migrate:**
- `driverMarkers`, `trackingUpdateInterval`, `locationNameCache`, `currentLocationName`, `geocodeQueue`, `isProcessingGeocode`, `GEOCODE_DELAY` → module-private

**Test & commit:**
```bash
npx playwright test tests/live-tracking.spec.js
git add public/js/live-tracking.js public/app.js public/index.html
git commit -m "refactor: extract live-tracking.js"
```

---

### Task 22: Extract `js/notifications-history.js`

**Files:**
- Create: `public/js/notifications-history.js`
- Modify: `public/app.js` — remove lines ~6717-7421

**Functions to extract:**
- Notification icon: `createNotificationIcon()`
- Notification checks: `checkCompletionNotifications()`, `showCompletionNotifications()`, `showNotificationDetails()`
- Completion details: `viewCompletionDetails()`, `openPhotoModal()`, `deleteNotification()`, `deleteAllNotifications()`
- History: `saveNotificationToHistory()`, `showNotificationHistory()`, `viewCompletionPhotos()`, `deleteHistoryItem()`, `clearAllHistory()`, `markAllNotificationsRead()`

**Test & commit:**
```bash
npx playwright test
git add public/js/notifications-history.js public/app.js public/index.html
git commit -m "refactor: extract notifications-history.js"
```

---

### Task 23: Phase 3 verification checkpoint

**Step 1: Run full E2E suite**

```bash
cd kolekta && npx playwright test
```

Expected: 253 passed

**Step 2: Verify app.js is near-empty**

```bash
wc -l public/app.js
```

Expected: < 100 lines (only `API_URL` and any remaining glue code)

**Step 3: Commit checkpoint**

```bash
git commit --allow-empty -m "checkpoint: Phase 3 complete — all feature modules extracted"
```

---

## Phase 4: Cleanup

### Task 24: Delete old `app.js` and finalize

**Step 1: Move any remaining code from `app.js`**

If `app.js` still has code, move it to the appropriate module. If only `const API_URL = '/api'` remains, it's already in `app-state.js` as `App.API_URL` — delete it.

**Step 2: Delete `app.js`**

```bash
rm public/app.js
```

**Step 3: Remove `<script src="app.js">` from `index.html`**

Delete the line `<script src="app.js"></script>` from `index.html`.

**Step 4: Update `sw.js` STATIC_ASSETS**

In `public/sw.js`, replace `/app.js` in the STATIC_ASSETS array with all new module paths:

```javascript
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
```

**Step 5: Run full E2E suite**

```bash
cd kolekta && npx playwright test
```

Expected: 253 passed

**Step 6: Final commit**

```bash
git add -A
git commit -m "refactor: complete app.js modularization — 20 focused modules replace 15K-line monolith"
```

**Step 7: Push to GitHub**

```bash
git push origin main
```

---

## Summary

| Phase | Tasks | Modules Created | Lines Extracted |
|-------|-------|----------------|----------------|
| Phase 1 | Tasks 1-8 | 7 (state, utils, table-utils, offline, auth, map, init) | ~3,500 |
| Phase 2 | Tasks 9-17 | 8 (users, trucks, routes, fuel, complaints, schedules, reports, analytics) | ~7,500 |
| Phase 3 | Tasks 18-23 | 5 (GPS, driver-dashboard, driver-routes, live-tracking, notifications) | ~4,200 |
| Phase 4 | Task 24 | 0 (cleanup) | Delete old app.js |
| **Total** | **24 tasks** | **20 modules** | **15,260 lines** |

**Verification at every step:** Run `npx playwright test` — 253/253 must pass.
