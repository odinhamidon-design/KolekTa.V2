/**
 * OSRM (Open Source Routing Machine) Service
 * Provides real road distances and routing via the public OSRM API
 * Includes circuit breaker pattern with Haversine fallback
 */

const logger = require('./logger');

const OSRM_BASE_URL = 'https://router.project-osrm.org';
const REQUEST_TIMEOUT = 10000; // 10 seconds

// Simple in-memory cache for distance matrices
const distanceCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100; // Maximum number of cache entries

// ===========================================
// Circuit Breaker
// ===========================================

const circuitBreaker = {
  state: 'closed',       // closed | open | half-open
  failures: 0,
  failureThreshold: 3,   // consecutive failures to open
  failureWindow: 60000,  // 60s window for counting failures
  resetTimeout: 30000,   // 30s before probing
  lastFailureTime: 0,
  lastOpenTime: 0,
};

function isCircuitOpen() {
  if (circuitBreaker.state === 'closed') return false;

  if (circuitBreaker.state === 'open') {
    // Check if enough time has passed to try half-open
    if (Date.now() - circuitBreaker.lastOpenTime >= circuitBreaker.resetTimeout) {
      circuitBreaker.state = 'half-open';
      logger.info('OSRM circuit breaker: half-open, sending probe request');
      return false; // Allow one probe
    }
    return true; // Still open
  }

  // half-open: allow the probe request
  return false;
}

function recordSuccess() {
  if (circuitBreaker.state === 'half-open') {
    logger.info('OSRM circuit breaker: closed (probe succeeded)');
  }
  circuitBreaker.state = 'closed';
  circuitBreaker.failures = 0;
}

function recordFailure() {
  const now = Date.now();

  // Reset failure count if outside the window
  if (now - circuitBreaker.lastFailureTime > circuitBreaker.failureWindow) {
    circuitBreaker.failures = 0;
  }

  circuitBreaker.failures++;
  circuitBreaker.lastFailureTime = now;

  if (circuitBreaker.state === 'half-open') {
    // Probe failed, reopen
    circuitBreaker.state = 'open';
    circuitBreaker.lastOpenTime = now;
    logger.warn('OSRM circuit breaker: open (probe failed)');
    return;
  }

  if (circuitBreaker.failures >= circuitBreaker.failureThreshold) {
    circuitBreaker.state = 'open';
    circuitBreaker.lastOpenTime = now;
    logger.warn(`OSRM circuit breaker: open after ${circuitBreaker.failures} consecutive failures`);
  }
}

function getCircuitState() {
  return {
    state: circuitBreaker.state,
    failures: circuitBreaker.failures,
    lastFailure: circuitBreaker.lastFailureTime ? new Date(circuitBreaker.lastFailureTime).toISOString() : null
  };
}

// ===========================================
// Haversine Fallback
// ===========================================

const ROAD_FACTOR = 1.4; // Haversine * 1.4 approximates road distance
const AVG_SPEED_KMH = 30; // Approximate urban speed for duration estimate

function haversineDistance(point1, point2) {
  const R = 6371;
  const lat1 = point1.lat * Math.PI / 180;
  const lat2 = point2.lat * Math.PI / 180;
  const deltaLat = (point2.lat - point1.lat) * Math.PI / 180;
  const deltaLng = (point2.lng - point1.lng) * Math.PI / 180;

  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function buildHaversineFallbackMatrix(locations) {
  const n = locations.length;
  const distances = Array(n).fill(null).map(() => Array(n).fill(0));
  const durations = Array(n).fill(null).map(() => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dist = haversineDistance(locations[i], locations[j]) * ROAD_FACTOR;
      const dur = (dist / AVG_SPEED_KMH) * 3600; // seconds
      distances[i][j] = dist;
      distances[j][i] = dist;
      durations[i][j] = dur;
      durations[j][i] = dur;
    }
  }

  return { distances, durations };
}

// ===========================================
// Cache Management
// ===========================================

/**
 * Clean up expired cache entries to prevent memory leaks
 */
function cleanupCache() {
  const now = Date.now();
  for (const [key, value] of distanceCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      distanceCache.delete(key);
    }
  }

  // If still over limit, remove oldest entries
  if (distanceCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(distanceCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);

    const toDelete = entries.slice(0, distanceCache.size - MAX_CACHE_SIZE);
    for (const [key] of toDelete) {
      distanceCache.delete(key);
    }
  }
}

// Run cache cleanup every 5 minutes
setInterval(cleanupCache, CACHE_TTL).unref();

/**
 * Generate cache key from locations
 */
function getCacheKey(locations) {
  return locations.map(l => `${l.lat.toFixed(5)},${l.lng.toFixed(5)}`).join('|');
}

// ===========================================
// Network Helpers
// ===========================================

/**
 * Fetch with timeout support
 */
async function fetchWithTimeout(url, timeout = REQUEST_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('OSRM request timeout');
    }
    throw error;
  }
}

/**
 * Fetch with circuit breaker protection.
 * Throws if circuit is open. Records success/failure.
 */
async function fetchWithCircuitBreaker(url, timeout = REQUEST_TIMEOUT) {
  if (isCircuitOpen()) {
    throw new Error('OSRM circuit breaker is open');
  }

  try {
    const response = await fetchWithTimeout(url, timeout);
    const data = await response.json();

    if (data.code === 'Ok') {
      recordSuccess();
    } else {
      // OSRM returned an error response — don't count as circuit failure
      // (bad input, not service down)
    }

    return data;
  } catch (error) {
    recordFailure();
    throw error;
  }
}

// ===========================================
// OSRM API Functions
// ===========================================

/**
 * Get route between two points
 * @param {Object} from - {lat, lng}
 * @param {Object} to - {lat, lng}
 * @returns {Promise<Object>} Route info with distance, duration, geometry
 */
async function getRouteDistance(from, to) {
  const url = `${OSRM_BASE_URL}/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;

  try {
    const data = await fetchWithCircuitBreaker(url);

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      // Fallback to Haversine
      const dist = haversineDistance(from, to) * ROAD_FACTOR;
      return {
        success: true,
        distance: Math.round(dist * 100) / 100,
        duration: Math.round((dist / AVG_SPEED_KMH) * 3600),
        durationMinutes: Math.round((dist / AVG_SPEED_KMH) * 60),
        fallback: true
      };
    }

    const route = data.routes[0];
    return {
      success: true,
      distance: route.distance / 1000, // Convert meters to km
      duration: route.duration, // seconds
      durationMinutes: Math.round(route.duration / 60),
      geometry: route.geometry
    };
  } catch (error) {
    // Circuit open or network failure — use Haversine fallback
    const dist = haversineDistance(from, to) * ROAD_FACTOR;
    return {
      success: true,
      distance: Math.round(dist * 100) / 100,
      duration: Math.round((dist / AVG_SPEED_KMH) * 3600),
      durationMinutes: Math.round((dist / AVG_SPEED_KMH) * 60),
      fallback: true
    };
  }
}

/**
 * Get distance/duration matrix for multiple locations
 * Uses OSRM Table service for efficient all-pairs calculation
 * Falls back to Haversine matrix when circuit is open
 * @param {Array} locations - Array of {lat, lng} objects
 * @returns {Promise<Object>} Matrix of distances and durations
 */
async function getDistanceMatrix(locations) {
  if (locations.length < 2) {
    return {
      success: false,
      error: 'At least 2 locations required'
    };
  }

  // Check cache first
  const cacheKey = getCacheKey(locations);
  const cached = distanceCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { ...cached.data, fromCache: true };
  }

  // Build coordinates string: lng,lat;lng,lat;...
  const coords = locations.map(l => `${l.lng},${l.lat}`).join(';');
  const url = `${OSRM_BASE_URL}/table/v1/driving/${coords}?annotations=distance,duration`;

  try {
    const data = await fetchWithCircuitBreaker(url);

    if (data.code !== 'Ok') {
      // OSRM error — use Haversine fallback
      return haversineFallbackMatrix(locations, cacheKey);
    }

    const result = {
      success: true,
      distances: data.distances.map(row => row.map(d => d / 1000)), // meters to km
      durations: data.durations, // seconds
      locations: locations.length
    };

    // Cache the result
    cacheResult(cacheKey, result);
    return result;
  } catch (error) {
    // Circuit open or network failure — Haversine fallback
    return haversineFallbackMatrix(locations, cacheKey);
  }
}

function haversineFallbackMatrix(locations, cacheKey) {
  logger.debug('Using Haversine fallback for distance matrix');
  const { distances, durations } = buildHaversineFallbackMatrix(locations);

  const result = {
    success: true,
    distances: distances.map(row => row.map(d => Math.round(d * 1000) / 1000)),
    durations,
    locations: locations.length,
    fallback: true
  };

  cacheResult(cacheKey, result);
  return result;
}

function cacheResult(cacheKey, result) {
  if (distanceCache.size >= MAX_CACHE_SIZE) {
    cleanupCache();
  }
  distanceCache.set(cacheKey, {
    data: result,
    timestamp: Date.now()
  });
}

/**
 * Get optimal route through multiple waypoints
 * Uses OSRM Trip service (solves TSP)
 * @param {Array} waypoints - Array of {lat, lng} objects
 * @param {Object} options - { roundtrip: true, source: 'first', destination: 'last' }
 * @returns {Promise<Object>} Optimized route with order, distance, duration
 */
async function getOptimalRoute(waypoints, options = {}) {
  if (waypoints.length < 2) {
    return {
      success: false,
      error: 'At least 2 waypoints required'
    };
  }

  const {
    roundtrip = true,
    source = 'first',
    destination = 'last'
  } = options;

  const coords = waypoints.map(w => `${w.lng},${w.lat}`).join(';');
  const url = `${OSRM_BASE_URL}/trip/v1/driving/${coords}?roundtrip=${roundtrip}&source=${source}&destination=${destination}&overview=full&geometries=geojson&annotations=true`;

  try {
    const data = await fetchWithCircuitBreaker(url);

    if (data.code !== 'Ok' || !data.trips || data.trips.length === 0) {
      return {
        success: false,
        error: data.message || 'Trip optimization failed',
        fallback: true
      };
    }

    const trip = data.trips[0];

    // Extract the optimized order from waypoint indices
    const optimizedOrder = data.waypoints.map(wp => ({
      originalIndex: wp.waypoint_index,
      location: {
        lat: wp.location[1],
        lng: wp.location[0]
      },
      name: wp.name || ''
    }));

    return {
      success: true,
      distance: trip.distance / 1000, // km
      duration: trip.duration, // seconds
      durationMinutes: Math.round(trip.duration / 60),
      geometry: trip.geometry,
      optimizedOrder: optimizedOrder.sort((a, b) => a.originalIndex - b.originalIndex),
      legs: trip.legs.map(leg => ({
        distance: leg.distance / 1000,
        duration: leg.duration,
        durationMinutes: Math.round(leg.duration / 60)
      }))
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      fallback: true
    };
  }
}

/**
 * Get full route with turn-by-turn directions
 * @param {Array} waypoints - Array of {lat, lng} objects (in order)
 * @returns {Promise<Object>} Route with directions, distance, duration
 */
async function getRouteWithDirections(waypoints) {
  if (waypoints.length < 2) {
    return {
      success: false,
      error: 'At least 2 waypoints required'
    };
  }

  const coords = waypoints.map(w => `${w.lng},${w.lat}`).join(';');
  const url = `${OSRM_BASE_URL}/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=true&annotations=true`;

  try {
    const data = await fetchWithCircuitBreaker(url);

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      return {
        success: false,
        error: data.message || 'Route calculation failed'
      };
    }

    const route = data.routes[0];

    return {
      success: true,
      distance: route.distance / 1000, // km
      duration: route.duration, // seconds
      durationMinutes: Math.round(route.duration / 60),
      geometry: route.geometry,
      legs: route.legs.map((leg, idx) => ({
        legIndex: idx,
        distance: leg.distance / 1000,
        duration: leg.duration,
        durationMinutes: Math.round(leg.duration / 60),
        steps: leg.steps.map(step => ({
          instruction: step.maneuver.type + (step.maneuver.modifier ? ` ${step.maneuver.modifier}` : ''),
          distance: step.distance / 1000,
          duration: step.duration,
          name: step.name || ''
        }))
      })),
      waypoints: data.waypoints.map(wp => ({
        lat: wp.location[1],
        lng: wp.location[0],
        name: wp.name || ''
      }))
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Clear the distance cache
 */
function clearCache() {
  distanceCache.clear();
}

/**
 * Get cache statistics
 */
function getCacheStats() {
  return {
    size: distanceCache.size,
    keys: Array.from(distanceCache.keys()).length
  };
}

module.exports = {
  getRouteDistance,
  getDistanceMatrix,
  getOptimalRoute,
  getRouteWithDirections,
  clearCache,
  getCacheStats,
  getCircuitState,
  OSRM_BASE_URL
};
