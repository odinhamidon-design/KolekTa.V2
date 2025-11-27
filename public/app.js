// Use relative URL so it works on any device
const API_URL = '/api';

// Check authentication
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token) {
  window.location.href = 'login.html';
}

// Initialize after DOM is loaded
function initializeApp() {
  // Show/hide buttons based on role
  if (user.role === 'admin') {
    const userMgmtBtn = document.getElementById('userManagementBtn');
    const truckMgmtBtn = document.getElementById('truckManagementBtn');
    const routesMgmtBtn = document.getElementById('routesManagementBtn');
    const liveTruckBtn = document.getElementById('liveTruckTrackingBtn');
    const historyBtn = document.getElementById('completionHistoryBtn');
    if (userMgmtBtn) {
      userMgmtBtn.style.display = 'block';
    }
    if (truckMgmtBtn) {
      truckMgmtBtn.style.display = 'block';
    }
    if (routesMgmtBtn) {
      routesMgmtBtn.style.display = 'block';
    }
    if (liveTruckBtn) {
      liveTruckBtn.style.display = 'block';
    }
    if (historyBtn) {
      historyBtn.style.display = 'block';
    }
    // Create permanent notification icon after a small delay to ensure DOM is ready
    setTimeout(() => {
      createNotificationIcon();
      // Start checking for notifications
      checkCompletionNotifications();
      setInterval(checkCompletionNotifications, 30000); // Check every 30 seconds
      
      // Start live truck tracking on map
      showLiveTruckLocations();
    }, 100);
  } else if (user.role === 'driver') {
    // Show driver panel
    const driverPanel = document.getElementById('driverPanel');
    const driverHistoryPanel = document.getElementById('driverHistoryPanel');
    if (driverPanel) {
      driverPanel.style.display = 'block';
      // Call loadDriverAssignments after it's defined
      if (typeof loadDriverAssignments === 'function') {
        loadDriverAssignments();
      } else {
        // If not defined yet, wait a bit
        setTimeout(() => loadDriverAssignments(), 100);
      }
    }
    if (driverHistoryPanel) {
      driverHistoryPanel.style.display = 'block';
    }
  }
}

// Add profile, notification, and logout button
document.querySelector('header').innerHTML += `
  <div style="position: absolute; top: 1rem; right: 1rem; display: flex; align-items: center; gap: 0.75rem;">
    <button onclick="showProfile()" style="padding: 0.5rem 1rem; background: white; color: #4caf50; border: none; border-radius: 5px; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
      <span id="headerProfilePic" style="width: 30px; height: 30px; border-radius: 50%; background: #4caf50; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold;">
        ${(user.fullName || user.username).charAt(0).toUpperCase()}
      </span>
      <span>${user.fullName || user.username}</span>
    </button>
    ${user.role === 'admin' ? '<div id="headerNotificationContainer"></div>' : ''}
    <button onclick="logout()" style="padding: 0.5rem 1rem; background: white; color: #4caf50; border: none; border-radius: 5px; cursor: pointer;">Logout</button>
  </div>
`;

// Load profile picture if exists (with small delay to ensure DOM is ready)
setTimeout(() => {
  loadHeaderProfilePicture();
}, 100);

// Call initialization AFTER header is created
initializeApp();

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}

// Add authorization header to all fetch requests
const originalFetch = window.fetch;
window.fetch = async function(...args) {
  const token = localStorage.getItem('token'); // Get fresh token each time
  
  if (args[1]) {
    args[1].headers = {
      ...args[1].headers,
      'Authorization': `Bearer ${token}`
    };
  } else {
    args[1] = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
  }
  
  const response = await originalFetch.apply(this, args);
  
  // If unauthorized, redirect to login
  if (response.status === 401 || response.status === 403) {
    console.error('Authentication failed - redirecting to login');
    alert('Your session has expired. Please login again.');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
  }
  
  return response;
};

// Mati City, Davao Oriental coordinates and boundaries
const MATI_CENTER = [6.9549, 126.2185]; // Mati City center
const MATI_BOUNDS = [
  [6.8500, 126.1000], // Southwest corner
  [7.0500, 126.3500]  // Northeast corner
];

// Initialize map centered on Mati City
const map = L.map('map', {
  center: MATI_CENTER,
  zoom: 13,
  minZoom: 12,
  maxZoom: 18,
  maxBounds: MATI_BOUNDS,
  maxBoundsViscosity: 1.0
}).setView(MATI_CENTER, 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors | Mati City, Davao Oriental'
}).addTo(map);

// Add Mati City boundary overlay
const matiCityBoundary = L.rectangle(MATI_BOUNDS, {
  color: '#667eea',
  weight: 3,
  fillOpacity: 0,
  dashArray: '10, 10'
}).addTo(map);

// Removed city label

// Add major landmarks in Mati City
const landmarks = [
  { name: 'Mati City Hall', coords: [6.9549, 126.2185], icon: '🏛️' },
  { name: 'Dahican Beach', coords: [6.8833, 126.2667], icon: '🏖️' },
  { name: 'Sleeping Dinosaur', coords: [6.9000, 126.2500], icon: '🦕' },
  { name: 'Mati Public Market', coords: [6.9560, 126.2170], icon: '🏪' }
];

landmarks.forEach(landmark => {
  L.marker(landmark.coords, {
    icon: L.divIcon({
      className: 'landmark-icon',
      html: `<div style="font-size: 24px;">${landmark.icon}</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    })
  }).addTo(map).bindPopup(`<strong>${landmark.name}</strong>`);
});

let bins = [];
let markers = {};

// Load bins
async function loadBins() {
  try {
    const response = await fetch(`${API_URL}/bins`);
    bins = await response.json();
    displayBins();
  } catch (error) {
    console.error('Error loading bins:', error);
  }
}

// Display bins on map
function displayBins() {
  Object.values(markers).forEach(marker => map.removeLayer(marker));
  markers = {};
  
  bins.forEach(bin => {
    const color = getStatusColor(bin.status);
    const marker = L.circleMarker([bin.location.coordinates[1], bin.location.coordinates[0]], {
      radius: 8,
      fillColor: color,
      color: '#fff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8
    }).addTo(map);
    
    marker.bindPopup(`
      <strong>${bin.binId}</strong><br>
      Status: ${bin.status}<br>
      Level: ${bin.currentLevel}%<br>
      Type: ${bin.binType}
    `);
    
    markers[bin._id] = marker;
  });
}

function getStatusColor(status) {
  const colors = {
    empty: '#4caf50',
    low: '#8bc34a',
    medium: '#ffc107',
    high: '#ff9800',
    full: '#f44336'
  };
  return colors[status] || '#999';
}

// Removed updateStats function

// Removed bin selection functionality

// Removed Add Bin functionality

// Removed Optimize Route functionality

// Modal functions
function showModal(title, body) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = body;
  document.getElementById('modal').style.display = 'block';
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
}

document.querySelector('.close').addEventListener('click', closeModal);

window.addEventListener('click', (e) => {
  if (e.target === document.getElementById('modal')) {
    closeModal();
  }
});

// Removed View Statistics functionality

// User Management (Admin only)
document.getElementById('userManagementBtn').addEventListener('click', () => {
  showUserManagement();
});

// Truck Management (Admin only)
document.getElementById('truckManagementBtn').addEventListener('click', () => {
  showTruckManagement();
});

// Routes Management (Admin only)
document.getElementById('routesManagementBtn').addEventListener('click', () => {
  showRoutesManagement();
});

// Live Truck Tracking (Admin only)
document.getElementById('liveTruckTrackingBtn').addEventListener('click', () => {
  showLiveTruckPanel();
});

// Completion History (Admin only)
document.getElementById('completionHistoryBtn').addEventListener('click', () => {
  showNotificationHistory();
});

// Driver History (Driver only)
const viewDriverHistoryBtn = document.getElementById('viewDriverHistoryBtn');
if (viewDriverHistoryBtn) {
  viewDriverHistoryBtn.addEventListener('click', () => {
    showDriverHistory();
  });
}

async function showUserManagement() {
  try {
    const response = await fetch(`${API_URL}/users`);
    const users = await response.json();
    
    const usersList = users.map(u => `
      <tr>
        <td>${u.username}</td>
        <td>${u.fullName || '-'}</td>
        <td>${u.email}</td>
        <td>${u.phoneNumber || '-'}</td>
        <td><span class="role-badge ${u.role}">${u.role}</span></td>
        <td><span class="status-badge ${u.isActive ? 'active' : 'inactive'}">${u.isActive ? 'Active' : 'Inactive'}</span></td>
        <td>
          <button onclick="editUser('${u._id || u.username}')" class="btn-small">✏️ Edit</button>
          ${u.role !== 'admin' ? `<button onclick="deleteUser('${u._id || u.username}')" class="btn-small btn-danger">🗑️ Delete</button>` : '<span style="color: #999; font-size: 0.8rem;">Protected</span>'}
        </td>
      </tr>
    `).join('');
    
    showModal('User Management', `
      <div class="user-management">
        <button onclick="showAddUserForm()" class="btn" style="margin-bottom: 1rem;">➕ Add New Driver</button>
        
        <div style="overflow-x: auto;">
          <table class="user-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${usersList || '<tr><td colspan="7" style="text-align:center;">No users found</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `);
  } catch (error) {
    console.error('Error loading users:', error);
    showModal('User Management', '<p style="color: red;">Error loading users</p>');
  }
}

window.showAddUserForm = function() {
  showModal('Add New Driver', `
    <form id="addUserForm">
      <div class="form-group">
        <label>Username *</label>
        <input type="text" id="newUsername" required>
      </div>
      <div class="form-group">
        <label>Full Name *</label>
        <input type="text" id="newFullName" required>
      </div>
      <div class="form-group">
        <label>Email *</label>
        <input type="email" id="newEmail" required>
      </div>
      <div class="form-group">
        <label>Password *</label>
        <input type="password" id="newPassword" required minlength="6">
      </div>
      <div class="form-group">
        <label>Phone Number *</label>
        <input type="tel" id="newPhone" placeholder="09XXXXXXXXX" required pattern="[0-9]{11}">
        <small style="color: #666;">Format: 09XXXXXXXXX (11 digits)</small>
      </div>
      <input type="hidden" id="newRole" value="driver">
      <button type="submit" class="btn">Create Driver</button>
      <button type="button" onclick="showUserManagement()" class="btn" style="background: #999;">Cancel</button>
    </form>
  `);
  
  document.getElementById('addUserForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userData = {
      username: document.getElementById('newUsername').value,
      fullName: document.getElementById('newFullName').value,
      email: document.getElementById('newEmail').value,
      password: document.getElementById('newPassword').value,
      phoneNumber: document.getElementById('newPhone').value,
      role: document.getElementById('newRole').value
    };
    
    try {
      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      if (response.ok) {
        alert('User created successfully!');
        showUserManagement();
      } else {
        const error = await response.json();
        alert('Error: ' + (error.error || 'Failed to create user'));
      }
    } catch (error) {
      alert('Error creating user: ' + error.message);
    }
  });
};

window.editUser = async function(userId) {
  try {
    const response = await fetch(`${API_URL}/users/${userId}`);
    const user = await response.json();
    
    // Check if editing admin
    const isAdmin = user.role === 'admin';
    
    showModal(isAdmin ? 'Edit Admin Profile' : 'Edit Driver', `
      <form id="editUserForm">
        <div class="form-group">
          <label>Username</label>
          <input type="text" value="${user.username}" disabled>
        </div>
        <div class="form-group">
          <label>Full Name</label>
          <input type="text" id="editFullName" value="${user.fullName || ''}" required>
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="editEmail" value="${user.email}" required>
        </div>
        ${!isAdmin ? `
        <div class="form-group">
          <label>Phone Number</label>
          <input type="tel" id="editPhone" value="${user.phoneNumber || ''}" pattern="[0-9]{11}">
          <small style="color: #666;">Format: 09XXXXXXXXX (11 digits)</small>
        </div>
        ` : ''}
        <div class="form-group">
          <label>New Password (leave blank to keep current)</label>
          <input type="password" id="editPassword" minlength="6">
        </div>
        ${isAdmin ? `
        <input type="hidden" id="editRole" value="admin">
        <p style="color: #666; font-size: 0.9rem; padding: 0.5rem; background: #f5f5f5; border-radius: 5px;">
          ℹ️ Admin role cannot be changed
        </p>
        ` : `
        <input type="hidden" id="editRole" value="driver">
        <div class="form-group">
          <label>
            <input type="checkbox" id="editActive" ${user.isActive ? 'checked' : ''}>
            Active
          </label>
        </div>
        `}
        <button type="submit" class="btn">Update ${isAdmin ? 'Profile' : 'Driver'}</button>
        <button type="button" onclick="showUserManagement()" class="btn" style="background: #999;">Cancel</button>
      </form>
    `);
    
    document.getElementById('editUserForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const updateData = {
        fullName: document.getElementById('editFullName').value,
        email: document.getElementById('editEmail').value,
        role: document.getElementById('editRole').value
      };
      
      // Only add phone and active status for drivers
      const phoneInput = document.getElementById('editPhone');
      if (phoneInput) {
        updateData.phoneNumber = phoneInput.value;
      }
      
      const activeInput = document.getElementById('editActive');
      if (activeInput) {
        updateData.isActive = activeInput.checked;
      }
      
      const newPassword = document.getElementById('editPassword').value;
      if (newPassword) {
        updateData.password = newPassword;
      }
      
      try {
        const response = await fetch(`${API_URL}/users/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        });
        
        if (response.ok) {
          alert('User updated successfully!');
          showUserManagement();
        } else {
          const error = await response.json();
          alert('Error: ' + (error.error || 'Failed to update user'));
        }
      } catch (error) {
        alert('Error updating user: ' + error.message);
      }
    });
  } catch (error) {
    alert('Error loading user: ' + error.message);
  }
};

window.deleteUser = async function(userId) {
  if (!confirm('Are you sure you want to delete this user?')) {
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      alert('User deleted successfully!');
      showUserManagement();
    } else {
      const error = await response.json();
      alert('Error: ' + (error.error || 'Failed to delete user'));
    }
  } catch (error) {
    alert('Error deleting user: ' + error.message);
  }
};

// Truck Management Functions
async function showTruckManagement() {
  try {
    console.log('Fetching trucks from:', `${API_URL}/trucks`);
    console.log('Token:', localStorage.getItem('token'));
    
    const [trucksRes, usersRes] = await Promise.all([
      fetch(`${API_URL}/trucks`),
      fetch(`${API_URL}/users`)
    ]);
    
    console.log('Trucks response status:', trucksRes.status);
    console.log('Users response status:', usersRes.status);
    
    if (!trucksRes.ok) {
      const errorText = await trucksRes.text();
      console.error('Trucks API error:', errorText);
      throw new Error(`Failed to load trucks: ${trucksRes.status} - ${errorText}`);
    }
    
    if (!usersRes.ok) {
      const errorText = await usersRes.text();
      console.error('Users API error:', errorText);
      throw new Error(`Failed to load users: ${usersRes.status} - ${errorText}`);
    }
    
    const trucks = await trucksRes.json();
    const users = await usersRes.json();
    
    console.log('Trucks loaded:', trucks);
    console.log('Users loaded:', users);
    const drivers = users.filter(u => u.role === 'driver');
    
    const trucksList = trucks.map(t => {
      const driver = drivers.find(d => d.username === t.assignedDriver);
      return `
        <tr>
          <td><strong>${t.truckId}</strong></td>
          <td>${t.plateNumber}</td>
          <td>${t.model || '-'}</td>
          <td>${t.capacity} kg</td>
          <td><span class="truck-status ${t.status}">${t.status}</span></td>
          <td>${driver ? driver.fullName : '-'}</td>
          <td>${t.fuelLevel}%</td>
          <td>${t.mileage.toLocaleString()} km</td>
          <td>
            <button onclick="assignDriver('${t._id || t.truckId}')" class="btn-small" style="background: #4caf50;">👤 Assign</button>
            <button onclick="editTruck('${t._id || t.truckId}')" class="btn-small">✏️ Edit</button>
            <button onclick="deleteTruck('${t._id || t.truckId}')" class="btn-small btn-danger">🗑️ Delete</button>
          </td>
        </tr>
      `;
    }).join('');
    
    showModal('Truck Management', `
      <div class="truck-management">
        <button onclick="showAddTruckForm()" class="btn" style="margin-bottom: 1rem;">➕ Add New Truck</button>
        
        <div style="overflow-x: auto;">
          <table class="user-table">
            <thead>
              <tr>
                <th>Truck ID</th>
                <th>Plate Number</th>
                <th>Model</th>
                <th>Capacity</th>
                <th>Status</th>
                <th>Assigned Driver</th>
                <th>Fuel</th>
                <th>Mileage</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${trucksList || '<tr><td colspan="9" style="text-align:center;">No trucks found</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `);
  } catch (error) {
    console.error('Error loading trucks:', error);
    showModal('Truck Management', `
      <div style="padding: 2rem; text-align: center;">
        <p style="color: red; font-size: 1.2rem; margin-bottom: 1rem;">❌ Error loading trucks</p>
        <p style="color: #666; margin-bottom: 1rem;">${error.message}</p>
        <p style="color: #999; font-size: 0.9rem;">Check the browser console (F12) for more details</p>
        <button onclick="showTruckManagement()" class="btn" style="margin-top: 1rem;">🔄 Try Again</button>
      </div>
    `);
  }
}

window.showAddTruckForm = function() {
  showModal('Add New Truck', `
    <form id="addTruckForm">
      <div class="form-group">
        <label>Truck ID *</label>
        <input type="text" id="newTruckId" placeholder="e.g., TRUCK-003" required>
      </div>
      <div class="form-group">
        <label>Plate Number *</label>
        <input type="text" id="newPlateNumber" placeholder="e.g., ABC-1234" required style="text-transform: uppercase;">
      </div>
      <div class="form-group">
        <label>Model *</label>
        <input type="text" id="newModel" placeholder="e.g., Isuzu Elf" required>
      </div>
      <div class="form-group">
        <label>Capacity (kg) *</label>
        <input type="number" id="newCapacity" value="1000" min="100" required>
      </div>
      <div class="form-group">
        <label>Notes</label>
        <textarea id="newNotes" rows="3" placeholder="Additional information about the truck"></textarea>
      </div>
      <button type="submit" class="btn">Add Truck</button>
      <button type="button" onclick="showTruckManagement()" class="btn" style="background: #999;">Cancel</button>
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
      const response = await fetch(`${API_URL}/trucks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(truckData)
      });
      
      if (response.ok) {
        alert('Truck added successfully!');
        showTruckManagement();
      } else {
        const error = await response.json();
        alert('Error: ' + (error.error || 'Failed to add truck'));
      }
    } catch (error) {
      alert('Error adding truck: ' + error.message);
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
      `<option value="${d.username}" ${truck.assignedDriver === d.username ? 'selected' : ''}>${d.fullName} (${d.username})</option>`
    ).join('');
    
    showModal('Edit Truck', `
      <form id="editTruckForm">
        <div class="form-group">
          <label>Truck ID</label>
          <input type="text" value="${truck.truckId}" disabled>
        </div>
        <div class="form-group">
          <label>Plate Number *</label>
          <input type="text" id="editPlateNumber" value="${truck.plateNumber}" required style="text-transform: uppercase;">
        </div>
        <div class="form-group">
          <label>Model</label>
          <input type="text" id="editModel" value="${truck.model || ''}">
        </div>
        <div class="form-group">
          <label>Capacity (kg)</label>
          <input type="number" id="editCapacity" value="${truck.capacity}" min="100">
        </div>
        <div class="form-group">
          <label>Status</label>
          <select id="editStatus">
            <option value="available" ${truck.status === 'available' ? 'selected' : ''}>Available</option>
            <option value="in-use" ${truck.status === 'in-use' ? 'selected' : ''}>In Use</option>
            <option value="maintenance" ${truck.status === 'maintenance' ? 'selected' : ''}>Maintenance</option>
            <option value="out-of-service" ${truck.status === 'out-of-service' ? 'selected' : ''}>Out of Service</option>
          </select>
        </div>
        <div class="form-group">
          <label>Assigned Driver</label>
          <select id="editDriver">
            <option value="">None</option>
            ${driverOptions}
          </select>
        </div>
        <div class="form-group">
          <label>Fuel Level (%)</label>
          <input type="number" id="editFuel" value="${truck.fuelLevel}" min="0" max="100">
        </div>
        <div class="form-group">
          <label>Mileage (km)</label>
          <input type="number" id="editMileage" value="${truck.mileage}" min="0">
        </div>
        <div class="form-group">
          <label>Last Maintenance</label>
          <input type="date" id="editLastMaintenance" value="${truck.lastMaintenance || ''}">
        </div>
        <div class="form-group">
          <label>Next Maintenance</label>
          <input type="date" id="editNextMaintenance" value="${truck.nextMaintenance || ''}">
        </div>
        <div class="form-group">
          <label>Notes</label>
          <textarea id="editNotes" rows="3">${truck.notes || ''}</textarea>
        </div>
        <button type="submit" class="btn">Update Truck</button>
        <button type="button" onclick="showTruckManagement()" class="btn" style="background: #999;">Cancel</button>
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
        const response = await fetch(`${API_URL}/trucks/${truckId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        });
        
        if (response.ok) {
          alert('Truck updated successfully!');
          showTruckManagement();
        } else {
          const error = await response.json();
          alert('Error: ' + (error.error || 'Failed to update truck'));
        }
      } catch (error) {
        alert('Error updating truck: ' + error.message);
      }
    });
  } catch (error) {
    alert('Error loading truck: ' + error.message);
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
    
    const driverOptions = drivers.map(d => 
      `<option value="${d.username}" ${truck.assignedDriver === d.username ? 'selected' : ''}>${d.fullName} (${d.username})</option>`
    ).join('');
    
    showModal('Assign Driver', `
      <form id="assignDriverForm">
        <div class="form-group">
          <label>Truck</label>
          <input type="text" value="${truck.truckId} - ${truck.plateNumber}" disabled>
        </div>
        <div class="form-group">
          <label>Select Driver *</label>
          <select id="assignDriverSelect" required>
            <option value="">-- Select Driver --</option>
            ${driverOptions}
          </select>
        </div>
        <div class="form-group">
          <label>Update Status</label>
          <select id="assignStatus">
            <option value="in-use">In Use</option>
            <option value="available">Available</option>
          </select>
        </div>
        <button type="submit" class="btn">Assign Driver</button>
        <button type="button" onclick="showTruckManagement()" class="btn" style="background: #999;">Cancel</button>
      </form>
    `);
    
    document.getElementById('assignDriverForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const selectedDriver = document.getElementById('assignDriverSelect').value;
      const status = document.getElementById('assignStatus').value;
      
      if (!selectedDriver) {
        alert('Please select a driver');
        return;
      }
      
      try {
        const response = await fetch(`${API_URL}/trucks/${truckId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assignedDriver: selectedDriver,
            status: status
          })
        });
        
        if (response.ok) {
          alert('Driver assigned successfully!');
          showTruckManagement();
        } else {
          const error = await response.json();
          alert('Error: ' + (error.error || 'Failed to assign driver'));
        }
      } catch (error) {
        alert('Error assigning driver: ' + error.message);
      }
    });
  } catch (error) {
    alert('Error loading data: ' + error.message);
  }
};

window.deleteTruck = async function(truckId) {
  if (!confirm('Are you sure you want to delete this truck?')) {
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/trucks/${truckId}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      alert('Truck deleted successfully!');
      showTruckManagement();
    } else {
      const error = await response.json();
      alert('Error: ' + (error.error || 'Failed to delete truck'));
    }
  } catch (error) {
    alert('Error deleting truck: ' + error.message);
  }
};


// Routes Management Functions
let routeLocations = [];
let tempMarkers = [];
let isAddingLocation = false;

async function showRoutesManagement() {
  try {
    const token = localStorage.getItem('token');
    const headers = {
      'Authorization': `Bearer ${token}`
    };
    
    const [routesRes, usersRes] = await Promise.all([
      fetch(`${API_URL}/routes`, { headers }),
      fetch(`${API_URL}/users`, { headers })
    ]);
    
    const routes = await routesRes.json();
    const users = await usersRes.json();
    const drivers = users.filter(u => u.role === 'driver');
    
    const routesList = routes.map(r => {
      const driver = drivers.find(d => d.username === r.assignedDriver);
      const isAssigned = !!r.assignedDriver;
      const assignBtnStyle = isAssigned ? 'background: #999; cursor: not-allowed;' : 'background: #4caf50;';
      const assignBtnText = isAssigned ? '🔒 Assigned' : '👤 Assign';
      
      return `
        <tr style="${isAssigned ? 'background: #f0f8ff;' : ''}">
          <td><strong>${r.routeId}</strong></td>
          <td>${r.name || '-'}</td>
          <td>${r.path ? r.path.coordinates.length : 0} locations</td>
          <td>${r.distance ? (r.distance / 1000).toFixed(2) + ' km' : '-'}</td>
          <td>${driver ? `<strong style="color: #4caf50;">✓ ${driver.fullName}</strong>` : '<span style="color: #999;">Not assigned</span>'}</td>
          <td><span style="padding: 0.25rem 0.5rem; border-radius: 4px; background: ${r.status === 'active' ? '#ff9800' : r.status === 'completed' ? '#4caf50' : '#2196f3'}; color: white; font-size: 0.85rem;">${r.status}</span></td>
          <td>
            <button onclick="assignRouteToDriver('${r._id || r.routeId}')" class="btn-small" style="${assignBtnStyle}">${assignBtnText}</button>
            <button onclick="viewRoute('${r._id || r.routeId}')" class="btn-small">👁️ View</button>
            <button onclick="deleteRoute('${r._id || r.routeId}')" class="btn-small btn-danger">🗑️ Delete</button>
          </td>
        </tr>
      `;
    }).join('');
    
    showModal('Routes Management', `
      <div class="routes-management">
        <button onclick="showAddRouteForm()" class="btn" style="margin-bottom: 1rem;">➕ Add New Route</button>
        
        <div style="overflow-x: auto;">
          <table class="user-table">
            <thead>
              <tr>
                <th>Route ID</th>
                <th>Name</th>
                <th>Locations</th>
                <th>Distance</th>
                <th>Assigned Driver</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${routesList || '<tr><td colspan="6" style="text-align:center;">No routes found</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `);
  } catch (error) {
    console.error('Error loading routes:', error);
    showModal('Routes Management', '<p style="color: red;">Error loading routes</p>');
  }
}

window.showAddRouteForm = function() {
  routeLocations = [];
  clearTempMarkers();
  
  showModal('Add New Route', `
    <form id="addRouteForm">
      <div class="form-group">
        <label>Route Name *</label>
        <input type="text" id="newRouteName" placeholder="e.g., Downtown Collection Route" required>
      </div>
      <div class="form-group">
        <label>Locations</label>
        <div style="background: #f5f5f5; padding: 1rem; border-radius: 8px; margin-bottom: 0.5rem;">
          <div id="locationsList" style="max-height: 150px; overflow-y: auto;">
            <p style="color: #999; font-style: italic;">No locations added yet</p>
          </div>
        </div>
        <button type="button" onclick="openMapPicker()" class="btn" style="background: #4caf50;">
          🗺️ Add Location (Open Map)
        </button>
        <button type="button" onclick="clearLocations()" class="btn" style="background: #f44336; margin-top: 0.5rem;">
          Clear All Locations
        </button>
      </div>
      <div class="form-group">
        <label>Notes</label>
        <textarea id="newRouteNotes" rows="3" placeholder="Additional information about the route"></textarea>
      </div>
      <button type="submit" class="btn">Save Route</button>
      <button type="button" onclick="cancelAddRoute()" class="btn" style="background: #999;">Cancel</button>
    </form>
  `);
  
  document.getElementById('addRouteForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (routeLocations.length < 2) {
      alert('Please add at least 2 locations for the route');
      return;
    }
    
    const routeData = {
      routeId: 'ROUTE-' + Date.now(), // Auto-generate route ID
      name: document.getElementById('newRouteName').value,
      path: {
        coordinates: routeLocations
      },
      notes: document.getElementById('newRouteNotes').value,
      status: 'planned'
    };
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/routes`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(routeData)
      });
      
      if (response.ok) {
        alert('Route added successfully!');
        clearTempMarkers();
        showRoutesManagement();
      } else {
        const error = await response.json();
        alert('Error: ' + (error.error || 'Failed to add route'));
      }
    } catch (error) {
      alert('Error adding route: ' + error.message);
    }
  });
};

window.openMapPicker = function() {
  // Create map picker modal
  const mapModal = document.createElement('div');
  mapModal.id = 'mapPickerModal';
  mapModal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; align-items: center; justify-content: center;';
  
  mapModal.innerHTML = `
    <div style="background: white; border-radius: 15px; width: 95%; max-width: 1400px; height: 90%; display: flex; overflow: hidden;">
      <!-- Left Panel: Map -->
      <div style="flex: 1; display: flex; flex-direction: column;">
        <div style="padding: 1.5rem; border-bottom: 2px solid #e0e0e0;">
          <h2 style="margin: 0; color: #333;">📍 Click on Map to Add Location</h2>
          <p style="margin: 0.5rem 0 0 0; color: #666; font-size: 0.9rem;">💡 Click anywhere on the map to add a location</p>
        </div>
        <div id="mapPickerContainer" style="flex: 1; position: relative;"></div>
      </div>
      
      <!-- Right Panel: Locations List -->
      <div style="width: 350px; border-left: 2px solid #e0e0e0; display: flex; flex-direction: column; background: #f9f9f9;">
        <div style="padding: 1rem; border-bottom: 2px solid #e0e0e0; background: #4caf50; color: white;">
          <h3 style="margin: 0; font-size: 1.1rem;">📋 Added Locations</h3>
          <p style="margin: 0.5rem 0 0 0; font-size: 0.85rem;" id="locationCount">0 locations</p>
        </div>
        
        <div id="pickerLocationsList" style="flex: 1; overflow-y: auto; padding: 1rem;">
          <p style="color: #999; text-align: center; font-style: italic;">No locations added yet</p>
        </div>
        
        <div style="padding: 1rem; border-top: 2px solid #e0e0e0; background: white;">
          <button onclick="saveAndCloseMapPicker()" class="btn" style="width: 100%; background: #4caf50; margin-bottom: 0.5rem;">
            ✓ Save Locations
          </button>
          <button onclick="clearPickerLocations()" class="btn" style="width: 100%; background: #f44336;">
            🗑️ Clear All
          </button>
          <button onclick="closeMapPicker()" class="btn" style="width: 100%; background: #999; margin-top: 0.5rem;">
            ✕ Cancel
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(mapModal);
  
  // Create a new map instance for the picker
  setTimeout(() => {
    const pickerMap = L.map('mapPickerContainer').setView(MATI_CENTER, 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(pickerMap);
    
    // Add city boundary
    L.rectangle(MATI_BOUNDS, {
      color: '#667eea',
      weight: 2,
      fillOpacity: 0,
      dashArray: '5, 5'
    }).addTo(pickerMap);
    
    // Add existing locations
    routeLocations.forEach((loc, index) => {
      const marker = L.circleMarker([loc[1], loc[0]], {
        radius: 8,
        fillColor: '#667eea',
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
      }).addTo(pickerMap);
      marker.bindPopup(`Location ${index + 1}`);
      
      if (index > 0) {
        const prevLoc = routeLocations[index - 1];
        L.polyline([[prevLoc[1], prevLoc[0]], [loc[1], loc[0]]], {
          color: '#667eea',
          weight: 3
        }).addTo(pickerMap);
      }
    });
    
    // Handle map clicks
    pickerMap.on('click', (e) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      
      // Validate bounds
      if (lat < 6.85 || lat > 7.05 || lng < 126.10 || lng > 126.35) {
        alert('Please click within Mati City boundaries!');
        return;
      }
      
      routeLocations.push([lng, lat]);
      
      // Add marker
      const marker = L.circleMarker([lat, lng], {
        radius: 8,
        fillColor: '#4caf50',
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
      }).addTo(pickerMap);
      marker.bindPopup(`Location ${routeLocations.length}`).openPopup();
      
      // Draw line
      if (routeLocations.length > 1) {
        const prevLoc = routeLocations[routeLocations.length - 2];
        L.polyline([[prevLoc[1], prevLoc[0]], [lat, lng]], {
          color: '#4caf50',
          weight: 3
        }).addTo(pickerMap);
      }
      
      updatePickerLocationsList();
    });
    
    // Initial update of locations list
    updatePickerLocationsList();
    
    // Store map instance for cleanup
    window.pickerMapInstance = pickerMap;
  }, 100);
};

// Update locations list in picker modal
function updatePickerLocationsList() {
  const listContainer = document.getElementById('pickerLocationsList');
  const countElement = document.getElementById('locationCount');
  
  if (!listContainer) return;
  
  if (routeLocations.length === 0) {
    listContainer.innerHTML = '<p style="color: #999; text-align: center; font-style: italic;">No locations added yet</p>';
    if (countElement) countElement.textContent = '0 locations';
  } else {
    if (countElement) countElement.textContent = `${routeLocations.length} location${routeLocations.length > 1 ? 's' : ''}`;
    
    listContainer.innerHTML = routeLocations.map((loc, index) => `
      <div style="background: white; padding: 0.75rem; margin-bottom: 0.5rem; border-radius: 8px; border-left: 4px solid #4caf50;">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div style="flex: 1;">
            <div style="font-weight: 600; color: #4caf50; margin-bottom: 0.25rem;">📍 Location ${index + 1}</div>
            <div style="font-size: 0.85rem; color: #666;">
              Lat: ${loc[1].toFixed(6)}<br>
              Lng: ${loc[0].toFixed(6)}
            </div>
          </div>
          <button onclick="removePickerLocation(${index})" style="background: #f44336; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 4px; cursor: pointer; font-size: 0.85rem;">✕</button>
        </div>
      </div>
    `).join('');
  }
}

// Remove location from picker
window.removePickerLocation = function(index) {
  routeLocations.splice(index, 1);
  
  // Refresh the map
  if (window.pickerMapInstance) {
    window.pickerMapInstance.eachLayer(layer => {
      if (layer instanceof L.CircleMarker || layer instanceof L.Polyline) {
        window.pickerMapInstance.removeLayer(layer);
      }
    });
    
    // Redraw all locations
    routeLocations.forEach((loc, i) => {
      const marker = L.circleMarker([loc[1], loc[0]], {
        radius: 8,
        fillColor: '#4caf50',
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
      }).addTo(window.pickerMapInstance);
      marker.bindPopup(`Location ${i + 1}`);
      
      if (i > 0) {
        const prevLoc = routeLocations[i - 1];
        L.polyline([[prevLoc[1], prevLoc[0]], [loc[1], loc[0]]], {
          color: '#4caf50',
          weight: 3
        }).addTo(window.pickerMapInstance);
      }
    });
  }
  
  updatePickerLocationsList();
};

// Clear all locations in picker
window.clearPickerLocations = function() {
  if (routeLocations.length === 0) return;
  
  if (!confirm('Clear all locations?')) return;
  
  routeLocations = [];
  
  // Clear map markers
  if (window.pickerMapInstance) {
    window.pickerMapInstance.eachLayer(layer => {
      if (layer instanceof L.CircleMarker || layer instanceof L.Polyline) {
        window.pickerMapInstance.removeLayer(layer);
      }
    });
  }
  
  updatePickerLocationsList();
};

// Save and close map picker
window.saveAndCloseMapPicker = function() {
  if (routeLocations.length < 2) {
    alert('Please add at least 2 locations for the route');
    return;
  }
  
  closeMapPicker();
  updateLocationsList();
  alert(`✓ ${routeLocations.length} locations saved!`);
};

window.closeMapPicker = function() {
  const modal = document.getElementById('mapPickerModal');
  if (modal) {
    if (window.pickerMapInstance) {
      window.pickerMapInstance.remove();
      window.pickerMapInstance = null;
    }
    modal.remove();
  }
};

// Removed onMapClick - using modal map picker instead

function updateLocationsList() {
  const container = document.getElementById('locationsList');
  if (!container) return;
  
  if (routeLocations.length === 0) {
    container.innerHTML = '<p style="color: #999; font-style: italic;">No locations added yet</p>';
  } else {
    container.innerHTML = routeLocations.map((loc, index) => `
      <div style="padding: 0.5rem; background: white; margin-bottom: 0.25rem; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
        <span><strong>Location ${index + 1}:</strong> ${loc[1].toFixed(6)}, ${loc[0].toFixed(6)}</span>
        <button onclick="removeLocation(${index})" style="background: #f44336; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 4px; cursor: pointer;">✕</button>
      </div>
    `).join('');
  }
}

window.removeLocation = function(index) {
  routeLocations.splice(index, 1);
  clearTempMarkers();
  
  // Redraw markers and lines
  routeLocations.forEach((loc, i) => {
    const marker = L.circleMarker([loc[1], loc[0]], {
      radius: 8,
      fillColor: '#667eea',
      color: '#fff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8
    }).addTo(map);
    
    marker.bindPopup(`Location ${i + 1}<br>Lat: ${loc[1].toFixed(6)}<br>Lng: ${loc[0].toFixed(6)}`);
    tempMarkers.push(marker);
    
    if (i > 0) {
      const line = L.polyline([routeLocations[i-1], routeLocations[i]].map(c => [c[1], c[0]]), {
        color: '#667eea',
        weight: 3,
        opacity: 0.7
      }).addTo(map);
      tempMarkers.push(line);
    }
  });
  
  updateLocationsList();
};

window.clearLocations = function() {
  if (routeLocations.length > 0 && !confirm('Clear all locations?')) {
    return;
  }
  routeLocations = [];
  clearTempMarkers();
  updateLocationsList();
};

function clearTempMarkers() {
  tempMarkers.forEach(marker => map.removeLayer(marker));
  tempMarkers = [];
}

window.cancelAddRoute = function() {
  closeMapPicker();
  clearTempMarkers();
  routeLocations = [];
  showRoutesManagement();
};

window.viewRoute = async function(routeId) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/routes/${routeId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const route = await response.json();
    
    showModal('View Route', `
      <div>
        <p><strong>Route ID:</strong> ${route.routeId}</p>
        <p><strong>Name:</strong> ${route.name || '-'}</p>
        <p><strong>Status:</strong> ${route.status}</p>
        <p><strong>Locations:</strong> ${route.path ? route.path.coordinates.length : 0}</p>
        <p><strong>Distance:</strong> ${route.distance ? (route.distance / 1000).toFixed(2) + ' km' : '-'}</p>
        <p><strong>Notes:</strong> ${route.notes || '-'}</p>
        <button onclick="showRoutesManagement()" class="btn">Back</button>
      </div>
    `);
    
    // Display route on map
    if (route.path && route.path.coordinates) {
      clearTempMarkers();
      const coords = route.path.coordinates.map(c => [c[1], c[0]]);
      const line = L.polyline(coords, { color: '#667eea', weight: 4 }).addTo(map);
      tempMarkers.push(line);
      map.fitBounds(line.getBounds());
    }
  } catch (error) {
    alert('Error loading route: ' + error.message);
  }
};

window.deleteRoute = async function(routeId) {
  if (!confirm('Are you sure you want to delete this route?')) {
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/routes/${routeId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      alert('Route deleted successfully!');
      showRoutesManagement();
    } else {
      const error = await response.json();
      alert('Error: ' + (error.error || 'Failed to delete route'));
    }
  } catch (error) {
    alert('Error deleting route: ' + error.message);
  }
};


window.unassignRoute = async function(routeId) {
  if (!confirm('Are you sure you want to unassign this route? The driver will no longer see this route in their dashboard.')) {
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/routes/${routeId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        assignedDriver: null,
        status: 'planned'
      })
    });
    
    if (response.ok) {
      alert('Route unassigned successfully! You can now assign it to another driver.');
      showRoutesManagement();
    } else {
      const error = await response.json();
      alert('Error: ' + (error.error || 'Failed to unassign route'));
    }
  } catch (error) {
    alert('Error unassigning route: ' + error.message);
  }
};

window.assignRouteToDriver = async function(routeId) {
  try {
    const token = localStorage.getItem('token');
    const headers = {
      'Authorization': `Bearer ${token}`
    };
    
    const [routeRes, usersRes] = await Promise.all([
      fetch(`${API_URL}/routes/${routeId}`, { headers }),
      fetch(`${API_URL}/users`, { headers })
    ]);
    
    const route = await routeRes.json();
    const users = await usersRes.json();
    const drivers = users.filter(u => u.role === 'driver');
    
    // Check if route is already assigned
    if (route.assignedDriver) {
      const assignedDriverInfo = drivers.find(d => d.username === route.assignedDriver);
      const driverName = assignedDriverInfo ? assignedDriverInfo.fullName : route.assignedDriver;
      
      const canUnassign = route.status === 'completed';
      
      showModal('Route Already Assigned', `
        <div style="padding: 1rem;">
          <p style="color: #ff9800; font-weight: 600; margin-bottom: 1rem;">⚠️ This route is already assigned!</p>
          <div style="background: #f5f5f5; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
            <p><strong>Route:</strong> ${route.routeId} - ${route.name}</p>
            <p><strong>Assigned to:</strong> ${driverName}</p>
            <p><strong>Status:</strong> <span style="padding: 0.25rem 0.5rem; border-radius: 4px; background: ${route.status === 'active' ? '#ff9800' : route.status === 'completed' ? '#4caf50' : '#2196f3'}; color: white; font-size: 0.85rem;">${route.status}</span></p>
          </div>
          <p style="color: #666; font-size: 0.9rem; margin-bottom: 1rem;">
            Ang route na ito ay naka-assign na kay <strong>${driverName}</strong>. 
            Hindi na pwedeng i-assign sa ibang driver para maiwasan ang conflict.
          </p>
          ${canUnassign ? `
            <p style="color: #4caf50; font-size: 0.9rem; margin-bottom: 1rem;">
              ✓ Ang route na ito ay <strong>completed</strong> na. Pwede mo na itong i-unassign para ma-assign sa bagong driver.
            </p>
            <button onclick="unassignRoute('${routeId}')" class="btn" style="background: #ff9800; margin-right: 0.5rem;">🔓 Unassign Route</button>
          ` : `
            <p style="color: #666; font-size: 0.9rem; margin-bottom: 1rem;">
              Kung gusto mong i-unassign, kailangan mong i-complete muna ang route.
            </p>
          `}
          <button onclick="showRoutesManagement()" class="btn" style="background: #999;">Back to Routes</button>
        </div>
      `);
      return;
    }
    
    const driverOptions = drivers.map(d => 
      `<option value="${d.username}">${d.fullName} (${d.username})</option>`
    ).join('');
    
    showModal('Assign Route to Driver', `
      <form id="assignRouteForm">
        <div class="form-group">
          <label>Route</label>
          <input type="text" value="${route.routeId} - ${route.name}" disabled>
        </div>
        <div class="form-group">
          <label>Select Driver *</label>
          <select id="assignRouteDriverSelect" required>
            <option value="">-- Select Driver --</option>
            ${driverOptions}
          </select>
        </div>
        <div class="form-group">
          <label>Update Status</label>
          <select id="assignRouteStatus">
            <option value="active" ${route.status === 'active' ? 'selected' : ''}>Active</option>
            <option value="planned" ${route.status === 'planned' ? 'selected' : ''}>Planned</option>
            <option value="completed" ${route.status === 'completed' ? 'selected' : ''}>Completed</option>
          </select>
        </div>
        <button type="submit" class="btn">Assign Route</button>
        <button type="button" onclick="showRoutesManagement()" class="btn" style="background: #999;">Cancel</button>
      </form>
    `);
    
    document.getElementById('assignRouteForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const selectedDriver = document.getElementById('assignRouteDriverSelect').value;
      const status = document.getElementById('assignRouteStatus').value;
      
      if (!selectedDriver) {
        alert('Please select a driver');
        return;
      }
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/routes/${routeId}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            assignedDriver: selectedDriver,
            status: status
          })
        });
        
        if (response.ok) {
          alert('Route assigned successfully!');
          showRoutesManagement();
        } else {
          const error = await response.json();
          alert('Error: ' + (error.error || 'Failed to assign route'));
        }
      } catch (error) {
        alert('Error assigning route: ' + error.message);
      }
    });
  } catch (error) {
    alert('Error loading data: ' + error.message);
  }
};


// Driver Dashboard Functions
async function loadDriverAssignments() {
  const container = document.getElementById('driverAssignments');
  
  try {
    container.innerHTML = '<p style="color: #666;">Loading assignments...</p>';
    
    const token = localStorage.getItem('token');
    const headers = {
      'Authorization': `Bearer ${token}`
    };
    
    const [routesRes, trucksRes] = await Promise.all([
      fetch(`${API_URL}/routes`, { headers }),
      fetch(`${API_URL}/trucks`, { headers })
    ]);
    
    if (!routesRes.ok || !trucksRes.ok) {
      const routesError = !routesRes.ok ? await routesRes.text() : '';
      const trucksError = !trucksRes.ok ? await trucksRes.text() : '';
      console.error('Routes error:', routesError);
      console.error('Trucks error:', trucksError);
      throw new Error(`Failed to load data - Routes: ${routesRes.status}, Trucks: ${trucksRes.status}`);
    }
    
    const routes = await routesRes.json();
    const trucks = await trucksRes.json();
    
    // Filter routes assigned to this driver
    const myRoutes = routes.filter(r => r.assignedDriver === user.username);
    
    // Filter trucks assigned to this driver
    const myTrucks = trucks.filter(t => t.assignedDriver === user.username);
    
    if (myRoutes.length === 0 && myTrucks.length === 0) {
      container.innerHTML = '<p style="color: #999; font-style: italic;">No assignments yet</p>';
      return;
    }
    
    let html = '';
    
    // Show assigned trucks
    if (myTrucks.length > 0) {
      html += '<div style="margin-bottom: 1rem;"><strong>🚛 My Truck:</strong></div>';
      myTrucks.forEach(truck => {
        html += `
          <div style="background: white; padding: 0.75rem; border-radius: 8px; margin-bottom: 0.5rem; border-left: 4px solid #4caf50;">
            <div style="font-weight: 600;">${truck.truckId}</div>
            <div style="font-size: 0.9rem; color: #666;">${truck.plateNumber} - ${truck.model}</div>
            <div style="font-size: 0.85rem; color: #999; margin-top: 0.25rem;">
              Fuel: ${truck.fuelLevel}% | Status: ${truck.status}
            </div>
          </div>
        `;
      });
    }
    
    // Show assigned routes
    if (myRoutes.length > 0) {
      html += '<div style="margin: 1rem 0 0.5rem 0;"><strong>📍 My Routes:</strong></div>';
      myRoutes.forEach(route => {
        const statusColor = route.status === 'active' ? '#ff9800' : route.status === 'completed' ? '#4caf50' : '#2196f3';
        const isCompleted = route.status === 'completed';
        const isPending = route.status === 'pending';
        const isActive = route.status === 'active';
        
        // Check if this route is currently being tracked
        const activeRouteId = localStorage.getItem('activeRouteId');
        const isCurrentlyActive = activeRouteId === (route._id || route.routeId);
        
        let actionButtons = '';
        if (isCompleted) {
          actionButtons = `<span style="color: #4caf50; font-size: 0.85rem;">✓ Completed ${route.completedAt ? new Date(route.completedAt).toLocaleDateString() : ''}</span>`;
        } else if (isCurrentlyActive) {
          actionButtons = `
            <button onclick="markRouteComplete('${route._id || route.routeId}')" class="btn-small" style="background: #4caf50;">✓ Mark as Complete</button>
            <button onclick="stopCollection()" class="btn-small" style="background: #f44336; margin-left: 0.5rem;">⏹️ Stop</button>
          `;
        } else {
          actionButtons = `
            <button onclick="startCollection('${route._id || route.routeId}')" class="btn-small" style="background: #4caf50;">🚀 Start Collection</button>
          `;
        }
        
        html += `
          <div style="background: white; padding: 0.75rem; border-radius: 8px; margin-bottom: 0.5rem; border-left: 4px solid ${statusColor};">
            <div style="display: flex; justify-content: space-between; align-items: start;">
              <div style="flex: 1;">
                <div style="font-weight: 600;">${route.name}</div>
                <div style="font-size: 0.9rem; color: #666;">${route.routeId}</div>
                <div style="font-size: 0.85rem; color: #999; margin-top: 0.25rem;">
                  ${route.path ? route.path.coordinates.length : 0} locations | ${route.distance ? (route.distance / 1000).toFixed(2) + ' km' : '-'}
                </div>
              </div>
              ${isCurrentlyActive ? '<div style="background: #4caf50; color: white; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; white-space: nowrap;">🚛 In Progress</div>' : ''}
            </div>
            <div style="margin-top: 0.5rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <button onclick="viewDriverRoute('${route._id || route.routeId}')" class="btn-small">👁️ View on Map</button>
              ${actionButtons}
            </div>
          </div>
        `;
      });
    }
    
    container.innerHTML = html;
    
    // Auto-refresh every 30 seconds
    setTimeout(loadDriverAssignments, 30000);
  } catch (error) {
    console.error('Error loading assignments:', error);
    const container = document.getElementById('driverAssignments');
    if (container) {
      container.innerHTML = `
        <p style="color: #f44336;">Error loading assignments</p>
        <p style="color: #999; font-size: 0.85rem; margin-top: 0.5rem;">${error.message}</p>
        <button onclick="loadDriverAssignments()" class="btn-small" style="margin-top: 0.5rem;">🔄 Retry</button>
      `;
    }
  }
}

window.viewDriverRoute = async function(routeId) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/routes/${routeId}`, {
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
      
      alert(`Route: ${route.name}\nLocations: ${coords.length}\nDistance: ${route.distance ? (route.distance / 1000).toFixed(2) + ' km' : '-'}`);
    }
  } catch (error) {
    alert('Error loading route: ' + error.message);
  }
};

// Start collection for a route
window.startCollection = async function(routeId) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/routes/${routeId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const route = await response.json();
    
    // Confirm start
    const confirmed = confirm(`Start collection for:\n${route.name} (${route.routeId})\n\nThis will:\n✓ Position truck at first bin\n✓ Start GPS tracking\n✓ Begin route navigation\n\nReady to start?`);
    
    if (!confirmed) return;
    
    // Store active route ID
    localStorage.setItem('activeRouteId', routeId);
    
    // Update route status to active
    await fetch(`${API_URL}/routes/${routeId}`, {
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
    alert(`✓ Collection started!\n\nRoute: ${route.name}\nTruck positioned at first bin\nGPS tracking active`);
    
    // Refresh assignments to show updated status
    loadDriverAssignments();
    
  } catch (error) {
    console.error('Error starting collection:', error);
    alert('Error starting collection: ' + error.message);
  }
};

// Stop collection
window.stopCollection = function() {
  const confirmed = confirm('Stop current collection?\n\nThis will:\n✗ Stop GPS tracking\n✗ Remove truck from map\n✗ Clear active route\n\nYou can restart later.');
  
  if (!confirmed) return;
  
  // Stop GPS tracking
  stopGPSTracking();
  
  // Clear active route
  localStorage.removeItem('activeRouteId');
  
  // Refresh assignments
  loadDriverAssignments();
  
  alert('✓ Collection stopped\n\nYou can restart anytime from your assignments.');
};

window.markRouteComplete = async function(routeId) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/routes/${routeId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const route = await response.json();
    
    showModal('Mark Route as Complete', `
      <form id="completeRouteForm" enctype="multipart/form-data">
        <div class="form-group">
          <label>Route</label>
          <input type="text" value="${route.name} (${route.routeId})" disabled>
        </div>
        
        <div class="form-group">
          <label>Upload Proof Photos * (1-10 photos)</label>
          <input type="file" id="completionPhotos" accept="image/*" multiple required style="padding: 0.5rem; border: 2px dashed #667eea; border-radius: 8px; width: 100%;">
          <p style="color: #666; font-size: 0.85rem; margin-top: 0.5rem;">
            📸 Upload photos ng collected waste as proof. Max 5MB per photo.
          </p>
          <div id="photoPreview" style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem;"></div>
        </div>
        
        <div class="form-group">
          <label>Completion Notes</label>
          <textarea id="completionNotes" rows="3" placeholder="Add any notes about the collection (optional)"></textarea>
        </div>
        
        <div style="background: #fff3e0; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
          <p style="color: #e65100; margin: 0; font-size: 0.9rem;">
            ⚠️ Once marked as complete, the admin will be notified and this route will be locked.
          </p>
        </div>
        
        <button type="submit" class="btn" style="background: #4caf50;">✓ Mark as Complete</button>
        <button type="button" onclick="closeModal()" class="btn" style="background: #999;">Cancel</button>
      </form>
    `);
    
    // Photo preview
    document.getElementById('completionPhotos').addEventListener('change', function(e) {
      const preview = document.getElementById('photoPreview');
      preview.innerHTML = '';
      const files = Array.from(e.target.files);
      
      if (files.length > 10) {
        alert('Maximum 10 photos allowed');
        e.target.value = '';
        return;
      }
      
      files.forEach(file => {
        if (file.size > 5 * 1024 * 1024) {
          alert(`File ${file.name} is too large. Max 5MB per photo.`);
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
      
      if (photos.length === 0) {
        alert('Please upload at least one photo as proof');
        return;
      }
      
      const formData = new FormData();
      for (let i = 0; i < photos.length; i++) {
        formData.append('photos', photos[i]);
      }
      formData.append('notes', notes);
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/completions/${routeId}/complete`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        if (response.ok) {
          const result = await response.json();
          alert('✓ Route marked as complete! Admin has been notified.');
          closeModal();
          loadDriverAssignments();
        } else {
          const error = await response.json();
          alert('Error: ' + (error.error || 'Failed to complete route'));
        }
      } catch (error) {
        alert('Error completing route: ' + error.message);
      }
    });
  } catch (error) {
    alert('Error loading route: ' + error.message);
  }
};

window.updateRouteStatus = async function(routeId) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/routes/${routeId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const route = await response.json();
    
    showModal('Update Route Status', `
      <form id="updateStatusForm">
        <div class="form-group">
          <label>Route</label>
          <input type="text" value="${route.name}" disabled>
        </div>
        <div class="form-group">
          <label>Current Status</label>
          <input type="text" value="${route.status}" disabled>
        </div>
        <div class="form-group">
          <label>New Status *</label>
          <select id="newStatus" required>
            <option value="active" ${route.status === 'active' ? 'selected' : ''}>Active (In Progress)</option>
            <option value="completed" ${route.status === 'completed' ? 'selected' : ''}>Completed</option>
          </select>
        </div>
        <div class="form-group">
          <label>Notes</label>
          <textarea id="statusNotes" rows="3" placeholder="Add any notes about this update..."></textarea>
        </div>
        <button type="submit" class="btn">Update Status</button>
        <button type="button" onclick="closeModal()" class="btn" style="background: #999;">Cancel</button>
      </form>
    `);
    
    document.getElementById('updateStatusForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const newStatus = document.getElementById('newStatus').value;
      const notes = document.getElementById('statusNotes').value;
      
      try {
        const token = localStorage.getItem('token');
        const updateResponse = await fetch(`${API_URL}/routes/${routeId}`, {
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
          alert('Status updated successfully!');
          closeModal();
          loadDriverAssignments();
        } else {
          const error = await updateResponse.json();
          alert('Error: ' + (error.error || 'Failed to update status'));
        }
      } catch (error) {
        alert('Error updating status: ' + error.message);
      }
    });
  } catch (error) {
    alert('Error loading route: ' + error.message);
  }
};


// Admin Notification System
// Create permanent notification icon in header
function createNotificationIcon() {
  console.log('createNotificationIcon called, user role:', user.role);
  
  if (user.role !== 'admin') {
    console.log('Not admin, skipping notification icon');
    return;
  }
  
  let badge = document.getElementById('notificationBadge');
  if (badge) {
    console.log('Notification badge already exists');
    return; // Already exists
  }
  
  const container = document.getElementById('headerNotificationContainer');
  console.log('Container found:', container);
  
  if (!container) {
    console.error('headerNotificationContainer not found!');
    return;
  }
  
  badge = document.createElement('button');
  badge.id = 'notificationBadge';
  badge.style.cssText = `
    position: relative;
    background: linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%);
    color: #666;
    padding: 0.5rem 1rem;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    transition: all 0.3s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  `;
  badge.innerHTML = '<span style="font-size: 1.2rem;">🔔</span><span id="notificationText" style="color: #999;">No New</span>';
  badge.title = 'Click to view notification history';
  badge.onclick = () => showNotificationHistory();
  badge.onmouseover = () => {
    badge.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    badge.style.transform = 'translateY(-2px)';
  };
  badge.onmouseout = () => {
    badge.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    badge.style.transform = 'translateY(0)';
  };
  container.appendChild(badge);
  console.log('Notification badge created successfully!');
}

async function checkCompletionNotifications() {
  if (user.role !== 'admin') return;
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/completions/notifications/pending`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const notifications = await response.json();
      
      if (notifications.length > 0) {
        showCompletionNotifications(notifications);
      }
    }
  } catch (error) {
    console.error('Error checking notifications:', error);
  }
}

function showCompletionNotifications(notifications) {
  // Update existing notification badge
  let badge = document.getElementById('notificationBadge');
  if (!badge) {
    createNotificationIcon();
    badge = document.getElementById('notificationBadge');
  }
  
  if (badge) {
    // Update badge appearance for new notifications
    badge.style.background = 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)';
    badge.style.borderColor = '#4caf50';
    badge.style.animation = 'pulse 2s infinite';
    badge.title = `${notifications.length} new notification${notifications.length > 1 ? 's' : ''} - Click to view`;
    
    const notificationText = document.getElementById('notificationText');
    if (notificationText) {
      notificationText.textContent = `${notifications.length} New`;
      notificationText.style.cssText = `
        background: white;
        color: #4caf50;
        padding: 0.15rem 0.5rem;
        border-radius: 12px;
        font-size: 0.85rem;
        font-weight: bold;
      `;
    }
    badge.style.background = 'white';
    badge.style.color = '#f44336';
    badge.onclick = () => showNotificationDetails(notifications);
  }
}

async function showNotificationDetails(notifications) {
  const notificationsList = notifications.map(route => {
    const completedDate = new Date(route.completedAt).toLocaleString();
    
    return `
      <div style="background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%); padding: 1rem; border-radius: 10px; margin-bottom: 0.75rem; border-left: 5px solid #4caf50; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="flex: 1;">
            <h4 style="margin: 0; color: #4caf50; font-size: 1.2rem;">✓ ${route.completedBy}</h4>
            <p style="margin: 0.25rem 0 0 0; color: #666; font-size: 0.85rem;">completed <strong>${route.name}</strong></p>
            <p style="margin: 0.25rem 0 0 0; color: #999; font-size: 0.8rem;">${completedDate}</p>
          </div>
          <div style="display: flex; gap: 0.5rem; flex-shrink: 0;">
            <button onclick="viewCompletionDetails('${route._id || route.routeId}')" class="btn-small" style="background: #2196f3; color: white; padding: 0.4rem 0.8rem; border: none; border-radius: 5px; cursor: pointer; font-size: 0.85rem;" title="View details">
              👁️ View
            </button>
            <button onclick="markNotificationRead('${route._id || route.routeId}')" class="btn-small" style="background: #4caf50; color: white; padding: 0.4rem 0.8rem; border: none; border-radius: 5px; cursor: pointer; font-size: 0.85rem;" title="Acknowledge">
              ✓
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  showModal('🔔 Active Notifications', `
    <div>
      <div style="margin-bottom: 1rem; padding: 1rem; background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%); border-radius: 8px; border-left: 4px solid #4caf50;">
        <p style="color: #4caf50; font-weight: 700; margin: 0; font-size: 1.1rem;">
          🎉 ${notifications.length} New Completion${notifications.length > 1 ? 's' : ''}!
        </p>
        <p style="color: #666; margin: 0.25rem 0 0 0; font-size: 0.85rem;">
          Drivers have completed their assigned routes
        </p>
      </div>
      <div style="background: #e3f2fd; padding: 0.75rem; border-radius: 6px; margin-bottom: 1rem; border-left: 3px solid #2196f3;">
        <p style="margin: 0; color: #1565c0; font-size: 0.85rem;">
          💡 <strong>Tip:</strong> Click <strong>View</strong> to see details, or <strong>✓</strong> to acknowledge. Use buttons below for bulk actions.
        </p>
      </div>
      <div style="max-height: 500px; overflow-y: auto; padding-right: 0.5rem;">
        ${notificationsList}
      </div>
      <div style="display: flex; gap: 0.75rem; margin-top: 1rem; padding-top: 1rem; border-top: 2px solid #e0e0e0;">
        <button onclick="markAllNotificationsRead()" class="btn" style="background: #4caf50; color: white; flex: 1; padding: 0.75rem; border: none; border-radius: 5px; cursor: pointer; font-weight: 600; font-size: 1rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
          <span>✓</span> Acknowledge All
        </button>
        <button onclick="deleteAllNotifications()" class="btn" style="background: #f44336; color: white; flex: 1; padding: 0.75rem; border: none; border-radius: 5px; cursor: pointer; font-weight: 600; font-size: 1rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
          <span>🗑️</span> Delete All
        </button>
      </div>
    </div>
  `);
}

window.viewCompletionDetails = async function(routeId) {
  try {
    const token = localStorage.getItem('token');
    // Use completions endpoint to get full route details including photos
    const response = await fetch(`${API_URL}/completions/${routeId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      console.error('Failed to fetch route details');
      return;
    }
    
    const route = await response.json();
    
    if (!route) return;
    
    const completedDate = new Date(route.completedAt).toLocaleString();
    const photosHtml = route.completionPhotos && route.completionPhotos.length > 0 ? 
      route.completionPhotos.map((photo, index) => 
        `<img src="${photo}" style="width: 120px; height: 120px; object-fit: cover; border-radius: 8px; margin: 0.25rem; cursor: pointer; border: 2px solid #4caf50;" onclick="openPhotoModal('${index}', ${JSON.stringify(route.completionPhotos).replace(/'/g, "\\'")})" title="Click to view full size">`
      ).join('') : 
      '<p style="color: #999;">No photos uploaded</p>';
    
    showModal(`✓ ${route.name || 'Route Completed'}`, `
      <div style="padding: 0.5rem;">
        <div style="background: #e8f5e9; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
          <p style="margin: 0.5rem 0;"><strong>Route ID:</strong> ${route.routeId}</p>
          <p style="margin: 0.5rem 0;"><strong>👤 Driver:</strong> ${route.completedBy}</p>
          <p style="margin: 0.5rem 0;"><strong>🕐 Completed:</strong> ${completedDate}</p>
          ${route.completionNotes ? `<p style="margin: 0.5rem 0;"><strong>📝 Notes:</strong> ${route.completionNotes}</p>` : ''}
        </div>
        <div>
          <strong>📷 Proof Photos (${route.completionPhotos ? route.completionPhotos.length : 0}):</strong>
          <div style="display: flex; flex-wrap: wrap; margin-top: 0.5rem; gap: 0.5rem;">
            ${photosHtml}
          </div>
        </div>
        <button onclick="closeModal(); checkCompletionNotifications();" class="btn" style="margin-top: 1rem; width: 100%;">Close</button>
      </div>
    `);
  } catch (error) {
    console.error('Error viewing details:', error);
    alert('Error loading completion details: ' + error.message);
  }
};

// Helper function to open photo in full size modal
window.openPhotoModal = function(index, photos) {
  const photo = photos[index];
  const photoWindow = window.open('', '_blank');
  photoWindow.document.write(`
    <html>
      <head><title>Completion Photo ${index + 1}</title></head>
      <body style="margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #000;">
        <img src="${photo}" style="max-width: 100%; max-height: 100vh; object-fit: contain;">
      </body>
    </html>
  `);
};

window.markNotificationRead = async function(routeId) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/completions/notifications/${routeId}/read`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      // Remove notification badge if no more notifications
      checkCompletionNotifications();
      closeModal();
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};

// Delete single notification
window.deleteNotification = async function(routeId) {
  if (!confirm('Permanently delete this route from history? This cannot be undone.')) {
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    
    // Delete the route permanently
    const response = await fetch(`${API_URL}/routes/${routeId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      alert('Route deleted permanently');
      checkCompletionNotifications();
      closeModal();
    } else {
      const error = await response.text();
      console.error('Delete failed:', error);
      alert('Failed to delete route: ' + error);
    }
  } catch (error) {
    console.error('Error deleting notification:', error);
    alert('Error deleting notification: ' + error.message);
  }
};

// Delete all notifications
window.deleteAllNotifications = async function() {
  if (!confirm('Delete all notifications? This cannot be undone.')) {
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    const notificationsRes = await fetch(`${API_URL}/completions/notifications/pending`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const notifications = await notificationsRes.json();
    
    // Mark all as read (delete)
    await Promise.all(notifications.map(route => {
      saveNotificationToHistory(route._id || route.routeId);
      return fetch(`${API_URL}/completions/notifications/${route._id || route.routeId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    }));
    
    // Update badge to show 0 notifications
    const badge = document.getElementById('notificationBadge');
    if (badge) {
      badge.style.background = 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)';
      badge.style.borderColor = '#e0e0e0';
      badge.style.animation = 'none';
      badge.title = 'No new notifications - Click to view history';
      
      const notificationText = document.getElementById('notificationText');
      if (notificationText) {
        notificationText.textContent = 'No New';
        notificationText.style.cssText = 'color: #999;';
      }
    }
    
    alert('All notifications deleted');
    closeModal();
    
    // Check for new notifications after 5 seconds
    setTimeout(checkCompletionNotifications, 5000);
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    alert('Error deleting notifications');
  }
};

// Save notification to history (localStorage)
function saveNotificationToHistory(routeId) {
  const history = JSON.parse(localStorage.getItem('notificationHistory') || '[]');
  history.push({
    routeId,
    deletedAt: new Date().toISOString(),
    deletedBy: user.username
  });
  // Keep only last 50 items
  if (history.length > 50) {
    history.shift();
  }
  localStorage.setItem('notificationHistory', JSON.stringify(history));
}

// Show notification history
window.showNotificationHistory = async function() {
  try {
    const token = localStorage.getItem('token');
    
    // Get all completed routes with photos for history view
    const response = await fetch(`${API_URL}/routes?includePhotos=true`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const routes = await response.json();
    const completedRoutes = routes.filter(r => r.status === 'completed' && r.completedAt);
    
    // Sort by completion date (newest first)
    completedRoutes.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
    
    if (completedRoutes.length === 0) {
      showModal('📜 Notification History', `
        <p style="text-align: center; color: #999; padding: 2rem;">No completion history found</p>
        <button onclick="closeModal()" class="btn" style="width: 100%;">Close</button>
      `);
      return;
    }
    
    const historyList = completedRoutes.map(route => {
      const completedDate = new Date(route.completedAt).toLocaleString();
      const isAcknowledged = route.notificationSent;
      const photosHtml = route.completionPhotos && route.completionPhotos.length > 0 ? 
        route.completionPhotos.map(photo => 
          `<img src="${photo}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; margin: 0.25rem; cursor: pointer; border: 2px solid #e0e0e0;" onclick="window.open('${photo}', '_blank')" title="Click to view full size">`
        ).join('') : 
        '<p style="color: #999; font-size: 0.85rem; font-style: italic;">No photos</p>';
      
      return `
        <div style="background: ${isAcknowledged ? 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)' : 'linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%)'}; padding: 1rem; border-radius: 10px; margin-bottom: 0.75rem; border-left: 5px solid ${isAcknowledged ? '#999' : '#4caf50'}; box-shadow: 0 2px 4px rgba(0,0,0,0.08);">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
            <div style="flex: 1;">
              <h4 style="margin: 0 0 0.25rem 0; color: ${isAcknowledged ? '#666' : '#4caf50'}; font-size: 1rem;">
                ${isAcknowledged ? '✓' : '🔔'} ${route.name}
              </h4>
              <p style="margin: 0; color: #666; font-size: 0.8rem; font-weight: 500;">${route.routeId}</p>
            </div>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <span style="background: ${isAcknowledged ? '#999' : '#4caf50'}; color: white; padding: 0.3rem 0.6rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; white-space: nowrap;">
                ${isAcknowledged ? '✓ Acknowledged' : '✓ Completed'}
              </span>
              <button onclick="deleteHistoryItem('${route._id || route.routeId}')" class="btn-small" style="background: #f44336; color: white; padding: 0.3rem 0.6rem; border: none; border-radius: 5px; cursor: pointer; font-size: 0.75rem; font-weight: 600;" title="Delete from history">
                🗑️
              </button>
            </div>
          </div>
          
          <div style="background: white; padding: 0.6rem; border-radius: 6px; margin: 0.5rem 0; font-size: 0.85rem; border: 1px solid #e0e0e0;">
            <p style="margin: 0.25rem 0;"><strong style="color: #333;">👤 Driver:</strong> <span style="color: ${isAcknowledged ? '#666' : '#4caf50'}; font-weight: 600;">${route.completedBy}</span></p>
            <p style="margin: 0.25rem 0;"><strong style="color: #333;">🕐 Completed:</strong> ${completedDate}</p>
            ${route.completionNotes ? `<p style="margin: 0.25rem 0;"><strong style="color: #333;">📝 Notes:</strong> ${route.completionNotes}</p>` : ''}
          </div>
          
          <div style="margin-top: 0.5rem;">
            <div style="font-size: 0.85rem; font-weight: 600; margin-bottom: 0.25rem; color: #333;">📷 Photos:</div>
            <div style="display: flex; flex-wrap: wrap; gap: 0.25rem;">
              ${photosHtml}
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    showModal('📜 Notification History', `
      <div>
        <div style="background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%); padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border-left: 4px solid #2196f3;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <p style="color: #1976d2; font-weight: 700; margin: 0; font-size: 1.1rem;">
                📜 Complete History
              </p>
              <p style="color: #666; margin: 0.25rem 0 0 0; font-size: 0.85rem;">
                Showing ${completedRoutes.length} completed route${completedRoutes.length > 1 ? 's' : ''}
              </p>
            </div>
            <button onclick="closeModal(); checkCompletionNotifications();" class="btn-small" style="background: #4caf50; color: white; padding: 0.5rem 1rem; border: none; border-radius: 5px; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; white-space: nowrap;" title="View active notifications">
              <span>🔔</span> Active
            </button>
          </div>
        </div>
        <div style="max-height: 500px; overflow-y: auto; padding-right: 0.5rem;">
          ${historyList}
        </div>
        <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
          <button onclick="clearAllHistory()" class="btn" style="flex: 1; background: #f44336; color: white; padding: 0.75rem; border: none; border-radius: 5px; cursor: pointer; font-weight: 600; font-size: 1rem;">🗑️ Clear All</button>
          <button onclick="closeModal()" class="btn" style="flex: 1; background: #2196f3; color: white; padding: 0.75rem; border: none; border-radius: 5px; cursor: pointer; font-weight: 600; font-size: 1rem;">Close</button>
        </div>
      </div>
    `);
  } catch (error) {
    console.error('Error loading history:', error);
    alert('Error loading notification history');
  }
};

// Delete single history item
window.deleteHistoryItem = async function(routeId) {
  if (!confirm('Delete this history item? This will permanently remove it.')) {
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/routes/${routeId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      alert('History item deleted');
      showNotificationHistory(); // Refresh the list
    } else {
      alert('Failed to delete history item');
    }
  } catch (error) {
    console.error('Error deleting history:', error);
    alert('Error deleting history item');
  }
};

// Clear all history
window.clearAllHistory = async function() {
  if (!confirm('Delete ALL history? This will permanently remove all completed routes from history.')) {
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    
    // Get all completed routes
    const response = await fetch(`${API_URL}/routes`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const routes = await response.json();
    const completedRoutes = routes.filter(r => r.status === 'completed' && r.completedAt);
    
    // Delete all completed routes
    await Promise.all(completedRoutes.map(route => 
      fetch(`${API_URL}/routes/${route._id || route.routeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
    ));
    
    alert('All history cleared');
    closeModal();
  } catch (error) {
    console.error('Error clearing history:', error);
    alert('Error clearing history');
  }
};

window.markAllNotificationsRead = async function() {
  try {
    const token = localStorage.getItem('token');
    const notificationsRes = await fetch(`${API_URL}/completions/notifications/pending`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const notifications = await notificationsRes.json();
    
    // Mark all as read
    await Promise.all(notifications.map(route => 
      fetch(`${API_URL}/completions/notifications/${route._id || route.routeId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
    ));
    
    // Update badge to show 0 notifications
    const badge = document.getElementById('notificationBadge');
    if (badge) {
      badge.style.background = 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)';
      badge.style.borderColor = '#e0e0e0';
      badge.style.animation = 'none';
      badge.title = 'No new notifications - Click to view history';
      
      const notificationText = document.getElementById('notificationText');
      if (notificationText) {
        notificationText.textContent = 'No New';
        notificationText.style.cssText = 'color: #999;';
      }
    }
    
    alert('All notifications acknowledged!');
    closeModal();
    
    // Check for new notifications after 5 seconds
    setTimeout(checkCompletionNotifications, 5000);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
};


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

// Create custom truck icon with rotation support
const truckIcon = L.divIcon({
  className: 'truck-marker',
  html: `
    <div class="truck-icon-wrapper" style="
      font-size: 2rem;
      text-align: center;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
      animation: truck-bounce 2s ease-in-out infinite;
      transition: transform 0.5s ease;
    ">🚛</div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

// Start GPS tracking for drivers
async function startGPSTracking() {
  if (user.role !== 'driver') return;
  
  if (!navigator.geolocation) {
    console.error('❌ Geolocation is not supported by this browser');
    alert('GPS Error: Your browser does not support geolocation. Please use a modern browser.');
    return;
  }
  
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
    },
    error => {
      console.error('❌ GPS Error:', error.code, error.message);
      let errorMsg = 'Unknown error';
      switch(error.code) {
        case error.PERMISSION_DENIED:
          errorMsg = 'Location permission denied. Please allow GPS access in your browser settings.';
          alert('📍 GPS Permission Denied!\n\nPlease allow location access:\n1. Click the lock icon in the address bar\n2. Allow Location access\n3. Refresh the page');
          break;
        case error.POSITION_UNAVAILABLE:
          errorMsg = 'Location unavailable. Make sure GPS is enabled on your device.';
          break;
        case error.TIMEOUT:
          errorMsg = 'Location request timed out. Please try again.';
          break;
      }
      console.error('GPS Error Details:', errorMsg);
      showTrackingStatus(false, errorMsg);
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
    const response = await fetch(`${API_URL}/routes`, {
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
      
      // Draw the route on map first
      const coords = firstRoute.path.coordinates.map(c => [c[1], c[0]]);
      
      // Draw route line
      const routeLine = L.polyline(coords, { 
        color: '#2196f3', 
        weight: 3,
        opacity: 0.6,
        dashArray: '5, 10'
      }).addTo(map);
      
      // Add markers for each bin
      coords.forEach((coord, index) => {
        const binMarker = L.circleMarker(coord, {
          radius: 6,
          fillColor: index === 0 ? '#4caf50' : '#2196f3',
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        }).addTo(map);
        
        binMarker.bindPopup(`
          <div style="text-align: center;">
            <strong>${index === 0 ? '🎯 Start' : `📍 Stop ${index}`}</strong><br>
            <span style="font-size: 0.85rem; color: #666;">Location ${index + 1}</span>
          </div>
        `);
      });
      
      // Position truck at first bin (this will create the truck marker)
      updateTruckMarker(mockPosition);
      
      // Set last position for road snapping
      lastPosition = firstBinLatLng;
      
      // Center map on first bin
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
    
    console.log('Truck marker created at:', lat, lng);
  } else {
    // Truck marker already exists, update position
    if (lastPosition) {
      const distance = map.distance(lastPosition, latlng);
      
      console.log('Distance moved:', distance.toFixed(2), 'meters');
      
      // Only update if moved more than 10 meters (to avoid jitter)
      if (distance > 10) {
        console.log('Moving truck from', lastPosition, 'to', latlng);
        
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
      
      // Calculate rotation angle
      const angle = Math.atan2(nextPoint[1] - currentPoint[1], nextPoint[0] - currentPoint[0]) * 180 / Math.PI;
      const truckElement = truckMarker.getElement();
      if (truckElement) {
        const iconWrapper = truckElement.querySelector('.truck-icon-wrapper');
        if (iconWrapper) {
          iconWrapper.style.transform = `rotate(${angle + 90}deg)`;
        }
      }
      
      index += (path.length - 1) / steps;
      
      if (index < path.length - 1) {
        setTimeout(animate, stepDuration);
      }
    }
  };
  
  animate();
}

// Center map on truck location
window.centerOnTruck = function() {
  if (truckMarker) {
    map.setView(truckMarker.getLatLng(), 16, { animate: true });
  }
};

// Stop GPS tracking
function stopGPSTracking() {
  trackingEnabled = false;
  if (trackingInterval) {
    clearInterval(trackingInterval);
    trackingInterval = null;
  }
  
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
  
  // Clear path coordinates
  truckPathCoords = [];
  
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
  try {
    const token = localStorage.getItem('token');
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const accuracy = position.coords.accuracy;
    
    console.log(`📤 Sending GPS to server: ${lat}, ${lng} (accuracy: ${accuracy}m)`);
    
    const response = await fetch(`${API_URL}/tracking/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        lat: lat,
        lng: lng,
        speed: position.coords.speed || 0,
        heading: position.coords.heading || 0,
        routeId: getCurrentActiveRoute()
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Location saved to server:', data.savedAt);
      // Update last successful update time
      window.lastGPSUpdate = new Date();
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
    // Network error - might be offline
    if (!navigator.onLine) {
      console.warn('📵 Device appears to be offline');
    }
  }
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
    const response = await fetch(`${API_URL}/tracking/update`, {
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
    });
    
    if (response.ok) {
      // Test 3: Verify server received it
      const verifyRes = await fetch(`${API_URL}/tracking/test-my-location`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const verifyData = await verifyRes.json();
      
      panel.style.borderLeftColor = '#4caf50';
      panel.style.background = '#e8f5e9';
      icon.textContent = '✅';
      text.textContent = 'GPS Working!';
      text.style.color = '#2e7d32';
      detail.textContent = `Location: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
      
      alert(`✅ GPS Test Successful!\n\nYour location:\nLat: ${position.coords.latitude.toFixed(6)}\nLng: ${position.coords.longitude.toFixed(6)}\nAccuracy: ${position.coords.accuracy.toFixed(0)}m\n\nServer status: ${verifyData.status}`);
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
    
    alert(`❌ GPS Test Failed\n\n${errorMsg}\n\nTips:\n1. Allow location permission in browser\n2. Enable GPS on your device\n3. Try in an open area for better signal`);
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

// Admin: Show live truck locations on map
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
  
  // Update every 15 seconds
  if (trackingUpdateInterval) {
    clearInterval(trackingUpdateInterval);
  }
  trackingUpdateInterval = setInterval(updateLiveTruckLocations, 15000);
}

async function updateLiveTruckLocations() {
  try {
    const token = localStorage.getItem('token');
    // Use new endpoint that shows ALL assigned trucks
    const response = await fetch(`${API_URL}/tracking/all-trucks`, {
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
  
  // Get location name if coordinates available
  let locationName = 'Loading...';
  if (lat && lng) {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await response.json();
      if (data.display_name) {
        // Extract relevant parts
        const address = data.address;
        const parts = [];
        if (address.road) parts.push(address.road);
        if (address.suburb || address.neighbourhood) parts.push(address.suburb || address.neighbourhood);
        if (address.city || address.town || address.municipality) parts.push(address.city || address.town || address.municipality);
        locationName = parts.length > 0 ? parts.join(', ') : data.display_name;
      }
    } catch (error) {
      locationName = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  }
  
  return `
    <div style="min-width: 250px;">
      <h4 style="margin: 0 0 0.5rem 0; color: #333; font-size: 1.1rem;">🚛 ${truckId}</h4>
      <div style="background: ${statusColor}; color: white; padding: 0.3rem 0.6rem; border-radius: 12px; display: inline-block; font-size: 0.8rem; margin-bottom: 0.5rem; font-weight: 600;">
        ${statusText}
      </div>
      <div style="background: #f5f5f5; padding: 0.5rem; border-radius: 8px; margin: 0.5rem 0;">
        <p style="margin: 0.25rem 0; font-size: 0.85rem;">
          <strong>👤 Driver:</strong> ${fullName || username}
        </p>
        <p style="margin: 0.25rem 0; font-size: 0.85rem;">
          <strong>🚗 Plate:</strong> ${plateNumber}
        </p>
        <p style="margin: 0.25rem 0; font-size: 0.85rem;">
          <strong>📦 Model:</strong> ${model}
        </p>
        <p style="margin: 0.25rem 0; font-size: 0.85rem;">
          <strong>🛣️ Route:</strong> ${routeName || 'Not assigned'}
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
  
  // Otherwise, fetch from API
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
    const data = await response.json();
    
    let locationName = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    if (data.display_name) {
      const address = data.address;
      const parts = [];
      if (address.road) parts.push(address.road);
      if (address.suburb || address.neighbourhood) parts.push(address.suburb || address.neighbourhood);
      if (address.city || address.town || address.municipality) parts.push(address.city || address.town || address.municipality);
      locationName = parts.length > 0 ? parts.join(', ') : data.display_name;
    }
    
    // Cache the result
    locationNameCache[cacheKey] = locationName;
    
    // Update popup
    updatePopupContent(locationName);
  } catch (error) {
    console.log('Error getting location name:', error);
  }
}

function getTimeAgo(timestamp) {
  const now = new Date();
  const then = new Date(timestamp);
  const seconds = Math.floor((now - then) / 1000);
  
  if (seconds < 60) return `${seconds} seconds ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  return `${Math.floor(seconds / 3600)} hours ago`;
}

// Show live truck tracking panel
window.showLiveTruckPanel = async function() {
  try {
    const token = localStorage.getItem('token');
    console.log('📡 Fetching all trucks...');
    const response = await fetch(`${API_URL}/tracking/all-trucks`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const trucks = await response.json();
      console.log('📡 Trucks received:', trucks.length, trucks);
      
      const trucksList = await Promise.all(trucks.map(async truck => {
        const { username, fullName, truckId, plateNumber, model, isLive, speed, timestamp, routeName, lat, lng } = truck;
        const statusColor = isLive ? '#4caf50' : '#9e9e9e';
        const statusText = isLive ? '🟢 Live' : '⚪ Offline';
        const timeAgo = timestamp ? getTimeAgo(timestamp) : 'No data';
        
        // Get location name
        let locationName = 'Unknown location';
        if (lat && lng) {
          try {
            const geoResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
            const data = await geoResponse.json();
            if (data.display_name) {
              const address = data.address;
              const parts = [];
              if (address.road) parts.push(address.road);
              if (address.suburb || address.neighbourhood) parts.push(address.suburb || address.neighbourhood);
              if (address.city || address.town || address.municipality) parts.push(address.city || address.town || address.municipality);
              locationName = parts.length > 0 ? parts.join(', ') : data.display_name.substring(0, 50) + '...';
            }
          } catch (error) {
            locationName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          }
        }
        
        return `
          <div style="background: linear-gradient(135deg, ${isLive ? '#e8f5e9' : '#f5f5f5'} 0%, #ffffff 100%); padding: 1rem; border-radius: 10px; margin-bottom: 0.75rem; border-left: 5px solid ${statusColor}; box-shadow: 0 2px 4px rgba(0,0,0,0.08);">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
              <div style="flex: 1;">
                <h4 style="margin: 0 0 0.25rem 0; color: #333; font-size: 1rem;">🚛 ${truckId}</h4>
                <p style="margin: 0; color: #666; font-size: 0.85rem;">${plateNumber} - ${model}</p>
              </div>
              <span style="background: ${statusColor}; color: white; padding: 0.3rem 0.6rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">
                ${statusText}
              </span>
            </div>
            <div style="background: white; padding: 0.6rem; border-radius: 6px; font-size: 0.85rem; border: 1px solid #e0e0e0;">
              <p style="margin: 0.25rem 0;"><strong>👤 Driver:</strong> ${fullName || username}</p>
              <p style="margin: 0.25rem 0;"><strong>🛣️ Route:</strong> ${routeName || 'Not assigned'}</p>
              <p style="margin: 0.25rem 0;"><strong>📍 Location:</strong><br>
                <span style="color: #333; font-size: 0.8rem;">${locationName}</span>
              </p>
              ${isLive ? `
                <p style="margin: 0.25rem 0;"><strong>⚡ Speed:</strong> ${Math.round(speed * 3.6)} km/h</p>
                <p style="margin: 0.25rem 0; color: #666; font-size: 0.8rem;">🕐 Updated: ${timeAgo}</p>
              ` : `
                <p style="margin: 0.25rem 0; color: #999; font-size: 0.8rem;">⚠️ GPS not active</p>
              `}
            </div>
            <button onclick="viewTruckOnMap(${lat}, ${lng}, '${truckId}')" style="width: 100%; margin-top: 0.5rem; padding: 0.5rem; background: #2196f3; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: 600; font-size: 0.85rem;">
              🗺️ View on Map
            </button>
          </div>
        `;
      }));
      
      showModal('📡 Live Truck Tracking', `
        <div>
          <div style="background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%); padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border-left: 4px solid #2196f3;">
            <p style="color: #1976d2; font-weight: 700; margin: 0; font-size: 1.1rem;">
              📡 All Trucks Status
            </p>
            <p style="color: #666; margin: 0.25rem 0 0 0; font-size: 0.85rem;">
              Showing ${trucks.length} truck${trucks.length > 1 ? 's' : ''} • Auto-updates every 15 seconds
            </p>
            <p style="color: #888; margin: 0.25rem 0 0 0; font-size: 0.8rem;">
              💡 Click "View on Map" to see truck location
            </p>
          </div>
          <div style="max-height: 500px; overflow-y: auto; padding-right: 0.5rem;">
            ${trucksList.length > 0 ? trucksList.join('') : '<p style="text-align: center; color: #999; padding: 2rem;">No trucks assigned yet</p>'}
          </div>
          <button onclick="closeModal()" class="btn" style="width: 100%; margin-top: 1rem; background: #2196f3; color: white; padding: 0.75rem; border: none; border-radius: 5px; cursor: pointer; font-weight: 600; font-size: 1rem;">Close</button>
        </div>
      `);
    }
  } catch (error) {
    console.error('Error loading truck tracking:', error);
    showModal('📡 Live Truck Tracking', '<p style="color: red; text-align: center; padding: 2rem;">Error loading truck data</p>');
  }
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

// Profile Management Functions
async function loadHeaderProfilePicture() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found, skipping profile picture load');
      return;
    }
    
    console.log('Loading profile picture...');
    const response = await fetch(`${API_URL}/profile/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const profile = await response.json();
      console.log('Profile loaded:', profile);
      
      if (profile.profilePicture) {
        const headerPic = document.getElementById('headerProfilePic');
        if (headerPic) {
          console.log('Setting profile picture:', profile.profilePicture);
          headerPic.innerHTML = `<img src="${profile.profilePicture}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        } else {
          console.warn('headerProfilePic element not found');
        }
      } else {
        console.log('No profile picture set for user');
      }
    } else {
      console.error('Failed to load profile:', response.status);
    }
  } catch (error) {
    console.error('Error loading profile picture:', error);
  }
}

// Driver History Function
window.showDriverHistory = async function() {
  try {
    const token = localStorage.getItem('token');
    
    // Get all routes completed by this driver
    const response = await fetch(`${API_URL}/routes`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const routes = await response.json();
    const myCompletedRoutes = routes.filter(r => 
      r.status === 'completed' && 
      r.completedBy === user.username &&
      r.completedAt
    );
    
    // Sort by completion date (newest first)
    myCompletedRoutes.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
    
    if (myCompletedRoutes.length === 0) {
      showModal('📜 My History', `
        <div style="text-align: center; padding: 2rem;">
          <p style="color: #999; font-size: 1.1rem;">No completed routes yet</p>
          <p style="color: #666; font-size: 0.9rem; margin-top: 0.5rem;">Complete your first route to see it here!</p>
        </div>
        <button onclick="closeModal()" class="btn" style="width: 100%; margin-top: 1rem;">Close</button>
      `);
      return;
    }
    
    const historyList = myCompletedRoutes.map(route => {
      const completedDate = new Date(route.completedAt).toLocaleString();
      const photosHtml = route.completionPhotos && route.completionPhotos.length > 0 ? 
        route.completionPhotos.map(photo => 
          `<img src="${photo}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; margin: 0.25rem; cursor: pointer; border: 2px solid #e0e0e0;" onclick="window.open('${photo}', '_blank')" title="Click to view full size">`
        ).join('') : 
        '<p style="color: #999; font-size: 0.85rem; font-style: italic;">No photos</p>';
      
      return `
        <div style="background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%); padding: 1rem; border-radius: 10px; margin-bottom: 0.75rem; border-left: 5px solid #4caf50; box-shadow: 0 2px 4px rgba(0,0,0,0.08);">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
            <div style="flex: 1;">
              <h4 style="margin: 0 0 0.25rem 0; color: #4caf50; font-size: 1rem;">
                ✓ ${route.name}
              </h4>
              <p style="margin: 0; color: #666; font-size: 0.8rem; font-weight: 500;">${route.routeId}</p>
            </div>
            <span style="background: #4caf50; color: white; padding: 0.3rem 0.6rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">
              Completed
            </span>
          </div>
          
          <div style="background: white; padding: 0.6rem; border-radius: 6px; margin: 0.5rem 0; font-size: 0.85rem; border: 1px solid #e0e0e0;">
            <p style="margin: 0.25rem 0;"><strong style="color: #333;">🕐 Completed:</strong> ${completedDate}</p>
            ${route.completionNotes ? `<p style="margin: 0.25rem 0;"><strong style="color: #333;">📝 Notes:</strong> ${route.completionNotes}</p>` : ''}
          </div>
          
          <div style="margin-top: 0.5rem;">
            <div style="font-size: 0.85rem; font-weight: 600; margin-bottom: 0.25rem; color: #333;">📷 Proof Photos:</div>
            <div style="display: flex; flex-wrap: wrap; gap: 0.25rem;">
              ${photosHtml}
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    showModal('📜 My Completion History', `
      <div>
        <div style="background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%); padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border-left: 4px solid #4caf50;">
          <p style="color: #4caf50; font-weight: 700; margin: 0; font-size: 1.1rem;">
            📜 My Completed Routes
          </p>
          <p style="color: #666; margin: 0.25rem 0 0 0; font-size: 0.85rem;">
            You have completed ${myCompletedRoutes.length} route${myCompletedRoutes.length > 1 ? 's' : ''}
          </p>
        </div>
        <div style="max-height: 500px; overflow-y: auto; padding-right: 0.5rem;">
          ${historyList}
        </div>
        <button onclick="closeModal()" class="btn" style="width: 100%; margin-top: 1rem; background: #4caf50; color: white; padding: 0.75rem; border: none; border-radius: 5px; cursor: pointer; font-weight: 600; font-size: 1rem;">Close</button>
      </div>
    `);
  } catch (error) {
    console.error('Error loading driver history:', error);
    showModal('📜 My History', '<p style="color: red; text-align: center; padding: 2rem;">Error loading history</p>');
  }
};

window.showProfile = async function() {
  try {
    const response = await fetch(`${API_URL}/profile/me`);
    if (!response.ok) {
      throw new Error('Failed to load profile');
    }
    
    const profile = await response.json();
    
    const profilePicHtml = profile.profilePicture 
      ? `<img src="${profile.profilePicture}" style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover; border: 4px solid #4caf50;">`
      : `<div style="width: 150px; height: 150px; border-radius: 50%; background: #4caf50; color: white; display: flex; align-items: center; justify-content: center; font-size: 4rem; font-weight: bold; border: 4px solid #2e7d32;">
           ${(profile.fullName || profile.username).charAt(0).toUpperCase()}
         </div>`;
    
    showModal('My Profile', `
      <div style="text-align: center; padding: 1rem;">
        <div style="margin-bottom: 1.5rem;">
          ${profilePicHtml}
        </div>
        
        <div style="margin-bottom: 1rem;">
          <button onclick="showChangeProfilePicture()" class="btn" style="background: #4caf50;">
            📷 Change Profile Picture
          </button>
          ${profile.profilePicture ? `
            <button onclick="removeProfilePicture()" class="btn" style="background: #f44336; margin-left: 0.5rem;">
              🗑️ Remove Picture
            </button>
          ` : ''}
        </div>
        
        <div style="text-align: left; max-width: 500px; margin: 0 auto; background: #f5f5f5; padding: 1.5rem; border-radius: 10px;">
          <div style="margin-bottom: 1rem;">
            <strong style="color: #4caf50;">Username:</strong>
            <p style="margin: 0.25rem 0;">${profile.username}</p>
          </div>
          
          <div style="margin-bottom: 1rem;">
            <strong style="color: #4caf50;">Full Name:</strong>
            <p style="margin: 0.25rem 0;">${profile.fullName || '-'}</p>
          </div>
          
          <div style="margin-bottom: 1rem;">
            <strong style="color: #4caf50;">Email:</strong>
            <p style="margin: 0.25rem 0;">${profile.email}</p>
          </div>
          
          <div style="margin-bottom: 1rem;">
            <strong style="color: #4caf50;">Phone Number:</strong>
            <p style="margin: 0.25rem 0;">${profile.phoneNumber || '-'}</p>
          </div>
          
          <div style="margin-bottom: 1rem;">
            <strong style="color: #4caf50;">Role:</strong>
            <p style="margin: 0.25rem 0;"><span class="role-badge ${profile.role}">${profile.role}</span></p>
          </div>
        </div>
        
        <div style="margin-top: 1.5rem;">
          <button onclick="showEditProfile()" class="btn" style="background: #4caf50;">
            ✏️ Edit Profile
          </button>
          <button onclick="closeModal()" class="btn" style="background: #999; margin-left: 0.5rem;">
            Close
          </button>
        </div>
      </div>
    `);
  } catch (error) {
    console.error('Error loading profile:', error);
    alert('Error loading profile: ' + error.message);
  }
};

window.showEditProfile = async function() {
  try {
    const response = await fetch(`${API_URL}/profile/me`);
    const profile = await response.json();
    
    showModal('Edit Profile', `
      <form id="editProfileForm">
        <div class="form-group">
          <label>Username</label>
          <input type="text" value="${profile.username}" disabled style="background: #f5f5f5;">
        </div>
        
        <div class="form-group">
          <label>Full Name *</label>
          <input type="text" id="profileFullName" value="${profile.fullName || ''}" required>
        </div>
        
        <div class="form-group">
          <label>Email *</label>
          <input type="email" id="profileEmail" value="${profile.email}" required>
        </div>
        
        <div class="form-group">
          <label>Phone Number</label>
          <input type="tel" id="profilePhone" value="${profile.phoneNumber || ''}" pattern="[0-9]{11}" placeholder="09XXXXXXXXX">
          <small style="color: #666;">Format: 09XXXXXXXXX (11 digits)</small>
        </div>
        
        <div class="form-group">
          <label>New Password (leave blank to keep current)</label>
          <input type="password" id="profilePassword" minlength="6" placeholder="Enter new password">
        </div>
        
        <div class="form-group">
          <label>Confirm New Password</label>
          <input type="password" id="profilePasswordConfirm" minlength="6" placeholder="Confirm new password">
        </div>
        
        <button type="submit" class="btn" style="background: #4caf50;">💾 Save Changes</button>
        <button type="button" onclick="showProfile()" class="btn" style="background: #999;">Cancel</button>
      </form>
    `);
    
    document.getElementById('editProfileForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const password = document.getElementById('profilePassword').value;
      const passwordConfirm = document.getElementById('profilePasswordConfirm').value;
      
      if (password && password !== passwordConfirm) {
        alert('Passwords do not match!');
        return;
      }
      
      const updateData = {
        fullName: document.getElementById('profileFullName').value,
        email: document.getElementById('profileEmail').value,
        phoneNumber: document.getElementById('profilePhone').value
      };
      
      if (password) {
        updateData.password = password;
      }
      
      try {
        const response = await fetch(`${API_URL}/profile/me`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        });
        
        if (response.ok) {
          const result = await response.json();
          // Update local storage
          const updatedUser = { ...user, ...result.user };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
          alert('Profile updated successfully!');
          
          // Refresh the page to update header
          location.reload();
        } else {
          const error = await response.json();
          alert('Error: ' + (error.error || 'Failed to update profile'));
        }
      } catch (error) {
        alert('Error updating profile: ' + error.message);
      }
    });
  } catch (error) {
    alert('Error loading profile: ' + error.message);
  }
};

window.showChangeProfilePicture = function() {
  showModal('Change Profile Picture', `
    <form id="uploadProfilePicForm" enctype="multipart/form-data">
      <div class="form-group">
        <label>Select Profile Picture *</label>
        <input type="file" id="profilePictureFile" accept="image/jpeg,image/jpg,image/png,image/gif" required>
        <small style="color: #666;">
          Accepted formats: JPG, PNG, GIF<br>
          Maximum size: 2MB
        </small>
      </div>
      
      <div id="imagePreview" style="margin: 1rem 0; text-align: center;"></div>
      
      <button type="submit" class="btn" style="background: #4caf50;">📤 Upload Picture</button>
      <button type="button" onclick="showProfile()" class="btn" style="background: #999;">Cancel</button>
    </form>
  `);
  
  // Image preview
  document.getElementById('profilePictureFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
      // Check file size (2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB');
        this.value = '';
        return;
      }
      
      const reader = new FileReader();
      reader.onload = function(e) {
        document.getElementById('imagePreview').innerHTML = `
          <img src="${e.target.result}" style="max-width: 200px; max-height: 200px; border-radius: 10px; border: 2px solid #4caf50;">
        `;
      };
      reader.readAsDataURL(file);
    }
  });
  
  document.getElementById('uploadProfilePicForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fileInput = document.getElementById('profilePictureFile');
    const file = fileInput.files[0];
    
    if (!file) {
      alert('Please select a file');
      return;
    }
    
    const formData = new FormData();
    formData.append('profilePicture', file);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/profile/picture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        alert('Profile picture updated successfully!');
        
        // Update header profile picture
        loadHeaderProfilePicture();
        
        // Show profile again
        showProfile();
      } else {
        const error = await response.json();
        alert('Error: ' + (error.error || 'Failed to upload picture'));
      }
    } catch (error) {
      alert('Error uploading picture: ' + error.message);
    }
  });
};

window.removeProfilePicture = async function() {
  if (!confirm('Are you sure you want to remove your profile picture?')) {
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/profile/picture`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      alert('Profile picture removed successfully!');
      
      // Update header
      const headerPic = document.getElementById('headerProfilePic');
      if (headerPic) {
        headerPic.innerHTML = (user.fullName || user.username).charAt(0).toUpperCase();
      }
      
      // Refresh profile view
      showProfile();
    } else {
      const error = await response.json();
      alert('Error: ' + (error.error || 'Failed to remove picture'));
    }
  } catch (error) {
    alert('Error removing picture: ' + error.message);
  }
};
