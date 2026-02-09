/**
 * DriverStateManager - Centralized driver state with pub/sub events.
 * Single API fetch populates shared state; all 3 viewports (sidebar,
 * desktop overlay, mobile) auto-update via event listeners.
 */
(function() {
  'use strict';

  // ---- Event system ----
  const _listeners = {};

  function on(event, fn) {
    if (!_listeners[event]) _listeners[event] = [];
    _listeners[event].push(fn);
  }

  function off(event, fn) {
    if (!_listeners[event]) return;
    _listeners[event] = _listeners[event].filter(f => f !== fn);
  }

  function emit(event, data) {
    if (!_listeners[event]) return;
    _listeners[event].forEach(fn => {
      try { fn(data); } catch (e) { console.error('DriverState listener error:', e); }
    });
  }

  // ---- Shared state ----
  const state = {
    stats: { todayRoutes: 0, todayDistance: 0 },
    gps: { active: false, error: '' },
    activeRoute: null,
    assignments: { routes: [], trucks: [] },
    _rawRoutes: [],
    _rawTrucks: []
  };

  // ---- Core methods ----

  /** Single fetch of /routes + /trucks, compute stats, emit events */
  async function refreshAssignments() {
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };

    let routes = [];
    let trucks = [];

    // Try network first
    if (navigator.onLine) {
      try {
        const [routesRes, trucksRes] = await Promise.all([
          fetch(`${App.API_URL}/routes`, { headers }),
          fetch(`${App.API_URL}/trucks`, { headers })
        ]);
        if (routesRes.ok) routes = await routesRes.json();
        if (trucksRes.ok) trucks = await trucksRes.json();

        // Cache to IndexedDB
        if (typeof OfflineDB !== 'undefined') {
          try {
            await OfflineDB.saveRoutes(routes);
            await OfflineDB.saveTrucks(trucks);
          } catch (_) { /* ignore cache errors */ }
        }
      } catch (_) { /* fall through to offline */ }
    }

    // Offline fallback
    if (routes.length === 0 && typeof OfflineDB !== 'undefined') {
      try {
        routes = await OfflineDB.getRoutes();
        trucks = await OfflineDB.getTrucks();
      } catch (_) { /* no offline data */ }
    }

    state._rawRoutes = routes;
    state._rawTrucks = trucks;

    // Compute stats
    computeStats(routes);

    // Compute active route
    const activeRouteId = localStorage.getItem('activeRouteId');
    if (activeRouteId) {
      state.activeRoute = routes.find(r => (r._id === activeRouteId || r.routeId === activeRouteId)) || null;
    } else {
      state.activeRoute = null;
    }

    // Compute assignments
    const username = (App.user || {}).username;
    state.assignments.routes = routes.filter(r => r.assignedDriver === username && r.status !== 'completed');
    state.assignments.trucks = trucks.filter(t => t.assignedDriver === username);

    emit('stats-updated', state.stats);
    emit('active-route-updated', state.activeRoute);
    emit('assignments-updated', state.assignments);
  }

  /** Lightweight recompute from cached routes */
  function refreshStats() {
    computeStats(state._rawRoutes);
    emit('stats-updated', state.stats);
  }

  function computeStats(routes) {
    const username = (App.user || {}).username;
    const today = new Date().toDateString();
    const todayCompleted = routes.filter(r =>
      r.status === 'completed' &&
      r.completedBy === username &&
      r.completedAt && new Date(r.completedAt).toDateString() === today
    );
    const todayDistance = todayCompleted.reduce((sum, r) => sum + (r.distance || 0), 0);

    state.stats.todayRoutes = todayCompleted.length;
    state.stats.todayDistance = todayDistance;
  }

  /** Set GPS state and emit */
  function setGPSState(active, error) {
    state.gps.active = !!active;
    state.gps.error = error || '';
    emit('gps-updated', state.gps);
  }

  /** Set active route and emit */
  function setActiveRoute(route) {
    state.activeRoute = route || null;
    emit('active-route-updated', state.activeRoute);
  }

  // ---- Auto-refresh ----
  let _refreshInterval = null;

  function startAutoRefresh(ms) {
    stopAutoRefresh();
    refreshAssignments(); // immediate first load
    _refreshInterval = setInterval(refreshAssignments, ms || 30000);
    // Store in App.intervals for cleanup on logout
    if (typeof App !== 'undefined' && App.intervals) {
      App.intervals.driverStateRefresh = _refreshInterval;
    }
  }

  function stopAutoRefresh() {
    if (_refreshInterval) {
      clearInterval(_refreshInterval);
      _refreshInterval = null;
    }
    if (typeof App !== 'undefined' && App.intervals) {
      delete App.intervals.driverStateRefresh;
    }
  }

  // ============================================================
  // VIEWPORT LISTENERS
  // ============================================================

  // --- stats-updated ---
  on('stats-updated', function(stats) {
    // Sidebar
    const sideRoutes = document.getElementById('driverTodayRoutes');
    const sideDist = document.getElementById('driverTodayDistance');
    if (sideRoutes) sideRoutes.textContent = stats.todayRoutes;
    if (sideDist) sideDist.textContent = (stats.todayDistance / 1000).toFixed(1);

    // Desktop overlay
    const ovRoutes = document.getElementById('overlayTodayRoutes');
    const ovDist = document.getElementById('overlayTodayDistance');
    if (ovRoutes) ovRoutes.textContent = stats.todayRoutes;
    if (ovDist) ovDist.textContent = (stats.todayDistance / 1000).toFixed(1) + ' km';

    // Mobile
    const mobRoutes = document.getElementById('mobileStatsRoutes');
    if (mobRoutes) mobRoutes.textContent = stats.todayRoutes;

    // Mobile home panel (if open)
    const mobHomeRoutes = document.getElementById('mobileDriverTodayRoutes');
    const mobHomeDist = document.getElementById('mobileDriverTodayDistance');
    if (mobHomeRoutes) mobHomeRoutes.textContent = stats.todayRoutes;
    if (mobHomeDist) mobHomeDist.textContent = (stats.todayDistance / 1000).toFixed(1);
  });

  // --- gps-updated ---
  on('gps-updated', function(gps) {
    // Sidebar GPS status panel
    const panel = document.getElementById('gpsStatusPanel');
    const iconWrapper = document.getElementById('gpsStatusIconWrapper');
    const text = document.getElementById('gpsStatusText');
    const detail = document.getElementById('gpsStatusDetail');

    if (panel) {
      if (gps.active) {
        panel.style.borderLeftColor = '#4caf50';
        panel.style.background = '#e8f5e9';
        if (iconWrapper) {
          iconWrapper.className = 'w-9 h-9 bg-green-100 rounded-full flex items-center justify-center';
          iconWrapper.innerHTML = '<i data-lucide="navigation" class="w-4 h-4 text-green-600"></i>';
        }
        if (text) { text.textContent = 'GPS Active'; text.style.color = '#2e7d32'; }
        if (detail) detail.textContent = gps.error || 'Location is being tracked';
      } else {
        panel.style.borderLeftColor = gps.error ? '#f44336' : '#9e9e9e';
        panel.style.background = gps.error ? '#ffebee' : '#f5f5f5';
        if (iconWrapper) {
          iconWrapper.className = 'w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center';
          iconWrapper.innerHTML = '<i data-lucide="map-pin" class="w-4 h-4 text-gray-500"></i>';
        }
        if (text) {
          text.textContent = gps.error ? 'GPS Error' : 'GPS Inactive';
          text.style.color = gps.error ? '#c62828' : '#424242';
        }
        if (detail) detail.textContent = gps.error || 'Click Start to begin tracking';
      }
    }

    // Sidebar start GPS button
    const startBtn = document.getElementById('startGpsBtn');
    if (startBtn) {
      if (gps.active) {
        startBtn.innerHTML = '<i data-lucide="navigation-off" class="w-5 h-5"></i><span>Stop GPS Tracking</span>';
        startBtn.classList.remove('bg-primary-500', 'hover:bg-primary-600');
        startBtn.classList.add('bg-red-500', 'hover:bg-red-600');
      } else {
        startBtn.innerHTML = '<i data-lucide="navigation" class="w-5 h-5"></i><span>Start GPS Tracking</span>';
        startBtn.classList.remove('bg-red-500', 'hover:bg-red-600');
        startBtn.classList.add('bg-primary-500', 'hover:bg-primary-600');
      }
    }

    // Desktop overlay GPS
    const ovIconWrapper = document.getElementById('overlayGpsIconWrapper');
    const ovText = document.getElementById('overlayGpsText');
    const ovDetail = document.getElementById('overlayGpsDetail');
    const ovBtn = document.getElementById('overlayGpsBtn');

    if (gps.active) {
      if (ovIconWrapper) {
        ovIconWrapper.className = 'w-10 h-10 bg-green-100 rounded-full flex items-center justify-center';
        ovIconWrapper.innerHTML = '<i data-lucide="navigation" class="w-5 h-5 text-green-600"></i>';
      }
      if (ovText) { ovText.textContent = 'GPS Active'; ovText.className = 'font-semibold text-green-600 text-sm'; }
      if (ovDetail) { ovDetail.textContent = 'Tracking your location'; ovDetail.className = 'text-xs text-green-500'; }
      if (ovBtn) {
        ovBtn.innerHTML = '<i data-lucide="pause" class="w-4 h-4"></i><span>Stop</span>';
        ovBtn.className = 'px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2';
      }
    } else {
      if (ovIconWrapper) {
        ovIconWrapper.className = 'w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center';
        ovIconWrapper.innerHTML = '<i data-lucide="map-pin" class="w-5 h-5 text-gray-500"></i>';
      }
      if (ovText) { ovText.textContent = 'GPS Inactive'; ovText.className = 'font-semibold text-gray-800 text-sm'; }
      if (ovDetail) { ovDetail.textContent = 'Click Start to begin tracking'; ovDetail.className = 'text-xs text-gray-500'; }
      if (ovBtn) {
        ovBtn.innerHTML = '<i data-lucide="navigation" class="w-4 h-4"></i><span>Start</span>';
        ovBtn.className = 'px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2';
      }
    }

    // Mobile GPS status pill
    const mobDot = document.getElementById('mobileGpsDot');
    const mobLabel = document.getElementById('mobileGpsLabel');
    const mobPill = document.getElementById('mobileGpsStatusPill');

    if (mobDot && mobLabel) {
      if (gps.active) {
        mobDot.className = 'w-2 h-2 bg-green-500 rounded-full animate-pulse';
        mobLabel.textContent = 'GPS On';
        mobLabel.className = 'text-xs font-medium text-green-600';
        if (mobPill) { mobPill.classList.remove('border-gray-200'); mobPill.classList.add('border-green-300', 'bg-green-50/95'); }
      } else {
        mobDot.className = 'w-2 h-2 bg-gray-400 rounded-full';
        mobLabel.textContent = 'GPS Off';
        mobLabel.className = 'text-xs font-medium text-gray-600';
        if (mobPill) { mobPill.classList.remove('border-green-300', 'bg-green-50/95'); mobPill.classList.add('border-gray-200'); }
      }
    }

    // Mobile GPS button
    const mobBtn = document.getElementById('mobileGpsBtn');
    const mobBtnText = document.getElementById('mobileGpsBtnText');
    if (mobBtn && mobBtnText) {
      if (gps.active) {
        mobBtn.classList.remove('bg-primary-500', 'hover:bg-primary-600');
        mobBtn.classList.add('bg-red-500', 'hover:bg-red-600');
        mobBtnText.textContent = 'Stop GPS';
      } else {
        mobBtn.classList.remove('bg-red-500', 'hover:bg-red-600');
        mobBtn.classList.add('bg-primary-500', 'hover:bg-primary-600');
        mobBtnText.textContent = 'Start GPS';
      }
    }

    // Reinitialize lucide icons
    if (typeof lucide !== 'undefined') lucide.createIcons();
  });

  // --- active-route-updated ---
  on('active-route-updated', function(route) {
    // Sidebar active route panel
    const sidePanel = document.getElementById('activeRoutePanel');
    if (sidePanel) {
      if (route) {
        sidePanel.classList.remove('hidden');
        const stopsTotal = route.path?.coordinates?.length || 0;
        const stopsCompleted = route.completedStops || 0;
        const nameEl = document.getElementById('activeRouteName');
        const progressEl = document.getElementById('activeRouteProgress');
        const distEl = document.getElementById('activeRouteDistance');
        const etaEl = document.getElementById('activeRouteETA');
        if (nameEl) nameEl.textContent = route.name || 'Unnamed Route';
        if (progressEl) progressEl.textContent = `${stopsCompleted}/${stopsTotal}`;
        if (distEl) distEl.innerHTML = `<i data-lucide="map" class="w-3 h-3"></i> ${route.distance ? (route.distance / 1000).toFixed(1) : '-'} km`;
        if (etaEl) etaEl.innerHTML = `<i data-lucide="clock" class="w-3 h-3"></i> ${route.estimatedTime || '-'} mins`;
      } else {
        sidePanel.classList.add('hidden');
      }
    }

    // Desktop overlay active route
    const ovPanel = document.getElementById('overlayActiveRoute');
    if (ovPanel) {
      if (route) {
        ovPanel.classList.remove('hidden');
        const stopsTotal = route.path?.coordinates?.length || 0;
        const stopsCompleted = route.completedStops || 0;
        const progressPercent = stopsTotal > 0 ? Math.round((stopsCompleted / stopsTotal) * 100) : 0;
        const routeNameEl = ovPanel.querySelector('#overlayRouteName');
        const progressEl = ovPanel.querySelector('#overlayRouteProgress');
        const progressBarEl = ovPanel.querySelector('#overlayProgressBar');
        if (routeNameEl) routeNameEl.textContent = route.name || 'Unnamed Route';
        if (progressEl) progressEl.textContent = `${stopsCompleted}/${stopsTotal} stops`;
        if (progressBarEl) progressBarEl.style.width = `${progressPercent}%`;
      } else {
        ovPanel.classList.add('hidden');
      }
    }

    // Mobile route pill
    const mobPill = document.getElementById('mobileRoutePill');
    const mobLabel = document.getElementById('mobileRouteLabel');
    if (mobPill) {
      if (route) {
        mobPill.classList.remove('hidden');
        if (mobLabel) mobLabel.textContent = route.name || 'Route Active';
      } else {
        mobPill.classList.add('hidden');
      }
    }

    // Reinitialize lucide icons
    if (typeof lucide !== 'undefined') lucide.createIcons();
  });

  // --- assignments-updated: render overlay assignments ---
  on('assignments-updated', function(assignments) {
    var container = document.getElementById('overlayAssignments');
    if (!container) return;

    var myRoutes = assignments.routes;
    var myTrucks = assignments.trucks;

    if (myRoutes.length === 0 && myTrucks.length === 0) {
      container.innerHTML = '<div class="text-center py-4 text-gray-400">' +
        '<i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>' +
        '<p class="text-xs">No assignments</p></div>';
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    var html = '';
    var _esc = typeof escapeHtml === 'function' ? escapeHtml : function(s) { return s; };
    var activeRouteId = localStorage.getItem('activeRouteId');

    myTrucks.forEach(function(truck) {
      var fuelColor = truck.fuelLevel > 50 ? 'text-green-600' : truck.fuelLevel > 20 ? 'text-yellow-600' : 'text-red-600';
      html += '<div class="bg-white/80 rounded-lg p-2 border border-gray-200">' +
        '<div class="flex items-center gap-2">' +
        '<div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">' +
        '<i data-lucide="truck" class="w-4 h-4 text-green-600"></i></div>' +
        '<div class="flex-1 min-w-0"><p class="font-medium text-gray-800 text-sm truncate">' + _esc(truck.truckId) + '</p>' +
        '<p class="text-xs text-gray-500">' + _esc(truck.plateNumber) + '</p></div>' +
        '<div class="text-right"><p class="text-sm font-bold ' + fuelColor + '">' + (truck.fuelLevel || 0) + '%</p></div>' +
        '</div></div>';
    });

    myRoutes.forEach(function(route) {
      var isActive = activeRouteId === (route._id || route.routeId);
      var stopsCount = route.path && route.path.coordinates ? route.path.coordinates.length : 0;
      var dist = route.distance ? (route.distance / 1000).toFixed(1) + ' km' : '-';
      var bgClass = isActive ? 'bg-orange-100 border-orange-300 ring-1 ring-orange-400' : 'bg-white/80 border-gray-200';
      var id = route._id || route.routeId;

      html += '<div class="' + bgClass + ' rounded-lg p-2 border transition-all">' +
        '<div class="flex items-start justify-between gap-2 mb-1">' +
        '<div class="flex-1 min-w-0"><p class="font-medium text-gray-800 text-sm truncate">' + _esc(route.name || 'Unnamed Route') + '</p>' +
        '<p class="text-xs text-gray-500">' + stopsCount + ' stops &bull; ' + dist + '</p></div>' +
        (isActive ? '<span class="flex items-center gap-1 px-1.5 py-0.5 bg-orange-500 text-white text-xs font-medium rounded-full">' +
          '<span class="w-1 h-1 bg-white rounded-full animate-pulse"></span>Active</span>' : '') +
        '</div><div class="flex gap-1 mt-2">' +
        (isActive ?
          '<button onclick="showActiveRouteNavigation()" class="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium rounded-lg transition-colors"><i data-lucide="navigation" class="w-3 h-3"></i>Navigate</button>' +
          '<button onclick="markRouteComplete(\'' + id + '\')" class="flex items-center justify-center px-2 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors"><i data-lucide="check" class="w-3 h-3"></i></button>'
          :
          '<button onclick="viewDriverRoute(\'' + id + '\')" class="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors"><i data-lucide="eye" class="w-3 h-3"></i>View</button>' +
          '<button onclick="startCollection(\'' + id + '\')" class="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors"><i data-lucide="play" class="w-3 h-3"></i>Start</button>'
        ) +
        '</div></div>';
    });

    container.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  });

  // ---- Expose global API ----
  window.DriverState = {
    state: state,
    on: on,
    off: off,
    emit: emit,
    refreshAssignments: refreshAssignments,
    refreshStats: refreshStats,
    setGPSState: setGPSState,
    setActiveRoute: setActiveRoute,
    startAutoRefresh: startAutoRefresh,
    stopAutoRefresh: stopAutoRefresh
  };

})();
