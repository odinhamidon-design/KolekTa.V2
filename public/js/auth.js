/**
 * Kolek-Ta Auth Module
 * Authentication, initialization, sidebar navigation, dashboard.
 */
(function() {
  'use strict';

// Check authentication
const token = localStorage.getItem('token');
// NOTE: Do NOT create a local `user` const — use App.user as single source of truth
// to avoid stale references after profile updates.

if (!token) {
  window.location.href = 'login.html';
}

// Initialize after DOM is loaded
function initializeApp() {
  // Update header user info
  const headerProfilePic = document.getElementById('headerProfilePic');
  const headerUserName = document.getElementById('headerUserName');
  if (headerProfilePic) {
    headerProfilePic.textContent = (App.user.fullName || App.user.username || 'U').charAt(0).toUpperCase();
  }
  if (headerUserName) {
    headerUserName.textContent = App.user.fullName || App.user.username || 'User';
  }

  // Show/hide panels based on role
  if (App.user.role === 'admin') {
    // Show admin controls panel
    const adminControls = document.getElementById('adminControls');
    if (adminControls) {
      adminControls.classList.remove('hidden');
    }
    // Create permanent notification icon after a small delay to ensure DOM is ready
    setTimeout(() => {
      createNotificationIcon();
      // Start checking for notifications (store handles for cleanup on logout)
      checkCompletionNotifications();
      App.intervals.notificationCheck = setInterval(checkCompletionNotifications, 30000);

      // Start checking for new complaints
      checkNewComplaints();
      App.intervals.complaintCheck = setInterval(checkNewComplaints, 30000);

      // Show dashboard by default for admins
      showDashboard();
    }, 100);
  } else if (App.user.role === 'driver') {
    // Check if desktop view (lg breakpoint = 1024px)
    const isDesktop = window.innerWidth >= 1024;

    if (isDesktop) {
      // Hide sidebar for drivers on desktop - full map experience
      const sidebar = document.querySelector('aside');
      if (sidebar) {
        sidebar.classList.add('lg:hidden');
      }

      // Show driver overlay controls
      const driverWebOverlay = document.getElementById('driverWebOverlay');
      const driverAssignmentsOverlay = document.getElementById('driverAssignmentsOverlay');
      const driverStatsOverlay = document.getElementById('driverStatsOverlay');

      if (driverWebOverlay) {
        driverWebOverlay.classList.remove('hidden');
        driverWebOverlay.classList.add('block');
      }
      if (driverAssignmentsOverlay) driverAssignmentsOverlay.classList.remove('hidden');
      if (driverStatsOverlay) driverStatsOverlay.classList.remove('hidden');

      // Load driver data into overlays
      setTimeout(() => {
        if (typeof loadDriverAssignmentsOverlay === 'function') loadDriverAssignmentsOverlay();
        if (typeof updateDriverOverlayStats === 'function') updateDriverOverlayStats();
      }, 100);
    } else {
      // Mobile view - use existing sidebar/mobile nav
      const driverPanel = document.getElementById('driverPanel');
      const driverHistoryPanel = document.getElementById('driverHistoryPanel');
      const gpsButtonContainer = document.getElementById('gpsButtonContainer');

      if (driverPanel) {
        driverPanel.classList.remove('hidden');
        setTimeout(() => {
          loadDriverAssignments();
          updateDriverQuickStats();
        }, 100);
      }
      if (driverHistoryPanel) {
        driverHistoryPanel.classList.remove('hidden');
      }
      if (gpsButtonContainer) {
        gpsButtonContainer.classList.remove('hidden');
      }
    }

    // Show mobile driver navigation (for mobile only)
    const mobileDriverNav = document.getElementById('mobileDriverNav');
    if (mobileDriverNav) {
      mobileDriverNav.classList.remove('hidden');
      initMobileDriverNav();
    }

    // Show mobile driver overlay (minimal status bar at top)
    const mobileDriverOverlay = document.getElementById('mobileDriverOverlay');
    if (mobileDriverOverlay && !isDesktop) {
      mobileDriverOverlay.classList.remove('hidden');
      // Sync mobile overlay state
      setTimeout(() => {
        if (typeof syncMobileOverlay === 'function') syncMobileOverlay();
      }, 200);
    }
  }

  // Reinitialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// NOTE: initializeApp() and loadHeaderProfilePicture() are called from app-init.js
// (loaded last, after all modules and app.js are ready)

function logout() {
  // Clear all tracked intervals to prevent memory leaks
  Object.keys(App.intervals).forEach(key => {
    clearInterval(App.intervals[key]);
    delete App.intervals[key];
  });
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}

// Add authorization header to internal API fetch requests only
const originalFetch = window.fetch;
window.fetch = async function(...args) {
  const url = args[0];

  // Check if this is an external URL (not our API)
  const isExternalUrl = typeof url === 'string' && (
    url.startsWith('http://') ||
    url.startsWith('https://')
  ) && !url.includes(window.location.host) && !url.startsWith(App.API_URL);

  // Only add Authorization header for internal API calls
  if (!isExternalUrl) {
    const token = localStorage.getItem('token'); // Get fresh token each time

    if (args[1]) {
      args[1].headers = {
        ...args[1].headers,
        'Authorization': `Bearer ${token}`
      };
    } else {
      args[1] = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
    }
  }

  const response = await originalFetch.apply(this, args);

  // If unauthorized on internal API, redirect to login
  if (!isExternalUrl && (response.status === 401 || response.status === 403)) {
    console.error('Authentication failed - redirecting to login');
    showAlertModal('Session Expired', 'Your session has expired. Please login again.', 'warning', () => {
      window.location.href = 'login.html';
    });
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
  }

  return response;
};


// Dashboard (Admin only)
document.getElementById('dashboardBtn').addEventListener('click', () => {
  showDashboard();
});

// User Management (Admin only)
document.getElementById('userManagementBtn').addEventListener('click', () => {
  showUserManagement();
});

// Truck Management (Admin only)
document.getElementById('truckManagementBtn').addEventListener('click', () => {
  showTruckManagement();
});

// Routes Management (Admin only)
document.getElementById('routesManagementBtn').addEventListener('click', () => {
  showRoutesManagement();
});

// Live Truck Tracking (Admin only)
document.getElementById('liveTruckTrackingBtn').addEventListener('click', () => {
  showLiveTruckPanel();
});

// Completion History (Admin only)
document.getElementById('completionHistoryBtn').addEventListener('click', () => {
  showNotificationHistory();
});

// Fuel Management (Admin only)
const fuelManagementBtn = document.getElementById('fuelManagementBtn');
if (fuelManagementBtn) {
  fuelManagementBtn.addEventListener('click', () => {
    showFuelManagement();
  });
}

// Public Complaints (Admin only)
const complaintsBtn = document.getElementById('complaintsBtn');
if (complaintsBtn) {
  complaintsBtn.addEventListener('click', () => {
    showComplaints();
  });
}

// Special Pickups (Admin only)
const specialPickupsBtn = document.getElementById('specialPickupsBtn');
if (specialPickupsBtn) {
  specialPickupsBtn.addEventListener('click', () => {
    showSpecialPickupsAdmin();
  });
}

// Announcements Admin (Admin only)
const announcementsAdminBtn = document.getElementById('announcementsAdminBtn');
if (announcementsAdminBtn) {
  announcementsAdminBtn.addEventListener('click', () => {
    showAnnouncementsAdmin();
  });
}

// Collection Schedules (Admin only)
const schedulesBtn = document.getElementById('schedulesBtn');
if (schedulesBtn) {
  schedulesBtn.addEventListener('click', () => {
    showScheduleManagement();
  });
}

// Reports Module (Admin only)
const reportsBtn = document.getElementById('reportsBtn');
if (reportsBtn) {
  reportsBtn.addEventListener('click', () => {
    showReportsModule();
  });
}

// Analytics Module (Admin only)
const analyticsBtn = document.getElementById('analyticsBtn');
if (analyticsBtn) {
  analyticsBtn.addEventListener('click', () => {
    showAnalyticsModule();
  });
}

// Driver History (Driver only)
const viewDriverHistoryBtn = document.getElementById('viewDriverHistoryBtn');
if (viewDriverHistoryBtn) {
  viewDriverHistoryBtn.addEventListener('click', () => {
    showDriverHistory();
  });
}

// ============================================
// DASHBOARD
// ============================================
async function showDashboard() {
  setActiveSidebarButton('dashboardBtn');
  // Clean up live tracking panel when returning to dashboard
  const livePanel = document.getElementById('liveTrackingPanel');
  if (livePanel) livePanel.remove();
  clearTempMarkers();
  showPageContent();

  const pageContent = document.getElementById('pageContent');
  const token = localStorage.getItem('token');

  // Show loading state
  pageContent.innerHTML = `
    <div class="flex items-center justify-center h-64">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
        <p class="text-gray-500">Loading dashboard...</p>
      </div>
    </div>
  `;

  try {
    // Fetch all data in parallel
    const [usersRes, trucksRes, routesRes, trackingRes] = await Promise.all([
      fetch(`${API_URL}/users`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`${API_URL}/trucks`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`${API_URL}/routes`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`${API_URL}/tracking/active`, { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => ({ json: () => [] }))
    ]);

    const usersData = await usersRes.json().catch(() => []);
    const trucksData = await trucksRes.json().catch(() => []);
    const routesData = await routesRes.json().catch(() => []);
    const activeDriversData = await trackingRes.json().catch(() => []);

    // Ensure all data is array (API may return { error: "..." } on failure)
    const users = Array.isArray(usersData) ? usersData : [];
    const trucks = Array.isArray(trucksData) ? trucksData : [];
    const routes = Array.isArray(routesData) ? routesData : [];
    const activeDrivers = Array.isArray(activeDriversData) ? activeDriversData : [];

    // Calculate statistics
    const drivers = users.filter(u => u.role === 'driver');
    const admins = users.filter(u => u.role === 'admin');
    const activeDriverCount = activeDrivers.length;

    const availableTrucks = trucks.filter(t => t.status === 'available').length;
    const inUseTrucks = trucks.filter(t => t.status === 'in-use').length;
    const maintenanceTrucks = trucks.filter(t => t.status === 'maintenance').length;

    const plannedRoutes = routes.filter(r => r.status === 'planned').length;
    const activeRoutes = routes.filter(r => r.status === 'in-progress').length;
    const completedRoutes = routes.filter(r => r.status === 'completed').length;
    const assignedRoutes = routes.filter(r => r.assignedDriver).length;

    // Get recent completions (last 5)
    const recentCompletions = routes
      .filter(r => r.status === 'completed' && r.completedAt)
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
      .slice(0, 5);

    // Get today's date for filtering
    const today = new Date().toDateString();
    const todayCompletions = routes.filter(r =>
      r.status === 'completed' && r.completedAt && new Date(r.completedAt).toDateString() === today
    ).length;

    // Calculate total distance from completed routes
    const totalDistance = routes
      .filter(r => r.distance)
      .reduce((sum, r) => sum + (r.distance || 0), 0);

    pageContent.innerHTML = `
      <div class="space-y-6">
        <!-- Dashboard Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-800">Dashboard</h1>
            <p class="text-gray-500 mt-1">Welcome back! Here's your waste collection overview.</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-500">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <button onclick="showDashboard()" class="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Refresh">
              <i data-lucide="refresh-cw" class="w-5 h-5 text-gray-500"></i>
            </button>
          </div>
        </div>

        <!-- Stats Cards Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Trucks Card -->
          <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-500">Total Trucks</p>
                <p class="text-3xl font-bold text-gray-800 mt-1">${trucks.length}</p>
              </div>
              <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <i data-lucide="truck" class="w-6 h-6 text-blue-600"></i>
              </div>
            </div>
            <div class="mt-4 flex items-center gap-4 text-sm">
              <span class="flex items-center gap-1">
                <span class="w-2 h-2 bg-green-500 rounded-full"></span>
                <span class="text-gray-600">${availableTrucks} available</span>
              </span>
              <span class="flex items-center gap-1">
                <span class="w-2 h-2 bg-orange-500 rounded-full"></span>
                <span class="text-gray-600">${inUseTrucks} in use</span>
              </span>
            </div>
          </div>

          <!-- Drivers Card -->
          <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-500">Total Drivers</p>
                <p class="text-3xl font-bold text-gray-800 mt-1">${drivers.length}</p>
              </div>
              <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <i data-lucide="users" class="w-6 h-6 text-green-600"></i>
              </div>
            </div>
            <div class="mt-4 flex items-center gap-4 text-sm">
              <span class="flex items-center gap-1">
                <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span class="text-gray-600">${activeDriverCount} active now</span>
              </span>
              <span class="flex items-center gap-1">
                <span class="w-2 h-2 bg-purple-500 rounded-full"></span>
                <span class="text-gray-600">${admins.length} admins</span>
              </span>
            </div>
          </div>

          <!-- Routes Card -->
          <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-500">Total Routes</p>
                <p class="text-3xl font-bold text-gray-800 mt-1">${routes.length}</p>
              </div>
              <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <i data-lucide="route" class="w-6 h-6 text-purple-600"></i>
              </div>
            </div>
            <div class="mt-4 flex items-center gap-4 text-sm">
              <span class="flex items-center gap-1">
                <span class="w-2 h-2 bg-yellow-500 rounded-full"></span>
                <span class="text-gray-600">${plannedRoutes} planned</span>
              </span>
              <span class="flex items-center gap-1">
                <span class="w-2 h-2 bg-green-500 rounded-full"></span>
                <span class="text-gray-600">${completedRoutes} done</span>
              </span>
            </div>
          </div>

          <!-- Today's Progress Card -->
          <div class="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-5 shadow-sm text-white">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-primary-100">Today's Completions</p>
                <p class="text-3xl font-bold mt-1">${todayCompletions}</p>
              </div>
              <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <i data-lucide="check-circle" class="w-6 h-6"></i>
              </div>
            </div>
            <div class="mt-4 text-sm text-primary-100">
              <span>${(totalDistance / 1000).toFixed(1)} km total distance covered</span>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button onclick="showAddRouteForm()" class="flex flex-col items-center gap-2 p-4 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors group">
              <div class="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <i data-lucide="plus" class="w-5 h-5 text-white"></i>
              </div>
              <span class="text-sm font-medium text-gray-700">Add Route</span>
            </button>
            <button onclick="showAddTruckForm()" class="flex flex-col items-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors group">
              <div class="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <i data-lucide="truck" class="w-5 h-5 text-white"></i>
              </div>
              <span class="text-sm font-medium text-gray-700">Add Truck</span>
            </button>
            <button onclick="showAddUserForm()" class="flex flex-col items-center gap-2 p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors group">
              <div class="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <i data-lucide="user-plus" class="w-5 h-5 text-white"></i>
              </div>
              <span class="text-sm font-medium text-gray-700">Add Driver</span>
            </button>
            <button onclick="showLiveTruckPanel()" class="flex flex-col items-center gap-2 p-4 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors group">
              <div class="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <i data-lucide="radio" class="w-5 h-5 text-white"></i>
              </div>
              <span class="text-sm font-medium text-gray-700">Live Tracking</span>
            </button>
          </div>
        </div>

        <!-- Two Column Layout -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Route Status Overview -->
          <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-gray-800">Route Status</h2>
              <button onclick="showRoutesManagement()" class="text-sm text-primary-600 hover:text-primary-700 font-medium">View All</button>
            </div>

            <!-- Status Bars -->
            <div class="space-y-4">
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="text-sm font-medium text-gray-600">Planned</span>
                  <span class="text-sm font-bold text-yellow-600">${plannedRoutes}</span>
                </div>
                <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full bg-yellow-500 rounded-full transition-all duration-500" style="width: ${routes.length > 0 ? (plannedRoutes / routes.length * 100) : 0}%"></div>
                </div>
              </div>
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="text-sm font-medium text-gray-600">In Progress</span>
                  <span class="text-sm font-bold text-blue-600">${activeRoutes}</span>
                </div>
                <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full bg-blue-500 rounded-full transition-all duration-500" style="width: ${routes.length > 0 ? (activeRoutes / routes.length * 100) : 0}%"></div>
                </div>
              </div>
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="text-sm font-medium text-gray-600">Completed</span>
                  <span class="text-sm font-bold text-green-600">${completedRoutes}</span>
                </div>
                <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full bg-green-500 rounded-full transition-all duration-500" style="width: ${routes.length > 0 ? (completedRoutes / routes.length * 100) : 0}%"></div>
                </div>
              </div>
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="text-sm font-medium text-gray-600">Assigned</span>
                  <span class="text-sm font-bold text-purple-600">${assignedRoutes}</span>
                </div>
                <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full bg-purple-500 rounded-full transition-all duration-500" style="width: ${routes.length > 0 ? (assignedRoutes / routes.length * 100) : 0}%"></div>
                </div>
              </div>
            </div>

            <!-- Completion Rate -->
            <div class="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-600">Completion Rate</p>
                  <p class="text-2xl font-bold text-green-600">${routes.length > 0 ? Math.round(completedRoutes / routes.length * 100) : 0}%</p>
                </div>
                <div class="w-16 h-16 relative">
                  <svg class="w-16 h-16 transform -rotate-90">
                    <circle cx="32" cy="32" r="28" stroke="#e5e7eb" stroke-width="6" fill="none"></circle>
                    <circle cx="32" cy="32" r="28" stroke="#22c55e" stroke-width="6" fill="none"
                      stroke-dasharray="${routes.length > 0 ? (completedRoutes / routes.length * 175.9) : 0} 175.9"
                      stroke-linecap="round"></circle>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Activity -->
          <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-gray-800">Recent Completions</h2>
              <button onclick="showNotificationHistory()" class="text-sm text-primary-600 hover:text-primary-700 font-medium">View All</button>
            </div>

            <div class="space-y-3">
              ${recentCompletions.length > 0 ? recentCompletions.map(route => `
                <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i data-lucide="check-circle" class="w-5 h-5 text-green-600"></i>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-gray-800 truncate">${escapeHtml(route.name || route.routeId)}</p>
                    <p class="text-xs text-gray-500">
                      ${escapeHtml(route.assignedDriver || 'Unknown driver')} • ${route.completedAt ? new Date(route.completedAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <button onclick="viewRoute('${route._id || route.routeId}')" class="p-2 hover:bg-white rounded-lg transition-colors">
                    <i data-lucide="eye" class="w-4 h-4 text-gray-400"></i>
                  </button>
                </div>
              `).join('') : `
                <div class="text-center py-8 text-gray-400">
                  <i data-lucide="inbox" class="w-12 h-12 mx-auto mb-2 opacity-50"></i>
                  <p class="text-sm">No recent completions</p>
                </div>
              `}
            </div>
          </div>
        </div>

        <!-- Fleet Overview -->
        <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-800">Fleet Overview</h2>
            <button onclick="showTruckManagement()" class="text-sm text-primary-600 hover:text-primary-700 font-medium">Manage Fleet</button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            ${trucks.slice(0, 8).map(truck => `
              <div class="p-4 border border-gray-100 rounded-xl hover:border-primary-200 hover:shadow-sm transition-all">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 ${truck.status === 'available' ? 'bg-green-100' : truck.status === 'in-use' ? 'bg-orange-100' : 'bg-gray-100'} rounded-lg flex items-center justify-center">
                    <i data-lucide="truck" class="w-5 h-5 ${truck.status === 'available' ? 'text-green-600' : truck.status === 'in-use' ? 'text-orange-600' : 'text-gray-600'}"></i>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-gray-800 truncate">${escapeHtml(truck.truckId)}</p>
                    <p class="text-xs text-gray-500">${escapeHtml(truck.plateNumber || 'No plate')}</p>
                  </div>
                </div>
                <div class="mt-3 flex items-center justify-between">
                  <span class="text-xs px-2 py-1 rounded-full font-medium ${
                    truck.status === 'available' ? 'bg-green-100 text-green-700' :
                    truck.status === 'in-use' ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-700'
                  }">${truck.status}</span>
                  ${truck.assignedDriver ? `<span class="text-xs text-gray-500">${escapeHtml(truck.assignedDriver)}</span>` : ''}
                </div>
              </div>
            `).join('')}
            ${trucks.length > 8 ? `
              <button onclick="showTruckManagement()" class="p-4 border border-dashed border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all flex flex-col items-center justify-center gap-2">
                <span class="text-2xl font-bold text-gray-400">+${trucks.length - 8}</span>
                <span class="text-sm text-gray-500">more trucks</span>
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Active Drivers -->
        ${activeDriverCount > 0 ? `
        <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-800">
              <span class="inline-flex items-center gap-2">
                Active Drivers
                <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              </span>
            </h2>
            <button onclick="showLiveTruckPanel()" class="text-sm text-primary-600 hover:text-primary-700 font-medium">View on Map</button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            ${Array.isArray(activeDrivers) ? activeDrivers.map(driver => `
              <div class="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                  ${(driver.username || 'D')[0].toUpperCase()}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-gray-800">${escapeHtml(driver.username || 'Unknown')}</p>
                  <p class="text-xs text-gray-500">
                    ${driver.speed ? `${driver.speed.toFixed(1)} km/h` : 'Stationary'} • ${escapeHtml(driver.routeId || 'No route')}
                  </p>
                </div>
                <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            `).join('') : ''}
          </div>
        </div>
        ` : ''}
      </div>
    `;

    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

  } catch (error) {
    console.error('Dashboard error:', error);
    pageContent.innerHTML = `
      <div class="flex flex-col items-center justify-center h-64 text-center">
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <i data-lucide="alert-circle" class="w-8 h-8 text-red-500"></i>
        </div>
        <h3 class="text-lg font-semibold text-gray-800 mb-2">Failed to load dashboard</h3>
        <p class="text-gray-500 mb-4">${error.message}</p>
        <button onclick="showDashboard()" class="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
          Try Again
        </button>
      </div>
    `;
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
}

// Helper function to set active sidebar button
function setActiveSidebarButton(activeId) {
  const buttons = ['dashboardBtn', 'routesManagementBtn', 'liveTruckTrackingBtn', 'truckManagementBtn', 'schedulesBtn', 'completionHistoryBtn', 'userManagementBtn', 'complaintsBtn', 'specialPickupsBtn', 'announcementsAdminBtn', 'fuelManagementBtn', 'reportsBtn', 'analyticsBtn'];
  buttons.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      if (id === activeId) {
        btn.classList.add('bg-primary-100', 'text-primary-800', 'font-semibold', 'border-l-4', 'border-primary-600');
        btn.classList.remove('text-gray-700', 'bg-primary-50', 'text-primary-700');
      } else {
        btn.classList.remove('bg-primary-100', 'text-primary-800', 'font-semibold', 'border-l-4', 'border-primary-600', 'bg-primary-50', 'text-primary-700');
        btn.classList.add('text-gray-700');
      }
    }
  });
}

async function loadHeaderProfilePicture() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found, skipping profile picture load');
      return;
    }
    
    console.log('Loading profile picture...');
    const response = await fetchWithRetry(`${API_URL}/profile/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const profile = await response.json();
      console.log('Profile loaded:', profile);
      
      if (profile.profilePicture) {
        const headerPic = document.getElementById('headerProfilePic');
        if (headerPic) {
          console.log('Setting profile picture:', profile.profilePicture);
          const img = document.createElement('img');
          img.src = profile.profilePicture;
          img.style.cssText = 'width: 100%; height: 100%; border-radius: 50%; object-fit: cover;';
          headerPic.innerHTML = '';
          headerPic.appendChild(img);
        } else {
          console.warn('headerProfilePic element not found');
        }
      } else {
        console.log('No profile picture set for user');
      }
    } else {
      console.error('Failed to load profile:', response.status);
    }
  } catch (error) {
    console.error('Error loading profile picture:', error);
  }
}

  // Expose on window
  window.initializeApp = initializeApp;
  window.logout = logout;
  window.showDashboard = showDashboard;
  window.setActiveSidebarButton = setActiveSidebarButton;
  window.loadHeaderProfilePicture = loadHeaderProfilePicture;
  // Backward compat: remaining modules reference bare `token` and `user`
  window.token = token;
  window.user = App.user;

})();