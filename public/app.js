// Use relative URL so it works on any device
const API_URL = '/api';

// Compatibility aliases for code not yet migrated to App namespace
var sortState = App.sort;
var searchState = App.search;
var sortHandlers = App.sortHandlers;
// Filter aliases — simple variables that will be read/written by remaining app.js code
// These will be replaced by App.filters.* references when each module is extracted
var userRoleFilter = 'all';
var userStatusFilter = 'all';
var truckStatusFilter = 'all';
var routeExpirationFilter = 'all';
var fuelLevelFilter = 'all';
var complaintStatusFilter = 'all';
var complaintTypeFilter = 'all';
var scheduleStatusFilter = 'all';






// Profile Management Functions

// Driver History Function
window.showDriverHistory = async function() {
  try {
    const token = localStorage.getItem('token');
    
    // Get all routes completed by this driver
    const response = await fetchWithRetry(`${API_URL}/routes`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const routes = await response.json();
    const myCompletedRoutes = routes.filter(r => 
      r.status === 'completed' && 
      r.completedBy === App.user.username &&
      r.completedAt
    );
    
    // Sort by completion date (newest first)
    myCompletedRoutes.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
    
    if (myCompletedRoutes.length === 0) {
      showModal('My History', `
        <div class="text-center py-8">
          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i data-lucide="clipboard-list" class="w-8 h-8 text-gray-400"></i>
          </div>
          <p class="text-gray-500 text-lg">No completed routes yet</p>
          <p class="text-gray-400 text-sm mt-2">Complete your first route to see it here!</p>
        </div>
        <button onclick="closeModal()" class="w-full px-4 py-2.5 mt-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors">Close</button>
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
        <button onclick="closeModal()" class="w-full px-4 py-2.5 mt-4 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors">Close</button>
      </div>
    `);
  } catch (error) {
    console.error('Error loading driver history:', error);
    showModal('📜 My History', '<p style="color: red; text-align: center; padding: 2rem;">Error loading history</p>');
  }
};

window.showProfile = async function() {
  try {
    const response = await fetchWithRetry(`${API_URL}/profile/me`);
    if (!response.ok) {
      throw new Error('Failed to load profile');
    }
    
    const profile = await response.json();
    
    const profilePicHtml = profile.profilePicture
      ? `<img src="${profile.profilePicture}" class="w-32 h-32 rounded-full object-cover border-4 border-primary-500 shadow-lg">`
      : `<div class="w-32 h-32 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-content-center text-5xl font-bold border-4 border-primary-400 shadow-lg">
           ${(profile.fullName || profile.username).charAt(0).toUpperCase()}
         </div>`;

    showModal('My Profile', `
      <div class="text-center space-y-6">
        <div class="flex justify-center">
          ${profilePicHtml}
        </div>

        <div class="flex justify-center gap-2">
          <button onclick="showChangeProfilePicture()" class="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-xl transition-colors">
            Change Picture
          </button>
          ${profile.profilePicture ? `
            <button onclick="removeProfilePicture()" class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-xl transition-colors">
              Remove
            </button>
          ` : ''}
        </div>

        <div class="bg-gray-50 rounded-xl p-4 text-left space-y-3">
          <div class="flex justify-between items-center py-2 border-b border-gray-200">
            <span class="text-sm text-gray-500 font-medium">Username</span>
            <span class="text-sm text-gray-800 font-medium">${profile.username}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-gray-200">
            <span class="text-sm text-gray-500 font-medium">Full Name</span>
            <span class="text-sm text-gray-800">${profile.fullName || '-'}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-gray-200">
            <span class="text-sm text-gray-500 font-medium">Email</span>
            <span class="text-sm text-gray-800">${profile.email}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-gray-200">
            <span class="text-sm text-gray-500 font-medium">Phone Number</span>
            <span class="text-sm text-gray-800">${profile.phoneNumber || '-'}</span>
          </div>
          <div class="flex justify-between items-center py-2">
            <span class="text-sm text-gray-500 font-medium">Role</span>
            <span class="px-3 py-1 rounded-full text-xs font-medium ${profile.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}">${profile.role}</span>
          </div>
        </div>

        <div class="flex gap-3 pt-2">
          <button onclick="showEditProfile()" class="flex-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors">
            Edit Profile
          </button>
          <button onclick="closeModal()" class="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors">
            Close
          </button>
        </div>
      </div>
    `);
  } catch (error) {
    console.error('Error loading profile:', error);
    showToast('Error loading profile: ' + error.message, 'error');
  }
};

window.showEditProfile = async function() {
  try {
    const response = await fetchWithRetry(`${API_URL}/profile/me`);
    const profile = await response.json();
    
    showModal('Edit Profile', `
      <form id="editProfileForm" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <input type="text" value="${profile.username}" disabled
            class="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed">
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
          <input type="text" id="profileFullName" value="${profile.fullName || ''}" required
            class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input type="email" id="profileEmail" value="${profile.email}" required
            class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <input type="tel" id="profilePhone" value="${profile.phoneNumber || ''}" pattern="[0-9]{11}" placeholder="09XXXXXXXXX"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
          <p class="mt-1 text-xs text-gray-500">Format: 09XXXXXXXXX (11 digits)</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">New Password (leave blank to keep current)</label>
          <input type="password" id="profilePassword" minlength="6" placeholder="Enter new password"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
          <input type="password" id="profilePasswordConfirm" minlength="6" placeholder="Confirm new password"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white">
        </div>

        <div class="flex gap-3 pt-4">
          <button type="submit" class="flex-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors">
            Save Changes
          </button>
          <button type="button" onclick="closeModal()" class="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors">
            Cancel
          </button>
        </div>
      </form>
    `);
    
    document.getElementById('editProfileForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const password = document.getElementById('profilePassword').value;
      const passwordConfirm = document.getElementById('profilePasswordConfirm').value;
      
      if (password && password !== passwordConfirm) {
        showToast('Passwords do not match!', 'warning');
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
        const response = await fetchWithRetry(`${API_URL}/profile/me`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        });
        
        if (response.ok) {
          const result = await response.json();
          // Update local storage
          const updatedUser = { ...App.user, ...result.user };
          localStorage.setItem('user', JSON.stringify(updatedUser));

          closeModal();
          showToast('Profile updated successfully!', 'success');

          // Update header without full page reload
          window.user = updatedUser;
          App.user = updatedUser;
          const headerName = document.querySelector('[id="headerUserName"], .header-user-name');
          if (headerName) headerName.textContent = updatedUser.fullName || updatedUser.username;
          loadHeaderProfilePicture();
        } else {
          const error = await response.json();
          showToast(error.error || 'Failed to update profile', 'error');
        }
      } catch (error) {
        showToast('Error updating profile: ' + error.message, 'error');
      }
    });
  } catch (error) {
    showToast('Error loading profile: ' + error.message, 'error');
  }
};

window.showChangeProfilePicture = function() {
  showModal('Change Profile Picture', `
    <form id="uploadProfilePicForm" enctype="multipart/form-data" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Select Profile Picture *</label>
        <div class="relative">
          <input type="file" id="profilePictureFile" accept="image/jpeg,image/jpg,image/png,image/gif" required
            class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100">
        </div>
        <p class="mt-2 text-xs text-gray-500">
          Accepted formats: JPG, PNG, GIF | Maximum size: 2MB
        </p>
      </div>

      <div id="imagePreview" class="flex justify-center py-4"></div>

      <div class="flex gap-3 pt-4">
        <button type="submit" class="flex-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors">
          Upload Picture
        </button>
        <button type="button" onclick="closeModal()" class="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors">
          Cancel
        </button>
      </div>
    </form>
  `);
  
  // Image preview
  document.getElementById('profilePictureFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
      // Check file size (2MB)
      if (file.size > 2 * 1024 * 1024) {
        showToast('File size must be less than 2MB', 'warning');
        this.value = '';
        return;
      }
      
      const reader = new FileReader();
      reader.onload = function(e) {
        document.getElementById('imagePreview').innerHTML = `
          <img src="${e.target.result}" class="max-w-[200px] max-h-[200px] rounded-xl border-2 border-primary-500 shadow-lg">
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
      showToast('Please select a file', 'warning');
      return;
    }
    
    const formData = new FormData();
    formData.append('profilePicture', file);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetchWithRetry(`${API_URL}/profile/picture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        closeModal();
        showToast('Profile picture updated successfully!', 'success');

        // Update header profile picture
        loadHeaderProfilePicture();

        // Show profile again
        showProfile();
      } else {
        const error = await response.json();
        showToast(error.error || 'Failed to upload picture', 'error');
      }
    } catch (error) {
      showToast('Error uploading picture: ' + error.message, 'error');
    }
  });
};

window.removeProfilePicture = async function() {
  if (!await showConfirm('Remove Profile Picture', 'Are you sure you want to remove your profile picture?')) {
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetchWithRetry(`${API_URL}/profile/picture`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      closeModal();
      showToast('Profile picture removed successfully!', 'success');

      // Update header
      const headerPic = document.getElementById('headerProfilePic');
      if (headerPic) {
        headerPic.innerHTML = escapeHtml((App.user.fullName || App.user.username).charAt(0).toUpperCase());
      }

      // Refresh profile view
      showProfile();
    } else {
      const error = await response.json();
      showToast(error.error || 'Failed to remove picture', 'error');
    }
  } catch (error) {
    showToast('Error removing picture: ' + error.message, 'error');
  }
};

// initializeApp() and loadHeaderProfilePicture() called from js/app-init.js (loaded last)
