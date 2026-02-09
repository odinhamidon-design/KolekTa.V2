(function() {
  'use strict';

  async function loadDriverAssignments() {
    const container = document.getElementById('driverAssignments');
    let isOfflineData = false;
  
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
  
      let routes = [];
      let trucks = [];
  
      // Try to fetch from network first
      if (navigator.onLine) {
        try {
          const [routesRes, trucksRes] = await Promise.all([
            fetch(`${API_URL}/routes`, { headers }),
            fetch(`${API_URL}/trucks`, { headers })
          ]);
  
          if (!routesRes.ok || !trucksRes.ok) {
            throw new Error('Failed to load data from network');
          }
  
          routes = await routesRes.json();
          trucks = await trucksRes.json();
  
          // Cache to IndexedDB for offline access
          if (typeof OfflineDB !== 'undefined') {
            try {
              await OfflineDB.saveRoutes(routes);
              await OfflineDB.saveTrucks(trucks);
              console.log('📦 Cached routes and trucks to IndexedDB');
            } catch (cacheError) {
              console.warn('Failed to cache to IndexedDB:', cacheError);
            }
          }
        } catch (networkError) {
          console.warn('Network fetch failed, trying offline cache:', networkError);
          // Fall through to offline fallback
        }
      }
  
      // Fallback to IndexedDB if no data yet (offline or network error)
      if (routes.length === 0 && typeof OfflineDB !== 'undefined') {
        try {
          routes = await OfflineDB.getRoutes();
          trucks = await OfflineDB.getTrucks();
          isOfflineData = routes.length > 0;
          if (isOfflineData) {
            console.log('📦 Loaded routes and trucks from IndexedDB cache');
            showToast('Showing cached data (offline)', 'warning');
          }
        } catch (offlineError) {
          console.error('Failed to load from IndexedDB:', offlineError);
        }
      }
  
      // If still no data, show error
      if (routes.length === 0 && trucks.length === 0) {
        throw new Error('No data available');
      }
  
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
                  <p class="font-semibold text-gray-800 truncate">${escapeHtml(truck.truckId)}</p>
                  <p class="text-xs text-gray-500">${escapeHtml(truck.plateNumber)} • ${escapeHtml(truck.model)}</p>
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
                  <p class="font-semibold text-gray-800 truncate">${escapeHtml(route.name || 'Unnamed Route')}</p>
                  <p class="text-xs text-gray-500">${escapeHtml(route.routeId)}</p>
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
  
      // Auto-refresh handled by DriverState.startAutoRefresh()
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
      const response = await fetchWithRetry(`${API_URL}/routes/${routeId}`, {
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
      const response = await fetchWithRetry(`${API_URL}/routes/${routeId}`, {
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
      await fetchWithRetry(`${API_URL}/routes/${routeId}`, {
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
      if (typeof DriverState !== 'undefined') {
        DriverState.refreshAssignments();
        DriverState.setGPSState(true);
      }
  
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
    if (typeof DriverState !== 'undefined') {
      DriverState.refreshAssignments();
      DriverState.setGPSState(false);
    }

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
          const response = await fetchWithRetry(`${API_URL}/completions/${routeId}/complete`, {
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
                await fetchWithRetry(`${API_URL}/tracking/end-trip`, {
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
            stopGPSTracking();
            if (typeof DriverState !== 'undefined') {
              DriverState.setGPSState(false);
              DriverState.refreshAssignments();
            }
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
      const response = await fetchWithRetry(`${API_URL}/routes/${routeId}`, {
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
          const updateResponse = await fetchWithRetry(`${API_URL}/routes/${routeId}`, {
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
  

  // Expose to global scope
  window.loadDriverAssignments = loadDriverAssignments;
})();
