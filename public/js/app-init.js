/**
 * Kolek-Ta App Entry Point
 * Loaded last — calls initializeApp() after all modules are ready.
 */
(function() {
  'use strict';
  document.addEventListener('DOMContentLoaded', function() {
    if (typeof initializeApp === 'function') {
      initializeApp();
    }
    if (typeof loadHeaderProfilePicture === 'function') {
      setTimeout(function() { loadHeaderProfilePicture(); }, 100);
    }
  });
})();
