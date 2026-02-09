(function() {
  'use strict';

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
  
    // Apply status filter
    let filtered = cachedSchedulesData;
    if (scheduleStatusFilter !== 'all') {
      filtered = filtered.filter(s => scheduleStatusFilter === 'active' ? s.isActive : !s.isActive);
    }
  
    // Apply search filter
    filtered = filterData(filtered, searchState.schedules, searchFields);
  
    // Apply sorting
    const { column, direction } = sortState.schedules;
    const sortedSchedules = sortData(filtered, column, direction);
    const isFiltered = searchState.schedules || scheduleStatusFilter !== 'all';
  
    // Update search results count display
    const countDisplay = document.querySelector('#schedulesCountDisplay');
    if (countDisplay) {
      countDisplay.textContent = `${sortedSchedules.length} of ${cachedSchedulesData.length} schedules${isFiltered ? ' (filtered)' : ''}`;
    }
  
    // Update filter dropdown if it exists
    const statusFilterEl = document.getElementById('scheduleStatusFilter');
    if (statusFilterEl) statusFilterEl.value = scheduleStatusFilter;
  
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
    showPage('Special Pickups', `
      <div class="flex flex-col items-center justify-center py-16">
        <div class="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mb-4"></div>
        <p class="text-gray-500">Loading special pickup requests...</p>
      </div>
    `);

    try {
      const token = localStorage.getItem('token');
      const response = await fetchWithRetry('/api/resident/admin/special-pickups', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch special pickups');
      }
  
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
      const response = await fetchWithRetry(`/api/resident/admin/special-pickups/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const pickup = await response.json();
  
      const itemsList = pickup.items ? pickup.items.map(i => `<li>${escapeHtml(i.name)} x${parseInt(i.quantity) || 0}</li>`).join('') : '<li>No items listed</li>';
  
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
      await fetchWithRetry(`/api/resident/admin/special-pickups/${id}`, {
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
      await fetchWithRetry(`/api/resident/admin/special-pickups/${id}`, {
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
    showPage('Announcements', `
      <div class="flex flex-col items-center justify-center py-16">
        <div class="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mb-4"></div>
        <p class="text-gray-500">Loading announcements...</p>
      </div>
    `);

    try {
      const token = localStorage.getItem('token');
      const response = await fetchWithRetry('/api/resident/admin/announcements', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch announcements');
      }
  
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
    const barangaysResponse = await fetchWithRetry('/api/resident/barangays');
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
      await fetchWithRetry('/api/resident/admin/announcements', {
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
      await fetchWithRetry(`/api/resident/admin/announcements/${id}`, {
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
      await fetchWithRetry(`/api/resident/admin/announcements/${id}`, {
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
    const response = await fetchWithRetry(`/api/resident/admin/announcements`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const announcements = await response.json();
    const a = announcements.find(ann => ann._id === id);
    if (!a) return;
  
    const barangaysResponse = await fetchWithRetry('/api/resident/barangays');
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
      await fetchWithRetry(`/api/resident/admin/announcements/${id}`, {
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
    showPage('Collection Schedules', `
      <div class="flex flex-col items-center justify-center py-16">
        <div class="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mb-4"></div>
        <p class="text-gray-500">Loading schedules...</p>
      </div>
    `);

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
            <div class="flex flex-wrap items-center gap-3">
              <select id="scheduleStatusFilter" onchange="handleScheduleStatusFilter(this.value)"
                class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option value="all" ${scheduleStatusFilter === 'all' ? 'selected' : ''}>All Status</option>
                <option value="active" ${scheduleStatusFilter === 'active' ? 'selected' : ''}>Active</option>
                <option value="inactive" ${scheduleStatusFilter === 'inactive' ? 'selected' : ''}>Inactive</option>
              </select>
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
  
      lucide.createIcons();
  
      // Setup form submission
      document.getElementById('scheduleForm').addEventListener('submit', handleScheduleSubmit);
  
    } catch (error) {
      console.error('Error loading schedules:', error);
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
  
      const response = await fetchWithRetry(url, {
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
      const response = await fetchWithRetry(`${API_URL}/schedules/${id}`, {
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
      const response = await fetchWithRetry(`${API_URL}/schedules/${id}/toggle`, {
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
      const response = await fetchWithRetry(`${API_URL}/schedules/${id}`, {
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

  // Schedule views and calendar
  window.setScheduleView = setScheduleView;
  window.navigateCalendarMonth = navigateCalendarMonth;
  window.closeDayModal = closeDayModal;
  window.renderScheduleCalendar = renderScheduleCalendar;
  window.renderSchedulesTable = renderSchedulesTable;

  // Special pickups
  window.showSpecialPickupsAdmin = showSpecialPickupsAdmin;
  window.viewPickupDetails = viewPickupDetails;
  window.schedulePickup = schedulePickup;
  window.completePickup = completePickup;

  // Announcements
  window.showAnnouncementsAdmin = showAnnouncementsAdmin;
  window.showCreateAnnouncementModal = showCreateAnnouncementModal;
  window.toggleBarangaySelect = toggleBarangaySelect;
  window.toggleEditBarangaySelect = toggleEditBarangaySelect;
  window.toggleAnnouncementStatus = toggleAnnouncementStatus;
  window.deleteAnnouncement = deleteAnnouncement;
  window.editAnnouncement = editAnnouncement;
  window.updateAnnouncement = updateAnnouncement;

})();
