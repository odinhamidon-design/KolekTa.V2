const express = require('express');
const router = express.Router();
const Route = require('../models/Route');
const Bin = require('../models/Bin');

// Get all routes
router.get('/', async (req, res) => {
  try {
    const routes = await Route.find().populate('bins');
    res.json(routes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single route
router.get('/:id', async (req, res) => {
  try {
    const route = await Route.findById(req.params.id).populate('bins');
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }
    res.json(route);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new route
router.post('/', async (req, res) => {
  try {
    const route = new Route(req.body);
    await route.save();
    res.status(201).json(route);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update route (assign driver, change status)
router.put('/:id', async (req, res) => {
  try {
    const route = await Route.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }
    res.json(route);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete route
router.delete('/:id', async (req, res) => {
  try {
    const route = await Route.findByIdAndDelete(req.params.id);
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }
    res.json({ message: 'Route deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create optimized route
router.post('/optimize', async (req, res) => {
  try {
    const { binIds, startPoint } = req.body;
    const bins = await Bin.find({ _id: { $in: binIds } });
    
    // Simple nearest neighbor optimization
    const optimizedPath = nearestNeighborTSP(startPoint, bins);
    
    const route = new Route({
      routeId: `ROUTE-${Date.now()}`,
      bins: optimizedPath.map(b => b._id),
      path: {
        coordinates: optimizedPath.map(b => b.location.coordinates)
      },
      distance: calculateTotalDistance(optimizedPath),
      status: 'planned'
    });
    
    await route.save();
    res.status(201).json(route);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Helper: Nearest Neighbor TSP
function nearestNeighborTSP(start, bins) {
  const unvisited = [...bins];
  const path = [];
  let current = start;
  
  while (unvisited.length > 0) {
    let nearest = null;
    let minDist = Infinity;
    
    unvisited.forEach(bin => {
      const dist = haversineDistance(current, bin.location.coordinates);
      if (dist < minDist) {
        minDist = dist;
        nearest = bin;
      }
    });
    
    path.push(nearest);
    current = nearest.location.coordinates;
    unvisited.splice(unvisited.indexOf(nearest), 1);
  }
  
  return path;
}

// Helper: Calculate distance
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

function calculateTotalDistance(bins) {
  let total = 0;
  for (let i = 0; i < bins.length - 1; i++) {
    total += haversineDistance(bins[i].location.coordinates, bins[i+1].location.coordinates);
  }
  return total;
}

module.exports = router;
