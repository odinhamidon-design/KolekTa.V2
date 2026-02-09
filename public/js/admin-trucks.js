/**
 * Kolek-Ta Admin Trucks Module
 * Truck management CRUD operations.
 */
(function() {
  'use strict';

// Truck Management Functions
let cachedTrucksData = [];
let cachedTruckDrivers = [];

async function showTruckManagement() {
  showPageLoading('Loading trucks...');
  try {
    const [trucksRes, usersRes] = await Promise.all([
      fetch(`${API_URL}/trucks`),
      fetch(`${API_URL}/users`)
    ]);

    if (!trucksRes.ok) throw new Error(`Failed to load trucks: ${trucksRes.status}`);
    if (!usersRes.ok) throw new Error(`Failed to load users: ${usersRes.status}`);

    cachedTrucksData = await trucksRes.json();
    const users = await usersRes.json();
    cachedTruckDrivers = users.filter(u => u.role === 'driver');

    // Register sort handler
    sortHandlers.trucks = () => renderTruckTable();

    renderTruckTable();
  } catch (error) {
    console.error('Error loading trucks:', error);
    hidePageLoading();
    showPage('Truck Management', `
      <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <i data-lucide="alert-circle" class="w-12 h-12 text-red-500 mx-auto mb-3"></i>
        <p class="text-red-700">Error loading trucks: ${error.message}</p>
        <button onclick="showTruckManagement()" class="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
          Try Again
        </button>
      </div>
    `);
  }
}

function renderTruckTable() {
  const trucks = cachedTrucksData;
  const drivers = cachedTruckDrivers;

  // Define searchable fields
  const searchFields = ['truckId', 'plateNumber', 'model', 'status', 'assignedDriver'];

  // Apply status filter
  let filtered = trucks;
  if (truckStatusFilter !== 'all') {
    filtered = filtered.filter(t => t.status === truckStatusFilter);
  }

  // Apply search filter
  filtered = filterData(filtered, searchState.trucks, searchFields);

  // Apply sorting
  const { column, direction } = sortState.trucks;
  const sortedTrucks = sortData(filtered, column, direction);
  const isFiltered = searchState.trucks || truckStatusFilter !== 'all';

  // Stats (from all trucks)
  const availableCount = trucks.filter(t => t.status === 'available').length;
  const inUseCount = trucks.filter(t => t.status === 'in-use').length;
  const maintenanceCount = trucks.filter(t => t.status === 'maintenance').length;
  const lowFuelCount = trucks.filter(t => t.fuelLevel < 25).length;

  // Define sortable columns
  const columns = [
    { key: 'truckId', label: 'Truck', sortable: true },
    { key: 'model', label: 'Model', sortable: true },
    { key: 'capacity', label: 'Capacity', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'assignedDriver', label: 'Driver', sortable: true },
    { key: 'fuelLevel', label: 'Fuel', sortable: true },
    { key: 'mileage', label: 'Mileage', sortable: true },
    { key: 'actions', label: 'Actions', sortable: false }
  ];

  const truckRows = sortedTrucks.map(t => {
      const driver = drivers.find(d => d.username === t.assignedDriver);
      const statusColors = {
        'available': 'bg-green-100 text-green-700',
        'in-use': 'bg-blue-100 text-blue-700',
        'maintenance': 'bg-yellow-100 text-yellow-700',
        'out-of-service': 'bg-red-100 text-red-700'
      };
      const fuelColor = t.fuelLevel > 50 ? 'bg-green-500' : t.fuelLevel > 25 ? 'bg-yellow-500' : 'bg-red-500';

      return `
        <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
          <td class="px-4 py-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <i data-lucide="truck" class="w-5 h-5 text-blue-600"></i>
              </div>
              <div>
                <div class="font-semibold text-gray-800">${escapeHtml(t.truckId)}</div>
                <div class="text-sm text-gray-500">${escapeHtml(t.plateNumber)}</div>
              </div>
            </div>
          </td>
          <td class="px-4 py-4 text-gray-600">${escapeHtml(t.model || '-')}</td>
          <td class="px-4 py-4 text-gray-600">${t.capacity} m³</td>
          <td class="px-4 py-4">
            <span class="px-3 py-1 rounded-full text-xs font-medium ${statusColors[t.status] || 'bg-gray-100 text-gray-700'}">
              ${t.status}
            </span>
          </td>
          <td class="px-4 py-4">
            ${driver ? `
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-medium">
                  ${(driver.fullName || driver.username).charAt(0).toUpperCase()}
                </div>
                <span class="text-gray-700">${escapeHtml(driver.fullName || driver.username)}</span>
              </div>
            ` : '<span class="text-gray-400">Not assigned</span>'}
          </td>
          <td class="px-4 py-4">
            <div class="flex items-center gap-2">
              <div class="w-20 bg-gray-200 rounded-full h-2">
                <div class="${fuelColor} h-2 rounded-full" style="width: ${t.fuelLevel}%"></div>
              </div>
              <span class="text-sm ${t.fuelLevel < 25 ? 'text-red-600 font-medium' : 'text-gray-600'}">${t.fuelLevel}%</span>
            </div>
          </td>
          <td class="px-4 py-4 text-gray-600">${(t.mileage || 0).toLocaleString()} km</td>
          <td class="px-4 py-4">
            <div class="flex items-center gap-1">
              <button onclick="assignDriver('${t._id || t.truckId}')" class="p-2 hover:bg-green-100 rounded-lg transition-colors" title="Assign Driver">
                <i data-lucide="user-plus" class="w-4 h-4 text-green-600"></i>
              </button>
              ${t.assignedDriver ? `
                <button onclick="unassignTruck('${t._id || t.truckId}')" class="p-2 hover:bg-amber-100 rounded-lg transition-colors" title="Unassign Driver">
                  <i data-lucide="user-minus" class="w-4 h-4 text-amber-600"></i>
                </button>
              ` : ''}
              <button onclick="editTruck('${t._id || t.truckId}')" class="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Edit">
                <i data-lucide="pencil" class="w-4 h-4 text-gray-600"></i>
              </button>
              <button onclick="deleteTruck('${t._id || t.truckId}')" class="p-2 hover:bg-red-100 rounded-lg transition-colors" title="Delete">
                <i data-lucide="trash-2" class="w-4 h-4 text-red-500"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    hidePageLoading();
    showPage('Truck Management', `
      <!-- Stats Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <i data-lucide="truck" class="w-6 h-6 text-blue-600"></i>
            </div>
            <div>
              <p class="text-sm text-gray-500">Total Trucks</p>
              <p class="text-2xl font-bold text-gray-800">${trucks.length}</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <i data-lucide="check-circle" class="w-6 h-6 text-green-600"></i>
            </div>
            <div>
              <p class="text-sm text-gray-500">Available</p>
              <p class="text-2xl font-bold text-gray-800">${availableCount}</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <i data-lucide="wrench" class="w-6 h-6 text-yellow-600"></i>
            </div>
            <div>
              <p class="text-sm text-gray-500">Maintenance</p>
              <p class="text-2xl font-bold text-gray-800">${maintenanceCount}</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 ${lowFuelCount > 0 ? 'bg-red-100' : 'bg-gray-100'} rounded-xl flex items-center justify-center">
              <i data-lucide="fuel" class="w-6 h-6 ${lowFuelCount > 0 ? 'text-red-600' : 'text-gray-600'}"></i>
            </div>
            <div>
              <p class="text-sm text-gray-500">Low Fuel</p>
              <p class="text-2xl font-bold ${lowFuelCount > 0 ? 'text-red-600' : 'text-gray-800'}">${lowFuelCount}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Trucks Table Card -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <!-- Table Header -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-4 border-b border-gray-100">
          <div>
            <h2 class="font-semibold text-gray-800">All Trucks</h2>
            <p class="text-sm text-gray-500">${sortedTrucks.length} of ${trucks.length} trucks${isFiltered ? ' (filtered)' : ''}</p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <select id="truckStatusFilter" onchange="handleTruckStatusFilter(this.value)"
              class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent">
              <option value="all" ${truckStatusFilter === 'all' ? 'selected' : ''}>All Status</option>
              <option value="available" ${truckStatusFilter === 'available' ? 'selected' : ''}>Available</option>
              <option value="in-use" ${truckStatusFilter === 'in-use' ? 'selected' : ''}>In Use</option>
              <option value="maintenance" ${truckStatusFilter === 'maintenance' ? 'selected' : ''}>Maintenance</option>
              <option value="out-of-service" ${truckStatusFilter === 'out-of-service' ? 'selected' : ''}>Out of Service</option>
            </select>
            ${createSearchInput('trucks', 'Search trucks...')}
            <button onclick="showAddTruckForm()" class="flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors">
              <i data-lucide="plus" class="w-4 h-4"></i>
              <span>Add Truck</span>
            </button>
          </div>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-100">
              <tr>
                ${createSortableHeader('trucks', columns)}
              </tr>
            </thead>
            <tbody>
              ${truckRows || '<tr><td colspan="8" class="px-4 py-8 text-center text-gray-500">No trucks found</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `);
}

window.showAddTruckForm = function() {
  showModal('Add New Truck', `
    <form id="addTruckForm" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Truck ID *</label>
        <input type="text" id="newTruckId" placeholder="e.g., TRUCK-003" required
          class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Plate Number *</label>
        <input type="text" id="newPlateNumber" placeholder="e.g., ABC-1234" required
          class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white uppercase">
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Model *</label>
        <input type="text" id="newModel" placeholder="e.g., Isuzu Elf" required
          class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Capacity (m³) *</label>
        <input type="number" id="newCapacity" value="10" min="1" step="0.5" required
          class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea id="newNotes" rows="3" placeholder="Additional information about the truck"
          class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white resize-none"></textarea>
      </div>
      <div class="flex gap-3 pt-4">
        <button type="submit" class="flex-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors">
          Add Truck
        </button>
        <button type="button" onclick="closeModal()" class="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors">
          Cancel
        </button>
      </div>
    </form>
  `);
  
  document.getElementById('addTruckForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const truckData = {
      truckId: document.getElementById('newTruckId').value,
      plateNumber: document.getElementById('newPlateNumber').value.toUpperCase(),
      model: document.getElementById('newModel').value,
      capacity: parseInt(document.getElementById('newCapacity').value),
      notes: document.getElementById('newNotes').value
    };
    
    try {
      const response = await fetchWithRetry(`${API_URL}/trucks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(truckData)
      });
      
      if (response.ok) {
        closeModal();
        showToast('Truck added successfully!', 'success');
        showTruckManagement();
      } else {
        const error = await response.json();
        showToast(error.error || 'Failed to add truck', 'error');
      }
    } catch (error) {
      showToast('Error adding truck: ' + error.message, 'error');
    }
  });
};

window.editTruck = async function(truckId) {
  try {
    const [truckRes, usersRes] = await Promise.all([
      fetch(`${API_URL}/trucks/${truckId}`),
      fetch(`${API_URL}/users`)
    ]);
    
    const truck = await truckRes.json();
    const users = await usersRes.json();
    const drivers = users.filter(u => u.role === 'driver');
    
    const driverOptions = drivers.map(d =>
      `<option value="${escapeHtml(d.username)}" ${truck.assignedDriver === d.username ? 'selected' : ''}>${escapeHtml(d.fullName)} (${escapeHtml(d.username)})</option>`
    ).join('');
    
    showModal('Edit Truck', `
      <form id="editTruckForm" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Truck ID</label>
          <input type="text" value="${escapeHtml(truck.truckId)}" disabled
            class="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed">
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Plate Number *</label>
            <input type="text" id="editPlateNumber" value="${escapeHtml(truck.plateNumber)}" required
              class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white uppercase">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Model</label>
            <input type="text" id="editModel" value="${escapeHtml(truck.model || '')}"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Capacity (m³)</label>
            <input type="number" id="editCapacity" value="${truck.capacity}" min="1"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select id="editStatus"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
              <option value="available" ${truck.status === 'available' ? 'selected' : ''}>Available</option>
              <option value="in-use" ${truck.status === 'in-use' ? 'selected' : ''}>In Use</option>
              <option value="maintenance" ${truck.status === 'maintenance' ? 'selected' : ''}>Maintenance</option>
              <option value="out-of-service" ${truck.status === 'out-of-service' ? 'selected' : ''}>Out of Service</option>
            </select>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Assigned Driver</label>
          <select id="editDriver"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
            <option value="">None</option>
            ${driverOptions}
          </select>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Fuel Level (%)</label>
            <input type="number" id="editFuel" value="${truck.fuelLevel}" min="0" max="100"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Mileage (km)</label>
            <input type="number" id="editMileage" value="${truck.mileage}" min="0"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Last Maintenance</label>
            <input type="date" id="editLastMaintenance" value="${truck.lastMaintenance || ''}"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Next Maintenance</label>
            <input type="date" id="editNextMaintenance" value="${truck.nextMaintenance || ''}"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea id="editNotes" rows="3"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white resize-none">${escapeHtml(truck.notes || '')}</textarea>
        </div>
        <div class="flex gap-3 pt-4">
          <button type="submit" class="flex-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors">
            Update Truck
          </button>
          <button type="button" onclick="closeModal()" class="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors">
            Cancel
          </button>
        </div>
      </form>
    `);
    
    document.getElementById('editTruckForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const updateData = {
        plateNumber: document.getElementById('editPlateNumber').value.toUpperCase(),
        model: document.getElementById('editModel').value,
        capacity: parseInt(document.getElementById('editCapacity').value),
        status: document.getElementById('editStatus').value,
        assignedDriver: document.getElementById('editDriver').value || null,
        fuelLevel: parseInt(document.getElementById('editFuel').value),
        mileage: parseInt(document.getElementById('editMileage').value),
        lastMaintenance: document.getElementById('editLastMaintenance').value || null,
        nextMaintenance: document.getElementById('editNextMaintenance').value || null,
        notes: document.getElementById('editNotes').value
      };
      
      try {
        const response = await fetchWithRetry(`${API_URL}/trucks/${truckId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        });
        
        if (response.ok) {
          closeModal();
          showToast('Truck updated successfully!', 'success');
          showTruckManagement();
        } else {
          const error = await response.json();
          showToast(error.error || 'Failed to update truck', 'error');
        }
      } catch (error) {
        showToast('Error updating truck: ' + error.message, 'error');
      }
    });
  } catch (error) {
    showToast('Error loading truck: ' + error.message, 'error');
  }
};

window.assignDriver = async function(truckId) {
  try {
    const [truckRes, usersRes] = await Promise.all([
      fetch(`${API_URL}/trucks/${truckId}`),
      fetch(`${API_URL}/users`)
    ]);
    
    const truck = await truckRes.json();
    const users = await usersRes.json();
    const drivers = users.filter(u => u.role === 'driver');
    // Filter to show only available drivers (or currently assigned driver)
    const availableDrivers = drivers.filter(d =>
      d.availability !== 'unavailable' || d.username === truck.assignedDriver
    );

    const driverOptions = availableDrivers.map(d => {
      const statusBadge = d.availability === 'unavailable' ? ' (Driving)' : '';
      return `<option value="${escapeHtml(d.username)}" ${truck.assignedDriver === d.username ? 'selected' : ''}>${escapeHtml(d.fullName)} (${escapeHtml(d.username)})${statusBadge}</option>`;
    }).join('');

    showModal('Assign Driver', `
      <form id="assignDriverForm" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Truck</label>
          <input type="text" value="${escapeHtml(truck.truckId)} - ${escapeHtml(truck.plateNumber)}" disabled
            class="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Select Driver *</label>
          <select id="assignDriverSelect" required
            class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
            <option value="">-- Select Driver --</option>
            ${driverOptions}
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Update Status</label>
          <select id="assignStatus"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
            <option value="in-use">In Use</option>
            <option value="available">Available</option>
          </select>
        </div>
        <div class="flex gap-3 pt-4">
          <button type="submit" class="flex-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors">
            Assign Driver
          </button>
          <button type="button" onclick="closeModal()" class="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors">
            Cancel
          </button>
        </div>
      </form>
    `);
    
    document.getElementById('assignDriverForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const selectedDriver = document.getElementById('assignDriverSelect').value;
      const status = document.getElementById('assignStatus').value;
      
      if (!selectedDriver) {
        showToast('Please select a driver', 'warning');
        return;
      }
      
      try {
        const response = await fetchWithRetry(`${API_URL}/trucks/${truckId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assignedDriver: selectedDriver,
            status: status
          })
        });
        
        if (response.ok) {
          closeModal();
          showToast('Driver assigned successfully!', 'success');
          showTruckManagement();
        } else {
          const error = await response.json();
          showToast(error.error || 'Failed to assign driver', 'error');
        }
      } catch (error) {
        showToast('Error assigning driver: ' + error.message, 'error');
      }
    });
  } catch (error) {
    showToast('Error loading data: ' + error.message, 'error');
  }
};

window.unassignTruck = async function(truckId) {
  if (!await showConfirm('Unassign Driver', 'Are you sure you want to unassign the driver from this truck?')) {
    return;
  }

  try {
    const response = await fetchWithRetry(`${API_URL}/trucks/${truckId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assignedDriver: null,
        status: 'available'
      })
    });

    if (response.ok) {
      showToast('Driver unassigned from truck successfully!', 'success');
      showTruckManagement();
    } else {
      const error = await response.json();
      showToast(error.error || 'Failed to unassign driver', 'error');
    }
  } catch (error) {
    showToast('Error unassigning driver: ' + error.message, 'error');
  }
};

window.deleteTruck = async function(truckId) {
  if (!await showConfirm('Delete Truck', 'Are you sure you want to delete this truck?')) {
    return;
  }

  try {
    const response = await fetchWithRetry(`${API_URL}/trucks/${truckId}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      showToast('Truck deleted successfully!', 'success');
      showTruckManagement();
    } else {
      const error = await response.json();
      showToast(error.error || 'Failed to delete truck', 'error');
    }
  } catch (error) {
    showToast('Error deleting truck: ' + error.message, 'error');
  }
};



  // Expose on window
  window.showTruckManagement = showTruckManagement;
  window.renderTruckTable = renderTruckTable;

})();