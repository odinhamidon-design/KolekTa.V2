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
  // Re-render icons for the newly visible form
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
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
  const submitBtn = e.target.querySelector('button[type="submit"]');

  // Show loading state
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<svg class="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Signing in...';

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
      resetSubmitBtn(submitBtn, 'Sign In');
    }
  } catch (error) {
    showError('Connection error. Please try again.');
    resetSubmitBtn(submitBtn, 'Sign In');
  }
});

// Driver login
document.getElementById('driverManualForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('driverUsername').value;
  const password = document.getElementById('driverPassword').value;
  const submitBtn = e.target.querySelector('button[type="submit"]');

  // Show loading state
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<svg class="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Signing in...';

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
      resetSubmitBtn(submitBtn, 'Sign In');
    }
  } catch (error) {
    showError('Connection error. Please try again.');
    resetSubmitBtn(submitBtn, 'Sign In');
  }
});

function resetSubmitBtn(btn, text) {
  btn.disabled = false;
  btn.innerHTML = `<i data-lucide="log-in" class="w-5 h-5"></i> ${text}`;
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// Helper functions
function showError(message) {
  const errorDiv = document.getElementById('errorMessage');
  errorDiv.textContent = message;
  errorDiv.classList.remove('hidden');

  setTimeout(() => {
    errorDiv.classList.add('hidden');
  }, 5000);
}

function clearError() {
  document.getElementById('errorMessage').classList.add('hidden');
}

// Toggle password visibility
function togglePassword(inputId, button) {
  const input = document.getElementById(inputId);
  if (!input) return;

  // Lucide replaces <i> with <svg>, so check for both
  let icon = button.querySelector('i') || button.querySelector('svg');

  if (input.type === 'password') {
    input.type = 'text';
    if (icon) {
      // Replace SVG with new icon
      button.innerHTML = '<i data-lucide="eye-off" class="w-5 h-5"></i>';
    }
  } else {
    input.type = 'password';
    if (icon) {
      button.innerHTML = '<i data-lucide="eye" class="w-5 h-5"></i>';
    }
  }

  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// Forgot Password Functions
let currentResetToken = null;
let currentResetUsername = null;
let currentResetRole = null;

function showForgotPassword(role) {
  event.preventDefault();
  const modal = document.getElementById('forgotModal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.getElementById('forgotRole').value = role;
  currentResetRole = role;
  resetForgotModal();
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function closeForgotModal() {
  const modal = document.getElementById('forgotModal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  resetForgotModal();
}

function resetForgotModal() {
  // Show step 1, hide others
  document.getElementById('forgotStep1').classList.remove('hidden');
  document.getElementById('forgotStep2').classList.add('hidden');
  document.getElementById('forgotStep3').classList.add('hidden');

  // Reset step indicators
  updateStepIndicator(1);

  // Clear form values
  document.getElementById('forgotMessage').innerHTML = '';
  document.getElementById('forgotUsername').value = '';
  document.getElementById('securityAnswer').value = '';
  document.getElementById('newPassword').value = '';
  document.getElementById('confirmPassword').value = '';
  currentResetToken = null;
  currentResetUsername = null;
}

function updateStepIndicator(currentStep) {
  const steps = [1, 2, 3];
  steps.forEach(step => {
    const indicator = document.getElementById(`step${step}Indicator`);
    if (step < currentStep) {
      // Completed step
      indicator.className = 'w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-medium';
      indicator.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
    } else if (step === currentStep) {
      // Current step
      indicator.className = 'w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-medium';
      indicator.textContent = step;
    } else {
      // Future step
      indicator.className = 'w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-medium';
      indicator.textContent = step;
    }
  });
}

// Step 1: Get security question
document.getElementById('forgotUsernameForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('forgotUsername').value;
  const role = currentResetRole;
  const submitBtn = e.target.querySelector('button[type="submit"]');

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<svg class="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';

  try {
    const response = await fetch(`${API_URL}/auth/forgot-password/question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, role })
    });

    const data = await response.json();

    if (response.ok) {
      currentResetUsername = username;
      document.getElementById('securityQuestion').textContent = data.securityQuestion;
      document.getElementById('forgotStep1').classList.add('hidden');
      document.getElementById('forgotStep2').classList.remove('hidden');
      updateStepIndicator(2);
      document.getElementById('forgotMessage').innerHTML = '';
    } else {
      document.getElementById('forgotMessage').innerHTML = `<p class="text-red-500 text-sm text-center">${data.error}</p>`;
    }
  } catch (error) {
    document.getElementById('forgotMessage').innerHTML = `<p class="text-red-500 text-sm text-center">Error: ${error.message}</p>`;
  }

  submitBtn.disabled = false;
  submitBtn.innerHTML = 'Continue <i data-lucide="arrow-right" class="w-4 h-4"></i>';
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
});

// Step 2: Verify security answer
document.getElementById('forgotSecurityForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const answer = document.getElementById('securityAnswer').value;
  const submitBtn = e.target.querySelector('button[type="submit"]');

  submitBtn.disabled = true;
  submitBtn.textContent = 'Verifying...';

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
      document.getElementById('forgotStep2').classList.add('hidden');
      document.getElementById('forgotStep3').classList.remove('hidden');
      updateStepIndicator(3);
      document.getElementById('forgotMessage').innerHTML = '';
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    } else {
      document.getElementById('forgotMessage').innerHTML = `<p class="text-red-500 text-sm text-center">${data.error}</p>`;
    }
  } catch (error) {
    document.getElementById('forgotMessage').innerHTML = `<p class="text-red-500 text-sm text-center">Error: ${error.message}</p>`;
  }

  submitBtn.disabled = false;
  submitBtn.textContent = 'Verify';
});

// Step 3: Reset password
document.getElementById('forgotNewPasswordForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const submitBtn = e.target.querySelector('button[type="submit"]');

  if (newPassword !== confirmPassword) {
    document.getElementById('forgotMessage').innerHTML = '<p class="text-red-500 text-sm text-center">Passwords do not match!</p>';
    return;
  }

  if (newPassword.length < 6) {
    document.getElementById('forgotMessage').innerHTML = '<p class="text-red-500 text-sm text-center">Password must be at least 6 characters!</p>';
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<svg class="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';

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
      document.getElementById('forgotMessage').innerHTML = `
        <div class="flex items-center justify-center gap-2 text-primary-600">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span class="font-medium">Password reset successfully!</span>
        </div>
      `;
      setTimeout(() => {
        closeForgotModal();
        showRoleSelection();
      }, 2000);
    } else {
      document.getElementById('forgotMessage').innerHTML = `<p class="text-red-500 text-sm text-center">${data.error}</p>`;
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i data-lucide="check" class="w-5 h-5"></i> Reset Password';
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }
  } catch (error) {
    document.getElementById('forgotMessage').innerHTML = `<p class="text-red-500 text-sm text-center">Error: ${error.message}</p>`;
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i data-lucide="check" class="w-5 h-5"></i> Reset Password';
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
});

// Close modal when clicking outside
document.getElementById('forgotModal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('forgotModal')) {
    closeForgotModal();
  }
});
