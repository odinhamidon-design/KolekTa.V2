/**
 * OSRM (Open Source Routing Machine) Service
 * Provides real road distances and routing via the public OSRM API
 */

const OSRM_BASE_URL = 'https://router.project-osrm.org';
const REQUEST_TIMEOUT = 10000; // 10 seconds

// Simple in-memory cache for distance matrices
const distanceCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Generate cache key from locations
 */
function getCacheKey(locations) {
  return locations.map(l => `${l.lat.toFixed(5)},${l.lng.toFixed(5)}`).join('|');
}

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
 * Get route between two points
 * @param {Object} from - {lat, lng}
 * @param {Object} to - {lat, lng}
 * @returns {Promise<Object>} Route info with distance, duration, geometry
 */
async function getRouteDistance(from, to) {
  const url = `${OSRM_BASE_URL}/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;

  try {
    const response = await fetchWithTimeout(url);
    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      return {
        success: false,
        error: data.message || 'No route found'
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
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get distance/duration matrix for multiple locations
 * Uses OSRM Table service for efficient all-pairs calculation
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
    const response = await fetchWithTimeout(url);
    const data = await response.json();

    if (data.code !== 'Ok') {
      return {
        success: false,
        error: data.message || 'Matrix calculation failed'
      };
    }

    const result = {
      success: true,
      distances: data.distances.map(row => row.map(d => d / 1000)), // meters to km
      durations: data.durations, // seconds
      locations: locations.length
    };

    // Cache the result
    distanceCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
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
    const response = await fetchWithTimeout(url);
    const data = await response.json();

    if (data.code !== 'Ok' || !data.trips || data.trips.length === 0) {
      return {
        success: false,
        error: data.message || 'Trip optimization failed'
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
      error: error.message
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
    const response = await fetchWithTimeout(url);
    const data = await response.json();

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
  OSRM_BASE_URL
};
