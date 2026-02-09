(function() {
  'use strict';

  // ============================================
  // FUEL MANAGEMENT SYSTEM
  // ============================================
  
  // Cache for fuel data
  let cachedFuelData = { trucks: [], fleet: {} };
  
  async function showFuelManagement() {
    setActiveSidebarButton('fuelManagementBtn');
    showPage('Fuel Management', `
      <div class="flex flex-col items-center justify-center py-16">
        <div class="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mb-4"></div>
        <p class="text-gray-500">Loading fuel data...</p>
      </div>
    `);
    try {
      const response = await fetchWithRetry(`${API_URL}/fuel/all-stats`);
      const data = await response.json();
  
      cachedFuelData = data;
  
      // Register sort handler
      sortHandlers.fuel = () => renderFuelCards();
  
      renderFuelCards();
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
  
  function renderFuelCards() {
    const { trucks, fleet } = cachedFuelData;
  
    // Define search fields
    const searchFields = ['truckId', 'plateNumber', 'assignedDriver'];
  
    // Apply fuel level filter first
    let filtered = filterTrucksByFuelLevel(trucks, fuelLevelFilter);
  
    // Apply search filter
    filtered = filterData(filtered, searchState.fuel, searchFields);
  
    const truckCards = filtered.map(t => {
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
                  <h3 class="font-semibold text-gray-800">${escapeHtml(t.truckId)}</h3>
                  <p class="text-sm text-gray-500">${escapeHtml(t.plateNumber)}</p>
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
  
        <!-- Search and Filter Controls -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 class="font-semibold text-gray-800">All Trucks</h2>
              <p class="text-sm text-gray-500" id="fuelTruckCount">${filtered.length} of ${trucks.length} trucks${searchState.fuel || fuelLevelFilter !== 'all' ? ' (filtered)' : ''}</p>
            </div>
            <div class="flex flex-wrap items-center gap-3">
              <select id="fuelLevelFilter" onchange="handleFuelLevelFilter(this.value)"
                class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option value="all" ${fuelLevelFilter === 'all' ? 'selected' : ''}>All Levels</option>
                <option value="low" ${fuelLevelFilter === 'low' ? 'selected' : ''}>Low (&lt; 25%)</option>
                <option value="medium" ${fuelLevelFilter === 'medium' ? 'selected' : ''}>Medium (25-50%)</option>
                <option value="good" ${fuelLevelFilter === 'good' ? 'selected' : ''}>Good (&gt; 50%)</option>
              </select>
              ${createSearchInput('fuel', 'Search trucks...')}
            </div>
          </div>
        </div>
  
        <!-- Trucks Grid -->
        <div id="fuelTrucksGrid">
        ${filtered.length > 0 ? `
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${truckCards}
          </div>
        ` : `
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i data-lucide="truck" class="w-8 h-8 text-gray-400"></i>
            </div>
            <h3 class="text-lg font-semibold text-gray-700 mb-2">${searchState.fuel || fuelLevelFilter !== 'all' ? 'No Matching Trucks' : 'No Trucks Found'}</h3>
            <p class="text-gray-500">${searchState.fuel || fuelLevelFilter !== 'all' ? 'Try adjusting your search or filter' : 'Add trucks to manage their fuel'}</p>
          </div>
        `}
        </div>
      `);
  
      lucide.createIcons();
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
      const response = await fetchWithRetry(`${API_URL}/fuel/refuel`, {
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
      const response = await fetchWithRetry(`${API_URL}/fuel/estimate`, {
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
      const response = await fetchWithRetry(`${API_URL}/fuel/consumption`, {
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
      const response = await fetchWithRetry(`${API_URL}/fuel/stats/${truckId}?days=30`);
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
                  <div class="text-xs text-gray-500">${escapeHtml(log.gasStation || 'Unknown station')}</div>
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
                  ${log.routeName ? `<div class="text-orange-600">${escapeHtml(log.routeName)}</div>` : ''}
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
                  <p class="font-medium text-gray-800 text-sm truncate">${escapeHtml(truck.truckId)}</p>
                  <p class="text-xs text-gray-500">${escapeHtml(truck.plateNumber)}</p>
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
                  <p class="font-medium text-gray-800 text-sm truncate">${escapeHtml(route.name || 'Unnamed Route')}</p>
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
      const response = await fetchWithRetry(`${API_URL}/routes`, {
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
      const response = await fetchWithRetry(`${API_URL}/routes`, {
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
  

  // Expose to global scope for inline onclick handlers
  window.showFuelManagement = showFuelManagement;
  window.renderFuelCards = renderFuelCards;
  window.showRefuelForm = showRefuelForm;
  window.showFuelEstimator = showFuelEstimator;
  window.showFuelHistory = showFuelHistory;
  window.loadDriverAssignmentsOverlay = loadDriverAssignmentsOverlay;
})();
