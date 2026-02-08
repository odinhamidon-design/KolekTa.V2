/**
 * Kolek-Ta Table Utilities
 * Sorting, filtering, and search systems for admin tables.
 */
(function() {
  'use strict';

  // Sort state for each module
  var sortState = {
    users: { column: null, direction: 'asc' },
    trucks: { column: null, direction: 'asc' },
    routes: { column: null, direction: 'asc' },
    complaints: { column: null, direction: 'asc' },
    schedules: { column: null, direction: 'asc' },
    reports: { column: null, direction: 'asc' }
  };

  // Search state for each module
  var searchState = {
    users: '',
    trucks: '',
    routes: '',
    complaints: '',
    schedules: '',
    fuel: ''
  };

  // Store on App namespace for cross-module access
  App.sort = sortState;
  App.search = searchState;

  // ============================================
  // SORTING
  // ============================================

  function sortData(data, column, direction, customSort) {
    if (customSort === undefined) customSort = null;
    if (!column) return data;

    return [...data].sort(function(a, b) {
      var valA, valB;

      if (customSort && customSort[column]) {
        valA = customSort[column](a);
        valB = customSort[column](b);
      } else {
        valA = column.split('.').reduce(function(obj, key) { return obj && obj[key]; }, a);
        valB = column.split('.').reduce(function(obj, key) { return obj && obj[key]; }, b);
      }

      if (valA == null && valB == null) return 0;
      if (valA == null) return direction === 'asc' ? 1 : -1;
      if (valB == null) return direction === 'asc' ? -1 : 1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return direction === 'asc' ? valA - valB : valB - valA;
      }

      if (valA instanceof Date && valB instanceof Date) {
        return direction === 'asc' ? valA - valB : valB - valA;
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        var dateA = new Date(valA);
        var dateB = new Date(valB);
        if (!isNaN(dateA) && !isNaN(dateB) && valA.includes('-')) {
          return direction === 'asc' ? dateA - dateB : dateB - dateA;
        }
      }

      var strA = String(valA).toLowerCase();
      var strB = String(valB).toLowerCase();
      if (strA < strB) return direction === 'asc' ? -1 : 1;
      if (strA > strB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  function toggleSort(module, column) {
    var state = sortState[module];
    if (state.column === column) {
      state.direction = state.direction === 'asc' ? 'desc' : 'asc';
    } else {
      state.column = column;
      state.direction = 'asc';
    }
    return state;
  }

  function createSortableHeader(module, columns) {
    var state = sortState[module];
    return columns.map(function(col) {
      if (!col.sortable) {
        return '<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">' + col.label + '</th>';
      }

      var isActive = state.column === col.key;
      var icon = isActive
        ? (state.direction === 'asc' ? 'arrow-up' : 'arrow-down')
        : 'arrow-up-down';
      var activeClass = isActive ? 'text-primary-600' : 'text-gray-400';

      return '<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none" onclick="handleSort(\'' + module + '\', \'' + col.key + '\')">' +
        '<div class="flex items-center gap-1">' +
        '<span>' + col.label + '</span>' +
        '<i data-lucide="' + icon + '" class="w-3 h-3 ' + activeClass + '"></i>' +
        '</div></th>';
    }).join('');
  }

  function handleSort(module, column) {
    toggleSort(module, column);
    if (App.sortHandlers[module]) {
      App.sortHandlers[module]();
    }
  }

  // ============================================
  // FILTERS
  // ============================================

  function filterTrucksByFuelLevel(trucks, filter) {
    if (filter === 'all') return trucks;

    return trucks.filter(function(t) {
      switch (filter) {
        case 'low': return t.fuelLevel < 25;
        case 'medium': return t.fuelLevel >= 25 && t.fuelLevel <= 50;
        case 'good': return t.fuelLevel > 50;
        default: return true;
      }
    });
  }

  function handleFuelLevelFilter(value) {
    App.filters.fuelLevel = value;
    if (App.sortHandlers.fuel) {
      App.sortHandlers.fuel();
    }
  }

  function handleUserRoleFilter(value) {
    App.filters.userRole = value;
    if (App.sortHandlers.users) {
      App.sortHandlers.users();
    }
  }

  function handleUserStatusFilter(value) {
    App.filters.userStatus = value;
    if (App.sortHandlers.users) {
      App.sortHandlers.users();
    }
  }

  function handleTruckStatusFilter(value) {
    App.filters.truckStatus = value;
    if (App.sortHandlers.trucks) {
      App.sortHandlers.trucks();
    }
  }

  function handleComplaintStatusFilter(value) {
    App.filters.complaintStatus = value;
    if (App.sortHandlers.complaints) {
      App.sortHandlers.complaints();
    }
  }

  function handleComplaintTypeFilter(value) {
    App.filters.complaintType = value;
    if (App.sortHandlers.complaints) {
      App.sortHandlers.complaints();
    }
  }

  function handleScheduleStatusFilter(value) {
    App.filters.scheduleStatus = value;
    if (App.sortHandlers.schedules) {
      App.sortHandlers.schedules();
    }
  }

  function filterRoutesByExpiration(routes, filter) {
    if (filter === 'all') return routes;

    var now = new Date();
    var sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return routes.filter(function(r) {
      var isExpired = r.isExpired || (r.expiresAt && new Date(r.expiresAt) < now);
      var isExpiringSoon = !isExpired && r.expiresAt && new Date(r.expiresAt) <= sevenDaysFromNow;
      var isActive = !r.expiresAt || (!isExpired && !isExpiringSoon);

      switch (filter) {
        case 'expired': return isExpired;
        case 'expiring-soon': return isExpiringSoon;
        case 'active': return isActive;
        default: return true;
      }
    });
  }

  function handleExpirationFilter(value) {
    App.filters.routeExpiration = value;
    if (App.sortHandlers.routes) {
      App.sortHandlers.routes();
    }
  }

  function createExpirationFilter() {
    return '<select id="routeExpirationFilter" onchange="handleExpirationFilter(this.value)" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500">' +
      '<option value="all"' + (App.filters.routeExpiration === 'all' ? ' selected' : '') + '>All Routes</option>' +
      '<option value="active"' + (App.filters.routeExpiration === 'active' ? ' selected' : '') + '>Active Only</option>' +
      '<option value="expiring-soon"' + (App.filters.routeExpiration === 'expiring-soon' ? ' selected' : '') + '>Expiring Soon</option>' +
      '<option value="expired"' + (App.filters.routeExpiration === 'expired' ? ' selected' : '') + '>Expired</option>' +
      '</select>';
  }

  // ============================================
  // SEARCH
  // ============================================

  function filterData(data, searchTerm, searchFields) {
    if (!searchTerm || searchTerm.trim() === '') return data;

    var term = searchTerm.toLowerCase().trim();

    return data.filter(function(item) {
      return searchFields.some(function(field) {
        var value = field.split('.').reduce(function(obj, key) { return obj && obj[key]; }, item);
        if (value == null) return false;
        return String(value).toLowerCase().includes(term);
      });
    });
  }

  function createSearchInput(module, placeholder) {
    if (placeholder === undefined) placeholder = 'Search...';
    return '<div class="relative">' +
      '<input type="text" id="' + module + 'SearchInput" placeholder="' + placeholder + '" value="' + (searchState[module] || '') + '" oninput="handleSearch(\'' + module + '\', this.value)" class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-full sm:w-64">' +
      '<i data-lucide="search" class="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"></i>' +
      (searchState[module] ? '<button onclick="clearSearch(\'' + module + '\')" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><i data-lucide="x" class="w-4 h-4"></i></button>' : '') +
      '</div>';
  }

  function handleSearch(module, value) {
    searchState[module] = value;
    if (App.sortHandlers[module]) {
      App.sortHandlers[module]();
    }
  }

  function clearSearch(module) {
    searchState[module] = '';
    var input = document.getElementById(module + 'SearchInput');
    if (input) input.value = '';
    if (App.sortHandlers[module]) {
      App.sortHandlers[module]();
    }
  }

  // ============================================
  // EXPOSE ON WINDOW
  // ============================================

  window.sortData = sortData;
  window.toggleSort = toggleSort;
  window.createSortableHeader = createSortableHeader;
  window.handleSort = handleSort;
  window.filterTrucksByFuelLevel = filterTrucksByFuelLevel;
  window.handleFuelLevelFilter = handleFuelLevelFilter;
  window.handleUserRoleFilter = handleUserRoleFilter;
  window.handleUserStatusFilter = handleUserStatusFilter;
  window.handleTruckStatusFilter = handleTruckStatusFilter;
  window.handleComplaintStatusFilter = handleComplaintStatusFilter;
  window.handleComplaintTypeFilter = handleComplaintTypeFilter;
  window.handleScheduleStatusFilter = handleScheduleStatusFilter;
  window.filterRoutesByExpiration = filterRoutesByExpiration;
  window.handleExpirationFilter = handleExpirationFilter;
  window.createExpirationFilter = createExpirationFilter;
  window.filterData = filterData;
  window.createSearchInput = createSearchInput;
  window.handleSearch = handleSearch;
  window.clearSearch = clearSearch;

})();
