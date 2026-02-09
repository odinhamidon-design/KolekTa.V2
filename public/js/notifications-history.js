(function() {
  'use strict';

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
      const response = await fetchWithRetry(`${API_URL}/completions/notifications/pending`, {
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
              <h4 style="margin: 0; color: #4caf50; font-size: 1.2rem;">✓ ${escapeHtml(route.completedBy)}</h4>
              <p style="margin: 0.25rem 0 0 0; color: #666; font-size: 0.85rem;">completed <strong>${escapeHtml(route.name)}</strong></p>
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
      const response = await fetchWithRetry(`${API_URL}/completions/${routeId}`, {
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
      
      showModal(`✓ ${escapeHtml(route.name || 'Route Completed')}`, `
        <div style="padding: 0.5rem;">
          <div style="background: #e8f5e9; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
            <p style="margin: 0.5rem 0;"><strong>Route ID:</strong> ${escapeHtml(route.routeId)}</p>
            <p style="margin: 0.5rem 0;"><strong>👤 Driver:</strong> ${escapeHtml(route.completedBy)}</p>
            <p style="margin: 0.5rem 0;"><strong>🕐 Completed:</strong> ${completedDate}</p>
            ${route.completionNotes ? `<p style="margin: 0.5rem 0;"><strong>📝 Notes:</strong> ${escapeHtml(route.completionNotes)}</p>` : ''}
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
      const response = await fetchWithRetry(`${API_URL}/completions/notifications/${routeId}/read`, {
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
      const response = await fetchWithRetry(`${API_URL}/routes/${routeId}`, {
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
      const notificationsRes = await fetchWithRetry(`${API_URL}/completions/notifications/pending`, {
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
  
      // Include photos to get accurate photo count for completion history
      const response = await fetchWithRetry(`${API_URL}/routes?includePhotos=true`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
  
      const routes = await response.json();
      const completedRoutes = routes.filter(r => r.status === 'completed' && r.completedAt);
      completedRoutes.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
  
      // Stats
      const acknowledgedCount = completedRoutes.filter(r => r.notificationSent).length;
      const pendingCount = completedRoutes.filter(r => !r.notificationSent).length;
      const withPhotosCount = completedRoutes.filter(r => (r.photoCount && r.photoCount > 0) || (r.completionPhotos && r.completionPhotos.length > 0)).length;
  
      const historyCards = completedRoutes.map(route => {
        const completedDate = new Date(route.completedAt).toLocaleDateString('en-US', {
          year: 'numeric', month: 'short', day: 'numeric'
        });
        const completedTime = new Date(route.completedAt).toLocaleTimeString('en-US', {
          hour: '2-digit', minute: '2-digit'
        });
        const isAcknowledged = route.notificationSent;
        const photoCount = route.photoCount || (route.completionPhotos ? route.completionPhotos.length : 0);
  
        return `
          <div class="bg-white rounded-xl shadow-sm border ${isAcknowledged ? 'border-gray-100' : 'border-green-200'} overflow-hidden">
            <!-- Card Header -->
            <div class="flex items-center justify-between px-5 py-4 ${isAcknowledged ? 'bg-gray-50' : 'bg-green-50'} border-b ${isAcknowledged ? 'border-gray-100' : 'border-green-100'}">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full ${isAcknowledged ? 'bg-gray-200' : 'bg-green-100'} flex items-center justify-center">
                  <i data-lucide="${isAcknowledged ? 'check-circle' : 'bell'}" class="w-5 h-5 ${isAcknowledged ? 'text-gray-600' : 'text-green-600'}"></i>
                </div>
                <div>
                  <h3 class="font-semibold ${isAcknowledged ? 'text-gray-700' : 'text-green-700'}">${escapeHtml(route.name || 'Unnamed Route')}</h3>
                  <p class="text-sm text-gray-500">${escapeHtml(route.routeId)}</p>
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
                    <span class="font-medium text-gray-800">${escapeHtml(route.completedBy || 'Unknown')}</span>
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
                  <p class="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">${escapeHtml(route.completionNotes)}</p>
                </div>
              ` : ''}
  
              ${photoCount > 0 ? `
                <div>
                  <button onclick="viewCompletionPhotos('${String(route._id || route.routeId)}')"
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
      const response = await fetchWithRetry(`${API_URL}/routes/${routeId}?includePhotos=true`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
  
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned ${response.status}`);
      }
  
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
  
      showModal(`Completion Photos - ${escapeHtml(route.name || route.routeId)}`, `
        <div class="space-y-4">
          <p class="text-sm text-gray-500">Completed by <strong>${escapeHtml(route.completedBy || 'Unknown')}</strong> on ${new Date(route.completedAt).toLocaleDateString()}</p>
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
      const response = await fetchWithRetry(`${API_URL}/routes/${routeId}`, {
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
      const response = await fetchWithRetry(`${API_URL}/routes`, {
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
      const notificationsRes = await fetchWithRetry(`${API_URL}/completions/notifications/pending`, {
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

  // Expose to global scope
  window.createNotificationIcon = createNotificationIcon;
  window.checkCompletionNotifications = checkCompletionNotifications;
  window.showCompletionNotifications = showCompletionNotifications;
  window.showNotificationDetails = showNotificationDetails;
  window.saveNotificationToHistory = saveNotificationToHistory;
})();
