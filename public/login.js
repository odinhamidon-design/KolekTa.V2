// Use relative URL so it works on any device
const API_URL = '/api';

// Role card selection
document.querySelectorAll('.role-card').forEach(card => {
  card.addEventListener('click', () => {
    const role = card.dataset.role;
    showLoginForm(role);
  });
});

function showLoginForm(role) {
  document.getElementById('roleSelectionScreen').style.display = 'none';
  document.querySelectorAll('.login-form').forEach(f => f.classList.remove('active'));
  document.getElementById(`${role}LoginForm`).classList.add('active');
  clearError();
}

function showRoleSelection() {
  document.getElementById('roleSelectionScreen').style.display = 'block';
  document.querySelectorAll('.login-form').forEach(f => f.classList.remove('active'));
  clearError();
}

// Admin login
document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('adminUsername').value;
  const password = document.getElementById('adminPassword').value;
  
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role: 'admin' })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.href = 'index.html';
    } else {
      showError(data.error || 'Login failed');
    }
  } catch (error) {
    showError('Connection error. Please try again.');
  }
});

// Driver login
document.getElementById('driverManualForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('driverUsername').value;
  const password = document.getElementById('driverPassword').value;
  
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role: 'driver' })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.href = 'index.html';
    } else {
      showError(data.error || 'Login failed');
    }
  } catch (error) {
    showError('Connection error. Please try again.');
  }
});

// Helper functions
function showError(message) {
  const errorDiv = document.getElementById('errorMessage');
  errorDiv.textContent = message;
  errorDiv.classList.add('show');
  
  setTimeout(() => {
    errorDiv.classList.remove('show');
  }, 5000);
}

function clearError() {
  document.getElementById('errorMessage').classList.remove('show');
}

// Toggle password visibility
function togglePassword(inputId, button) {
  const input = document.getElementById(inputId);
  
  if (input.type === 'password') {
    input.type = 'text';
    button.classList.add('active');
  } else {
    input.type = 'password';
    button.classList.remove('active');
  }
}

// Forgot Password Functions
let currentResetToken = null;
let currentResetUsername = null;
let currentResetRole = null;

function showForgotPassword(role) {
  event.preventDefault();
  document.getElementById('forgotModal').style.display = 'block';
  document.getElementById('forgotRole').value = role;
  currentResetRole = role;
  resetForgotModal();
}

function closeForgotModal() {
  document.getElementById('forgotModal').style.display = 'none';
  resetForgotModal();
}

function resetForgotModal() {
  document.getElementById('forgotStep1').style.display = 'block';
  document.getElementById('forgotStep2').style.display = 'none';
  document.getElementById('forgotStep3').style.display = 'none';
  document.getElementById('forgotMessage').innerHTML = '';
  document.getElementById('forgotUsername').value = '';
  document.getElementById('securityAnswer').value = '';
  document.getElementById('newPassword').value = '';
  document.getElementById('confirmPassword').value = '';
  currentResetToken = null;
  currentResetUsername = null;
}

// Step 1: Get security question
document.getElementById('forgotUsernameForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('forgotUsername').value;
  const role = currentResetRole;
  
  try {
    const response = await fetch(`${API_URL}/auth/forgot-password/question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, role })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      currentResetUsername = username;
      document.getElementById('securityQuestion').value = data.securityQuestion;
      document.getElementById('forgotStep1').style.display = 'none';
      document.getElementById('forgotStep2').style.display = 'block';
      document.getElementById('forgotMessage').innerHTML = '';
    } else {
      document.getElementById('forgotMessage').innerHTML = `<p style="color: #f44336;">${data.error}</p>`;
    }
  } catch (error) {
    document.getElementById('forgotMessage').innerHTML = `<p style="color: #f44336;">Error: ${error.message}</p>`;
  }
});

// Step 2: Verify security answer
document.getElementById('forgotSecurityForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const answer = document.getElementById('securityAnswer').value;
  
  try {
    const response = await fetch(`${API_URL}/auth/forgot-password/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        username: currentResetUsername, 
        role: currentResetRole,
        answer 
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      currentResetToken = data.resetToken;
      document.getElementById('forgotStep2').style.display = 'none';
      document.getElementById('forgotStep3').style.display = 'block';
      document.getElementById('forgotMessage').innerHTML = '';
    } else {
      document.getElementById('forgotMessage').innerHTML = `<p style="color: #f44336;">${data.error}</p>`;
    }
  } catch (error) {
    document.getElementById('forgotMessage').innerHTML = `<p style="color: #f44336;">Error: ${error.message}</p>`;
  }
});

// Step 3: Reset password
document.getElementById('forgotNewPasswordForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  
  if (newPassword !== confirmPassword) {
    document.getElementById('forgotMessage').innerHTML = '<p style="color: #f44336;">Passwords do not match!</p>';
    return;
  }
  
  if (newPassword.length < 6) {
    document.getElementById('forgotMessage').innerHTML = '<p style="color: #f44336;">Password must be at least 6 characters!</p>';
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/auth/forgot-password/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        resetToken: currentResetToken,
        newPassword 
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      document.getElementById('forgotMessage').innerHTML = '<p style="color: #4caf50;">✓ Password reset successfully! You can now login with your new password.</p>';
      setTimeout(() => {
        closeForgotModal();
        showRoleSelection();
      }, 2000);
    } else {
      document.getElementById('forgotMessage').innerHTML = `<p style="color: #f44336;">${data.error}</p>`;
    }
  } catch (error) {
    document.getElementById('forgotMessage').innerHTML = `<p style="color: #f44336;">Error: ${error.message}</p>`;
  }
});
