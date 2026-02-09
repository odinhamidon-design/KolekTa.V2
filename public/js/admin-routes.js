/**
 * Kolek-Ta Admin Routes Module
 * Route management, map picker, route optimization.
 */
(function() {
  'use strict';

// Routes Management Functions
let routeLocations = [];
let tempMarkers = [];
let isAddingLocation = false;
let cachedRoutesData = [];
let cachedRouteDrivers = [];

async function showRoutesManagement() {
  setActiveSidebarButton('routesManagementBtn');
  showPage('Routes Management', `
    <div class="flex flex-col items-center justify-center py-16">
      <div class="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mb-4"></div>
      <p class="text-gray-500">Loading routes...</p>
    </div>
  `);
  try {
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };

    const [routesRes, usersRes] = await Promise.all([
      fetch(`${API_URL}/routes`, { headers }),
      fetch(`${API_URL}/users`, { headers })
    ]);

    cachedRoutesData = await routesRes.json();
    const users = await usersRes.json();
    cachedRouteDrivers = users.filter(u => u.role === 'driver');

    // Register sort handler
    sortHandlers.routes = () => renderRoutesTable();

    renderRoutesTable();
  } catch (error) {
    console.error('Error loading routes:', error);
    showPage('Routes Management', `
      <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <i data-lucide="alert-circle" class="w-12 h-12 text-red-500 mx-auto mb-3"></i>
        <p class="text-red-700">Error loading routes: ${error.message}</p>
        <button onclick="showRoutesManagement()" class="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
          Try Again
        </button>
      </div>
    `);
  }
}

function renderRoutesTable() {
  const routes = cachedRoutesData;
  const drivers = cachedRouteDrivers;

  // Define searchable fields
  const searchFields = ['routeId', 'name', 'status', 'assignedDriver'];

  // Apply expiration filter first
  const expirationFiltered = filterRoutesByExpiration(routes, routeExpirationFilter);

  // Apply search filter
  const filteredRoutes = filterData(expirationFiltered, searchState.routes, searchFields);

  // Apply sorting with custom sort for nested properties
  const { column, direction } = sortState.routes;
  const customSort = {
    locationCount: (r) => r.path ? r.path.coordinates.length : 0
  };
  const sortedRoutes = sortData(filteredRoutes, column, direction, customSort);

  // Stats (from all routes)
  const plannedCount = routes.filter(r => r.status === 'planned').length;
  const activeCount = routes.filter(r => r.status === 'active').length;
  const completedCount = routes.filter(r => r.status === 'completed').length;
  const assignedCount = routes.filter(r => r.assignedDriver).length;

  // Calculate expiration stats
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const expiredCount = routes.filter(r => r.isExpired || (r.expiresAt && new Date(r.expiresAt) < now)).length;
  const expiringSoonCount = routes.filter(r => {
    if (r.isExpired || !r.expiresAt) return false;
    const expiresAt = new Date(r.expiresAt);
    return expiresAt >= now && expiresAt <= sevenDaysFromNow;
  }).length;

  // Define sortable columns
  const columns = [
    { key: 'routeId', label: 'Route', sortable: true },
    { key: 'locationCount', label: 'Locations', sortable: true },
    { key: 'distance', label: 'Distance', sortable: true },
    { key: 'assignedDriver', label: 'Driver', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'expiresAt', label: 'Expires', sortable: true },
    { key: 'actions', label: 'Actions', sortable: false }
  ];

  const routeRows = sortedRoutes.map(r => {
      const driver = drivers.find(d => d.username === r.assignedDriver);
      const isAssigned = !!r.assignedDriver;
      const locationCount = r.path ? r.path.coordinates.length : 0;

      // Calculate expiration status for this route
      const routeNow = new Date();
      const routeSevenDays = new Date(routeNow.getTime() + 7 * 24 * 60 * 60 * 1000);
      let expirationBadge = '<span class="text-gray-400">-</span>';
      if (r.expiresAt) {
        const expiresAt = new Date(r.expiresAt);
        const isExpired = r.isExpired || expiresAt < routeNow;
        const isExpiringSoon = !isExpired && expiresAt <= routeSevenDays;
        const formattedDate = expiresAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        if (isExpired) {
          expirationBadge = `<span class="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700" title="Expired on ${formattedDate}">Expired</span>`;
        } else if (isExpiringSoon) {
          expirationBadge = `<span class="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700" title="Expires ${formattedDate}">${formattedDate}</span>`;
        } else {
          expirationBadge = `<span class="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700" title="Expires ${formattedDate}">${formattedDate}</span>`;
        }
      }

      const statusColors = {
        'planned': 'bg-blue-100 text-blue-700',
        'active': 'bg-yellow-100 text-yellow-700',
        'completed': 'bg-green-100 text-green-700'
      };

      return `
        <tr class="border-b border-gray-100 hover:bg-primary-50 transition-colors cursor-pointer group ${isAssigned ? 'bg-blue-50/30' : ''}" onclick="viewRoute('${r._id || r.routeId}')">
          <td class="px-4 py-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-indigo-100 group-hover:bg-primary-200 flex items-center justify-center transition-colors">
                <i data-lucide="route" class="w-5 h-5 text-indigo-600 group-hover:text-primary-700"></i>
              </div>
              <div>
                <div class="font-semibold text-gray-800 group-hover:text-primary-700">${escapeHtml(r.name || r.routeId)}</div>
                <div class="text-sm text-gray-500">${r.areas?.length ? r.areas.map(a => escapeHtml(a)).join(', ') : escapeHtml(r.routeId)}</div>
              </div>
            </div>
          </td>
          <td class="px-4 py-4">
            <div class="flex items-center gap-2">
              <i data-lucide="map-pin" class="w-4 h-4 text-gray-400"></i>
              <span class="text-gray-600">${locationCount} stops</span>
            </div>
          </td>
          <td class="px-4 py-4 text-gray-600">
            ${r.distance ? (r.distance / 1000).toFixed(2) + ' km' : '-'}
          </td>
          <td class="px-4 py-4">
            ${driver ? `
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-medium">
                  ${(driver.fullName || driver.username).charAt(0).toUpperCase()}
                </div>
                <span class="text-gray-700">${escapeHtml(driver.fullName || driver.username)}</span>
              </div>
            ` : '<span class="text-gray-400">Not assigned</span>'}
          </td>
          <td class="px-4 py-4">
            <span class="px-3 py-1 rounded-full text-xs font-medium ${statusColors[r.status] || 'bg-gray-100 text-gray-700'}">
              ${r.status}
            </span>
          </td>
          <td class="px-4 py-4">
            ${expirationBadge}
          </td>
          <td class="px-4 py-4" onclick="event.stopPropagation()">
            <div class="flex items-center gap-1">
              ${!isAssigned ? `
                <button onclick="event.stopPropagation(); assignRouteToDriver('${r._id || r.routeId}')" class="p-2 hover:bg-green-100 rounded-lg transition-colors" title="Assign Driver">
                  <i data-lucide="user-plus" class="w-4 h-4 text-green-600"></i>
                </button>
              ` : `
                <span class="p-2 text-green-600" title="Already assigned">
                  <i data-lucide="user-check" class="w-4 h-4"></i>
                </span>
              `}
              <button onclick="event.stopPropagation(); viewRoute('${r._id || r.routeId}')" class="p-2 hover:bg-primary-100 rounded-lg transition-colors" title="View on Map">
                <i data-lucide="map" class="w-4 h-4 text-primary-600"></i>
              </button>
              <button onclick="event.stopPropagation(); deleteRoute('${r._id || r.routeId}')" class="p-2 hover:bg-red-100 rounded-lg transition-colors" title="Delete">
                <i data-lucide="trash-2" class="w-4 h-4 text-red-500"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    showPage('Routes Management', `
      <!-- Stats Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
              <i data-lucide="route" class="w-6 h-6 text-indigo-600"></i>
            </div>
            <div>
              <p class="text-sm text-gray-500">Total Routes</p>
              <p class="text-2xl font-bold text-gray-800">${routes.length}</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <i data-lucide="calendar" class="w-6 h-6 text-blue-600"></i>
            </div>
            <div>
              <p class="text-sm text-gray-500">Planned</p>
              <p class="text-2xl font-bold text-gray-800">${plannedCount}</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <i data-lucide="play" class="w-6 h-6 text-yellow-600"></i>
            </div>
            <div>
              <p class="text-sm text-gray-500">Active</p>
              <p class="text-2xl font-bold text-gray-800">${activeCount}</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <i data-lucide="check-circle" class="w-6 h-6 text-green-600"></i>
            </div>
            <div>
              <p class="text-sm text-gray-500">Completed</p>
              <p class="text-2xl font-bold text-gray-800">${completedCount}</p>
            </div>
          </div>
        </div>
      </div>

      ${(expiredCount > 0 || expiringSoonCount > 0) ? `
      <!-- Expiration Alert Banner -->
      <div class="mb-4 p-4 rounded-xl border ${expiredCount > 0 ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'}">
        <div class="flex items-center gap-3">
          <i data-lucide="${expiredCount > 0 ? 'alert-circle' : 'clock'}" class="w-5 h-5 ${expiredCount > 0 ? 'text-red-500' : 'text-orange-500'}"></i>
          <div>
            ${expiredCount > 0 ? `<span class="font-medium text-red-700">${expiredCount} route${expiredCount > 1 ? 's' : ''} expired</span>` : ''}
            ${expiredCount > 0 && expiringSoonCount > 0 ? ' • ' : ''}
            ${expiringSoonCount > 0 ? `<span class="font-medium ${expiredCount > 0 ? 'text-red-700' : 'text-orange-700'}">${expiringSoonCount} route${expiringSoonCount > 1 ? 's' : ''} expiring soon</span>` : ''}
          </div>
        </div>
      </div>
      ` : ''}

      <!-- Routes Table Card -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <!-- Table Header -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-4 border-b border-gray-100">
          <div>
            <h2 class="font-semibold text-gray-800">All Routes</h2>
            <p class="text-sm text-gray-500">${sortedRoutes.length} of ${routes.length} routes${searchState.routes || routeExpirationFilter !== 'all' ? ' (filtered)' : ''} <span class="text-primary-500 ml-2">• Click a row to view on map</span></p>
          </div>
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            ${createExpirationFilter()}
            ${createSearchInput('routes', 'Search routes...')}
            <button onclick="showAddRouteForm()" class="flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors">
              <i data-lucide="plus" class="w-4 h-4"></i>
              <span>Add Route</span>
            </button>
          </div>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-100">
              <tr>
                ${createSortableHeader('routes', columns)}
              </tr>
            </thead>
            <tbody>
              ${routeRows || '<tr><td colspan="7" class="px-4 py-8 text-center text-gray-500">No routes found</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `);
}

window.showAddRouteForm = function() {
  routeLocations = [];
  clearTempMarkers();

  showModal('Add New Route', `
    <form id="addRouteForm" class="space-y-6">
      <!-- Route Name Input -->
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-2">
          <span class="flex items-center gap-2">
            <i data-lucide="route" class="w-4 h-4 text-primary-500"></i>
            Route Name <span class="text-red-500">*</span>
          </span>
        </label>
        <input
          type="text"
          id="newRouteName"
          placeholder="e.g., C-1"
          required
          class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 text-gray-700 placeholder-gray-400"
        >
      </div>

      <!-- Areas/Barangays Input -->
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-2">
          <span class="flex items-center gap-2">
            <i data-lucide="map" class="w-4 h-4 text-primary-500"></i>
            Areas/Barangays
          </span>
        </label>
        <input
          type="text"
          id="newRouteAreas"
          placeholder="e.g., Matio, Dahican, Poblacion"
          class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 text-gray-700 placeholder-gray-400"
        >
        <p class="text-xs text-gray-500 mt-1">Separate multiple areas with commas</p>
      </div>

      <!-- Locations Section -->
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-2">
          <span class="flex items-center gap-2">
            <i data-lucide="map-pin" class="w-4 h-4 text-primary-500"></i>
            Collection Points
          </span>
        </label>

        <!-- Locations List Container -->
        <div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 overflow-hidden">
          <div id="locationsList" class="max-h-48 overflow-y-auto p-4 custom-scrollbar">
            <div class="flex flex-col items-center justify-center py-6 text-gray-400">
              <i data-lucide="map-pin-off" class="w-10 h-10 mb-2 opacity-50"></i>
              <p class="text-sm">No locations added yet</p>
              <p class="text-xs mt-1">Click the button below to add collection points</p>
            </div>
          </div>

          <!-- Location Counter -->
          <div id="locationCounter" class="hidden px-4 py-2 bg-primary-50 border-t border-primary-100">
            <span class="text-sm font-medium text-primary-700">
              <i data-lucide="check-circle" class="w-4 h-4 inline mr-1"></i>
              <span id="locationCountText">0 locations added</span>
            </span>
          </div>
        </div>

        <!-- Location Action Buttons -->
        <div class="flex gap-3 mt-3">
          <button
            type="button"
            onclick="openMapPicker()"
            class="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <i data-lucide="map" class="w-5 h-5"></i>
            <span>Open Map to Add Points</span>
          </button>
          <button
            type="button"
            onclick="clearLocations()"
            class="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-xl transition-all duration-200 border border-red-200"
          >
            <i data-lucide="trash-2" class="w-5 h-5"></i>
            <span class="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      <!-- Notes Section -->
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-2">
          <span class="flex items-center gap-2">
            <i data-lucide="file-text" class="w-4 h-4 text-primary-500"></i>
            Notes <span class="text-gray-400 font-normal">(Optional)</span>
          </span>
        </label>
        <textarea
          id="newRouteNotes"
          rows="3"
          placeholder="Additional information about the route..."
          class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 text-gray-700 placeholder-gray-400 resize-none"
        ></textarea>
      </div>

      <!-- Expiration Date Section -->
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-2">
          <span class="flex items-center gap-2">
            <i data-lucide="calendar-clock" class="w-4 h-4 text-primary-500"></i>
            Expires On <span class="text-gray-400 font-normal">(Optional)</span>
          </span>
        </label>
        <input
          type="date"
          id="newRouteExpiresAt"
          class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 text-gray-700"
        >
        <p class="text-xs text-gray-500 mt-1">Leave empty if the route has no expiration date</p>
      </div>

      <!-- Form Actions -->
      <div class="flex gap-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onclick="cancelAddRoute()"
          class="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all duration-200"
        >
          <i data-lucide="x" class="w-5 h-5"></i>
          <span>Cancel</span>
        </button>
        <button
          type="submit"
          class="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <i data-lucide="save" class="w-5 h-5"></i>
          <span>Save Route</span>
        </button>
      </div>
    </form>
  `);

  // Re-initialize Lucide icons for the modal
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  document.getElementById('addRouteForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (routeLocations.length < 2) {
      showToast('Please add at least 2 locations for the route', 'warning');
      return;
    }
    
    const expiresAtValue = document.getElementById('newRouteExpiresAt').value;
    const areasInput = document.getElementById('newRouteAreas').value;
    const routeData = {
      routeId: 'ROUTE-' + Date.now(), // Auto-generate route ID
      name: document.getElementById('newRouteName').value,
      areas: areasInput ? areasInput.split(',').map(a => a.trim()).filter(Boolean) : [],
      path: {
        coordinates: routeLocations
      },
      notes: document.getElementById('newRouteNotes').value,
      status: 'planned',
      expiresAt: expiresAtValue ? new Date(expiresAtValue).toISOString() : null,
      isExpired: false
    };
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetchWithRetry(`${API_URL}/routes`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(routeData)
      });
      
      if (response.ok) {
        closeModal();
        showToast('Route added successfully!', 'success');
        clearTempMarkers();
        showRoutesManagement();
      } else {
        const error = await response.json();
        showToast(error.error || 'Failed to add route', 'error');
      }
    } catch (error) {
      showToast('Error adding route: ' + error.message, 'error');
    }
  });
};

window.openMapPicker = function() {
  // Create map picker modal
  const mapModal = document.createElement('div');
  mapModal.id = 'mapPickerModal';
  mapModal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 animate-fade-in';

  mapModal.innerHTML = `
    <div class="bg-white rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col lg:flex-row overflow-hidden shadow-2xl">
      <!-- Left Panel: Map -->
      <div class="flex-1 flex flex-col min-h-0">
        <!-- Map Header -->
        <div class="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-primary-50 to-white">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center shadow-sm">
              <i data-lucide="map-pin" class="w-5 h-5 text-white"></i>
            </div>
            <div>
              <h2 class="text-lg font-bold text-gray-800">Select Collection Points</h2>
              <p class="text-sm text-gray-500">Click anywhere on the map to add a location</p>
            </div>
          </div>
        </div>
        <!-- Map Container -->
        <div id="mapPickerContainer" class="flex-1 relative"></div>
      </div>

      <!-- Right Panel: Locations List -->
      <div class="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-gray-200 flex flex-col bg-gray-50 max-h-[40vh] lg:max-h-none">
        <!-- Panel Header -->
        <div class="px-4 py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <i data-lucide="list" class="w-5 h-5"></i>
              <h3 class="font-semibold">Added Locations</h3>
            </div>
            <span id="locationCount" class="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">0 points</span>
          </div>
        </div>

        <!-- Locations List -->
        <div id="pickerLocationsList" class="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div class="flex flex-col items-center justify-center py-8 text-gray-400">
            <div class="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-3">
              <i data-lucide="map-pin-off" class="w-8 h-8 opacity-50"></i>
            </div>
            <p class="text-sm font-medium">No locations yet</p>
            <p class="text-xs mt-1">Click on the map to add points</p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="p-4 border-t border-gray-200 bg-white space-y-2">
          <button
            onclick="saveAndCloseMapPicker()"
            class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <i data-lucide="check" class="w-5 h-5"></i>
            <span>Save Locations</span>
          </button>
          <div class="flex gap-2">
            <button
              onclick="clearPickerLocations()"
              class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-xl transition-all duration-200 border border-red-200"
            >
              <i data-lucide="trash-2" class="w-4 h-4"></i>
              <span>Clear All</span>
            </button>
            <button
              onclick="closeMapPicker()"
              class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all duration-200"
            >
              <i data-lucide="x" class="w-4 h-4"></i>
              <span>Cancel</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Add modal to DOM
  document.body.appendChild(mapModal);

  // Re-initialize Lucide icons after adding to DOM
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // Create a new map instance for the picker
  setTimeout(() => {
    const pickerMap = L.map('mapPickerContainer').setView(MATI_CENTER, 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(pickerMap);
    
    // Add city boundary
    L.rectangle(MATI_BOUNDS, {
      color: '#667eea',
      weight: 2,
      fillOpacity: 0,
      dashArray: '5, 5'
    }).addTo(pickerMap);
    
    // Store markers and paths for the picker
    window.pickerMarkers = [];
    window.pickerPaths = [];

    // Add existing locations with road paths
    const loadExistingLocations = async () => {
      for (let i = 0; i < routeLocations.length; i++) {
        const loc = routeLocations[i];
        const isFirst = i === 0;

        // Create custom marker
        const markerHtml = `
          <div class="flex items-center justify-center w-8 h-8 rounded-full shadow-lg ${isFirst ? 'bg-green-500' : 'bg-primary-500'} text-white font-bold text-sm border-2 border-white">
            ${isFirst ? '<i data-lucide="play" class="w-4 h-4"></i>' : i + 1}
          </div>
        `;

        const customIcon = L.divIcon({
          html: markerHtml,
          className: 'custom-route-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker([loc[1], loc[0]], { icon: customIcon }).addTo(pickerMap);
        marker.bindPopup(`<div class="p-2"><p class="font-bold">${isFirst ? 'Start Point' : `Point ${i + 1}`}</p></div>`);
        window.pickerMarkers.push(marker);

        // Draw road path from previous point
        if (i > 0) {
          const prevLoc = routeLocations[i - 1];
          await drawRoadPath(pickerMap, prevLoc, loc);
        }
      }

      // Re-initialize Lucide icons
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    };

    if (routeLocations.length > 0) {
      loadExistingLocations();
    }

    // Handle map clicks
    pickerMap.on('click', async (e) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;

      // Validate bounds
      if (lat < 6.85 || lat > 7.05 || lng < 126.10 || lng > 126.35) {
        showToast('Please click within Mati City boundaries!', 'warning');
        return;
      }

      const pointIndex = routeLocations.length;
      routeLocations.push([lng, lat]);

      // Create custom marker
      const isFirst = pointIndex === 0;
      const markerHtml = `
        <div class="flex items-center justify-center w-8 h-8 rounded-full shadow-lg ${isFirst ? 'bg-green-500' : 'bg-primary-500'} text-white font-bold text-sm border-2 border-white">
          ${isFirst ? '<i data-lucide="play" class="w-4 h-4"></i>' : pointIndex + 1}
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-route-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(pickerMap);
      marker.bindPopup(`
        <div class="p-2">
          <p class="font-bold">${isFirst ? 'Start Point' : `Point ${pointIndex + 1}`}</p>
          <p class="text-xs text-gray-500 mt-1">Lat: ${lat.toFixed(6)}</p>
          <p class="text-xs text-gray-500">Lng: ${lng.toFixed(6)}</p>
        </div>
      `).openPopup();
      window.pickerMarkers.push(marker);

      // Draw road path from previous point
      if (routeLocations.length > 1) {
        const prevLoc = routeLocations[routeLocations.length - 2];
        await drawRoadPath(pickerMap, prevLoc, [lng, lat]);
      }

      // Re-initialize Lucide icons
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }

      updatePickerLocationsList();
    });

    // Initial update of locations list
    updatePickerLocationsList();

    // Store map instance for cleanup
    window.pickerMapInstance = pickerMap;
  }, 100);
};

// Draw road path between two points using Leaflet Routing Machine
async function drawRoadPath(mapInstance, fromCoord, toCoord) {
  return new Promise((resolve) => {
    try {
      // Use Leaflet Routing Machine for road path
      const routingControl = L.Routing.control({
        waypoints: [
          L.latLng(fromCoord[1], fromCoord[0]),
          L.latLng(toCoord[1], toCoord[0])
        ],
        router: L.Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1',
          timeout: 10000
        }),
        lineOptions: {
          styles: [
            { color: '#1e3a1e', weight: 7, opacity: 0.3 },
            { color: '#22c55e', weight: 4, opacity: 0.9 }
          ],
          extendToWaypoints: false,
          missingRouteTolerance: 0
        },
        show: false,
        addWaypoints: false,
        routeWhileDragging: false,
        fitSelectedRoutes: false,
        showAlternatives: false,
        createMarker: () => null // Don't create default markers
      }).addTo(mapInstance);

      // Store the routing control to remove later
      window.pickerPaths.push(routingControl);

      // Hide the routing instructions panel
      routingControl.on('routesfound', (e) => {
        // Hide the itinerary container
        const container = routingControl.getContainer();
        if (container) {
          container.style.display = 'none';
        }
        resolve(true);
      });

      routingControl.on('routingerror', (e) => {
        console.warn('Routing error:', e.error);
        mapInstance.removeControl(routingControl);
        // Remove from pickerPaths
        const idx = window.pickerPaths.indexOf(routingControl);
        if (idx > -1) window.pickerPaths.splice(idx, 1);
        // Fallback to straight line
        drawStraightLine(mapInstance, fromCoord, toCoord);
        resolve(false);
      });

      // Timeout fallback
      setTimeout(() => {
        resolve(true);
      }, 5000);

    } catch (error) {
      console.warn('Routing setup failed:', error);
      drawStraightLine(mapInstance, fromCoord, toCoord);
      resolve(false);
    }
  });
}

// Fallback straight line
function drawStraightLine(mapInstance, fromCoord, toCoord) {
  // Draw shadow
  const shadow = L.polyline([[fromCoord[1], fromCoord[0]], [toCoord[1], toCoord[0]]], {
    color: '#1e3a1e',
    weight: 6,
    opacity: 0.3
  }).addTo(mapInstance);
  window.pickerPaths.push(shadow);

  // Draw main line (dashed to indicate it's not a real road path)
  const line = L.polyline([[fromCoord[1], fromCoord[0]], [toCoord[1], toCoord[0]]], {
    color: '#22c55e',
    weight: 3,
    dashArray: '10, 6',
    opacity: 0.9
  }).addTo(mapInstance);
  window.pickerPaths.push(line);
}

// Update locations list in picker modal
function updatePickerLocationsList() {
  const listContainer = document.getElementById('pickerLocationsList');
  const countElement = document.getElementById('locationCount');

  if (!listContainer) return;

  if (routeLocations.length === 0) {
    listContainer.innerHTML = `
      <div class="flex flex-col items-center justify-center py-8 text-gray-400">
        <div class="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-3">
          <i data-lucide="map-pin-off" class="w-8 h-8 opacity-50"></i>
        </div>
        <p class="text-sm font-medium">No locations yet</p>
        <p class="text-xs mt-1">Click on the map to add points</p>
      </div>
    `;
    if (countElement) countElement.textContent = '0 points';
  } else {
    if (countElement) countElement.textContent = `${routeLocations.length} point${routeLocations.length > 1 ? 's' : ''}`;

    listContainer.innerHTML = routeLocations.map((loc, index) => `
      <div class="bg-white rounded-xl p-3 mb-2 border-l-4 border-primary-500 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div class="flex justify-between items-start gap-2">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold">${index + 1}</span>
              <span class="font-semibold text-gray-800 text-sm">Point ${index + 1}</span>
            </div>
            <div class="text-xs text-gray-500 font-mono pl-8">
              <div>Lat: ${loc[1].toFixed(6)}</div>
              <div>Lng: ${loc[0].toFixed(6)}</div>
            </div>
          </div>
          <button
            onclick="removePickerLocation(${index})"
            class="flex-shrink-0 w-7 h-7 bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 rounded-lg flex items-center justify-center transition-colors duration-200"
            title="Remove location"
          >
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    `).join('');
  }

  // Re-initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// Remove location from picker
window.removePickerLocation = async function(index) {
  routeLocations.splice(index, 1);

  // Clear existing markers and paths
  clearPickerMarkersAndPaths();

  // Redraw all locations with road paths
  if (window.pickerMapInstance && routeLocations.length > 0) {
    for (let i = 0; i < routeLocations.length; i++) {
      const loc = routeLocations[i];
      const isFirst = i === 0;

      // Create custom marker
      const markerHtml = `
        <div class="flex items-center justify-center w-8 h-8 rounded-full shadow-lg ${isFirst ? 'bg-green-500' : 'bg-primary-500'} text-white font-bold text-sm border-2 border-white">
          ${isFirst ? '<i data-lucide="play" class="w-4 h-4"></i>' : i + 1}
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-route-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([loc[1], loc[0]], { icon: customIcon }).addTo(window.pickerMapInstance);
      marker.bindPopup(`<div class="p-2"><p class="font-bold">${isFirst ? 'Start Point' : `Point ${i + 1}`}</p></div>`);
      window.pickerMarkers.push(marker);

      // Draw road path from previous point
      if (i > 0) {
        const prevLoc = routeLocations[i - 1];
        await drawRoadPath(window.pickerMapInstance, prevLoc, loc);
      }
    }

    // Re-initialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  updatePickerLocationsList();
};

// Helper function to clear all picker markers and paths
function clearPickerMarkersAndPaths() {
  if (window.pickerMarkers) {
    window.pickerMarkers.forEach(m => {
      if (window.pickerMapInstance) {
        try {
          window.pickerMapInstance.removeLayer(m);
        } catch (e) {}
      }
    });
    window.pickerMarkers = [];
  }
  if (window.pickerPaths) {
    window.pickerPaths.forEach(p => {
      if (window.pickerMapInstance) {
        try {
          // Check if it's a routing control or a regular layer
          if (p.remove) {
            p.remove();
          } else if (p._map) {
            window.pickerMapInstance.removeLayer(p);
          } else {
            window.pickerMapInstance.removeControl(p);
          }
        } catch (e) {
          try {
            window.pickerMapInstance.removeLayer(p);
          } catch (e2) {}
        }
      }
    });
    window.pickerPaths = [];
  }
}

// Clear all locations in picker
window.clearPickerLocations = async function() {
  if (routeLocations.length === 0) return;

  if (!await showConfirm('Clear Locations', 'Clear all locations?')) return;

  routeLocations = [];

  // Clear markers and paths
  clearPickerMarkersAndPaths();

  updatePickerLocationsList();
};

// Save and close map picker
window.saveAndCloseMapPicker = function() {
  if (routeLocations.length < 2) {
    showToast('Please add at least 2 locations for the route', 'warning');
    return;
  }
  
  closeMapPicker();
  updateLocationsList();
  showToast(`${routeLocations.length} locations saved!`, 'success');
};

window.closeMapPicker = function() {
  const modal = document.getElementById('mapPickerModal');
  if (modal) {
    if (window.pickerMapInstance) {
      window.pickerMapInstance.remove();
      window.pickerMapInstance = null;
    }
    modal.remove();
  }
};

// Removed onMapClick - using modal map picker instead

function updateLocationsList() {
  const container = document.getElementById('locationsList');
  const counterContainer = document.getElementById('locationCounter');
  const counterText = document.getElementById('locationCountText');

  if (!container) return;

  if (routeLocations.length === 0) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center py-6 text-gray-400">
        <i data-lucide="map-pin-off" class="w-10 h-10 mb-2 opacity-50"></i>
        <p class="text-sm">No locations added yet</p>
        <p class="text-xs mt-1">Click the button below to add collection points</p>
      </div>
    `;
    if (counterContainer) counterContainer.classList.add('hidden');
  } else {
    container.innerHTML = `
      <div class="space-y-2">
        ${routeLocations.map((loc, index) => `
          <div class="bg-white rounded-lg p-3 border border-gray-200 hover:border-primary-300 transition-colors duration-200">
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-3 flex-1 min-w-0">
                <span class="flex-shrink-0 w-7 h-7 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold">${index + 1}</span>
                <div class="min-w-0">
                  <p class="text-sm font-medium text-gray-800 truncate">Point ${index + 1}</p>
                  <p class="text-xs text-gray-500 font-mono">${loc[1].toFixed(5)}, ${loc[0].toFixed(5)}</p>
                </div>
              </div>
              <button
                onclick="removeLocation(${index})"
                class="flex-shrink-0 w-7 h-7 bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 rounded-lg flex items-center justify-center transition-colors duration-200"
                title="Remove location"
              >
                <i data-lucide="x" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    if (counterContainer) {
      counterContainer.classList.remove('hidden');
      if (counterText) counterText.textContent = `${routeLocations.length} location${routeLocations.length > 1 ? 's' : ''} added`;
    }
  }

  // Re-initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

window.removeLocation = function(index) {
  routeLocations.splice(index, 1);
  clearTempMarkers();
  
  // Redraw markers and lines
  routeLocations.forEach((loc, i) => {
    const marker = L.circleMarker([loc[1], loc[0]], {
      radius: 8,
      fillColor: '#667eea',
      color: '#fff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8
    }).addTo(map);
    
    marker.bindPopup(`Location ${i + 1}<br>Lat: ${loc[1].toFixed(6)}<br>Lng: ${loc[0].toFixed(6)}`);
    tempMarkers.push(marker);
    
    if (i > 0) {
      const line = L.polyline([routeLocations[i-1], routeLocations[i]].map(c => [c[1], c[0]]), {
        color: '#667eea',
        weight: 3,
        opacity: 0.7
      }).addTo(map);
      tempMarkers.push(line);
    }
  });
  
  updateLocationsList();
};

window.clearLocations = async function() {
  if (routeLocations.length > 0 && !await showConfirm('Clear Locations', 'Clear all locations?')) {
    return;
  }
  routeLocations = [];
  clearTempMarkers();
  updateLocationsList();
};

function clearTempMarkers() {
  tempMarkers.forEach(item => {
    try {
      // Check if it's a routing control
      if (item.getPlan) {
        map.removeControl(item);
      } else if (item.remove) {
        item.remove();
      } else {
        map.removeLayer(item);
      }
    } catch (e) {
      try {
        map.removeLayer(item);
      } catch (e2) {}
    }
  });
  tempMarkers = [];
}

window.cancelAddRoute = function() {
  closeMapPicker();
  clearTempMarkers();
  routeLocations = [];
  showRoutesManagement();
};

window.viewRoute = async function(routeId) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetchWithRetry(`${API_URL}/routes/${routeId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const route = await response.json();

    // Close any existing panels and modals
    closeModal();
    closeLiveTrackingPanel();

    // Switch to map view
    showMapView();

    // Update sidebar to show Routes is active
    setActiveSidebarButton('routesManagementBtn');

    // Display route on map with Leaflet Routing Machine
    if (route.path && route.path.coordinates && route.path.coordinates.length >= 2) {
      clearTempMarkers();

      const coords = route.path.coordinates; // [lng, lat] format

      // Show loading toast
      showToast('Loading route path...', 'info');

      // Convert coordinates to Leaflet LatLng waypoints
      const waypoints = coords.map(c => L.latLng(c[1], c[0]));

      // Add markers for each collection point first
      coords.forEach((coord, index) => {
        const isStart = index === 0;
        const isEnd = index === coords.length - 1;

        // Create custom icon
        const markerHtml = `
          <div class="flex items-center justify-center w-8 h-8 rounded-full shadow-lg ${isStart ? 'bg-green-500' : isEnd ? 'bg-red-500' : 'bg-primary-500'} text-white font-bold text-sm border-2 border-white">
            ${isStart ? '<i data-lucide="play" class="w-4 h-4"></i>' : isEnd ? '<i data-lucide="flag" class="w-4 h-4"></i>' : index}
          </div>
        `;

        const customIcon = L.divIcon({
          html: markerHtml,
          className: 'custom-route-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker([coord[1], coord[0]], { icon: customIcon }).addTo(map);
        marker.bindPopup(`
          <div class="p-2">
            <p class="font-bold text-gray-800">${isStart ? 'Start Point' : isEnd ? 'End Point' : `Point ${index}`}</p>
            <p class="text-xs text-gray-500 mt-1">Lat: ${coord[1].toFixed(6)}</p>
            <p class="text-xs text-gray-500">Lng: ${coord[0].toFixed(6)}</p>
          </div>
        `);
        tempMarkers.push(marker);
      });

      // Use Leaflet Routing Machine for road path
      const routingControl = L.Routing.control({
        waypoints: waypoints,
        router: L.Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1',
          timeout: 15000
        }),
        lineOptions: {
          styles: [
            { color: '#1e1b4b', weight: 8, opacity: 0.3 },
            { color: '#4f46e5', weight: 5, opacity: 0.9 }
          ],
          extendToWaypoints: false,
          missingRouteTolerance: 0
        },
        show: false,
        addWaypoints: false,
        routeWhileDragging: false,
        fitSelectedRoutes: true,
        showAlternatives: false,
        createMarker: () => null
      }).addTo(map);

      tempMarkers.push(routingControl);

      // Handle route found
      routingControl.on('routesfound', (e) => {
        const routes = e.routes;
        if (routes && routes.length > 0) {
          const summary = routes[0].summary;
          const distanceKm = (summary.totalDistance / 1000).toFixed(2);
          const durationMin = Math.round(summary.totalTime / 60);

          // Hide the routing container
          const container = routingControl.getContainer();
          if (container) container.style.display = 'none';

          // Show route info panel
          showRouteInfoPanel(route, distanceKm, durationMin, coords.length);
        }

        // Re-initialize Lucide icons
        if (typeof lucide !== 'undefined') {
          setTimeout(() => lucide.createIcons(), 100);
        }
      });

      // Handle routing error - fallback to straight lines
      routingControl.on('routingerror', (e) => {
        console.warn('Routing error, using straight lines:', e.error);
        map.removeControl(routingControl);

        // Draw fallback straight lines
        const latLngCoords = coords.map(c => [c[1], c[0]]);
        const line = L.polyline(latLngCoords, {
          color: '#4f46e5',
          weight: 4,
          dashArray: '10, 10',
          opacity: 0.8
        }).addTo(map);
        tempMarkers.push(line);

        map.fitBounds(line.getBounds(), { padding: [50, 50] });
        showRouteInfoPanel(route, route.distance ? (route.distance / 1000).toFixed(2) : '-', '-', coords.length);
        showToast('Using straight-line path (road routing unavailable)', 'warning');

        // Re-initialize Lucide icons
        if (typeof lucide !== 'undefined') {
          setTimeout(() => lucide.createIcons(), 100);
        }
      });

    } else {
      showToast('Route has no coordinates to display', 'warning');
    }
  } catch (error) {
    showToast('Error loading route: ' + error.message, 'error');
  }
};

// Show route information panel on the map
function showRouteInfoPanel(route, distanceKm, durationMin, pointCount) {
  // Remove existing panel if any
  const existingPanel = document.getElementById('routeInfoPanel');
  if (existingPanel) existingPanel.remove();

  const panel = document.createElement('div');
  panel.id = 'routeInfoPanel';
  panel.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 lg:left-auto lg:right-4 lg:translate-x-0 bg-white rounded-2xl shadow-2xl p-4 z-[1000] w-[90%] max-w-md animate-fade-in';
  panel.innerHTML = `
    <div class="flex items-start justify-between gap-4">
      <div class="flex-1">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
            <i data-lucide="route" class="w-5 h-5 text-primary-600"></i>
          </div>
          <div>
            <h3 class="font-bold text-gray-800">${escapeHtml(route.name || 'Unnamed Route')}</h3>
            <p class="text-xs text-gray-500">${escapeHtml(route.routeId)}</p>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-3 mt-3">
          <div class="bg-gray-50 rounded-lg p-2 text-center">
            <p class="text-lg font-bold text-primary-600">${distanceKm}</p>
            <p class="text-xs text-gray-500">km</p>
          </div>
          <div class="bg-gray-50 rounded-lg p-2 text-center">
            <p class="text-lg font-bold text-primary-600">${durationMin}</p>
            <p class="text-xs text-gray-500">mins</p>
          </div>
          <div class="bg-gray-50 rounded-lg p-2 text-center">
            <p class="text-lg font-bold text-primary-600">${pointCount}</p>
            <p class="text-xs text-gray-500">stops</p>
          </div>
        </div>

        <div class="flex items-center gap-2 mt-3 text-xs text-gray-500">
          <span class="flex items-center gap-1">
            <span class="w-3 h-3 bg-green-500 rounded-full"></span> Start
          </span>
          <span class="flex items-center gap-1">
            <span class="w-3 h-3 bg-primary-500 rounded-full"></span> Stops
          </span>
          <span class="flex items-center gap-1">
            <span class="w-3 h-3 bg-red-500 rounded-full"></span> End
          </span>
        </div>
      </div>

      <button onclick="closeRouteInfoPanel(); showPageContent(); showRoutesManagement();" class="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0" title="Close">
        <i data-lucide="x" class="w-5 h-5 text-gray-500"></i>
      </button>
    </div>

    <div class="flex gap-2 mt-3">
      <button onclick="closeRouteInfoPanel(); showPageContent(); showRoutesManagement();" class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors">
        <i data-lucide="arrow-left" class="w-4 h-4"></i>
        Back to Routes
      </button>
      <button onclick="closeRouteInfoPanel(); createScheduleFromRoute('${route._id || route.routeId}', '${(route.name || 'Unnamed Route').replace(/'/g, "\\'")}', '${route.assignedDriver || ''}', '${route.assignedVehicle || ''}')" class="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl transition-colors" title="Create Schedule">
        <i data-lucide="calendar-plus" class="w-4 h-4"></i>
      </button>
    </div>
  `;

  document.body.appendChild(panel);

  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// Close route info panel
window.closeRouteInfoPanel = function() {
  const panel = document.getElementById('routeInfoPanel');
  if (panel) panel.remove();
  clearTempMarkers();
};

// Create schedule from route - pre-fills the schedule form with route data
window.createScheduleFromRoute = async function(routeId, routeName, assignedDriver, assignedVehicle) {
  try {
    // Navigate to schedules management first
    await showScheduleManagement();

    // Wait for the modal elements to be ready
    setTimeout(() => {
      // Open the add schedule form
      showAddScheduleForm();

      // Pre-fill the form fields
      setTimeout(() => {
        const scheduleNameInput = document.getElementById('scheduleName');
        const scheduleRouteIdInput = document.getElementById('scheduleRouteId');
        const scheduleDriverInput = document.getElementById('scheduleDriver');
        const scheduleVehicleInput = document.getElementById('scheduleVehicle');

        if (scheduleNameInput) scheduleNameInput.value = `Schedule for ${routeName}`;
        if (scheduleRouteIdInput) scheduleRouteIdInput.value = routeId;
        if (scheduleDriverInput && assignedDriver) scheduleDriverInput.value = assignedDriver;
        if (scheduleVehicleInput && assignedVehicle) scheduleVehicleInput.value = assignedVehicle;

        showToast('Schedule form pre-filled with route data', 'success');
      }, 100);
    }, 300);
  } catch (error) {
    console.error('Error creating schedule from route:', error);
    showToast('Error opening schedule form', 'error');
  }
};

// Route Optimization UI - Enhanced with OSRM support
// Route optimization functionality removed

window.deleteRoute = async function(routeId) {
  if (!await showConfirm('Delete Route', 'Are you sure you want to delete this route?')) {
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetchWithRetry(`${API_URL}/routes/${routeId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      showToast('Route deleted successfully!', 'success');
      showRoutesManagement();
    } else {
      const error = await response.json();
      showToast(error.error || 'Failed to delete route', 'error');
    }
  } catch (error) {
    showToast('Error deleting route: ' + error.message, 'error');
  }
};


window.unassignRoute = async function(routeId) {
  if (!await showConfirm('Unassign Route', 'Are you sure you want to unassign this route? The driver will no longer see this route in their dashboard.')) {
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetchWithRetry(`${API_URL}/routes/${routeId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        assignedDriver: null,
        status: 'planned'
      })
    });
    
    if (response.ok) {
      showToast('Route unassigned successfully!', 'success');
      showRoutesManagement();
    } else {
      const error = await response.json();
      showToast(error.error || 'Failed to unassign route', 'error');
    }
  } catch (error) {
    showToast('Error unassigning route: ' + error.message, 'error');
  }
};

window.assignRouteToDriver = async function(routeId) {
  try {
    const token = localStorage.getItem('token');
    const headers = {
      'Authorization': `Bearer ${token}`
    };
    
    const [routeRes, usersRes] = await Promise.all([
      fetch(`${API_URL}/routes/${routeId}`, { headers }),
      fetch(`${API_URL}/users`, { headers })
    ]);
    
    const route = await routeRes.json();
    const users = await usersRes.json();
    const drivers = users.filter(u => u.role === 'driver');
    
    // Check if route is already assigned
    if (route.assignedDriver) {
      const assignedDriverInfo = drivers.find(d => d.username === route.assignedDriver);
      const driverName = assignedDriverInfo ? assignedDriverInfo.fullName : route.assignedDriver;
      
      showModal('Route Already Assigned', `
        <div class="space-y-4">
          <div class="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <i data-lucide="alert-triangle" class="w-5 h-5 text-amber-500"></i>
            <span class="text-amber-700 font-medium">This route is already assigned!</span>
          </div>
          <div class="bg-gray-50 p-4 rounded-xl space-y-2">
            <p class="text-sm"><span class="font-medium text-gray-500">Route:</span> <span class="text-gray-800">${escapeHtml(route.routeId)} - ${escapeHtml(route.name)}</span></p>
            <p class="text-sm"><span class="font-medium text-gray-500">Assigned to:</span> <span class="text-gray-800">${escapeHtml(driverName)}</span></p>
            <p class="text-sm flex items-center gap-2">
              <span class="font-medium text-gray-500">Status:</span>
              <span class="px-2 py-0.5 rounded-full text-xs font-medium ${route.status === 'active' ? 'bg-amber-100 text-amber-700' : route.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}">${route.status}</span>
            </p>
          </div>
          <p class="text-sm text-gray-600">
            Ang route na ito ay naka-assign na kay <strong class="text-gray-800">${escapeHtml(driverName)}</strong>.
            Pwede mo itong i-unassign kung gusto mong i-assign sa ibang driver.
          </p>
          <div class="p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <p class="text-sm text-blue-700 flex items-center gap-2">
              <i data-lucide="info" class="w-4 h-4"></i>
              Click "Unassign Route" to remove the current driver assignment.
            </p>
          </div>
          <div class="flex gap-3 pt-2">
            <button onclick="unassignRoute('${routeId}')" class="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl transition-colors">
              Unassign Route
            </button>
            <button onclick="closeModal()" class="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors">
              Close
            </button>
          </div>
        </div>
      `);
      return;
    }
    
    // Filter out unavailable drivers
    const availableDrivers = drivers.filter(d => d.availability !== 'unavailable');
    const driverOptions = availableDrivers.map(d => {
      const statusBadge = d.availability === 'on-break' ? ' [On Break]' : '';
      return `<option value="${escapeHtml(d.username)}">${escapeHtml(d.fullName)} (${escapeHtml(d.username)})${statusBadge}</option>`;
    }).join('');
    
    showModal('Assign Route to Driver', `
      <form id="assignRouteForm" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Route</label>
          <input type="text" value="${escapeHtml(route.routeId)} - ${escapeHtml(route.name)}" disabled
            class="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Select Driver *</label>
          <select id="assignRouteDriverSelect" required
            class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
            <option value="">-- Select Driver --</option>
            ${driverOptions}
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Update Status</label>
          <select id="assignRouteStatus"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
            <option value="active" ${route.status === 'active' ? 'selected' : ''}>Active</option>
            <option value="planned" ${route.status === 'planned' ? 'selected' : ''}>Planned</option>
            <option value="completed" ${route.status === 'completed' ? 'selected' : ''}>Completed</option>
          </select>
        </div>
        <div class="flex gap-3 pt-4">
          <button type="submit" class="flex-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors">
            Assign Route
          </button>
          <button type="button" onclick="closeModal()" class="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors">
            Cancel
          </button>
        </div>
      </form>
    `);
    
    document.getElementById('assignRouteForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const selectedDriver = document.getElementById('assignRouteDriverSelect').value;
      const status = document.getElementById('assignRouteStatus').value;
      
      if (!selectedDriver) {
        showToast('Please select a driver', 'warning');
        return;
      }
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetchWithRetry(`${API_URL}/routes/${routeId}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            assignedDriver: selectedDriver,
            status: status
          })
        });
        
        if (response.ok) {
          closeModal();
          showToast('Route assigned successfully!', 'success');
          showRoutesManagement();
        } else {
          const error = await response.json();
          showToast(error.error || 'Failed to assign route', 'error');
        }
      } catch (error) {
        showToast('Error assigning route: ' + error.message, 'error');
      }
    });
  } catch (error) {
    showToast('Error loading data: ' + error.message, 'error');
  }
};



  // Expose on window
  window.showRoutesManagement = showRoutesManagement;
  window.renderRoutesTable = renderRoutesTable;
  window.clearTempMarkers = clearTempMarkers;

})();