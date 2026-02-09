(function() {
  'use strict';

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
      const response = await fetchWithRetry(`${API_URL}/routes`, {
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
  
      const response = await fetchWithRetry(url);
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
  
      const response = await fetchWithRetry(url);
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
      const response = await fetchWithRetry(`${API_URL}/routes`, {
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
        destEl.innerHTML = `<i data-lucide="map-pin" class="w-4 h-4 inline"></i> ${escapeHtml(destination.name)} - ${escapeHtml(destination.routeName)}`;
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
      destEl.innerHTML = `<i data-lucide="map-pin" class="w-4 h-4 inline"></i> ${escapeHtml(nextDestination.name)}`;
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
    const token = localStorage.getItem('token');
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const accuracy = position.coords.accuracy;
    const speed = (position.coords.speed || 0) * 3.6; // Convert m/s to km/h
    const heading = position.coords.heading || 0;
    const routeId = getCurrentActiveRoute();
  
    const gpsData = {
      lat: lat,
      lng: lng,
      speed: speed,
      heading: heading,
      routeId: routeId
    };
  
    // If offline, queue the GPS point
    if (!navigator.onLine) {
      console.log('📵 Offline - queueing GPS point locally');
      if (typeof OfflineDB !== 'undefined') {
        try {
          await OfflineDB.queueGPSPoint(gpsData);
          console.log('📦 GPS point queued to IndexedDB');
          offlineQueue.updateSyncIndicator();
        } catch (e) {
          console.error('Failed to queue GPS point:', e);
        }
      }
      return;
    }
  
    try {
      console.log(`📤 Sending GPS to server: ${lat}, ${lng} (accuracy: ${accuracy}m, speed: ${speed.toFixed(1)}km/h)`);
  
      const response = await fetchWithRetry(`${API_URL}/tracking/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(gpsData)
      }, { retryOnMutation: true });
  
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
  
      // Network error - queue for later sync
      if (!navigator.onLine || error.name === 'TypeError') {
        console.warn('📵 Device appears to be offline, queueing GPS');
        if (typeof OfflineDB !== 'undefined') {
          try {
            await OfflineDB.queueGPSPoint(gpsData);
            console.log('📦 GPS point queued to IndexedDB after network error');
            offlineQueue.updateSyncIndicator();
          } catch (e) {
            console.error('Failed to queue GPS point:', e);
          }
        }
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
  
      const response = await fetchWithRetry(`${API_URL}/tracking/my-trip`, {
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
      const response = await fetchWithRetry(`${API_URL}/tracking/update`, {
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
      }, { retryOnMutation: true });
      
      if (response.ok) {
        // Test 3: Verify server received it
        const verifyRes = await fetchWithRetry(`${API_URL}/tracking/test-my-location`, {
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
  
  // Expose to global scope
  window.startGPSTracking = startGPSTracking;
  window.stopGPSTracking = stopGPSTracking;
  window.updateTruckMarker = updateTruckMarker;
  window.positionTruckAtFirstBin = positionTruckAtFirstBin;
  window.showTrackingStatus = showTrackingStatus;
  window.getCurrentActiveRoute = getCurrentActiveRoute;
  window.drawRouteVisualization = drawRouteVisualization;
  window.clearRouteVisualization = clearRouteVisualization;
  window.showRouteLegend = showRouteLegend;
  window.hideRouteLegend = hideRouteLegend;
  window.updateETAPanel = updateETAPanel;
  window.updateGPSButtonState = updateGPSButtonState;
  window.startTripDataPolling = startTripDataPolling;
  window.stopTripDataPolling = stopTripDataPolling;
  window.initializeNavigation = initializeNavigation;
  window.getNextDestination = getNextDestination;
  window.updateCurrentPathToNextWaypoint = updateCurrentPathToNextWaypoint;
  window.snapToRoad = snapToRoad;
})();
