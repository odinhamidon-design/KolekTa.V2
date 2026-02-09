(function() {
  'use strict';

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
      const response = await fetchWithRetry(`${API_URL}/complaints/new-count`, {
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
  
    // Apply status filter
    let filtered = cachedComplaintsData;
    if (complaintStatusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === complaintStatusFilter);
    }
  
    // Apply type filter
    if (complaintTypeFilter !== 'all') {
      filtered = filtered.filter(c => c.reportType === complaintTypeFilter);
    }
  
    // Apply search filter
    filtered = filterData(filtered, searchState.complaints, searchFields);
  
    // Apply sorting
    const { column, direction } = sortState.complaints;
    const sortedComplaints = sortData(filtered, column, direction);
    const stats = cachedComplaintsStats;
    const isFiltered = searchState.complaints || complaintStatusFilter !== 'all' || complaintTypeFilter !== 'all';
  
    // Update search results count display
    const countDisplay = document.querySelector('#complaintsCountDisplay');
    if (countDisplay) {
      countDisplay.textContent = `${sortedComplaints.length} of ${cachedComplaintsData.length} reports${isFiltered ? ' (filtered)' : ''}`;
    }
  
    // Update filter dropdowns if they exist
    const statusFilterEl = document.getElementById('complaintStatusFilter');
    if (statusFilterEl) statusFilterEl.value = complaintStatusFilter;
    const typeFilterEl = document.getElementById('complaintTypeFilter');
    if (typeFilterEl) typeFilterEl.value = complaintTypeFilter;
  
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
              <div class="font-medium text-gray-800">${escapeHtml(c.name)}</div>
              <div class="text-sm text-gray-500">${escapeHtml(c.barangay)}</div>
            </div>
          </td>
          <td class="px-4 py-4">
            <div class="text-sm text-gray-600 max-w-xs truncate" title="${escapeHtml(c.description)}">${escapeHtml(c.description)}</div>
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
                <div class="font-medium text-gray-800">${escapeHtml(c.name)}</div>
                <div class="text-sm text-gray-500">${escapeHtml(c.barangay)}</div>
              </div>
            </td>
            <td class="px-4 py-4">
              <div class="text-sm text-gray-600 max-w-xs truncate" title="${escapeHtml(c.description)}">${escapeHtml(c.description)}</div>
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
              <select id="complaintTypeFilter" onchange="handleComplaintTypeFilter(this.value)" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
                <option value="all" ${complaintTypeFilter === 'all' ? 'selected' : ''}>All Types</option>
                <option value="missed_collection" ${complaintTypeFilter === 'missed_collection' ? 'selected' : ''}>Missed Collection</option>
                <option value="illegal_dumping" ${complaintTypeFilter === 'illegal_dumping' ? 'selected' : ''}>Illegal Dumping</option>
                <option value="overflowing_bin" ${complaintTypeFilter === 'overflowing_bin' ? 'selected' : ''}>Overflowing Bin</option>
                <option value="damaged_bin" ${complaintTypeFilter === 'damaged_bin' ? 'selected' : ''}>Damaged Bin</option>
                <option value="odor_complaint" ${complaintTypeFilter === 'odor_complaint' ? 'selected' : ''}>Odor Complaint</option>
                <option value="other" ${complaintTypeFilter === 'other' ? 'selected' : ''}>Other</option>
              </select>
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Status</label>
              <select id="complaintStatusFilter" onchange="handleComplaintStatusFilter(this.value)" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
                <option value="all" ${complaintStatusFilter === 'all' ? 'selected' : ''}>All Status</option>
                <option value="pending" ${complaintStatusFilter === 'pending' ? 'selected' : ''}>Pending</option>
                <option value="in-progress" ${complaintStatusFilter === 'in-progress' ? 'selected' : ''}>In Progress</option>
                <option value="resolved" ${complaintStatusFilter === 'resolved' ? 'selected' : ''}>Resolved</option>
                <option value="closed" ${complaintStatusFilter === 'closed' ? 'selected' : ''}>Closed</option>
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
  
      const response = await fetchWithRetry(url, {
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
      const response = await fetchWithRetry(`${API_URL}/complaints/${id}`, {
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
              <div><span class="text-gray-500">Name:</span> <span class="font-medium">${escapeHtml(complaint.name)}</span></div>
              <div><span class="text-gray-500">Phone:</span> <span class="font-medium">${escapeHtml(complaint.phone)}</span></div>
              <div><span class="text-gray-500">Email:</span> <span class="font-medium">${escapeHtml(complaint.email)}</span></div>
              <div><span class="text-gray-500">Barangay:</span> <span class="font-medium">${escapeHtml(complaint.barangay)}</span></div>
            </div>
            <div class="mt-2 text-sm">
              <span class="text-gray-500">Address:</span> <span class="font-medium">${escapeHtml(complaint.address)}</span>
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
            <p class="text-gray-700">${escapeHtml(complaint.description)}</p>
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
              <p class="text-blue-700 font-medium">${escapeHtml(complaint.assignedDriver)}</p>
              ${complaint.assignedVehicle ? `<p class="text-sm text-blue-600">Vehicle: ${escapeHtml(complaint.assignedVehicle)}</p>` : ''}
            </div>
          ` : ''}
  
          ${complaint.adminResponse ? `
            <div class="bg-green-50 rounded-lg p-4">
              <h4 class="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <i data-lucide="message-circle" class="w-4 h-4 text-green-600"></i> Admin Response
              </h4>
              <p class="text-green-700">${escapeHtml(complaint.adminResponse)}</p>
            </div>
          ` : ''}
  
          ${complaint.adminNotes ? `
            <div class="bg-gray-100 rounded-lg p-4">
              <h4 class="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <i data-lucide="file-text" class="w-4 h-4"></i> Internal Notes
              </h4>
              <p class="text-gray-600 text-sm">${escapeHtml(complaint.adminNotes)}</p>
            </div>
          ` : ''}
  
          ${complaint.resolvedAt ? `
            <div class="text-center text-sm text-gray-500">
              Resolved on ${new Date(complaint.resolvedAt).toLocaleString()} by ${escapeHtml(complaint.resolvedBy || 'Admin')}
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
            <strong>${escapeHtml(complaint.name)}</strong> - ${escapeHtml(complaint.barangay)}
            <p class="text-gray-600 mt-1">${escapeHtml(complaint.description.substring(0, 100))}${complaint.description.length > 100 ? '...' : ''}</p>
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
      const response = await fetchWithRetry(`${API_URL}/complaints/${id}`, {
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
      const response = await fetchWithRetry(`${API_URL}/complaints/${id}`, {
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
      const response = await fetchWithRetry(`${API_URL}/complaints/mark-all-read`, {
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
  

  // Expose to global scope
  window.checkNewComplaints = checkNewComplaints;
  window.updateComplaintsBadge = updateComplaintsBadge;
  window.renderComplaintsTable = renderComplaintsTable;
})();
