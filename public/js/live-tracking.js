(function() {
  'use strict';

  
  
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
    
    // Update every 5 seconds for real-time tracking
    if (trackingUpdateInterval) {
      clearInterval(trackingUpdateInterval);
    }
    trackingUpdateInterval = setInterval(updateLiveTruckLocations, 5000);
  }
  
  async function updateLiveTruckLocations() {
    try {
      const token = localStorage.getItem('token');
      // Use new endpoint that shows ALL assigned trucks
      const response = await fetchWithRetry(`${API_URL}/tracking/all-trucks`, {
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
        <h4 style="margin: 0 0 0.5rem 0; color: #333; font-size: 1.1rem;">🚛 ${escapeHtml(truckId)}</h4>
        <div style="background: ${statusColor}; color: white; padding: 0.3rem 0.6rem; border-radius: 12px; display: inline-block; font-size: 0.8rem; margin-bottom: 0.5rem; font-weight: 600;">
          ${statusText}
        </div>
        <div style="background: #f5f5f5; padding: 0.5rem; border-radius: 8px; margin: 0.5rem 0;">
          <p style="margin: 0.25rem 0; font-size: 0.85rem;">
            <strong>👤 Driver:</strong> ${escapeHtml(fullName || username)}
          </p>
          <p style="margin: 0.25rem 0; font-size: 0.85rem;">
            <strong>🚗 Plate:</strong> ${escapeHtml(plateNumber)}
          </p>
          <p style="margin: 0.25rem 0; font-size: 0.85rem;">
            <strong>📦 Model:</strong> ${escapeHtml(model)}
          </p>
          <p style="margin: 0.25rem 0; font-size: 0.85rem;">
            <strong>🛣️ Route:</strong> ${escapeHtml(routeName || 'Not assigned')}
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
        const response = await fetchWithRetry(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
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

    // Show map view instead of page content
    showMapView();
  
    // Clear existing markers
    clearTempMarkers();
  
    try {
      const token = localStorage.getItem('token');
      const response = await fetchWithRetry(`${API_URL}/tracking/all-trucks`, {
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
                <p class="font-bold text-gray-800">${escapeHtml(truckId)}</p>
                <p class="text-xs text-green-600 flex items-center gap-1">
                  <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Live
                </p>
              </div>
            </div>
            <div class="space-y-2 text-sm mb-3">
              <div class="flex items-center gap-2">
                <i data-lucide="user" class="w-4 h-4 text-gray-400"></i>
                <span class="font-medium text-gray-700">${escapeHtml(fullName || username)}</span>
              </div>
              <div class="flex items-center gap-2">
                <i data-lucide="route" class="w-4 h-4 text-gray-400"></i>
                <span class="font-medium ${routeId ? 'text-primary-600' : 'text-gray-400'}">${escapeHtml(routeName || 'Not assigned')}</span>
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
  
    } catch (error) {
      console.error('Error loading truck tracking:', error);
      showToast('Error loading truck data: ' + error.message, 'error');
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
          const { truckId, fullName, username, isLive, speed, lat, lng, routeName, routeId, timestamp } = truck;
          const lastSeen = timestamp ? getTimeAgo(timestamp) : 'Unknown';
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
                  <p class="font-semibold text-gray-800 truncate group-hover:text-primary-700">${escapeHtml(truckId)}</p>
                  <p class="text-xs text-gray-500 truncate">${escapeHtml(fullName || username)}</p>
                </div>
                <div class="text-right flex-shrink-0">
                  ${isLive ? `
                    <p class="text-sm font-bold text-green-600">${Math.round((speed || 0) * 3.6)} km/h</p>
                    <p class="text-xs text-green-500">Last seen: ${lastSeen}</p>
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
                  <span class="truncate">${escapeHtml(routeName)}</span>
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
        const response = await fetchWithRetry(`${API_URL}/routes/${routeId}`, {
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
  

  // Expose to global scope
  window.showLiveTruckLocations = showLiveTruckLocations;
  window.updateLiveTruckLocations = updateLiveTruckLocations;
  window.createTruckPopup = createTruckPopup;
  window.createLiveTrackingPanel = createLiveTrackingPanel;
  window.clearRouteOnlyMarkers = clearRouteOnlyMarkers;
  window.showTruckInfoPanel = showTruckInfoPanel;
  window.getTimeAgo = getTimeAgo;
  window.getCachedLocationName = getCachedLocationName;
  window.geocodeLocation = geocodeLocation;
})();
