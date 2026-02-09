/**
 * Kolek-Ta Admin Users Module
 * User management CRUD operations.
 */
(function() {
  'use strict';

// Store users data for sorting
var cachedUsersData = [];

async function showUserManagement() {
  setActiveSidebarButton('userManagementBtn');
  showPage('User Management', `
    <div class="flex flex-col items-center justify-center py-16">
      <div class="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mb-4"></div>
      <p class="text-gray-500">Loading users...</p>
    </div>
  `);
  try {
    const response = await fetchWithRetry(`${API_URL}/users`);
    cachedUsersData = await response.json();

    // Register sort handler
    sortHandlers.users = () => renderUserTable();

    renderUserTable();
  } catch (error) {
    console.error('Error loading users:', error);
    showPage('User Management', `
      <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <i data-lucide="alert-circle" class="w-12 h-12 text-red-500 mx-auto mb-3"></i>
        <p class="text-red-700">Error loading users: ${error.message}</p>
        <button onclick="showUserManagement()" class="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
          Try Again
        </button>
      </div>
    `);
  }
}

function renderUserTable() {
  const users = cachedUsersData;

  // Define searchable fields
  const searchFields = ['username', 'fullName', 'email', 'phoneNumber', 'role'];

  // Apply role filter
  let filtered = users;
  if (userRoleFilter !== 'all') {
    filtered = filtered.filter(u => u.role === userRoleFilter);
  }

  // Apply status filter
  if (userStatusFilter !== 'all') {
    filtered = filtered.filter(u => userStatusFilter === 'active' ? u.isActive : !u.isActive);
  }

  // Apply search filter
  filtered = filterData(filtered, searchState.users, searchFields);

  // Apply sorting
  const { column, direction } = sortState.users;
  const sortedUsers = sortData(filtered, column, direction);
  const isFiltered = searchState.users || userRoleFilter !== 'all' || userStatusFilter !== 'all';

  const admins = users.filter(u => u.role === 'admin');
  const drivers = users.filter(u => u.role === 'driver');
  const availableDrivers = drivers.filter(d => d.availability !== 'unavailable');
  const activeCount = users.filter(u => u.isActive).length;

  // Define sortable columns
  const columns = [
    { key: 'username', label: 'User', sortable: true },
    { key: 'fullName', label: 'Full Name', sortable: true },
    { key: 'phoneNumber', label: 'Phone', sortable: true },
    { key: 'role', label: 'Role', sortable: true },
    { key: 'availability', label: 'Availability', sortable: true },
    { key: 'isActive', label: 'Status', sortable: true },
    { key: 'actions', label: 'Actions', sortable: false }
  ];

  const userRows = sortedUsers.map(u => {
    const statusColor = u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
    const roleColor = u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700';
    const initial = (u.fullName || u.username || 'U').charAt(0).toUpperCase();

    return `
      <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
        <td class="px-4 py-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold">
              ${initial}
            </div>
            <div>
              <div class="font-medium text-gray-800">${escapeHtml(u.username)}</div>
              <div class="text-sm text-gray-500">${escapeHtml(u.email)}</div>
            </div>
          </div>
        </td>
        <td class="px-4 py-4 text-gray-700">${escapeHtml(u.fullName || '-')}</td>
        <td class="px-4 py-4 text-gray-600">${escapeHtml(u.phoneNumber || '-')}</td>
        <td class="px-4 py-4">
          <span class="px-3 py-1 rounded-full text-xs font-medium ${roleColor}">
            ${u.role === 'admin' ? 'Admin' : 'Driver'}
          </span>
        </td>
        <td class="px-4 py-4">
          ${u.role === 'driver' ? `
            <span class="px-3 py-1 rounded-full text-xs font-medium ${
              u.availability === 'unavailable' ? 'bg-red-100 text-red-700' :
              u.availability === 'on-break' ? 'bg-yellow-100 text-yellow-700' :
              'bg-green-100 text-green-700'
            }">
              ${u.availability === 'unavailable' ? 'Driving' :
                u.availability === 'on-break' ? 'On Break' : 'Available'}
            </span>
          ` : `<span class="text-gray-400">-</span>`}
        </td>
        <td class="px-4 py-4">
          <span class="px-3 py-1 rounded-full text-xs font-medium ${statusColor}">
            ${u.isActive ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td class="px-4 py-4">
          <div class="flex items-center gap-2">
            <button onclick="editUser('${u._id || u.username}')" class="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Edit">
              <i data-lucide="pencil" class="w-4 h-4 text-gray-600"></i>
            </button>
            ${u.role !== 'admin' ? `
              <button onclick="deleteUser('${u._id || u.username}')" class="p-2 hover:bg-red-100 rounded-lg transition-colors" title="Delete">
                <i data-lucide="trash-2" class="w-4 h-4 text-red-500"></i>
              </button>
            ` : `
              <span class="p-2 text-gray-400" title="Protected account">
                <i data-lucide="shield" class="w-4 h-4"></i>
              </span>
            `}
          </div>
        </td>
      </tr>
    `;
  }).join('');

    showPage('User Management', `
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <i data-lucide="users" class="w-6 h-6 text-blue-600"></i>
            </div>
            <div>
              <p class="text-sm text-gray-500">Total Users</p>
              <p class="text-2xl font-bold text-gray-800">${users.length}</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <i data-lucide="shield" class="w-6 h-6 text-purple-600"></i>
            </div>
            <div>
              <p class="text-sm text-gray-500">Admins</p>
              <p class="text-2xl font-bold text-gray-800">${admins.length}</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <i data-lucide="truck" class="w-6 h-6 text-green-600"></i>
            </div>
            <div>
              <p class="text-sm text-gray-500">Drivers</p>
              <p class="text-2xl font-bold text-gray-800">${drivers.length}</p>
              <p class="text-xs text-gray-400">${availableDrivers.length} available, ${drivers.length - availableDrivers.length} driving</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Users Table Card -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <!-- Table Header -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-4 border-b border-gray-100">
          <div>
            <h2 class="font-semibold text-gray-800">All Users</h2>
            <p class="text-sm text-gray-500">${sortedUsers.length} of ${users.length} users${isFiltered ? ' (filtered)' : ''}</p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <select id="userRoleFilter" onchange="handleUserRoleFilter(this.value)"
              class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent">
              <option value="all" ${userRoleFilter === 'all' ? 'selected' : ''}>All Roles</option>
              <option value="admin" ${userRoleFilter === 'admin' ? 'selected' : ''}>Admin</option>
              <option value="driver" ${userRoleFilter === 'driver' ? 'selected' : ''}>Driver</option>
            </select>
            <select id="userStatusFilter" onchange="handleUserStatusFilter(this.value)"
              class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent">
              <option value="all" ${userStatusFilter === 'all' ? 'selected' : ''}>All Status</option>
              <option value="active" ${userStatusFilter === 'active' ? 'selected' : ''}>Active</option>
              <option value="inactive" ${userStatusFilter === 'inactive' ? 'selected' : ''}>Inactive</option>
            </select>
            ${createSearchInput('users', 'Search users...')}
            <button onclick="showAddUserForm()" class="flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors">
              <i data-lucide="plus" class="w-4 h-4"></i>
              <span>Add Driver</span>
            </button>
          </div>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-100">
              <tr>
                ${createSortableHeader('users', columns)}
              </tr>
            </thead>
            <tbody>
              ${userRows || '<tr><td colspan="6" class="px-4 py-8 text-center text-gray-500">No users found</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `);
}

window.showAddUserForm = function() {
  showModal('Add New Driver', `
    <form id="addUserForm" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Username *</label>
        <input type="text" id="newUsername" required
          class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
        <input type="text" id="newFullName" required
          class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
        <input type="email" id="newEmail" required
          class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Password *</label>
        <input type="password" id="newPassword" required minlength="6"
          class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
        <input type="tel" id="newPhone" placeholder="09XXXXXXXXX" required pattern="[0-9]{11}"
          class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
        <p class="mt-1 text-xs text-gray-500">Format: 09XXXXXXXXX (11 digits)</p>
      </div>
      <input type="hidden" id="newRole" value="driver">
      <div class="flex gap-3 pt-4">
        <button type="submit" class="flex-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors">
          Create Driver
        </button>
        <button type="button" onclick="closeModal()" class="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors">
          Cancel
        </button>
      </div>
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
      const response = await fetchWithRetry(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      if (response.ok) {
        closeModal();
        showToast('User created successfully!', 'success');
        showUserManagement();
      } else {
        const error = await response.json();
        showToast(error.error || 'Failed to create user', 'error');
      }
    } catch (error) {
      showToast('Error creating user: ' + error.message, 'error');
    }
  });
};

window.editUser = async function(userId) {
  try {
    const response = await fetchWithRetry(`${API_URL}/users/${userId}`);
    const user = await response.json();
    
    // Check if editing admin
    const isAdmin = user.role === 'admin';
    
    showModal(isAdmin ? 'Edit Admin Profile' : 'Edit Driver', `
      <form id="editUserForm" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <input type="text" value="${escapeHtml(user.username)}" disabled
            class="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input type="text" id="editFullName" value="${escapeHtml(user.fullName || '')}" required
            class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" id="editEmail" value="${escapeHtml(user.email)}" required
            class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
        </div>
        ${!isAdmin ? `
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <input type="tel" id="editPhone" value="${escapeHtml(user.phoneNumber || '')}" pattern="[0-9]{11}"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
          <p class="mt-1 text-xs text-gray-500">Format: 09XXXXXXXXX (11 digits)</p>
        </div>
        ` : ''}
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">New Password (leave blank to keep current)</label>
          <input type="password" id="editPassword" minlength="6"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
        </div>
        ${isAdmin ? `
        <input type="hidden" id="editRole" value="admin">
        <div class="p-3 bg-blue-50 border border-blue-100 rounded-xl">
          <p class="text-sm text-blue-700 flex items-center gap-2">
            <i data-lucide="info" class="w-4 h-4"></i>
            Admin role cannot be changed
          </p>
        </div>
        ` : `
        <input type="hidden" id="editRole" value="driver">
        <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
          <input type="checkbox" id="editActive" ${user.isActive ? 'checked' : ''}
            class="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500">
          <label for="editActive" class="text-sm font-medium text-gray-700 cursor-pointer">Active Account</label>
        </div>
        `}
        <div class="flex gap-3 pt-4">
          <button type="submit" class="flex-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors">
            Update ${isAdmin ? 'Profile' : 'Driver'}
          </button>
          <button type="button" onclick="closeModal()" class="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors">
            Cancel
          </button>
        </div>
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
        const response = await fetchWithRetry(`${API_URL}/users/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        });
        
        if (response.ok) {
          closeModal();
          showToast('User updated successfully!', 'success');
          showUserManagement();
        } else {
          const error = await response.json();
          showToast(error.error || 'Failed to update user', 'error');
        }
      } catch (error) {
        showToast('Error updating user: ' + error.message, 'error');
      }
    });
  } catch (error) {
    showToast('Error loading user: ' + error.message, 'error');
  }
};

window.deleteUser = async function(userId) {
  if (!await showConfirm('Delete User', 'Are you sure you want to delete this user?')) {
    return;
  }
  
  try {
    const response = await fetchWithRetry(`${API_URL}/users/${userId}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      showToast('User deleted successfully!', 'success');
      showUserManagement();
    } else {
      const error = await response.json();
      showToast(error.error || 'Failed to delete user', 'error');
    }
  } catch (error) {
    showToast('Error deleting user: ' + error.message, 'error');
  }
};


  // Expose on window
  window.showUserManagement = showUserManagement;
  window.renderUserTable = renderUserTable;

})();