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
