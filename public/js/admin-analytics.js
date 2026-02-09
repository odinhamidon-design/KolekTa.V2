(function() {
  'use strict';

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
      const response = await fetchWithRetry(`/api/reports/analytics-data?startDate=${startDate}&endDate=${endDate}`, {
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
  

})();
