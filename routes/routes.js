const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { routesStorage } = require('../data/storage');
const routeOptimizer = require('../lib/routeOptimizer');
const logger = require('../lib/logger');

// Helper function to check and update route expiration
function checkRouteExpiration(route) {
  if (route.expiresAt && !route.isExpired) {
    const expiresAt = new Date(route.expiresAt);
    if (new Date() > expiresAt) {
      route.isExpired = true;
      routesStorage.update(route._id || route.routeId, { isExpired: true });
    }
  }
  return route;
}

// Get all routes
router.get('/', async (req, res) => {
  try {
    let routes = routesStorage.getAll();
    // Check expiration for each route
    routes = routes.map(checkRouteExpiration);
    res.json(routes);
  } catch (error) {
    logger.error('Error:', error);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// Get single route
router.get('/:id', async (req, res) => {
  try {
    let route = routesStorage.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }
    // Check expiration
    route = checkRouteExpiration(route);
    res.json(route);
  } catch (error) {
    logger.error('Error:', error);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// Create new route
router.post('/', async (req, res) => {
  try {
    const route = {
      _id: `route-${Date.now()}`,
      routeId: req.body.routeId || `ROUTE-${Date.now()}`,
      ...req.body,
      createdAt: new Date()
    };
    routesStorage.add(route);
    res.status(201).json(route);
  } catch (error) {
    logger.error('Route operation error:', error);
    res.status(400).json({ error: 'Operation failed' });
  }
});

// Update route
router.put('/:id', async (req, res) => {
  try {
    const success = routesStorage.update(req.params.id, req.body);
    if (!success) {
      return res.status(404).json({ error: 'Route not found' });
    }
    const route = routesStorage.findById(req.params.id);
    res.json(route);
  } catch (error) {
    logger.error('Route operation error:', error);
    res.status(400).json({ error: 'Operation failed' });
  }
});

// Delete route
router.delete('/:id', async (req, res) => {
  try {
    const success = routesStorage.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Route not found' });
    }
    res.json({ message: 'Route deleted successfully' });
  } catch (error) {
    logger.error('Error:', error);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// Optimize coordinates (without saving) - Enhanced with OSRM support
router.post('/optimize', authenticateToken, async (req, res) => {
  try {
    const {
      coordinates,
      depot,
      algorithm,
      // New parameters for enhanced optimization
      useRoadDistance = true,
      considerCapacity = false,
      truckCapacity = 1000,
      binWeights = null,
      scheduledTime = null,
      speedProfile = 'urban_collection',
      includeGeometry = false
    } = req.body;

    if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2) {
      return res.status(400).json({
        error: 'At least 2 coordinates required for optimization',
        hint: 'Send coordinates as array of [lng, lat] pairs'
      });
    }

    // Use async optimization if OSRM or capacity is enabled
    if (useRoadDistance || considerCapacity) {
      const result = await routeOptimizer.optimizeRouteAsync(coordinates, {
        depot: depot || routeOptimizer.DEFAULT_DEPOT,
        algorithm: algorithm || '2-opt',
        useRoadDistance,
        considerCapacity,
        truckCapacity,
        binWeights,
        scheduledTime,
        speedProfile,
        includeGeometry
      });

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.json(result);
    }

    // Fallback to synchronous optimization (backward compatible)
    const result = routeOptimizer.optimizeRoute(coordinates, {
      depot: depot || routeOptimizer.DEFAULT_DEPOT,
      algorithm: algorithm || 'nearest-neighbor'
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result);
  } catch (error) {
    logger.error('Route operation error:', error);
    res.status(400).json({ error: 'Operation failed' });
  }
});

// Optimize existing route by ID - Enhanced with OSRM support
router.post('/:id/optimize', authenticateToken, async (req, res) => {
  try {
    const route = routesStorage.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    const {
      algorithm,
      depot,
      apply,
      // New parameters
      useRoadDistance = true,
      considerCapacity = false,
      truckCapacity = 10, // Default 10 cubic meters (m³)
      binVolumes = null,
      scheduledTime = null,
      speedProfile = 'urban_collection',
      includeGeometry = false
    } = req.body;

    // Get coordinates from route
    let coordinates = [];
    let volumes = binVolumes;

    if (route.path && route.path.coordinates) {
      coordinates = route.path.coordinates;
    } else if (route.locations && Array.isArray(route.locations)) {
      coordinates = route.locations.map(loc => [loc.lng, loc.lat]);
      // Extract volumes from locations if available (default 0.02 m³ = 20 liters per bin)
      if (!volumes) {
        volumes = route.locations.map(loc => loc.volume || loc.estimatedVolume || 0.02);
      }
    }

    if (coordinates.length < 2) {
      return res.status(400).json({
        error: 'Route needs at least 2 points to optimize'
      });
    }

    // Use async optimization if OSRM or capacity is enabled
    let result;
    if (useRoadDistance || considerCapacity) {
      result = await routeOptimizer.optimizeRouteAsync(coordinates, {
        depot: depot || routeOptimizer.DEFAULT_DEPOT,
        algorithm: algorithm || '2-opt',
        useRoadDistance,
        considerCapacity,
        truckCapacity,
        binVolumes: volumes,
        scheduledTime,
        speedProfile,
        includeGeometry
      });
    } else {
      result = routeOptimizer.optimizeRoute(coordinates, {
        depot: depot || routeOptimizer.DEFAULT_DEPOT,
        algorithm: algorithm || '2-opt'
      });
    }

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    // If apply=true, update the route with optimized coordinates
    if (apply === true) {
      // Handle multi-trip results (capacity-aware)
      if (result.optimized.trips) {
        // For capacity-aware optimization, we store trip info
        const updatedRoute = {
          ...route,
          optimizedAt: new Date(),
          optimization: {
            algorithm: result.algorithm,
            usedOsrm: result.usedOsrm,
            originalDistance: result.original.distance,
            optimizedDistance: result.optimized.totalDistance,
            distanceSaved: result.savings.distance,
            percentageSaved: result.savings.percentage,
            trips: result.optimized.trips,
            totalTrips: result.optimized.totalTrips,
            capacityEnabled: true,
            truckCapacity: result.truckCapacity
          }
        };

        routesStorage.update(req.params.id, updatedRoute);

        return res.json({
          success: true,
          applied: true,
          route: routesStorage.findById(req.params.id),
          optimization: result
        });
      }

      // Single route optimization
      const updatedRoute = {
        ...route,
        path: {
          ...route.path,
          coordinates: result.optimized.coordinates
        },
        distance: result.optimized.distance,
        estimatedTime: result.optimized.estimatedTime.totalMinutes,
        optimizedAt: new Date(),
        optimization: {
          algorithm: result.algorithm,
          usedOsrm: result.usedOsrm || false,
          originalDistance: result.original.distance,
          straightLineDistance: result.original.straightLineDistance,
          optimizedDistance: result.optimized.distance,
          distanceSaved: result.savings.distance,
          percentageSaved: result.savings.percentage,
          timeSaved: result.savings.time
        }
      };

      routesStorage.update(req.params.id, updatedRoute);

      return res.json({
        success: true,
        applied: true,
        route: routesStorage.findById(req.params.id),
        optimization: result
      });
    }

    // Just return the optimization result without applying
    res.json({
      success: true,
      applied: false,
      routeId: route._id,
      optimization: result
    });
  } catch (error) {
    logger.error('Route operation error:', error);
    res.status(400).json({ error: 'Operation failed' });
  }
});

// Get route optimization suggestions - Enhanced with OSRM
router.get('/:id/suggestions', async (req, res) => {
  try {
    const route = routesStorage.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    const useRoadDistance = req.query.useRoadDistance !== 'false';

    if (useRoadDistance) {
      const result = await routeOptimizer.getRouteSuggestionsAsync(route, {
        useRoadDistance: true
      });
      return res.json(result);
    }

    const result = routeOptimizer.getRouteSuggestions(route);
    res.json(result);
  } catch (error) {
    logger.error('Route operation error:', error);
    res.status(400).json({ error: 'Operation failed' });
  }
});

// Get depot info
router.get('/config/depot', authenticateToken, async (req, res) => {
  res.json({
    depot: routeOptimizer.DEFAULT_DEPOT,
    description: 'Central depot location for route optimization'
  });
});

// Get available speed profiles
router.get('/config/speed-profiles', authenticateToken, async (req, res) => {
  res.json({
    profiles: routeOptimizer.speedProfiles.getProfiles(),
    description: 'Available speed profiles for time estimation'
  });
});

// Get optimization options/capabilities
router.get('/config/options', authenticateToken, async (req, res) => {
  res.json({
    defaultOptions: routeOptimizer.DEFAULT_OPTIONS,
    algorithms: ['nearest-neighbor', '2-opt'],
    features: {
      osrmIntegration: true,
      capacityConstraints: true,
      dynamicSpeedEstimation: true,
      roadGeometry: true
    },
    description: 'Available optimization options and capabilities'
  });
});

module.exports = router;
