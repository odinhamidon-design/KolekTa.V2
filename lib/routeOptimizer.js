/**
 * Route Optimization Library - Enhanced Version
 * Features:
 * - OSRM integration for real road distances
 * - Vehicle capacity constraints
 * - Dynamic speed estimation with traffic factors
 * - Backward compatible with original API
 *
 * Central Depot: Mati City Hall area (default starting point)
 */

const osrmService = require('./osrmService');
const speedProfiles = require('./speedProfiles');

// Default depot location (Mati City Hall area)
const DEFAULT_DEPOT = {
  lat: 6.9551,
  lng: 126.2166,
  name: 'Central Depot - Mati City'
};

// Default options
const DEFAULT_OPTIONS = {
  useRoadDistance: true,      // Use OSRM for real road distances
  considerCapacity: false,    // Enable capacity constraints
  truckCapacity: 10,          // cubic meters (m³)
  capacityThreshold: 0.9,     // Return to depot at 90% capacity
  speedProfile: 'urban_collection',
  scheduledTime: null,        // For traffic estimation
  includeGeometry: false      // Include road geometry in response
};

/**
 * Calculate distance between two points using Haversine formula
 * @param {Object} point1 - {lat, lng}
 * @param {Object} point2 - {lat, lng}
 * @returns {number} Distance in kilometers
 */
function haversineDistance(point1, point2) {
  const R = 6371; // Earth's radius in kilometers

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

/**
 * Calculate total distance of a route using Haversine
 * @param {Array} locations - Array of {lat, lng} objects
 * @param {Object} depot - Starting/ending point
 * @returns {number} Total distance in kilometers
 */
function calculateTotalDistance(locations, depot = DEFAULT_DEPOT) {
  if (locations.length === 0) return 0;

  let totalDistance = 0;

  // From depot to first location
  totalDistance += haversineDistance(depot, locations[0]);

  // Between locations
  for (let i = 0; i < locations.length - 1; i++) {
    totalDistance += haversineDistance(locations[i], locations[i + 1]);
  }

  // From last location back to depot
  totalDistance += haversineDistance(locations[locations.length - 1], depot);

  return Math.round(totalDistance * 100) / 100;
}

/**
 * Calculate total distance using a distance matrix
 * @param {Array} locations - Array of {lat, lng} objects
 * @param {Object} depot - Starting/ending point
 * @param {Array} distanceMatrix - Pre-computed distance matrix (includes depot as first row/col)
 * @returns {number} Total distance in kilometers
 */
function calculateTotalDistanceFromMatrix(locations, depot, distanceMatrix) {
  if (locations.length === 0) return 0;

  let totalDistance = 0;

  // From depot (index 0) to first location (index 1)
  totalDistance += distanceMatrix[0][1];

  // Between locations
  for (let i = 0; i < locations.length - 1; i++) {
    totalDistance += distanceMatrix[i + 1][i + 2];
  }

  // From last location back to depot
  totalDistance += distanceMatrix[locations.length][0];

  return Math.round(totalDistance * 100) / 100;
}

/**
 * Build a distance matrix using Haversine
 * @param {Array} allPoints - Array of {lat, lng} objects (depot first)
 * @returns {Array} 2D distance matrix
 */
function buildHaversineMatrix(allPoints) {
  const n = allPoints.length;
  const matrix = Array(n).fill(null).map(() => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dist = haversineDistance(allPoints[i], allPoints[j]);
      matrix[i][j] = dist;
      matrix[j][i] = dist;
    }
  }

  return matrix;
}

/**
 * Nearest Neighbor Algorithm (synchronous, Haversine-based)
 * Starts from depot, always visits the nearest unvisited location
 *
 * @param {Array} locations - Array of {lat, lng, name?, id?} objects
 * @param {Object} depot - Starting point {lat, lng}
 * @returns {Object} Optimized route info
 */
function nearestNeighbor(locations, depot = DEFAULT_DEPOT) {
  if (locations.length <= 1) {
    return {
      optimizedOrder: locations,
      originalDistance: calculateTotalDistance(locations, depot),
      optimizedDistance: calculateTotalDistance(locations, depot),
      distanceSaved: 0,
      percentageSaved: 0,
      depot
    };
  }

  const originalDistance = calculateTotalDistance(locations, depot);

  // Create a copy to work with
  const unvisited = [...locations];
  const optimizedOrder = [];
  let currentLocation = depot;

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    // Find nearest unvisited location
    for (let i = 0; i < unvisited.length; i++) {
      const distance = haversineDistance(currentLocation, unvisited[i]);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = i;
      }
    }

    // Move to nearest location
    currentLocation = unvisited[nearestIndex];
    optimizedOrder.push(unvisited[nearestIndex]);
    unvisited.splice(nearestIndex, 1);
  }

  const optimizedDistance = calculateTotalDistance(optimizedOrder, depot);
  const distanceSaved = originalDistance - optimizedDistance;
  const percentageSaved = originalDistance > 0
    ? Math.round((distanceSaved / originalDistance) * 100 * 10) / 10
    : 0;

  return {
    optimizedOrder,
    originalDistance,
    optimizedDistance,
    distanceSaved: Math.round(distanceSaved * 100) / 100,
    percentageSaved,
    depot,
    estimatedTime: estimateTime(optimizedDistance),
    originalTime: estimateTime(originalDistance)
  };
}

/**
 * Nearest Neighbor Algorithm using distance matrix
 * @param {Array} locations - Array of {lat, lng} objects
 * @param {Array} distanceMatrix - Pre-computed matrix (depot at index 0)
 * @param {Object} depot - Depot location
 * @returns {Object} Optimized route info
 */
function nearestNeighborWithMatrix(locations, distanceMatrix, depot) {
  if (locations.length <= 1) {
    const dist = locations.length === 1
      ? distanceMatrix[0][1] + distanceMatrix[1][0]
      : 0;
    return {
      optimizedOrder: locations,
      optimizedIndices: locations.map((_, i) => i),
      totalDistance: dist
    };
  }

  // Indices: 0 = depot, 1..n = locations
  const unvisited = new Set(locations.map((_, i) => i + 1));
  const optimizedIndices = [];
  let currentIndex = 0; // Start at depot
  let totalDistance = 0;

  while (unvisited.size > 0) {
    let nearestIndex = -1;
    let nearestDistance = Infinity;

    for (const idx of unvisited) {
      const dist = distanceMatrix[currentIndex][idx];
      if (dist < nearestDistance) {
        nearestDistance = dist;
        nearestIndex = idx;
      }
    }

    totalDistance += nearestDistance;
    optimizedIndices.push(nearestIndex - 1); // Convert back to location index
    unvisited.delete(nearestIndex);
    currentIndex = nearestIndex;
  }

  // Return to depot
  totalDistance += distanceMatrix[currentIndex][0];

  return {
    optimizedOrder: optimizedIndices.map(i => locations[i]),
    optimizedIndices,
    totalDistance: Math.round(totalDistance * 100) / 100
  };
}

/**
 * 2-opt improvement algorithm
 * Tries to improve the route by reversing segments
 *
 * @param {Array} locations - Array of {lat, lng} objects
 * @param {Object} depot - Starting point
 * @returns {Object} Improved route info
 */
function twoOptImprovement(locations, depot = DEFAULT_DEPOT) {
  if (locations.length <= 3) {
    return nearestNeighbor(locations, depot);
  }

  // Start with nearest neighbor solution
  let result = nearestNeighbor(locations, depot);
  let route = [...result.optimizedOrder];
  let improved = true;
  let iterations = 0;
  const maxIterations = 100;

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;
    let currentDistance = calculateTotalDistance(route, depot);

    for (let i = 0; i < route.length - 1; i++) {
      for (let j = i + 2; j < route.length; j++) {
        // Reverse segment between i+1 and j
        const newRoute = [
          ...route.slice(0, i + 1),
          ...route.slice(i + 1, j + 1).reverse(),
          ...route.slice(j + 1)
        ];

        const newDistance = calculateTotalDistance(newRoute, depot);

        if (newDistance < currentDistance) {
          route = newRoute;
          currentDistance = newDistance;
          improved = true;
        }
      }
    }
  }

  const originalDistance = calculateTotalDistance(locations, depot);
  const optimizedDistance = calculateTotalDistance(route, depot);
  const distanceSaved = originalDistance - optimizedDistance;

  return {
    optimizedOrder: route,
    originalDistance,
    optimizedDistance,
    distanceSaved: Math.round(distanceSaved * 100) / 100,
    percentageSaved: originalDistance > 0
      ? Math.round((distanceSaved / originalDistance) * 100 * 10) / 10
      : 0,
    depot,
    estimatedTime: estimateTime(optimizedDistance),
    originalTime: estimateTime(originalDistance),
    iterations
  };
}

/**
 * 2-opt improvement using distance matrix
 */
function twoOptWithMatrix(locations, distanceMatrix, depot, initialOrder = null) {
  if (locations.length <= 3) {
    return nearestNeighborWithMatrix(locations, distanceMatrix, depot);
  }

  // Start with nearest neighbor or provided initial order
  let result = initialOrder
    ? { optimizedOrder: initialOrder, optimizedIndices: initialOrder.map((_, i) => i) }
    : nearestNeighborWithMatrix(locations, distanceMatrix, depot);

  let route = [...result.optimizedIndices];
  let improved = true;
  let iterations = 0;
  const maxIterations = 100;

  const calcRouteDistance = (r) => {
    let dist = distanceMatrix[0][r[0] + 1]; // depot to first
    for (let i = 0; i < r.length - 1; i++) {
      dist += distanceMatrix[r[i] + 1][r[i + 1] + 1];
    }
    dist += distanceMatrix[r[r.length - 1] + 1][0]; // last to depot
    return dist;
  };

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;
    let currentDistance = calcRouteDistance(route);

    for (let i = 0; i < route.length - 1; i++) {
      for (let j = i + 2; j < route.length; j++) {
        const newRoute = [
          ...route.slice(0, i + 1),
          ...route.slice(i + 1, j + 1).reverse(),
          ...route.slice(j + 1)
        ];

        const newDistance = calcRouteDistance(newRoute);

        if (newDistance < currentDistance) {
          route = newRoute;
          currentDistance = newDistance;
          improved = true;
        }
      }
    }
  }

  return {
    optimizedOrder: route.map(i => locations[i]),
    optimizedIndices: route,
    totalDistance: Math.round(calcRouteDistance(route) * 100) / 100,
    iterations
  };
}

/**
 * Capacity-aware optimization
 * Splits route into multiple trips when truck capacity is exceeded
 *
 * @param {Array} locations - Array of {lat, lng, volume?} objects
 * @param {Object} options - { truckCapacity (m³), capacityThreshold, distanceMatrix, depot }
 * @returns {Object} Multi-trip optimization result
 */
function optimizeWithCapacity(locations, options = {}) {
  const {
    truckCapacity = 10, // Default 10 cubic meters (m³)
    capacityThreshold = 0.9,
    distanceMatrix = null,
    depot = DEFAULT_DEPOT,
    binVolumes = null
  } = options;

  const maxLoad = truckCapacity * capacityThreshold;

  // Assign volumes to locations (default 0.02 m³ = 20 liters per bin)
  const locationsWithVolume = locations.map((loc, i) => ({
    ...loc,
    volume: binVolumes ? binVolumes[i] : (loc.volume || loc.estimatedVolume || 0.02),
    originalIndex: i
  }));

  const trips = [];
  let remainingLocations = [...locationsWithVolume];
  let tripNumber = 0;

  while (remainingLocations.length > 0) {
    tripNumber++;
    const tripStops = [];
    let currentLoad = 0;
    let currentLocation = depot;

    // Greedy nearest neighbor with capacity check
    while (remainingLocations.length > 0) {
      // Find nearest location that fits in remaining capacity
      let bestIndex = -1;
      let bestDistance = Infinity;

      for (let i = 0; i < remainingLocations.length; i++) {
        const loc = remainingLocations[i];
        if (currentLoad + loc.volume <= maxLoad) {
          const dist = distanceMatrix
            ? distanceMatrix[currentLocation === depot ? 0 : tripStops[tripStops.length - 1].originalIndex + 1][loc.originalIndex + 1]
            : haversineDistance(currentLocation, loc);

          if (dist < bestDistance) {
            bestDistance = dist;
            bestIndex = i;
          }
        }
      }

      if (bestIndex === -1) {
        // No more bins fit, end this trip
        break;
      }

      // Add to trip
      const selected = remainingLocations[bestIndex];
      tripStops.push(selected);
      currentLoad += selected.volume;
      currentLocation = selected;
      remainingLocations.splice(bestIndex, 1);
    }

    if (tripStops.length > 0) {
      // Calculate trip distance
      let tripDistance;
      if (distanceMatrix) {
        tripDistance = distanceMatrix[0][tripStops[0].originalIndex + 1];
        for (let i = 0; i < tripStops.length - 1; i++) {
          tripDistance += distanceMatrix[tripStops[i].originalIndex + 1][tripStops[i + 1].originalIndex + 1];
        }
        tripDistance += distanceMatrix[tripStops[tripStops.length - 1].originalIndex + 1][0];
      } else {
        tripDistance = calculateTotalDistance(tripStops, depot);
      }

      trips.push({
        tripNumber,
        stops: tripStops.map(s => ({
          lat: s.lat,
          lng: s.lng,
          volume: s.volume,
          originalIndex: s.originalIndex,
          ...(s.binId && { binId: s.binId }),
          ...(s.name && { name: s.name })
        })),
        loadM3: Math.round(currentLoad * 1000) / 1000, // cubic meters, 3 decimal places
        capacityUsed: Math.round((currentLoad / truckCapacity) * 100),
        distanceKm: Math.round(tripDistance * 100) / 100,
        stopCount: tripStops.length
      });
    }
  }

  const totalDistance = trips.reduce((sum, t) => sum + t.distanceKm, 0);
  const totalLoad = trips.reduce((sum, t) => sum + t.loadM3, 0);

  return {
    trips,
    totalTrips: trips.length,
    totalDistance: Math.round(totalDistance * 100) / 100,
    totalLoadM3: Math.round(totalLoad * 1000) / 1000, // cubic meters
    depotReturns: trips.length - 1,
    allStopsCount: locations.length
  };
}

/**
 * Estimate travel time based on distance (legacy, synchronous)
 * @param {number} distance - Distance in kilometers
 * @returns {Object} Estimated time breakdown
 */
function estimateTime(distance) {
  const averageSpeed = 25; // km/h for urban waste collection
  const travelMinutes = (distance / averageSpeed) * 60;

  return {
    travelMinutes: Math.round(travelMinutes),
    formatted: formatTime(travelMinutes)
  };
}

/**
 * Format minutes to human readable string
 * @param {number} minutes
 * @returns {string}
 */
function formatTime(minutes) {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

/**
 * Convert route path coordinates to location objects
 * @param {Array} coordinates - Array of [lng, lat] pairs (GeoJSON format)
 * @returns {Array} Array of {lat, lng, index} objects
 */
function coordinatesToLocations(coordinates) {
  return coordinates.map((coord, index) => ({
    lat: coord[1],
    lng: coord[0],
    index: index
  }));
}

/**
 * Convert location objects back to coordinates
 * @param {Array} locations - Array of {lat, lng} objects
 * @returns {Array} Array of [lng, lat] pairs (GeoJSON format)
 */
function locationsToCoordinates(locations) {
  return locations.map(loc => [loc.lng, loc.lat]);
}

/**
 * Main optimization function for routes (synchronous, backward compatible)
 * @param {Object} route - Route object with path.coordinates
 * @param {Object} options - Optimization options
 * @returns {Object} Optimization result
 */
function optimizeRoute(route, options = {}) {
  const depot = options.depot || DEFAULT_DEPOT;
  const algorithm = options.algorithm || 'nearest-neighbor';

  // Extract coordinates from route
  let coordinates = [];
  if (route.path && route.path.coordinates) {
    coordinates = route.path.coordinates;
  } else if (Array.isArray(route.locations)) {
    coordinates = route.locations.map(loc => [loc.lng, loc.lat]);
  } else if (Array.isArray(route)) {
    coordinates = route;
  }

  if (coordinates.length === 0) {
    return {
      success: false,
      error: 'No coordinates found in route'
    };
  }

  // Convert to location objects
  const locations = coordinatesToLocations(coordinates);

  // Apply optimization algorithm
  let result;
  if (algorithm === '2-opt') {
    result = twoOptImprovement(locations, depot);
  } else {
    result = nearestNeighbor(locations, depot);
  }

  // Convert back to coordinates
  const optimizedCoordinates = locationsToCoordinates(result.optimizedOrder);

  return {
    success: true,
    original: {
      coordinates,
      distance: result.originalDistance,
      estimatedTime: result.originalTime
    },
    optimized: {
      coordinates: optimizedCoordinates,
      distance: result.optimizedDistance,
      estimatedTime: result.estimatedTime
    },
    savings: {
      distance: result.distanceSaved,
      percentage: result.percentageSaved,
      time: result.originalTime.travelMinutes - result.estimatedTime.travelMinutes
    },
    depot: result.depot,
    algorithm
  };
}

/**
 * Enhanced async optimization function with OSRM support
 * @param {Object|Array} route - Route object or array of coordinates
 * @param {Object} options - Optimization options
 * @returns {Promise<Object>} Optimization result with road distances
 */
async function optimizeRouteAsync(route, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const depot = opts.depot || DEFAULT_DEPOT;
  const algorithm = opts.algorithm || '2-opt';

  // Extract coordinates from route
  let coordinates = [];
  let binVolumes = opts.binVolumes || null;

  if (route.path && route.path.coordinates) {
    coordinates = route.path.coordinates;
  } else if (Array.isArray(route.locations)) {
    coordinates = route.locations.map(loc => [loc.lng, loc.lat]);
    if (!binVolumes) {
      // Default 0.02 m³ (20 liters) per bin
      binVolumes = route.locations.map(loc => loc.volume || loc.estimatedVolume || 0.02);
    }
  } else if (Array.isArray(route)) {
    coordinates = route;
  }

  if (coordinates.length === 0) {
    return {
      success: false,
      error: 'No coordinates found in route'
    };
  }

  // Convert to location objects
  const locations = coordinatesToLocations(coordinates);

  // Calculate Haversine distances (always available as baseline)
  const originalHaversine = calculateTotalDistance(locations, depot);

  // Try to get OSRM distance matrix
  let distanceMatrix = null;
  let durationMatrix = null;
  let osrmSuccess = false;

  if (opts.useRoadDistance) {
    const allPoints = [depot, ...locations];
    const osrmResult = await osrmService.getDistanceMatrix(allPoints);

    if (osrmResult.success) {
      distanceMatrix = osrmResult.distances;
      durationMatrix = osrmResult.durations;
      osrmSuccess = true;
    }
  }

  // If OSRM failed, build Haversine matrix
  if (!distanceMatrix) {
    const allPoints = [depot, ...locations];
    distanceMatrix = buildHaversineMatrix(allPoints);
  }

  // Calculate original distance (in current order)
  let originalDistance = distanceMatrix[0][1]; // depot to first
  for (let i = 0; i < locations.length - 1; i++) {
    originalDistance += distanceMatrix[i + 1][i + 2];
  }
  originalDistance += distanceMatrix[locations.length][0]; // last to depot
  originalDistance = Math.round(originalDistance * 100) / 100;

  // Apply optimization
  let optimizationResult;
  if (opts.considerCapacity && binVolumes) {
    optimizationResult = optimizeWithCapacity(locations, {
      truckCapacity: opts.truckCapacity,
      capacityThreshold: opts.capacityThreshold,
      distanceMatrix,
      depot,
      binVolumes
    });
  } else {
    // Standard optimization
    if (algorithm === '2-opt') {
      optimizationResult = twoOptWithMatrix(locations, distanceMatrix, depot);
    } else {
      optimizationResult = nearestNeighborWithMatrix(locations, distanceMatrix, depot);
    }
  }

  // Calculate time estimates
  const numStops = locations.length;
  const avgFillLevel = 0.5; // Default, could be calculated from bins
  const timeOfDay = opts.scheduledTime || 'midday';

  const originalTime = speedProfiles.estimateRouteTime({
    distance: originalDistance,
    osrmDuration: durationMatrix ? sumOriginalDuration(durationMatrix, locations.length) : null,
    numStops,
    avgFillLevel,
    timeOfDay,
    profile: opts.speedProfile
  });

  // Build response
  if (opts.considerCapacity && optimizationResult.trips) {
    // Multi-trip response
    const trips = optimizationResult.trips.map(trip => {
      const tripTime = speedProfiles.estimateRouteTime({
        distance: trip.distanceKm,
        numStops: trip.stopCount,
        avgFillLevel,
        timeOfDay,
        profile: opts.speedProfile
      });

      return {
        ...trip,
        estimatedTime: tripTime
      };
    });

    return {
      success: true,
      useOsrm: osrmSuccess,
      algorithm,
      original: {
        coordinates,
        distance: originalDistance,
        straightLineDistance: originalHaversine,
        estimatedTime: originalTime
      },
      optimized: {
        trips,
        totalTrips: optimizationResult.totalTrips,
        totalDistance: optimizationResult.totalDistance,
        totalLoad: optimizationResult.totalLoad,
        depotReturns: optimizationResult.depotReturns
      },
      savings: {
        distance: Math.round((originalDistance - optimizationResult.totalDistance) * 100) / 100,
        percentage: originalDistance > 0
          ? Math.round(((originalDistance - optimizationResult.totalDistance) / originalDistance) * 1000) / 10
          : 0
      },
      depot,
      capacityEnabled: true,
      truckCapacity: opts.truckCapacity
    };
  } else {
    // Single route response
    const optimizedCoordinates = locationsToCoordinates(optimizationResult.optimizedOrder);
    const optimizedDistance = optimizationResult.totalDistance;

    const optimizedTime = speedProfiles.estimateRouteTime({
      distance: optimizedDistance,
      osrmDuration: durationMatrix ? sumOptimizedDuration(durationMatrix, optimizationResult.optimizedIndices) : null,
      numStops,
      avgFillLevel,
      timeOfDay,
      profile: opts.speedProfile
    });

    // Get road geometry if requested
    let geometry = null;
    if (opts.includeGeometry && osrmSuccess) {
      const routeResult = await osrmService.getRouteWithDirections([
        depot,
        ...optimizationResult.optimizedOrder
      ]);
      if (routeResult.success) {
        geometry = routeResult.geometry;
      }
    }

    return {
      success: true,
      usedOsrm: osrmSuccess,
      algorithm,
      original: {
        coordinates,
        distance: originalDistance,
        straightLineDistance: originalHaversine,
        estimatedTime: originalTime
      },
      optimized: {
        coordinates: optimizedCoordinates,
        distance: optimizedDistance,
        straightLineDistance: calculateTotalDistance(optimizationResult.optimizedOrder, depot),
        estimatedTime: optimizedTime,
        ...(geometry && { geometry })
      },
      savings: {
        distance: Math.round((originalDistance - optimizedDistance) * 100) / 100,
        percentage: originalDistance > 0
          ? Math.round(((originalDistance - optimizedDistance) / originalDistance) * 1000) / 10
          : 0,
        time: originalTime.totalMinutes - optimizedTime.totalMinutes
      },
      depot,
      iterations: optimizationResult.iterations
    };
  }
}

/**
 * Helper: Sum duration for original route order
 */
function sumOriginalDuration(durationMatrix, count) {
  let total = durationMatrix[0][1]; // depot to first
  for (let i = 0; i < count - 1; i++) {
    total += durationMatrix[i + 1][i + 2];
  }
  total += durationMatrix[count][0]; // last to depot
  return total;
}

/**
 * Helper: Sum duration for optimized route order
 */
function sumOptimizedDuration(durationMatrix, indices) {
  if (indices.length === 0) return 0;
  let total = durationMatrix[0][indices[0] + 1]; // depot to first
  for (let i = 0; i < indices.length - 1; i++) {
    total += durationMatrix[indices[i] + 1][indices[i + 1] + 1];
  }
  total += durationMatrix[indices[indices.length - 1] + 1][0]; // last to depot
  return total;
}

/**
 * Get optimization suggestions for a route
 * @param {Object} route - Route object
 * @returns {Object} Suggestions
 */
function getRouteSuggestions(route) {
  const result = optimizeRoute(route, { algorithm: '2-opt' });

  if (!result.success) {
    return result;
  }

  const suggestions = [];

  if (result.savings.percentage > 5) {
    suggestions.push({
      type: 'optimization',
      priority: 'high',
      message: `Route can be optimized to save ${result.savings.distance.toFixed(2)} km (${result.savings.percentage}%)`,
      action: 'apply_optimization'
    });
  }

  if (result.optimized.distance > 20) {
    suggestions.push({
      type: 'distance',
      priority: 'info',
      message: `Route is ${result.optimized.distance.toFixed(2)} km long. Consider splitting into multiple routes.`,
      action: 'split_route'
    });
  }

  return {
    success: true,
    suggestions,
    optimization: result
  };
}

/**
 * Get async optimization suggestions with OSRM
 * @param {Object} route - Route object
 * @param {Object} options - Options
 * @returns {Promise<Object>} Suggestions with road-based analysis
 */
async function getRouteSuggestionsAsync(route, options = {}) {
  const result = await optimizeRouteAsync(route, {
    ...options,
    algorithm: '2-opt'
  });

  if (!result.success) {
    return result;
  }

  const suggestions = [];

  if (result.savings.percentage > 5) {
    suggestions.push({
      type: 'optimization',
      priority: 'high',
      message: `Route can be optimized to save ${result.savings.distance.toFixed(2)} km (${result.savings.percentage}%)`,
      action: 'apply_optimization'
    });
  }

  const totalDistance = result.optimized.totalDistance || result.optimized.distance;

  if (totalDistance > 20) {
    suggestions.push({
      type: 'distance',
      priority: 'info',
      message: `Route is ${totalDistance.toFixed(2)} km long. Consider splitting into multiple routes.`,
      action: 'split_route'
    });
  }

  if (result.optimized.trips && result.optimized.trips.length > 1) {
    suggestions.push({
      type: 'capacity',
      priority: 'info',
      message: `Route requires ${result.optimized.trips.length} trips due to capacity constraints.`,
      action: 'review_capacity'
    });
  }

  return {
    success: true,
    suggestions,
    optimization: result
  };
}

module.exports = {
  // Constants
  DEFAULT_DEPOT,
  DEFAULT_OPTIONS,

  // Core distance functions
  haversineDistance,
  calculateTotalDistance,
  buildHaversineMatrix,

  // Synchronous optimization (backward compatible)
  nearestNeighbor,
  twoOptImprovement,
  optimizeRoute,
  getRouteSuggestions,

  // Async optimization with OSRM
  optimizeRouteAsync,
  getRouteSuggestionsAsync,
  optimizeWithCapacity,

  // Utilities
  coordinatesToLocations,
  locationsToCoordinates,
  estimateTime,
  formatTime,

  // Re-export services for convenience
  speedProfiles,
  osrmService
};
