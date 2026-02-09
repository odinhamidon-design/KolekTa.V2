(function() {
  'use strict';

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
  
      const response = await fetchWithRetry(`${API_URL}${endpoint}`, {
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
  

})();
