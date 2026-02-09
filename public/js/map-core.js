/**
 * Kolek-Ta Map Core
 * Leaflet map initialization, bin display, view switching.
 */
(function() {
  'use strict';

  // Mati City coordinates (also stored on App for other modules)
  var MATI_CENTER = App.MATI_CENTER;
  var MATI_BOUNDS = App.MATI_BOUNDS;

  // Initialize map centered on Mati City
  var map = L.map('map', {
    center: MATI_CENTER,
    zoom: 13,
    minZoom: 12,
    maxZoom: 18,
    maxBounds: MATI_BOUNDS,
    maxBoundsViscosity: 1.0
  }).setView(MATI_CENTER, 13);

  // Store on App namespace
  App.map = map;

  // Track map loading state
  var mapTilesLoaded = false;
  var tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors | Mati City, Davao Oriental'
  }).addTo(map);
  App.tileLayer = tileLayer;

  // Hide loading overlay when map tiles are loaded
  tileLayer.on('load', function() {
    if (!mapTilesLoaded) {
      mapTilesLoaded = true;
      hideMapLoadingOverlay();
    }
  });

  // Fallback timeout
  setTimeout(hideMapLoadingOverlay, 5000);

  function hideMapLoadingOverlay() {
    var overlay = document.getElementById('mapLoadingOverlay');
    if (overlay) {
      overlay.style.opacity = '0';
      setTimeout(function() {
        overlay.style.display = 'none';
      }, 500);
    }
  }

  function showMapLoadingOverlay() {
    var overlay = document.getElementById('mapLoadingOverlay');
    if (overlay) {
      overlay.style.display = 'flex';
      overlay.style.opacity = '1';
      mapTilesLoaded = false;
    }
  }

  // Mati City boundary overlay
  L.rectangle(MATI_BOUNDS, {
    color: '#667eea',
    weight: 3,
    fillOpacity: 0,
    dashArray: '10, 10'
  }).addTo(map);

  // Major landmarks
  var landmarks = [
    { name: 'Mati City Hall', coords: [6.9549, 126.2185], icon: '\uD83C\uDFDB\uFE0F' },
    { name: 'Dahican Beach', coords: [6.8833, 126.2667], icon: '\uD83C\uDFD6\uFE0F' },
    { name: 'Sleeping Dinosaur', coords: [6.9000, 126.2500], icon: '\uD83E\uDD95' },
    { name: 'Mati Public Market', coords: [6.9560, 126.2170], icon: '\uD83C\uDFEA' }
  ];

  landmarks.forEach(function(landmark) {
    L.marker(landmark.coords, {
      icon: L.divIcon({
        className: 'landmark-icon',
        html: '<div style="font-size: 24px;">' + landmark.icon + '</div>',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      })
    }).addTo(map).bindPopup('<strong>' + landmark.name + '</strong>');
  });

  // Bin state
  App.bins = [];
  App.markers = {};

  async function loadBins() {
    try {
      var response = await fetchWithRetry(App.API_URL + '/bins');
      App.bins = await response.json();
      displayBins();
    } catch (error) {
      console.error('Error loading bins:', error);
    }
  }

  function displayBins() {
    Object.values(App.markers).forEach(function(marker) { map.removeLayer(marker); });
    App.markers = {};

    App.bins.forEach(function(bin) {
      var color = getStatusColor(bin.status);
      var marker = L.circleMarker([bin.location.coordinates[1], bin.location.coordinates[0]], {
        radius: 8,
        fillColor: color,
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
      }).addTo(map);

      marker.bindPopup(
        '<strong>' + bin.binId + '</strong><br>' +
        'Status: ' + bin.status + '<br>' +
        'Level: ' + bin.currentLevel + '%<br>' +
        'Type: ' + bin.binType
      );

      App.markers[bin._id] = marker;
    });
  }

  function getStatusColor(status) {
    var colors = {
      empty: '#4caf50',
      low: '#8bc34a',
      medium: '#ffc107',
      high: '#ff9800',
      full: '#f44336'
    };
    return colors[status] || '#999';
  }

  // View switching helpers
  function showPageContent() {
    var mapContainer = document.getElementById('mapContainer');
    var pageContainer = document.getElementById('pageContainer');
    var pageContent = document.getElementById('pageContent');
    // Clear stale content before showing container to prevent flicker
    if (pageContent) pageContent.innerHTML = '';
    if (mapContainer) mapContainer.classList.add('hidden');
    if (pageContainer) pageContainer.classList.remove('hidden');
  }

  function showMapView() {
    var mapContainer = document.getElementById('mapContainer');
    var pageContainer = document.getElementById('pageContainer');
    var pageContent = document.getElementById('pageContent');
    // Clear stale content to prevent flicker on next page show
    if (pageContent) pageContent.innerHTML = '';
    if (mapContainer) mapContainer.classList.remove('hidden');
    if (pageContainer) pageContainer.classList.add('hidden');
  }

  // Expose on window
  window.hideMapLoadingOverlay = hideMapLoadingOverlay;
  window.showMapLoadingOverlay = showMapLoadingOverlay;
  window.loadBins = loadBins;
  window.displayBins = displayBins;
  window.getStatusColor = getStatusColor;
  window.showPageContent = showPageContent;
  window.showMapView = showMapView;
  // Keep backward compat: some code references `map` directly
  window.map = map;
  window.MATI_CENTER = MATI_CENTER;
  window.MATI_BOUNDS = MATI_BOUNDS;
  window.bins = App.bins;
  window.markers = App.markers;

})();
