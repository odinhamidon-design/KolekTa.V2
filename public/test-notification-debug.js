// Notification System Debug Script
// Run this in browser console to check if everything is loaded

console.log('=== NOTIFICATION SYSTEM DEBUG ===');

// Check if functions exist
console.log('\n1. Checking Functions:');
console.log('   showNotificationDetails:', typeof window.showNotificationDetails !== 'undefined' ? '✓ EXISTS' : '✗ MISSING');
console.log('   deleteNotification:', typeof window.deleteNotification !== 'undefined' ? '✓ EXISTS' : '✗ MISSING');
console.log('   deleteAllNotifications:', typeof window.deleteAllNotifications !== 'undefined' ? '✓ EXISTS' : '✗ MISSING');
console.log('   markNotificationRead:', typeof window.markNotificationRead !== 'undefined' ? '✓ EXISTS' : '✗ MISSING');
console.log('   markAllNotificationsRead:', typeof window.markAllNotificationsRead !== 'undefined' ? '✓ EXISTS' : '✗ MISSING');
console.log('   showNotificationHistory:', typeof window.showNotificationHistory !== 'undefined' ? '✓ EXISTS' : '✗ MISSING');

// Check if user is logged in
console.log('\n2. Checking User:');
const token = localStorage.getItem('token');
console.log('   Token exists:', token ? '✓ YES' : '✗ NO');

if (typeof user !== 'undefined') {
  console.log('   User object:', user);
  console.log('   User role:', user.role);
  console.log('   Is admin:', user.role === 'admin' ? '✓ YES' : '✗ NO');
} else {
  console.log('   User object: ✗ NOT LOADED');
}

// Check notification badge
console.log('\n3. Checking Notification Badge:');
const badge = document.getElementById('notificationBadge');
console.log('   Badge element:', badge ? '✓ EXISTS' : '✗ MISSING');
if (badge) {
  console.log('   Badge text:', badge.textContent);
  console.log('   Badge onclick:', badge.onclick ? '✓ HAS HANDLER' : '✗ NO HANDLER');
}

// Check notification container
console.log('\n4. Checking Container:');
const container = document.getElementById('headerNotificationContainer');
console.log('   Container:', container ? '✓ EXISTS' : '✗ MISSING');

// Test API endpoint
console.log('\n5. Testing API (if logged in):');
if (token) {
  fetch(`${API_URL}/completions/notifications/pending`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(res => res.json())
  .then(data => {
    console.log('   API Response:', data);
    console.log('   Pending notifications:', data.length);
    if (data.length > 0) {
      console.log('   First notification:', data[0]);
    }
  })
  .catch(err => {
    console.error('   API Error:', err);
  });
} else {
  console.log('   ✗ Cannot test - not logged in');
}

console.log('\n=== END DEBUG ===');
console.log('\nTo manually trigger notification modal, run:');
console.log('checkCompletionNotifications()');
