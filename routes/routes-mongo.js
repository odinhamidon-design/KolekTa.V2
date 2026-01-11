const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const connectDB = require('../lib/mongodb');
const Route = require('../models/Route');

// Helper function to check and update route expiration
async function checkRouteExpiration(route) {
  if (route.expiresAt && !route.isExpired) {
    const expiresAt = new Date(route.expiresAt);
    if (new Date() > expiresAt) {
      route.isExpired = true;
      await route.save();
    }
  }
  return route;
}

// Get all routes
// Use ?includePhotos=true to include completion photos (default: false for performance)
router.get('/', authenticateToken, async (req, res) => {
  try {
    await connectDB();
    const includePhotos = req.query.includePhotos === 'true';

    let routes;
    if (includePhotos) {
      routes = await Route.find({});
    } else {
      // Exclude completionPhotos by default to improve performance
      routes = await Route.find({}).select('-completionPhotos');
    }

    // Check and update expiration for each route
    const now = new Date();
    const expiredRouteIds = [];
    routes = routes.map(route => {
      if (route.expiresAt && !route.isExpired && new Date(route.expiresAt) < now) {
        route.isExpired = true;
        expiredRouteIds.push(route._id);
      }
      return route;
    });

    // Bulk update expired routes in background
    if (expiredRouteIds.length > 0) {
      Route.updateMany(
        { _id: { $in: expiredRouteIds } },
        { $set: { isExpired: true } }
      ).exec();
    }

    res.json(routes);
  } catch (error) {
    console.error('Error getting routes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single route
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    await connectDB();
    console.log('Looking for route:', req.params.id);
    const route = await Route.findOne({
      $or: [
        { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null },
        { routeId: req.params.id }
      ]
    });

    if (!route) {
      console.log('Route not found:', req.params.id);
      return res.status(404).json({ error: 'Route not found' });
    }

    // Check and update expiration
    await checkRouteExpiration(route);

    console.log('Found route:', route.routeId);
    res.json(route);
  } catch (error) {
    console.error('Error getting route:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new route
router.post('/', authenticateToken, async (req, res) => {
  try {
    await connectDB();
    const { routeId, name, path, status, notes, expiresAt } = req.body;

    // Check if routeId exists
    const existingRoute = await Route.findOne({ routeId });
    if (existingRoute) {
      return res.status(400).json({ error: 'Route ID already exists' });
    }

    const newRoute = new Route({
      routeId: routeId || `ROUTE-${Date.now()}`,
      name,
      path,
      distance: calculateDistance(path?.coordinates || []),
      status: status || 'planned',
      notes: notes || '',
      expiresAt: expiresAt || null,
      isExpired: false
    });

    await newRoute.save();
    console.log('✅ Route created in MongoDB:', newRoute.routeId);
    res.status(201).json(newRoute);
  } catch (error) {
    console.error('Error creating route:', error);
    res.status(400).json({ error: error.message });
  }
});

// Update route
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    await connectDB();
    const route = await Route.findOne({
      $or: [
        { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null },
        { routeId: req.params.id }
      ]
    });

    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    const { assignedDriver, status, name, notes, completedAt, completedBy, completionNotes, completionPhotos, notificationSent, expiresAt, isExpired } = req.body;

    if (assignedDriver !== undefined) route.assignedDriver = assignedDriver;
    if (status) route.status = status;
    if (name) route.name = name;
    if (notes !== undefined) route.notes = notes;
    if (completedAt !== undefined) route.completedAt = completedAt;
    if (completedBy !== undefined) route.completedBy = completedBy;
    if (completionNotes !== undefined) route.completionNotes = completionNotes;
    if (completionPhotos !== undefined) route.completionPhotos = completionPhotos;
    if (notificationSent !== undefined) route.notificationSent = notificationSent;
    if (expiresAt !== undefined) route.expiresAt = expiresAt;
    if (isExpired !== undefined) route.isExpired = isExpired;

    await route.save();
    console.log('✅ Route updated in MongoDB:', route.routeId);
    res.json(route);
  } catch (error) {
    console.error('Error updating route:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete route
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await connectDB();
    console.log('Delete route request for ID:', req.params.id);
    
    const route = await Route.findOne({
      $or: [
        { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null },
        { routeId: req.params.id }
      ]
    });
    
    if (!route) {
      console.log('Route not found:', req.params.id);
      return res.status(404).json({ error: 'Route not found' });
    }
    
    await Route.deleteOne({ _id: route._id });
    console.log('✅ Route deleted from MongoDB:', route.routeId);
    res.json({ message: 'Route deleted successfully' });
  } catch (error) {
    console.error('Error deleting route:', error);
    res.status(500).json({ error: error.message });
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
  const R = 6371e3;
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
