const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { routesStorage, initialize } = require('../data/storage');
const logger = require('../lib/logger');

// Ensure storage is initialized on each request (for Vercel serverless)
initialize();

// Mock routes storage (for reference only - now using persistent storage)
const defaultRoutes = [
  {
    _id: '1',
    routeId: 'ROUTE-001',
    name: 'Downtown Collection Route',
    path: {
      type: 'LineString',
      coordinates: [
        [126.2185, 6.9549],
        [126.2200, 6.9560],
        [126.2170, 6.9570]
      ]
    },
    distance: 2500,
    status: 'planned',
    notes: 'Main downtown area collection'
  }
];

// Get all routes
router.get('/', authenticateToken, async (req, res) => {
  try {
    const routes = routesStorage.getAll();
    res.json(routes);
  } catch (error) {
    logger.error('Error:', error);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// Get single route
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    logger.debug('Looking for route with ID:', req.params.id);
    const allRoutes = routesStorage.getAll();
    logger.debug('All routes:', allRoutes.map(r => ({ _id: r._id, routeId: r.routeId })));

    const route = routesStorage.findById(req.params.id);
    if (!route) {
      logger.debug('Route not found for ID:', req.params.id);
      return res.status(404).json({ error: 'Route not found' });
    }
    logger.debug('Found route:', route.routeId, route.name);
    res.json(route);
  } catch (error) {
    logger.error('Error getting route:', error);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// Create new route
router.post('/', authenticateToken, async (req, res) => {
  try {
    const newRoute = {
      _id: String(Date.now()),
      routeId: req.body.routeId,
      name: req.body.name,
      path: req.body.path,
      distance: calculateDistance(req.body.path.coordinates),
      status: req.body.status || 'planned',
      notes: req.body.notes || ''
    };
    
    routesStorage.add(newRoute);
    res.status(201).json(newRoute);
  } catch (error) {
    logger.error('Error creating route:', error);
    res.status(400).json({ error: 'Failed to create route' });
  }
});

// Update route
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const route = routesStorage.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    // Update fields
    const updates = {};
    if (req.body.assignedDriver !== undefined) updates.assignedDriver = req.body.assignedDriver;
    if (req.body.status) updates.status = req.body.status;
    if (req.body.name) updates.name = req.body.name;
    if (req.body.notes !== undefined) updates.notes = req.body.notes;

    routesStorage.update(route._id, updates);
    const updatedRoute = routesStorage.findById(route._id);
    res.json(updatedRoute);
  } catch (error) {
    logger.error('Error updating route:', error);
    res.status(400).json({ error: 'Failed to update route' });
  }
});

// Delete route
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    logger.debug('Delete route request for ID:', req.params.id);
    const route = routesStorage.findById(req.params.id);
    if (!route) {
      logger.debug('Route not found:', req.params.id);
      return res.status(404).json({ error: 'Route not found' });
    }
    logger.debug('Deleting route:', route);
    const deleted = routesStorage.delete(route._id);
    logger.debug('Delete result:', deleted);
    res.json({ message: 'Route deleted successfully' });
  } catch (error) {
    logger.error('Error deleting route:', error);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// Helper function to calculate distance
function calculateDistance(coordinates) {
  if (!coordinates || coordinates.length < 2) return 0;
  
  let total = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    total += haversineDistance(coordinates[i], coordinates[i + 1]);
  }
  return total;
}

function haversineDistance(coord1, coord2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = coord1[1] * Math.PI / 180;
  const φ2 = coord2[1] * Math.PI / 180;
  const Δφ = (coord2[1] - coord1[1]) * Math.PI / 180;
  const Δλ = (coord2[0] - coord1[0]) * Math.PI / 180;
  
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c;
}

module.exports = router;
