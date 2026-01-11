// Use relative URL so it works on any device
const API_URL = '/api';

// ============================================
// PAGE LOADING OVERLAY
// ============================================

function showPageLoading(text = 'Loading...') {
  const overlay = document.getElementById('pageLoadingOverlay');
  const loadingText = document.getElementById('loadingText');
  if (overlay) {
    if (loadingText) loadingText.textContent = text;
    overlay.style.display = 'flex';
    overlay.style.opacity = '1';
  }
}

function hidePageLoading() {
  const overlay = document.getElementById('pageLoadingOverlay');
  if (overlay) {
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.style.display = 'none';
    }, 300);
  }
}

// ============================================
// TOAST NOTIFICATION SYSTEM
// ============================================

// Create toast container if it doesn't exist
function ensureToastContainer() {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'fixed top-4 right-4 z-[100] flex flex-col gap-3 max-w-sm';
    document.body.appendChild(container);
  }
  return container;
}

// Show toast notification
function showToast(message, type = 'info', duration = 4000) {
  const container = ensureToastContainer();

  const icons = {
    success: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>',
    error: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>',
    warning: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>',
    info: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
  };

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  const iconColors = {
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500'
  };

  const toast = document.createElement('div');
  toast.className = `flex items-start gap-3 p-4 rounded-xl border shadow-lg ${colors[type]} animate-slide-in`;
  toast.innerHTML = `
    <span class="${iconColors[type]} flex-shrink-0 mt-0.5">${icons[type]}</span>
    <p class="text-sm font-medium flex-1">${message.replace(/\n/g, '<br>')}</p>
    <button onclick="this.parentElement.remove()" class="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
    </button>
  `;

  container.appendChild(toast);

  // Auto remove after duration
  if (duration > 0) {
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  return toast;
}

// Show alert modal (for important messages that need acknowledgment)
// Auto-closes after 2.5s for success messages
function showAlertModal(title, message, type = 'info', onClose = null, autoClose = true) {
  const config = {
    success: {
      icon: 'check-circle',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      buttonBg: 'bg-green-500 hover:bg-green-600 active:bg-green-700',
      headerBg: 'bg-gradient-to-r from-green-500 to-green-400',
      autoCloseDelay: 2500
    },
    error: {
      icon: 'x-circle',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      buttonBg: 'bg-red-500 hover:bg-red-600 active:bg-red-700',
      headerBg: 'bg-gradient-to-r from-red-500 to-red-400',
      autoCloseDelay: 0  // Don't auto-close errors
    },
    warning: {
      icon: 'alert-triangle',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      buttonBg: 'bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700',
      headerBg: 'bg-gradient-to-r from-yellow-500 to-yellow-400',
      autoCloseDelay: 0  // Don't auto-close warnings
    },
    info: {
      icon: 'info',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      buttonBg: 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700',
      headerBg: 'bg-gradient-to-r from-blue-500 to-blue-400',
      autoCloseDelay: 3000
    }
  };

  const cfg = config[type] || config.info;

  // Remove any existing alert modal
  const existingModal = document.getElementById('alertModal');
  if (existingModal) existingModal.remove();

  // Create modal overlay
  const overlay = document.createElement('div');
  overlay.id = 'alertModal';
  overlay.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in';

  overlay.innerHTML = `
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all animate-scale-in">
      <!-- Icon Header -->
      <div class="${cfg.headerBg} p-6 text-center">
        <div class="w-16 h-16 ${cfg.iconBg} rounded-full flex items-center justify-center mx-auto shadow-lg">
          <i data-lucide="${cfg.icon}" class="w-8 h-8 ${cfg.iconColor}"></i>
        </div>
      </div>

      <!-- Content -->
      <div class="p-6 text-center">
        <h3 class="text-xl font-bold text-gray-800 mb-2">${title}</h3>
        <p class="text-gray-600 text-sm whitespace-pre-line leading-relaxed">${message}</p>
        ${autoClose && cfg.autoCloseDelay > 0 ? `
          <div class="mt-4 w-full bg-gray-200 rounded-full h-1 overflow-hidden">
            <div class="alert-progress h-full ${cfg.buttonBg.split(' ')[0]} transition-all duration-[${cfg.autoCloseDelay}ms]" style="width: 100%"></div>
          </div>
        ` : ''}
      </div>

      <!-- Button -->
      <div class="px-6 pb-6">
        <button id="alertModalClose" class="w-full ${cfg.buttonBg} text-white font-semibold py-3 rounded-xl transition-all transform active:scale-95 flex items-center justify-center gap-2">
          <i data-lucide="check" class="w-5 h-5"></i>
          <span>Got it</span>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Initialize icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // Start progress bar animation
  if (autoClose && cfg.autoCloseDelay > 0) {
    const progressBar = overlay.querySelector('.alert-progress');
    if (progressBar) {
      setTimeout(() => progressBar.style.width = '0%', 50);
    }
  }

  // Close function
  const closeAlert = () => {
    overlay.classList.add('animate-fade-out');
    setTimeout(() => {
      overlay.remove();
      if (onClose) onClose();
    }, 200);
  };

  // Close on button click
  document.getElementById('alertModalClose').addEventListener('click', closeAlert);

  // Close on backdrop click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeAlert();
  });

  // Auto-close for success/info messages
  let autoCloseTimer = null;
  if (autoClose && cfg.autoCloseDelay > 0) {
    autoCloseTimer = setTimeout(closeAlert, cfg.autoCloseDelay);
  }

  // Cancel auto-close on interaction
  overlay.querySelector('.bg-white').addEventListener('mouseenter', () => {
    if (autoCloseTimer) {
      clearTimeout(autoCloseTimer);
      const progressBar = overlay.querySelector('.alert-progress');
      if (progressBar) progressBar.style.width = '100%';
    }
  });

  return overlay;
}

// Show confirm dialog (callback version)
function showConfirmModal(title, message, onConfirm, onCancel = null, type = 'warning') {
  const config = {
    warning: { icon: 'alert-triangle', iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600', confirmBg: 'bg-yellow-500 hover:bg-yellow-600' },
    danger: { icon: 'trash-2', iconBg: 'bg-red-100', iconColor: 'text-red-600', confirmBg: 'bg-red-500 hover:bg-red-600' },
    info: { icon: 'help-circle', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', confirmBg: 'bg-blue-500 hover:bg-blue-600' },
    success: { icon: 'check-circle', iconBg: 'bg-green-100', iconColor: 'text-green-600', confirmBg: 'bg-green-500 hover:bg-green-600' }
  };
  const cfg = config[type] || config.warning;

  const overlay = document.createElement('div');
  overlay.id = 'confirmModal';
  overlay.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in';

  overlay.innerHTML = `
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in">
      <!-- Header -->
      <div class="p-6 text-center">
        <div class="w-16 h-16 ${cfg.iconBg} rounded-full flex items-center justify-center mx-auto mb-4">
          <i data-lucide="${cfg.icon}" class="w-8 h-8 ${cfg.iconColor}"></i>
        </div>
        <h3 class="text-xl font-bold text-gray-800 mb-2">${title}</h3>
        <p class="text-gray-600 text-sm whitespace-pre-line leading-relaxed">${message}</p>
      </div>

      <!-- Buttons -->
      <div class="px-6 pb-6 flex gap-3">
        <button id="confirmModalCancel" class="flex-1 border-2 border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-all transform active:scale-95 flex items-center justify-center gap-2">
          <i data-lucide="x" class="w-4 h-4"></i>
          Cancel
        </button>
        <button id="confirmModalConfirm" class="flex-1 ${cfg.confirmBg} text-white font-semibold py-3 rounded-xl transition-all transform active:scale-95 flex items-center justify-center gap-2">
          <i data-lucide="check" class="w-4 h-4"></i>
          Confirm
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  if (typeof lucide !== 'undefined') lucide.createIcons();

  const closeOverlay = () => {
    overlay.classList.add('animate-fade-out');
    setTimeout(() => overlay.remove(), 200);
  };

  document.getElementById('confirmModalCancel').addEventListener('click', () => {
    closeOverlay();
    if (onCancel) onCancel();
  });

  document.getElementById('confirmModalConfirm').addEventListener('click', () => {
    closeOverlay();
    if (onConfirm) onConfirm();
  });

  // Close on backdrop click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeOverlay();
      if (onCancel) onCancel();
    }
  });

  return overlay;
}

// Show confirm dialog (promise version - use with await)
function showConfirm(title, message, type = 'warning') {
  return new Promise((resolve) => {
    const config = {
      warning: { icon: 'alert-triangle', iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600', confirmBg: 'bg-yellow-500 hover:bg-yellow-600' },
      danger: { icon: 'trash-2', iconBg: 'bg-red-100', iconColor: 'text-red-600', confirmBg: 'bg-red-500 hover:bg-red-600' },
      info: { icon: 'help-circle', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', confirmBg: 'bg-blue-500 hover:bg-blue-600' },
      success: { icon: 'check-circle', iconBg: 'bg-green-100', iconColor: 'text-green-600', confirmBg: 'bg-green-500 hover:bg-green-600' }
    };
    const cfg = config[type] || config.warning;

    // Remove any existing confirm modal
    const existing = document.getElementById('confirmModal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'confirmModal';
    overlay.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in';

    overlay.innerHTML = `
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in">
        <!-- Header -->
        <div class="p-6 text-center">
          <div class="w-16 h-16 ${cfg.iconBg} rounded-full flex items-center justify-center mx-auto mb-4">
            <i data-lucide="${cfg.icon}" class="w-8 h-8 ${cfg.iconColor}"></i>
          </div>
          <h3 class="text-xl font-bold text-gray-800 mb-2">${title}</h3>
          <p class="text-gray-600 text-sm whitespace-pre-line leading-relaxed">${message}</p>
        </div>

        <!-- Buttons -->
        <div class="px-6 pb-6 flex gap-3">
          <button class="confirm-cancel flex-1 border-2 border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-all transform active:scale-95 flex items-center justify-center gap-2">
            <i data-lucide="x" class="w-4 h-4"></i>
            Cancel
          </button>
          <button class="confirm-ok flex-1 ${cfg.confirmBg} text-white font-semibold py-3 rounded-xl transition-all transform active:scale-95 flex items-center justify-center gap-2">
            <i data-lucide="check" class="w-4 h-4"></i>
            Confirm
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    if (typeof lucide !== 'undefined') lucide.createIcons();

    const closeOverlay = (result) => {
      overlay.classList.add('animate-fade-out');
      setTimeout(() => {
        overlay.remove();
        resolve(result);
      }, 200);
    };

    overlay.querySelector('.confirm-cancel').addEventListener('click', () => closeOverlay(false));
    overlay.querySelector('.confirm-ok').addEventListener('click', () => closeOverlay(true));

    // Close on backdrop click (cancels)
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeOverlay(false);
    });
  });
}

// ============================================
// END TOAST NOTIFICATION SYSTEM
// ============================================

// ============================================
// TABLE SORTING SYSTEM
// ============================================

// Sort state for each module
const sortState = {
  users: { column: null, direction: 'asc' },
  trucks: { column: null, direction: 'asc' },
  routes: { column: null, direction: 'asc' },
  complaints: { column: null, direction: 'asc' },
  schedules: { column: null, direction: 'asc' },
  reports: { column: null, direction: 'asc' }
};

// Generic sort function for arrays
function sortData(data, column, direction, customSort = null) {
  if (!column) return data;

  return [...data].sort((a, b) => {
    let valA, valB;

    // Handle custom sort functions
    if (customSort && customSort[column]) {
      valA = customSort[column](a);
      valB = customSort[column](b);
    } else {
      // Handle nested properties (e.g., 'user.name')
      valA = column.split('.').reduce((obj, key) => obj?.[key], a);
      valB = column.split('.').reduce((obj, key) => obj?.[key], b);
    }

    // Handle null/undefined values
    if (valA == null && valB == null) return 0;
    if (valA == null) return direction === 'asc' ? 1 : -1;
    if (valB == null) return direction === 'asc' ? -1 : 1;

    // Handle different types
    if (typeof valA === 'number' && typeof valB === 'number') {
      return direction === 'asc' ? valA - valB : valB - valA;
    }

    if (valA instanceof Date && valB instanceof Date) {
      return direction === 'asc' ? valA - valB : valB - valA;
    }

    // Handle date strings
    if (typeof valA === 'string' && typeof valB === 'string') {
      const dateA = new Date(valA);
      const dateB = new Date(valB);
      if (!isNaN(dateA) && !isNaN(dateB) && valA.includes('-')) {
        return direction === 'asc' ? dateA - dateB : dateB - dateA;
      }
    }

    // Default string comparison
    const strA = String(valA).toLowerCase();
    const strB = String(valB).toLowerCase();
    if (strA < strB) return direction === 'asc' ? -1 : 1;
    if (strA > strB) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

// Toggle sort direction and update state
function toggleSort(module, column) {
  const state = sortState[module];
  if (state.column === column) {
    state.direction = state.direction === 'asc' ? 'desc' : 'asc';
  } else {
    state.column = column;
    state.direction = 'asc';
  }
  return state;
}

// Generate sortable table header
function createSortableHeader(module, columns) {
  const state = sortState[module];
  return columns.map(col => {
    if (!col.sortable) {
      return `<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">${col.label}</th>`;
    }

    const isActive = state.column === col.key;
    const icon = isActive
      ? (state.direction === 'asc' ? 'arrow-up' : 'arrow-down')
      : 'arrow-up-down';
    const activeClass = isActive ? 'text-primary-600' : 'text-gray-400';

    return `
      <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
          onclick="handleSort('${module}', '${col.key}')">
        <div class="flex items-center gap-1">
          <span>${col.label}</span>
          <i data-lucide="${icon}" class="w-3 h-3 ${activeClass}"></i>
        </div>
      </th>
    `;
  }).join('');
}

// Handle sort click - will be overridden by each module's refresh function
const sortHandlers = {};

function handleSort(module, column) {
  toggleSort(module, column);
  if (sortHandlers[module]) {
    sortHandlers[module]();
  }
}

// ============================================
// END TABLE SORTING SYSTEM
// ============================================

// ============================================
// TABLE SEARCH SYSTEM
// ============================================

// Search state for each module
const searchState = {
  users: '',
  trucks: '',
  routes: '',
  complaints: '',
  schedules: ''
};

// Expiration filter state for routes
let routeExpirationFilter = 'all'; // 'all', 'active', 'expiring-soon', 'expired'

// Filter routes by expiration
function filterRoutesByExpiration(routes, filter) {
  if (filter === 'all') return routes;

  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return routes.filter(r => {
    const isExpired = r.isExpired || (r.expiresAt && new Date(r.expiresAt) < now);
    const isExpiringSoon = !isExpired && r.expiresAt && new Date(r.expiresAt) <= sevenDaysFromNow;
    const isActive = !r.expiresAt || (!isExpired && !isExpiringSoon);

    switch (filter) {
      case 'expired': return isExpired;
      case 'expiring-soon': return isExpiringSoon;
      case 'active': return isActive;
      default: return true;
    }
  });
}

// Handle expiration filter change
function handleExpirationFilter(value) {
  routeExpirationFilter = value;
  if (sortHandlers.routes) {
    sortHandlers.routes();
  }
}

// Create expiration filter dropdown
function createExpirationFilter() {
  return `
    <select
      id="routeExpirationFilter"
      onchange="handleExpirationFilter(this.value)"
      class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
      <option value="all" ${routeExpirationFilter === 'all' ? 'selected' : ''}>All Routes</option>
      <option value="active" ${routeExpirationFilter === 'active' ? 'selected' : ''}>Active Only</option>
      <option value="expiring-soon" ${routeExpirationFilter === 'expiring-soon' ? 'selected' : ''}>Expiring Soon</option>
      <option value="expired" ${routeExpirationFilter === 'expired' ? 'selected' : ''}>Expired</option>
    </select>
  `;
}

// Generic filter function for arrays based on search term
function filterData(data, searchTerm, searchFields) {
  if (!searchTerm || searchTerm.trim() === '') return data;

  const term = searchTerm.toLowerCase().trim();

  return data.filter(item => {
    return searchFields.some(field => {
      // Handle nested properties (e.g., 'user.name')
      const value = field.split('.').reduce((obj, key) => obj?.[key], item);
      if (value == null) return false;
      return String(value).toLowerCase().includes(term);
    });
  });
}

// Generate search input HTML
function createSearchInput(module, placeholder = 'Search...') {
  return `
    <div class="relative">
      <input type="text"
             id="${module}SearchInput"
             placeholder="${placeholder}"
             value="${searchState[module] || ''}"
             oninput="handleSearch('${module}', this.value)"
             class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-full sm:w-64">
      <i data-lucide="search" class="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
      ${searchState[module] ? `
        <button onclick="clearSearch('${module}')" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          <i data-lucide="x" class="w-4 h-4"></i>
        </button>
      ` : ''}
    </div>
  `;
}

// Handle search input - will trigger module's refresh function
function handleSearch(module, value) {
  searchState[module] = value;
  if (sortHandlers[module]) {
    sortHandlers[module]();
  }
}

// Clear search input
function clearSearch(module) {
  searchState[module] = '';
  const input = document.getElementById(`${module}SearchInput`);
  if (input) input.value = '';
  if (sortHandlers[module]) {
    sortHandlers[module]();
  }
}

// ============================================
// END TABLE SEARCH SYSTEM
// ============================================

// Check authentication
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token) {
  window.location.href = 'login.html';
}

// Initialize after DOM is loaded
function initializeApp() {
  // Update header user info
  const headerProfilePic = document.getElementById('headerProfilePic');
  const headerUserName = document.getElementById('headerUserName');
  if (headerProfilePic) {
    headerProfilePic.textContent = (user.fullName || user.username || 'U').charAt(0).toUpperCase();
  }
  if (headerUserName) {
    headerUserName.textContent = user.fullName || user.username || 'User';
  }

  // Show/hide panels based on role
  if (user.role === 'admin') {
    // Show admin controls panel
    const adminControls = document.getElementById('adminControls');
    if (adminControls) {
      adminControls.classList.remove('hidden');
    }
    // Create permanent notification icon after a small delay to ensure DOM is ready
    setTimeout(() => {
      createNotificationIcon();
      // Start checking for notifications
      checkCompletionNotifications();
      setInterval(checkCompletionNotifications, 30000); // Check every 30 seconds

      // Start checking for new complaints
      checkNewComplaints();
      setInterval(checkNewComplaints, 30000); // Check every 30 seconds

      // Start live truck tracking on map
      showLiveTruckLocations();

      // Show dashboard by default for admins
      showDashboard();
    }, 100);
  } else if (user.role === 'driver') {
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

      if (driverWebOverlay) driverWebOverlay.classList.remove('hidden');
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

// Load profile picture if exists (with small delay to ensure DOM is ready)
setTimeout(() => {
  loadHeaderProfilePicture();
}, 100);

// Call initialization
initializeApp();

function logout() {
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
  ) && !url.includes(window.location.host) && !url.startsWith(API_URL);

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

// Mati City, Davao Oriental coordinates and boundaries
const MATI_CENTER = [6.9549, 126.2185]; // Mati City center
const MATI_BOUNDS = [
  [6.8500, 126.1000], // Southwest corner
  [7.0500, 126.3500]  // Northeast corner
];

// Initialize map centered on Mati City
const map = L.map('map', {
  center: MATI_CENTER,
  zoom: 13,
  minZoom: 12,
  maxZoom: 18,
  maxBounds: MATI_BOUNDS,
  maxBoundsViscosity: 1.0
}).setView(MATI_CENTER, 13);

// Track map loading state
let mapTilesLoaded = false;
const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors | Mati City, Davao Oriental'
}).addTo(map);

// Hide loading overlay when map tiles are loaded
tileLayer.on('load', function() {
  if (!mapTilesLoaded) {
    mapTilesLoaded = true;
    hideMapLoadingOverlay();
  }
});

// Also hide after a timeout (fallback in case 'load' event doesn't fire)
setTimeout(hideMapLoadingOverlay, 5000);

function hideMapLoadingOverlay() {
  const overlay = document.getElementById('mapLoadingOverlay');
  if (overlay) {
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.style.display = 'none';
    }, 500);
  }
}

// Show loading overlay (can be called when switching views)
function showMapLoadingOverlay() {
  const overlay = document.getElementById('mapLoadingOverlay');
  if (overlay) {
    overlay.style.display = 'flex';
    overlay.style.opacity = '1';
    mapTilesLoaded = false;
  }
}

// Add Mati City boundary overlay
const matiCityBoundary = L.rectangle(MATI_BOUNDS, {
  color: '#667eea',
  weight: 3,
  fillOpacity: 0,
  dashArray: '10, 10'
}).addTo(map);

// Removed city label

// Add major landmarks in Mati City
const landmarks = [
  { name: 'Mati City Hall', coords: [6.9549, 126.2185], icon: '🏛️' },
  { name: 'Dahican Beach', coords: [6.8833, 126.2667], icon: '🏖️' },
  { name: 'Sleeping Dinosaur', coords: [6.9000, 126.2500], icon: '🦕' },
  { name: 'Mati Public Market', coords: [6.9560, 126.2170], icon: '🏪' }
];

landmarks.forEach(landmark => {
  L.marker(landmark.coords, {
    icon: L.divIcon({
      className: 'landmark-icon',
      html: `<div style="font-size: 24px;">${landmark.icon}</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    })
  }).addTo(map).bindPopup(`<strong>${landmark.name}</strong>`);
});

let bins = [];
let markers = {};

// Load bins
async function loadBins() {
  try {
    const response = await fetch(`${API_URL}/bins`);
    bins = await response.json();
    displayBins();
  } catch (error) {
    console.error('Error loading bins:', error);
  }
}

// Display bins on map
function displayBins() {
  Object.values(markers).forEach(marker => map.removeLayer(marker));
  markers = {};
  
  bins.forEach(bin => {
    const color = getStatusColor(bin.status);
    const marker = L.circleMarker([bin.location.coordinates[1], bin.location.coordinates[0]], {
      radius: 8,
      fillColor: color,
      color: '#fff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8
    }).addTo(map);
    
    marker.bindPopup(`
      <strong>${bin.binId}</strong><br>
      Status: ${bin.status}<br>
      Level: ${bin.currentLevel}%<br>
      Type: ${bin.binType}
    `);
    
    markers[bin._id] = marker;
  });
}

function getStatusColor(status) {
  const colors = {
    empty: '#4caf50',
    low: '#8bc34a',
    medium: '#ffc107',
    high: '#ff9800',
    full: '#f44336'
  };
  return colors[status] || '#999';
}

// Removed updateStats function

// Removed bin selection functionality

// Removed Add Bin functionality

// Removed Optimize Route functionality

// Modal functions
function showModal(title, body, options = {}) {
  const modal = document.getElementById('modal');
  const modalContent = modal.querySelector('div');

  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = body;

  // Reset animations
  modalContent.classList.remove('animate-scale-in', 'animate-fade-out');
  void modalContent.offsetWidth; // Trigger reflow
  modalContent.classList.add('animate-scale-in');

  modal.classList.add('active');

  // Reinitialize Lucide icons for dynamic content
  if (typeof lucide !== 'undefined') {
    setTimeout(() => lucide.createIcons(), 50);
  }

  // Auto-close after success transactions
  if (options.autoClose) {
    const delay = typeof options.autoClose === 'number' ? options.autoClose : 2000;
    setTimeout(() => closeModal(), delay);
  }
}

function closeModal(callback = null) {
  const modal = document.getElementById('modal');
  const modalContent = modal.querySelector('div');

  // Add fade-out animation
  modalContent.classList.add('animate-fade-out');

  setTimeout(() => {
    modal.classList.remove('active');
    modalContent.classList.remove('animate-fade-out');
    if (callback) callback();
  }, 200);
}

// Close modal with success feedback
function closeModalWithSuccess(message = 'Operation completed successfully!') {
  closeModal(() => {
    showToast(message, 'success');
  });
}

// ============================================
// PAGE VIEW SYSTEM (Show pages instead of modals)
// ============================================

function showPage(title, content) {
  const mapContainer = document.getElementById('mapContainer');
  const pageContainer = document.getElementById('pageContainer');
  const pageContent = document.getElementById('pageContent');

  // Hide map, show page
  mapContainer.classList.add('hidden');
  pageContainer.classList.remove('hidden');

  // Set page content with header
  pageContent.innerHTML = `
    <div class="animate-fade-in">
      <!-- Page Header -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <button onclick="closePage()" class="p-2 hover:bg-gray-200 rounded-lg transition-colors">
            <i data-lucide="arrow-left" class="w-5 h-5 text-gray-600"></i>
          </button>
          <h1 class="text-2xl font-bold text-gray-800">${title}</h1>
        </div>
      </div>

      <!-- Page Body -->
      <div class="page-body">
        ${content}
      </div>
    </div>
  `;

  // Reinitialize Lucide icons
  if (typeof lucide !== 'undefined') {
    setTimeout(() => lucide.createIcons(), 50);
  }
}

function closePage() {
  const mapContainer = document.getElementById('mapContainer');
  const pageContainer = document.getElementById('pageContainer');

  // Show map, hide page
  mapContainer.classList.remove('hidden');
  pageContainer.classList.add('hidden');

  // Re-invalidate map size
  if (typeof map !== 'undefined') {
    setTimeout(() => map.invalidateSize(), 100);
  }
}

// Close modal on click outside
window.addEventListener('click', (e) => {
  const modal = document.getElementById('modal');
  if (e.target === modal) {
    closeModal();
  }
});

// Removed View Statistics functionality

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

    const users = await usersRes.json();
    const trucks = await trucksRes.json();
    const routes = await routesRes.json();
    const activeDrivers = await trackingRes.json().catch(() => []);

    // Calculate statistics
    const drivers = users.filter(u => u.role === 'driver');
    const admins = users.filter(u => u.role === 'admin');
    const activeDriverCount = Array.isArray(activeDrivers) ? activeDrivers.length : 0;

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
                    <p class="font-medium text-gray-800 truncate">${route.name || route.routeId}</p>
                    <p class="text-xs text-gray-500">
                      ${route.assignedDriver || 'Unknown driver'} • ${route.completedAt ? new Date(route.completedAt).toLocaleDateString() : 'N/A'}
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
                    <p class="font-medium text-gray-800 truncate">${truck.truckId}</p>
                    <p class="text-xs text-gray-500">${truck.plateNumber || 'No plate'}</p>
                  </div>
                </div>
                <div class="mt-3 flex items-center justify-between">
                  <span class="text-xs px-2 py-1 rounded-full font-medium ${
                    truck.status === 'available' ? 'bg-green-100 text-green-700' :
                    truck.status === 'in-use' ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-700'
                  }">${truck.status}</span>
                  ${truck.assignedDriver ? `<span class="text-xs text-gray-500">${truck.assignedDriver}</span>` : ''}
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
                  <p class="font-medium text-gray-800">${driver.username || 'Unknown'}</p>
                  <p class="text-xs text-gray-500">
                    ${driver.speed ? `${driver.speed.toFixed(1)} km/h` : 'Stationary'} • ${driver.routeId || 'No route'}
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
        btn.classList.add('bg-primary-50', 'text-primary-700');
        btn.classList.remove('text-gray-700');
      } else {
        btn.classList.remove('bg-primary-50', 'text-primary-700');
        btn.classList.add('text-gray-700');
      }
    }
  });
}

// Helper function to show page content area
function showPageContent() {
  const mapContainer = document.getElementById('mapContainer');
  const pageContainer = document.getElementById('pageContainer');
  if (mapContainer) mapContainer.classList.add('hidden');
  if (pageContainer) pageContainer.classList.remove('hidden');
}

// Helper function to show map
function showMapView() {
  const mapContainer = document.getElementById('mapContainer');
  const pageContainer = document.getElementById('pageContainer');
  if (mapContainer) mapContainer.classList.remove('hidden');
  if (pageContainer) pageContainer.classList.add('hidden');
}

// Store users data for sorting
let cachedUsersData = [];

async function showUserManagement() {
  showPageLoading('Loading users...');
  try {
    const response = await fetch(`${API_URL}/users`);
    cachedUsersData = await response.json();

    // Register sort handler
    sortHandlers.users = () => renderUserTable();

    renderUserTable();
  } catch (error) {
    console.error('Error loading users:', error);
    hidePageLoading();
    showPage('User Management', `
      <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <i data-lucide="alert-circle" class="w-12 h-12 text-red-500 mx-auto mb-3"></i>
        <p class="text-red-700">Error loading users: ${error.message}</p>
        <button onclick="showUserManagement()" class="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
          Try Again
        </button>
      </div>
    `);
  }
}

function renderUserTable() {
  const users = cachedUsersData;

  // Define searchable fields
  const searchFields = ['username', 'fullName', 'email', 'phoneNumber', 'role'];

  // Apply search filter first
  const filteredUsers = filterData(users, searchState.users, searchFields);

  // Apply sorting
  const { column, direction } = sortState.users;
  const sortedUsers = sortData(filteredUsers, column, direction);

  const admins = users.filter(u => u.role === 'admin');
  const drivers = users.filter(u => u.role === 'driver');
  const activeCount = users.filter(u => u.isActive).length;

  // Define sortable columns
  const columns = [
    { key: 'username', label: 'User', sortable: true },
    { key: 'fullName', label: 'Full Name', sortable: true },
    { key: 'phoneNumber', label: 'Phone', sortable: true },
    { key: 'role', label: 'Role', sortable: true },
    { key: 'isActive', label: 'Status', sortable: true },
    { key: 'actions', label: 'Actions', sortable: false }
  ];

  const userRows = sortedUsers.map(u => {
    const statusColor = u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
    const roleColor = u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700';
    const initial = (u.fullName || u.username || 'U').charAt(0).toUpperCase();

    return `
      <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
        <td class="px-4 py-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold">
              ${initial}
            </div>
            <div>
              <div class="font-medium text-gray-800">${u.username}</div>
              <div class="text-sm text-gray-500">${u.email}</div>
            </div>
          </div>
        </td>
        <td class="px-4 py-4 text-gray-700">${u.fullName || '-'}</td>
        <td class="px-4 py-4 text-gray-600">${u.phoneNumber || '-'}</td>
        <td class="px-4 py-4">
          <span class="px-3 py-1 rounded-full text-xs font-medium ${roleColor}">
            ${u.role === 'admin' ? 'Admin' : 'Driver'}
          </span>
        </td>
        <td class="px-4 py-4">
          <span class="px-3 py-1 rounded-full text-xs font-medium ${statusColor}">
            ${u.isActive ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td class="px-4 py-4">
          <div class="flex items-center gap-2">
            <button onclick="editUser('${u._id || u.username}')" class="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Edit">
              <i data-lucide="pencil" class="w-4 h-4 text-gray-600"></i>
            </button>
            ${u.role !== 'admin' ? `
              <button onclick="deleteUser('${u._id || u.username}')" class="p-2 hover:bg-red-100 rounded-lg transition-colors" title="Delete">
                <i data-lucide="trash-2" class="w-4 h-4 text-red-500"></i>
              </button>
            ` : `
              <span class="p-2 text-gray-400" title="Protected account">
                <i data-lucide="shield" class="w-4 h-4"></i>
              </span>
            `}
          </div>
        </td>
      </tr>
    `;
  }).join('');

    hidePageLoading();
    showPage('User Management', `
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <i data-lucide="users" class="w-6 h-6 text-blue-600"></i>
            </div>
            <div>
              <p class="text-sm text-gray-500">Total Users</p>
              <p class="text-2xl font-bold text-gray-800">${users.length}</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <i data-lucide="shield" class="w-6 h-6 text-purple-600"></i>
            </div>
            <div>
              <p class="text-sm text-gray-500">Admins</p>
              <p class="text-2xl font-bold text-gray-800">${admins.length}</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <i data-lucide="truck" class="w-6 h-6 text-green-600"></i>
            </div>
            <div>
              <p class="text-sm text-gray-500">Drivers</p>
              <p class="text-2xl font-bold text-gray-800">${drivers.length}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Users Table Card -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <!-- Table Header -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-4 border-b border-gray-100">
          <div>
            <h2 class="font-semibold text-gray-800">All Users</h2>
            <p class="text-sm text-gray-500">${sortedUsers.length} of ${users.length} users${searchState.users ? ' (filtered)' : ''}</p>
          </div>
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            ${createSearchInput('users', 'Search users...')}
            <button onclick="showAddUserForm()" class="flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors">
              <i data-lucide="plus" class="w-4 h-4"></i>
              <span>Add Driver</span>
            </button>
          </div>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-100">
              <tr>
                ${createSortableHeader('users', columns)}
              </tr>
            </thead>
            <tbody>
              ${userRows || '<tr><td colspan="6" class="px-4 py-8 text-center text-gray-500">No users found</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `);
}

window.showAddUserForm = function() {
  showModal('Add New Driver', `
    <form id="addUserForm" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Username *</label>
        <input type="text" id="newUsername" required
          class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
        <input type="text" id="newFullName" required
          class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
        <input type="email" id="newEmail" required
          class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Password *</label>
        <input type="password" id="newPassword" required minlength="6"
          class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
        <input type="tel" id="newPhone" placeholder="09XXXXXXXXX" required pattern="[0-9]{11}"
          class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
        <p class="mt-1 text-xs text-gray-500">Format: 09XXXXXXXXX (11 digits)</p>
      </div>
      <input type="hidden" id="newRole" value="driver">
      <div class="flex gap-3 pt-4">
        <button type="submit" class="flex-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors">
          Create Driver
        </button>
        <button type="button" onclick="closeModal()" class="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors">
          Cancel
        </button>
      </div>
    </form>
  `);
  
  document.getElementById('addUserForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userData = {
      username: document.getElementById('newUsername').value,
      fullName: document.getElementById('newFullName').value,
      email: document.getElementById('newEmail').value,
      password: document.getElementById('newPassword').value,
      phoneNumber: document.getElementById('newPhone').value,
      role: document.getElementById('newRole').value
    };
    
    try {
      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      if (response.ok) {
        closeModal();
        showToast('User created successfully!', 'success');
        showUserManagement();
      } else {
        const error = await response.json();
        showToast(error.error || 'Failed to create user', 'error');
      }
    } catch (error) {
      showToast('Error creating user: ' + error.message, 'error');
    }
  });
};

window.editUser = async function(userId) {
  try {
    const response = await fetch(`${API_URL}/users/${userId}`);
    const user = await response.json();
    
    // Check if editing admin
    const isAdmin = user.role === 'admin';
    
    showModal(isAdmin ? 'Edit Admin Profile' : 'Edit Driver', `
      <form id="editUserForm" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <input type="text" value="${user.username}" disabled
            class="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input type="text" id="editFullName" value="${user.fullName || ''}" required
            class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" id="editEmail" value="${user.email}" required
            class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
        </div>
        ${!isAdmin ? `
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <input type="tel" id="editPhone" value="${user.phoneNumber || ''}" pattern="[0-9]{11}"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
          <p class="mt-1 text-xs text-gray-500">Format: 09XXXXXXXXX (11 digits)</p>
        </div>
        ` : ''}
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">New Password (leave blank to keep current)</label>
          <input type="password" id="editPassword" minlength="6"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
        </div>
        ${isAdmin ? `
        <input type="hidden" id="editRole" value="admin">
        <div class="p-3 bg-blue-50 border border-blue-100 rounded-xl">
          <p class="text-sm text-blue-700 flex items-center gap-2">
            <i data-lucide="info" class="w-4 h-4"></i>
            Admin role cannot be changed
          </p>
        </div>
        ` : `
        <input type="hidden" id="editRole" value="driver">
        <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
          <input type="checkbox" id="editActive" ${user.isActive ? 'checked' : ''}
            class="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500">
          <label for="editActive" class="text-sm font-medium text-gray-700 cursor-pointer">Active Account</label>
        </div>
        `}
        <div class="flex gap-3 pt-4">
          <button type="submit" class="flex-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors">
            Update ${isAdmin ? 'Profile' : 'Driver'}
          </button>
          <button type="button" onclick="closeModal()" class="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors">
            Cancel
          </button>
        </div>
      </form>
    `);
    
    document.getElementById('editUserForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const updateData = {
        fullName: document.getElementById('editFullName').value,
        email: document.getElementById('editEmail').value,
        role: document.getElementById('editRole').value
      };
      
      // Only add phone and active status for drivers
      const phoneInput = document.getElementById('editPhone');
      if (phoneInput) {
        updateData.phoneNumber = phoneInput.value;
      }
      
      const activeInput = document.getElementById('editActive');
      if (activeInput) {
        updateData.isActive = activeInput.checked;
      }
      
      const newPassword = document.getElementById('editPassword').value;
      if (newPassword) {
        updateData.password = newPassword;
      }
      
      try {
        const response = await fetch(`${API_URL}/users/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        });
        
        if (response.ok) {
          closeModal();
          showToast('User updated successfully!', 'success');
          showUserManagement();
        } else {
          const error = await response.json();
          showToast(error.error || 'Failed to update user', 'error');
        }
      } catch (error) {
        showToast('Error updating user: ' + error.message, 'error');
      }
    });
  } catch (error) {
    showToast('Error loading user: ' + error.message, 'error');
  }
};

window.deleteUser = async function(userId) {
  if (!await showConfirm('Delete User', 'Are you sure you want to delete this user?')) {
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      showToast('User deleted successfully!', 'success');
      showUserManagement();
    } else {
      const error = await response.json();
      showToast(error.error || 'Failed to delete user', 'error');
    }
  } catch (error) {
    showToast('Error deleting user: ' + error.message, 'error');
  }
};

// Truck Management Functions
let cachedTrucksData = [];
let cachedTruckDrivers = [];

async function showTruckManagement() {
  showPageLoading('Loading trucks...');
  try {
    const [trucksRes, usersRes] = await Promise.all([
      fetch(`${API_URL}/trucks`),
      fetch(`${API_URL}/users`)
    ]);

    if (!trucksRes.ok) throw new Error(`Failed to load trucks: ${trucksRes.status}`);
    if (!usersRes.ok) throw new Error(`Failed to load users: ${usersRes.status}`);

    cachedTrucksData = await trucksRes.json();
    const users = await usersRes.json();
    cachedTruckDrivers = users.filter(u => u.role === 'driver');

    // Register sort handler
    sortHandlers.trucks = () => renderTruckTable();

    renderTruckTable();
  } catch (error) {
    console.error('Error loading trucks:', error);
    hidePageLoading();
    showPage('Truck Management', `
      <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <i data-lucide="alert-circle" class="w-12 h-12 text-red-500 mx-auto mb-3"></i>
        <p class="text-red-700">Error loading trucks: ${error.message}</p>
        <button onclick="showTruckManagement()" class="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
          Try Again
        </button>
      </div>
    `);
  }
}

function renderTruckTable() {
  const trucks = cachedTrucksData;
  const drivers = cachedTruckDrivers;

  // Define searchable fields
  const searchFields = ['truckId', 'plateNumber', 'model', 'status', 'assignedDriver'];

  // Apply search filter first
  const filteredTrucks = filterData(trucks, searchState.trucks, searchFields);

  // Apply sorting
  const { column, direction } = sortState.trucks;
  const sortedTrucks = sortData(filteredTrucks, column, direction);

  // Stats (from all trucks)
  const availableCount = trucks.filter(t => t.status === 'available').length;
  const inUseCount = trucks.filter(t => t.status === 'in-use').length;
  const maintenanceCount = trucks.filter(t => t.status === 'maintenance').length;
  const lowFuelCount = trucks.filter(t => t.fuelLevel < 25).length;

  // Define sortable columns
  const columns = [
    { key: 'truckId', label: 'Truck', sortable: true },
    { key: 'model', label: 'Model', sortable: true },
    { key: 'capacity', label: 'Capacity', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'assignedDriver', label: 'Driver', sortable: true },
    { key: 'fuelLevel', label: 'Fuel', sortable: true },
    { key: 'mileage', label: 'Mileage', sortable: true },
    { key: 'actions', label: 'Actions', sortable: false }
  ];

  const truckRows = sortedTrucks.map(t => {
      const driver = drivers.find(d => d.username === t.assignedDriver);
      const statusColors = {
        'available': 'bg-green-100 text-green-700',
        'in-use': 'bg-blue-100 text-blue-700',
        'maintenance': 'bg-yellow-100 text-yellow-700',
        'out-of-service': 'bg-red-100 text-red-700'
      };
      const fuelColor = t.fuelLevel > 50 ? 'bg-green-500' : t.fuelLevel > 25 ? 'bg-yellow-500' : 'bg-red-500';

      return `
        <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
          <td class="px-4 py-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <i data-lucide="truck" class="w-5 h-5 text-blue-600"></i>
              </div>
              <div>
                <div class="font-semibold text-gray-800">${t.truckId}</div>
                <div class="text-sm text-gray-500">${t.plateNumber}</div>
              </div>
            </div>
          </td>
          <td class="px-4 py-4 text-gray-600">${t.model || '-'}</td>
          <td class="px-4 py-4 text-gray-600">${t.capacity} kg</td>
          <td class="px-4 py-4">
            <span class="px-3 py-1 rounded-full text-xs font-medium ${statusColors[t.status] || 'bg-gray-100 text-gray-700'}">
              ${t.status}
            </span>
          </td>
          <td class="px-4 py-4">
            ${driver ? `
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-medium">
                  ${(driver.fullName || driver.username).charAt(0).toUpperCase()}
                </div>
                <span class="text-gray-700">${driver.fullName || driver.username}</span>
              </div>
            ` : '<span class="text-gray-400">Not assigned</span>'}
          </td>
          <td class="px-4 py-4">
            <div class="flex items-center gap-2">
              <div class="w-20 bg-gray-200 rounded-full h-2">
                <div class="${fuelColor} h-2 rounded-full" style="width: ${t.fuelLevel}%"></div>
              </div>
              <span class="text-sm ${t.fuelLevel < 25 ? 'text-red-600 font-medium' : 'text-gray-600'}">${t.fuelLevel}%</span>
            </div>
          </td>
          <td class="px-4 py-4 text-gray-600">${(t.mileage || 0).toLocaleString()} km</td>
          <td class="px-4 py-4">
            <div class="flex items-center gap-1">
              <button onclick="assignDriver('${t._id || t.truckId}')" class="p-2 hover:bg-green-100 rounded-lg transition-colors" title="Assign Driver">
                <i data-lucide="user-plus" class="w-4 h-4 text-green-600"></i>
              </button>
              ${t.assignedDriver ? `
                <button onclick="unassignTruck('${t._id || t.truckId}')" class="p-2 hover:bg-amber-100 rounded-lg transition-colors" title="Unassign Driver">
                  <i data-lucide="user-minus" class="w-4 h-4 text-amber-600"></i>
                </button>
              ` : ''}
              <button onclick="editTruck('${t._id || t.truckId}')" class="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Edit">
                <i data-lucide="pencil" class="w-4 h-4 text-gray-600"></i>
              </button>
              <button onclick="deleteTruck('${t._id || t.truckId}')" class="p-2 hover:bg-red-100 rounded-lg transition-colors" title="Delete">
                <i data-lucide="trash-2" class="w-4 h-4 text-red-500"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    hidePageLoading();
    showPage('Truck Management', `
      <!-- Stats Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <i data-lucide="truck" class="w-6 h-6 text-blue-600"></i>
            </div>
            <div>
              <p class="text-sm text-gray-500">Total Trucks</p>
              <p class="text-2xl font-bold text-gray-800">${trucks.length}</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <i data-lucide="check-circle" class="w-6 h-6 text-green-600"></i>
            </div>
            <div>
              <p class="text-sm text-gray-500">Available</p>
              <p class="text-2xl font-bold text-gray-800">${availableCount}</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <i data-lucide="wrench" class="w-6 h-6 text-yellow-600"></i>
            </div>
            <div>
              <p class="text-sm text-gray-500">Maintenance</p>
              <p class="text-2xl font-bold text-gray-800">${maintenanceCount}</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 ${lowFuelCount > 0 ? 'bg-red-100' : 'bg-gray-100'} rounded-xl flex items-center justify-center">
              <i data-lucide="fuel" class="w-6 h-6 ${lowFuelCount > 0 ? 'text-red-600' : 'text-gray-600'}"></i>
            </div>
            <div>
              <p class="text-sm text-gray-500">Low Fuel</p>
              <p class="text-2xl font-bold ${lowFuelCount > 0 ? 'text-red-600' : 'text-gray-800'}">${lowFuelCount}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Trucks Table Card -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <!-- Table Header -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-4 border-b border-gray-100">
          <div>
            <h2 class="font-semibold text-gray-800">All Trucks</h2>
            <p class="text-sm text-gray-500">${sortedTrucks.length} of ${trucks.length} trucks${searchState.trucks ? ' (filtered)' : ''}</p>
          </div>
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            ${createSearchInput('trucks', 'Search trucks...')}
            <button onclick="showAddTruckForm()" class="flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors">
              <i data-lucide="plus" class="w-4 h-4"></i>
              <span>Add Truck</span>
            </button>
          </div>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-100">
              <tr>
                ${createSortableHeader('trucks', columns)}
              </tr>
            </thead>
            <tbody>
              ${truckRows || '<tr><td colspan="8" class="px-4 py-8 text-center text-gray-500">No trucks found</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `);
}

window.showAddTruckForm = function() {
  showModal('Add New Truck', `
    <form id="addTruckForm" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Truck ID *</label>
        <input type="text" id="newTruckId" placeholder="e.g., TRUCK-003" required
          class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Plate Number *</label>
        <input type="text" id="newPlateNumber" placeholder="e.g., ABC-1234" required
          class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white uppercase">
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Model *</label>
        <input type="text" id="newModel" placeholder="e.g., Isuzu Elf" required
          class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Capacity (kg) *</label>
        <input type="number" id="newCapacity" value="1000" min="100" required
          class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea id="newNotes" rows="3" placeholder="Additional information about the truck"
          class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white resize-none"></textarea>
      </div>
      <div class="flex gap-3 pt-4">
        <button type="submit" class="flex-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors">
          Add Truck
        </button>
        <button type="button" onclick="closeModal()" class="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors">
          Cancel
        </button>
      </div>
    </form>
  `);
  
  document.getElementById('addTruckForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const truckData = {
      truckId: document.getElementById('newTruckId').value,
      plateNumber: document.getElementById('newPlateNumber').value.toUpperCase(),
      model: document.getElementById('newModel').value,
      capacity: parseInt(document.getElementById('newCapacity').value),
      notes: document.getElementById('newNotes').value
    };
    
    try {
      const response = await fetch(`${API_URL}/trucks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(truckData)
      });
      
      if (response.ok) {
        closeModal();
        showToast('Truck added successfully!', 'success');
        showTruckManagement();
      } else {
        const error = await response.json();
        showToast(error.error || 'Failed to add truck', 'error');
      }
    } catch (error) {
      showToast('Error adding truck: ' + error.message, 'error');
    }
  });
};

window.editTruck = async function(truckId) {
  try {
    const [truckRes, usersRes] = await Promise.all([
      fetch(`${API_URL}/trucks/${truckId}`),
      fetch(`${API_URL}/users`)
    ]);
    
    const truck = await truckRes.json();
    const users = await usersRes.json();
    const drivers = users.filter(u => u.role === 'driver');
    
    const driverOptions = drivers.map(d => 
      `<option value="${d.username}" ${truck.assignedDriver === d.username ? 'selected' : ''}>${d.fullName} (${d.username})</option>`
    ).join('');
    
    showModal('Edit Truck', `
      <form id="editTruckForm" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Truck ID</label>
          <input type="text" value="${truck.truckId}" disabled
            class="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed">
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Plate Number *</label>
            <input type="text" id="editPlateNumber" value="${truck.plateNumber}" required
              class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white uppercase">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Model</label>
            <input type="text" id="editModel" value="${truck.model || ''}"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Capacity (kg)</label>
            <input type="number" id="editCapacity" value="${truck.capacity}" min="100"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select id="editStatus"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
              <option value="available" ${truck.status === 'available' ? 'selected' : ''}>Available</option>
              <option value="in-use" ${truck.status === 'in-use' ? 'selected' : ''}>In Use</option>
              <option value="maintenance" ${truck.status === 'maintenance' ? 'selected' : ''}>Maintenance</option>
              <option value="out-of-service" ${truck.status === 'out-of-service' ? 'selected' : ''}>Out of Service</option>
            </select>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Assigned Driver</label>
          <select id="editDriver"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
            <option value="">None</option>
            ${driverOptions}
          </select>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Fuel Level (%)</label>
            <input type="number" id="editFuel" value="${truck.fuelLevel}" min="0" max="100"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Mileage (km)</label>
            <input type="number" id="editMileage" value="${truck.mileage}" min="0"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Last Maintenance</label>
            <input type="date" id="editLastMaintenance" value="${truck.lastMaintenance || ''}"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Next Maintenance</label>
            <input type="date" id="editNextMaintenance" value="${truck.nextMaintenance || ''}"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea id="editNotes" rows="3"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white resize-none">${truck.notes || ''}</textarea>
        </div>
        <div class="flex gap-3 pt-4">
          <button type="submit" class="flex-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors">
            Update Truck
          </button>
          <button type="button" onclick="closeModal()" class="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors">
            Cancel
          </button>
        </div>
      </form>
    `);
    
    document.getElementById('editTruckForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const updateData = {
        plateNumber: document.getElementById('editPlateNumber').value.toUpperCase(),
        model: document.getElementById('editModel').value,
        capacity: parseInt(document.getElementById('editCapacity').value),
        status: document.getElementById('editStatus').value,
        assignedDriver: document.getElementById('editDriver').value || null,
        fuelLevel: parseInt(document.getElementById('editFuel').value),
        mileage: parseInt(document.getElementById('editMileage').value),
        lastMaintenance: document.getElementById('editLastMaintenance').value || null,
        nextMaintenance: document.getElementById('editNextMaintenance').value || null,
        notes: document.getElementById('editNotes').value
      };
      
      try {
        const response = await fetch(`${API_URL}/trucks/${truckId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        });
        
        if (response.ok) {
          closeModal();
          showToast('Truck updated successfully!', 'success');
          showTruckManagement();
        } else {
          const error = await response.json();
          showToast(error.error || 'Failed to update truck', 'error');
        }
      } catch (error) {
        showToast('Error updating truck: ' + error.message, 'error');
      }
    });
  } catch (error) {
    showToast('Error loading truck: ' + error.message, 'error');
  }
};

window.assignDriver = async function(truckId) {
  try {
    const [truckRes, usersRes] = await Promise.all([
      fetch(`${API_URL}/trucks/${truckId}`),
      fetch(`${API_URL}/users`)
    ]);
    
    const truck = await truckRes.json();
    const users = await usersRes.json();
    const drivers = users.filter(u => u.role === 'driver');
    
    const driverOptions = drivers.map(d => 
      `<option value="${d.username}" ${truck.assignedDriver === d.username ? 'selected' : ''}>${d.fullName} (${d.username})</option>`
    ).join('');
    
    showModal('Assign Driver', `
      <form id="assignDriverForm" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Truck</label>
          <input type="text" value="${truck.truckId} - ${truck.plateNumber}" disabled
            class="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Select Driver *</label>
          <select id="assignDriverSelect" required
            class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
            <option value="">-- Select Driver --</option>
            ${driverOptions}
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Update Status</label>
          <select id="assignStatus"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
            <option value="in-use">In Use</option>
            <option value="available">Available</option>
          </select>
        </div>
        <div class="flex gap-3 pt-4">
          <button type="submit" class="flex-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors">
            Assign Driver
          </button>
          <button type="button" onclick="closeModal()" class="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors">
            Cancel
          </button>
        </div>
      </form>
    `);
    
    document.getElementById('assignDriverForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const selectedDriver = document.getElementById('assignDriverSelect').value;
      const status = document.getElementById('assignStatus').value;
      
      if (!selectedDriver) {
        showToast('Please select a driver', 'warning');
        return;
      }
      
      try {
        const response = await fetch(`${API_URL}/trucks/${truckId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assignedDriver: selectedDriver,
            status: status
          })
        });
        
        if (response.ok) {
          closeModal();
          showToast('Driver assigned successfully!', 'success');
          showTruckManagement();
        } else {
          const error = await response.json();
          showToast(error.error || 'Failed to assign driver', 'error');
        }
      } catch (error) {
        showToast('Error assigning driver: ' + error.message, 'error');
      }
    });
  } catch (error) {
    showToast('Error loading data: ' + error.message, 'error');
  }
};

window.unassignTruck = async function(truckId) {
  if (!await showConfirm('Unassign Driver', 'Are you sure you want to unassign the driver from this truck?')) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/trucks/${truckId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assignedDriver: null,
        status: 'available'
      })
    });

    if (response.ok) {
      showToast('Driver unassigned from truck successfully!', 'success');
      showTruckManagement();
    } else {
      const error = await response.json();
      showToast(error.error || 'Failed to unassign driver', 'error');
    }
  } catch (error) {
    showToast('Error unassigning driver: ' + error.message, 'error');
  }
};

window.deleteTruck = async function(truckId) {
  if (!await showConfirm('Delete Truck', 'Are you sure you want to delete this truck?')) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/trucks/${truckId}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      showToast('Truck deleted successfully!', 'success');
      showTruckManagement();
    } else {
      const error = await response.json();
      showToast(error.error || 'Failed to delete truck', 'error');
    }
  } catch (error) {
    showToast('Error deleting truck: ' + error.message, 'error');
  }
};


// Routes Management Functions
let routeLocations = [];
let tempMarkers = [];
let isAddingLocation = false;
let cachedRoutesData = [];
let cachedRouteDrivers = [];

async function showRoutesManagement() {
  showPageLoading('Loading routes...');
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
    hidePageLoading();
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
                <div class="font-semibold text-gray-800 group-hover:text-primary-700">${r.routeId}</div>
                <div class="text-sm text-gray-500">${r.name || 'Unnamed Route'}</div>
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
                <span class="text-gray-700">${driver.fullName || driver.username}</span>
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
              ${locationCount >= 2 ? `
                <button onclick="event.stopPropagation(); optimizeRouteUI('${r._id || r.routeId}')" class="p-2 hover:bg-indigo-100 rounded-lg transition-colors" title="Optimize Route">
                  <i data-lucide="sparkles" class="w-4 h-4 text-indigo-600"></i>
                </button>
              ` : ''}
              <button onclick="event.stopPropagation(); deleteRoute('${r._id || r.routeId}')" class="p-2 hover:bg-red-100 rounded-lg transition-colors" title="Delete">
                <i data-lucide="trash-2" class="w-4 h-4 text-red-500"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    hidePageLoading();
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
          placeholder="e.g., Downtown Collection Route"
          required
          class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 text-gray-700 placeholder-gray-400"
        >
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
    const routeData = {
      routeId: 'ROUTE-' + Date.now(), // Auto-generate route ID
      name: document.getElementById('newRouteName').value,
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
      const response = await fetch(`${API_URL}/routes`, {
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
    const response = await fetch(`${API_URL}/routes/${routeId}`, {
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
            <h3 class="font-bold text-gray-800">${route.name || 'Unnamed Route'}</h3>
            <p class="text-xs text-gray-500">${route.routeId}</p>
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
      ${route.path && route.path.coordinates && route.path.coordinates.length >= 2 ? `
        <button onclick="closeRouteInfoPanel(); optimizeRouteUI('${route._id || route.routeId}')" class="flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors" title="Optimize this route">
          <i data-lucide="sparkles" class="w-4 h-4"></i>
        </button>
      ` : ''}
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
window.optimizeRouteUI = async function(routeId) {
  try {
    const token = localStorage.getItem('token');

    // Show loading state
    showModal('Route Optimization', `
      <div class="text-center py-8">
        <div class="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
        <p class="text-gray-600">Analyzing route with real road distances...</p>
        <p class="text-xs text-gray-400 mt-2">Using OSRM routing engine</p>
      </div>
    `);

    // Call optimization API with enhanced options
    const response = await fetch(`${API_URL}/routes/${routeId}/optimize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        algorithm: '2-opt',
        apply: false,
        useRoadDistance: true,
        speedProfile: 'urban_collection'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to optimize route');
    }

    const result = await response.json();
    const opt = result.optimization;

    // Show comparison modal
    const savingsPercent = opt.savings.percentage || 0;
    const showOptimizeButton = savingsPercent > 0;
    const usedOsrm = opt.usedOsrm || false;

    // Get time breakdown if available
    const origTime = opt.original.estimatedTime;
    const optTime = opt.optimized.estimatedTime;
    const hasTimeBreakdown = origTime && origTime.totalMinutes !== undefined;

    // Build distance comparison info
    const straightLineOrig = opt.original.straightLineDistance;
    const straightLineOpt = opt.optimized.straightLineDistance;
    const showDistanceComparison = straightLineOrig && usedOsrm;

    showModal('Route Optimization Results', `
      <div class="space-y-4">
        <!-- OSRM Badge -->
        ${usedOsrm ? `
          <div class="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full w-fit">
            <i data-lucide="map-pin" class="w-3 h-3"></i>
            <span>Using real road distances (OSRM)</span>
          </div>
        ` : `
          <div class="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full w-fit">
            <i data-lucide="ruler" class="w-3 h-3"></i>
            <span>Using straight-line distances</span>
          </div>
        `}

        <!-- Stats Comparison -->
        <div class="grid grid-cols-2 gap-4">
          <!-- Original -->
          <div class="bg-red-50 rounded-xl p-4 border border-red-100">
            <div class="flex items-center gap-2 mb-2">
              <i data-lucide="route" class="w-5 h-5 text-red-500"></i>
              <span class="font-semibold text-red-700">Original Route</span>
            </div>
            <p class="text-2xl font-bold text-red-600">${opt.original.distance.toFixed(2)} km</p>
            ${showDistanceComparison ? `
              <p class="text-xs text-red-400">(${straightLineOrig.toFixed(2)} km straight-line)</p>
            ` : ''}
            <p class="text-sm text-red-500 mt-1">${hasTimeBreakdown ? origTime.formatted : (origTime.formatted || 'N/A')}</p>
            ${hasTimeBreakdown && origTime.breakdown ? `
              <div class="text-xs text-red-400 mt-1">
                Travel: ${origTime.breakdown.travel} | Stops: ${origTime.breakdown.stops}
              </div>
            ` : ''}
          </div>

          <!-- Optimized -->
          <div class="bg-green-50 rounded-xl p-4 border border-green-100">
            <div class="flex items-center gap-2 mb-2">
              <i data-lucide="sparkles" class="w-5 h-5 text-green-500"></i>
              <span class="font-semibold text-green-700">Optimized Route</span>
            </div>
            <p class="text-2xl font-bold text-green-600">${opt.optimized.distance.toFixed(2)} km</p>
            ${showDistanceComparison ? `
              <p class="text-xs text-green-400">(${straightLineOpt.toFixed(2)} km straight-line)</p>
            ` : ''}
            <p class="text-sm text-green-500 mt-1">${hasTimeBreakdown ? optTime.formatted : (optTime.formatted || 'N/A')}</p>
            ${hasTimeBreakdown && optTime.breakdown ? `
              <div class="text-xs text-green-400 mt-1">
                Travel: ${optTime.breakdown.travel} | Stops: ${optTime.breakdown.stops}
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Savings Summary -->
        <div class="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <i data-lucide="trending-down" class="w-5 h-5 text-indigo-600"></i>
              </div>
              <div>
                <p class="text-sm text-indigo-600">Potential Savings</p>
                <p class="text-xl font-bold text-indigo-700">${opt.savings.distance.toFixed(2)} km (${savingsPercent}%)</p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-sm text-indigo-600">Time Saved</p>
              <p class="text-lg font-semibold text-indigo-700">${opt.savings.time || 0} min</p>
            </div>
          </div>
        </div>

        <!-- Map Legend -->
        <div class="flex items-center gap-4 text-sm text-gray-600">
          <div class="flex items-center gap-2">
            <div class="w-4 h-1 bg-red-500 rounded"></div>
            <span>Original</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-4 h-1 bg-green-500 rounded"></div>
            <span>Optimized</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 bg-indigo-500 rounded-full"></div>
            <span>Depot</span>
          </div>
        </div>

        <!-- Algorithm Info -->
        <div class="text-xs text-gray-500 border-t border-gray-100 pt-3">
          <i data-lucide="info" class="w-3 h-3 inline"></i>
          Algorithm: ${opt.algorithm === '2-opt' ? '2-Opt Improvement' : 'Nearest Neighbor'} |
          Depot: ${opt.depot.name}
          ${opt.iterations ? ` | Iterations: ${opt.iterations}` : ''}
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3 mt-4">
          ${showOptimizeButton ? `
            <button onclick="applyRouteOptimization('${routeId}')"
                    class="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors">
              <i data-lucide="check" class="w-4 h-4"></i>
              Apply Optimization
            </button>
          ` : `
            <div class="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-500 rounded-lg">
              <i data-lucide="check-circle" class="w-4 h-4"></i>
              Route is already optimal
            </div>
          `}
          <button onclick="closeModal(); showRoutesManagement();"
                  class="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors">
            Close
          </button>
        </div>
      </div>
    `);

    // Display both routes on map
    clearTempMarkers();

    // Original route in red (dashed)
    if (opt.original.coordinates && opt.original.coordinates.length > 0) {
      const originalCoords = opt.original.coordinates.map(c => [c[1], c[0]]);
      const originalLine = L.polyline(originalCoords, {
        color: '#ef4444',
        weight: 3,
        dashArray: '10, 10',
        opacity: 0.7
      }).addTo(map);
      tempMarkers.push(originalLine);
    }

    // Optimized route in green (solid)
    if (opt.optimized.coordinates && opt.optimized.coordinates.length > 0) {
      const optimizedCoords = opt.optimized.coordinates.map(c => [c[1], c[0]]);
      const optimizedLine = L.polyline(optimizedCoords, {
        color: '#22c55e',
        weight: 4,
        opacity: 0.9
      }).addTo(map);
      tempMarkers.push(optimizedLine);

      // Add numbered markers for optimized route stops
      optimizedCoords.forEach((coord, idx) => {
        const marker = L.marker(coord, {
          icon: L.divIcon({
            className: 'custom-marker',
            html: `<div style="background: #22c55e; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${idx + 1}</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })
        }).addTo(map);
        tempMarkers.push(marker);
      });

      // Fit map to show all routes
      map.fitBounds(optimizedLine.getBounds().pad(0.1));
    }

    // Add depot marker
    if (opt.depot) {
      const depotMarker = L.marker([opt.depot.lat, opt.depot.lng], {
        icon: L.divIcon({
          className: 'custom-marker',
          html: `<div style="background: #6366f1; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">🏠</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        })
      }).bindPopup(`<b>Depot</b><br>${opt.depot.name}`).addTo(map);
      tempMarkers.push(depotMarker);
    }

    lucide.createIcons();

  } catch (error) {
    console.error('Optimization error:', error);
    showAlertModal('Optimization Failed', error.message, 'error');
  }
};

// Apply route optimization
window.applyRouteOptimization = async function(routeId) {
  try {
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_URL}/routes/${routeId}/optimize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        algorithm: '2-opt',
        apply: true,
        useRoadDistance: true,
        speedProfile: 'urban_collection'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to apply optimization');
    }

    const result = await response.json();
    const usedOsrm = result.optimization.usedOsrm ? ' (road distance)' : '';

    showToast(`Route optimized! Saved ${result.optimization.savings.distance.toFixed(2)} km (${result.optimization.savings.percentage}%)${usedOsrm}`, 'success');
    closeModal();
    clearTempMarkers();
    showRoutesManagement();

  } catch (error) {
    console.error('Apply optimization error:', error);
    showAlertModal('Error', error.message, 'error');
  }
};

window.deleteRoute = async function(routeId) {
  if (!await showConfirm('Delete Route', 'Are you sure you want to delete this route?')) {
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/routes/${routeId}`, {
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
    const response = await fetch(`${API_URL}/routes/${routeId}`, {
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
            <p class="text-sm"><span class="font-medium text-gray-500">Route:</span> <span class="text-gray-800">${route.routeId} - ${route.name}</span></p>
            <p class="text-sm"><span class="font-medium text-gray-500">Assigned to:</span> <span class="text-gray-800">${driverName}</span></p>
            <p class="text-sm flex items-center gap-2">
              <span class="font-medium text-gray-500">Status:</span>
              <span class="px-2 py-0.5 rounded-full text-xs font-medium ${route.status === 'active' ? 'bg-amber-100 text-amber-700' : route.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}">${route.status}</span>
            </p>
          </div>
          <p class="text-sm text-gray-600">
            Ang route na ito ay naka-assign na kay <strong class="text-gray-800">${driverName}</strong>.
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
    
    const driverOptions = drivers.map(d => 
      `<option value="${d.username}">${d.fullName} (${d.username})</option>`
    ).join('');
    
    showModal('Assign Route to Driver', `
      <form id="assignRouteForm" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Route</label>
          <input type="text" value="${route.routeId} - ${route.name}" disabled
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
        const response = await fetch(`${API_URL}/routes/${routeId}`, {
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


// ============================================
// DRIVER DASHBOARD FUNCTIONS
// ============================================

// Update driver quick stats in sidebar
async function updateDriverQuickStats() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/routes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const routes = await response.json();

    // Get today's date
    const today = new Date().toDateString();

    // Filter routes completed by this driver today
    const todayCompleted = routes.filter(r =>
      r.status === 'completed' &&
      r.completedBy === user.username &&
      r.completedAt && new Date(r.completedAt).toDateString() === today
    );

    // Calculate total distance today
    const todayDistance = todayCompleted.reduce((sum, r) => sum + (r.distance || 0), 0);

    // Update UI
    const routesEl = document.getElementById('driverTodayRoutes');
    const distanceEl = document.getElementById('driverTodayDistance');

    if (routesEl) routesEl.textContent = todayCompleted.length;
    if (distanceEl) distanceEl.textContent = (todayDistance / 1000).toFixed(1);

    // Check for active route and update panel
    updateActiveRoutePanel(routes);

  } catch (error) {
    console.error('Error updating driver stats:', error);
  }
}

// Update active route panel
async function updateActiveRoutePanel(routes) {
  const activeRouteId = localStorage.getItem('activeRouteId');
  const panel = document.getElementById('activeRoutePanel');

  if (!panel) return;

  if (activeRouteId) {
    // Find active route
    let activeRoute = routes ? routes.find(r => (r._id === activeRouteId || r.routeId === activeRouteId)) : null;

    if (!activeRoute) {
      // Fetch route if not in list
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/routes/${activeRouteId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          activeRoute = await response.json();
        }
      } catch (e) {
        console.error('Error fetching active route:', e);
      }
    }

    if (activeRoute) {
      panel.classList.remove('hidden');

      const stopsTotal = activeRoute.path?.coordinates?.length || 0;
      const stopsCompleted = activeRoute.completedStops || 0;

      document.getElementById('activeRouteName').textContent = activeRoute.name || 'Unnamed Route';
      document.getElementById('activeRouteProgress').textContent = `${stopsCompleted}/${stopsTotal}`;
      document.getElementById('activeRouteDistance').innerHTML = `<i data-lucide="map" class="w-3 h-3"></i> ${activeRoute.distance ? (activeRoute.distance / 1000).toFixed(1) : '-'} km`;
      document.getElementById('activeRouteETA').innerHTML = `<i data-lucide="clock" class="w-3 h-3"></i> ${activeRoute.estimatedTime || '-'} mins`;

      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    } else {
      panel.classList.add('hidden');
      localStorage.removeItem('activeRouteId');
    }
  } else {
    panel.classList.add('hidden');
  }
}

// Show vehicle inspection checklist
window.showVehicleInspection = function() {
  const inspectionItems = [
    { id: 'lights', label: 'Headlights & Taillights', icon: 'lightbulb' },
    { id: 'brakes', label: 'Brakes & Brake Lights', icon: 'disc' },
    { id: 'tires', label: 'Tires & Tire Pressure', icon: 'circle' },
    { id: 'mirrors', label: 'Mirrors (Side & Rear)', icon: 'square' },
    { id: 'horn', label: 'Horn Working', icon: 'volume-2' },
    { id: 'fuel', label: 'Fuel Level Adequate', icon: 'fuel' },
    { id: 'fluids', label: 'Oil & Fluids', icon: 'droplet' },
    { id: 'wipers', label: 'Windshield & Wipers', icon: 'cloud-rain' },
    { id: 'seatbelt', label: 'Seatbelt Functional', icon: 'shield-check' },
    { id: 'hydraulics', label: 'Hydraulic System (Lift)', icon: 'arrow-up-down' },
    { id: 'compactor', label: 'Compactor System', icon: 'minimize-2' },
    { id: 'leaks', label: 'No Visible Leaks', icon: 'droplets' }
  ];

  // Get saved inspection data
  const savedInspection = JSON.parse(localStorage.getItem('vehicleInspection') || '{}');
  const today = new Date().toDateString();
  const todayInspection = savedInspection.date === today ? savedInspection.items : {};

  const itemsHtml = inspectionItems.map(item => {
    const isChecked = todayInspection[item.id] === true;
    const hasProblem = todayInspection[item.id] === 'problem';

    return `
      <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
        <div class="flex items-center gap-3">
          <i data-lucide="${item.icon}" class="w-5 h-5 text-gray-500"></i>
          <span class="text-sm font-medium text-gray-700">${item.label}</span>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="markInspectionItem('${item.id}', true)"
                  class="w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isChecked ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500 hover:bg-green-100'}">
            <i data-lucide="check" class="w-4 h-4"></i>
          </button>
          <button onclick="markInspectionItem('${item.id}', 'problem')"
                  class="w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${hasProblem ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-500 hover:bg-red-100'}">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  const completedCount = Object.values(todayInspection).filter(v => v === true).length;
  const problemCount = Object.values(todayInspection).filter(v => v === 'problem').length;
  const progress = Math.round((completedCount / inspectionItems.length) * 100);

  showModal('Vehicle Inspection', `
    <div class="space-y-4">
      <!-- Header Stats -->
      <div class="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-4 border border-primary-100">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-gray-600">Pre-Trip Inspection</span>
          <span class="text-xs text-gray-500">${new Date().toLocaleDateString()}</span>
        </div>
        <div class="flex items-center gap-4">
          <div class="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
            <div class="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-300" style="width: ${progress}%"></div>
          </div>
          <span class="text-sm font-bold text-primary-600">${progress}%</span>
        </div>
        <div class="flex items-center gap-4 mt-2 text-xs">
          <span class="text-green-600"><i data-lucide="check-circle" class="w-3 h-3 inline"></i> ${completedCount} OK</span>
          ${problemCount > 0 ? `<span class="text-red-600"><i data-lucide="alert-circle" class="w-3 h-3 inline"></i> ${problemCount} Issues</span>` : ''}
        </div>
      </div>

      <!-- Inspection Items -->
      <div class="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
        ${itemsHtml}
      </div>

      <!-- Actions -->
      <div class="flex gap-3 pt-2">
        <button onclick="submitInspection()" class="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl transition-colors ${progress < 100 ? 'opacity-50 cursor-not-allowed' : ''}">
          <i data-lucide="clipboard-check" class="w-5 h-5"></i>
          Submit Inspection
        </button>
        <button onclick="closeModal()" class="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-xl transition-colors">
          Close
        </button>
      </div>
    </div>
  `);

  if (typeof lucide !== 'undefined') {
    setTimeout(() => lucide.createIcons(), 100);
  }
};

// Mark inspection item
window.markInspectionItem = function(itemId, value) {
  const savedInspection = JSON.parse(localStorage.getItem('vehicleInspection') || '{}');
  const today = new Date().toDateString();

  if (savedInspection.date !== today) {
    savedInspection.date = today;
    savedInspection.items = {};
  }

  savedInspection.items[itemId] = value;
  localStorage.setItem('vehicleInspection', JSON.stringify(savedInspection));

  // Refresh the modal
  showVehicleInspection();
};

// Submit inspection
window.submitInspection = async function() {
  const savedInspection = JSON.parse(localStorage.getItem('vehicleInspection') || '{}');
  const items = savedInspection.items || {};
  const problems = Object.entries(items).filter(([k, v]) => v === 'problem');

  if (problems.length > 0) {
    const confirmed = await showConfirm('Issues Found', `You reported ${problems.length} issue(s) with the vehicle.\n\nDo you want to submit this inspection and notify the admin?`);
    if (!confirmed) return;
  }

  // Mark inspection as submitted
  savedInspection.submitted = true;
  savedInspection.submittedAt = new Date().toISOString();
  localStorage.setItem('vehicleInspection', JSON.stringify(savedInspection));

  closeModal();
  showToast('Inspection submitted successfully!', 'success');

  if (problems.length > 0) {
    showToast('Admin has been notified about vehicle issues', 'warning');
  }
};

// Show driver statistics and performance metrics
window.showDriverStats = async function() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/routes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const routes = await response.json();

    // Filter completed routes by this driver
    const myRoutes = routes.filter(r => r.completedBy === user.username && r.status === 'completed');

    // Calculate statistics
    const today = new Date();
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const todayRoutes = myRoutes.filter(r => new Date(r.completedAt).toDateString() === today.toDateString());
    const weekRoutes = myRoutes.filter(r => new Date(r.completedAt) >= thisWeekStart);
    const monthRoutes = myRoutes.filter(r => new Date(r.completedAt) >= thisMonthStart);

    const totalDistance = myRoutes.reduce((sum, r) => sum + (r.distance || 0), 0);
    const weekDistance = weekRoutes.reduce((sum, r) => sum + (r.distance || 0), 0);
    const monthDistance = monthRoutes.reduce((sum, r) => sum + (r.distance || 0), 0);

    const totalStops = myRoutes.reduce((sum, r) => sum + (r.path?.coordinates?.length || 0), 0);

    // Calculate average completion time (if available)
    const routesWithTime = myRoutes.filter(r => r.startedAt && r.completedAt);
    let avgTime = '-';
    if (routesWithTime.length > 0) {
      const totalTime = routesWithTime.reduce((sum, r) => {
        return sum + (new Date(r.completedAt) - new Date(r.startedAt));
      }, 0);
      avgTime = Math.round(totalTime / routesWithTime.length / 60000); // in minutes
    }

    showModal('My Performance', `
      <div class="space-y-4">
        <!-- Overall Stats -->
        <div class="bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl p-4 border border-primary-100">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center">
              <i data-lucide="trophy" class="w-6 h-6 text-white"></i>
            </div>
            <div>
              <p class="text-sm text-gray-500">All Time</p>
              <p class="text-2xl font-bold text-gray-800">${myRoutes.length} Routes</p>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-3 text-center">
            <div class="bg-white/50 rounded-lg p-2">
              <p class="text-lg font-bold text-primary-600">${(totalDistance / 1000).toFixed(0)}</p>
              <p class="text-xs text-gray-500">km total</p>
            </div>
            <div class="bg-white/50 rounded-lg p-2">
              <p class="text-lg font-bold text-primary-600">${totalStops}</p>
              <p class="text-xs text-gray-500">stops</p>
            </div>
            <div class="bg-white/50 rounded-lg p-2">
              <p class="text-lg font-bold text-primary-600">${avgTime}</p>
              <p class="text-xs text-gray-500">avg mins</p>
            </div>
          </div>
        </div>

        <!-- Period Stats -->
        <div class="grid grid-cols-3 gap-3">
          <div class="bg-green-50 rounded-xl p-3 text-center border border-green-100">
            <p class="text-2xl font-bold text-green-600">${todayRoutes.length}</p>
            <p class="text-xs text-green-700 font-medium">Today</p>
          </div>
          <div class="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
            <p class="text-2xl font-bold text-blue-600">${weekRoutes.length}</p>
            <p class="text-xs text-blue-700 font-medium">This Week</p>
          </div>
          <div class="bg-purple-50 rounded-xl p-3 text-center border border-purple-100">
            <p class="text-2xl font-bold text-purple-600">${monthRoutes.length}</p>
            <p class="text-xs text-purple-700 font-medium">This Month</p>
          </div>
        </div>

        <!-- Distance Stats -->
        <div class="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <p class="text-sm font-semibold text-gray-700 mb-3">Distance Traveled</p>
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">This Week</span>
              <span class="font-bold text-gray-800">${(weekDistance / 1000).toFixed(1)} km</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">This Month</span>
              <span class="font-bold text-gray-800">${(monthDistance / 1000).toFixed(1)} km</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">All Time</span>
              <span class="font-bold text-gray-800">${(totalDistance / 1000).toFixed(1)} km</span>
            </div>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <p class="text-sm font-semibold text-gray-700 mb-3">Recent Completions</p>
          <div class="space-y-2 max-h-[150px] overflow-y-auto">
            ${myRoutes.slice(0, 5).map(r => `
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-600 truncate flex-1">${r.name || r.routeId}</span>
                <span class="text-gray-400 text-xs">${new Date(r.completedAt).toLocaleDateString()}</span>
              </div>
            `).join('') || '<p class="text-gray-400 text-sm text-center">No completed routes yet</p>'}
          </div>
        </div>

        <button onclick="closeModal()" class="w-full px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors">
          Close
        </button>
      </div>
    `);

    if (typeof lucide !== 'undefined') {
      setTimeout(() => lucide.createIcons(), 100);
    }
  } catch (error) {
    console.error('Error loading driver stats:', error);
    showToast('Error loading statistics', 'error');
  }
};

// Report incident
window.reportIncident = function() {
  showModal('Report Incident', `
    <div class="space-y-4">
      <p class="text-sm text-gray-600">Report any issues or incidents during your route.</p>

      <!-- Incident Type -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Incident Type</label>
        <div class="grid grid-cols-2 gap-2">
          <button onclick="selectIncidentType(this, 'vehicle')" class="incident-type-btn flex items-center gap-2 p-3 border-2 border-gray-200 rounded-xl hover:border-primary-300 transition-colors">
            <i data-lucide="truck" class="w-5 h-5 text-gray-500"></i>
            <span class="text-sm font-medium">Vehicle Issue</span>
          </button>
          <button onclick="selectIncidentType(this, 'road')" class="incident-type-btn flex items-center gap-2 p-3 border-2 border-gray-200 rounded-xl hover:border-primary-300 transition-colors">
            <i data-lucide="construction" class="w-5 h-5 text-gray-500"></i>
            <span class="text-sm font-medium">Road Block</span>
          </button>
          <button onclick="selectIncidentType(this, 'bin')" class="incident-type-btn flex items-center gap-2 p-3 border-2 border-gray-200 rounded-xl hover:border-primary-300 transition-colors">
            <i data-lucide="trash-2" class="w-5 h-5 text-gray-500"></i>
            <span class="text-sm font-medium">Bin Problem</span>
          </button>
          <button onclick="selectIncidentType(this, 'other')" class="incident-type-btn flex items-center gap-2 p-3 border-2 border-gray-200 rounded-xl hover:border-primary-300 transition-colors">
            <i data-lucide="alert-circle" class="w-5 h-5 text-gray-500"></i>
            <span class="text-sm font-medium">Other</span>
          </button>
        </div>
        <input type="hidden" id="incidentType" value="">
      </div>

      <!-- Description -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
        <textarea id="incidentDescription" rows="3" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none" placeholder="Describe the incident..."></textarea>
      </div>

      <!-- Photo Upload -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Photo (Optional)</label>
        <div class="flex items-center gap-3">
          <label class="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer transition-colors">
            <i data-lucide="camera" class="w-5 h-5 text-gray-500"></i>
            <span class="text-sm text-gray-600">Take Photo</span>
            <input type="file" id="incidentPhoto" accept="image/*" capture="environment" class="hidden" onchange="previewIncidentPhoto(this)">
          </label>
          <div id="incidentPhotoPreview" class="w-16 h-16 rounded-xl bg-gray-100 hidden overflow-hidden">
            <img id="incidentPhotoImg" class="w-full h-full object-cover">
          </div>
        </div>
      </div>

      <!-- Location -->
      <div class="flex items-center gap-2 p-3 bg-blue-50 rounded-xl">
        <i data-lucide="map-pin" class="w-5 h-5 text-blue-500"></i>
        <span class="text-sm text-blue-700">Current location will be attached automatically</span>
      </div>

      <!-- Actions -->
      <div class="flex gap-3">
        <button onclick="submitIncident()" class="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors">
          <i data-lucide="send" class="w-5 h-5"></i>
          Submit Report
        </button>
        <button onclick="closeModal()" class="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-xl transition-colors">
          Cancel
        </button>
      </div>
    </div>
  `);

  if (typeof lucide !== 'undefined') {
    setTimeout(() => lucide.createIcons(), 100);
  }
};

window.selectIncidentType = function(btn, type) {
  document.querySelectorAll('.incident-type-btn').forEach(b => {
    b.classList.remove('border-primary-500', 'bg-primary-50');
    b.classList.add('border-gray-200');
  });
  btn.classList.remove('border-gray-200');
  btn.classList.add('border-primary-500', 'bg-primary-50');
  document.getElementById('incidentType').value = type;
};

window.previewIncidentPhoto = function(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById('incidentPhotoImg').src = e.target.result;
      document.getElementById('incidentPhotoPreview').classList.remove('hidden');
    };
    reader.readAsDataURL(input.files[0]);
  }
};

window.submitIncident = async function() {
  const type = document.getElementById('incidentType').value;
  const description = document.getElementById('incidentDescription').value;

  if (!type) {
    showToast('Please select an incident type', 'warning');
    return;
  }

  if (!description.trim()) {
    showToast('Please describe the incident', 'warning');
    return;
  }

  // In a real app, this would send to the server
  closeModal();
  showToast('Incident reported successfully. Admin has been notified.', 'success');
};

// Show active route navigation with stop-by-stop tracking
window.showActiveRouteNavigation = async function() {
  const activeRouteId = localStorage.getItem('activeRouteId');
  if (!activeRouteId) {
    showToast('No active route', 'warning');
    return;
  }

  showPageLoading('Loading route...');
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/routes/${activeRouteId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Route not found');

    const route = await response.json();
    const stops = route.path?.coordinates || [];
    const completedStops = parseInt(localStorage.getItem(`route_${activeRouteId}_completed`) || '0');

    // Clear existing markers
    clearTempMarkers();

    // Show map view
    showMapView();

    // Add stop markers
    stops.forEach((coord, index) => {
      const isCompleted = index < completedStops;
      const isCurrent = index === completedStops;
      const isStart = index === 0;
      const isEnd = index === stops.length - 1;

      let bgColor = isCompleted ? 'bg-green-500' : isCurrent ? 'bg-orange-500' : 'bg-gray-400';
      if (isStart && !isCompleted) bgColor = 'bg-blue-500';
      if (isEnd && !isCompleted) bgColor = 'bg-red-500';

      const markerHtml = `
        <div class="relative">
          <div class="w-10 h-10 ${bgColor} rounded-full flex items-center justify-center shadow-lg border-3 border-white ${isCurrent ? 'animate-pulse' : ''}">
            ${isCompleted ? '<i data-lucide="check" class="w-5 h-5 text-white"></i>' :
              `<span class="text-white font-bold text-sm">${index + 1}</span>`}
          </div>
          ${isCurrent ? '<span class="absolute -top-1 -right-1 w-4 h-4 bg-orange-400 rounded-full animate-ping"></span>' : ''}
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-route-marker',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const marker = L.marker([coord[1], coord[0]], { icon: customIcon }).addTo(map);
      marker.bindPopup(`
        <div class="p-3 min-w-[200px]">
          <div class="flex items-center justify-between mb-2">
            <span class="font-bold text-gray-800">Stop ${index + 1}</span>
            <span class="text-xs px-2 py-1 rounded-full ${isCompleted ? 'bg-green-100 text-green-700' : isCurrent ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}">
              ${isCompleted ? 'Completed' : isCurrent ? 'Current' : 'Pending'}
            </span>
          </div>
          ${isCurrent ? `
            <div class="flex gap-2 mt-2">
              <button onclick="markStopCompleted(${index})" class="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg">
                <i data-lucide="check" class="w-4 h-4 inline"></i> Complete
              </button>
              <button onclick="skipStop(${index})" class="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg">
                Skip
              </button>
            </div>
          ` : ''}
        </div>
      `);
      tempMarkers.push(marker);
    });

    // Draw route line using Leaflet Routing Machine
    if (stops.length >= 2) {
      const waypoints = stops.map(c => L.latLng(c[1], c[0]));

      const routingControl = L.Routing.control({
        waypoints: waypoints,
        router: L.Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1',
          timeout: 15000
        }),
        lineOptions: {
          styles: [
            { color: '#1e1b4b', weight: 8, opacity: 0.3 },
            { color: '#f97316', weight: 5, opacity: 0.9 }
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

      routingControl.on('routesfound', (e) => {
        const container = routingControl.getContainer();
        if (container) container.style.display = 'none';

        if (typeof lucide !== 'undefined') {
          setTimeout(() => lucide.createIcons(), 100);
        }
      });

      tempMarkers.push(routingControl);
    }

    // Show navigation panel
    showNavigationPanel(route, stops, completedStops);

    hidePageLoading();
  } catch (error) {
    console.error('Error showing route navigation:', error);
    showToast('Error loading route', 'error');
    hidePageLoading();
  }
};

// Show navigation panel
function showNavigationPanel(route, stops, completedStops) {
  const existingPanel = document.getElementById('navigationPanel');
  if (existingPanel) existingPanel.remove();

  const currentStop = completedStops < stops.length ? completedStops : stops.length - 1;
  const progress = Math.round((completedStops / stops.length) * 100);

  const panel = document.createElement('div');
  panel.id = 'navigationPanel';
  panel.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-2xl shadow-2xl z-[1000] w-[95%] max-w-md animate-fade-in overflow-hidden';

  panel.innerHTML = `
    <!-- Header -->
    <div class="px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-400 text-white">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs opacity-80">Now navigating</p>
          <h3 class="font-bold">${route.name || 'Unnamed Route'}</h3>
        </div>
        <button onclick="closeNavigationPanel()" class="p-2 hover:bg-white/20 rounded-lg transition-colors">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>
    </div>

    <!-- Progress -->
    <div class="px-4 py-3 bg-gray-50 border-b border-gray-100">
      <div class="flex items-center justify-between text-sm mb-2">
        <span class="text-gray-600">Progress</span>
        <span class="font-bold text-orange-600">${completedStops}/${stops.length} stops</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div class="bg-gradient-to-r from-orange-400 to-orange-500 h-2 rounded-full transition-all" style="width: ${progress}%"></div>
      </div>
    </div>

    <!-- Current Stop -->
    <div class="p-4">
      ${completedStops < stops.length ? `
        <div class="bg-orange-50 rounded-xl p-4 border border-orange-200 mb-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
              <span class="text-white font-bold text-lg">${currentStop + 1}</span>
            </div>
            <div class="flex-1">
              <p class="text-sm text-orange-600 font-medium">Current Stop</p>
              <p class="font-bold text-gray-800">Stop ${currentStop + 1} of ${stops.length}</p>
            </div>
          </div>
        </div>

        <div class="flex gap-2">
          <button onclick="markStopCompleted(${currentStop})" class="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl transition-colors">
            <i data-lucide="check-circle" class="w-5 h-5"></i>
            Mark Complete
          </button>
          <button onclick="skipStop(${currentStop})" class="flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-xl transition-colors">
            <i data-lucide="skip-forward" class="w-5 h-5"></i>
          </button>
        </div>
      ` : `
        <div class="text-center py-4">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <i data-lucide="check-circle" class="w-8 h-8 text-green-600"></i>
          </div>
          <p class="font-bold text-gray-800 mb-1">All Stops Completed!</p>
          <p class="text-sm text-gray-500 mb-4">Ready to finish this route?</p>
          <button onclick="markRouteComplete('${route._id || route.routeId}')" class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl transition-colors">
            <i data-lucide="flag" class="w-5 h-5"></i>
            Complete Route
          </button>
        </div>
      `}
    </div>
  `;

  document.body.appendChild(panel);

  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// Mark stop as completed
window.markStopCompleted = function(stopIndex) {
  const activeRouteId = localStorage.getItem('activeRouteId');
  if (!activeRouteId) return;

  const completedStops = parseInt(localStorage.getItem(`route_${activeRouteId}_completed`) || '0');
  localStorage.setItem(`route_${activeRouteId}_completed`, stopIndex + 1);

  showToast(`Stop ${stopIndex + 1} completed!`, 'success');
  showActiveRouteNavigation();
};

// Skip a stop
window.skipStop = async function(stopIndex) {
  const confirmed = await showConfirm('Skip Stop', 'Are you sure you want to skip this stop?\n\nPlease select a reason:');
  if (!confirmed) return;

  const activeRouteId = localStorage.getItem('activeRouteId');
  if (!activeRouteId) return;

  localStorage.setItem(`route_${activeRouteId}_completed`, stopIndex + 1);
  showToast(`Stop ${stopIndex + 1} skipped`, 'info');
  showActiveRouteNavigation();
};

// Close navigation panel
window.closeNavigationPanel = function() {
  const panel = document.getElementById('navigationPanel');
  if (panel) panel.remove();
};

// ============================================
// MOBILE DRIVER NAVIGATION
// ============================================

// Initialize mobile driver navigation
function initMobileDriverNav() {
  // Set home as active by default
  setMobileNavActive('home');

  // Update GPS button state
  updateMobileGpsButton();

  // Check for active route and update indicator
  updateMobileRouteIndicator();

  // Re-initialize icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// Set active mobile nav button
function setMobileNavActive(navId) {
  document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.nav === navId) {
      btn.classList.add('active');
    }
  });
}

// Update mobile GPS button state
function updateMobileGpsButton() {
  const btn = document.getElementById('mobileGpsBtn');
  const btnText = document.getElementById('mobileGpsBtnText');
  const isTracking = localStorage.getItem('gpsTracking') === 'true';

  if (btn && btnText) {
    if (isTracking) {
      btn.classList.remove('bg-primary-500', 'hover:bg-primary-600');
      btn.classList.add('bg-red-500', 'hover:bg-red-600');
      btnText.textContent = 'Stop GPS';
    } else {
      btn.classList.remove('bg-red-500', 'hover:bg-red-600');
      btn.classList.add('bg-primary-500', 'hover:bg-primary-600');
      btnText.textContent = 'Start GPS';
    }
  }
}

// Update mobile route indicator
function updateMobileRouteIndicator() {
  const existingIndicator = document.getElementById('mobileRouteIndicator');
  if (existingIndicator) existingIndicator.remove();

  const activeRouteId = localStorage.getItem('activeRouteId');
  if (!activeRouteId) return;

  // Create indicator
  const indicator = document.createElement('div');
  indicator.id = 'mobileRouteIndicator';
  indicator.className = 'mobile-route-indicator lg:hidden';
  indicator.innerHTML = `
    <span class="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
    <span class="text-sm font-medium text-gray-700">Route Active</span>
    <button onclick="showActiveRouteNavigation()" class="text-xs text-primary-600 font-medium ml-2">View</button>
  `;

  document.body.appendChild(indicator);
}

// Show mobile driver home panel
window.showMobileDriverHome = function() {
  setMobileNavActive('home');

  const panel = document.getElementById('mobileDriverPanel');
  const content = document.getElementById('mobileDriverContent');

  if (!panel || !content) return;

  // Build home content with quick stats and assignments
  content.innerHTML = `
    <div class="space-y-4">
      <!-- Quick Stats -->
      <div class="grid grid-cols-2 gap-3">
        <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <p class="text-xs text-green-600 font-medium">Today</p>
          <p id="mobileDriverTodayRoutes" class="text-2xl font-bold text-green-700">0</p>
          <p class="text-xs text-green-500">routes completed</p>
        </div>
        <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <p class="text-xs text-blue-600 font-medium">Distance</p>
          <p id="mobileDriverTodayDistance" class="text-2xl font-bold text-blue-700">0</p>
          <p class="text-xs text-blue-500">km today</p>
        </div>
      </div>

      <!-- Active Route (if any) -->
      <div id="mobileActiveRouteCard"></div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-4 gap-2">
        <button onclick="showVehicleInspection(); closeMobilePanel();" class="flex flex-col items-center gap-2 p-3 bg-white border border-gray-200 rounded-xl active:bg-gray-100">
          <i data-lucide="clipboard-check" class="w-6 h-6 text-primary-600"></i>
          <span class="text-xs text-gray-600">Inspect</span>
        </button>
        <button onclick="showDriverStats(); closeMobilePanel();" class="flex flex-col items-center gap-2 p-3 bg-white border border-gray-200 rounded-xl active:bg-gray-100">
          <i data-lucide="bar-chart-3" class="w-6 h-6 text-primary-600"></i>
          <span class="text-xs text-gray-600">Stats</span>
        </button>
        <button onclick="reportIncident(); closeMobilePanel();" class="flex flex-col items-center gap-2 p-3 bg-white border border-gray-200 rounded-xl active:bg-gray-100">
          <i data-lucide="alert-triangle" class="w-6 h-6 text-red-500"></i>
          <span class="text-xs text-gray-600">Report</span>
        </button>
        <button onclick="showDriverHistory(); closeMobilePanel();" class="flex flex-col items-center gap-2 p-3 bg-white border border-gray-200 rounded-xl active:bg-gray-100">
          <i data-lucide="history" class="w-6 h-6 text-primary-600"></i>
          <span class="text-xs text-gray-600">History</span>
        </button>
      </div>

      <!-- My Assignments -->
      <div>
        <h3 class="text-sm font-semibold text-gray-700 mb-2">My Assignments</h3>
        <div id="mobileDriverAssignments" class="space-y-2">
          <div class="text-center py-4 text-gray-400">
            <i data-lucide="loader" class="w-5 h-5 mx-auto animate-spin"></i>
          </div>
        </div>
      </div>
    </div>
  `;

  // Show panel
  panel.classList.remove('hidden');
  setTimeout(() => panel.querySelector('div').classList.add('mobile-panel-visible'), 10);

  // Load data
  loadMobileDriverData();

  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
};

// Load mobile driver data
async function loadMobileDriverData() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/routes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const routes = await response.json();

    // Today's stats
    const today = new Date().toDateString();
    const todayCompleted = routes.filter(r =>
      r.status === 'completed' &&
      r.completedBy === user.username &&
      r.completedAt && new Date(r.completedAt).toDateString() === today
    );
    const todayDistance = todayCompleted.reduce((sum, r) => sum + (r.distance || 0), 0);

    // Update stats
    const routesEl = document.getElementById('mobileDriverTodayRoutes');
    const distanceEl = document.getElementById('mobileDriverTodayDistance');
    if (routesEl) routesEl.textContent = todayCompleted.length;
    if (distanceEl) distanceEl.textContent = (todayDistance / 1000).toFixed(1);

    // Check active route
    const activeRouteId = localStorage.getItem('activeRouteId');
    const activeRouteCard = document.getElementById('mobileActiveRouteCard');

    if (activeRouteId && activeRouteCard) {
      const activeRoute = routes.find(r => (r._id === activeRouteId || r.routeId === activeRouteId));
      if (activeRoute) {
        const stopsCount = activeRoute.path?.coordinates?.length || 0;
        activeRouteCard.innerHTML = `
          <div class="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-4 border border-orange-200">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                <span class="text-sm font-semibold text-orange-700">Active Route</span>
              </div>
              <span class="text-xs bg-orange-500 text-white px-2 py-1 rounded-full">In Progress</span>
            </div>
            <p class="font-bold text-gray-800">${activeRoute.name || 'Unnamed Route'}</p>
            <p class="text-xs text-gray-500 mt-1">${stopsCount} stops • ${activeRoute.distance ? (activeRoute.distance / 1000).toFixed(1) + ' km' : '-'}</p>
            <div class="flex gap-2 mt-3">
              <button onclick="showActiveRouteNavigation(); closeMobilePanel();" class="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 text-white font-medium rounded-xl active:bg-orange-600">
                <i data-lucide="navigation" class="w-4 h-4"></i>
                Continue Route
              </button>
            </div>
          </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
    }

    // Load assignments
    const myRoutes = routes.filter(r => r.assignedDriver === user.username && r.status !== 'completed');
    const assignmentsEl = document.getElementById('mobileDriverAssignments');

    if (assignmentsEl) {
      if (myRoutes.length === 0) {
        assignmentsEl.innerHTML = `
          <div class="text-center py-4 text-gray-400">
            <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
            <p class="text-sm">No pending assignments</p>
          </div>
        `;
      } else {
        assignmentsEl.innerHTML = myRoutes.map(route => {
          const isActive = activeRouteId === (route._id || route.routeId);
          const stopsCount = route.path?.coordinates?.length || 0;

          return `
            <div class="${isActive ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200'} rounded-xl p-3 border">
              <div class="flex items-center justify-between mb-2">
                <p class="font-semibold text-gray-800 truncate flex-1">${route.name || 'Unnamed'}</p>
                ${isActive ? '<span class="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full">Active</span>' : ''}
              </div>
              <p class="text-xs text-gray-500 mb-2">${stopsCount} stops • ${route.distance ? (route.distance / 1000).toFixed(1) + ' km' : '-'}</p>
              <div class="flex gap-2">
                ${isActive ? `
                  <button onclick="showActiveRouteNavigation(); closeMobilePanel();" class="flex-1 px-3 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg active:bg-orange-600">
                    Continue
                  </button>
                ` : `
                  <button onclick="viewDriverRoute('${route._id || route.routeId}'); closeMobilePanel();" class="px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg active:bg-gray-200">
                    View
                  </button>
                  <button onclick="startCollection('${route._id || route.routeId}'); closeMobilePanel();" class="flex-1 px-3 py-2 bg-green-500 text-white text-sm font-medium rounded-lg active:bg-green-600">
                    Start Route
                  </button>
                `}
              </div>
            </div>
          `;
        }).join('');
      }
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }

  } catch (error) {
    console.error('Error loading mobile driver data:', error);
  }
}

// Show mobile active route
window.showMobileActiveRoute = function() {
  setMobileNavActive('route');

  const activeRouteId = localStorage.getItem('activeRouteId');
  if (activeRouteId) {
    closeMobilePanel();
    showActiveRouteNavigation();
  } else {
    // Show panel with no active route message
    const panel = document.getElementById('mobileDriverPanel');
    const content = document.getElementById('mobileDriverContent');

    if (!panel || !content) return;

    content.innerHTML = `
      <div class="text-center py-8">
        <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i data-lucide="navigation" class="w-8 h-8 text-gray-400"></i>
        </div>
        <p class="font-semibold text-gray-800 mb-2">No Active Route</p>
        <p class="text-sm text-gray-500 mb-4">Start a route from your assignments to begin navigation.</p>
        <button onclick="showMobileDriverHome()" class="px-6 py-3 bg-primary-500 text-white font-medium rounded-xl active:bg-primary-600">
          View Assignments
        </button>
      </div>
    `;

    panel.classList.remove('hidden');
    setTimeout(() => panel.querySelector('div').classList.add('mobile-panel-visible'), 10);

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
};

// Close mobile panel
window.closeMobilePanel = function() {
  const panel = document.getElementById('mobileDriverPanel');
  if (panel) {
    panel.querySelector('div').classList.remove('mobile-panel-visible');
    setTimeout(() => panel.classList.add('hidden'), 300);
  }
};

// Toggle mobile panel
window.toggleMobilePanel = function() {
  const panel = document.getElementById('mobileDriverPanel');
  if (panel) {
    if (panel.classList.contains('hidden')) {
      showMobileDriverHome();
    } else {
      closeMobilePanel();
    }
  }
};

async function loadDriverAssignments() {
  const container = document.getElementById('driverAssignments');

  try {
    container.innerHTML = `
      <div class="text-center py-4 text-gray-400">
        <i data-lucide="loader" class="w-6 h-6 mx-auto mb-2 animate-spin"></i>
        <p class="text-sm">Loading assignments...</p>
      </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();

    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };

    const [routesRes, trucksRes] = await Promise.all([
      fetch(`${API_URL}/routes`, { headers }),
      fetch(`${API_URL}/trucks`, { headers })
    ]);

    if (!routesRes.ok || !trucksRes.ok) {
      throw new Error('Failed to load data');
    }

    const routes = await routesRes.json();
    const trucks = await trucksRes.json();

    // Filter routes assigned to this driver (not completed)
    const myRoutes = routes.filter(r => r.assignedDriver === user.username && r.status !== 'completed');

    // Filter trucks assigned to this driver
    const myTrucks = trucks.filter(t => t.assignedDriver === user.username);

    if (myRoutes.length === 0 && myTrucks.length === 0) {
      container.innerHTML = `
        <div class="text-center py-6 text-gray-400">
          <i data-lucide="inbox" class="w-10 h-10 mx-auto mb-2 opacity-50"></i>
          <p class="text-sm font-medium">No assignments yet</p>
          <p class="text-xs mt-1">Check back later for new routes</p>
        </div>
      `;
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    let html = '';

    // Show assigned trucks first
    if (myTrucks.length > 0) {
      myTrucks.forEach(truck => {
        const fuelColor = truck.fuelLevel > 50 ? 'text-green-600' : truck.fuelLevel > 20 ? 'text-yellow-600' : 'text-red-600';
        html += `
          <div class="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <i data-lucide="truck" class="w-5 h-5 text-green-600"></i>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-gray-800 truncate">${truck.truckId}</p>
                <p class="text-xs text-gray-500">${truck.plateNumber} • ${truck.model}</p>
              </div>
              <div class="text-right">
                <p class="text-sm font-bold ${fuelColor}">${truck.fuelLevel || 0}%</p>
                <p class="text-xs text-gray-400">Fuel</p>
              </div>
            </div>
          </div>
        `;
      });
    }

    // Show assigned routes
    if (myRoutes.length > 0) {
      myRoutes.forEach(route => {
        const activeRouteId = localStorage.getItem('activeRouteId');
        const isCurrentlyActive = activeRouteId === (route._id || route.routeId);
        const stopsCount = route.path?.coordinates?.length || 0;

        const statusConfig = {
          'active': { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-500', text: 'Active' },
          'planned': { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-500', text: 'Planned' },
          'pending': { bg: 'bg-gray-50', border: 'border-gray-200', badge: 'bg-gray-500', text: 'Pending' }
        };
        const config = statusConfig[route.status] || statusConfig.pending;

        html += `
          <div class="${isCurrentlyActive ? 'bg-orange-50 border-orange-300' : config.bg + ' ' + config.border} rounded-xl p-3 border ${isCurrentlyActive ? 'ring-2 ring-orange-400' : ''} transition-all">
            <div class="flex items-start justify-between gap-2 mb-2">
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-gray-800 truncate">${route.name || 'Unnamed Route'}</p>
                <p class="text-xs text-gray-500">${route.routeId}</p>
              </div>
              ${isCurrentlyActive ? `
                <span class="flex items-center gap-1 px-2 py-1 bg-orange-500 text-white text-xs font-medium rounded-full whitespace-nowrap">
                  <span class="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                  In Progress
                </span>
              ` : `
                <span class="px-2 py-1 ${config.badge} text-white text-xs font-medium rounded-full">${config.text}</span>
              `}
            </div>

            <div class="flex items-center gap-3 text-xs text-gray-500 mb-3">
              <span class="flex items-center gap-1">
                <i data-lucide="map-pin" class="w-3 h-3"></i>
                ${stopsCount} stops
              </span>
              <span class="flex items-center gap-1">
                <i data-lucide="ruler" class="w-3 h-3"></i>
                ${route.distance ? (route.distance / 1000).toFixed(1) + ' km' : '-'}
              </span>
            </div>

            <div class="flex gap-2">
              ${isCurrentlyActive ? `
                <button onclick="showActiveRouteNavigation()" class="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium rounded-lg transition-colors">
                  <i data-lucide="navigation" class="w-3 h-3"></i>
                  Continue
                </button>
                <button onclick="markRouteComplete('${route._id || route.routeId}')" class="flex items-center justify-center gap-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors">
                  <i data-lucide="check" class="w-3 h-3"></i>
                </button>
                <button onclick="stopCollection()" class="flex items-center justify-center px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-600 text-xs font-medium rounded-lg transition-colors">
                  <i data-lucide="square" class="w-3 h-3"></i>
                </button>
              ` : `
                <button onclick="viewDriverRoute('${route._id || route.routeId}')" class="flex items-center justify-center gap-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-medium rounded-lg transition-colors">
                  <i data-lucide="eye" class="w-3 h-3"></i>
                  View
                </button>
                <button onclick="startCollection('${route._id || route.routeId}')" class="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors">
                  <i data-lucide="play" class="w-3 h-3"></i>
                  Start Route
                </button>
              `}
            </div>
          </div>
        `;
      });
    }

    container.innerHTML = html;

    // Re-initialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    // Auto-refresh every 30 seconds
    setTimeout(loadDriverAssignments, 30000);
  } catch (error) {
    console.error('Error loading assignments:', error);
    container.innerHTML = `
      <div class="text-center py-4">
        <div class="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
          <i data-lucide="alert-circle" class="w-5 h-5 text-red-500"></i>
        </div>
        <p class="text-sm text-red-600 font-medium">Error loading assignments</p>
        <p class="text-xs text-gray-500 mt-1">${error.message}</p>
        <button onclick="loadDriverAssignments()" class="mt-3 flex items-center justify-center gap-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors mx-auto">
          <i data-lucide="refresh-cw" class="w-4 h-4"></i>
          Retry
        </button>
      </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
}

window.viewDriverRoute = async function(routeId) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/routes/${routeId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const route = await response.json();
    
    // Clear previous route
    clearTempMarkers();
    
    // Display route on map
    if (route.path && route.path.coordinates) {
      const coords = route.path.coordinates.map(c => [c[1], c[0]]);
      
      // Draw route line
      const line = L.polyline(coords, { 
        color: '#667eea', 
        weight: 4,
        opacity: 0.8
      }).addTo(map);
      tempMarkers.push(line);
      
      // Add markers for each location
      coords.forEach((coord, index) => {
        const marker = L.circleMarker(coord, {
          radius: 8,
          fillColor: '#667eea',
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        }).addTo(map);
        marker.bindPopup(`Location ${index + 1}`);
        tempMarkers.push(marker);
      });
      
      // Fit map to route bounds
      map.fitBounds(line.getBounds());
      
      showAlertModal('Route Information', `Route: ${route.name}\nLocations: ${coords.length}\nDistance: ${route.distance ? (route.distance / 1000).toFixed(2) + ' km' : '-'}`, 'info');
    }
  } catch (error) {
    showToast('Error loading route: ' + error.message, 'error');
  }
};

// Start collection for a route
window.startCollection = async function(routeId) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/routes/${routeId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const route = await response.json();
    
    // Confirm start
    const confirmed = await showConfirm('Start Collection', `Start collection for:\n${route.name} (${route.routeId})\n\nThis will:\n• Position truck at first bin\n• Start GPS tracking\n• Begin route navigation\n\nReady to start?`);
    
    if (!confirmed) return;
    
    // Store active route ID
    localStorage.setItem('activeRouteId', routeId);
    
    // Update route status to active
    await fetch(`${API_URL}/routes/${routeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        status: 'active',
        startedAt: new Date().toISOString(),
        startedBy: user.username
      })
    });
    
    // Position truck at first bin and start tracking
    await positionTruckAtFirstBin();
    
    // Start GPS tracking if not already started
    if (!trackingEnabled) {
      startGPSTracking();
    }
    
    // Show success message
    showAlertModal('Collection Started', `Route: ${route.name}\n\nTruck positioned at first bin\nGPS tracking active`, 'success');

    // Refresh assignments to show updated status
    loadDriverAssignments();
    if (typeof loadDriverAssignmentsOverlay === 'function') loadDriverAssignmentsOverlay();
    if (typeof syncOverlayGPSState === 'function') syncOverlayGPSState();
    if (typeof syncMobileOverlay === 'function') syncMobileOverlay();

  } catch (error) {
    console.error('Error starting collection:', error);
    showToast('Error starting collection: ' + error.message, 'error');
  }
};

// Stop collection
window.stopCollection = async function() {
  const confirmed = await showConfirm('Stop Collection', 'Stop current collection?\n\nThis will:\n• Stop GPS tracking\n• Remove truck from map\n• Clear active route\n\nYou can restart later.');

  if (!confirmed) return;

  // Stop GPS tracking
  stopGPSTracking();

  // Clear active route
  localStorage.removeItem('activeRouteId');

  // Refresh assignments
  loadDriverAssignments();
  if (typeof loadDriverAssignmentsOverlay === 'function') loadDriverAssignmentsOverlay();
  if (typeof syncOverlayGPSState === 'function') syncOverlayGPSState();
  if (typeof syncMobileOverlay === 'function') syncMobileOverlay();

  showAlertModal('Collection Stopped', 'You can restart anytime from your assignments.', 'info');
};

window.markRouteComplete = async function(routeId) {
  try {
    const token = localStorage.getItem('token');

    // Fetch route info and trip data in parallel
    const [routeResponse, tripResponse] = await Promise.all([
      fetch(`${API_URL}/routes/${routeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch(`${API_URL}/tracking/my-trip`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
    ]);

    const route = await routeResponse.json();
    const tripResult = await tripResponse.json();

    // Extract trip data (auto-calculated from GPS)
    const tripData = tripResult.hasActiveTrip && tripResult.trip ? tripResult.trip : null;
    const distanceKm = tripData?.distance?.km || 0;
    const fuelLiters = tripData?.fuel?.liters || 0;
    const stops = tripData?.stops || 0;
    const avgSpeed = tripData?.averageSpeed || 0;

    showModal('Mark Route as Complete', `
      <form id="completeRouteForm" enctype="multipart/form-data" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Route</label>
          <input type="text" value="${route.name} (${route.routeId})" disabled
            class="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed">
        </div>

        <!-- Auto-calculated Trip Summary -->
        <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
          <div class="flex items-center gap-2 mb-3">
            <i data-lucide="calculator" class="w-5 h-5 text-green-600"></i>
            <span class="font-semibold text-green-800">Trip Summary (Auto-calculated)</span>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-white rounded-lg p-3 text-center border border-green-100">
              <div class="text-2xl font-bold text-green-600">${distanceKm.toFixed(2)}</div>
              <div class="text-xs text-gray-500">Distance (km)</div>
            </div>
            <div class="bg-white rounded-lg p-3 text-center border border-green-100">
              <div class="text-2xl font-bold text-orange-600">${fuelLiters.toFixed(2)}</div>
              <div class="text-xs text-gray-500">Est. Fuel (L)</div>
            </div>
            <div class="bg-white rounded-lg p-3 text-center border border-green-100">
              <div class="text-2xl font-bold text-blue-600">${stops}</div>
              <div class="text-xs text-gray-500">Stops Made</div>
            </div>
            <div class="bg-white rounded-lg p-3 text-center border border-green-100">
              <div class="text-2xl font-bold text-purple-600">${avgSpeed}</div>
              <div class="text-xs text-gray-500">Avg Speed (km/h)</div>
            </div>
          </div>
          ${distanceKm === 0 ? '<p class="text-xs text-amber-600 mt-2 text-center">⚠️ No GPS data recorded. Enable GPS tracking next time.</p>' : ''}
        </div>

        <!-- Hidden fields for trip data -->
        <input type="hidden" id="tripDistanceKm" value="${distanceKm}">
        <input type="hidden" id="tripFuelLiters" value="${fuelLiters}">
        <input type="hidden" id="tripStops" value="${stops}">
        <input type="hidden" id="tripAvgSpeed" value="${avgSpeed}">

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Upload Proof Photos * (1-10 photos)</label>
          <input type="file" id="completionPhotos" accept="image/*" multiple required
            class="w-full px-4 py-2.5 border-2 border-dashed border-primary-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-primary-50 hover:bg-primary-100 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-500 file:text-white hover:file:bg-primary-600">
          <p class="mt-2 text-xs text-gray-500">Upload photos ng collected waste as proof. Max 5MB per photo.</p>
          <div id="photoPreview" class="flex flex-wrap gap-2 mt-3"></div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Completion Notes</label>
          <textarea id="completionNotes" rows="3" placeholder="Add any notes about the collection (optional)"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white resize-none"></textarea>
        </div>

        <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <p class="text-sm text-amber-700 flex items-center gap-2">
            <i data-lucide="alert-triangle" class="w-4 h-4"></i>
            Once marked as complete, the admin will be notified and this route will be locked.
          </p>
        </div>

        <div class="flex gap-3 pt-4">
          <button type="submit" class="flex-1 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl transition-colors">
            Mark as Complete
          </button>
          <button type="button" onclick="closeModal()" class="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors">
            Cancel
          </button>
        </div>
      </form>
    `);
    
    // Photo preview
    document.getElementById('completionPhotos').addEventListener('change', function(e) {
      const preview = document.getElementById('photoPreview');
      preview.innerHTML = '';
      const files = Array.from(e.target.files);
      
      if (files.length > 10) {
        showToast('Maximum 10 photos allowed', 'warning');
        e.target.value = '';
        return;
      }
      
      files.forEach(file => {
        if (file.size > 5 * 1024 * 1024) {
          showToast(`File ${file.name} is too large. Max 5MB.`, 'warning');
          return;
        }
        
        const reader = new FileReader();
        reader.onload = function(event) {
          const img = document.createElement('img');
          img.src = event.target.result;
          img.style.cssText = 'width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 2px solid #ddd;';
          preview.appendChild(img);
        };
        reader.readAsDataURL(file);
      });
    });
    
    // Form submission
    document.getElementById('completeRouteForm').addEventListener('submit', async (e) => {
      e.preventDefault();

      const photos = document.getElementById('completionPhotos').files;
      const notes = document.getElementById('completionNotes').value;

      // Get auto-calculated trip data
      const tripDistanceKm = parseFloat(document.getElementById('tripDistanceKm').value) || 0;
      const tripFuelLiters = parseFloat(document.getElementById('tripFuelLiters').value) || 0;
      const tripStops = parseInt(document.getElementById('tripStops').value) || 0;
      const tripAvgSpeed = parseFloat(document.getElementById('tripAvgSpeed').value) || 0;

      if (photos.length === 0) {
        showToast('Please upload at least one photo as proof', 'warning');
        return;
      }

      const formData = new FormData();
      for (let i = 0; i < photos.length; i++) {
        formData.append('photos', photos[i]);
      }
      formData.append('notes', notes);
      // Include trip data in completion
      formData.append('distanceTraveled', tripDistanceKm);
      formData.append('fuelConsumed', tripFuelLiters);
      formData.append('stopsCompleted', tripStops);
      formData.append('averageSpeed', tripAvgSpeed);

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/completions/${routeId}/complete`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (response.ok) {
          const result = await response.json();

          // Auto-log fuel consumption if we have distance data
          if (tripDistanceKm > 0 && tripFuelLiters > 0) {
            try {
              await fetch(`${API_URL}/tracking/end-trip`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
              });
              console.log('Trip ended and fuel logged:', tripDistanceKm, 'km,', tripFuelLiters, 'L');
            } catch (err) {
              console.log('Could not end trip:', err);
            }
          }

          showAlertModal('Route Completed', `Route marked as complete! Admin has been notified.\n\n📊 Trip Summary:\n• Distance: ${tripDistanceKm.toFixed(2)} km\n• Est. Fuel: ${tripFuelLiters.toFixed(2)} L`, 'success');
          closeModal();
          localStorage.removeItem('activeRouteId');
          loadDriverAssignments();
          if (typeof loadDriverAssignmentsOverlay === 'function') loadDriverAssignmentsOverlay();
          if (typeof updateDriverOverlayStats === 'function') updateDriverOverlayStats();
          stopGPSTracking();
          if (typeof syncOverlayGPSState === 'function') syncOverlayGPSState();
          if (typeof syncMobileOverlay === 'function') syncMobileOverlay();
        } else {
          const error = await response.json();
          showToast(error.error || 'Failed to complete route', 'error');
        }
      } catch (error) {
        showToast('Error completing route: ' + error.message, 'error');
      }
    });
  } catch (error) {
    showToast('Error loading route: ' + error.message, 'error');
  }
};

window.updateRouteStatus = async function(routeId) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/routes/${routeId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const route = await response.json();
    
    showModal('Update Route Status', `
      <form id="updateStatusForm" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Route</label>
          <input type="text" value="${route.name}" disabled
            class="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
          <input type="text" value="${route.status}" disabled
            class="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed capitalize">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">New Status *</label>
          <select id="newStatus" required
            class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
            <option value="active" ${route.status === 'active' ? 'selected' : ''}>Active (In Progress)</option>
            <option value="completed" ${route.status === 'completed' ? 'selected' : ''}>Completed</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea id="statusNotes" rows="3" placeholder="Add any notes about this update..."
            class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white resize-none"></textarea>
        </div>
        <div class="flex gap-3 pt-4">
          <button type="submit" class="flex-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors">
            Update Status
          </button>
          <button type="button" onclick="closeModal()" class="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors">
            Cancel
          </button>
        </div>
      </form>
    `);
    
    document.getElementById('updateStatusForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const newStatus = document.getElementById('newStatus').value;
      const notes = document.getElementById('statusNotes').value;
      
      try {
        const token = localStorage.getItem('token');
        const updateResponse = await fetch(`${API_URL}/routes/${routeId}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            status: newStatus,
            notes: notes || route.notes
          })
        });
        
        if (updateResponse.ok) {
          showToast('Status updated successfully!', 'success');
          closeModal();
          loadDriverAssignments();
        } else {
          const error = await updateResponse.json();
          showToast(error.error || 'Failed to update status', 'error');
        }
      } catch (error) {
        showToast('Error updating status: ' + error.message, 'error');
      }
    });
  } catch (error) {
    showToast('Error loading route: ' + error.message, 'error');
  }
};


// Admin Notification System
// Create permanent notification icon in header
function createNotificationIcon() {
  console.log('createNotificationIcon called, user role:', user.role);

  if (user.role !== 'admin') {
    console.log('Not admin, skipping notification icon');
    return;
  }

  let badge = document.getElementById('notificationBadge');
  if (badge) {
    console.log('Notification badge already exists');
    return; // Already exists
  }

  const container = document.getElementById('headerNotificationContainer');
  console.log('Container found:', container);

  if (!container) {
    console.error('headerNotificationContainer not found!');
    return;
  }

  badge = document.createElement('button');
  badge.id = 'notificationBadge';
  badge.className = 'relative p-2 hover:bg-white/10 rounded-lg transition-colors';
  badge.title = 'Click to view notifications';
  badge.innerHTML = `
    <i data-lucide="bell" class="w-5 h-5"></i>
    <span id="notificationCount" class="hidden absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold"></span>
  `;
  badge.onclick = () => showNotificationHistory();
  container.appendChild(badge);

  // Initialize Lucide icon
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  console.log('Notification badge created successfully!');
}

async function checkCompletionNotifications() {
  if (user.role !== 'admin') return;
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/completions/notifications/pending`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const notifications = await response.json();
      
      if (notifications.length > 0) {
        showCompletionNotifications(notifications);
      }
    }
  } catch (error) {
    console.error('Error checking notifications:', error);
  }
}

function showCompletionNotifications(notifications) {
  // Update existing notification badge
  let badge = document.getElementById('notificationBadge');
  if (!badge) {
    createNotificationIcon();
    badge = document.getElementById('notificationBadge');
  }

  if (badge) {
    badge.title = `${notifications.length} new notification${notifications.length > 1 ? 's' : ''} - Click to view`;
    badge.classList.add('notification-pulse');

    // Update notification count badge
    const countBadge = document.getElementById('notificationCount');
    if (countBadge) {
      countBadge.textContent = notifications.length;
      countBadge.classList.remove('hidden');
    }

    badge.onclick = () => showNotificationDetails(notifications);
  }
}

async function showNotificationDetails(notifications) {
  const notificationsList = notifications.map(route => {
    const completedDate = new Date(route.completedAt).toLocaleString();
    
    return `
      <div style="background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%); padding: 1rem; border-radius: 10px; margin-bottom: 0.75rem; border-left: 5px solid #4caf50; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="flex: 1;">
            <h4 style="margin: 0; color: #4caf50; font-size: 1.2rem;">✓ ${route.completedBy}</h4>
            <p style="margin: 0.25rem 0 0 0; color: #666; font-size: 0.85rem;">completed <strong>${route.name}</strong></p>
            <p style="margin: 0.25rem 0 0 0; color: #999; font-size: 0.8rem;">${completedDate}</p>
          </div>
          <div style="display: flex; gap: 0.5rem; flex-shrink: 0;">
            <button onclick="viewCompletionDetails('${route._id || route.routeId}')" class="btn-small" style="background: #2196f3; color: white; padding: 0.4rem 0.8rem; border: none; border-radius: 5px; cursor: pointer; font-size: 0.85rem;" title="View details">
              👁️ View
            </button>
            <button onclick="markNotificationRead('${route._id || route.routeId}')" class="btn-small" style="background: #4caf50; color: white; padding: 0.4rem 0.8rem; border: none; border-radius: 5px; cursor: pointer; font-size: 0.85rem;" title="Acknowledge">
              ✓
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  showModal('🔔 Active Notifications', `
    <div>
      <div style="margin-bottom: 1rem; padding: 1rem; background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%); border-radius: 8px; border-left: 4px solid #4caf50;">
        <p style="color: #4caf50; font-weight: 700; margin: 0; font-size: 1.1rem;">
          🎉 ${notifications.length} New Completion${notifications.length > 1 ? 's' : ''}!
        </p>
        <p style="color: #666; margin: 0.25rem 0 0 0; font-size: 0.85rem;">
          Drivers have completed their assigned routes
        </p>
      </div>
      <div style="background: #e3f2fd; padding: 0.75rem; border-radius: 6px; margin-bottom: 1rem; border-left: 3px solid #2196f3;">
        <p style="margin: 0; color: #1565c0; font-size: 0.85rem;">
          💡 <strong>Tip:</strong> Click <strong>View</strong> to see details, or <strong>✓</strong> to acknowledge. Use buttons below for bulk actions.
        </p>
      </div>
      <div style="max-height: 500px; overflow-y: auto; padding-right: 0.5rem;">
        ${notificationsList}
      </div>
      <div class="flex gap-3 mt-4 pt-4 border-t border-gray-200">
        <button onclick="markAllNotificationsRead()" class="flex-1 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2">
          <i data-lucide="check-circle" class="w-4 h-4"></i>
          Acknowledge All
        </button>
        <button onclick="deleteAllNotifications()" class="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
          Delete All
        </button>
      </div>
    </div>
  `);
}

window.viewCompletionDetails = async function(routeId) {
  try {
    const token = localStorage.getItem('token');
    // Use completions endpoint to get full route details including photos
    const response = await fetch(`${API_URL}/completions/${routeId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      console.error('Failed to fetch route details');
      return;
    }
    
    const route = await response.json();
    
    if (!route) return;
    
    const completedDate = new Date(route.completedAt).toLocaleString();
    const photosHtml = route.completionPhotos && route.completionPhotos.length > 0 ? 
      route.completionPhotos.map((photo, index) => 
        `<img src="${photo}" style="width: 120px; height: 120px; object-fit: cover; border-radius: 8px; margin: 0.25rem; cursor: pointer; border: 2px solid #4caf50;" onclick="openPhotoModal('${index}', ${JSON.stringify(route.completionPhotos).replace(/'/g, "\\'")})" title="Click to view full size">`
      ).join('') : 
      '<p style="color: #999;">No photos uploaded</p>';
    
    showModal(`✓ ${route.name || 'Route Completed'}`, `
      <div style="padding: 0.5rem;">
        <div style="background: #e8f5e9; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
          <p style="margin: 0.5rem 0;"><strong>Route ID:</strong> ${route.routeId}</p>
          <p style="margin: 0.5rem 0;"><strong>👤 Driver:</strong> ${route.completedBy}</p>
          <p style="margin: 0.5rem 0;"><strong>🕐 Completed:</strong> ${completedDate}</p>
          ${route.completionNotes ? `<p style="margin: 0.5rem 0;"><strong>📝 Notes:</strong> ${route.completionNotes}</p>` : ''}
        </div>
        <div>
          <strong>📷 Proof Photos (${route.completionPhotos ? route.completionPhotos.length : 0}):</strong>
          <div style="display: flex; flex-wrap: wrap; margin-top: 0.5rem; gap: 0.5rem;">
            ${photosHtml}
          </div>
        </div>
        <button onclick="closeModal(); checkCompletionNotifications();" class="w-full px-4 py-2.5 mt-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors">Close</button>
      </div>
    `);
  } catch (error) {
    console.error('Error viewing details:', error);
    showToast('Error loading completion details: ' + error.message, 'error');
  }
};

// Helper function to open photo in full size modal
window.openPhotoModal = function(index, photos) {
  const photo = photos[index];
  const photoWindow = window.open('', '_blank');
  photoWindow.document.write(`
    <html>
      <head><title>Completion Photo ${index + 1}</title></head>
      <body style="margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #000;">
        <img src="${photo}" style="max-width: 100%; max-height: 100vh; object-fit: contain;">
      </body>
    </html>
  `);
};

window.markNotificationRead = async function(routeId) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/completions/notifications/${routeId}/read`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      // Remove notification badge if no more notifications
      checkCompletionNotifications();
      closeModal();
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};

// Delete single notification
window.deleteNotification = async function(routeId) {
  if (!await showConfirm('Delete from History', 'Permanently delete this route from history? This cannot be undone.')) {
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    
    // Delete the route permanently
    const response = await fetch(`${API_URL}/routes/${routeId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      showToast('Route deleted permanently', 'success');
      checkCompletionNotifications();
      closeModal();
    } else {
      const error = await response.text();
      console.error('Delete failed:', error);
      showToast('Failed to delete route: ' + error, 'error');
    }
  } catch (error) {
    console.error('Error deleting notification:', error);
    showToast('Error deleting notification: ' + error.message, 'error');
  }
};

// Delete all notifications
window.deleteAllNotifications = async function() {
  if (!await showConfirm('Delete All Notifications', 'Delete all notifications? This cannot be undone.')) {
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    const notificationsRes = await fetch(`${API_URL}/completions/notifications/pending`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const notifications = await notificationsRes.json();
    
    // Mark all as read (delete)
    await Promise.all(notifications.map(route => {
      saveNotificationToHistory(route._id || route.routeId);
      return fetch(`${API_URL}/completions/notifications/${route._id || route.routeId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    }));
    
    // Update badge to show 0 notifications
    const badge = document.getElementById('notificationBadge');
    if (badge) {
      badge.style.background = 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)';
      badge.style.borderColor = '#e0e0e0';
      badge.style.animation = 'none';
      badge.title = 'No new notifications - Click to view history';
      
      const notificationText = document.getElementById('notificationText');
      if (notificationText) {
        notificationText.textContent = 'No New';
        notificationText.style.cssText = 'color: #999;';
      }
    }
    
    showToast('All notifications deleted', 'success');
    closeModal();
    
    // Check for new notifications after 5 seconds
    setTimeout(checkCompletionNotifications, 5000);
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    showToast('Error deleting notifications', 'error');
  }
};

// Save notification to history (localStorage)
function saveNotificationToHistory(routeId) {
  const history = JSON.parse(localStorage.getItem('notificationHistory') || '[]');
  history.push({
    routeId,
    deletedAt: new Date().toISOString(),
    deletedBy: user.username
  });
  // Keep only last 50 items
  if (history.length > 50) {
    history.shift();
  }
  localStorage.setItem('notificationHistory', JSON.stringify(history));
}

// Show notification history
window.showNotificationHistory = async function() {
  // Show loading state immediately
  showPage('Completion History', `
    <div class="flex flex-col items-center justify-center py-16">
      <div class="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mb-4"></div>
      <p class="text-gray-500">Loading completion history...</p>
    </div>
  `);

  try {
    const token = localStorage.getItem('token');

    // Don't load photos initially - load them lazily
    const response = await fetch(`${API_URL}/routes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const routes = await response.json();
    const completedRoutes = routes.filter(r => r.status === 'completed' && r.completedAt);
    completedRoutes.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

    // Stats
    const acknowledgedCount = completedRoutes.filter(r => r.notificationSent).length;
    const pendingCount = completedRoutes.filter(r => !r.notificationSent).length;
    const withPhotosCount = completedRoutes.filter(r => r.completionPhotos && r.completionPhotos.length > 0).length;

    const historyCards = completedRoutes.map(route => {
      const completedDate = new Date(route.completedAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      });
      const completedTime = new Date(route.completedAt).toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit'
      });
      const isAcknowledged = route.notificationSent;
      const photoCount = route.completionPhotos ? route.completionPhotos.length : 0;

      return `
        <div class="bg-white rounded-xl shadow-sm border ${isAcknowledged ? 'border-gray-100' : 'border-green-200'} overflow-hidden">
          <!-- Card Header -->
          <div class="flex items-center justify-between px-5 py-4 ${isAcknowledged ? 'bg-gray-50' : 'bg-green-50'} border-b ${isAcknowledged ? 'border-gray-100' : 'border-green-100'}">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full ${isAcknowledged ? 'bg-gray-200' : 'bg-green-100'} flex items-center justify-center">
                <i data-lucide="${isAcknowledged ? 'check-circle' : 'bell'}" class="w-5 h-5 ${isAcknowledged ? 'text-gray-600' : 'text-green-600'}"></i>
              </div>
              <div>
                <h3 class="font-semibold ${isAcknowledged ? 'text-gray-700' : 'text-green-700'}">${route.name || 'Unnamed Route'}</h3>
                <p class="text-sm text-gray-500">${route.routeId}</p>
              </div>
            </div>
            <span class="px-3 py-1 rounded-full text-xs font-medium ${isAcknowledged ? 'bg-gray-200 text-gray-700' : 'bg-green-100 text-green-700'}">
              ${isAcknowledged ? 'Acknowledged' : 'New'}
            </span>
          </div>

          <!-- Card Body -->
          <div class="p-5 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-xs text-gray-500 mb-1">Completed By</p>
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-medium">
                    ${(route.completedBy || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span class="font-medium text-gray-800">${route.completedBy || 'Unknown'}</span>
                </div>
              </div>
              <div>
                <p class="text-xs text-gray-500 mb-1">Completed</p>
                <p class="font-medium text-gray-800">${completedDate}</p>
                <p class="text-sm text-gray-500">${completedTime}</p>
              </div>
            </div>

            ${route.tripStats && route.tripStats.distanceTraveled > 0 ? `
              <div class="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-3 border border-orange-200">
                <p class="text-xs text-orange-600 font-medium mb-2 flex items-center gap-1">
                  <i data-lucide="fuel" class="w-3 h-3"></i>
                  Auto-calculated Trip Data
                </p>
                <div class="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <p class="text-lg font-bold text-gray-800">${route.tripStats.distanceTraveled.toFixed(1)}</p>
                    <p class="text-xs text-gray-500">km</p>
                  </div>
                  <div>
                    <p class="text-lg font-bold text-orange-600">${route.tripStats.fuelConsumed.toFixed(1)}</p>
                    <p class="text-xs text-gray-500">Liters</p>
                  </div>
                  <div>
                    <p class="text-lg font-bold text-gray-800">${route.tripStats.stopsCompleted || 0}</p>
                    <p class="text-xs text-gray-500">Stops</p>
                  </div>
                  <div>
                    <p class="text-lg font-bold text-gray-800">${route.tripStats.averageSpeed || 0}</p>
                    <p class="text-xs text-gray-500">km/h</p>
                  </div>
                </div>
              </div>
            ` : ''}

            ${route.completionNotes ? `
              <div>
                <p class="text-xs text-gray-500 mb-1">Notes</p>
                <p class="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">${route.completionNotes}</p>
              </div>
            ` : ''}

            ${photoCount > 0 ? `
              <div>
                <button onclick="viewCompletionPhotos('${route._id || route.routeId}')"
                  class="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm">
                  <i data-lucide="image" class="w-4 h-4"></i>
                  <span>View ${photoCount} Photo${photoCount > 1 ? 's' : ''}</span>
                </button>
              </div>
            ` : ''}
          </div>

          <!-- Card Footer -->
          <div class="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-end">
            <button onclick="deleteHistoryItem('${route._id || route.routeId}')" class="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
              <span>Delete</span>
            </button>
          </div>
        </div>
      `;
    }).join('');

    showPage('Completion History', `
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <i data-lucide="check-circle" class="w-6 h-6 text-blue-600"></i>
            </div>
            <div>
              <p class="text-sm text-gray-500">Total Completed</p>
              <p class="text-2xl font-bold text-gray-800">${completedRoutes.length}</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 ${pendingCount > 0 ? 'bg-green-100' : 'bg-gray-100'} rounded-xl flex items-center justify-center">
              <i data-lucide="bell" class="w-6 h-6 ${pendingCount > 0 ? 'text-green-600' : 'text-gray-600'}"></i>
            </div>
            <div>
              <p class="text-sm text-gray-500">Pending Review</p>
              <p class="text-2xl font-bold ${pendingCount > 0 ? 'text-green-600' : 'text-gray-800'}">${pendingCount}</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <i data-lucide="camera" class="w-6 h-6 text-purple-600"></i>
            </div>
            <div>
              <p class="text-sm text-gray-500">With Photos</p>
              <p class="text-2xl font-bold text-gray-800">${withPhotosCount}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Bar -->
      ${completedRoutes.length > 0 ? `
        <div class="flex items-center justify-between mb-6">
          <p class="text-sm text-gray-500">Showing ${completedRoutes.length} completed route${completedRoutes.length !== 1 ? 's' : ''}</p>
          <button onclick="clearAllHistory()" class="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
            <span>Clear All History</span>
          </button>
        </div>
      ` : ''}

      <!-- History Cards Grid -->
      ${completedRoutes.length > 0 ? `
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          ${historyCards}
        </div>
      ` : `
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i data-lucide="inbox" class="w-8 h-8 text-gray-400"></i>
          </div>
          <h3 class="text-lg font-semibold text-gray-700 mb-2">No Completion History</h3>
          <p class="text-gray-500">Completed routes will appear here</p>
        </div>
      `}
    `);
  } catch (error) {
    console.error('Error loading history:', error);
    showPage('Completion History', `
      <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <i data-lucide="alert-circle" class="w-12 h-12 text-red-500 mx-auto mb-3"></i>
        <p class="text-red-700">Error loading history: ${error.message}</p>
        <button onclick="showNotificationHistory()" class="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
          Try Again
        </button>
      </div>
    `);
  }
};

// View completion photos (lazy load)
window.viewCompletionPhotos = async function(routeId) {
  showModal('Loading Photos...', `
    <div class="flex flex-col items-center justify-center py-8">
      <div class="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mb-3"></div>
      <p class="text-gray-500">Loading photos...</p>
    </div>
  `);

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/routes/${routeId}?includePhotos=true`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const route = await response.json();
    const photos = route.completionPhotos || [];

    if (photos.length === 0) {
      showModal('No Photos', `
        <div class="text-center py-8">
          <i data-lucide="image-off" class="w-12 h-12 text-gray-400 mx-auto mb-3"></i>
          <p class="text-gray-500">No photos available for this route</p>
        </div>
      `);
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    showModal(`Completion Photos - ${route.name || route.routeId}`, `
      <div class="space-y-4">
        <p class="text-sm text-gray-500">Completed by <strong>${route.completedBy || 'Unknown'}</strong> on ${new Date(route.completedAt).toLocaleDateString()}</p>
        <div class="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
          ${photos.map((photo, i) => `
            <img src="${photo}" class="w-full h-40 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity border border-gray-200"
              onclick="window.open('${photo}', '_blank')" title="Click to view full size">
          `).join('')}
        </div>
        <p class="text-xs text-gray-400 text-center">${photos.length} photo${photos.length > 1 ? 's' : ''} - Click to view full size</p>
      </div>
    `);
    if (typeof lucide !== 'undefined') lucide.createIcons();
  } catch (error) {
    showModal('Error', `
      <div class="text-center py-8">
        <i data-lucide="alert-circle" class="w-12 h-12 text-red-400 mx-auto mb-3"></i>
        <p class="text-red-600">Failed to load photos: ${error.message}</p>
      </div>
    `);
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
};

// Delete single history item
window.deleteHistoryItem = async function(routeId) {
  if (!await showConfirm('Delete History Item', 'Delete this history item? This will permanently remove it.')) {
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/routes/${routeId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      showToast('History item deleted', 'success');
      showNotificationHistory(); // Refresh the list
    } else {
      showToast('Failed to delete history item', 'error');
    }
  } catch (error) {
    console.error('Error deleting history:', error);
    showToast('Error deleting history item', 'error');
  }
};

// Clear all history
window.clearAllHistory = async function() {
  if (!await showConfirm('Clear All History', 'Delete ALL history? This will permanently remove all completed routes from history.')) {
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    
    // Get all completed routes
    const response = await fetch(`${API_URL}/routes`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const routes = await response.json();
    const completedRoutes = routes.filter(r => r.status === 'completed' && r.completedAt);
    
    // Delete all completed routes
    await Promise.all(completedRoutes.map(route => 
      fetch(`${API_URL}/routes/${route._id || route.routeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
    ));
    
    showToast('All history cleared', 'success');
    closeModal();
  } catch (error) {
    console.error('Error clearing history:', error);
    showToast('Error clearing history', 'error');
  }
};

window.markAllNotificationsRead = async function() {
  try {
    const token = localStorage.getItem('token');
    const notificationsRes = await fetch(`${API_URL}/completions/notifications/pending`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const notifications = await notificationsRes.json();
    
    // Mark all as read
    await Promise.all(notifications.map(route => 
      fetch(`${API_URL}/completions/notifications/${route._id || route.routeId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
    ));
    
    // Update badge to show 0 notifications
    const badge = document.getElementById('notificationBadge');
    if (badge) {
      badge.style.background = 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)';
      badge.style.borderColor = '#e0e0e0';
      badge.style.animation = 'none';
      badge.title = 'No new notifications - Click to view history';
      
      const notificationText = document.getElementById('notificationText');
      if (notificationText) {
        notificationText.textContent = 'No New';
        notificationText.style.cssText = 'color: #999;';
      }
    }
    
    showToast('All notifications acknowledged!', 'success');
    closeModal();
    
    // Check for new notifications after 5 seconds
    setTimeout(checkCompletionNotifications, 5000);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
};


// GPS Trac


// GPS Tracking System
let trackingInterval = null;
let trackingEnabled = false;
let currentPosition = null;
let truckMarker = null; // Truck marker on map
let truckPath = null; // Polyline showing truck's path
let truckPathCoords = []; // Array of coordinates
let routingControl = null; // Routing control for road snapping
let lastPosition = null; // Store last position for routing

// Create custom truck icon with rotation support (facing right by default)
const truckIcon = L.divIcon({
  className: 'truck-marker',
  html: `
    <div class="truck-icon-wrapper" style="
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
      border-radius: 50%;
      border: 3px solid #16a34a;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transition: transform 0.3s ease;
    ">
      <span style="font-size: 24px;">🚛</span>
    </div>
  `,
  iconSize: [48, 48],
  iconAnchor: [24, 24]
});

// Variables for navigation and ETA
let navigationLine = null;
let nextDestination = null;
let etaPanel = null;
let currentSpeed = 0;
let distanceToDestination = 0;

// Variables for route path visualization
let currentPathLine = null;      // Red line - current location to first point (pathfinding)
let assignedRouteLine = null;    // Green line - the entire assigned route
let routeWaypointMarkers = [];   // Markers for each waypoint

// Start GPS tracking for drivers
async function startGPSTracking() {
  console.log('🚀 startGPSTracking called');
  console.log('👤 Checking user role:', user?.role);

  if (!user || user.role !== 'driver') {
    console.log('❌ User is not a driver, returning');
    showToast('GPS tracking is only available for drivers', 'warning');
    return;
  }

  if (!navigator.geolocation) {
    console.error('❌ Geolocation is not supported by this browser');
    showAlertModal('GPS Not Supported', 'Your browser does not support geolocation. Please use a modern browser.', 'error');
    return;
  }

  // Show immediate feedback
  showToast('Starting GPS tracking...', 'info');
  
  // Check if we're on HTTPS (required for geolocation on mobile)
  if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
    console.warn('⚠️ GPS may not work without HTTPS');
  }
  
  trackingEnabled = true;
  console.log('🚀 Starting GPS tracking for driver:', user.username);
  
  // First, try to position truck at first bin of assigned route
  await positionTruckAtFirstBin();
  
  // Then start real GPS tracking
  navigator.geolocation.getCurrentPosition(
    position => {
      console.log('✅ GPS position received:', position.coords.latitude, position.coords.longitude);
      console.log('📊 Accuracy:', position.coords.accuracy, 'meters');
      currentPosition = position;
      updateLocationOnServer(position);

      // Update truck marker with real GPS position
      updateTruckMarker(position);
      showTrackingStatus(true);

      // Start live fuel estimation polling
      startTripDataPolling();

      // Show success feedback
      showToast('GPS tracking active!', 'success');

      // Sync overlay GPS state
      if (typeof syncOverlayGPSState === 'function') {
        syncOverlayGPSState();
      }
    },
    error => {
      console.error('❌ GPS Error:', error.code, error.message);
      let errorMsg = 'Unknown error';
      switch(error.code) {
        case error.PERMISSION_DENIED:
          errorMsg = 'Location permission denied. Please allow GPS access in your browser settings.';
          showAlertModal('GPS Permission Denied', 'Please allow location access:\n\n1. Click the lock icon in the address bar\n2. Allow Location access\n3. Refresh the page', 'warning');
          trackingEnabled = false;
          updateGPSButtonState(false);
          break;
        case error.POSITION_UNAVAILABLE:
          errorMsg = 'Location unavailable. Make sure GPS is enabled on your device.';
          showToast(errorMsg, 'error');
          break;
        case error.TIMEOUT:
          errorMsg = 'Location request timed out. Please try again.';
          showToast(errorMsg, 'warning');
          break;
      }
      console.error('GPS Error Details:', errorMsg);
      showTrackingStatus(false, errorMsg);

      // Sync overlay GPS state on error too
      if (typeof syncOverlayGPSState === 'function') {
        syncOverlayGPSState();
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    }
  );
  
  // Watch position and update every 10 seconds for real-time tracking
  trackingInterval = setInterval(() => {
    if (trackingEnabled) {
      navigator.geolocation.getCurrentPosition(
        position => {
          console.log('📍 GPS update:', position.coords.latitude, position.coords.longitude, 'Accuracy:', position.coords.accuracy);
          currentPosition = position;
          updateLocationOnServer(position);
          updateTruckMarker(position);
        },
        error => {
          console.error('❌ GPS update error:', error.code, error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 5000
        }
      );
    }
  }, 10000); // Update every 10 seconds
  
  console.log('✅ GPS tracking started successfully');
}

// Position truck at first bin of assigned route
async function positionTruckAtFirstBin() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/routes`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) return;

    const routes = await response.json();

    // Find active/pending routes assigned to this driver
    const myActiveRoutes = routes.filter(r =>
      r.assignedDriver === user.username &&
      (r.status === 'active' || r.status === 'pending')
    );

    if (myActiveRoutes.length === 0) {
      console.log('No active routes assigned');
      return;
    }

    // Get the first active route
    const firstRoute = myActiveRoutes[0];

    // Check if route has path with coordinates
    if (firstRoute.path && firstRoute.path.coordinates && firstRoute.path.coordinates.length > 0) {
      // Get first bin location [lng, lat] -> convert to [lat, lng]
      const firstBin = firstRoute.path.coordinates[0];
      const firstBinLatLng = [firstBin[1], firstBin[0]];

      console.log('Positioning truck at first bin:', firstBinLatLng);

      // Create a mock position object
      const mockPosition = {
        coords: {
          latitude: firstBinLatLng[0],
          longitude: firstBinLatLng[1],
          speed: 0,
          heading: 0
        }
      };

      // Clear any existing route visualization
      clearRouteVisualization();

      // Draw the GREEN assigned route line with waypoint markers
      drawAssignedRouteLine(firstRoute.path.coordinates);

      // Position truck at first bin (this will create the truck marker)
      updateTruckMarker(mockPosition);

      // Set last position for road snapping
      lastPosition = firstBinLatLng;

      // Center map on first bin with good zoom
      map.setView(firstBinLatLng, 16);

      console.log(`Truck positioned at first bin of route: ${firstRoute.name}`);
    }
  } catch (error) {
    console.error('Error positioning truck at first bin:', error);
  }
}

// Update truck marker on map with road snapping
function updateTruckMarker(position) {
  if (user.role !== 'driver') return;

  const lat = position.coords.latitude;
  const lng = position.coords.longitude;
  const latlng = [lat, lng];

  // Update current speed from GPS
  currentSpeed = position.coords.speed || 0;
  const heading = position.coords.heading || 0;

  if (!truckMarker) {
    // Create new truck marker
    truckMarker = L.marker(latlng, {
      icon: truckIcon,
      zIndexOffset: 1000, // Keep truck on top
      rotationAngle: 0,
      rotationOrigin: 'center'
    }).addTo(map);

    // Add popup with driver info
    truckMarker.bindPopup(`
      <div id="driver-popup" style="text-align: center; padding: 0.5rem;">
        <strong style="color: #4caf50; font-size: 1.1rem;">🚛 Your Truck</strong><br>
        <span style="color: #666; font-size: 0.9rem;">${user.fullName || user.username}</span><br>
        <span style="color: #999; font-size: 0.85rem;">Driver</span><br>
        <div id="driver-location" style="margin: 0.5rem 0; font-size: 0.85rem; color: #333;">
          📍 <span style="color: #666;">Getting location...</span>
        </div>
        <button onclick="centerOnTruck()" style="margin-top: 0.5rem; padding: 0.25rem 0.5rem; background: #4caf50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem;">📍 Center Map</button>
      </div>
    `).openPopup(); // Open popup automatically

    // Update location name immediately
    updateDriverLocationName(lat, lng);

    // Initialize path with empty array
    truckPath = L.polyline([], {
      color: '#4caf50',
      weight: 5,
      opacity: 0.8,
      smoothFactor: 1
    }).addTo(map);

    // Store first position
    lastPosition = latlng;
    truckPathCoords.push(latlng);

    // Center map on truck
    map.setView(latlng, 15);

    // Initialize navigation to next destination
    initializeNavigation(latlng);

    console.log('Truck marker created at:', lat, lng);
  } else {
    // Update truck rotation based on GPS heading
    if (heading > 0) {
      updateTruckRotation(heading);
    }

    // Truck marker already exists, update position
    if (lastPosition) {
      const distance = map.distance(lastPosition, latlng);

      console.log('Distance moved:', distance.toFixed(2), 'meters');

      // Only update if moved more than 10 meters (to avoid jitter)
      if (distance > 10) {
        console.log('Moving truck from', lastPosition, 'to', latlng);

        // Calculate bearing if no GPS heading
        if (!heading || heading === 0) {
          const bearing = calculateBearing(lastPosition, latlng);
          updateTruckRotation(bearing);
        }

        // Use OSRM routing to snap to roads
        snapToRoad(lastPosition, latlng, (roadPath) => {
          if (roadPath && roadPath.length > 0) {
            console.log('Road path received with', roadPath.length, 'points');

            // Add road path coordinates
            roadPath.forEach(coord => {
              truckPathCoords.push(coord);
            });

            // Update path polyline
            if (truckPath) {
              truckPath.setLatLngs(truckPathCoords);
            }

            // Animate truck along the road path
            animateTruckAlongPath(roadPath);
          } else {
            // Fallback to direct movement if routing fails
            console.log('Using direct path (routing failed)');
            truckMarker.setLatLng(latlng);
            truckPathCoords.push(latlng);
            if (truckPath) {
              truckPath.setLatLngs(truckPathCoords);
            }
          }

          // Update last position
          lastPosition = latlng;
        });

        // Optionally recenter map (with smooth pan)
        if (map.getZoom() > 13) {
          map.panTo(latlng, { animate: true, duration: 1 });
        }

        // Update location name
        updateDriverLocationName(lat, lng);

        // Update navigation line to next destination
        updateNavigationToDestination(latlng);
      } else {
        console.log('Movement too small, ignoring update');
      }
    } else {
      // No last position, just move directly
      console.log('No last position, moving directly to', latlng);
      truckMarker.setLatLng(latlng);
      truckPathCoords.push(latlng);
      if (truckPath) {
        truckPath.setLatLngs(truckPathCoords);
      }
      lastPosition = latlng;
      
      // Update location name
      updateDriverLocationName(lat, lng);
    }
  }
}

// Snap movement to roads using OSRM
function snapToRoad(from, to, callback) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
  
  fetch(url)
    .then(response => response.json())
    .then(data => {
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const coordinates = data.routes[0].geometry.coordinates;
        // Convert from [lng, lat] to [lat, lng]
        const path = coordinates.map(coord => [coord[1], coord[0]]);
        callback(path);
      } else {
        console.warn('OSRM routing failed, using direct path');
        callback([from, to]);
      }
    })
    .catch(error => {
      console.error('Error fetching route:', error);
      callback([from, to]); // Fallback to direct path
    });
}

// Animate truck smoothly along path (realistic truck speed)
function animateTruckAlongPath(path) {
  if (!path || path.length < 2) return;

  let index = 0;
  const duration = 5000; // 5 seconds animation (slower, more realistic)
  const steps = 50; // More steps for smoother movement
  const stepDuration = duration / steps;

  const animate = () => {
    if (index < path.length - 1) {
      const progress = (index % 1);
      const currentPoint = path[Math.floor(index)];
      const nextPoint = path[Math.min(Math.floor(index) + 1, path.length - 1)];

      // Interpolate between points
      const lat = currentPoint[0] + (nextPoint[0] - currentPoint[0]) * progress;
      const lng = currentPoint[1] + (nextPoint[1] - currentPoint[1]) * progress;

      truckMarker.setLatLng([lat, lng]);

      // Calculate bearing for truck orientation
      const bearing = calculateBearing(currentPoint, nextPoint);
      updateTruckRotation(bearing);

      index += (path.length - 1) / steps;

      if (index < path.length - 1) {
        setTimeout(animate, stepDuration);
      }
    }
  };

  animate();
}

// Calculate bearing between two points
function calculateBearing(from, to) {
  const lat1 = from[0] * Math.PI / 180;
  const lat2 = to[0] * Math.PI / 180;
  const deltaLng = (to[1] - from[1]) * Math.PI / 180;

  const y = Math.sin(deltaLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);

  let bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360; // Normalize to 0-360
}

// Update truck rotation based on heading
function updateTruckRotation(heading) {
  if (!truckMarker) return;

  const truckElement = truckMarker.getElement();
  if (truckElement) {
    const iconWrapper = truckElement.querySelector('.truck-icon-wrapper');
    if (iconWrapper) {
      // Truck emoji 🚛 faces left by default
      // Heading: 0 = North, 90 = East, 180 = South, 270 = West
      // If heading is between 0-180 (moving right/east), flip the emoji
      // If heading is between 180-360 (moving left/west), keep normal
      const isMovingRight = heading >= 270 || heading <= 90;
      iconWrapper.style.transform = isMovingRight ? 'scaleX(-1)' : 'scaleX(1)';
    }
  }
}

// Draw navigation line from current position to next destination
async function drawNavigationLine(fromLatLng, toLatLng) {
  // Remove existing navigation line
  if (navigationLine) {
    map.removeLayer(navigationLine);
    navigationLine = null;
  }

  if (!fromLatLng || !toLatLng) return;

  try {
    // Use OSRM for road-based routing
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLatLng[1]},${fromLatLng[0]};${toLatLng[1]},${toLatLng[0]}?overview=full&geometries=geojson`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);

      // Draw animated dashed line
      navigationLine = L.polyline(coordinates, {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.8,
        dashArray: '10, 10',
        className: 'navigation-line'
      }).addTo(map);

      // Store distance and duration for ETA
      distanceToDestination = route.distance; // meters
      const duration = route.duration; // seconds

      // Update ETA panel
      updateETAPanel(distanceToDestination, duration, currentSpeed);

      return { distance: route.distance, duration: route.duration };
    }
  } catch (error) {
    console.error('Error drawing navigation line:', error);
    // Fallback to straight line
    navigationLine = L.polyline([fromLatLng, toLatLng], {
      color: '#3b82f6',
      weight: 3,
      opacity: 0.6,
      dashArray: '10, 10'
    }).addTo(map);
  }
}

// Draw red pathfinding line from current location to first route point
async function drawCurrentPathLine(fromLatLng, toLatLng) {
  // Remove existing current path line
  if (currentPathLine) {
    map.removeLayer(currentPathLine);
    currentPathLine = null;
  }

  if (!fromLatLng || !toLatLng) return;

  try {
    // Use OSRM for road-based routing
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLatLng[1]},${fromLatLng[0]};${toLatLng[1]},${toLatLng[0]}?overview=full&geometries=geojson`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);

      // Draw red animated dashed line for current path to first point
      currentPathLine = L.polyline(coordinates, {
        color: '#ef4444',  // Red color
        weight: 5,
        opacity: 0.9,
        dashArray: '12, 8',
        className: 'current-path-line'
      }).addTo(map);

      // Store distance and duration for ETA
      distanceToDestination = route.distance;
      const duration = route.duration;

      // Update ETA panel
      updateETAPanel(distanceToDestination, duration, currentSpeed);

      return { distance: route.distance, duration: route.duration };
    }
  } catch (error) {
    console.error('Error drawing current path line:', error);
    // Fallback to straight line
    currentPathLine = L.polyline([fromLatLng, toLatLng], {
      color: '#ef4444',
      weight: 4,
      opacity: 0.8,
      dashArray: '12, 8'
    }).addTo(map);
  }
}

// Draw green line for the assigned route path
function drawAssignedRouteLine(routeCoordinates) {
  // Remove existing assigned route line
  if (assignedRouteLine) {
    map.removeLayer(assignedRouteLine);
    assignedRouteLine = null;
  }

  // Clear existing waypoint markers
  routeWaypointMarkers.forEach(marker => {
    if (map.hasLayer(marker)) {
      map.removeLayer(marker);
    }
  });
  routeWaypointMarkers = [];

  if (!routeCoordinates || routeCoordinates.length < 2) return;

  // Convert [lng, lat] to [lat, lng] if needed
  const coords = routeCoordinates.map(c => {
    // Check if already in [lat, lng] format (lat should be between -90 and 90)
    if (Array.isArray(c) && Math.abs(c[0]) <= 90) {
      return c;
    }
    // Convert from [lng, lat] to [lat, lng]
    return [c[1], c[0]];
  });

  // Draw green solid line for assigned route
  assignedRouteLine = L.polyline(coords, {
    color: '#22c55e',  // Green color
    weight: 4,
    opacity: 0.8,
    lineCap: 'round',
    lineJoin: 'round'
  }).addTo(map);

  // Add waypoint markers for each stop
  coords.forEach((coord, index) => {
    const isFirst = index === 0;
    const isLast = index === coords.length - 1;

    // Create custom marker for waypoints
    const waypointIcon = L.divIcon({
      className: 'waypoint-marker',
      html: `
        <div style="
          width: ${isFirst || isLast ? '28px' : '22px'};
          height: ${isFirst || isLast ? '28px' : '22px'};
          background: ${isFirst ? '#22c55e' : isLast ? '#ef4444' : '#3b82f6'};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: ${isFirst || isLast ? '12px' : '10px'};
          font-weight: bold;
        ">
          ${isFirst ? '▶' : isLast ? '◼' : (index)}
        </div>
      `,
      iconSize: [isFirst || isLast ? 28 : 22, isFirst || isLast ? 28 : 22],
      iconAnchor: [(isFirst || isLast ? 28 : 22) / 2, (isFirst || isLast ? 28 : 22) / 2]
    });

    const marker = L.marker(coord, { icon: waypointIcon }).addTo(map);
    marker.bindPopup(`
      <div style="text-align: center; min-width: 120px;">
        <strong style="color: ${isFirst ? '#22c55e' : isLast ? '#ef4444' : '#3b82f6'};">
          ${isFirst ? '🚀 Start Point' : isLast ? '🏁 End Point' : `📍 Stop ${index}`}
        </strong><br>
        <span style="font-size: 0.85rem; color: #666;">Waypoint ${index + 1} of ${coords.length}</span>
      </div>
    `);

    routeWaypointMarkers.push(marker);
  });

  // Show route legend
  showRouteLegend();

  return coords;
}

// Draw complete route visualization with red current path and green assigned route
async function drawRouteVisualization(currentLatLng, routeCoordinates) {
  if (!routeCoordinates || routeCoordinates.length === 0) return;

  // Convert coordinates to [lat, lng] format
  const coords = routeCoordinates.map(c => {
    if (Array.isArray(c) && Math.abs(c[0]) <= 90) {
      return c;
    }
    return [c[1], c[0]];
  });

  // Draw the green assigned route line
  drawAssignedRouteLine(routeCoordinates);

  // Draw red pathfinding line from current location to first waypoint
  if (currentLatLng && coords.length > 0) {
    await drawCurrentPathLine(currentLatLng, coords[0]);
  }

  // Fit map to show both current location and route
  if (currentLatLng) {
    const allPoints = [currentLatLng, ...coords];
    const bounds = L.latLngBounds(allPoints);
    map.fitBounds(bounds, { padding: [50, 50] });
  }
}

// Clear all route visualization
function clearRouteVisualization() {
  if (currentPathLine) {
    map.removeLayer(currentPathLine);
    currentPathLine = null;
  }

  if (assignedRouteLine) {
    map.removeLayer(assignedRouteLine);
    assignedRouteLine = null;
  }

  routeWaypointMarkers.forEach(marker => {
    if (map.hasLayer(marker)) {
      map.removeLayer(marker);
    }
  });
  routeWaypointMarkers = [];

  if (navigationLine) {
    map.removeLayer(navigationLine);
    navigationLine = null;
  }

  // Hide route legend
  hideRouteLegend();
}

// Show route legend on the map
function showRouteLegend() {
  let legend = document.getElementById('routeLegend');

  if (!legend) {
    legend = document.createElement('div');
    legend.id = 'routeLegend';
    legend.className = 'fixed bottom-24 left-4 lg:bottom-4 bg-white/95 backdrop-blur-md rounded-xl shadow-lg p-3 z-40 border border-gray-200';
    legend.innerHTML = `
      <div class="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">Route Legend</div>
      <div class="space-y-1.5">
        <div class="flex items-center gap-2">
          <div class="w-6 h-1 bg-red-500 rounded" style="background: linear-gradient(90deg, #ef4444 0%, #ef4444 50%, transparent 50%, transparent 100%); background-size: 8px 100%;"></div>
          <span class="text-xs text-gray-600">Current Path (to next stop)</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-6 h-1 bg-green-500 rounded"></div>
          <span class="text-xs text-gray-600">Assigned Route</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow"></div>
          <span class="text-xs text-gray-600">Start Point</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow"></div>
          <span class="text-xs text-gray-600">End Point</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow"></div>
          <span class="text-xs text-gray-600">Waypoint</span>
        </div>
      </div>
    `;
    document.body.appendChild(legend);
  }

  legend.classList.remove('hidden');
}

// Hide route legend
function hideRouteLegend() {
  const legend = document.getElementById('routeLegend');
  if (legend) {
    legend.classList.add('hidden');
  }
}

// Update the current path line when driver moves
async function updateCurrentPathToNextWaypoint(currentLatLng, activeRoute) {
  if (!activeRoute || !activeRoute.path || !activeRoute.path.coordinates) return;

  const coords = activeRoute.path.coordinates;
  const completedStops = activeRoute.completedStops || 0;

  // Find the next waypoint (current target)
  const nextWaypointIndex = Math.min(completedStops, coords.length - 1);
  const nextWaypoint = coords[nextWaypointIndex];

  if (nextWaypoint) {
    const nextLatLng = [nextWaypoint[1], nextWaypoint[0]];
    await drawCurrentPathLine(currentLatLng, nextLatLng);
  }
}

// Update ETA panel with live metrics
function updateETAPanel(distance, duration, speed) {
  let etaContainer = document.getElementById('etaPanel');

  if (!etaContainer) {
    // Create ETA panel
    etaContainer = document.createElement('div');
    etaContainer.id = 'etaPanel';
    etaContainer.className = 'fixed bottom-24 left-4 right-4 lg:bottom-4 lg:left-auto lg:right-4 lg:w-80 bg-white rounded-xl shadow-lg p-4 z-50 border border-gray-200';
    etaContainer.innerHTML = `
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-semibold text-gray-800 flex items-center gap-2">
          <i data-lucide="navigation" class="w-5 h-5 text-blue-500"></i>
          Navigation
        </h3>
        <button onclick="closeETAPanel()" class="text-gray-400 hover:text-gray-600">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>
      <div class="grid grid-cols-3 gap-3">
        <div class="text-center p-2 bg-blue-50 rounded-lg">
          <div id="etaDistance" class="text-lg font-bold text-blue-600">--</div>
          <div class="text-xs text-gray-500">Distance</div>
        </div>
        <div class="text-center p-2 bg-green-50 rounded-lg">
          <div id="etaTime" class="text-lg font-bold text-green-600">--</div>
          <div class="text-xs text-gray-500">ETA</div>
        </div>
        <div class="text-center p-2 bg-orange-50 rounded-lg">
          <div id="etaSpeed" class="text-lg font-bold text-orange-600">--</div>
          <div class="text-xs text-gray-500">Speed</div>
        </div>
      </div>
      <div id="etaDestination" class="mt-3 text-sm text-gray-600 text-center">
        <i data-lucide="map-pin" class="w-4 h-4 inline"></i>
        <span>Calculating route...</span>
      </div>
    `;
    document.body.appendChild(etaContainer);

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  // Update values
  const distanceEl = document.getElementById('etaDistance');
  const timeEl = document.getElementById('etaTime');
  const speedEl = document.getElementById('etaSpeed');

  if (distanceEl) {
    if (distance < 1000) {
      distanceEl.textContent = `${Math.round(distance)}m`;
    } else {
      distanceEl.textContent = `${(distance / 1000).toFixed(1)}km`;
    }
  }

  if (timeEl) {
    // Calculate ETA based on current speed or estimated duration
    let etaSeconds = duration;
    if (speed > 0) {
      // Use actual speed for more accurate ETA
      etaSeconds = distance / speed; // distance in meters, speed in m/s
    }

    if (etaSeconds < 60) {
      timeEl.textContent = `${Math.round(etaSeconds)}s`;
    } else if (etaSeconds < 3600) {
      timeEl.textContent = `${Math.round(etaSeconds / 60)}min`;
    } else {
      const hours = Math.floor(etaSeconds / 3600);
      const mins = Math.round((etaSeconds % 3600) / 60);
      timeEl.textContent = `${hours}h ${mins}m`;
    }
  }

  if (speedEl) {
    // Convert m/s to km/h
    const speedKmh = (speed || 0) * 3.6;
    speedEl.textContent = `${Math.round(speedKmh)}km/h`;
  }

  etaContainer.classList.remove('hidden');
}

// Close ETA panel
window.closeETAPanel = function() {
  const panel = document.getElementById('etaPanel');
  if (panel) {
    panel.classList.add('hidden');
  }
}

// Get next destination from assigned route
async function getNextDestination() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/routes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) return null;

    const routes = await response.json();
    const myActiveRoutes = routes.filter(r =>
      r.assignedDriver === user.username &&
      (r.status === 'active' || r.status === 'pending')
    );

    if (myActiveRoutes.length === 0) return null;

    const activeRoute = myActiveRoutes[0];

    if (activeRoute.path && activeRoute.path.coordinates && activeRoute.path.coordinates.length > 0) {
      // Find next uncollected bin (for now, use first bin as destination)
      // In a real implementation, track which bins have been collected
      const nextBinIndex = parseInt(localStorage.getItem('currentBinIndex') || '0');
      const coordinates = activeRoute.path.coordinates;

      if (nextBinIndex < coordinates.length) {
        const nextBin = coordinates[nextBinIndex];
        return {
          latlng: [nextBin[1], nextBin[0]],
          name: `Stop ${nextBinIndex + 1} of ${coordinates.length}`,
          routeName: activeRoute.name,
          routeCoordinates: coordinates,  // Include full route coordinates for green line
          totalStops: coordinates.length,
          currentStopIndex: nextBinIndex
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting next destination:', error);
    return null;
  }
}

// Initialize navigation to next destination
async function initializeNavigation(currentLatLng) {
  const destination = await getNextDestination();

  if (destination) {
    nextDestination = destination;

    // Draw GREEN assigned route line if not already displayed
    if (!assignedRouteLine && destination.routeCoordinates) {
      drawAssignedRouteLine(destination.routeCoordinates);
    }

    // Draw RED pathfinding line from current location to next waypoint
    await drawCurrentPathLine(currentLatLng, destination.latlng);

    // Update ETA destination name
    const destEl = document.getElementById('etaDestination');
    if (destEl) {
      destEl.innerHTML = `<i data-lucide="map-pin" class="w-4 h-4 inline"></i> ${destination.name} - ${destination.routeName}`;
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }

    console.log('Navigation initialized to:', destination.name);
  } else {
    console.log('No destination found for navigation');
  }
}

// Update navigation line to destination (RED pathfinding line)
async function updateNavigationToDestination(currentLatLng) {
  if (!nextDestination) {
    // Try to get destination if not set
    await initializeNavigation(currentLatLng);
    return;
  }

  // Check if we've reached the destination (within 50 meters)
  const distanceToNext = L.latLng(currentLatLng).distanceTo(L.latLng(nextDestination.latlng));

  if (distanceToNext < 50) {
    // Reached destination! Move to next stop
    console.log('Reached destination:', nextDestination.name);

    // Increment bin index
    const currentIndex = parseInt(localStorage.getItem('currentBinIndex') || '0');
    localStorage.setItem('currentBinIndex', (currentIndex + 1).toString());

    // Show arrival notification
    showAlertModal('Arrived!', `You have arrived at ${nextDestination.name}. Proceeding to next stop...`, 'success');

    // Get next destination
    nextDestination = null;
    await initializeNavigation(currentLatLng);
    return;
  }

  // Update RED pathfinding line from current location to next waypoint
  await drawCurrentPathLine(currentLatLng, nextDestination.latlng);

  // Update destination name
  const destEl = document.getElementById('etaDestination');
  if (destEl && nextDestination) {
    destEl.innerHTML = `<i data-lucide="map-pin" class="w-4 h-4 inline"></i> ${nextDestination.name}`;
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
}

// Mark current stop as collected and move to next
window.markStopCollected = function() {
  const currentIndex = parseInt(localStorage.getItem('currentBinIndex') || '0');
  localStorage.setItem('currentBinIndex', (currentIndex + 1).toString());

  // Reinitialize navigation to next stop
  if (truckMarker) {
    const currentPos = truckMarker.getLatLng();
    initializeNavigation([currentPos.lat, currentPos.lng]);
  }
}

// Center map on truck location
window.centerOnTruck = function() {
  if (truckMarker) {
    map.setView(truckMarker.getLatLng(), 16, { animate: true });
  }
};

// Toggle GPS Tracking (for button click)
window.toggleGPSTracking = function() {
  try {
    console.log('🔄 toggleGPSTracking called, trackingEnabled:', trackingEnabled);
    console.log('👤 User role:', user?.role);

    if (trackingEnabled) {
      console.log('⏹️ Stopping GPS tracking...');
      stopGPSTracking();
      updateGPSButtonState(false);
      showToast('GPS tracking stopped', 'info');
    } else {
      console.log('▶️ Starting GPS tracking...');
      // Update button state immediately for visual feedback
      updateGPSButtonState(true);
      startGPSTracking();
    }
    // Sync overlay GPS state immediately (desktop)
    if (typeof syncOverlayGPSState === 'function') {
      syncOverlayGPSState();
    }
    // Sync mobile overlay GPS state
    if (typeof updateMobileGpsStatus === 'function') {
      updateMobileGpsStatus();
    }
  } catch (error) {
    console.error('❌ Error in toggleGPSTracking:', error);
    showToast('Error toggling GPS: ' + error.message, 'error');
  }
};

// Update GPS button state
function updateGPSButtonState(isActive) {
  const desktopBtn = document.getElementById('startGpsBtn');
  const mobileBtn = document.getElementById('mobileGpsBtn');
  const mobileBtnText = document.getElementById('mobileGpsBtnText');

  if (isActive) {
    if (desktopBtn) {
      desktopBtn.innerHTML = '<i data-lucide="navigation-off" class="w-5 h-5"></i><span>Stop GPS Tracking</span>';
      desktopBtn.classList.remove('bg-primary-500', 'hover:bg-primary-600');
      desktopBtn.classList.add('bg-red-500', 'hover:bg-red-600');
    }
    if (mobileBtn) {
      mobileBtn.innerHTML = '<i data-lucide="navigation-off" class="w-5 h-5"></i><span id="mobileGpsBtnText">Stop GPS</span>';
      mobileBtn.classList.remove('bg-primary-500', 'hover:bg-primary-600');
      mobileBtn.classList.add('bg-red-500', 'hover:bg-red-600');
    }
  } else {
    if (desktopBtn) {
      desktopBtn.innerHTML = '<i data-lucide="navigation" class="w-5 h-5"></i><span>Start GPS Tracking</span>';
      desktopBtn.classList.remove('bg-red-500', 'hover:bg-red-600');
      desktopBtn.classList.add('bg-primary-500', 'hover:bg-primary-600');
    }
    if (mobileBtn) {
      mobileBtn.innerHTML = '<i data-lucide="navigation" class="w-5 h-5"></i><span id="mobileGpsBtnText">Start GPS</span>';
      mobileBtn.classList.remove('bg-red-500', 'hover:bg-red-600');
      mobileBtn.classList.add('bg-primary-500', 'hover:bg-primary-600');
    }
  }

  // Re-initialize lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// Stop GPS tracking
function stopGPSTracking() {
  trackingEnabled = false;
  if (trackingInterval) {
    clearInterval(trackingInterval);
    trackingInterval = null;
  }

  // Stop fuel estimation polling
  stopTripDataPolling();

  // Remove truck marker from map
  if (truckMarker) {
    map.removeLayer(truckMarker);
    truckMarker = null;
  }

  // Remove truck path from map
  if (truckPath) {
    map.removeLayer(truckPath);
    truckPath = null;
  }

  // Remove navigation line
  if (navigationLine) {
    map.removeLayer(navigationLine);
    navigationLine = null;
  }

  // Clear all route visualization (red path + green route + markers)
  clearRouteVisualization();

  // Remove destination marker
  if (window.destinationMarker) {
    map.removeLayer(window.destinationMarker);
    window.destinationMarker = null;
  }

  // Hide ETA panel
  const etaPanel = document.getElementById('etaPanel');
  if (etaPanel) {
    etaPanel.remove();
  }

  // Clear path coordinates
  truckPathCoords = [];

  // Reset navigation state
  nextDestination = null;
  currentSpeed = 0;
  distanceToDestination = 0;

  // Clear location on server
  const token = localStorage.getItem('token');
  fetch(`${API_URL}/tracking/clear`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }).catch(error => console.error('Error clearing location:', error));

  showTrackingStatus(false);
}

// Update location on server
async function updateLocationOnServer(position) {
  try {
    const token = localStorage.getItem('token');
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const accuracy = position.coords.accuracy;
    const speed = (position.coords.speed || 0) * 3.6; // Convert m/s to km/h

    console.log(`📤 Sending GPS to server: ${lat}, ${lng} (accuracy: ${accuracy}m, speed: ${speed.toFixed(1)}km/h)`);

    const response = await fetch(`${API_URL}/tracking/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        lat: lat,
        lng: lng,
        speed: speed,
        heading: position.coords.heading || 0,
        routeId: getCurrentActiveRoute()
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Location saved to server:', data.savedAt);
      // Update last successful update time
      window.lastGPSUpdate = new Date();

      // Update live fuel estimation display
      if (data.trip) {
        updateLiveFuelDisplay(data.trip);
      }
    } else {
      const error = await response.text();
      console.error('❌ Server rejected location update:', response.status, error);
      // Show error to driver if persistent
      if (response.status === 500) {
        console.error('⚠️ Server error - GPS tracking may not be working');
      }
    }
  } catch (error) {
    console.error('❌ Error sending location to server:', error.message);
    // Network error - might be offline
    if (!navigator.onLine) {
      console.warn('📵 Device appears to be offline');
    }
  }
}

// Update live fuel estimation display
function updateLiveFuelDisplay(tripData) {
  const fuelPanel = document.getElementById('overlayFuelEstimate');
  if (!fuelPanel) return;

  // Show the panel
  fuelPanel.classList.remove('hidden');

  // Update values
  const fuelLiters = document.getElementById('liveFuelLiters');
  const distanceKm = document.getElementById('liveDistanceKm');
  const stopCount = document.getElementById('liveStopCount');

  if (fuelLiters) fuelLiters.textContent = (tripData.fuelEstimate || 0).toFixed(2);
  if (distanceKm) distanceKm.textContent = (tripData.distance || 0).toFixed(2);
  if (stopCount) stopCount.textContent = tripData.stops || 0;
}

// Fetch and update full trip data periodically
async function fetchTripData() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return;

    const response = await fetch(`${API_URL}/tracking/my-trip`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.hasActiveTrip && data.trip) {
        updateFullFuelDisplay(data.trip);
      }
    }
  } catch (error) {
    console.error('Error fetching trip data:', error);
  }
}

// Update full fuel display with detailed trip data
function updateFullFuelDisplay(trip) {
  const fuelPanel = document.getElementById('overlayFuelEstimate');
  if (!fuelPanel) return;

  // Show the panel
  fuelPanel.classList.remove('hidden');

  // Update all values
  const elements = {
    liveFuelLiters: trip.fuel?.liters || 0,
    liveDistanceKm: trip.distance?.km || 0,
    liveStopCount: trip.stops || 0,
    liveAvgSpeed: trip.averageSpeed || 0,
    liveEfficiency: trip.fuel?.efficiency || 0,
    liveTripDuration: `Duration: ${trip.duration?.formatted || '0m'}`,
    liveIdleTime: `Idle: ${trip.idleTime?.formatted || '0m'}`
  };

  for (const [id, value] of Object.entries(elements)) {
    const el = document.getElementById(id);
    if (el) {
      if (typeof value === 'number') {
        el.textContent = value.toFixed(id === 'liveStopCount' ? 0 : 2);
      } else {
        el.textContent = value;
      }
    }
  }
}

// Start trip data polling when GPS tracking starts
let tripDataInterval = null;
function startTripDataPolling() {
  // Initial fetch
  fetchTripData();

  // Poll every 15 seconds for full data
  if (tripDataInterval) clearInterval(tripDataInterval);
  tripDataInterval = setInterval(fetchTripData, 15000);
}

function stopTripDataPolling() {
  if (tripDataInterval) {
    clearInterval(tripDataInterval);
    tripDataInterval = null;
  }

  // Hide fuel panel
  const fuelPanel = document.getElementById('overlayFuelEstimate');
  if (fuelPanel) fuelPanel.classList.add('hidden');
}

// Get current active route
function getCurrentActiveRoute() {
  // This would be set when driver starts a route
  return localStorage.getItem('activeRouteId') || null;
}

// Show tracking status in UI
function showTrackingStatus(isActive, errorMessage = '') {
  const panel = document.getElementById('gpsStatusPanel');
  const icon = document.getElementById('gpsStatusIcon');
  const text = document.getElementById('gpsStatusText');
  const detail = document.getElementById('gpsStatusDetail');
  
  if (!panel || !icon || !text || !detail) return;
  
  if (isActive) {
    panel.style.borderLeftColor = '#4caf50';
    panel.style.background = '#e8f5e9';
    icon.textContent = '🟢';
    text.textContent = 'GPS Active';
    text.style.color = '#2e7d32';
    detail.textContent = errorMessage || 'Location is being tracked';
  } else {
    panel.style.borderLeftColor = '#f44336';
    panel.style.background = '#ffebee';
    icon.textContent = '🔴';
    text.textContent = 'GPS Error';
    text.style.color = '#c62828';
    detail.textContent = errorMessage || 'Location tracking failed';
  }
}

// Test GPS connection
window.testGPSConnection = async function() {
  const panel = document.getElementById('gpsStatusPanel');
  const icon = document.getElementById('gpsStatusIcon');
  const text = document.getElementById('gpsStatusText');
  const detail = document.getElementById('gpsStatusDetail');
  
  if (!panel) return;
  
  // Show testing state
  panel.style.borderLeftColor = '#ff9800';
  panel.style.background = '#fff3e0';
  icon.textContent = '🔄';
  text.textContent = 'Testing GPS...';
  detail.textContent = 'Checking browser GPS and server connection';
  
  try {
    // Test 1: Check browser geolocation
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
    });
    
    console.log('✅ Browser GPS working:', position.coords.latitude, position.coords.longitude);
    
    // Test 2: Send to server
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/tracking/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        speed: position.coords.speed || 0,
        heading: position.coords.heading || 0
      })
    });
    
    if (response.ok) {
      // Test 3: Verify server received it
      const verifyRes = await fetch(`${API_URL}/tracking/test-my-location`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const verifyData = await verifyRes.json();
      
      panel.style.borderLeftColor = '#4caf50';
      panel.style.background = '#e8f5e9';
      icon.textContent = '✅';
      text.textContent = 'GPS Working!';
      text.style.color = '#2e7d32';
      detail.textContent = `Location: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
      
      showAlertModal('GPS Test Successful', `Your location:\nLat: ${position.coords.latitude.toFixed(6)}\nLng: ${position.coords.longitude.toFixed(6)}\nAccuracy: ${position.coords.accuracy.toFixed(0)}m\n\nServer status: ${verifyData.status}`, 'success');
    } else {
      throw new Error('Server rejected location update');
    }
  } catch (error) {
    console.error('GPS Test failed:', error);
    
    panel.style.borderLeftColor = '#f44336';
    panel.style.background = '#ffebee';
    icon.textContent = '❌';
    text.textContent = 'GPS Test Failed';
    text.style.color = '#c62828';
    
    let errorMsg = error.message;
    if (error.code === 1) {
      errorMsg = 'Permission denied - Please allow GPS access';
      detail.textContent = 'Click the lock icon in address bar to allow location';
    } else if (error.code === 2) {
      errorMsg = 'Position unavailable - Enable GPS on your device';
      detail.textContent = 'Make sure GPS/Location is turned on';
    } else if (error.code === 3) {
      errorMsg = 'Timeout - GPS took too long';
      detail.textContent = 'Try again in an open area';
    } else {
      detail.textContent = errorMsg;
    }
    
    showAlertModal('GPS Test Failed', `${errorMsg}\n\nTips:\n1. Allow location permission in browser\n2. Enable GPS on your device\n3. Try in an open area for better signal`, 'error');
  }
};

// Add tracking toggle to driver dashboard
if (user.role === 'driver') {
  // Auto-start tracking for ALL drivers (automatic)
  console.log('Auto-starting GPS tracking for driver:', user.username);
  setTimeout(() => {
    // Start GPS tracking immediately - no need to wait for route assignment
    startGPSTracking();
  }, 2000);
  
  // Stop tracking when page unloads
  window.addEventListener('beforeunload', () => {
    if (trackingEnabled) {
      stopGPSTracking();
    }
  });
}

// Admin: Show live truck locations on map
let driverMarkers = {};
let trackingUpdateInterval = null;

function showLiveTruckLocations() {
  if (user.role !== 'admin') return;
  
  // Clear existing markers
  Object.values(driverMarkers).forEach(marker => {
    map.removeLayer(marker);
  });
  driverMarkers = {};
  
  // Fetch and display active locations
  updateLiveTruckLocations();
  
  // Update every 15 seconds
  if (trackingUpdateInterval) {
    clearInterval(trackingUpdateInterval);
  }
  trackingUpdateInterval = setInterval(updateLiveTruckLocations, 15000);
}

async function updateLiveTruckLocations() {
  try {
    const token = localStorage.getItem('token');
    // Use new endpoint that shows ALL assigned trucks
    const response = await fetch(`${API_URL}/tracking/all-trucks`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const trucks = await response.json();
      
      for (const truck of trucks) {
        const { username, lat, lng, speed, isLive, truckId, plateNumber } = truck;
        
        // Create or update marker
        if (driverMarkers[username]) {
          // Update existing marker
          driverMarkers[username].setLatLng([lat, lng]);
          const popupContent = await createTruckPopup(truck);
          driverMarkers[username].getPopup().setContent(popupContent);
          
          // Update marker style based on live status
          const markerElement = driverMarkers[username].getElement();
          if (markerElement) {
            const iconDiv = markerElement.querySelector('div');
            if (iconDiv) {
              iconDiv.style.background = isLive ? '#4caf50' : '#9e9e9e';
              iconDiv.style.animation = isLive ? 'pulse 2s infinite' : 'none';
            }
          }
        } else {
          // Create new marker
          const truckIcon = L.divIcon({
            className: 'truck-marker',
            html: `
              <div style="
                background: ${isLive ? '#4caf50' : '#9e9e9e'};
                color: white;
                padding: 0.5rem;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.2rem;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                border: 3px solid white;
                ${isLive ? 'animation: pulse 2s infinite;' : ''}
              ">
                🚛
              </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
          });
          
          const popupContent = await createTruckPopup(truck);
          const marker = L.marker([lat, lng], { icon: truckIcon })
            .addTo(map)
            .bindPopup(popupContent);
          
          driverMarkers[username] = marker;
        }
      }
      
      // Remove markers for drivers that are no longer assigned
      Object.keys(driverMarkers).forEach(username => {
        if (!trucks.find(t => t.username === username)) {
          map.removeLayer(driverMarkers[username]);
          delete driverMarkers[username];
        }
      });
    }
  } catch (error) {
    console.error('Error updating truck locations:', error);
  }
}

async function createTruckPopup(truck) {
  const { username, fullName, truckId, plateNumber, model, speed, isLive, timestamp, routeName, lat, lng } = truck;
  const timeAgo = timestamp ? getTimeAgo(timestamp) : 'Not tracking';
  const statusColor = isLive ? '#4caf50' : '#9e9e9e';
  const statusText = isLive ? '🟢 Live Tracking' : '⚪ Offline';
  
  // Get location name from cache or use coordinates (avoid API spam)
  let locationName = 'Unknown';
  if (lat && lng) {
    const cached = getCachedLocationName(lat, lng);
    locationName = cached || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
  
  return `
    <div style="min-width: 250px;">
      <h4 style="margin: 0 0 0.5rem 0; color: #333; font-size: 1.1rem;">🚛 ${truckId}</h4>
      <div style="background: ${statusColor}; color: white; padding: 0.3rem 0.6rem; border-radius: 12px; display: inline-block; font-size: 0.8rem; margin-bottom: 0.5rem; font-weight: 600;">
        ${statusText}
      </div>
      <div style="background: #f5f5f5; padding: 0.5rem; border-radius: 8px; margin: 0.5rem 0;">
        <p style="margin: 0.25rem 0; font-size: 0.85rem;">
          <strong>👤 Driver:</strong> ${fullName || username}
        </p>
        <p style="margin: 0.25rem 0; font-size: 0.85rem;">
          <strong>🚗 Plate:</strong> ${plateNumber}
        </p>
        <p style="margin: 0.25rem 0; font-size: 0.85rem;">
          <strong>📦 Model:</strong> ${model}
        </p>
        <p style="margin: 0.25rem 0; font-size: 0.85rem;">
          <strong>🛣️ Route:</strong> ${routeName || 'Not assigned'}
        </p>
      </div>
      ${isLive ? `
        <div style="background: #e8f5e9; padding: 0.5rem; border-radius: 8px; margin: 0.5rem 0; border-left: 3px solid #4caf50;">
          <p style="margin: 0.25rem 0; font-size: 0.85rem;">
            <strong>⚡ Speed:</strong> ${Math.round(speed * 3.6)} km/h
          </p>
          <p style="margin: 0.25rem 0; font-size: 0.85rem;">
            <strong>📍 Location:</strong><br>
            <span style="font-size: 0.8rem; color: #333; display: block; margin-top: 0.25rem;">
              ${locationName}
            </span>
          </p>
          <p style="margin: 0.25rem 0; font-size: 0.75rem; color: #666;">
            <strong>📐 Coordinates:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}
          </p>
          <p style="margin: 0.25rem 0; font-size: 0.75rem; color: #888;">
            🕐 Updated: ${timeAgo}
          </p>
        </div>
      ` : `
        <div style="background: #f5f5f5; padding: 0.5rem; border-radius: 8px; margin: 0.5rem 0; border-left: 3px solid #9e9e9e;">
          <p style="margin: 0.25rem 0; font-size: 0.85rem;">
            <strong>📍 Last Known Location:</strong><br>
            <span style="font-size: 0.8rem; color: #666; display: block; margin-top: 0.25rem;">
              ${locationName}
            </span>
          </p>
          <p style="margin: 0.25rem 0; font-size: 0.75rem; color: #666;">
            <strong>📐 Coordinates:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}
          </p>
          <p style="margin: 0.25rem 0; font-size: 0.8rem; color: #999;">
            ⚠️ GPS not active - Driver not tracking
          </p>
        </div>
      `}
      <button onclick="focusOnTruck(${lat}, ${lng}, '${truckId}')" style="width: 100%; margin-top: 0.5rem; padding: 0.5rem; background: #2196f3; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: 600; font-size: 0.85rem;">
        🎯 Focus on This Truck
      </button>
    </div>
  `;
}

// Focus map on specific truck location
window.focusOnTruck = function(lat, lng, truckId) {
  map.setView([lat, lng], 17, { animate: true });
  console.log(`Focused on truck ${truckId} at ${lat}, ${lng}`);
};

// Cache for location names to avoid repeated API calls
let locationNameCache = {};
let currentLocationName = 'Getting location...';

// Rate-limited geocoding queue
let geocodeQueue = [];
let isProcessingGeocode = false;
const GEOCODE_DELAY = 1100; // Nominatim requires 1 request per second

// Get cached location name or return coordinates
function getCachedLocationName(lat, lng) {
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  return locationNameCache[cacheKey] || null;
}

// Rate-limited geocoding function
async function geocodeLocation(lat, lng) {
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;

  // Return cached value if available
  if (locationNameCache[cacheKey]) {
    return locationNameCache[cacheKey];
  }

  // Return coordinates as fallback (don't make API call for popup content)
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

// Queue a geocode request (for non-critical updates)
function queueGeocodeRequest(lat, lng, callback) {
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;

  // If cached, call callback immediately
  if (locationNameCache[cacheKey]) {
    callback(locationNameCache[cacheKey]);
    return;
  }

  // Add to queue
  geocodeQueue.push({ lat, lng, cacheKey, callback });
  processGeocodeQueue();
}

// Process geocode queue with rate limiting
async function processGeocodeQueue() {
  if (isProcessingGeocode || geocodeQueue.length === 0) return;

  isProcessingGeocode = true;

  while (geocodeQueue.length > 0) {
    const { lat, lng, cacheKey, callback } = geocodeQueue.shift();

    // Skip if already cached (might have been cached while waiting)
    if (locationNameCache[cacheKey]) {
      callback(locationNameCache[cacheKey]);
      continue;
    }

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await response.json();

      let locationName = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      if (data.display_name) {
        const address = data.address;
        const parts = [];
        if (address.road) parts.push(address.road);
        if (address.suburb || address.neighbourhood) parts.push(address.suburb || address.neighbourhood);
        if (address.city || address.town || address.municipality) parts.push(address.city || address.town || address.municipality);
        locationName = parts.length > 0 ? parts.join(', ') : data.display_name.split(',').slice(0, 3).join(', ');
      }

      // Cache the result
      locationNameCache[cacheKey] = locationName;
      callback(locationName);
    } catch (error) {
      console.log('Geocode error:', error.message);
      callback(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    }

    // Wait before next request (rate limiting)
    if (geocodeQueue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, GEOCODE_DELAY));
    }
  }

  isProcessingGeocode = false;
}

// Update driver's location name in popup
async function updateDriverLocationName(lat, lng) {
  // Create cache key (rounded to 4 decimals to group nearby locations)
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  
  // Update popup immediately with cached name or coordinates
  function updatePopupContent(locationName) {
    currentLocationName = locationName;
    if (truckMarker) {
      const popupContent = `
        <div id="driver-popup" style="text-align: center; padding: 0.5rem;">
          <strong style="color: #4caf50; font-size: 1.1rem;">🚛 Your Truck</strong><br>
          <span style="color: #666; font-size: 0.9rem;">${user.fullName || user.username}</span><br>
          <span style="color: #999; font-size: 0.85rem;">Driver</span><br>
          <div id="driver-location" style="margin: 0.5rem 0; font-size: 0.85rem; color: #333;">
            📍 <span style="color: #666;">${locationName}</span>
          </div>
          <button onclick="centerOnTruck()" style="margin-top: 0.5rem; padding: 0.25rem 0.5rem; background: #4caf50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem;">📍 Center Map</button>
        </div>
      `;
      truckMarker.getPopup().setContent(popupContent);
    }
  }
  
  // If cached, use it immediately
  if (locationNameCache[cacheKey]) {
    updatePopupContent(locationNameCache[cacheKey]);
    return;
  }

  // Otherwise, use rate-limited queue
  queueGeocodeRequest(lat, lng, updatePopupContent);
}

function getTimeAgo(timestamp) {
  const now = new Date();
  const then = new Date(timestamp);
  const seconds = Math.floor((now - then) / 1000);
  
  if (seconds < 60) return `${seconds} seconds ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  return `${Math.floor(seconds / 3600)} hours ago`;
}

// Show live truck tracking panel - MAP FOCUSED VIEW
window.showLiveTruckPanel = async function() {
  setActiveSidebarButton('liveTruckTrackingBtn');
  showPageLoading('Loading live trucks...');

  // Show map view instead of page content
  showMapView();

  // Clear existing markers
  clearTempMarkers();

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/tracking/all-trucks`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to fetch truck data');

    const trucks = await response.json();
    const liveCount = trucks.filter(t => t.isLive).length;
    const offlineCount = trucks.filter(t => !t.isLive).length;

    // Add markers for each live truck on the map
    const liveTrucks = trucks.filter(t => t.isLive && t.lat && t.lng);

    // Store truck data for marker popup access
    window._liveTruckCache = {};

    liveTrucks.forEach((truck, idx) => {
      const { truckId, fullName, username, lat, lng, speed, routeName, routeId } = truck;

      // Cache truck data for popup button
      window._liveTruckCache[truckId] = truck;

      // Create custom truck marker
      const markerHtml = `
        <div class="relative">
          <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
            <i data-lucide="truck" class="w-5 h-5 text-white"></i>
          </div>
          <span class="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-ping"></span>
          <span class="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></span>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-truck-marker',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
      marker.bindPopup(`
        <div class="p-3 min-w-[220px]">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <i data-lucide="truck" class="w-5 h-5 text-green-600"></i>
            </div>
            <div>
              <p class="font-bold text-gray-800">${truckId}</p>
              <p class="text-xs text-green-600 flex items-center gap-1">
                <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Live
              </p>
            </div>
          </div>
          <div class="space-y-2 text-sm mb-3">
            <div class="flex items-center gap-2">
              <i data-lucide="user" class="w-4 h-4 text-gray-400"></i>
              <span class="font-medium text-gray-700">${fullName || username}</span>
            </div>
            <div class="flex items-center gap-2">
              <i data-lucide="route" class="w-4 h-4 text-gray-400"></i>
              <span class="font-medium ${routeId ? 'text-primary-600' : 'text-gray-400'}">${routeName || 'Not assigned'}</span>
            </div>
            <div class="flex items-center gap-2">
              <i data-lucide="gauge" class="w-4 h-4 text-gray-400"></i>
              <span class="font-bold text-green-600">${Math.round((speed || 0) * 3.6)} km/h</span>
            </div>
          </div>
          <button onclick="map.closePopup(); showTruckWithRoute(window._liveTruckCache['${truckId}'])"
                  class="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors">
            <i data-lucide="map" class="w-4 h-4"></i>
            ${routeId ? 'View Route on Map' : 'View Details'}
          </button>
        </div>
      `);
      tempMarkers.push(marker);
    });

    // Fit map to show all live trucks
    if (liveTrucks.length > 0) {
      const bounds = L.latLngBounds(liveTrucks.map(t => [t.lat, t.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }

    // Re-initialize Lucide icons
    if (typeof lucide !== 'undefined') {
      setTimeout(() => lucide.createIcons(), 100);
    }

    // Create floating panel for truck list
    createLiveTrackingPanel(trucks, liveCount, offlineCount);

    hidePageLoading();
  } catch (error) {
    console.error('Error loading truck tracking:', error);
    showToast('Error loading truck data: ' + error.message, 'error');
    hidePageLoading();
  }
};

// Create floating panel for live tracking
function createLiveTrackingPanel(trucks, liveCount, offlineCount) {
  // Remove existing panel
  const existingPanel = document.getElementById('liveTrackingPanel');
  if (existingPanel) existingPanel.remove();

  const panel = document.createElement('div');
  panel.id = 'liveTrackingPanel';
  panel.className = 'fixed top-20 right-4 w-80 max-h-[calc(100vh-6rem)] bg-white rounded-2xl shadow-2xl z-[1000] flex flex-col overflow-hidden animate-slide-in';

  panel.innerHTML = `
    <!-- Panel Header -->
    <div class="px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white flex-shrink-0">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <i data-lucide="radio" class="w-5 h-5"></i>
          <h3 class="font-semibold">Live Tracking</h3>
        </div>
        <button onclick="closeLiveTrackingPanel()" class="p-1 hover:bg-white/20 rounded-lg transition-colors">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>
      <div class="flex items-center gap-4 mt-2 text-sm">
        <span class="flex items-center gap-1">
          <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          ${liveCount} Live
        </span>
        <span class="flex items-center gap-1">
          <span class="w-2 h-2 bg-gray-400 rounded-full"></span>
          ${offlineCount} Offline
        </span>
      </div>
      <p class="text-xs opacity-75 mt-1">Click a truck to view its route</p>
    </div>

    <!-- Refresh Button -->
    <div class="px-4 py-2 bg-gray-50 border-b border-gray-100 flex-shrink-0">
      <button onclick="showLiveTruckPanel()" class="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors">
        <i data-lucide="refresh-cw" class="w-4 h-4"></i>
        Refresh Data
      </button>
    </div>

    <!-- Truck List -->
    <div class="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
      ${trucks.length > 0 ? trucks.map((truck, index) => {
        const { truckId, fullName, username, isLive, speed, lat, lng, routeName, routeId } = truck;
        // Store truck data in a global array for onclick access
        window._truckDataCache = window._truckDataCache || [];
        window._truckDataCache[index] = truck;
        return `
          <div class="p-3 rounded-xl border ${isLive ? 'border-green-200 bg-green-50 hover:border-green-300' : 'border-gray-200 bg-gray-50 hover:border-gray-300'} hover:shadow-md transition-all cursor-pointer group"
               onclick="showTruckWithRoute(window._truckDataCache[${index}])">
            <div class="flex items-center gap-3">
              <div class="relative flex-shrink-0">
                <div class="w-10 h-10 ${isLive ? 'bg-green-500 group-hover:bg-green-600' : 'bg-gray-400 group-hover:bg-gray-500'} rounded-full flex items-center justify-center transition-colors">
                  <i data-lucide="truck" class="w-5 h-5 text-white"></i>
                </div>
                ${isLive ? '<span class="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full animate-pulse border-2 border-white"></span>' : ''}
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-gray-800 truncate group-hover:text-primary-700">${truckId}</p>
                <p class="text-xs text-gray-500 truncate">${fullName || username}</p>
              </div>
              <div class="text-right flex-shrink-0">
                ${isLive ? `
                  <p class="text-sm font-bold text-green-600">${Math.round((speed || 0) * 3.6)} km/h</p>
                  <p class="text-xs text-green-500">Live</p>
                ` : `
                  <p class="text-xs text-gray-400">Offline</p>
                `}
              </div>
              <div class="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <i data-lucide="chevron-right" class="w-4 h-4 text-gray-400"></i>
              </div>
            </div>
            ${routeName && routeName !== 'No route assigned' ? `
              <div class="mt-2 flex items-center gap-1 text-xs ${routeId ? 'text-primary-600' : 'text-gray-500'}">
                <i data-lucide="route" class="w-3 h-3"></i>
                <span class="truncate">${routeName}</span>
                ${routeId ? '<i data-lucide="map" class="w-3 h-3 ml-auto text-primary-400"></i>' : ''}
              </div>
            ` : `
              <p class="mt-2 text-xs text-gray-400 italic">No route assigned</p>
            `}
          </div>
        `;
      }).join('') : `
        <div class="text-center py-8 text-gray-400">
          <i data-lucide="truck" class="w-12 h-12 mx-auto mb-2 opacity-50"></i>
          <p class="text-sm">No trucks available</p>
        </div>
      `}
    </div>

    <!-- Back Button -->
    <div class="px-4 py-3 bg-gray-50 border-t border-gray-100 flex-shrink-0">
      <button onclick="closeLiveTrackingPanel(); showDashboard();" class="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg transition-colors">
        <i data-lucide="arrow-left" class="w-4 h-4"></i>
        Back to Dashboard
      </button>
    </div>
  `;

  document.body.appendChild(panel);

  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// Close live tracking panel
window.closeLiveTrackingPanel = function() {
  const panel = document.getElementById('liveTrackingPanel');
  if (panel) panel.remove();
  clearTempMarkers();
};

// Focus on a specific truck on the map (simple version)
window.focusTruckOnMap = function(lat, lng, truckId) {
  if (lat && lng) {
    map.setView([lat, lng], 17, { animate: true });
    showToast(`Focused on ${truckId}`, 'info');
  }
};

// Enhanced: Show truck with its assigned route on the map
window.showTruckWithRoute = async function(truckData) {
  showPageLoading('Loading truck details...');
  const { truckId, routeId, lat, lng, fullName, username, speed, plateNumber, model, routeName, isLive } = truckData;

  // Clear existing route markers but keep truck markers
  clearRouteOnlyMarkers();

  // Focus on truck location
  if (lat && lng) {
    map.setView([lat, lng], 14, { animate: true });
  }

  // If truck has an assigned route, fetch and display it
  if (routeId) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/routes/${routeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const route = await response.json();

        if (route.path && route.path.coordinates && route.path.coordinates.length >= 2) {
          const coords = route.path.coordinates;
          const waypoints = coords.map(c => L.latLng(c[1], c[0]));

          // Add route stop markers
          coords.forEach((coord, index) => {
            const isStart = index === 0;
            const isEnd = index === coords.length - 1;

            const markerHtml = `
              <div class="flex items-center justify-center w-7 h-7 rounded-full shadow-lg ${isStart ? 'bg-green-500' : isEnd ? 'bg-red-500' : 'bg-primary-500'} text-white font-bold text-xs border-2 border-white">
                ${isStart ? '<i data-lucide="play" class="w-3 h-3"></i>' : isEnd ? '<i data-lucide="flag" class="w-3 h-3"></i>' : index}
              </div>
            `;

            const customIcon = L.divIcon({
              html: markerHtml,
              className: 'custom-route-marker route-only-marker',
              iconSize: [28, 28],
              iconAnchor: [14, 14]
            });

            const marker = L.marker([coord[1], coord[0]], { icon: customIcon }).addTo(map);
            marker.bindPopup(`<div class="p-2 text-sm"><strong>${isStart ? 'Start' : isEnd ? 'End' : 'Stop ' + index}</strong></div>`);
            marker._isRouteMarker = true;
            tempMarkers.push(marker);
          });

          // Draw route with Leaflet Routing Machine
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
            fitSelectedRoutes: false,
            showAlternatives: false,
            createMarker: () => null
          }).addTo(map);

          routingControl._isRouteMarker = true;
          tempMarkers.push(routingControl);

          // Handle route found
          routingControl.on('routesfound', (e) => {
            const routes = e.routes;
            if (routes && routes.length > 0) {
              const summary = routes[0].summary;
              const distanceKm = (summary.totalDistance / 1000).toFixed(2);
              const durationMin = Math.round(summary.totalTime / 60);

              // Hide routing container
              const container = routingControl.getContainer();
              if (container) container.style.display = 'none';

              // Show truck info panel with route details
              showTruckInfoPanel(truckData, route, distanceKm, durationMin);
            }

            if (typeof lucide !== 'undefined') {
              setTimeout(() => lucide.createIcons(), 100);
            }
          });

          // Handle routing error
          routingControl.on('routingerror', () => {
            // Fallback to straight lines
            const latLngCoords = coords.map(c => [c[1], c[0]]);
            const line = L.polyline(latLngCoords, {
              color: '#4f46e5',
              weight: 4,
              dashArray: '10, 10',
              opacity: 0.8
            }).addTo(map);
            line._isRouteMarker = true;
            tempMarkers.push(line);

            showTruckInfoPanel(truckData, route, route.distance ? (route.distance / 1000).toFixed(2) : '-', '-');

            if (typeof lucide !== 'undefined') {
              setTimeout(() => lucide.createIcons(), 100);
            }
          });

        } else {
          // Route has no coordinates
          showTruckInfoPanel(truckData, null, null, null);
        }
      } else {
        showTruckInfoPanel(truckData, null, null, null);
      }
    } catch (error) {
      console.error('Error fetching route:', error);
      showTruckInfoPanel(truckData, null, null, null);
    }
  } else {
    // No route assigned
    showTruckInfoPanel(truckData, null, null, null);
  }
};

// Clear only route markers (keep truck markers)
function clearRouteOnlyMarkers() {
  tempMarkers = tempMarkers.filter(marker => {
    if (marker._isRouteMarker) {
      if (marker.remove) marker.remove();
      else if (map.removeControl) map.removeControl(marker);
      else if (map.removeLayer) map.removeLayer(marker);
      return false;
    }
    return true;
  });
}

// Show truck information panel
function showTruckInfoPanel(truckData, route, distanceKm, durationMin) {
  hidePageLoading(); // Hide loading when panel shows
  const { truckId, fullName, username, speed, plateNumber, model, routeName, isLive, lat, lng } = truckData;

  // Remove existing panel
  const existingPanel = document.getElementById('truckInfoPanel');
  if (existingPanel) existingPanel.remove();

  const panel = document.createElement('div');
  panel.id = 'truckInfoPanel';
  panel.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 lg:left-auto lg:right-4 lg:translate-x-0 bg-white rounded-2xl shadow-2xl z-[1000] w-[90%] max-w-md animate-fade-in overflow-hidden';

  const stopCount = route?.path?.coordinates?.length || 0;
  const progressPercent = route?.completedStops ? Math.round((route.completedStops / stopCount) * 100) : 0;

  panel.innerHTML = `
    <!-- Header with gradient -->
    <div class="px-4 py-3 bg-gradient-to-r ${isLive ? 'from-green-600 to-green-500' : 'from-gray-600 to-gray-500'} text-white">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="relative">
            <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <i data-lucide="truck" class="w-6 h-6"></i>
            </div>
            ${isLive ? '<span class="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-ping"></span>' : ''}
            ${isLive ? '<span class="absolute -top-1 -right-1 w-4 h-4 bg-green-300 rounded-full border-2 border-white"></span>' : ''}
          </div>
          <div>
            <h3 class="font-bold text-lg">${truckId}</h3>
            <p class="text-sm opacity-90">${plateNumber || 'No plate'} • ${model || 'Unknown model'}</p>
          </div>
        </div>
        <button onclick="closeTruckInfoPanel()" class="p-2 hover:bg-white/20 rounded-lg transition-colors">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>
    </div>

    <!-- Body -->
    <div class="p-4 space-y-4">
      <!-- Driver Info -->
      <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
        <div class="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
          <i data-lucide="user" class="w-5 h-5 text-primary-600"></i>
        </div>
        <div class="flex-1">
          <p class="text-sm text-gray-500">Driver</p>
          <p class="font-semibold text-gray-800">${fullName || username}</p>
        </div>
        ${isLive ? `
          <div class="text-right">
            <p class="text-2xl font-bold text-green-600">${Math.round((speed || 0) * 3.6)}</p>
            <p class="text-xs text-gray-500">km/h</p>
          </div>
        ` : `
          <span class="px-3 py-1 bg-gray-200 text-gray-600 text-sm font-medium rounded-full">Offline</span>
        `}
      </div>

      <!-- Route Info -->
      ${route ? `
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <i data-lucide="route" class="w-4 h-4 text-primary-600"></i>
              <span class="font-semibold text-gray-800">${route.name || routeName || 'Unnamed Route'}</span>
            </div>
            <span class="px-2 py-1 text-xs font-medium rounded-full ${route.status === 'active' ? 'bg-yellow-100 text-yellow-700' : route.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}">
              ${route.status || 'planned'}
            </span>
          </div>

          <!-- Route Stats -->
          <div class="grid grid-cols-3 gap-3">
            <div class="bg-primary-50 rounded-xl p-3 text-center">
              <p class="text-xl font-bold text-primary-600">${distanceKm || '-'}</p>
              <p class="text-xs text-gray-500">km</p>
            </div>
            <div class="bg-primary-50 rounded-xl p-3 text-center">
              <p class="text-xl font-bold text-primary-600">${durationMin || '-'}</p>
              <p class="text-xs text-gray-500">mins</p>
            </div>
            <div class="bg-primary-50 rounded-xl p-3 text-center">
              <p class="text-xl font-bold text-primary-600">${stopCount}</p>
              <p class="text-xs text-gray-500">stops</p>
            </div>
          </div>

          <!-- Route Legend -->
          <div class="flex items-center justify-center gap-4 text-xs text-gray-500">
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
      ` : `
        <div class="text-center py-4 text-gray-400">
          <i data-lucide="route" class="w-10 h-10 mx-auto mb-2 opacity-50"></i>
          <p class="text-sm font-medium">No route assigned</p>
          <p class="text-xs">This truck doesn't have an active route</p>
        </div>
      `}

      <!-- Location Info -->
      ${lat && lng ? `
        <div class="flex items-center gap-2 text-xs text-gray-400 pt-2 border-t border-gray-100">
          <i data-lucide="map-pin" class="w-3 h-3"></i>
          <span>Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}</span>
        </div>
      ` : ''}
    </div>

    <!-- Footer -->
    <div class="px-4 py-3 bg-gray-50 border-t border-gray-100">
      <button onclick="closeTruckInfoPanel()" class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-xl transition-colors">
        <i data-lucide="arrow-left" class="w-4 h-4"></i>
        Back to Truck List
      </button>
    </div>
  `;

  document.body.appendChild(panel);

  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// Close truck info panel
window.closeTruckInfoPanel = function() {
  const panel = document.getElementById('truckInfoPanel');
  if (panel) panel.remove();
  clearRouteOnlyMarkers();
};

// View truck on map from page view
window.viewTruckOnMapFromPage = function(lat, lng, truckId) {
  if (!lat || !lng) {
    showToast('Location not available for this truck', 'warning');
    return;
  }
  closePage();
  setTimeout(() => {
    map.setView([lat, lng], 17, { animate: true });
    Object.values(driverMarkers).forEach(marker => {
      const markerLatLng = marker.getLatLng();
      if (Math.abs(markerLatLng.lat - lat) < 0.0001 && Math.abs(markerLatLng.lng - lng) < 0.0001) {
        marker.openPopup();
      }
    });
  }, 100);
};

// View truck on map and close modal
window.viewTruckOnMap = function(lat, lng, truckId) {
  closeModal();
  map.setView([lat, lng], 17, { animate: true });
  
  // Open the truck's popup if marker exists
  Object.values(driverMarkers).forEach(marker => {
    const markerLatLng = marker.getLatLng();
    if (Math.abs(markerLatLng.lat - lat) < 0.0001 && Math.abs(markerLatLng.lng - lng) < 0.0001) {
      marker.openPopup();
    }
  });
  
  console.log(`Viewing truck ${truckId} on map at ${lat}, ${lng}`);
};

// Profile Management Functions
async function loadHeaderProfilePicture() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found, skipping profile picture load');
      return;
    }
    
    console.log('Loading profile picture...');
    const response = await fetch(`${API_URL}/profile/me`, {
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
          headerPic.innerHTML = `<img src="${profile.profilePicture}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
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

// Driver History Function
window.showDriverHistory = async function() {
  try {
    const token = localStorage.getItem('token');
    
    // Get all routes completed by this driver
    const response = await fetch(`${API_URL}/routes`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const routes = await response.json();
    const myCompletedRoutes = routes.filter(r => 
      r.status === 'completed' && 
      r.completedBy === user.username &&
      r.completedAt
    );
    
    // Sort by completion date (newest first)
    myCompletedRoutes.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
    
    if (myCompletedRoutes.length === 0) {
      showModal('My History', `
        <div class="text-center py-8">
          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i data-lucide="clipboard-list" class="w-8 h-8 text-gray-400"></i>
          </div>
          <p class="text-gray-500 text-lg">No completed routes yet</p>
          <p class="text-gray-400 text-sm mt-2">Complete your first route to see it here!</p>
        </div>
        <button onclick="closeModal()" class="w-full px-4 py-2.5 mt-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors">Close</button>
      `);
      return;
    }
    
    const historyList = myCompletedRoutes.map(route => {
      const completedDate = new Date(route.completedAt).toLocaleString();
      const photosHtml = route.completionPhotos && route.completionPhotos.length > 0 ? 
        route.completionPhotos.map(photo => 
          `<img src="${photo}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; margin: 0.25rem; cursor: pointer; border: 2px solid #e0e0e0;" onclick="window.open('${photo}', '_blank')" title="Click to view full size">`
        ).join('') : 
        '<p style="color: #999; font-size: 0.85rem; font-style: italic;">No photos</p>';
      
      return `
        <div style="background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%); padding: 1rem; border-radius: 10px; margin-bottom: 0.75rem; border-left: 5px solid #4caf50; box-shadow: 0 2px 4px rgba(0,0,0,0.08);">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
            <div style="flex: 1;">
              <h4 style="margin: 0 0 0.25rem 0; color: #4caf50; font-size: 1rem;">
                ✓ ${route.name}
              </h4>
              <p style="margin: 0; color: #666; font-size: 0.8rem; font-weight: 500;">${route.routeId}</p>
            </div>
            <span style="background: #4caf50; color: white; padding: 0.3rem 0.6rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">
              Completed
            </span>
          </div>
          
          <div style="background: white; padding: 0.6rem; border-radius: 6px; margin: 0.5rem 0; font-size: 0.85rem; border: 1px solid #e0e0e0;">
            <p style="margin: 0.25rem 0;"><strong style="color: #333;">🕐 Completed:</strong> ${completedDate}</p>
            ${route.completionNotes ? `<p style="margin: 0.25rem 0;"><strong style="color: #333;">📝 Notes:</strong> ${route.completionNotes}</p>` : ''}
          </div>
          
          <div style="margin-top: 0.5rem;">
            <div style="font-size: 0.85rem; font-weight: 600; margin-bottom: 0.25rem; color: #333;">📷 Proof Photos:</div>
            <div style="display: flex; flex-wrap: wrap; gap: 0.25rem;">
              ${photosHtml}
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    showModal('📜 My Completion History', `
      <div>
        <div style="background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%); padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border-left: 4px solid #4caf50;">
          <p style="color: #4caf50; font-weight: 700; margin: 0; font-size: 1.1rem;">
            📜 My Completed Routes
          </p>
          <p style="color: #666; margin: 0.25rem 0 0 0; font-size: 0.85rem;">
            You have completed ${myCompletedRoutes.length} route${myCompletedRoutes.length > 1 ? 's' : ''}
          </p>
        </div>
        <div style="max-height: 500px; overflow-y: auto; padding-right: 0.5rem;">
          ${historyList}
        </div>
        <button onclick="closeModal()" class="w-full px-4 py-2.5 mt-4 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors">Close</button>
      </div>
    `);
  } catch (error) {
    console.error('Error loading driver history:', error);
    showModal('📜 My History', '<p style="color: red; text-align: center; padding: 2rem;">Error loading history</p>');
  }
};

window.showProfile = async function() {
  try {
    const response = await fetch(`${API_URL}/profile/me`);
    if (!response.ok) {
      throw new Error('Failed to load profile');
    }
    
    const profile = await response.json();
    
    const profilePicHtml = profile.profilePicture
      ? `<img src="${profile.profilePicture}" class="w-32 h-32 rounded-full object-cover border-4 border-primary-500 shadow-lg">`
      : `<div class="w-32 h-32 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-content-center text-5xl font-bold border-4 border-primary-400 shadow-lg">
           ${(profile.fullName || profile.username).charAt(0).toUpperCase()}
         </div>`;

    showModal('My Profile', `
      <div class="text-center space-y-6">
        <div class="flex justify-center">
          ${profilePicHtml}
        </div>

        <div class="flex justify-center gap-2">
          <button onclick="showChangeProfilePicture()" class="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-xl transition-colors">
            Change Picture
          </button>
          ${profile.profilePicture ? `
            <button onclick="removeProfilePicture()" class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-xl transition-colors">
              Remove
            </button>
          ` : ''}
        </div>

        <div class="bg-gray-50 rounded-xl p-4 text-left space-y-3">
          <div class="flex justify-between items-center py-2 border-b border-gray-200">
            <span class="text-sm text-gray-500 font-medium">Username</span>
            <span class="text-sm text-gray-800 font-medium">${profile.username}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-gray-200">
            <span class="text-sm text-gray-500 font-medium">Full Name</span>
            <span class="text-sm text-gray-800">${profile.fullName || '-'}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-gray-200">
            <span class="text-sm text-gray-500 font-medium">Email</span>
            <span class="text-sm text-gray-800">${profile.email}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-gray-200">
            <span class="text-sm text-gray-500 font-medium">Phone Number</span>
            <span class="text-sm text-gray-800">${profile.phoneNumber || '-'}</span>
          </div>
          <div class="flex justify-between items-center py-2">
            <span class="text-sm text-gray-500 font-medium">Role</span>
            <span class="px-3 py-1 rounded-full text-xs font-medium ${profile.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}">${profile.role}</span>
          </div>
        </div>

        <div class="flex gap-3 pt-2">
          <button onclick="showEditProfile()" class="flex-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors">
            Edit Profile
          </button>
          <button onclick="closeModal()" class="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors">
            Close
          </button>
        </div>
      </div>
    `);
  } catch (error) {
    console.error('Error loading profile:', error);
    showToast('Error loading profile: ' + error.message, 'error');
  }
};

window.showEditProfile = async function() {
  try {
    const response = await fetch(`${API_URL}/profile/me`);
    const profile = await response.json();
    
    showModal('Edit Profile', `
      <form id="editProfileForm" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <input type="text" value="${profile.username}" disabled
            class="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed">
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
          <input type="text" id="profileFullName" value="${profile.fullName || ''}" required
            class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input type="email" id="profileEmail" value="${profile.email}" required
            class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <input type="tel" id="profilePhone" value="${profile.phoneNumber || ''}" pattern="[0-9]{11}" placeholder="09XXXXXXXXX"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
          <p class="mt-1 text-xs text-gray-500">Format: 09XXXXXXXXX (11 digits)</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">New Password (leave blank to keep current)</label>
          <input type="password" id="profilePassword" minlength="6" placeholder="Enter new password"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
          <input type="password" id="profilePasswordConfirm" minlength="6" placeholder="Confirm new password"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
        </div>

        <div class="flex gap-3 pt-4">
          <button type="submit" class="flex-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors">
            Save Changes
          </button>
          <button type="button" onclick="closeModal()" class="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors">
            Cancel
          </button>
        </div>
      </form>
    `);
    
    document.getElementById('editProfileForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const password = document.getElementById('profilePassword').value;
      const passwordConfirm = document.getElementById('profilePasswordConfirm').value;
      
      if (password && password !== passwordConfirm) {
        showToast('Passwords do not match!', 'warning');
        return;
      }
      
      const updateData = {
        fullName: document.getElementById('profileFullName').value,
        email: document.getElementById('profileEmail').value,
        phoneNumber: document.getElementById('profilePhone').value
      };
      
      if (password) {
        updateData.password = password;
      }
      
      try {
        const response = await fetch(`${API_URL}/profile/me`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        });
        
        if (response.ok) {
          const result = await response.json();
          // Update local storage
          const updatedUser = { ...user, ...result.user };
          localStorage.setItem('user', JSON.stringify(updatedUser));

          closeModal();
          showToast('Profile updated successfully!', 'success');

          // Refresh the page to update header
          location.reload();
        } else {
          const error = await response.json();
          showToast(error.error || 'Failed to update profile', 'error');
        }
      } catch (error) {
        showToast('Error updating profile: ' + error.message, 'error');
      }
    });
  } catch (error) {
    showToast('Error loading profile: ' + error.message, 'error');
  }
};

window.showChangeProfilePicture = function() {
  showModal('Change Profile Picture', `
    <form id="uploadProfilePicForm" enctype="multipart/form-data" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Select Profile Picture *</label>
        <div class="relative">
          <input type="file" id="profilePictureFile" accept="image/jpeg,image/jpg,image/png,image/gif" required
            class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100">
        </div>
        <p class="mt-2 text-xs text-gray-500">
          Accepted formats: JPG, PNG, GIF | Maximum size: 2MB
        </p>
      </div>

      <div id="imagePreview" class="flex justify-center py-4"></div>

      <div class="flex gap-3 pt-4">
        <button type="submit" class="flex-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors">
          Upload Picture
        </button>
        <button type="button" onclick="closeModal()" class="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors">
          Cancel
        </button>
      </div>
    </form>
  `);
  
  // Image preview
  document.getElementById('profilePictureFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
      // Check file size (2MB)
      if (file.size > 2 * 1024 * 1024) {
        showToast('File size must be less than 2MB', 'warning');
        this.value = '';
        return;
      }
      
      const reader = new FileReader();
      reader.onload = function(e) {
        document.getElementById('imagePreview').innerHTML = `
          <img src="${e.target.result}" class="max-w-[200px] max-h-[200px] rounded-xl border-2 border-primary-500 shadow-lg">
        `;
      };
      reader.readAsDataURL(file);
    }
  });
  
  document.getElementById('uploadProfilePicForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fileInput = document.getElementById('profilePictureFile');
    const file = fileInput.files[0];
    
    if (!file) {
      showToast('Please select a file', 'warning');
      return;
    }
    
    const formData = new FormData();
    formData.append('profilePicture', file);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/profile/picture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        closeModal();
        showToast('Profile picture updated successfully!', 'success');

        // Update header profile picture
        loadHeaderProfilePicture();

        // Show profile again
        showProfile();
      } else {
        const error = await response.json();
        showToast(error.error || 'Failed to upload picture', 'error');
      }
    } catch (error) {
      showToast('Error uploading picture: ' + error.message, 'error');
    }
  });
};

window.removeProfilePicture = async function() {
  if (!await showConfirm('Remove Profile Picture', 'Are you sure you want to remove your profile picture?')) {
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/profile/picture`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      closeModal();
      showToast('Profile picture removed successfully!', 'success');

      // Update header
      const headerPic = document.getElementById('headerProfilePic');
      if (headerPic) {
        headerPic.innerHTML = (user.fullName || user.username).charAt(0).toUpperCase();
      }

      // Refresh profile view
      showProfile();
    } else {
      const error = await response.json();
      showToast(error.error || 'Failed to remove picture', 'error');
    }
  } catch (error) {
    showToast('Error removing picture: ' + error.message, 'error');
  }
};

// ============================================
// FUEL MANAGEMENT SYSTEM
// ============================================

async function showFuelManagement() {
  try {
    const response = await fetch(`${API_URL}/fuel/all-stats`);
    const data = await response.json();

    const { trucks, fleet } = data;

    const truckCards = trucks.map(t => {
      const fuelColor = t.fuelLevel > 50 ? 'text-green-600' : t.fuelLevel > 25 ? 'text-yellow-600' : 'text-red-600';
      const fuelBg = t.fuelLevel > 50 ? 'bg-green-500' : t.fuelLevel > 25 ? 'bg-yellow-500' : 'bg-red-500';
      const borderColor = t.fuelLevel < 25 ? 'border-red-200' : 'border-gray-100';

      return `
        <div class="bg-white rounded-xl shadow-sm border ${borderColor} overflow-hidden">
          <!-- Card Header -->
          <div class="flex items-center justify-between px-5 py-4 bg-gray-50 border-b border-gray-100">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <i data-lucide="truck" class="w-5 h-5 text-blue-600"></i>
              </div>
              <div>
                <h3 class="font-semibold text-gray-800">${t.truckId}</h3>
                <p class="text-sm text-gray-500">${t.plateNumber}</p>
              </div>
            </div>
            ${t.fuelLevel < 25 ? `
              <span class="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Low Fuel</span>
            ` : ''}
          </div>

          <!-- Fuel Gauge -->
          <div class="p-5">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-gray-500">Fuel Level</span>
              <span class="font-bold ${fuelColor}">${t.fuelLevel}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div class="${fuelBg} h-3 rounded-full transition-all" style="width: ${t.fuelLevel}%"></div>
            </div>
            <p class="text-xs text-gray-500 text-center">${t.currentLiters}L / ${t.tankCapacity}L</p>
          </div>

          <!-- Stats Grid -->
          <div class="grid grid-cols-2 gap-px bg-gray-100">
            <div class="bg-white p-4">
              <p class="text-xs text-gray-500 mb-1">Consumption</p>
              <p class="font-semibold text-gray-800">${t.averageFuelConsumption} L/100km</p>
            </div>
            <div class="bg-white p-4">
              <p class="text-xs text-gray-500 mb-1">Total Used</p>
              <p class="font-semibold text-gray-800">${t.totalFuelConsumed.toFixed(1)} L</p>
            </div>
            <div class="bg-white p-4">
              <p class="text-xs text-gray-500 mb-1">Total Cost</p>
              <p class="font-semibold text-gray-800">₱${t.totalFuelCost.toFixed(0)}</p>
            </div>
            <div class="bg-white p-4">
              <p class="text-xs text-gray-500 mb-1">Mileage</p>
              <p class="font-semibold text-gray-800">${t.mileage.toFixed(0)} km</p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-2 p-4 bg-gray-50 border-t border-gray-100">
            <button onclick="showRefuelForm('${t.truckId}')" class="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors">
              <i data-lucide="fuel" class="w-4 h-4"></i>
              Refuel
            </button>
            <button onclick="showFuelEstimator('${t.truckId}')" class="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors">
              <i data-lucide="calculator" class="w-4 h-4"></i>
              Estimate
            </button>
            <button onclick="showFuelHistory('${t.truckId}')" class="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="History">
              <i data-lucide="history" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    showPage('Fuel Management', `
      <!-- Fleet Summary Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <i data-lucide="truck" class="w-6 h-6 text-blue-600"></i>
            </div>
            <div>
              <p class="text-sm text-gray-500">Total Trucks</p>
              <p class="text-2xl font-bold text-gray-800">${fleet.totalTrucks}</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 ${fleet.avgFuelLevel > 50 ? 'bg-green-100' : fleet.avgFuelLevel > 25 ? 'bg-yellow-100' : 'bg-red-100'} rounded-xl flex items-center justify-center">
              <i data-lucide="fuel" class="w-6 h-6 ${fleet.avgFuelLevel > 50 ? 'text-green-600' : fleet.avgFuelLevel > 25 ? 'text-yellow-600' : 'text-red-600'}"></i>
            </div>
            <div>
              <p class="text-sm text-gray-500">Avg Fuel Level</p>
              <p class="text-2xl font-bold ${fleet.avgFuelLevel > 50 ? 'text-green-600' : fleet.avgFuelLevel > 25 ? 'text-yellow-600' : 'text-red-600'}">${fleet.avgFuelLevel}%</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <i data-lucide="droplet" class="w-6 h-6 text-orange-600"></i>
            </div>
            <div>
              <p class="text-sm text-gray-500">Total Consumed</p>
              <p class="text-2xl font-bold text-gray-800">${fleet.totalFuelConsumed.toFixed(0)}L</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <i data-lucide="banknote" class="w-6 h-6 text-purple-600"></i>
            </div>
            <div>
              <p class="text-sm text-gray-500">Total Cost</p>
              <p class="text-2xl font-bold text-gray-800">₱${fleet.totalFuelCost.toFixed(0)}</p>
            </div>
          </div>
        </div>
      </div>

      ${fleet.trucksNeedingRefuel > 0 ? `
        <div class="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <div class="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <i data-lucide="alert-triangle" class="w-5 h-5 text-red-600"></i>
          </div>
          <div>
            <p class="font-semibold text-red-700">${fleet.trucksNeedingRefuel} truck${fleet.trucksNeedingRefuel > 1 ? 's' : ''} need refueling</p>
            <p class="text-sm text-red-600">Fuel level below 25%</p>
          </div>
        </div>
      ` : ''}

      <!-- Trucks Grid -->
      ${trucks.length > 0 ? `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${truckCards}
        </div>
      ` : `
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i data-lucide="truck" class="w-8 h-8 text-gray-400"></i>
          </div>
          <h3 class="text-lg font-semibold text-gray-700 mb-2">No Trucks Found</h3>
          <p class="text-gray-500">Add trucks to manage their fuel</p>
        </div>
      `}
    `);
  } catch (error) {
    console.error('Error loading fuel data:', error);
    showPage('Fuel Management', `
      <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <i data-lucide="alert-circle" class="w-12 h-12 text-red-500 mx-auto mb-3"></i>
        <p class="text-red-700">Error loading fuel data: ${error.message}</p>
        <button onclick="showFuelManagement()" class="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
          Try Again
        </button>
      </div>
    `);
  }
}

function showRefuelForm(truckId) {
  showModal('Log Refuel', `
    <form id="refuelForm" class="space-y-4">
      <input type="hidden" id="refuelTruckId" value="${truckId}">

      <div class="bg-blue-50 rounded-lg p-3 flex items-center gap-2 mb-4">
        <i data-lucide="truck" class="w-5 h-5 text-blue-500"></i>
        <span class="text-blue-700 font-medium">Truck: ${truckId}</span>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Liters Added *</label>
        <input type="number" id="refuelLiters" step="0.1" min="0" required
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="e.g., 45.5">
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Price per Liter (₱)</label>
        <input type="number" id="refuelPrice" step="0.01" min="0"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="e.g., 65.50">
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Gas Station</label>
        <input type="text" id="refuelStation"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="e.g., Shell, Petron, Caltex">
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Odometer Reading (km)</label>
        <input type="number" id="refuelOdometer" step="0.1" min="0"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Current odometer reading">
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea id="refuelNotes" rows="2"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Any additional notes..."></textarea>
      </div>

      <div class="flex gap-3 pt-4">
        <button type="submit" class="flex-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors">
          Log Refuel
        </button>
        <button type="button" onclick="closeModal()" class="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors">
          Cancel
        </button>
      </div>
    </form>
  `);

  document.getElementById('refuelForm').addEventListener('submit', submitRefuel);

  if (typeof lucide !== 'undefined') {
    setTimeout(() => lucide.createIcons(), 50);
  }
}

async function submitRefuel(e) {
  e.preventDefault();

  const data = {
    truckId: document.getElementById('refuelTruckId').value,
    litersAdded: parseFloat(document.getElementById('refuelLiters').value),
    pricePerLiter: parseFloat(document.getElementById('refuelPrice').value) || 0,
    gasStation: document.getElementById('refuelStation').value,
    odometerReading: parseFloat(document.getElementById('refuelOdometer').value) || null,
    notes: document.getElementById('refuelNotes').value
  };

  try {
    const response = await fetch(`${API_URL}/fuel/refuel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (response.ok) {
      closeModal();
      showToast(`Refuel logged! New fuel level: ${result.truck.fuelLevel}%`, 'success');
      showFuelManagement();
    } else {
      showToast(result.error, 'error');
    }
  } catch (error) {
    showToast('Error logging refuel: ' + error.message, 'error');
  }
}

function showFuelEstimator(truckId) {
  showModal('Fuel Consumption Estimator', `
    <form id="estimatorForm" class="space-y-4">
      <input type="hidden" id="estimatorTruckId" value="${truckId}">

      <div class="bg-blue-50 rounded-lg p-3 flex items-center gap-2 mb-4">
        <i data-lucide="calculator" class="w-5 h-5 text-blue-500"></i>
        <span class="text-blue-700 font-medium">Estimate fuel for Truck: ${truckId}</span>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Distance (km) *</label>
          <input type="number" id="estDistance" step="0.1" min="0" required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="e.g., 25">
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Avg Speed (km/h)</label>
          <input type="number" id="estSpeed" step="1" min="0" value="30"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Number of Stops</label>
          <input type="number" id="estStops" min="0" value="10"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Idle Time (minutes)</label>
          <input type="number" id="estIdle" min="0" value="15"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
        </div>

        <div class="col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">Load Percentage (%)</label>
          <input type="range" id="estLoad" min="0" max="100" value="50"
            class="w-full" oninput="document.getElementById('loadValue').textContent = this.value + '%'">
          <div class="text-center text-sm text-gray-500 mt-1">
            Cargo load: <span id="loadValue">50%</span>
          </div>
        </div>
      </div>

      <div id="estimationResult" class="hidden bg-gray-50 rounded-xl p-4 space-y-3">
        <!-- Results will be shown here -->
      </div>

      <div class="flex gap-3 pt-4">
        <button type="submit" class="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors">
          Calculate Estimate
        </button>
        <button type="button" onclick="closeModal()" class="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors">
          Cancel
        </button>
      </div>

      <button type="button" id="logConsumptionBtn" onclick="logEstimatedConsumption()" class="hidden w-full px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors mt-3">
        Log This Consumption
      </button>
    </form>
  `);

  document.getElementById('estimatorForm').addEventListener('submit', calculateFuelEstimate);

  if (typeof lucide !== 'undefined') {
    setTimeout(() => lucide.createIcons(), 50);
  }
}

let lastEstimation = null;

async function calculateFuelEstimate(e) {
  e.preventDefault();

  const data = {
    truckId: document.getElementById('estimatorTruckId').value,
    distance: parseFloat(document.getElementById('estDistance').value),
    averageSpeed: parseFloat(document.getElementById('estSpeed').value) || 30,
    stopCount: parseInt(document.getElementById('estStops').value) || 0,
    idleTimeMinutes: parseInt(document.getElementById('estIdle').value) || 0,
    loadPercentage: parseInt(document.getElementById('estLoad').value) || 50
  };

  try {
    const response = await fetch(`${API_URL}/fuel/estimate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (response.ok) {
      lastEstimation = { ...data, estimation: result.estimation };

      const est = result.estimation;
      document.getElementById('estimationResult').innerHTML = `
        <h4 class="font-semibold text-gray-800 flex items-center gap-2">
          <i data-lucide="fuel" class="w-4 h-4 text-green-500"></i>
          Estimation Results
        </h4>

        <div class="grid grid-cols-2 gap-3 text-sm">
          <div class="bg-white rounded-lg p-3 border border-gray-200">
            <div class="text-gray-500 text-xs">Total Fuel Needed</div>
            <div class="text-xl font-bold text-green-600">${est.totalLiters} L</div>
          </div>
          <div class="bg-white rounded-lg p-3 border border-gray-200">
            <div class="text-gray-500 text-xs">Fuel Efficiency</div>
            <div class="text-xl font-bold text-blue-600">${est.efficiency} km/L</div>
          </div>
          <div class="bg-white rounded-lg p-3 border border-gray-200">
            <div class="text-gray-500 text-xs">Consumption Rate</div>
            <div class="text-xl font-bold text-orange-600">${est.consumptionRate} L/100km</div>
          </div>
          <div class="bg-white rounded-lg p-3 border border-gray-200">
            <div class="text-gray-500 text-xs">Distance Consumption</div>
            <div class="text-lg font-bold text-gray-700">${est.distanceConsumption} L</div>
          </div>
        </div>

        <div class="text-xs text-gray-500 space-y-1 border-t border-gray-200 pt-3 mt-3">
          <div>Stop consumption: ${est.stopConsumption} L (${data.stopCount} stops)</div>
          <div>Idle consumption: ${est.idleConsumption} L (${data.idleTimeMinutes} min)</div>
          <div>Speed factor: ${est.factors.speedFactor}x | Load factor: ${est.factors.loadFactor}x</div>
        </div>
      `;

      document.getElementById('estimationResult').classList.remove('hidden');
      document.getElementById('logConsumptionBtn').classList.remove('hidden');

      if (typeof lucide !== 'undefined') {
        setTimeout(() => lucide.createIcons(), 50);
      }
    } else {
      showToast(result.error, 'error');
    }
  } catch (error) {
    showToast('Error calculating estimate: ' + error.message, 'error');
  }
}

async function logEstimatedConsumption() {
  if (!lastEstimation) {
    showToast('Please calculate an estimate first', 'warning');
    return;
  }

  const data = {
    truckId: lastEstimation.truckId,
    distance: lastEstimation.distance,
    averageSpeed: lastEstimation.averageSpeed,
    stopCount: lastEstimation.stopCount,
    idleTimeMinutes: lastEstimation.idleTimeMinutes,
    loadPercentage: lastEstimation.loadPercentage,
    notes: `Estimated consumption: ${lastEstimation.estimation.totalLiters}L for ${lastEstimation.distance}km`
  };

  try {
    const response = await fetch(`${API_URL}/fuel/consumption`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (response.ok) {
      closeModal();
      showToast(`Consumption logged! Fuel level: ${result.truck.fuelLevel}%`, 'success');
      showFuelManagement();
    } else {
      showToast(result.error, 'error');
    }
  } catch (error) {
    showToast('Error logging consumption: ' + error.message, 'error');
  }
}

async function showFuelHistory(truckId) {
  try {
    const response = await fetch(`${API_URL}/fuel/stats/${truckId}?days=30`);
    const stats = await response.json();

    const logsHtml = stats.recentLogs.map(log => {
      const date = new Date(log.createdAt).toLocaleDateString();
      const time = new Date(log.createdAt).toLocaleTimeString();

      if (log.type === 'refuel') {
        return `
          <div class="bg-green-50 rounded-lg p-3 border-l-4 border-green-500">
            <div class="flex justify-between items-start">
              <div>
                <span class="text-xs font-medium text-green-600 uppercase">Refuel</span>
                <div class="font-semibold text-gray-800">+${log.litersAdded} L</div>
                <div class="text-xs text-gray-500">${log.gasStation || 'Unknown station'}</div>
              </div>
              <div class="text-right text-xs text-gray-500">
                <div>${date}</div>
                <div>${time}</div>
                ${log.totalCost > 0 ? `<div class="text-green-600 font-medium">₱${log.totalCost.toFixed(2)}</div>` : ''}
              </div>
            </div>
          </div>
        `;
      } else {
        return `
          <div class="bg-orange-50 rounded-lg p-3 border-l-4 border-orange-500">
            <div class="flex justify-between items-start">
              <div>
                <span class="text-xs font-medium text-orange-600 uppercase">Consumption</span>
                <div class="font-semibold text-gray-800">-${log.litersConsumed?.toFixed(2) || 0} L</div>
                <div class="text-xs text-gray-500">${log.distanceTraveled?.toFixed(1) || 0} km traveled</div>
              </div>
              <div class="text-right text-xs text-gray-500">
                <div>${date}</div>
                <div>${time}</div>
                ${log.routeName ? `<div class="text-orange-600">${log.routeName}</div>` : ''}
              </div>
            </div>
          </div>
        `;
      }
    }).join('');

    showModal(`Fuel History - ${truckId}`, `
      <div class="space-y-4">
        <!-- Stats Summary -->
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-gray-50 rounded-lg p-3 text-center">
            <div class="text-xs text-gray-500">Current Level</div>
            <div class="text-2xl font-bold text-green-600">${stats.truck.fuelLevel}%</div>
            <div class="text-xs text-gray-500">${stats.truck.currentLiters}L / ${stats.truck.tankCapacity}L</div>
          </div>
          <div class="bg-gray-50 rounded-lg p-3 text-center">
            <div class="text-xs text-gray-500">Avg Consumption</div>
            <div class="text-2xl font-bold text-orange-600">${stats.truck.averageFuelConsumption}</div>
            <div class="text-xs text-gray-500">L/100km</div>
          </div>
        </div>

        <!-- 30-day Summary -->
        <div class="bg-blue-50 rounded-lg p-4">
          <h4 class="font-semibold text-blue-800 mb-2">Last 30 Days</h4>
          <div class="grid grid-cols-3 gap-2 text-center text-sm">
            <div>
              <div class="text-lg font-bold text-blue-600">${stats.refueling.totalLiters}L</div>
              <div class="text-xs text-gray-500">Refueled</div>
            </div>
            <div>
              <div class="text-lg font-bold text-orange-600">${stats.consumption.totalLiters}L</div>
              <div class="text-xs text-gray-500">Consumed</div>
            </div>
            <div>
              <div class="text-lg font-bold text-green-600">₱${stats.refueling.totalCost}</div>
              <div class="text-xs text-gray-500">Spent</div>
            </div>
          </div>
        </div>

        <!-- Recent Logs -->
        <div>
          <h4 class="font-semibold text-gray-700 mb-3">Recent Activity</h4>
          <div class="space-y-2 max-h-60 overflow-y-auto">
            ${logsHtml || '<p class="text-gray-500 text-center py-4">No fuel logs yet</p>'}
          </div>
        </div>

        <button onclick="showFuelManagement()" class="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          Back to Fuel Management
        </button>
      </div>
    `);

  } catch (error) {
    showModal('Fuel History', `<p class="text-red-500">Error loading fuel history: ${error.message}</p>`);
  }
}

// ============================================
// DRIVER WEB OVERLAY FUNCTIONS
// ============================================

// Load driver assignments into overlay panel
async function loadDriverAssignmentsOverlay() {
  const container = document.getElementById('overlayAssignments');
  if (!container) return;

  try {
    container.innerHTML = `
      <div class="text-center py-3 text-gray-400">
        <i data-lucide="loader" class="w-5 h-5 mx-auto animate-spin"></i>
      </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();

    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };

    const [routesRes, trucksRes] = await Promise.all([
      fetch(`${API_URL}/routes`, { headers }),
      fetch(`${API_URL}/trucks`, { headers })
    ]);

    if (!routesRes.ok || !trucksRes.ok) {
      throw new Error('Failed to load data');
    }

    const routes = await routesRes.json();
    const trucks = await trucksRes.json();

    // Filter routes assigned to this driver (not completed)
    const myRoutes = routes.filter(r => r.assignedDriver === user.username && r.status !== 'completed');
    const myTrucks = trucks.filter(t => t.assignedDriver === user.username);

    if (myRoutes.length === 0 && myTrucks.length === 0) {
      container.innerHTML = `
        <div class="text-center py-4 text-gray-400">
          <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
          <p class="text-xs">No assignments</p>
        </div>
      `;
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    let html = '';

    // Show assigned trucks
    if (myTrucks.length > 0) {
      myTrucks.forEach(truck => {
        const fuelColor = truck.fuelLevel > 50 ? 'text-green-600' : truck.fuelLevel > 20 ? 'text-yellow-600' : 'text-red-600';
        html += `
          <div class="bg-white/80 rounded-lg p-2 border border-gray-200">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <i data-lucide="truck" class="w-4 h-4 text-green-600"></i>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-medium text-gray-800 text-sm truncate">${truck.truckId}</p>
                <p class="text-xs text-gray-500">${truck.plateNumber}</p>
              </div>
              <div class="text-right">
                <p class="text-sm font-bold ${fuelColor}">${truck.fuelLevel || 0}%</p>
              </div>
            </div>
          </div>
        `;
      });
    }

    // Show assigned routes
    if (myRoutes.length > 0) {
      myRoutes.forEach(route => {
        const activeRouteId = localStorage.getItem('activeRouteId');
        const isCurrentlyActive = activeRouteId === (route._id || route.routeId);
        const stopsCount = route.path?.coordinates?.length || 0;

        html += `
          <div class="${isCurrentlyActive ? 'bg-orange-100 border-orange-300 ring-1 ring-orange-400' : 'bg-white/80 border-gray-200'} rounded-lg p-2 border transition-all">
            <div class="flex items-start justify-between gap-2 mb-1">
              <div class="flex-1 min-w-0">
                <p class="font-medium text-gray-800 text-sm truncate">${route.name || 'Unnamed Route'}</p>
                <p class="text-xs text-gray-500">${stopsCount} stops • ${route.distance ? (route.distance / 1000).toFixed(1) + ' km' : '-'}</p>
              </div>
              ${isCurrentlyActive ? `
                <span class="flex items-center gap-1 px-1.5 py-0.5 bg-orange-500 text-white text-xs font-medium rounded-full">
                  <span class="w-1 h-1 bg-white rounded-full animate-pulse"></span>
                  Active
                </span>
              ` : ''}
            </div>
            <div class="flex gap-1 mt-2">
              ${isCurrentlyActive ? `
                <button onclick="showActiveRouteNavigation()" class="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium rounded-lg transition-colors">
                  <i data-lucide="navigation" class="w-3 h-3"></i>
                  Navigate
                </button>
                <button onclick="markRouteComplete('${route._id || route.routeId}')" class="flex items-center justify-center px-2 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors">
                  <i data-lucide="check" class="w-3 h-3"></i>
                </button>
              ` : `
                <button onclick="viewDriverRoute('${route._id || route.routeId}')" class="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors">
                  <i data-lucide="eye" class="w-3 h-3"></i>
                  View
                </button>
                <button onclick="startCollection('${route._id || route.routeId}')" class="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors">
                  <i data-lucide="play" class="w-3 h-3"></i>
                  Start
                </button>
              `}
            </div>
          </div>
        `;
      });
    }

    container.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Also update the active route overlay panel
    updateOverlayActiveRoute(routes);

  } catch (error) {
    console.error('Error loading overlay assignments:', error);
    container.innerHTML = `
      <div class="text-center py-3 text-red-400">
        <p class="text-xs">Error loading</p>
      </div>
    `;
  }
}

// Update overlay active route panel
function updateOverlayActiveRoute(routes) {
  const panel = document.getElementById('overlayActiveRoute');
  if (!panel) return;

  const activeRouteId = localStorage.getItem('activeRouteId');

  if (activeRouteId && routes) {
    const activeRoute = routes.find(r => (r._id === activeRouteId || r.routeId === activeRouteId));

    if (activeRoute) {
      panel.classList.remove('hidden');

      const stopsTotal = activeRoute.path?.coordinates?.length || 0;
      const stopsCompleted = activeRoute.completedStops || 0;
      const progressPercent = stopsTotal > 0 ? Math.round((stopsCompleted / stopsTotal) * 100) : 0;

      const routeNameEl = panel.querySelector('#overlayRouteName');
      const progressEl = panel.querySelector('#overlayRouteProgress');
      const progressBarEl = panel.querySelector('#overlayProgressBar');

      if (routeNameEl) routeNameEl.textContent = activeRoute.name || 'Unnamed Route';
      if (progressEl) progressEl.textContent = `${stopsCompleted}/${stopsTotal} stops`;
      if (progressBarEl) progressBarEl.style.width = `${progressPercent}%`;

      return;
    }
  }

  panel.classList.add('hidden');
}

// Update driver overlay stats
async function updateDriverOverlayStats() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/routes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const routes = await response.json();

    const today = new Date().toDateString();
    const todayCompleted = routes.filter(r =>
      r.status === 'completed' &&
      r.completedBy === user.username &&
      r.completedAt && new Date(r.completedAt).toDateString() === today
    );

    const todayDistance = todayCompleted.reduce((sum, r) => sum + (r.distance || 0), 0);

    // Update overlay stats
    const routesEl = document.getElementById('overlayTodayRoutes');
    const distanceEl = document.getElementById('overlayTodayDistance');

    if (routesEl) routesEl.textContent = todayCompleted.length;
    if (distanceEl) distanceEl.textContent = (todayDistance / 1000).toFixed(1) + ' km';

  } catch (error) {
    console.error('Error updating overlay stats:', error);
  }
}

// Toggle assignments overlay visibility
window.toggleAssignmentsOverlay = function() {
  const overlay = document.getElementById('driverAssignmentsOverlay');
  if (overlay) {
    overlay.classList.toggle('hidden');
    overlay.classList.toggle('lg:block');
  }
};

// Sync overlay GPS button with tracking state
function syncOverlayGPSState() {
  const iconWrapper = document.getElementById('overlayGpsIconWrapper');
  const statusText = document.getElementById('overlayGpsText');
  const statusDetail = document.getElementById('overlayGpsDetail');
  const gpsButton = document.getElementById('overlayGpsBtn');

  if (trackingEnabled) {
    if (iconWrapper) {
      iconWrapper.className = 'w-10 h-10 bg-green-100 rounded-full flex items-center justify-center';
      iconWrapper.innerHTML = '<i data-lucide="navigation" class="w-5 h-5 text-green-600"></i>';
    }
    if (statusText) {
      statusText.textContent = 'GPS Active';
      statusText.className = 'font-semibold text-green-600 text-sm';
    }
    if (statusDetail) {
      statusDetail.textContent = 'Tracking your location';
      statusDetail.className = 'text-xs text-green-500';
    }
    if (gpsButton) {
      gpsButton.innerHTML = '<i data-lucide="pause" class="w-4 h-4"></i><span>Stop</span>';
      gpsButton.className = 'px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2';
    }
  } else {
    if (iconWrapper) {
      iconWrapper.className = 'w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center';
      iconWrapper.innerHTML = '<i data-lucide="map-pin" class="w-5 h-5 text-gray-500"></i>';
    }
    if (statusText) {
      statusText.textContent = 'GPS Inactive';
      statusText.className = 'font-semibold text-gray-800 text-sm';
    }
    if (statusDetail) {
      statusDetail.textContent = 'Click Start to begin tracking';
      statusDetail.className = 'text-xs text-gray-500';
    }
    if (gpsButton) {
      gpsButton.innerHTML = '<i data-lucide="navigation" class="w-4 h-4"></i><span>Start</span>';
      gpsButton.className = 'px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2';
    }
  }

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Toggle overlay GPS tracking
window.toggleOverlayGPS = function() {
  console.log('🔄 toggleOverlayGPS called');
  toggleGPSTracking();
  syncOverlayGPSState();
};

// Update mobile GPS status pill
function updateMobileGpsStatus() {
  const dot = document.getElementById('mobileGpsDot');
  const label = document.getElementById('mobileGpsLabel');
  const pill = document.getElementById('mobileGpsStatusPill');

  if (!dot || !label) return;

  if (trackingEnabled) {
    dot.className = 'w-2 h-2 bg-green-500 rounded-full animate-pulse';
    label.textContent = 'GPS On';
    label.className = 'text-xs font-medium text-green-600';
    if (pill) {
      pill.classList.remove('border-gray-200');
      pill.classList.add('border-green-300', 'bg-green-50/95');
    }
  } else {
    dot.className = 'w-2 h-2 bg-gray-400 rounded-full';
    label.textContent = 'GPS Off';
    label.className = 'text-xs font-medium text-gray-600';
    if (pill) {
      pill.classList.remove('border-green-300', 'bg-green-50/95');
      pill.classList.add('border-gray-200');
    }
  }
}

// Update mobile active route pill
function updateMobileRoutePill() {
  const pill = document.getElementById('mobileRoutePill');
  const label = document.getElementById('mobileRouteLabel');

  if (!pill) return;

  const activeRouteId = localStorage.getItem('activeRouteId');

  if (activeRouteId) {
    pill.classList.remove('hidden');
    if (label && nextDestination) {
      label.textContent = nextDestination.routeName || 'Route Active';
    }
  } else {
    pill.classList.add('hidden');
  }
}

// Update mobile stats pill
async function updateMobileStats() {
  const statsEl = document.getElementById('mobileStatsRoutes');
  if (!statsEl) return;

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/routes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const routes = await response.json();

    const today = new Date().toDateString();
    const todayCompleted = routes.filter(r =>
      r.status === 'completed' &&
      r.completedBy === user.username &&
      r.completedAt && new Date(r.completedAt).toDateString() === today
    );

    statsEl.textContent = todayCompleted.length;
  } catch (error) {
    console.error('Error updating mobile stats:', error);
  }
}

// Sync all mobile overlay elements
function syncMobileOverlay() {
  updateMobileGpsStatus();
  updateMobileRoutePill();
  updateMobileStats();
}

// Overlay quick action handlers
window.overlayShowInspection = function() {
  showVehicleInspection();
};

window.overlayShowStats = function() {
  showDriverStats();
};

window.overlayShowReport = function() {
  showReportIssue();
};

window.overlayShowHistory = function() {
  showCollectionHistory();
};

// ===== COMPLAINTS MANAGEMENT =====
// Mati City Barangays
const BARANGAYS = [
  'Badas', 'Bobon', 'Buso', 'Cabuaya', 'Central', 'Dahican', 'Dawan',
  'Don Enrique Lopez', 'Don Martin Marundan', 'Don Salvador Lopez Sr.',
  'Langka', 'Libudon', 'Luban', 'Macambol', 'Mamali', 'Matiao', 'Mayo',
  'Sainz', 'San Agustin', 'San Antonio', 'Sanghay', 'Tagabakid',
  'Tagbinonga', 'Taguibo', 'Tamisan', 'Tarragona'
];

// Check for new complaints and update badge
async function checkNewComplaints() {
  if (user.role !== 'admin') return;

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/complaints/new-count`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const { count } = await response.json();
      updateComplaintsBadge(count);
    }
  } catch (error) {
    console.error('Error checking new complaints:', error);
  }
}

function updateComplaintsBadge(count) {
  const badge = document.getElementById('complaintsBadge');
  if (badge) {
    if (count > 0) {
      badge.textContent = count > 99 ? '99+' : count;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }
}

// Cached data for complaints sorting
let cachedComplaintsData = [];
let cachedComplaintsStats = {};
let cachedComplaintsDrivers = [];

// Complaints table column configuration
const complaintsColumns = [
  { key: 'referenceNumber', label: 'Reference', sortable: true },
  { key: 'reportType', label: 'Type', sortable: true },
  { key: 'name', label: 'Reporter', sortable: true },
  { key: 'description', label: 'Description', sortable: false },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'createdAt', label: 'Submitted', sortable: true },
  { key: 'actions', label: 'Actions', sortable: false }
];

const complaintsStatusColors = {
  'pending': 'bg-yellow-100 text-yellow-700',
  'in-progress': 'bg-blue-100 text-blue-700',
  'resolved': 'bg-green-100 text-green-700',
  'closed': 'bg-gray-100 text-gray-700'
};

const reportTypeLabels = {
  'missed_collection': { label: 'Missed Collection', color: 'bg-orange-100 text-orange-700' },
  'illegal_dumping': { label: 'Illegal Dumping', color: 'bg-red-100 text-red-700' },
  'overflowing_bin': { label: 'Overflowing Bin', color: 'bg-purple-100 text-purple-700' },
  'damaged_bin': { label: 'Damaged Bin', color: 'bg-amber-100 text-amber-700' },
  'odor_complaint': { label: 'Odor Complaint', color: 'bg-teal-100 text-teal-700' },
  'other': { label: 'Other', color: 'bg-gray-100 text-gray-700' }
};

// Render complaints table with current sort state
function renderComplaintsTable() {
  // Define searchable fields
  const searchFields = ['referenceNumber', 'name', 'barangay', 'description', 'status', 'reportType'];

  // Apply search filter first
  const filteredComplaints = filterData(cachedComplaintsData, searchState.complaints, searchFields);

  // Apply sorting
  const { column, direction } = sortState.complaints;
  const sortedComplaints = sortData(filteredComplaints, column, direction);
  const stats = cachedComplaintsStats;

  // Update search results count display
  const countDisplay = document.querySelector('#complaintsCountDisplay');
  if (countDisplay) {
    countDisplay.textContent = `${sortedComplaints.length} of ${cachedComplaintsData.length} reports${searchState.complaints ? ' (filtered)' : ''}`;
  }

  const complaintRows = sortedComplaints.map(c => {
    const createdDate = new Date(c.createdAt).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
    const reportType = c.reportType || 'missed_collection';
    const typeInfo = reportTypeLabels[reportType] || reportTypeLabels['other'];

    return `
      <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors ${c.isNew ? 'bg-yellow-50' : ''}">
        <td class="px-4 py-4">
          <div class="flex items-center gap-2">
            ${c.isNew ? '<span class="w-2 h-2 bg-yellow-500 rounded-full"></span>' : ''}
            <span class="font-mono text-sm text-gray-800">${c.referenceNumber}</span>
          </div>
        </td>
        <td class="px-4 py-4">
          <span class="px-2 py-1 rounded-full text-xs font-medium ${typeInfo.color}">
            ${typeInfo.label}
          </span>
        </td>
        <td class="px-4 py-4">
          <div>
            <div class="font-medium text-gray-800">${c.name}</div>
            <div class="text-sm text-gray-500">${c.barangay}</div>
          </div>
        </td>
        <td class="px-4 py-4">
          <div class="text-sm text-gray-600 max-w-xs truncate" title="${c.description}">${c.description}</div>
        </td>
        <td class="px-4 py-4">
          <span class="px-3 py-1 rounded-full text-xs font-medium ${complaintsStatusColors[c.status] || 'bg-gray-100 text-gray-700'}">
            ${c.status}
          </span>
        </td>
        <td class="px-4 py-4 text-sm text-gray-500">${createdDate}</td>
        <td class="px-4 py-4">
          <div class="flex items-center gap-1">
            <button onclick="viewComplaint('${c._id || c.referenceNumber}')" class="p-2 hover:bg-blue-100 rounded-lg transition-colors" title="View Details">
              <i data-lucide="eye" class="w-4 h-4 text-blue-600"></i>
            </button>
            <button onclick="showUpdateComplaintForm('${c._id || c.referenceNumber}')" class="p-2 hover:bg-green-100 rounded-lg transition-colors" title="Update">
              <i data-lucide="pencil" class="w-4 h-4 text-green-600"></i>
            </button>
            <button onclick="deleteComplaint('${c._id || c.referenceNumber}')" class="p-2 hover:bg-red-100 rounded-lg transition-colors" title="Delete">
              <i data-lucide="trash-2" class="w-4 h-4 text-red-500"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Update table body
  const tbody = document.querySelector('#pageContent table tbody');
  if (tbody) {
    tbody.innerHTML = complaintRows || '<tr><td colspan="7" class="px-4 py-8 text-center text-gray-500">No reports found</td></tr>';
    lucide.createIcons();
  }

  // Update table header
  const thead = document.querySelector('#pageContent table thead tr');
  if (thead) {
    thead.innerHTML = createSortableHeader('complaints', complaintsColumns);
    lucide.createIcons();
  }
}

// Main complaints management view
async function showComplaints() {
  if (user.role !== 'admin') {
    showToast('Admin access required', 'error');
    return;
  }

  showPageLoading('Loading complaints...');

  try {
    const token = localStorage.getItem('token');
    const [complaintsRes, statsRes, usersRes] = await Promise.all([
      fetch(`${API_URL}/complaints`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`${API_URL}/complaints/stats`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`${API_URL}/users`, { headers: { 'Authorization': `Bearer ${token}` } })
    ]);

    cachedComplaintsData = await complaintsRes.json();
    cachedComplaintsStats = await statsRes.json();
    const users = await usersRes.json();
    cachedComplaintsDrivers = users.filter(u => u.role === 'driver');

    // Register sort handler
    sortHandlers.complaints = renderComplaintsTable;

    const stats = cachedComplaintsStats;
    const { column, direction } = sortState.complaints;
    const sortedComplaints = sortData(cachedComplaintsData, column, direction);

    const statusColors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      'resolved': 'bg-green-100 text-green-800',
      'closed': 'bg-gray-100 text-gray-800'
    };

    const complaintRows = sortedComplaints.map(c => {
      const createdDate = new Date(c.createdAt).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      });
      const missedDate = c.missedCollectionDate ? new Date(c.missedCollectionDate).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric'
      }) : '-';
      const reportType = c.reportType || 'missed_collection';
      const typeInfo = reportTypeLabels[reportType] || reportTypeLabels['other'];

      return `
        <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors ${c.isNew ? 'bg-yellow-50' : ''}">
          <td class="px-4 py-4">
            <div class="flex items-center gap-2">
              ${c.isNew ? '<span class="w-2 h-2 bg-yellow-500 rounded-full"></span>' : ''}
              <span class="font-mono text-sm text-gray-800">${c.referenceNumber}</span>
            </div>
          </td>
          <td class="px-4 py-4">
            <span class="px-2 py-1 rounded-full text-xs font-medium ${typeInfo.color}">
              ${typeInfo.label}
            </span>
          </td>
          <td class="px-4 py-4">
            <div>
              <div class="font-medium text-gray-800">${c.name}</div>
              <div class="text-sm text-gray-500">${c.barangay}</div>
            </div>
          </td>
          <td class="px-4 py-4">
            <div class="text-sm text-gray-600 max-w-xs truncate" title="${c.description}">${c.description}</div>
          </td>
          <td class="px-4 py-4">
            <span class="px-3 py-1 rounded-full text-xs font-medium ${statusColors[c.status] || 'bg-gray-100 text-gray-700'}">
              ${c.status}
            </span>
          </td>
          <td class="px-4 py-4 text-sm text-gray-500">${createdDate}</td>
          <td class="px-4 py-4">
            <div class="flex items-center gap-1">
              <button onclick="viewComplaint('${c._id || c.referenceNumber}')" class="p-2 hover:bg-blue-100 rounded-lg transition-colors" title="View Details">
                <i data-lucide="eye" class="w-4 h-4 text-blue-600"></i>
              </button>
              <button onclick="showUpdateComplaintForm('${c._id || c.referenceNumber}')" class="p-2 hover:bg-green-100 rounded-lg transition-colors" title="Update">
                <i data-lucide="pencil" class="w-4 h-4 text-green-600"></i>
              </button>
              <button onclick="deleteComplaint('${c._id || c.referenceNumber}')" class="p-2 hover:bg-red-100 rounded-lg transition-colors" title="Delete">
                <i data-lucide="trash-2" class="w-4 h-4 text-red-500"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Barangay dropdown options
    const barangayOptions = BARANGAYS.map(b =>
      `<option value="${b}">${b}</option>`
    ).join('');

    hidePageLoading();
    showPage('Public Complaints', `
      <!-- Stats Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <i data-lucide="message-square" class="w-6 h-6 text-blue-600"></i>
            </div>
            <div>
              <p class="text-sm text-gray-500">Total</p>
              <p class="text-2xl font-bold text-gray-800">${stats.total}</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <i data-lucide="clock" class="w-6 h-6 text-yellow-600"></i>
            </div>
            <div>
              <p class="text-sm text-gray-500">Pending</p>
              <p class="text-2xl font-bold text-yellow-600">${stats.pending}</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <i data-lucide="loader" class="w-6 h-6 text-blue-600"></i>
            </div>
            <div>
              <p class="text-sm text-gray-500">In Progress</p>
              <p class="text-2xl font-bold text-blue-600">${stats.inProgress}</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <i data-lucide="check-circle" class="w-6 h-6 text-green-600"></i>
            </div>
            <div>
              <p class="text-sm text-gray-500">Resolved</p>
              <p class="text-2xl font-bold text-green-600">${stats.resolved}</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 ${stats.newCount > 0 ? 'bg-red-100' : 'bg-gray-100'} rounded-xl flex items-center justify-center">
              <i data-lucide="bell" class="w-6 h-6 ${stats.newCount > 0 ? 'text-red-600' : 'text-gray-600'}"></i>
            </div>
            <div>
              <p class="text-sm text-gray-500">New</p>
              <p class="text-2xl font-bold ${stats.newCount > 0 ? 'text-red-600' : 'text-gray-800'}">${stats.newCount}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div class="flex flex-wrap items-center gap-4">
          <div>
            <label class="block text-xs text-gray-500 mb-1">Search</label>
            ${createSearchInput('complaints', 'Search reports...')}
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Report Type</label>
            <select id="filterReportType" onchange="filterComplaints()" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
              <option value="">All Types</option>
              <option value="missed_collection">Missed Collection</option>
              <option value="illegal_dumping">Illegal Dumping</option>
              <option value="overflowing_bin">Overflowing Bin</option>
              <option value="damaged_bin">Damaged Bin</option>
              <option value="odor_complaint">Odor Complaint</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Status</label>
            <select id="filterStatus" onchange="filterComplaints()" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Barangay</label>
            <select id="filterBarangay" onchange="filterComplaints()" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
              <option value="">All Barangays</option>
              ${barangayOptions}
            </select>
          </div>
          <div class="ml-auto flex flex-col sm:flex-row items-end gap-2">
            <span id="complaintsCountDisplay" class="text-sm text-gray-500">${sortedComplaints.length} of ${cachedComplaintsData.length} reports</span>
            ${stats.newCount > 0 ? `
              <button onclick="markAllComplaintsRead()" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
                <i data-lucide="check-check" class="w-4 h-4"></i>
                Mark All Read
              </button>
            ` : ''}
            <a href="/complaint" target="_blank" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
              <i data-lucide="external-link" class="w-4 h-4"></i>
              Public Form
            </a>
          </div>
        </div>
      </div>

      <!-- Reports Table -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-100">
              <tr>
                ${createSortableHeader('complaints', complaintsColumns)}
              </tr>
            </thead>
            <tbody>
              ${complaintRows || '<tr><td colspan="7" class="px-4 py-8 text-center text-gray-500">No reports found</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `);

    // Store data for filtering (also update cached data)
    window.complaintsData = cachedComplaintsData;
    window.driversData = cachedComplaintsDrivers;

  } catch (error) {
    console.error('Error loading complaints:', error);
    hidePageLoading();
    showPage('Public Complaints', `
      <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <i data-lucide="alert-circle" class="w-12 h-12 text-red-500 mx-auto mb-3"></i>
        <p class="text-red-700">Error loading complaints: ${error.message}</p>
        <button onclick="showComplaints()" class="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
          Try Again
        </button>
      </div>
    `);
  }
}

// Filter complaints table
window.filterComplaints = async function() {
  const reportType = document.getElementById('filterReportType').value;
  const status = document.getElementById('filterStatus').value;
  const barangay = document.getElementById('filterBarangay').value;

  try {
    const token = localStorage.getItem('token');
    let url = `${API_URL}/complaints?`;
    if (reportType) url += `reportType=${reportType}&`;
    if (status) url += `status=${status}&`;
    if (barangay) url += `barangay=${encodeURIComponent(barangay)}`;

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      window.complaintsData = await response.json();
      showComplaints();
    }
  } catch (error) {
    console.error('Error filtering complaints:', error);
  }
};

// View single complaint details
window.viewComplaint = async function(id) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/complaints/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to load complaint');

    const complaint = await response.json();

    // Mark as read if new
    if (complaint.isNew) {
      fetch(`${API_URL}/complaints/${id}/mark-read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(() => checkNewComplaints());
    }

    const createdDate = new Date(complaint.createdAt).toLocaleString();
    const missedDate = complaint.missedCollectionDate ? new Date(complaint.missedCollectionDate).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    }) : null;

    const statusColors = {
      'pending': 'bg-yellow-100 text-yellow-700',
      'in-progress': 'bg-blue-100 text-blue-700',
      'resolved': 'bg-green-100 text-green-700',
      'closed': 'bg-gray-100 text-gray-700'
    };

    const reportTypeLabels = {
      'missed_collection': { label: 'Missed Collection', color: 'bg-orange-100 text-orange-700' },
      'illegal_dumping': { label: 'Illegal Dumping', color: 'bg-red-100 text-red-700' },
      'overflowing_bin': { label: 'Overflowing Bin', color: 'bg-purple-100 text-purple-700' },
      'damaged_bin': { label: 'Damaged Bin', color: 'bg-amber-100 text-amber-700' },
      'odor_complaint': { label: 'Odor Complaint', color: 'bg-teal-100 text-teal-700' },
      'other': { label: 'Other', color: 'bg-gray-100 text-gray-700' }
    };

    const reportType = complaint.reportType || 'missed_collection';
    const typeInfo = reportTypeLabels[reportType] || reportTypeLabels['other'];

    const photosHtml = complaint.photos && complaint.photos.length > 0
      ? complaint.photos.map((photo, index) =>
          `<img src="${photo}" class="w-24 h-24 object-cover rounded-lg cursor-pointer border-2 border-gray-200 hover:border-blue-500 transition-colors" onclick="openComplaintPhoto('${index}', '${complaint.referenceNumber}')" title="Click to view">`
        ).join('')
      : '<p class="text-gray-500 text-sm">No photos attached</p>';

    // Check if location is available
    const hasLocation = complaint.location && complaint.location.coordinates && complaint.location.coordinates.length === 2;
    const locationMapId = 'complaintLocationMap_' + Date.now();

    showModal(`Report: ${complaint.referenceNumber}`, `
      <div class="space-y-4">
        <!-- Status and Type Badges -->
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-2">
            <span class="px-3 py-1 rounded-full text-sm font-medium ${typeInfo.color}">
              ${typeInfo.label}
            </span>
            <span class="px-3 py-1 rounded-full text-sm font-medium ${statusColors[complaint.status]}">
              ${complaint.status.toUpperCase()}
            </span>
          </div>
          <span class="text-sm text-gray-500">Submitted: ${createdDate}</span>
        </div>

        <!-- Reporter Info -->
        <div class="bg-gray-50 rounded-lg p-4">
          <h4 class="font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <i data-lucide="user" class="w-4 h-4"></i> Reporter
          </h4>
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div><span class="text-gray-500">Name:</span> <span class="font-medium">${complaint.name}</span></div>
            <div><span class="text-gray-500">Phone:</span> <span class="font-medium">${complaint.phone}</span></div>
            <div><span class="text-gray-500">Email:</span> <span class="font-medium">${complaint.email}</span></div>
            <div><span class="text-gray-500">Barangay:</span> <span class="font-medium">${complaint.barangay}</span></div>
          </div>
          <div class="mt-2 text-sm">
            <span class="text-gray-500">Address:</span> <span class="font-medium">${complaint.address}</span>
          </div>
        </div>

        <!-- Pinned Location Map -->
        ${hasLocation ? `
        <div class="bg-blue-50 rounded-lg p-4">
          <h4 class="font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <i data-lucide="map-pin" class="w-4 h-4 text-blue-600"></i> Pinned Location
          </h4>
          <div id="${locationMapId}" style="height: 200px; border-radius: 8px;"></div>
          <p class="text-xs text-gray-500 mt-2">Coordinates: ${complaint.location.coordinates[1].toFixed(6)}, ${complaint.location.coordinates[0].toFixed(6)}</p>
        </div>
        ` : ''}

        <!-- Report Details -->
        <div class="bg-yellow-50 rounded-lg p-4">
          <h4 class="font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <i data-lucide="alert-triangle" class="w-4 h-4 text-yellow-600"></i> Report Details
          </h4>
          ${missedDate ? `
          <div class="text-sm mb-2">
            <span class="text-gray-500">Missed Collection Date:</span>
            <span class="font-medium text-yellow-700">${missedDate}</span>
          </div>
          ` : ''}
          <p class="text-gray-700">${complaint.description}</p>
        </div>

        <!-- Photos -->
        <div>
          <h4 class="font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <i data-lucide="camera" class="w-4 h-4"></i> Photos (${complaint.photos?.length || 0})
          </h4>
          <div class="flex flex-wrap gap-2">
            ${photosHtml}
          </div>
        </div>

        ${complaint.assignedDriver ? `
          <div class="bg-blue-50 rounded-lg p-4">
            <h4 class="font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <i data-lucide="user-check" class="w-4 h-4 text-blue-600"></i> Assigned Personnel
            </h4>
            <p class="text-blue-700 font-medium">${complaint.assignedDriver}</p>
            ${complaint.assignedVehicle ? `<p class="text-sm text-blue-600">Vehicle: ${complaint.assignedVehicle}</p>` : ''}
          </div>
        ` : ''}

        ${complaint.adminResponse ? `
          <div class="bg-green-50 rounded-lg p-4">
            <h4 class="font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <i data-lucide="message-circle" class="w-4 h-4 text-green-600"></i> Admin Response
            </h4>
            <p class="text-green-700">${complaint.adminResponse}</p>
          </div>
        ` : ''}

        ${complaint.adminNotes ? `
          <div class="bg-gray-100 rounded-lg p-4">
            <h4 class="font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <i data-lucide="file-text" class="w-4 h-4"></i> Internal Notes
            </h4>
            <p class="text-gray-600 text-sm">${complaint.adminNotes}</p>
          </div>
        ` : ''}

        ${complaint.resolvedAt ? `
          <div class="text-center text-sm text-gray-500">
            Resolved on ${new Date(complaint.resolvedAt).toLocaleString()} by ${complaint.resolvedBy || 'Admin'}
          </div>
        ` : ''}

        <!-- Actions -->
        <div class="flex gap-3 pt-4 border-t">
          <button onclick="closeModal(); showUpdateComplaintForm('${complaint._id || complaint.referenceNumber}')" class="flex-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2">
            <i data-lucide="pencil" class="w-4 h-4"></i>
            Update
          </button>
          <button onclick="closeModal()" class="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors">
            Close
          </button>
        </div>
      </div>
    `);

    // Store photos for viewer
    window.complaintPhotos = complaint.photos || [];

    // Initialize location map if available
    if (hasLocation) {
      setTimeout(() => {
        const mapContainer = document.getElementById(locationMapId);
        if (mapContainer) {
          const lat = complaint.location.coordinates[1];
          const lng = complaint.location.coordinates[0];
          const locationMap = L.map(locationMapId).setView([lat, lng], 16);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap'
          }).addTo(locationMap);
          L.marker([lat, lng], {
            icon: L.divIcon({
              html: '<div style="background-color: #ef4444; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
              className: '',
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            })
          }).addTo(locationMap);
        }
      }, 100);
    }

  } catch (error) {
    console.error('Error viewing complaint:', error);
    showToast('Error loading complaint details', 'error');
  }
};

// Open photo in new window
window.openComplaintPhoto = function(index, refNum) {
  const photos = window.complaintPhotos || [];
  if (photos[index]) {
    const photoWindow = window.open('', '_blank');
    photoWindow.document.write(`
      <html>
        <head><title>Complaint Photo - ${refNum}</title></head>
        <body style="margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #000;">
          <img src="${photos[index]}" style="max-width: 100%; max-height: 100vh; object-fit: contain;">
        </body>
      </html>
    `);
  }
};

// Show update complaint form
window.showUpdateComplaintForm = async function(id) {
  try {
    const token = localStorage.getItem('token');
    const [complaintRes, usersRes, trucksRes] = await Promise.all([
      fetch(`${API_URL}/complaints/${id}`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`${API_URL}/users`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`${API_URL}/trucks`, { headers: { 'Authorization': `Bearer ${token}` } })
    ]);

    const complaint = await complaintRes.json();
    const users = await usersRes.json();
    const trucks = await trucksRes.json();
    const drivers = users.filter(u => u.role === 'driver');

    const driverOptions = drivers.map(d =>
      `<option value="${d.username}" ${complaint.assignedDriver === d.username ? 'selected' : ''}>${d.fullName || d.username}</option>`
    ).join('');

    const truckOptions = trucks.map(t =>
      `<option value="${t.truckId}" ${complaint.assignedVehicle === t.truckId ? 'selected' : ''}>${t.truckId} - ${t.plateNumber}</option>`
    ).join('');

    showModal(`Update: ${complaint.referenceNumber}`, `
      <form id="updateComplaintForm" class="space-y-4">
        <input type="hidden" id="updateComplaintId" value="${complaint._id || complaint.referenceNumber}">

        <div class="bg-gray-50 rounded-lg p-3 text-sm">
          <strong>${complaint.name}</strong> - ${complaint.barangay}
          <p class="text-gray-600 mt-1">${complaint.description.substring(0, 100)}${complaint.description.length > 100 ? '...' : ''}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Status *</label>
          <select id="updateStatus" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
            <option value="pending" ${complaint.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="in-progress" ${complaint.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
            <option value="resolved" ${complaint.status === 'resolved' ? 'selected' : ''}>Resolved</option>
            <option value="closed" ${complaint.status === 'closed' ? 'selected' : ''}>Closed</option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Assign Driver</label>
            <select id="updateDriver" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
              <option value="">Not Assigned</option>
              ${driverOptions}
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Assign Vehicle</label>
            <select id="updateVehicle" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
              <option value="">Not Assigned</option>
              ${truckOptions}
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Response to Citizen</label>
          <textarea id="updateResponse" rows="3" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="This response will be visible to the citizen when they track their complaint...">${complaint.adminResponse || ''}</textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Internal Notes</label>
          <textarea id="updateNotes" rows="2" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="Internal notes (not visible to citizen)...">${complaint.adminNotes || ''}</textarea>
        </div>

        <div class="flex gap-3 pt-4">
          <button type="submit" class="flex-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors">
            Update Complaint
          </button>
          <button type="button" onclick="closeModal()" class="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors">
            Cancel
          </button>
        </div>
      </form>
    `);

    document.getElementById('updateComplaintForm').addEventListener('submit', submitComplaintUpdate);

  } catch (error) {
    console.error('Error loading complaint for update:', error);
    showToast('Error loading complaint', 'error');
  }
};

async function submitComplaintUpdate(e) {
  e.preventDefault();

  const id = document.getElementById('updateComplaintId').value;
  const data = {
    status: document.getElementById('updateStatus').value,
    assignedDriver: document.getElementById('updateDriver').value || null,
    assignedVehicle: document.getElementById('updateVehicle').value || null,
    adminResponse: document.getElementById('updateResponse').value || null,
    adminNotes: document.getElementById('updateNotes').value || null
  };

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/complaints/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      closeModal();
      showToast('Complaint updated successfully', 'success');
      showComplaints();
    } else {
      const result = await response.json();
      showToast(result.error || 'Failed to update complaint', 'error');
    }
  } catch (error) {
    console.error('Error updating complaint:', error);
    showToast('Error updating complaint', 'error');
  }
}

// Delete complaint
window.deleteComplaint = async function(id) {
  if (!await showConfirm('Delete Complaint', 'Are you sure you want to delete this complaint? This action cannot be undone.')) {
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/complaints/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      showToast('Complaint deleted', 'success');
      showComplaints();
    } else {
      showToast('Failed to delete complaint', 'error');
    }
  } catch (error) {
    console.error('Error deleting complaint:', error);
    showToast('Error deleting complaint', 'error');
  }
};

// Mark all complaints as read
window.markAllComplaintsRead = async function() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/complaints/mark-all-read`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      showToast('All complaints marked as read', 'success');
      checkNewComplaints();
      showComplaints();
    }
  } catch (error) {
    console.error('Error marking complaints as read:', error);
  }
};

// Make showComplaints globally accessible
window.showComplaints = showComplaints;

// ============================================
// COLLECTION SCHEDULES MODULE
// ============================================

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Cached data for schedules sorting
let cachedSchedulesData = [];
let cachedSchedulesStats = {};
let cachedScheduleRoutes = [];
let cachedScheduleDrivers = [];
let cachedScheduleTrucks = [];

// Calendar state
let currentCalendarDate = new Date();
let currentScheduleView = 'table';

// Toggle between table and calendar views
function setScheduleView(view) {
  currentScheduleView = view;
  const tableView = document.getElementById('schedulesTableView');
  const calendarView = document.getElementById('schedulesCalendarView');
  const tableBtn = document.getElementById('tableViewBtn');
  const calendarBtn = document.getElementById('calendarViewBtn');

  if (view === 'table') {
    tableView.classList.remove('hidden');
    calendarView.classList.add('hidden');
    tableBtn.classList.remove('bg-gray-100', 'text-gray-700', 'hover:bg-gray-200');
    tableBtn.classList.add('bg-primary-500', 'text-white');
    calendarBtn.classList.remove('bg-primary-500', 'text-white');
    calendarBtn.classList.add('bg-gray-100', 'text-gray-700', 'hover:bg-gray-200');
  } else {
    tableView.classList.add('hidden');
    calendarView.classList.remove('hidden');
    calendarBtn.classList.remove('bg-gray-100', 'text-gray-700', 'hover:bg-gray-200');
    calendarBtn.classList.add('bg-primary-500', 'text-white');
    tableBtn.classList.remove('bg-primary-500', 'text-white');
    tableBtn.classList.add('bg-gray-100', 'text-gray-700', 'hover:bg-gray-200');
    renderScheduleCalendar();
  }
  lucide.createIcons();
}

// Navigate calendar by months
function navigateCalendarMonth(delta) {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta);
  renderScheduleCalendar();
}

// Get schedules for a specific date
function getSchedulesForDate(date, schedules) {
  const dayOfWeek = date.getDay();
  const dateOfMonth = date.getDate();

  return schedules.filter(schedule => {
    // Check if schedule has date range
    if (schedule.startDate) {
      const startDate = new Date(schedule.startDate);
      startDate.setHours(0, 0, 0, 0);
      if (date < startDate) return false;
    }
    if (schedule.endDate) {
      const endDate = new Date(schedule.endDate);
      endDate.setHours(23, 59, 59, 999);
      if (date > endDate) return false;
    }

    // Check recurrence type
    if (schedule.recurrenceType === 'daily') {
      return true;
    } else if (schedule.recurrenceType === 'weekly') {
      const weeklyDays = schedule.weeklyDays || [];
      return weeklyDays.includes(dayOfWeek);
    } else if (schedule.recurrenceType === 'monthly') {
      const monthlyDates = schedule.monthlyDates || [];
      return monthlyDates.includes(dateOfMonth);
    }
    return false;
  });
}

// Render the calendar grid
function renderScheduleCalendar() {
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();

  // Update month/year header
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const monthYearEl = document.getElementById('calendarMonthYear');
  if (monthYearEl) {
    monthYearEl.textContent = `${monthNames[month]} ${year}`;
  }

  // Get first day of month and total days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build calendar grid
  const calendarGrid = document.getElementById('calendarGrid');
  if (!calendarGrid) return;

  let gridHTML = '';

  // Empty cells for days before first day of month
  for (let i = 0; i < firstDay; i++) {
    gridHTML += '<div class="min-h-24 bg-gray-50 rounded-lg"></div>';
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);
    const isToday = date.getTime() === today.getTime();
    const schedulesForDay = getSchedulesForDate(date, cachedSchedulesData);

    // Build schedule indicators
    const maxIndicators = 3;
    let indicatorsHTML = '';
    const activeSchedules = schedulesForDay.filter(s => s.isActive);
    const inactiveSchedules = schedulesForDay.filter(s => !s.isActive);
    const allSchedules = [...activeSchedules, ...inactiveSchedules];

    allSchedules.slice(0, maxIndicators).forEach(schedule => {
      let colorClass = 'bg-gray-300';
      if (schedule.isActive) {
        if (schedule.recurrenceType === 'daily') colorClass = 'bg-blue-500';
        else if (schedule.recurrenceType === 'weekly') colorClass = 'bg-green-500';
        else if (schedule.recurrenceType === 'monthly') colorClass = 'bg-purple-500';
      }
      indicatorsHTML += `<span class="w-2 h-2 rounded-full ${colorClass}" title="${schedule.name}"></span>`;
    });

    if (allSchedules.length > maxIndicators) {
      indicatorsHTML += `<span class="text-xs text-gray-500">+${allSchedules.length - maxIndicators}</span>`;
    }

    const todayClass = isToday ? 'ring-2 ring-primary-500 ring-offset-2' : '';
    const hasSchedules = schedulesForDay.length > 0;
    const cursorClass = hasSchedules ? 'cursor-pointer hover:bg-gray-100' : '';

    gridHTML += `
      <div class="min-h-24 bg-white border border-gray-200 rounded-lg p-2 ${todayClass} ${cursorClass} transition-colors"
           ${hasSchedules ? `onclick="showDayScheduleDetails(${year}, ${month}, ${day})"` : ''}>
        <div class="flex justify-between items-start">
          <span class="text-sm font-medium ${isToday ? 'text-primary-600' : 'text-gray-700'}">${day}</span>
          ${isToday ? '<span class="text-xs bg-primary-100 text-primary-600 px-1 rounded">Today</span>' : ''}
        </div>
        <div class="flex flex-wrap gap-1 mt-2">
          ${indicatorsHTML}
        </div>
      </div>
    `;
  }

  calendarGrid.innerHTML = gridHTML;
}

// Show schedules for a specific day
function showDayScheduleDetails(year, month, day) {
  const date = new Date(year, month, day);
  const schedulesForDay = getSchedulesForDate(date, cachedSchedulesData);

  if (schedulesForDay.length === 0) return;

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const dateStr = `${dayNames[date.getDay()]}, ${monthNames[month]} ${day}, ${year}`;

  const schedulesList = schedulesForDay.map(s => {
    let patternText = '';
    if (s.recurrenceType === 'daily') patternText = 'Daily';
    else if (s.recurrenceType === 'weekly') {
      const days = (s.weeklyDays || []).map(d => DAYS_OF_WEEK[d].slice(0, 3)).join(', ');
      patternText = `Weekly: ${days}`;
    } else if (s.recurrenceType === 'monthly') {
      const dates = (s.monthlyDates || []).join(', ');
      patternText = `Monthly: ${dates}`;
    }

    const statusColor = s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600';
    const statusText = s.isActive ? 'Active' : 'Inactive';

    let recurrenceColor = 'border-gray-300';
    if (s.isActive) {
      if (s.recurrenceType === 'daily') recurrenceColor = 'border-blue-500';
      else if (s.recurrenceType === 'weekly') recurrenceColor = 'border-green-500';
      else if (s.recurrenceType === 'monthly') recurrenceColor = 'border-purple-500';
    }

    return `
      <div class="p-4 border-l-4 ${recurrenceColor} bg-gray-50 rounded-r-lg">
        <div class="flex justify-between items-start mb-2">
          <div>
            <h4 class="font-medium text-gray-800">${s.name}</h4>
            <p class="text-sm text-gray-500">${s.routeName || 'Unknown Route'}</p>
          </div>
          <span class="px-2 py-1 rounded-full text-xs font-medium ${statusColor}">${statusText}</span>
        </div>
        <div class="grid grid-cols-2 gap-2 text-sm text-gray-600">
          <div><span class="text-gray-400">Time:</span> ${s.scheduledTime || '07:00'}</div>
          <div><span class="text-gray-400">Pattern:</span> ${patternText}</div>
          <div><span class="text-gray-400">Driver:</span> ${s.assignedDriver || '-'}</div>
          <div><span class="text-gray-400">Vehicle:</span> ${s.assignedVehicle || '-'}</div>
        </div>
        <div class="flex gap-2 mt-3">
          <button onclick="closeDayModal(); editSchedule('${s.scheduleId || s._id}')"
                  class="text-xs px-3 py-1 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg transition-colors">
            Edit
          </button>
          <button onclick="closeDayModal(); toggleScheduleStatus('${s.scheduleId || s._id}')"
                  class="text-xs px-3 py-1 bg-yellow-100 text-yellow-600 hover:bg-yellow-200 rounded-lg transition-colors">
            ${s.isActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Create modal
  const modalHTML = `
    <div id="dayScheduleModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden">
        <div class="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 class="text-lg font-bold text-gray-800">Schedules</h3>
            <p class="text-sm text-gray-500">${dateStr}</p>
          </div>
          <button onclick="closeDayModal()" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <i data-lucide="x" class="w-5 h-5 text-gray-500"></i>
          </button>
        </div>
        <div class="p-4 space-y-3 overflow-y-auto max-h-[60vh]">
          ${schedulesList}
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);
  lucide.createIcons();
}

// Close day schedule modal
function closeDayModal() {
  const modal = document.getElementById('dayScheduleModal');
  if (modal) modal.remove();
}

// Schedules table column configuration
const schedulesColumns = [
  { key: 'name', label: 'Schedule', sortable: true },
  { key: 'routeName', label: 'Route', sortable: true },
  { key: 'recurrenceType', label: 'Pattern', sortable: true },
  { key: 'assignedDriver', label: 'Assignment', sortable: true },
  { key: 'isActive', label: 'Status', sortable: true },
  { key: 'actions', label: 'Actions', sortable: false }
];

// Render schedules table with current sort state
function renderSchedulesTable() {
  // Define searchable fields
  const searchFields = ['name', 'scheduleId', 'routeName', 'recurrenceType', 'assignedDriver', 'assignedVehicle'];

  // Apply search filter first
  const filteredSchedules = filterData(cachedSchedulesData, searchState.schedules, searchFields);

  // Apply sorting
  const { column, direction } = sortState.schedules;
  const sortedSchedules = sortData(filteredSchedules, column, direction);

  // Update search results count display
  const countDisplay = document.querySelector('#schedulesCountDisplay');
  if (countDisplay) {
    countDisplay.textContent = `${sortedSchedules.length} of ${cachedSchedulesData.length} schedules${searchState.schedules ? ' (filtered)' : ''}`;
  }

  const scheduleRows = sortedSchedules.map(s => {
    // Format recurrence pattern
    let patternText = '';
    if (s.recurrenceType === 'daily') {
      patternText = 'Daily';
    } else if (s.recurrenceType === 'weekly') {
      const days = (s.weeklyDays || []).map(d => DAYS_OF_WEEK[d].slice(0, 3)).join(', ');
      patternText = `Weekly: ${days}`;
    } else if (s.recurrenceType === 'monthly') {
      const dates = (s.monthlyDates || []).join(', ');
      patternText = `Monthly: ${dates}`;
    }

    const statusColor = s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600';
    const statusText = s.isActive ? 'Active' : 'Inactive';

    return `
      <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
        <td class="px-4 py-4">
          <div class="font-medium text-gray-800">${s.name}</div>
          <div class="text-sm text-gray-500">${s.scheduleId}</div>
        </td>
        <td class="px-4 py-4 text-gray-600">${s.routeName || 'Unknown Route'}</td>
        <td class="px-4 py-4">
          <div class="text-sm text-gray-600">${patternText}</div>
          <div class="text-xs text-gray-400">at ${s.scheduledTime || '07:00'}</div>
        </td>
        <td class="px-4 py-4">
          <div class="text-sm text-gray-600">${s.assignedDriver || '-'}</div>
          <div class="text-xs text-gray-400">${s.assignedVehicle || '-'}</div>
        </td>
        <td class="px-4 py-4">
          <span class="px-3 py-1 rounded-full text-xs font-medium ${statusColor}">${statusText}</span>
        </td>
        <td class="px-4 py-4">
          <div class="flex items-center gap-1">
            <button onclick="editSchedule('${s.scheduleId || s._id}')" class="p-2 hover:bg-blue-100 rounded-lg transition-colors" title="Edit">
              <i data-lucide="pencil" class="w-4 h-4 text-blue-600"></i>
            </button>
            <button onclick="toggleScheduleStatus('${s.scheduleId || s._id}')" class="p-2 hover:bg-yellow-100 rounded-lg transition-colors" title="${s.isActive ? 'Deactivate' : 'Activate'}">
              <i data-lucide="${s.isActive ? 'pause' : 'play'}" class="w-4 h-4 text-yellow-600"></i>
            </button>
            <button onclick="deleteSchedule('${s.scheduleId || s._id}')" class="p-2 hover:bg-red-100 rounded-lg transition-colors" title="Delete">
              <i data-lucide="trash-2" class="w-4 h-4 text-red-500"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Update table body
  const tbody = document.querySelector('#pageContent table tbody');
  if (tbody) {
    tbody.innerHTML = scheduleRows || '<tr><td colspan="6" class="px-4 py-8 text-center text-gray-500">No schedules found. Click "Add Schedule" to create one.</td></tr>';
    lucide.createIcons();
  }

  // Update table header
  const thead = document.querySelector('#pageContent table thead tr');
  if (thead) {
    thead.innerHTML = createSortableHeader('schedules', schedulesColumns);
    lucide.createIcons();
  }
}

// ===== SPECIAL PICKUPS ADMIN =====
async function showSpecialPickupsAdmin() {
  if (user.role !== 'admin') {
    showToast('Admin access required', 'error');
    return;
  }

  setActiveSidebarButton('specialPickupsBtn');
  showPageContent();
  showPageLoading('Loading special pickup requests...');

  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/resident/admin/special-pickups', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const pickups = await response.json();

    const statusColors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'scheduled': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    };

    const typeColors = {
      'e-waste': 'bg-blue-100 text-blue-700',
      'hazardous': 'bg-red-100 text-red-700'
    };

    let tableRows = '';
    pickups.forEach(p => {
      const date = new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const items = p.items ? p.items.map(i => i.name).join(', ') : 'N/A';
      tableRows += `
        <tr class="hover:bg-gray-50 border-b">
          <td class="px-4 py-3">
            <div class="font-medium text-primary-600">${p.referenceNumber}</div>
            <div class="text-xs text-gray-500">${date}</div>
          </td>
          <td class="px-4 py-3">
            <span class="px-2 py-1 rounded-full text-xs font-medium ${typeColors[p.pickupType]}">
              ${p.pickupType === 'e-waste' ? 'E-Waste' : 'Hazardous'}
            </span>
          </td>
          <td class="px-4 py-3">
            <div class="font-medium">${p.requesterName}</div>
            <div class="text-xs text-gray-500">${p.phone}</div>
          </td>
          <td class="px-4 py-3 text-sm">${p.barangay}</td>
          <td class="px-4 py-3 text-sm max-w-xs truncate" title="${items}">${items}</td>
          <td class="px-4 py-3">
            <span class="px-2 py-1 rounded-full text-xs font-medium ${statusColors[p.status]}">
              ${p.status.charAt(0).toUpperCase() + p.status.slice(1)}
            </span>
          </td>
          <td class="px-4 py-3">
            <div class="flex gap-1">
              <button onclick="viewPickupDetails('${p._id}')" class="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded" title="View Details">
                <i data-lucide="eye" class="w-4 h-4"></i>
              </button>
              ${p.status === 'pending' ? `
                <button onclick="schedulePickup('${p._id}')" class="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded" title="Schedule">
                  <i data-lucide="calendar" class="w-4 h-4"></i>
                </button>
              ` : ''}
              ${p.status === 'scheduled' ? `
                <button onclick="completePickup('${p._id}')" class="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded" title="Mark Complete">
                  <i data-lucide="check-circle" class="w-4 h-4"></i>
                </button>
              ` : ''}
            </div>
          </td>
        </tr>`;
    });

    const pendingCount = pickups.filter(p => p.status === 'pending').length;
    const scheduledCount = pickups.filter(p => p.status === 'scheduled').length;

    const pageContent = document.getElementById('pageContent');
    pageContent.innerHTML = `
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-800">Special Pickup Requests</h1>
            <p class="text-gray-500">E-Waste and Hazardous waste pickup requests from residents</p>
          </div>
          <div class="flex gap-3">
            <div class="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-medium">
              ${pendingCount} Pending
            </div>
            <div class="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
              ${scheduledCount} Scheduled
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div class="p-4 border-b bg-gray-50 flex gap-4">
            <select id="pickupStatusFilter" onchange="filterPickups()" class="px-3 py-2 border rounded-lg text-sm">
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select id="pickupTypeFilter" onchange="filterPickups()" class="px-3 py-2 border rounded-lg text-sm">
              <option value="">All Types</option>
              <option value="e-waste">E-Waste</option>
              <option value="hazardous">Hazardous</option>
            </select>
          </div>
          <table class="w-full">
            <thead class="bg-gray-50 text-left text-sm text-gray-600">
              <tr>
                <th class="px-4 py-3 font-semibold">Reference</th>
                <th class="px-4 py-3 font-semibold">Type</th>
                <th class="px-4 py-3 font-semibold">Requester</th>
                <th class="px-4 py-3 font-semibold">Barangay</th>
                <th class="px-4 py-3 font-semibold">Items</th>
                <th class="px-4 py-3 font-semibold">Status</th>
                <th class="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>${tableRows || '<tr><td colspan="7" class="px-4 py-12 text-center text-gray-500">No pickup requests found</td></tr>'}</tbody>
          </table>
        </div>
      </div>
    `;

    lucide.createIcons();
  } catch (error) {
    console.error('Error loading special pickups:', error);
    showPageError('Failed to load special pickup requests');
  }
}

async function viewPickupDetails(id) {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch(`/api/resident/admin/special-pickups/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const pickup = await response.json();

    const itemsList = pickup.items ? pickup.items.map(i => `<li>${i.name} x${i.quantity}</li>`).join('') : '<li>No items listed</li>';

    showModal(`
      <div class="p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-gray-800">Pickup Details</h2>
          <span class="px-3 py-1 rounded-full text-sm font-medium ${pickup.pickupType === 'e-waste' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}">
            ${pickup.pickupType === 'e-waste' ? 'E-Waste' : 'Hazardous'}
          </span>
        </div>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500">Reference Number</p>
              <p class="font-semibold">${pickup.referenceNumber}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Status</p>
              <p class="font-semibold capitalize">${pickup.status}</p>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500">Requester</p>
              <p class="font-semibold">${pickup.requesterName}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Phone</p>
              <p class="font-semibold">${pickup.phone}</p>
            </div>
          </div>
          <div>
            <p class="text-sm text-gray-500">Address</p>
            <p class="font-semibold">${pickup.address}, ${pickup.barangay}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Items</p>
            <ul class="list-disc list-inside text-sm">${itemsList}</ul>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500">Preferred Date</p>
              <p class="font-semibold">${new Date(pickup.preferredDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Time Slot</p>
              <p class="font-semibold capitalize">${pickup.preferredTimeSlot || 'Morning'}</p>
            </div>
          </div>
          ${pickup.photos && pickup.photos.length > 0 ? `
            <div>
              <p class="text-sm text-gray-500 mb-2">Photos</p>
              <div class="flex gap-2 flex-wrap">
                ${pickup.photos.map(p => `<img src="${p}" class="w-20 h-20 object-cover rounded-lg">`).join('')}
              </div>
            </div>
          ` : ''}
        </div>
        <div class="mt-6 flex gap-3 justify-end">
          <button onclick="closeModal()" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Close</button>
          ${pickup.status === 'pending' ? `<button onclick="schedulePickup('${pickup._id}')" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Schedule Pickup</button>` : ''}
        </div>
      </div>
    `);
  } catch (error) {
    showToast('Failed to load pickup details', 'error');
  }
}

async function schedulePickup(id) {
  const date = prompt('Enter scheduled pickup date (YYYY-MM-DD):');
  if (!date) return;

  const token = localStorage.getItem('token');
  try {
    await fetch(`/api/resident/admin/special-pickups/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'scheduled',
        scheduledDate: date
      })
    });
    showToast('Pickup scheduled successfully', 'success');
    closeModal();
    showSpecialPickupsAdmin();
  } catch (error) {
    showToast('Failed to schedule pickup', 'error');
  }
}

async function completePickup(id) {
  if (!confirm('Mark this pickup as completed?')) return;

  const token = localStorage.getItem('token');
  try {
    await fetch(`/api/resident/admin/special-pickups/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'completed' })
    });
    showToast('Pickup marked as completed', 'success');
    showSpecialPickupsAdmin();
  } catch (error) {
    showToast('Failed to complete pickup', 'error');
  }
}

// ===== ANNOUNCEMENTS ADMIN =====
async function showAnnouncementsAdmin() {
  if (user.role !== 'admin') {
    showToast('Admin access required', 'error');
    return;
  }

  setActiveSidebarButton('announcementsAdminBtn');
  showPageContent();
  showPageLoading('Loading announcements...');

  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/resident/admin/announcements', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const announcements = await response.json();

    const typeColors = {
      'info': 'bg-blue-100 text-blue-700',
      'warning': 'bg-amber-100 text-amber-700',
      'alert': 'bg-red-100 text-red-700',
      'schedule-change': 'bg-purple-100 text-purple-700'
    };

    let tableRows = '';
    announcements.forEach(a => {
      const startDate = new Date(a.startDate).toLocaleDateString();
      const endDate = a.endDate ? new Date(a.endDate).toLocaleDateString() : 'Ongoing';
      const scope = a.targetScope === 'city-wide' ? 'City-wide' :
                   a.targetBarangays && a.targetBarangays.length > 0 ?
                   a.targetBarangays.slice(0, 2).join(', ') + (a.targetBarangays.length > 2 ? '...' : '') :
                   'City-wide';

      tableRows += `
        <tr class="hover:bg-gray-50 border-b">
          <td class="px-4 py-3">
            <div class="font-medium">${a.title}</div>
            <div class="text-xs text-gray-500 max-w-xs truncate">${a.content}</div>
          </td>
          <td class="px-4 py-3">
            <span class="px-2 py-1 rounded-full text-xs font-medium ${typeColors[a.type]}">
              ${a.type.replace('-', ' ').toUpperCase()}
            </span>
          </td>
          <td class="px-4 py-3 text-sm">${scope}</td>
          <td class="px-4 py-3 text-sm capitalize">${a.priority}</td>
          <td class="px-4 py-3 text-sm">${startDate} - ${endDate}</td>
          <td class="px-4 py-3">
            <span class="px-2 py-1 rounded-full text-xs font-medium ${a.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}">
              ${a.isActive ? 'Active' : 'Inactive'}
            </span>
          </td>
          <td class="px-4 py-3">
            <div class="flex gap-1">
              <button onclick="editAnnouncement('${a._id}')" class="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded" title="Edit">
                <i data-lucide="edit" class="w-4 h-4"></i>
              </button>
              <button onclick="toggleAnnouncementStatus('${a._id}', ${!a.isActive})" class="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded" title="${a.isActive ? 'Deactivate' : 'Activate'}">
                <i data-lucide="${a.isActive ? 'pause' : 'play'}" class="w-4 h-4"></i>
              </button>
              <button onclick="deleteAnnouncement('${a._id}')" class="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded" title="Delete">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </td>
        </tr>`;
    });

    const activeCount = announcements.filter(a => a.isActive).length;

    const pageContent = document.getElementById('pageContent');
    pageContent.innerHTML = `
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-800">Announcements</h1>
            <p class="text-gray-500">Manage public announcements for the resident portal</p>
          </div>
          <button onclick="showCreateAnnouncementModal()" class="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            <i data-lucide="plus" class="w-4 h-4"></i>
            New Announcement
          </button>
        </div>

        <div class="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div class="p-4 border-b bg-gray-50">
            <span class="text-sm text-gray-600">${activeCount} active announcement${activeCount !== 1 ? 's' : ''}</span>
          </div>
          <table class="w-full">
            <thead class="bg-gray-50 text-left text-sm text-gray-600">
              <tr>
                <th class="px-4 py-3 font-semibold">Title / Content</th>
                <th class="px-4 py-3 font-semibold">Type</th>
                <th class="px-4 py-3 font-semibold">Scope</th>
                <th class="px-4 py-3 font-semibold">Priority</th>
                <th class="px-4 py-3 font-semibold">Dates</th>
                <th class="px-4 py-3 font-semibold">Status</th>
                <th class="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>${tableRows || '<tr><td colspan="7" class="px-4 py-12 text-center text-gray-500">No announcements found</td></tr>'}</tbody>
          </table>
        </div>
      </div>
    `;

    lucide.createIcons();
  } catch (error) {
    console.error('Error loading announcements:', error);
    showPageError('Failed to load announcements');
  }
}

async function showCreateAnnouncementModal() {
  const barangaysResponse = await fetch('/api/resident/barangays');
  const barangays = await barangaysResponse.json();

  const barangayOptions = barangays.map(b => `<option value="${b}">${b}</option>`).join('');

  showModal('Create Announcement', `
      <form id="announcementForm" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input type="text" id="annTitle" required class="w-full px-3 py-2 border rounded-lg" placeholder="Announcement title">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Content *</label>
          <textarea id="annContent" rows="3" required class="w-full px-3 py-2 border rounded-lg" placeholder="Announcement message"></textarea>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select id="annType" class="w-full px-3 py-2 border rounded-lg">
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="alert">Alert</option>
              <option value="schedule-change">Schedule Change</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select id="annPriority" class="w-full px-3 py-2 border rounded-lg">
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Target Scope</label>
          <select id="annScope" onchange="toggleBarangaySelect()" class="w-full px-3 py-2 border rounded-lg">
            <option value="city-wide">City-wide (All Barangays)</option>
            <option value="barangay">Specific Barangays</option>
          </select>
        </div>
        <div id="barangaySelectContainer" class="hidden">
          <label class="block text-sm font-medium text-gray-700 mb-1">Select Barangays</label>
          <select id="annBarangays" multiple class="w-full px-3 py-2 border rounded-lg h-32">
            ${barangayOptions}
          </select>
          <p class="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input type="date" id="annStartDate" class="w-full px-3 py-2 border rounded-lg" value="${new Date().toISOString().split('T')[0]}">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">End Date (optional)</label>
            <input type="date" id="annEndDate" class="w-full px-3 py-2 border rounded-lg">
          </div>
        </div>
        <div class="flex gap-3 justify-end mt-6">
          <button type="button" onclick="closeModal()" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button type="submit" class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Create</button>
        </div>
      </form>
  `);

  // Wait for DOM to update before attaching event listener
  setTimeout(() => {
    const form = document.getElementById('announcementForm');
    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        await createAnnouncement();
      };
    }
  }, 100);
}

function toggleBarangaySelect() {
  const scope = document.getElementById('annScope').value;
  const container = document.getElementById('barangaySelectContainer');
  if (scope === 'barangay') {
    container.classList.remove('hidden');
  } else {
    container.classList.add('hidden');
  }
}

async function createAnnouncement() {
  const token = localStorage.getItem('token');
  const scope = document.getElementById('annScope').value;
  const barangaySelect = document.getElementById('annBarangays');
  const targetBarangays = scope === 'barangay' ?
    Array.from(barangaySelect.selectedOptions).map(o => o.value) : [];

  try {
    await fetch('/api/resident/admin/announcements', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: document.getElementById('annTitle').value,
        content: document.getElementById('annContent').value,
        type: document.getElementById('annType').value,
        priority: document.getElementById('annPriority').value,
        targetScope: scope,
        targetBarangays: targetBarangays,
        startDate: document.getElementById('annStartDate').value,
        endDate: document.getElementById('annEndDate').value || null
      })
    });
    showToast('Announcement created successfully', 'success');
    closeModal();
    showAnnouncementsAdmin();
  } catch (error) {
    showToast('Failed to create announcement', 'error');
  }
}

async function toggleAnnouncementStatus(id, isActive) {
  const token = localStorage.getItem('token');
  try {
    await fetch(`/api/resident/admin/announcements/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ isActive })
    });
    showToast(`Announcement ${isActive ? 'activated' : 'deactivated'}`, 'success');
    showAnnouncementsAdmin();
  } catch (error) {
    showToast('Failed to update announcement', 'error');
  }
}

async function deleteAnnouncement(id) {
  if (!confirm('Are you sure you want to delete this announcement?')) return;

  const token = localStorage.getItem('token');
  try {
    await fetch(`/api/resident/admin/announcements/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    showToast('Announcement deleted', 'success');
    showAnnouncementsAdmin();
  } catch (error) {
    showToast('Failed to delete announcement', 'error');
  }
}

async function editAnnouncement(id) {
  const token = localStorage.getItem('token');
  const response = await fetch(`/api/resident/admin/announcements`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const announcements = await response.json();
  const a = announcements.find(ann => ann._id === id);
  if (!a) return;

  const barangaysResponse = await fetch('/api/resident/barangays');
  const barangays = await barangaysResponse.json();
  const barangayOptions = barangays.map(b =>
    `<option value="${b}" ${a.targetBarangays && a.targetBarangays.includes(b) ? 'selected' : ''}>${b}</option>`
  ).join('');

  showModal(`
    <div class="p-6">
      <h2 class="text-xl font-bold text-gray-800 mb-4">Edit Announcement</h2>
      <form id="editAnnouncementForm" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input type="text" id="editAnnTitle" value="${a.title}" required class="w-full px-3 py-2 border rounded-lg">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Content *</label>
          <textarea id="editAnnContent" rows="3" required class="w-full px-3 py-2 border rounded-lg">${a.content}</textarea>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select id="editAnnType" class="w-full px-3 py-2 border rounded-lg">
              <option value="info" ${a.type === 'info' ? 'selected' : ''}>Info</option>
              <option value="warning" ${a.type === 'warning' ? 'selected' : ''}>Warning</option>
              <option value="alert" ${a.type === 'alert' ? 'selected' : ''}>Alert</option>
              <option value="schedule-change" ${a.type === 'schedule-change' ? 'selected' : ''}>Schedule Change</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select id="editAnnPriority" class="w-full px-3 py-2 border rounded-lg">
              <option value="normal" ${a.priority === 'normal' ? 'selected' : ''}>Normal</option>
              <option value="high" ${a.priority === 'high' ? 'selected' : ''}>High</option>
              <option value="urgent" ${a.priority === 'urgent' ? 'selected' : ''}>Urgent</option>
            </select>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Target Scope</label>
          <select id="editAnnScope" onchange="toggleEditBarangaySelect()" class="w-full px-3 py-2 border rounded-lg">
            <option value="city-wide" ${a.targetScope === 'city-wide' ? 'selected' : ''}>City-wide</option>
            <option value="barangay" ${a.targetScope === 'barangay' ? 'selected' : ''}>Specific Barangays</option>
          </select>
        </div>
        <div id="editBarangaySelectContainer" class="${a.targetScope === 'barangay' ? '' : 'hidden'}">
          <label class="block text-sm font-medium text-gray-700 mb-1">Select Barangays</label>
          <select id="editAnnBarangays" multiple class="w-full px-3 py-2 border rounded-lg h-32">
            ${barangayOptions}
          </select>
        </div>
        <div class="flex gap-3 justify-end mt-6">
          <button type="button" onclick="closeModal()" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button type="submit" class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Update</button>
        </div>
      </form>
    </div>
  `);

  document.getElementById('editAnnouncementForm').onsubmit = async (e) => {
    e.preventDefault();
    await updateAnnouncement(id);
  };
}

function toggleEditBarangaySelect() {
  const scope = document.getElementById('editAnnScope').value;
  const container = document.getElementById('editBarangaySelectContainer');
  if (scope === 'barangay') {
    container.classList.remove('hidden');
  } else {
    container.classList.add('hidden');
  }
}

async function updateAnnouncement(id) {
  const token = localStorage.getItem('token');
  const scope = document.getElementById('editAnnScope').value;
  const barangaySelect = document.getElementById('editAnnBarangays');
  const targetBarangays = scope === 'barangay' ?
    Array.from(barangaySelect.selectedOptions).map(o => o.value) : [];

  try {
    await fetch(`/api/resident/admin/announcements/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: document.getElementById('editAnnTitle').value,
        content: document.getElementById('editAnnContent').value,
        type: document.getElementById('editAnnType').value,
        priority: document.getElementById('editAnnPriority').value,
        targetScope: scope,
        targetBarangays: targetBarangays
      })
    });
    showToast('Announcement updated successfully', 'success');
    closeModal();
    showAnnouncementsAdmin();
  } catch (error) {
    showToast('Failed to update announcement', 'error');
  }
}

async function showScheduleManagement() {
  if (user.role !== 'admin') {
    showToast('Admin access required', 'error');
    return;
  }

  setActiveSidebarButton('schedulesBtn');
  showPageContent();
  showPageLoading('Loading schedules...');

  try {
    const token = localStorage.getItem('token');
    const [schedulesRes, statsRes, routesRes, usersRes, trucksRes] = await Promise.all([
      fetch(`${API_URL}/schedules`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`${API_URL}/schedules/stats`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`${API_URL}/routes`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`${API_URL}/users`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`${API_URL}/trucks`, { headers: { 'Authorization': `Bearer ${token}` } })
    ]);

    cachedSchedulesData = await schedulesRes.json();
    cachedSchedulesStats = await statsRes.json();
    cachedScheduleRoutes = await routesRes.json();
    const users = await usersRes.json();
    cachedScheduleTrucks = await trucksRes.json();
    cachedScheduleDrivers = users.filter(u => u.role === 'driver');

    // Register sort handler
    sortHandlers.schedules = renderSchedulesTable;

    const schedules = cachedSchedulesData;
    const stats = cachedSchedulesStats;
    const routes = cachedScheduleRoutes;
    const trucks = cachedScheduleTrucks;
    const drivers = cachedScheduleDrivers;

    // Apply sorting to schedule rows
    const { column, direction } = sortState.schedules;
    const sortedSchedules = sortData(schedules, column, direction);

    // Generate schedule rows
    const scheduleRows = sortedSchedules.map(s => {
      // Format recurrence pattern
      let patternText = '';
      if (s.recurrenceType === 'daily') {
        patternText = 'Daily';
      } else if (s.recurrenceType === 'weekly') {
        const days = (s.weeklyDays || []).map(d => DAYS_OF_WEEK[d].slice(0, 3)).join(', ');
        patternText = `Weekly: ${days}`;
      } else if (s.recurrenceType === 'monthly') {
        const dates = (s.monthlyDates || []).join(', ');
        patternText = `Monthly: ${dates}`;
      }

      const statusColor = s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600';
      const statusText = s.isActive ? 'Active' : 'Inactive';

      return `
        <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
          <td class="px-4 py-4">
            <div class="font-medium text-gray-800">${s.name}</div>
            <div class="text-sm text-gray-500">${s.scheduleId}</div>
          </td>
          <td class="px-4 py-4 text-gray-600">${s.routeName || 'Unknown Route'}</td>
          <td class="px-4 py-4">
            <div class="text-sm text-gray-600">${patternText}</div>
            <div class="text-xs text-gray-400">at ${s.scheduledTime || '07:00'}</div>
          </td>
          <td class="px-4 py-4">
            <div class="text-sm text-gray-600">${s.assignedDriver || '-'}</div>
            <div class="text-xs text-gray-400">${s.assignedVehicle || '-'}</div>
          </td>
          <td class="px-4 py-4">
            <span class="px-3 py-1 rounded-full text-xs font-medium ${statusColor}">${statusText}</span>
          </td>
          <td class="px-4 py-4">
            <div class="flex items-center gap-1">
              <button onclick="editSchedule('${s.scheduleId || s._id}')" class="p-2 hover:bg-blue-100 rounded-lg transition-colors" title="Edit">
                <i data-lucide="pencil" class="w-4 h-4 text-blue-600"></i>
              </button>
              <button onclick="toggleScheduleStatus('${s.scheduleId || s._id}')" class="p-2 hover:bg-yellow-100 rounded-lg transition-colors" title="${s.isActive ? 'Deactivate' : 'Activate'}">
                <i data-lucide="${s.isActive ? 'pause' : 'play'}" class="w-4 h-4 text-yellow-600"></i>
              </button>
              <button onclick="deleteSchedule('${s.scheduleId || s._id}')" class="p-2 hover:bg-red-100 rounded-lg transition-colors" title="Delete">
                <i data-lucide="trash-2" class="w-4 h-4 text-red-500"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Route options for form
    const routeOptions = routes.map(r => `<option value="${r.routeId}">${r.name}</option>`).join('');
    const driverOptions = drivers.map(d => `<option value="${d.username}">${d.fullName || d.username}</option>`).join('');
    const truckOptions = trucks.map(t => `<option value="${t.plateNumber}">${t.plateNumber} - ${t.model || 'Unknown'}</option>`).join('');

    const pageContent = document.getElementById('pageContent');
    pageContent.innerHTML = `
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-800">Collection Schedules</h1>
            <p id="schedulesCountDisplay" class="text-gray-500 mt-1">${sortedSchedules.length} of ${schedules.length} schedules</p>
          </div>
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            ${createSearchInput('schedules', 'Search schedules...')}
            <button onclick="showAddScheduleForm()" class="inline-flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-xl transition-colors">
              <i data-lucide="plus" class="w-5 h-5"></i>
              <span>Add Schedule</span>
            </button>
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <i data-lucide="calendar" class="w-5 h-5 text-blue-600"></i>
              </div>
              <div>
                <p class="text-2xl font-bold text-gray-800">${stats.total || 0}</p>
                <p class="text-sm text-gray-500">Total Schedules</p>
              </div>
            </div>
          </div>
          <div class="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <i data-lucide="check-circle" class="w-5 h-5 text-green-600"></i>
              </div>
              <div>
                <p class="text-2xl font-bold text-gray-800">${stats.active || 0}</p>
                <p class="text-sm text-gray-500">Active</p>
              </div>
            </div>
          </div>
          <div class="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <i data-lucide="pause-circle" class="w-5 h-5 text-gray-600"></i>
              </div>
              <div>
                <p class="text-2xl font-bold text-gray-800">${stats.inactive || 0}</p>
                <p class="text-sm text-gray-500">Inactive</p>
              </div>
            </div>
          </div>
          <div class="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <i data-lucide="repeat" class="w-5 h-5 text-purple-600"></i>
              </div>
              <div>
                <p class="text-2xl font-bold text-gray-800">${(stats.byRecurrence?.weekly || 0)}</p>
                <p class="text-sm text-gray-500">Weekly</p>
              </div>
            </div>
          </div>
        </div>

        <!-- View Toggle -->
        <div class="flex items-center gap-2">
          <button id="tableViewBtn" onclick="setScheduleView('table')" class="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg transition-colors">
            <i data-lucide="table" class="w-4 h-4"></i>
            <span>Table View</span>
          </button>
          <button id="calendarViewBtn" onclick="setScheduleView('calendar')" class="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors">
            <i data-lucide="calendar" class="w-4 h-4"></i>
            <span>Calendar View</span>
          </button>
        </div>

        <!-- Schedules Table -->
        <div id="schedulesTableView" class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 border-b border-gray-200">
                <tr>
                  ${createSortableHeader('schedules', schedulesColumns)}
                </tr>
              </thead>
              <tbody>
                ${scheduleRows || '<tr><td colspan="6" class="px-4 py-8 text-center text-gray-500">No schedules found. Click "Add Schedule" to create one.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Calendar View -->
        <div id="schedulesCalendarView" class="hidden bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div class="p-4 border-b border-gray-200 flex items-center justify-between">
            <button onclick="navigateCalendarMonth(-1)" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <i data-lucide="chevron-left" class="w-5 h-5 text-gray-600"></i>
            </button>
            <h3 id="calendarMonthYear" class="text-lg font-semibold text-gray-800"></h3>
            <button onclick="navigateCalendarMonth(1)" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <i data-lucide="chevron-right" class="w-5 h-5 text-gray-600"></i>
            </button>
          </div>
          <div class="p-4">
            <div class="grid grid-cols-7 gap-1 mb-2">
              <div class="text-center text-sm font-medium text-gray-500 py-2">Sun</div>
              <div class="text-center text-sm font-medium text-gray-500 py-2">Mon</div>
              <div class="text-center text-sm font-medium text-gray-500 py-2">Tue</div>
              <div class="text-center text-sm font-medium text-gray-500 py-2">Wed</div>
              <div class="text-center text-sm font-medium text-gray-500 py-2">Thu</div>
              <div class="text-center text-sm font-medium text-gray-500 py-2">Fri</div>
              <div class="text-center text-sm font-medium text-gray-500 py-2">Sat</div>
            </div>
            <div id="calendarGrid" class="grid grid-cols-7 gap-1"></div>
          </div>
          <div class="p-4 border-t border-gray-200 flex flex-wrap gap-4 text-sm">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-blue-500"></span>
              <span class="text-gray-600">Daily</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-green-500"></span>
              <span class="text-gray-600">Weekly</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-purple-500"></span>
              <span class="text-gray-600">Monthly</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-gray-300"></span>
              <span class="text-gray-600">Inactive</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Add/Edit Schedule Modal -->
      <div id="scheduleModal" class="hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div class="p-6 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <h2 id="scheduleModalTitle" class="text-xl font-bold text-gray-800">Add Schedule</h2>
              <button onclick="closeScheduleModal()" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <i data-lucide="x" class="w-5 h-5 text-gray-500"></i>
              </button>
            </div>
          </div>
          <form id="scheduleForm" class="p-6 space-y-4">
            <input type="hidden" id="editScheduleId" value="">

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Schedule Name *</label>
              <input type="text" id="scheduleName" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="e.g., Monday Morning Collection">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Route *</label>
              <select id="scheduleRouteId" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                <option value="">Select a route</option>
                ${routeOptions}
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Recurrence Type *</label>
              <div class="flex gap-4">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="recurrenceType" value="daily" class="text-primary-500 focus:ring-primary-500" onchange="updateRecurrenceOptions()">
                  <span class="text-gray-700">Daily</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="recurrenceType" value="weekly" checked class="text-primary-500 focus:ring-primary-500" onchange="updateRecurrenceOptions()">
                  <span class="text-gray-700">Weekly</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="recurrenceType" value="monthly" class="text-primary-500 focus:ring-primary-500" onchange="updateRecurrenceOptions()">
                  <span class="text-gray-700">Monthly</span>
                </label>
              </div>
            </div>

            <!-- Weekly Days Selection -->
            <div id="weeklyDaysSection">
              <label class="block text-sm font-medium text-gray-700 mb-2">Select Days *</label>
              <div class="flex flex-wrap gap-2">
                ${DAYS_OF_WEEK.map((day, i) => `
                  <label class="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" name="weeklyDays" value="${i}" class="text-primary-500 focus:ring-primary-500 rounded">
                    <span class="text-sm text-gray-700">${day.slice(0, 3)}</span>
                  </label>
                `).join('')}
              </div>
            </div>

            <!-- Monthly Dates Selection -->
            <div id="monthlyDatesSection" class="hidden">
              <label class="block text-sm font-medium text-gray-700 mb-2">Select Dates *</label>
              <div class="grid grid-cols-7 gap-1">
                ${Array.from({length: 31}, (_, i) => i + 1).map(d => `
                  <label class="flex items-center justify-center w-8 h-8 border border-gray-300 rounded cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" name="monthlyDates" value="${d}" class="hidden peer">
                    <span class="peer-checked:bg-primary-500 peer-checked:text-white w-full h-full flex items-center justify-center rounded text-sm">${d}</span>
                  </label>
                `).join('')}
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Scheduled Time</label>
              <input type="time" id="scheduledTime" value="07:00" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Assigned Driver</label>
                <select id="scheduleDriver" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                  <option value="">Select driver</option>
                  ${driverOptions}
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Assigned Vehicle</label>
                <select id="scheduleVehicle" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                  <option value="">Select vehicle</option>
                  ${truckOptions}
                </select>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea id="scheduleNotes" rows="2" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="Optional notes about this schedule"></textarea>
            </div>

            <div class="flex gap-3 pt-4">
              <button type="button" onclick="closeScheduleModal()" class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button type="submit" class="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
                Save Schedule
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    hidePageLoading();
    lucide.createIcons();

    // Setup form submission
    document.getElementById('scheduleForm').addEventListener('submit', handleScheduleSubmit);

  } catch (error) {
    console.error('Error loading schedules:', error);
    hidePageLoading();
    showToast('Error loading schedules', 'error');
  }
}

function updateRecurrenceOptions() {
  const recurrenceType = document.querySelector('input[name="recurrenceType"]:checked')?.value;
  const weeklySection = document.getElementById('weeklyDaysSection');
  const monthlySection = document.getElementById('monthlyDatesSection');

  if (recurrenceType === 'daily') {
    weeklySection.classList.add('hidden');
    monthlySection.classList.add('hidden');
  } else if (recurrenceType === 'weekly') {
    weeklySection.classList.remove('hidden');
    monthlySection.classList.add('hidden');
  } else if (recurrenceType === 'monthly') {
    weeklySection.classList.add('hidden');
    monthlySection.classList.remove('hidden');
  }
}

function showAddScheduleForm() {
  document.getElementById('scheduleModalTitle').textContent = 'Add Schedule';
  document.getElementById('editScheduleId').value = '';
  document.getElementById('scheduleForm').reset();
  document.querySelector('input[name="recurrenceType"][value="weekly"]').checked = true;
  updateRecurrenceOptions();
  document.getElementById('scheduleModal').classList.remove('hidden');
  lucide.createIcons();
}

function closeScheduleModal() {
  document.getElementById('scheduleModal').classList.add('hidden');
}

async function handleScheduleSubmit(e) {
  e.preventDefault();

  const editId = document.getElementById('editScheduleId').value;
  const recurrenceType = document.querySelector('input[name="recurrenceType"]:checked')?.value;

  // Get selected days/dates
  const weeklyDays = recurrenceType === 'weekly'
    ? Array.from(document.querySelectorAll('input[name="weeklyDays"]:checked')).map(cb => parseInt(cb.value))
    : [];

  const monthlyDates = recurrenceType === 'monthly'
    ? Array.from(document.querySelectorAll('input[name="monthlyDates"]:checked')).map(cb => parseInt(cb.value))
    : [];

  // Validation
  if (recurrenceType === 'weekly' && weeklyDays.length === 0) {
    showToast('Please select at least one day for weekly schedule', 'warning');
    return;
  }
  if (recurrenceType === 'monthly' && monthlyDates.length === 0) {
    showToast('Please select at least one date for monthly schedule', 'warning');
    return;
  }

  const scheduleData = {
    name: document.getElementById('scheduleName').value,
    routeId: document.getElementById('scheduleRouteId').value,
    recurrenceType,
    weeklyDays,
    monthlyDates,
    scheduledTime: document.getElementById('scheduledTime').value || '07:00',
    assignedDriver: document.getElementById('scheduleDriver').value || null,
    assignedVehicle: document.getElementById('scheduleVehicle').value || null,
    notes: document.getElementById('scheduleNotes').value || ''
  };

  try {
    const token = localStorage.getItem('token');
    const url = editId ? `${API_URL}/schedules/${editId}` : `${API_URL}/schedules`;
    const method = editId ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(scheduleData)
    });

    if (response.ok) {
      showToast(editId ? 'Schedule updated successfully' : 'Schedule created successfully', 'success');
      closeScheduleModal();
      showScheduleManagement();
    } else {
      const error = await response.json();
      showToast(error.error || 'Failed to save schedule', 'error');
    }
  } catch (error) {
    console.error('Error saving schedule:', error);
    showToast('Error saving schedule', 'error');
  }
}

window.editSchedule = async function(id) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/schedules/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      showToast('Failed to load schedule', 'error');
      return;
    }

    const schedule = await response.json();

    document.getElementById('scheduleModalTitle').textContent = 'Edit Schedule';
    document.getElementById('editScheduleId').value = id;
    document.getElementById('scheduleName').value = schedule.name;
    document.getElementById('scheduleRouteId').value = schedule.routeId;
    document.getElementById('scheduledTime').value = schedule.scheduledTime || '07:00';
    document.getElementById('scheduleDriver').value = schedule.assignedDriver || '';
    document.getElementById('scheduleVehicle').value = schedule.assignedVehicle || '';
    document.getElementById('scheduleNotes').value = schedule.notes || '';

    // Set recurrence type
    const recurrenceRadio = document.querySelector(`input[name="recurrenceType"][value="${schedule.recurrenceType}"]`);
    if (recurrenceRadio) recurrenceRadio.checked = true;
    updateRecurrenceOptions();

    // Set weekly days
    if (schedule.recurrenceType === 'weekly' && schedule.weeklyDays) {
      document.querySelectorAll('input[name="weeklyDays"]').forEach(cb => {
        cb.checked = schedule.weeklyDays.includes(parseInt(cb.value));
      });
    }

    // Set monthly dates
    if (schedule.recurrenceType === 'monthly' && schedule.monthlyDates) {
      document.querySelectorAll('input[name="monthlyDates"]').forEach(cb => {
        cb.checked = schedule.monthlyDates.includes(parseInt(cb.value));
      });
    }

    document.getElementById('scheduleModal').classList.remove('hidden');
    lucide.createIcons();

  } catch (error) {
    console.error('Error loading schedule:', error);
    showToast('Error loading schedule', 'error');
  }
};

window.toggleScheduleStatus = async function(id) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/schedules/${id}/toggle`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const result = await response.json();
      showToast(result.message, 'success');
      showScheduleManagement();
    } else {
      showToast('Failed to toggle schedule status', 'error');
    }
  } catch (error) {
    console.error('Error toggling schedule:', error);
    showToast('Error toggling schedule', 'error');
  }
};

window.deleteSchedule = async function(id) {
  if (!await showConfirm('Delete Schedule', 'Are you sure you want to delete this schedule? This action cannot be undone.')) {
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/schedules/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      showToast('Schedule deleted', 'success');
      showScheduleManagement();
    } else {
      showToast('Failed to delete schedule', 'error');
    }
  } catch (error) {
    console.error('Error deleting schedule:', error);
    showToast('Error deleting schedule', 'error');
  }
};

// Make schedule functions globally accessible
window.showScheduleManagement = showScheduleManagement;
window.showAddScheduleForm = showAddScheduleForm;
window.closeScheduleModal = closeScheduleModal;
window.updateRecurrenceOptions = updateRecurrenceOptions;

// ============================================
// REPORTS MODULE WITH PDF EXPORT
// ============================================

let currentReportType = 'collection';
let currentReportData = null;

async function showReportsModule() {
  if (user.role !== 'admin') {
    showToast('Admin access required', 'error');
    return;
  }

  setActiveSidebarButton('reportsBtn');
  showPageContent();

  const pageContent = document.getElementById('pageContent');
  pageContent.innerHTML = `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">Reports</h1>
          <p class="text-gray-500 mt-1">Generate and export operational reports</p>
        </div>
      </div>

      <!-- Report Type Tabs -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div class="border-b border-gray-200">
          <nav class="grid grid-cols-3 md:grid-cols-6 -mb-px">
            <button onclick="selectReportType('collection')" id="collectionTab" class="report-tab px-4 py-3 text-center border-b-2 border-primary-500 text-primary-600 font-medium text-sm">
              <i data-lucide="truck" class="w-5 h-5 mx-auto mb-1"></i>
              Collection
            </button>
            <button onclick="selectReportType('driver')" id="driverTab" class="report-tab px-4 py-3 text-center border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm">
              <i data-lucide="users" class="w-5 h-5 mx-auto mb-1"></i>
              Drivers
            </button>
            <button onclick="selectReportType('complaint')" id="complaintTab" class="report-tab px-4 py-3 text-center border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm">
              <i data-lucide="message-square-warning" class="w-5 h-5 mx-auto mb-1"></i>
              Complaints
            </button>
            <button onclick="selectReportType('fuel')" id="fuelTab" class="report-tab px-4 py-3 text-center border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm">
              <i data-lucide="fuel" class="w-5 h-5 mx-auto mb-1"></i>
              Fuel
            </button>
            <button onclick="selectReportType('schedule')" id="scheduleTab" class="report-tab px-4 py-3 text-center border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm">
              <i data-lucide="calendar-check" class="w-5 h-5 mx-auto mb-1"></i>
              Schedules
            </button>
            <button onclick="selectReportType('fleet')" id="fleetTab" class="report-tab px-4 py-3 text-center border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm">
              <i data-lucide="car" class="w-5 h-5 mx-auto mb-1"></i>
              Fleet
            </button>
          </nav>
        </div>

        <!-- Filter Section -->
        <div class="p-4 bg-gray-50 border-b border-gray-200">
          <div class="flex flex-wrap items-end gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input type="date" id="reportStartDate" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input type="date" id="reportEndDate" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
            </div>
            <button onclick="generateReport()" class="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors">
              <i data-lucide="refresh-cw" class="w-4 h-4"></i>
              Generate Report
            </button>
            <button onclick="exportReportPDF()" class="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors">
              <i data-lucide="download" class="w-4 h-4"></i>
              Export PDF
            </button>
          </div>
        </div>

        <!-- Report Content Area -->
        <div id="reportContent" class="p-6">
          <div class="text-center py-12 text-gray-500">
            <i data-lucide="file-bar-chart" class="w-12 h-12 mx-auto mb-4 opacity-50"></i>
            <p>Select date range and click "Generate Report" to view data</p>
          </div>
        </div>
      </div>
    </div>
  `;

  lucide.createIcons();

  // Set default dates (last 7 days)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  document.getElementById('reportStartDate').value = startDate.toISOString().split('T')[0];
  document.getElementById('reportEndDate').value = endDate.toISOString().split('T')[0];
}

window.selectReportType = function(type) {
  currentReportType = type;
  currentReportData = null;

  // Update tab styles
  document.querySelectorAll('.report-tab').forEach(tab => {
    tab.classList.remove('border-primary-500', 'text-primary-600');
    tab.classList.add('border-transparent', 'text-gray-500');
  });

  const activeTab = document.getElementById(`${type}Tab`);
  if (activeTab) {
    activeTab.classList.remove('border-transparent', 'text-gray-500');
    activeTab.classList.add('border-primary-500', 'text-primary-600');
  }

  // Clear report content
  document.getElementById('reportContent').innerHTML = `
    <div class="text-center py-12 text-gray-500">
      <i data-lucide="file-bar-chart" class="w-12 h-12 mx-auto mb-4 opacity-50"></i>
      <p>Click "Generate Report" to view ${type} data</p>
    </div>
  `;
  lucide.createIcons();
};

window.generateReport = async function() {
  const startDate = document.getElementById('reportStartDate').value;
  const endDate = document.getElementById('reportEndDate').value;

  if (!startDate || !endDate) {
    showToast('Please select start and end dates', 'warning');
    return;
  }

  const reportContent = document.getElementById('reportContent');
  reportContent.innerHTML = `
    <div class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
      <p class="text-gray-500">Generating report...</p>
    </div>
  `;

  try {
    const token = localStorage.getItem('token');
    let endpoint = '';

    switch (currentReportType) {
      case 'collection':
        endpoint = `/reports/collection-summary?startDate=${startDate}&endDate=${endDate}`;
        break;
      case 'driver':
        endpoint = `/reports/driver-performance?startDate=${startDate}&endDate=${endDate}`;
        break;
      case 'complaint':
        endpoint = `/reports/complaint-analytics?startDate=${startDate}&endDate=${endDate}`;
        break;
      case 'fuel':
        endpoint = `/reports/fuel-consumption?startDate=${startDate}&endDate=${endDate}`;
        break;
      case 'schedule':
        endpoint = `/reports/schedule-adherence?startDate=${startDate}&endDate=${endDate}`;
        break;
      case 'fleet':
        endpoint = `/reports/fleet-utilization?startDate=${startDate}&endDate=${endDate}`;
        break;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch report');
    }

    currentReportData = await response.json();

    // Render based on report type
    switch (currentReportType) {
      case 'collection':
        renderCollectionReport(currentReportData);
        break;
      case 'driver':
        renderDriverReport(currentReportData);
        break;
      case 'complaint':
        renderComplaintReport(currentReportData);
        break;
      case 'fuel':
        renderFuelReport(currentReportData);
        break;
      case 'schedule':
        renderScheduleReport(currentReportData);
        break;
      case 'fleet':
        renderFleetReport(currentReportData);
        break;
    }

  } catch (error) {
    console.error('Error generating report:', error);
    reportContent.innerHTML = `
      <div class="text-center py-12 text-red-500">
        <i data-lucide="alert-circle" class="w-12 h-12 mx-auto mb-4"></i>
        <p>Error generating report. Please try again.</p>
      </div>
    `;
    lucide.createIcons();
    showToast('Error generating report', 'error');
  }
};

function renderCollectionReport(data) {
  const reportContent = document.getElementById('reportContent');
  const { summary, byRoute, daily } = data;

  const routeRows = (byRoute || []).map(r => `
    <tr class="border-b border-gray-100">
      <td class="px-4 py-3 font-medium text-gray-800">${r.routeName || r.routeId}</td>
      <td class="px-4 py-3 text-gray-600">${r.completions || 0}</td>
      <td class="px-4 py-3 text-gray-600">${(r.totalDistance || 0).toFixed(2)} km</td>
      <td class="px-4 py-3 text-gray-600">${r.totalStops || 0}</td>
    </tr>
  `).join('') || '<tr><td colspan="4" class="px-4 py-8 text-center text-gray-500">No data available</td></tr>';

  reportContent.innerHTML = `
    <div class="space-y-6">
      <!-- Summary Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <p class="text-sm text-blue-600 font-medium">Total Routes</p>
          <p class="text-2xl font-bold text-blue-700">${summary?.totalRoutes || 0}</p>
        </div>
        <div class="bg-green-50 rounded-xl p-4 border border-green-200">
          <p class="text-sm text-green-600 font-medium">Completed</p>
          <p class="text-2xl font-bold text-green-700">${summary?.completedRoutes || 0}</p>
        </div>
        <div class="bg-purple-50 rounded-xl p-4 border border-purple-200">
          <p class="text-sm text-purple-600 font-medium">Total Distance</p>
          <p class="text-2xl font-bold text-purple-700">${(summary?.totalDistance || 0).toFixed(2)} km</p>
        </div>
        <div class="bg-orange-50 rounded-xl p-4 border border-orange-200">
          <p class="text-sm text-orange-600 font-medium">Total Stops</p>
          <p class="text-2xl font-bold text-orange-700">${summary?.totalStops || 0}</p>
        </div>
      </div>

      <!-- Completion Rate -->
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-gray-700">Completion Rate</span>
          <span class="text-sm font-bold text-gray-800">${summary?.completionRate || 0}%</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-3">
          <div class="bg-green-500 h-3 rounded-full transition-all" style="width: ${summary?.completionRate || 0}%"></div>
        </div>
      </div>

      <!-- By Route Table -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 class="font-semibold text-gray-800">By Route</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Route</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Completions</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Distance</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Stops</th>
              </tr>
            </thead>
            <tbody>${routeRows}</tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  lucide.createIcons();
}

function renderDriverReport(data) {
  const reportContent = document.getElementById('reportContent');
  const { drivers, summary } = data;

  const driverRows = (drivers || []).map((d, i) => `
    <tr class="border-b border-gray-100">
      <td class="px-4 py-3">
        <div class="flex items-center gap-2">
          ${i === 0 ? '<i data-lucide="trophy" class="w-4 h-4 text-yellow-500"></i>' : ''}
          <span class="font-medium text-gray-800">${d.fullName || d.username}</span>
        </div>
      </td>
      <td class="px-4 py-3 text-gray-600">${d.routesCompleted || 0}</td>
      <td class="px-4 py-3 text-gray-600">${(d.totalDistance || 0).toFixed(2)} km</td>
      <td class="px-4 py-3 text-gray-600">${d.totalStops || 0}</td>
      <td class="px-4 py-3 text-gray-600">${(d.avgSpeed || 0).toFixed(1)} km/h</td>
      <td class="px-4 py-3 text-gray-600">${d.fuelEfficiency > 0 ? d.fuelEfficiency.toFixed(2) + ' km/L' : '-'}</td>
    </tr>
  `).join('') || '<tr><td colspan="6" class="px-4 py-8 text-center text-gray-500">No driver data available</td></tr>';

  reportContent.innerHTML = `
    <div class="space-y-6">
      <!-- Summary Cards -->
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div class="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <p class="text-sm text-blue-600 font-medium">Active Drivers</p>
          <p class="text-2xl font-bold text-blue-700">${summary?.totalDrivers || 0}</p>
        </div>
        <div class="bg-green-50 rounded-xl p-4 border border-green-200">
          <p class="text-sm text-green-600 font-medium">Avg Routes/Driver</p>
          <p class="text-2xl font-bold text-green-700">${summary?.avgRoutesPerDriver || 0}</p>
        </div>
        <div class="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
          <p class="text-sm text-yellow-600 font-medium">Top Performer</p>
          <p class="text-2xl font-bold text-yellow-700">${summary?.topPerformer || '-'}</p>
        </div>
      </div>

      <!-- Drivers Table -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 class="font-semibold text-gray-800">Driver Performance</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Driver</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Routes</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Distance</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Stops</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Avg Speed</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Fuel Efficiency</th>
              </tr>
            </thead>
            <tbody>${driverRows}</tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  lucide.createIcons();
}

function renderComplaintReport(data) {
  const reportContent = document.getElementById('reportContent');
  const { summary, byBarangay, byStatus } = data;

  const barangayRows = (byBarangay || []).map(b => `
    <tr class="border-b border-gray-100">
      <td class="px-4 py-3 font-medium text-gray-800">${b.barangay || 'Unknown'}</td>
      <td class="px-4 py-3 text-gray-600">${b.count || 0}</td>
      <td class="px-4 py-3 text-gray-600">${b.resolved || 0}</td>
      <td class="px-4 py-3 text-gray-600">${b.count > 0 ? Math.round((b.resolved / b.count) * 100) : 0}%</td>
    </tr>
  `).join('') || '<tr><td colspan="4" class="px-4 py-8 text-center text-gray-500">No complaint data available</td></tr>';

  const statusColors = {
    'pending': 'bg-yellow-100 text-yellow-700',
    'in-progress': 'bg-blue-100 text-blue-700',
    'resolved': 'bg-green-100 text-green-700',
    'closed': 'bg-gray-100 text-gray-700'
  };

  const statusBadges = (byStatus || []).map(s => `
    <div class="flex items-center justify-between px-4 py-2 bg-gray-50 rounded-lg">
      <span class="px-3 py-1 rounded-full text-xs font-medium ${statusColors[s.status] || 'bg-gray-100'}">${s.status}</span>
      <span class="font-bold text-gray-800">${s.count || 0}</span>
    </div>
  `).join('');

  reportContent.innerHTML = `
    <div class="space-y-6">
      <!-- Summary Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <p class="text-sm text-blue-600 font-medium">Total Complaints</p>
          <p class="text-2xl font-bold text-blue-700">${summary?.total || 0}</p>
        </div>
        <div class="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
          <p class="text-sm text-yellow-600 font-medium">Pending</p>
          <p class="text-2xl font-bold text-yellow-700">${summary?.pending || 0}</p>
        </div>
        <div class="bg-green-50 rounded-xl p-4 border border-green-200">
          <p class="text-sm text-green-600 font-medium">Resolved</p>
          <p class="text-2xl font-bold text-green-700">${summary?.resolved || 0}</p>
        </div>
        <div class="bg-purple-50 rounded-xl p-4 border border-purple-200">
          <p class="text-sm text-purple-600 font-medium">Avg Resolution</p>
          <p class="text-2xl font-bold text-purple-700">${summary?.avgResolutionTime || 0}h</p>
        </div>
      </div>

      <!-- Status Breakdown -->
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <h3 class="font-semibold text-gray-800 mb-3">Status Breakdown</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          ${statusBadges}
        </div>
      </div>

      <!-- By Barangay Table -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 class="font-semibold text-gray-800">By Barangay</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Barangay</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Resolved</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Resolution Rate</th>
              </tr>
            </thead>
            <tbody>${barangayRows}</tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  lucide.createIcons();
}

// Chart management for reports
let reportCharts = {};

function destroyReportCharts() {
  Object.values(reportCharts).forEach(chart => {
    if (chart && typeof chart.destroy === 'function') {
      chart.destroy();
    }
  });
  reportCharts = {};
}

// Fuel Consumption Report
function renderFuelReport(data) {
  destroyReportCharts();
  const reportContent = document.getElementById('reportContent');
  const { summary, byTruck, byDriver, daily } = data;

  const truckRows = (byTruck || []).slice(0, 10).map(t => `
    <tr class="border-b border-gray-100 hover:bg-gray-50">
      <td class="px-4 py-3 font-medium text-gray-800">${t.truckName}</td>
      <td class="px-4 py-3 text-gray-600">${t.plateNumber}</td>
      <td class="px-4 py-3 text-gray-600">${t.litersConsumed} L</td>
      <td class="px-4 py-3 text-gray-600">${t.litersRefueled} L</td>
      <td class="px-4 py-3 text-gray-600">₱${t.totalCost.toLocaleString()}</td>
      <td class="px-4 py-3 text-gray-600">${t.distanceTraveled} km</td>
      <td class="px-4 py-3 text-gray-600">${t.efficiency} km/L</td>
    </tr>
  `).join('') || '<tr><td colspan="7" class="px-4 py-8 text-center text-gray-500">No data available</td></tr>';

  reportContent.innerHTML = `
    <div class="space-y-6">
      <!-- Summary Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <p class="text-sm text-blue-600 font-medium">Total Consumed</p>
          <p class="text-2xl font-bold text-blue-700">${summary?.totalLitersConsumed || 0} L</p>
        </div>
        <div class="bg-green-50 rounded-xl p-4 border border-green-200">
          <p class="text-sm text-green-600 font-medium">Total Refueled</p>
          <p class="text-2xl font-bold text-green-700">${summary?.totalLitersRefueled || 0} L</p>
        </div>
        <div class="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
          <p class="text-sm text-yellow-600 font-medium">Total Cost</p>
          <p class="text-2xl font-bold text-yellow-700">₱${(summary?.totalCost || 0).toLocaleString()}</p>
        </div>
        <div class="bg-purple-50 rounded-xl p-4 border border-purple-200">
          <p class="text-sm text-purple-600 font-medium">Avg Efficiency</p>
          <p class="text-2xl font-bold text-purple-700">${summary?.avgEfficiency || 0} km/L</p>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Daily Trend Chart -->
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <h3 class="font-semibold text-gray-800 mb-4">Daily Fuel Trend</h3>
          <div class="h-64">
            <canvas id="fuelDailyChart"></canvas>
          </div>
        </div>
        <!-- By Truck Chart -->
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <h3 class="font-semibold text-gray-800 mb-4">Consumption by Truck</h3>
          <div class="h-64">
            <canvas id="fuelTruckChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Truck Details Table -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 class="font-semibold text-gray-800">Fuel Usage by Truck</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Truck</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Plate</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Consumed</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Refueled</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Cost</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Distance</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Efficiency</th>
              </tr>
            </thead>
            <tbody>${truckRows}</tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  lucide.createIcons();

  // Create charts after DOM is ready
  setTimeout(() => {
    // Daily trend line chart
    const dailyCtx = document.getElementById('fuelDailyChart');
    if (dailyCtx && daily && daily.length > 0) {
      reportCharts.dailyChart = new Chart(dailyCtx, {
        type: 'line',
        data: {
          labels: daily.map(d => d.date),
          datasets: [
            {
              label: 'Consumption (L)',
              data: daily.map(d => d.consumption),
              borderColor: '#3B82F6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              fill: true,
              tension: 0.3
            },
            {
              label: 'Refuel (L)',
              data: daily.map(d => d.refuel),
              borderColor: '#10B981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              fill: true,
              tension: 0.3
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } },
          scales: { y: { beginAtZero: true } }
        }
      });
    }

    // By truck bar chart
    const truckCtx = document.getElementById('fuelTruckChart');
    if (truckCtx && byTruck && byTruck.length > 0) {
      const topTrucks = byTruck.slice(0, 8);
      reportCharts.truckChart = new Chart(truckCtx, {
        type: 'bar',
        data: {
          labels: topTrucks.map(t => t.plateNumber),
          datasets: [{
            label: 'Liters Consumed',
            data: topTrucks.map(t => t.litersConsumed),
            backgroundColor: '#3B82F6'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: { legend: { display: false } }
        }
      });
    }
  }, 100);
}

// Schedule Adherence Report
function renderScheduleReport(data) {
  destroyReportCharts();
  const reportContent = document.getElementById('reportContent');
  const { summary, bySchedule, byDriver, daily } = data;

  const adherenceColor = (summary?.adherenceRate || 0) >= 80 ? 'green' : (summary?.adherenceRate || 0) >= 50 ? 'yellow' : 'red';

  const scheduleRows = (bySchedule || []).map(s => `
    <tr class="border-b border-gray-100 hover:bg-gray-50">
      <td class="px-4 py-3 font-medium text-gray-800">${s.scheduleName}</td>
      <td class="px-4 py-3 text-gray-600">${s.expectedCount}</td>
      <td class="px-4 py-3 text-gray-600">${s.completedCount}</td>
      <td class="px-4 py-3">
        <span class="px-2 py-1 rounded-full text-xs font-medium ${s.adherenceRate >= 80 ? 'bg-green-100 text-green-700' : s.adherenceRate >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}">
          ${s.adherenceRate}%
        </span>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="4" class="px-4 py-8 text-center text-gray-500">No data available</td></tr>';

  reportContent.innerHTML = `
    <div class="space-y-6">
      <!-- Summary Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-${adherenceColor}-50 rounded-xl p-4 border border-${adherenceColor}-200">
          <p class="text-sm text-${adherenceColor}-600 font-medium">Adherence Rate</p>
          <p class="text-2xl font-bold text-${adherenceColor}-700">${summary?.adherenceRate || 0}%</p>
        </div>
        <div class="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <p class="text-sm text-blue-600 font-medium">Total Scheduled</p>
          <p class="text-2xl font-bold text-blue-700">${summary?.totalScheduled || 0}</p>
        </div>
        <div class="bg-green-50 rounded-xl p-4 border border-green-200">
          <p class="text-sm text-green-600 font-medium">Completed</p>
          <p class="text-2xl font-bold text-green-700">${summary?.totalCompleted || 0}</p>
        </div>
        <div class="bg-red-50 rounded-xl p-4 border border-red-200">
          <p class="text-sm text-red-600 font-medium">Missed</p>
          <p class="text-2xl font-bold text-red-700">${summary?.missedCollections || 0}</p>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Daily Trend Chart -->
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <h3 class="font-semibold text-gray-800 mb-4">Daily Adherence</h3>
          <div class="h-64">
            <canvas id="scheduleDailyChart"></canvas>
          </div>
        </div>
        <!-- Completion Pie Chart -->
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <h3 class="font-semibold text-gray-800 mb-4">Completion Status</h3>
          <div class="h-64">
            <canvas id="scheduleCompletionChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Schedule Details Table -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 class="font-semibold text-gray-800">Adherence by Schedule</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Schedule</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Expected</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Completed</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rate</th>
              </tr>
            </thead>
            <tbody>${scheduleRows}</tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  lucide.createIcons();

  // Create charts
  setTimeout(() => {
    // Daily adherence chart
    const dailyCtx = document.getElementById('scheduleDailyChart');
    if (dailyCtx && daily && daily.length > 0) {
      reportCharts.dailyChart = new Chart(dailyCtx, {
        type: 'bar',
        data: {
          labels: daily.map(d => d.date),
          datasets: [
            {
              label: 'Scheduled',
              data: daily.map(d => d.scheduled),
              backgroundColor: '#3B82F6'
            },
            {
              label: 'Completed',
              data: daily.map(d => d.completed),
              backgroundColor: '#10B981'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } },
          scales: { y: { beginAtZero: true } }
        }
      });
    }

    // Completion pie chart
    const completionCtx = document.getElementById('scheduleCompletionChart');
    if (completionCtx && summary) {
      reportCharts.completionChart = new Chart(completionCtx, {
        type: 'doughnut',
        data: {
          labels: ['Completed', 'Missed'],
          datasets: [{
            data: [summary.totalCompleted, summary.missedCollections],
            backgroundColor: ['#10B981', '#EF4444']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } }
        }
      });
    }
  }, 100);
}

// Fleet Utilization Report
function renderFleetReport(data) {
  destroyReportCharts();
  const reportContent = document.getElementById('reportContent');
  const { summary, byTruck, byType, byStatus } = data;

  const truckRows = (byTruck || []).map(t => `
    <tr class="border-b border-gray-100 hover:bg-gray-50">
      <td class="px-4 py-3 font-medium text-gray-800">${t.truckName}</td>
      <td class="px-4 py-3 text-gray-600">${t.plateNumber}</td>
      <td class="px-4 py-3">
        <span class="px-2 py-1 rounded-full text-xs font-medium ${t.status === 'available' ? 'bg-green-100 text-green-700' : t.status === 'in-use' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}">
          ${t.status}
        </span>
      </td>
      <td class="px-4 py-3 text-gray-600">${t.routesCompleted}</td>
      <td class="px-4 py-3 text-gray-600">${t.distanceTraveled} km</td>
      <td class="px-4 py-3 text-gray-600">${t.daysActive} days</td>
      <td class="px-4 py-3">
        <span class="px-2 py-1 rounded-full text-xs font-medium ${t.utilizationRate >= 50 ? 'bg-green-100 text-green-700' : t.utilizationRate >= 25 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}">
          ${t.utilizationRate}%
        </span>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="7" class="px-4 py-8 text-center text-gray-500">No data available</td></tr>';

  reportContent.innerHTML = `
    <div class="space-y-6">
      <!-- Summary Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <p class="text-sm text-blue-600 font-medium">Total Trucks</p>
          <p class="text-2xl font-bold text-blue-700">${summary?.totalTrucks || 0}</p>
        </div>
        <div class="bg-green-50 rounded-xl p-4 border border-green-200">
          <p class="text-sm text-green-600 font-medium">Active Trucks</p>
          <p class="text-2xl font-bold text-green-700">${summary?.activeTrucks || 0}</p>
        </div>
        <div class="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
          <p class="text-sm text-yellow-600 font-medium">Utilization Rate</p>
          <p class="text-2xl font-bold text-yellow-700">${summary?.utilizationRate || 0}%</p>
        </div>
        <div class="bg-purple-50 rounded-xl p-4 border border-purple-200">
          <p class="text-sm text-purple-600 font-medium">Total Distance</p>
          <p class="text-2xl font-bold text-purple-700">${summary?.totalDistance || 0} km</p>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Routes by Truck Chart -->
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <h3 class="font-semibold text-gray-800 mb-4">Routes by Truck</h3>
          <div class="h-64">
            <canvas id="fleetRoutesChart"></canvas>
          </div>
        </div>
        <!-- Status Distribution Chart -->
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <h3 class="font-semibold text-gray-800 mb-4">Fleet Status Distribution</h3>
          <div class="h-64">
            <canvas id="fleetStatusChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Truck Details Table -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 class="font-semibold text-gray-800">Fleet Details</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Truck</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Plate</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Routes</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Distance</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Active Days</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Utilization</th>
              </tr>
            </thead>
            <tbody>${truckRows}</tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  lucide.createIcons();

  // Create charts
  setTimeout(() => {
    // Routes by truck chart
    const routesCtx = document.getElementById('fleetRoutesChart');
    if (routesCtx && byTruck && byTruck.length > 0) {
      const topTrucks = byTruck.filter(t => t.routesCompleted > 0).slice(0, 10);
      reportCharts.routesChart = new Chart(routesCtx, {
        type: 'bar',
        data: {
          labels: topTrucks.map(t => t.plateNumber),
          datasets: [{
            label: 'Routes Completed',
            data: topTrucks.map(t => t.routesCompleted),
            backgroundColor: '#3B82F6'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } }
        }
      });
    }

    // Status distribution chart
    const statusCtx = document.getElementById('fleetStatusChart');
    if (statusCtx && byStatus && byStatus.length > 0) {
      const statusColors = {
        'available': '#10B981',
        'in-use': '#3B82F6',
        'maintenance': '#F59E0B',
        'out-of-service': '#EF4444'
      };
      reportCharts.statusChart = new Chart(statusCtx, {
        type: 'doughnut',
        data: {
          labels: byStatus.map(s => s.status),
          datasets: [{
            data: byStatus.map(s => s.count),
            backgroundColor: byStatus.map(s => statusColors[s.status] || '#6B7280')
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } }
        }
      });
    }
  }, 100);
}

window.exportReportPDF = function() {
  if (!currentReportData) {
    showToast('Please generate a report first', 'warning');
    return;
  }

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;

    // Header
    doc.setFontSize(20);
    doc.setTextColor(44, 62, 80);
    doc.text('Kolek-Ta Report', 14, 22);

    doc.setFontSize(12);
    doc.setTextColor(127, 140, 141);

    let reportTitle = '';
    switch (currentReportType) {
      case 'collection':
        reportTitle = 'Collection Summary Report';
        break;
      case 'driver':
        reportTitle = 'Driver Performance Report';
        break;
      case 'complaint':
        reportTitle = 'Complaint Analytics Report';
        break;
      case 'fuel':
        reportTitle = 'Fuel Consumption Report';
        break;
      case 'schedule':
        reportTitle = 'Schedule Adherence Report';
        break;
      case 'fleet':
        reportTitle = 'Fleet Utilization Report';
        break;
    }

    doc.text(reportTitle, 14, 30);
    doc.text(`Period: ${startDate} to ${endDate}`, 14, 36);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 42);

    doc.setDrawColor(52, 73, 94);
    doc.line(14, 46, 196, 46);

    let yPosition = 56;

    switch (currentReportType) {
      case 'collection':
        generateCollectionPDF(doc, currentReportData, yPosition);
        break;
      case 'driver':
        generateDriverPDF(doc, currentReportData, yPosition);
        break;
      case 'complaint':
        generateComplaintPDF(doc, currentReportData, yPosition);
        break;
      case 'fuel':
        generateFuelPDF(doc, currentReportData, yPosition);
        break;
      case 'schedule':
        generateSchedulePDF(doc, currentReportData, yPosition);
        break;
      case 'fleet':
        generateFleetPDF(doc, currentReportData, yPosition);
        break;
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(127, 140, 141);
      doc.text(`Page ${i} of ${pageCount}`, 14, 287);
      doc.text('Kolek-Ta Waste Collection Management System', 196, 287, { align: 'right' });
    }

    // Save
    const filename = `kolek-ta-${currentReportType}-report-${startDate}-to-${endDate}.pdf`;
    doc.save(filename);

    showToast('PDF exported successfully', 'success');
  } catch (error) {
    console.error('Error exporting PDF:', error);
    showToast('Error exporting PDF. Please try again.', 'error');
  }
};

function generateCollectionPDF(doc, data, y) {
  const { summary, byRoute } = data;

  // Summary section
  doc.setFontSize(14);
  doc.setTextColor(44, 62, 80);
  doc.text('Summary', 14, y);
  y += 8;

  doc.setFontSize(11);
  doc.setTextColor(52, 73, 94);
  doc.text(`Total Routes: ${summary?.totalRoutes || 0}`, 14, y);
  doc.text(`Completed Routes: ${summary?.completedRoutes || 0}`, 100, y);
  y += 6;
  doc.text(`Completion Rate: ${summary?.completionRate || 0}%`, 14, y);
  doc.text(`Total Distance: ${(summary?.totalDistance || 0).toFixed(2)} km`, 100, y);
  y += 6;
  doc.text(`Total Stops: ${summary?.totalStops || 0}`, 14, y);
  doc.text(`Fuel Consumed: ${(summary?.totalFuelConsumed || 0).toFixed(2)} L`, 100, y);
  y += 14;

  // Route breakdown table
  if (byRoute && byRoute.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(44, 62, 80);
    doc.text('Route Breakdown', 14, y);
    y += 4;

    doc.autoTable({
      startY: y,
      head: [['Route', 'Completions', 'Distance (km)', 'Stops']],
      body: byRoute.map(r => [
        r.routeName || r.routeId,
        r.completions || 0,
        (r.totalDistance || 0).toFixed(2),
        r.totalStops || 0
      ]),
      theme: 'striped',
      headStyles: { fillColor: [52, 73, 94] },
      styles: { fontSize: 10 }
    });
  }
}

function generateDriverPDF(doc, data, y) {
  const { drivers, summary } = data;

  // Summary section
  doc.setFontSize(14);
  doc.setTextColor(44, 62, 80);
  doc.text('Summary', 14, y);
  y += 8;

  doc.setFontSize(11);
  doc.setTextColor(52, 73, 94);
  doc.text(`Active Drivers: ${summary?.totalDrivers || 0}`, 14, y);
  doc.text(`Avg Routes/Driver: ${summary?.avgRoutesPerDriver || 0}`, 100, y);
  y += 6;
  doc.text(`Top Performer: ${summary?.topPerformer || '-'}`, 14, y);
  y += 14;

  // Drivers table
  if (drivers && drivers.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(44, 62, 80);
    doc.text('Driver Performance', 14, y);
    y += 4;

    doc.autoTable({
      startY: y,
      head: [['Driver', 'Routes', 'Distance (km)', 'Stops', 'Avg Speed', 'Fuel Eff.']],
      body: drivers.map(d => [
        d.fullName || d.username,
        d.routesCompleted || 0,
        (d.totalDistance || 0).toFixed(2),
        d.totalStops || 0,
        `${(d.avgSpeed || 0).toFixed(1)} km/h`,
        d.fuelEfficiency > 0 ? `${d.fuelEfficiency.toFixed(2)} km/L` : '-'
      ]),
      theme: 'striped',
      headStyles: { fillColor: [52, 73, 94] },
      styles: { fontSize: 9 }
    });
  }
}

function generateComplaintPDF(doc, data, y) {
  const { summary, byBarangay, byStatus } = data;

  // Summary section
  doc.setFontSize(14);
  doc.setTextColor(44, 62, 80);
  doc.text('Summary', 14, y);
  y += 8;

  doc.setFontSize(11);
  doc.setTextColor(52, 73, 94);
  doc.text(`Total Complaints: ${summary?.total || 0}`, 14, y);
  doc.text(`Pending: ${summary?.pending || 0}`, 100, y);
  y += 6;
  doc.text(`In Progress: ${summary?.inProgress || 0}`, 14, y);
  doc.text(`Resolved: ${summary?.resolved || 0}`, 100, y);
  y += 6;
  doc.text(`Avg Resolution Time: ${summary?.avgResolutionTime || 0} hours`, 14, y);
  y += 14;

  // Status breakdown
  if (byStatus && byStatus.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(44, 62, 80);
    doc.text('Status Breakdown', 14, y);
    y += 4;

    doc.autoTable({
      startY: y,
      head: [['Status', 'Count']],
      body: byStatus.map(s => [s.status, s.count || 0]),
      theme: 'striped',
      headStyles: { fillColor: [52, 73, 94] },
      styles: { fontSize: 10 }
    });

    y = doc.lastAutoTable.finalY + 10;
  }

  // Barangay breakdown
  if (byBarangay && byBarangay.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(44, 62, 80);
    doc.text('By Barangay', 14, y);
    y += 4;

    doc.autoTable({
      startY: y,
      head: [['Barangay', 'Total', 'Resolved', 'Resolution Rate']],
      body: byBarangay.map(b => [
        b.barangay || 'Unknown',
        b.count || 0,
        b.resolved || 0,
        `${b.count > 0 ? Math.round((b.resolved / b.count) * 100) : 0}%`
      ]),
      theme: 'striped',
      headStyles: { fillColor: [52, 73, 94] },
      styles: { fontSize: 10 }
    });
  }
}

// Fuel Consumption PDF
function generateFuelPDF(doc, data, y) {
  const { summary, byTruck } = data;

  // Summary section
  doc.setFontSize(14);
  doc.setTextColor(44, 62, 80);
  doc.text('Summary', 14, y);
  y += 8;

  doc.setFontSize(11);
  doc.setTextColor(52, 73, 94);
  doc.text(`Total Consumed: ${summary?.totalLitersConsumed || 0} L`, 14, y);
  doc.text(`Total Refueled: ${summary?.totalLitersRefueled || 0} L`, 100, y);
  y += 6;
  doc.text(`Total Cost: PHP ${(summary?.totalCost || 0).toLocaleString()}`, 14, y);
  doc.text(`Avg Efficiency: ${summary?.avgEfficiency || 0} km/L`, 100, y);
  y += 6;
  doc.text(`Total Distance: ${summary?.totalDistance || 0} km`, 14, y);
  doc.text(`Cost per km: PHP ${summary?.avgCostPerKm || 0}`, 100, y);
  y += 14;

  // By Truck table
  if (byTruck && byTruck.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(44, 62, 80);
    doc.text('Fuel Usage by Truck', 14, y);
    y += 4;

    doc.autoTable({
      startY: y,
      head: [['Truck', 'Plate', 'Consumed', 'Refueled', 'Cost', 'Distance', 'Efficiency']],
      body: byTruck.map(t => [
        t.truckName,
        t.plateNumber,
        `${t.litersConsumed} L`,
        `${t.litersRefueled} L`,
        `PHP ${t.totalCost.toLocaleString()}`,
        `${t.distanceTraveled} km`,
        `${t.efficiency} km/L`
      ]),
      theme: 'striped',
      headStyles: { fillColor: [52, 73, 94] },
      styles: { fontSize: 9 }
    });
  }
}

// Schedule Adherence PDF
function generateSchedulePDF(doc, data, y) {
  const { summary, bySchedule, byDriver } = data;

  // Summary section
  doc.setFontSize(14);
  doc.setTextColor(44, 62, 80);
  doc.text('Summary', 14, y);
  y += 8;

  doc.setFontSize(11);
  doc.setTextColor(52, 73, 94);
  doc.text(`Adherence Rate: ${summary?.adherenceRate || 0}%`, 14, y);
  doc.text(`Total Scheduled: ${summary?.totalScheduled || 0}`, 100, y);
  y += 6;
  doc.text(`Completed: ${summary?.totalCompleted || 0}`, 14, y);
  doc.text(`Missed: ${summary?.missedCollections || 0}`, 100, y);
  y += 14;

  // By Schedule table
  if (bySchedule && bySchedule.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(44, 62, 80);
    doc.text('Adherence by Schedule', 14, y);
    y += 4;

    doc.autoTable({
      startY: y,
      head: [['Schedule', 'Expected', 'Completed', 'Rate']],
      body: bySchedule.map(s => [
        s.scheduleName,
        s.expectedCount,
        s.completedCount,
        `${s.adherenceRate}%`
      ]),
      theme: 'striped',
      headStyles: { fillColor: [52, 73, 94] },
      styles: { fontSize: 10 }
    });

    y = doc.lastAutoTable.finalY + 10;
  }

  // By Driver table
  if (byDriver && byDriver.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(44, 62, 80);
    doc.text('Adherence by Driver', 14, y);
    y += 4;

    doc.autoTable({
      startY: y,
      head: [['Driver', 'Assigned', 'Completed', 'Rate']],
      body: byDriver.map(d => [
        d.fullName,
        d.assignedCount,
        d.completedCount,
        `${d.adherenceRate}%`
      ]),
      theme: 'striped',
      headStyles: { fillColor: [52, 73, 94] },
      styles: { fontSize: 10 }
    });
  }
}

// Fleet Utilization PDF
function generateFleetPDF(doc, data, y) {
  const { summary, byTruck, byStatus } = data;

  // Summary section
  doc.setFontSize(14);
  doc.setTextColor(44, 62, 80);
  doc.text('Summary', 14, y);
  y += 8;

  doc.setFontSize(11);
  doc.setTextColor(52, 73, 94);
  doc.text(`Total Trucks: ${summary?.totalTrucks || 0}`, 14, y);
  doc.text(`Active Trucks: ${summary?.activeTrucks || 0}`, 100, y);
  y += 6;
  doc.text(`Utilization Rate: ${summary?.utilizationRate || 0}%`, 14, y);
  doc.text(`Total Distance: ${summary?.totalDistance || 0} km`, 100, y);
  y += 6;
  doc.text(`Avg Distance/Truck: ${summary?.avgDistancePerTruck || 0} km`, 14, y);
  y += 14;

  // Status breakdown
  if (byStatus && byStatus.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(44, 62, 80);
    doc.text('Fleet Status', 14, y);
    y += 4;

    doc.autoTable({
      startY: y,
      head: [['Status', 'Count']],
      body: byStatus.map(s => [s.status, s.count]),
      theme: 'striped',
      headStyles: { fillColor: [52, 73, 94] },
      styles: { fontSize: 10 }
    });

    y = doc.lastAutoTable.finalY + 10;
  }

  // By Truck table
  if (byTruck && byTruck.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(44, 62, 80);
    doc.text('Fleet Details', 14, y);
    y += 4;

    doc.autoTable({
      startY: y,
      head: [['Truck', 'Plate', 'Status', 'Routes', 'Distance', 'Days Active', 'Utilization']],
      body: byTruck.map(t => [
        t.truckName,
        t.plateNumber,
        t.status,
        t.routesCompleted,
        `${t.distanceTraveled} km`,
        t.daysActive,
        `${t.utilizationRate}%`
      ]),
      theme: 'striped',
      headStyles: { fillColor: [52, 73, 94] },
      styles: { fontSize: 9 }
    });
  }
}

// Make reports functions globally accessible
window.showReportsModule = showReportsModule;

// ============================================
// ANALYTICS MODULE - Heatmap Visualization
// ============================================

let analyticsMap = null;
let coverageHeatLayer = null;
let complaintHeatLayer = null;
let barangayMarkers = [];
let currentAnalyticsData = null;

// Heatmap configurations
const coverageHeatConfig = {
  radius: 25,
  blur: 15,
  maxZoom: 17,
  gradient: {
    0.0: '#10B981',
    0.5: '#34D399',
    0.8: '#6EE7B7',
    1.0: '#A7F3D0'
  }
};

const complaintHeatConfig = {
  radius: 30,
  blur: 20,
  maxZoom: 17,
  gradient: {
    0.0: '#FEE2E2',
    0.4: '#FECACA',
    0.7: '#F87171',
    1.0: '#DC2626'
  }
};

async function showAnalyticsModule() {
  if (user?.role !== 'admin') {
    showToast('Admin access required', 'error');
    return;
  }

  setActiveSidebarButton('analyticsBtn');
  showPageContent();

  const pageContent = document.getElementById('pageContent');
  if (!pageContent) return;

  // Default date range: last 30 days
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  pageContent.innerHTML = `
    <div class="max-w-7xl mx-auto">
      <!-- Header with date range filter -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-800">Service Analytics</h2>
          <p class="text-gray-500 mt-1">Heatmap analysis of collection coverage and complaints</p>
        </div>
        <div class="flex flex-wrap gap-3 items-center">
          <input type="date" id="analyticsStartDate" value="${startDate}" class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
          <span class="text-gray-500">to</span>
          <input type="date" id="analyticsEndDate" value="${endDate}" class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
          <button onclick="loadAnalyticsData()" class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2">
            <i data-lucide="refresh-cw" class="w-4 h-4"></i>
            Apply
          </button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div id="analyticsSummary" class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p class="text-sm text-gray-500 mb-1">Route Completions</p>
          <p id="totalRouteCompletions" class="text-2xl font-bold text-primary-600">-</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p class="text-sm text-gray-500 mb-1">Total Complaints</p>
          <p id="totalComplaints" class="text-2xl font-bold text-red-600">-</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p class="text-sm text-gray-500 mb-1">Avg Service Score</p>
          <p id="avgServiceScore" class="text-2xl font-bold text-gray-800">-</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p class="text-sm text-gray-500 mb-1">Well-Served Areas</p>
          <p id="wellServedCount" class="text-2xl font-bold text-green-600">-</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p class="text-sm text-gray-500 mb-1">Underserved Areas</p>
          <p id="underservedCount" class="text-2xl font-bold text-orange-600">-</p>
        </div>
      </div>

      <!-- Layer Toggle Controls -->
      <div class="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <h3 class="font-semibold text-gray-800 mb-3">Map Layers</h3>
        <div class="flex flex-wrap gap-6">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" id="showCoverageHeat" checked class="w-4 h-4 text-green-600 rounded focus:ring-green-500">
            <span class="flex items-center gap-2">
              <span class="w-4 h-4 rounded bg-gradient-to-r from-green-500 to-green-200"></span>
              Collection Coverage
            </span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" id="showComplaintHeat" checked class="w-4 h-4 text-red-600 rounded focus:ring-red-500">
            <span class="flex items-center gap-2">
              <span class="w-4 h-4 rounded bg-gradient-to-r from-red-500 to-red-200"></span>
              Complaint Hotspots
            </span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" id="showBarangayOverlay" checked class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500">
            <span>Barangay Markers</span>
          </label>
        </div>
      </div>

      <!-- Heatmap Container -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div id="analyticsMap" style="height: 500px; width: 100%;"></div>
      </div>

      <!-- Barangay Rankings Table -->
      <div class="bg-white rounded-xl border border-gray-200 p-6">
        <h3 class="font-semibold text-gray-800 mb-4">Barangay Service Rankings</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left font-semibold text-gray-600">Rank</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-600">Barangay</th>
                <th class="px-4 py-3 text-center font-semibold text-gray-600">Route Points</th>
                <th class="px-4 py-3 text-center font-semibold text-gray-600">Complaints</th>
                <th class="px-4 py-3 text-center font-semibold text-gray-600">Service Score</th>
                <th class="px-4 py-3 text-center font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody id="barangayRankingsBody">
              <tr>
                <td colspan="6" class="px-4 py-8 text-center text-gray-500">Loading analytics data...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // Initialize the map
  initAnalyticsMap();

  // Add layer toggle event listeners
  setupLayerToggles();

  // Load initial data
  await loadAnalyticsData();
}

function initAnalyticsMap() {
  // Destroy existing map if any
  if (analyticsMap) {
    analyticsMap.remove();
    analyticsMap = null;
  }

  // Clear layers
  coverageHeatLayer = null;
  complaintHeatLayer = null;
  barangayMarkers = [];

  // Create new map centered on Mati City
  const mapContainer = document.getElementById('analyticsMap');
  if (!mapContainer) return;

  analyticsMap = L.map('analyticsMap').setView([6.9549, 126.2185], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(analyticsMap);
}

async function loadAnalyticsData() {
  const startDate = document.getElementById('analyticsStartDate')?.value;
  const endDate = document.getElementById('analyticsEndDate')?.value;

  if (!startDate || !endDate) {
    showToast('Please select a date range', 'error');
    return;
  }

  try {
    const response = await fetch(`/api/reports/analytics-data?startDate=${startDate}&endDate=${endDate}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    if (!response.ok) throw new Error('Failed to fetch analytics data');

    const data = await response.json();
    currentAnalyticsData = data;

    // Update summary cards
    updateAnalyticsSummary(data.summary);

    // Render heatmaps
    renderCoverageHeatmap(data.routePoints);
    renderComplaintHeatmap(data.complaintPoints);
    renderBarangayOverlay(data.barangayStats);

    // Render rankings table
    renderBarangayTable(data.barangayStats);

  } catch (error) {
    console.error('Error loading analytics data:', error);
    showToast('Failed to load analytics data', 'error');
  }
}

function updateAnalyticsSummary(summary) {
  const setElement = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  setElement('totalRouteCompletions', summary.totalRouteCompletions || 0);
  setElement('totalComplaints', summary.totalComplaints || 0);
  setElement('avgServiceScore', summary.avgServiceScore ? `${summary.avgServiceScore}/100` : '-');
  setElement('wellServedCount', summary.wellServedCount || 0);
  setElement('underservedCount', summary.underservedCount || 0);
}

function renderCoverageHeatmap(points) {
  if (!analyticsMap || !points || points.length === 0) return;

  // Remove existing layer
  if (coverageHeatLayer) {
    analyticsMap.removeLayer(coverageHeatLayer);
  }

  // Convert points to heatmap format [lat, lng, intensity]
  const heatData = points.map(p => [p.lat, p.lng, p.intensity || 1]);

  coverageHeatLayer = L.heatLayer(heatData, coverageHeatConfig);

  // Only add if checkbox is checked
  const showCoverage = document.getElementById('showCoverageHeat');
  if (showCoverage && showCoverage.checked) {
    coverageHeatLayer.addTo(analyticsMap);
  }
}

function renderComplaintHeatmap(points) {
  if (!analyticsMap || !points || points.length === 0) return;

  // Remove existing layer
  if (complaintHeatLayer) {
    analyticsMap.removeLayer(complaintHeatLayer);
  }

  // Weight by severity: high=3, medium=2, low=1
  const severityWeight = { high: 3, medium: 2, low: 1 };
  const heatData = points.map(p => [
    p.lat,
    p.lng,
    severityWeight[p.severity] || 1
  ]);

  complaintHeatLayer = L.heatLayer(heatData, complaintHeatConfig);

  // Only add if checkbox is checked
  const showComplaints = document.getElementById('showComplaintHeat');
  if (showComplaints && showComplaints.checked) {
    complaintHeatLayer.addTo(analyticsMap);
  }
}

function renderBarangayOverlay(barangayStats) {
  if (!analyticsMap || !barangayStats) return;

  // Clear existing markers
  barangayMarkers.forEach(m => analyticsMap.removeLayer(m));
  barangayMarkers = [];

  barangayStats.forEach((b, index) => {
    const color = b.status === 'well-served' ? '#10B981' :
                  b.status === 'moderate' ? '#F59E0B' : '#EF4444';

    const marker = L.circleMarker([b.center.lat, b.center.lng], {
      radius: 12,
      fillColor: color,
      fillOpacity: 0.7,
      color: '#fff',
      weight: 2
    });

    marker.bindPopup(`
      <div class="text-center p-2">
        <strong class="text-lg">${b.name}</strong><br>
        <div class="mt-2 text-sm">
          <p><span class="font-medium">Service Score:</span> ${b.serviceScore}/100</p>
          <p><span class="font-medium">Route Points:</span> ${b.routeCompletions}</p>
          <p><span class="font-medium">Complaints:</span> ${b.complaints}</p>
          <p class="mt-2">
            <span class="inline-block px-2 py-1 rounded text-white text-xs" style="background-color: ${color}">
              ${b.status.replace('-', ' ').toUpperCase()}
            </span>
          </p>
        </div>
      </div>
    `);

    barangayMarkers.push(marker);
  });

  // Only add if checkbox is checked
  const showBarangays = document.getElementById('showBarangayOverlay');
  if (showBarangays && showBarangays.checked) {
    barangayMarkers.forEach(m => m.addTo(analyticsMap));
  }
}

function renderBarangayTable(barangayStats) {
  const tbody = document.getElementById('barangayRankingsBody');
  if (!tbody || !barangayStats) return;

  if (barangayStats.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-8 text-center text-gray-500">No data available for the selected period</td></tr>';
    return;
  }

  tbody.innerHTML = barangayStats.map((b, index) => {
    const statusColor = b.status === 'well-served' ? 'bg-green-100 text-green-800' :
                        b.status === 'moderate' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';
    const statusText = b.status.replace('-', ' ').charAt(0).toUpperCase() + b.status.slice(1).replace('-', ' ');

    return `
      <tr class="border-b border-gray-100 hover:bg-gray-50">
        <td class="px-4 py-3 font-medium text-gray-800">#${index + 1}</td>
        <td class="px-4 py-3 font-medium text-gray-800">${b.name}</td>
        <td class="px-4 py-3 text-center text-gray-600">${b.routeCompletions}</td>
        <td class="px-4 py-3 text-center text-gray-600">${b.complaints}</td>
        <td class="px-4 py-3 text-center">
          <span class="font-semibold ${b.serviceScore >= 70 ? 'text-green-600' : b.serviceScore >= 40 ? 'text-yellow-600' : 'text-red-600'}">
            ${b.serviceScore}
          </span>
        </td>
        <td class="px-4 py-3 text-center">
          <span class="px-2 py-1 rounded-full text-xs font-medium ${statusColor}">
            ${statusText}
          </span>
        </td>
      </tr>
    `;
  }).join('');
}

function setupLayerToggles() {
  // Coverage heat toggle
  const showCoverageHeat = document.getElementById('showCoverageHeat');
  if (showCoverageHeat) {
    showCoverageHeat.addEventListener('change', (e) => {
      if (!analyticsMap || !coverageHeatLayer) return;
      if (e.target.checked) {
        coverageHeatLayer.addTo(analyticsMap);
      } else {
        analyticsMap.removeLayer(coverageHeatLayer);
      }
    });
  }

  // Complaint heat toggle
  const showComplaintHeat = document.getElementById('showComplaintHeat');
  if (showComplaintHeat) {
    showComplaintHeat.addEventListener('change', (e) => {
      if (!analyticsMap || !complaintHeatLayer) return;
      if (e.target.checked) {
        complaintHeatLayer.addTo(analyticsMap);
      } else {
        analyticsMap.removeLayer(complaintHeatLayer);
      }
    });
  }

  // Barangay overlay toggle
  const showBarangayOverlay = document.getElementById('showBarangayOverlay');
  if (showBarangayOverlay) {
    showBarangayOverlay.addEventListener('change', (e) => {
      if (!analyticsMap) return;
      barangayMarkers.forEach(m => {
        if (e.target.checked) {
          m.addTo(analyticsMap);
        } else {
          analyticsMap.removeLayer(m);
        }
      });
    });
  }
}

// Make analytics functions globally accessible
window.showAnalyticsModule = showAnalyticsModule;
window.loadAnalyticsData = loadAnalyticsData;
