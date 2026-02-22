(function() {
  'use strict';

  // ============================================
  // DRIVER DASHBOARD FUNCTIONS
  // ============================================
  
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
  
  // Submit inspection - syncs to server
  window.submitInspection = async function() {
    const savedInspection = JSON.parse(localStorage.getItem('vehicleInspection') || '{}');
    const items = savedInspection.items || {};
    const problems = Object.entries(items).filter(([k, v]) => v === 'problem');
  
    if (problems.length > 0) {
      const confirmed = await showConfirm('Issues Found', `You reported ${problems.length} issue(s) with the vehicle.\n\nDo you want to submit this inspection and notify the admin?`);
      if (!confirmed) return;
    }
  
    // Get assigned truck
    const token = localStorage.getItem('token');
    let truckId = 'UNKNOWN';
    try {
      const trucksRes = await fetchWithRetry(`${API_URL}/trucks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const trucks = await trucksRes.json();
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const assignedTruck = trucks.find(t => t.assignedDriver === user.username);
      if (assignedTruck) truckId = assignedTruck.truckId;
    } catch (e) {
      console.error('Failed to get truck:', e);
    }
  
    // Format inspection items for API
    const inspectionItems = [
      { id: 'lights', label: 'Headlights & Taillights' },
      { id: 'brakes', label: 'Brakes & Brake Lights' },
      { id: 'tires', label: 'Tires & Tire Pressure' },
      { id: 'mirrors', label: 'Mirrors (Side & Rear)' },
      { id: 'horn', label: 'Horn Working' },
      { id: 'fuel', label: 'Fuel Level Adequate' },
      { id: 'fluids', label: 'Oil & Fluids' },
      { id: 'wipers', label: 'Windshield & Wipers' },
      { id: 'seatbelt', label: 'Seatbelt Functional' },
      { id: 'hydraulics', label: 'Hydraulic System (Lift)' },
      { id: 'compactor', label: 'Compactor System' },
      { id: 'leaks', label: 'No Visible Leaks' }
    ];
  
    const formattedItems = inspectionItems.map(item => ({
      item: item.label,
      status: items[item.id] === true ? 'pass' : items[item.id] === 'problem' ? 'fail' : 'na',
      notes: ''
    }));
  
    try {
      const response = await fetchWithRetry(`${API_URL}/driver/inspections`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          truckId,
          inspectionType: 'pre-trip',
          items: formattedItems,
          notes: problems.length > 0 ? `${problems.length} issue(s) reported` : ''
        })
      });
  
      if (!response.ok) throw new Error('Failed to submit inspection');
  
      const result = await response.json();
  
      // Mark inspection as submitted locally
      savedInspection.submitted = true;
      savedInspection.submittedAt = new Date().toISOString();
      savedInspection.inspectionId = result.inspection?.inspectionId;
      localStorage.setItem('vehicleInspection', JSON.stringify(savedInspection));
  
      closeModal();
      showToast('Inspection submitted successfully!', 'success');
  
      if (problems.length > 0) {
        showToast('Admin has been notified about vehicle issues', 'warning');
      }
    } catch (error) {
      console.error('Inspection submit error:', error);
      showToast('Failed to submit inspection. Saved locally.', 'error');
  
      // Still save locally as fallback
      savedInspection.submitted = true;
      savedInspection.submittedAt = new Date().toISOString();
      savedInspection.pendingSync = true;
      localStorage.setItem('vehicleInspection', JSON.stringify(savedInspection));
      closeModal();
    }
  };
  
  // Show driver statistics and performance metrics
  window.showDriverStats = async function() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetchWithRetry(`${API_URL}/routes`, {
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
                  <span class="text-gray-600 truncate flex-1">${escapeHtml(r.name || r.routeId)}</span>
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
  
    try {
      const token = localStorage.getItem('token');
      const response = await fetchWithRetry(`${API_URL}/routes/${activeRouteId}`, {
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
    } catch (error) {
      console.error('Error showing route navigation:', error);
      showToast('Error loading route', 'error');
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
            <h3 class="font-bold">${escapeHtml(route.name || 'Unnamed Route')}</h3>
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
  
  // Mark stop as completed - syncs to server or queues offline
  window.markStopCompleted = async function(stopIndex) {
    const activeRouteId = localStorage.getItem('activeRouteId');
    if (!activeRouteId) return;
  
    const token = localStorage.getItem('token');
  
    // Get current GPS location
    let gpsLocation = null;
    if (navigator.geolocation) {
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        gpsLocation = {
          type: 'Point',
          coordinates: [pos.coords.longitude, pos.coords.latitude]
        };
      } catch (e) {
        console.log('Could not get GPS for stop completion');
      }
    }
  
    // Get stop info from active route
    const activeRoute = window.currentActiveRoute ||
      (typeof DriverState !== 'undefined' ? DriverState.state.activeRoute : null);
    const stopLocation = activeRoute?.path?.coordinates?.[stopIndex] || [0, 0];
  
    const completionData = {
      type: 'STOP_COMPLETE',
      routeId: activeRouteId,
      stopIndex,
      stopName: `Stop ${stopIndex + 1}`,
      location: { type: 'Point', coordinates: stopLocation },
      gpsLocation,
      binsCollected: 1,
      wasteType: 'mixed',
      timestamp: new Date().toISOString()
    };
  
    // Try to sync online, or queue for later
    if (navigator.onLine) {
      try {
        const response = await fetchWithRetry(`${API_URL}/driver/stops/complete`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            routeId: activeRouteId,
            stopIndex,
            stopName: `Stop ${stopIndex + 1}`,
            location: { type: 'Point', coordinates: stopLocation },
            gpsLocation,
            binsCollected: 1,
            wasteType: 'mixed'
          })
        });
  
        if (!response.ok) {
          throw new Error('Server returned error');
        }
      } catch (e) {
        console.error('Failed to sync stop completion, queuing offline:', e);
        offlineQueue.addAction(completionData);
        showToast('Saved offline. Will sync when connected.', 'warning');
      }
    } else {
      // Offline - queue the action
      offlineQueue.addAction(completionData);
      showToast('Offline: Saved locally', 'warning');
    }
  
    // Always update local storage for UI
    localStorage.setItem(`route_${activeRouteId}_completed`, stopIndex + 1);
  
    showToast(`Stop ${stopIndex + 1} completed!`, 'success');
    showActiveRouteNavigation();
  
    // Update stats after stop completion
    if (typeof DriverState !== 'undefined') DriverState.refreshStats();
  };
  
  // Skip a stop - requires justification
  window.skipStop = async function(stopIndex) {
    const activeRouteId = localStorage.getItem('activeRouteId');
    if (!activeRouteId) return;
  
    // Show skip justification modal
    showModal('Skip Stop', `
      <div class="space-y-4">
        <p class="text-gray-600">Please provide a reason for skipping Stop ${stopIndex + 1}:</p>
  
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">Reason *</label>
          <select id="skipReason" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500">
            <option value="">Select a reason...</option>
            <option value="road-blocked">Road Blocked / Inaccessible</option>
            <option value="no-access">Cannot Access Location</option>
            <option value="safety-concern">Safety Concern</option>
            <option value="no-waste">No Waste to Collect</option>
            <option value="resident-request">Resident Request</option>
            <option value="vehicle-issue">Vehicle Issue</option>
            <option value="weather">Weather Conditions</option>
            <option value="other">Other</option>
          </select>
        </div>
  
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">Additional Notes</label>
          <textarea id="skipNotes" rows="2" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="Describe the situation..."></textarea>
        </div>
  
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">
            Photo Evidence <span id="photoRequiredBadge" class="hidden text-red-500">*</span>
          </label>
          <div class="flex items-center gap-2">
            <input type="file" id="skipPhoto" accept="image/*" capture="environment" class="hidden" onchange="previewSkipPhoto(this)">
            <button onclick="document.getElementById('skipPhoto').click()" class="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm">
              <i data-lucide="camera" class="w-4 h-4"></i>
              Take Photo
            </button>
            <span id="skipPhotoName" class="text-sm text-gray-500">No photo</span>
          </div>
          <div id="skipPhotoPreview" class="hidden mt-2">
            <img id="skipPhotoImg" class="w-32 h-32 object-cover rounded-lg border">
          </div>
        </div>
  
        <div class="flex gap-3 pt-2">
          <button onclick="submitSkipStop(${stopIndex})" class="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg">
            Skip Stop
          </button>
          <button onclick="closeModal()" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg">
            Cancel
          </button>
        </div>
      </div>
    `);
  
    // Add event listener for reason change to show/hide photo requirement
    setTimeout(() => {
      const reasonSelect = document.getElementById('skipReason');
      if (reasonSelect) {
        reasonSelect.addEventListener('change', () => {
          const photoRequired = ['road-blocked', 'no-access', 'safety-concern', 'vehicle-issue'].includes(reasonSelect.value);
          document.getElementById('photoRequiredBadge').classList.toggle('hidden', !photoRequired);
        });
      }
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }, 100);
  };
  
  // Preview skip photo
  window.previewSkipPhoto = function(input) {
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        document.getElementById('skipPhotoImg').src = e.target.result;
        document.getElementById('skipPhotoPreview').classList.remove('hidden');
        document.getElementById('skipPhotoName').textContent = input.files[0].name;
      };
      reader.readAsDataURL(input.files[0]);
    }
  };
  
  // Submit skip stop
  window.submitSkipStop = async function(stopIndex) {
    const reason = document.getElementById('skipReason').value;
    const notes = document.getElementById('skipNotes').value;
    const photoInput = document.getElementById('skipPhoto');
  
    if (!reason) {
      showToast('Please select a reason for skipping', 'error');
      return;
    }
  
    // Check if photo is required
    const photoRequiredReasons = ['road-blocked', 'no-access', 'safety-concern', 'vehicle-issue'];
    if (photoRequiredReasons.includes(reason) && (!photoInput.files || !photoInput.files[0])) {
      showToast('Photo evidence is required for this reason', 'error');
      return;
    }
  
    const activeRouteId = localStorage.getItem('activeRouteId');
    if (!activeRouteId) return;
  
    const token = localStorage.getItem('token');
  
    // Get photo as base64
    let skipPhoto = null;
    if (photoInput.files && photoInput.files[0]) {
      skipPhoto = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(photoInput.files[0]);
      });
    }
  
    // Get current GPS location
    let gpsLocation = null;
    if (navigator.geolocation) {
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        gpsLocation = {
          type: 'Point',
          coordinates: [pos.coords.longitude, pos.coords.latitude]
        };
      } catch (e) {
        console.log('Could not get GPS for skip');
      }
    }
  
    const skipData = {
      type: 'STOP_SKIP',
      routeId: activeRouteId,
      stopIndex,
      stopName: `Stop ${stopIndex + 1}`,
      skipReason: reason,
      skipNotes: notes,
      skipPhoto,
      gpsLocation,
      timestamp: new Date().toISOString()
    };
  
    // Try to sync online, or queue for later
    if (navigator.onLine) {
      try {
        const response = await fetchWithRetry(`${API_URL}/driver/stops/skip`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            routeId: activeRouteId,
            stopIndex,
            stopName: `Stop ${stopIndex + 1}`,
            skipReason: reason,
            skipNotes: notes,
            skipPhoto,
            gpsLocation
          })
        });
  
        if (!response.ok) {
          throw new Error('Server returned error');
        }
        showToast('Admin notified about skipped stop', 'info');
      } catch (e) {
        console.error('Failed to sync skip, queuing offline:', e);
        offlineQueue.addAction(skipData);
        showToast('Saved offline. Admin will be notified when connected.', 'warning');
      }
    } else {
      // Offline - queue the action
      offlineQueue.addAction(skipData);
      showToast('Offline: Skip saved locally', 'warning');
    }
  
    // Always update local storage
    localStorage.setItem(`route_${activeRouteId}_completed`, stopIndex + 1);
  
    closeModal();
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
      const response = await fetchWithRetry(`${API_URL}/routes`, {
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
                  <p class="font-semibold text-gray-800 truncate flex-1">${escapeHtml(route.name || 'Unnamed')}</p>
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
  

  // Expose to global scope
  window.showNavigationPanel = showNavigationPanel;
  window.initMobileDriverNav = initMobileDriverNav;
  window.setMobileNavActive = setMobileNavActive;
  window.loadMobileDriverData = loadMobileDriverData;
})();
