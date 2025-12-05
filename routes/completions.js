const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticateToken } = require('../middleware/auth');
const { routesStorage, trucksStorage } = require('../data/storage');

// MongoDB support
const useMockAuth = process.env.USE_MOCK_AUTH === 'true';
let Route, Truck;
if (!useMockAuth) {
  Route = require('../models/Route');
  Truck = require('../models/Truck');
}


// Fuel calculation algorithm
function calculateFuelConsumption(distance, averageSpeed, stopsCompleted, baseRate = 25) {
  let speedFactor = 1.0;
  if (averageSpeed < 30) speedFactor = 1.3;
  else if (averageSpeed < 50) speedFactor = 1.1;
  else if (averageSpeed <= 70) speedFactor = 1.0;
  else if (averageSpeed <= 90) speedFactor = 1.15;
  else speedFactor = 1.3;

  const loadFactor = 1.15; // Assume moderate load for waste collection
  const stopConsumption = (stopsCompleted || 0) * 0.05;
  const distanceConsumption = (distance / 100) * baseRate * speedFactor * loadFactor;

  return Math.round((distanceConsumption + stopConsumption) * 100) / 100;
}

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Complete route with photos
router.post('/:routeId/complete', authenticateToken, upload.array('photos', 10), async (req, res) => {
  try {
    const { routeId } = req.params;
    const { notes, distanceTraveled, fuelConsumed, stopsCompleted, averageSpeed } = req.body;

    console.log('Completing route:', routeId);
    console.log('Trip data:', { distanceTraveled, fuelConsumed, stopsCompleted, averageSpeed });

    // Convert uploaded files to base64 data URLs
    const photos = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const base64 = file.buffer.toString('base64');
        const dataUrl = `data:${file.mimetype};base64,${base64}`;
        photos.push(dataUrl);
      }
    }

    // Trip stats from GPS tracking
    const tripStats = {
      distanceTraveled: parseFloat(distanceTraveled) || 0,
      fuelConsumed: parseFloat(fuelConsumed) || 0,
      stopsCompleted: parseInt(stopsCompleted) || 0,
      averageSpeed: parseFloat(averageSpeed) || 0
    };

    if (!useMockAuth && Route) {
      // MongoDB mode
      const route = await Route.findOne({ $or: [{ _id: routeId }, { routeId: routeId }] });

      if (!route) {
        return res.status(404).json({ error: 'Route not found' });
      }

      if (route.assignedDriver !== req.user.username) {
        return res.status(403).json({ error: 'You are not assigned to this route' });
      }

      // Calculate fuel if not provided or use GPS data
      let calculatedFuel = tripStats.fuelConsumed;
      if (tripStats.distanceTraveled > 0 && (!calculatedFuel || calculatedFuel === 0)) {
        calculatedFuel = calculateFuelConsumption(
          tripStats.distanceTraveled,
          tripStats.averageSpeed || 30,
          tripStats.stopsCompleted || 0
        );
        tripStats.fuelConsumed = calculatedFuel;
      }

      route.status = 'completed';
      route.completedAt = new Date();
      route.completedBy = req.user.username;
      route.completionNotes = notes || '';
      route.completionPhotos = photos;
      route.notificationSent = false;
      route.tripStats = tripStats;

      await route.save();

      // Auto-deduct fuel from truck and log consumption
      let fuelLogResult = null;
      if (route.assignedVehicle && tripStats.distanceTraveled > 0 && calculatedFuel > 0) {
        try {
          const truck = await Truck.findOne({ truckId: route.assignedVehicle });
          if (truck) {
            const tankCapacity = truck.fuelTankCapacity || 60;
            const fuelLevelBefore = truck.fuelLevel || 50;
            const currentLiters = (fuelLevelBefore / 100) * tankCapacity;
            const newLiters = Math.max(currentLiters - calculatedFuel, 0);
            const fuelLevelAfter = Math.round((newLiters / tankCapacity) * 100);

            // Update truck fuel level and stats
            truck.fuelLevel = fuelLevelAfter;
            truck.totalFuelConsumed = (truck.totalFuelConsumed || 0) + calculatedFuel;
            truck.mileage = (truck.mileage || 0) + tripStats.distanceTraveled;
            await truck.save();

            fuelLogResult = {
              truckId: truck.truckId,
              fuelLevelBefore,
              fuelLevelAfter,
              litersConsumed: calculatedFuel,
              distanceTraveled: tripStats.distanceTraveled
            };

            console.log('Auto fuel deduction (MongoDB):', fuelLogResult);
          }
        } catch (fuelError) {
          console.error('Error auto-deducting fuel:', fuelError);
        }
      }

      console.log('Route completed successfully (MongoDB):', routeId);

      res.json({
        message: 'Route marked as completed successfully!',
        route: {
          _id: route._id,
          routeId: route.routeId,
          name: route.name,
          status: route.status,
          completedAt: route.completedAt,
          completedBy: route.completedBy,
          completionNotes: route.completionNotes,
          photosCount: photos.length,
          tripStats: tripStats
        },
        fuelLog: fuelLogResult
      });
    } else {
      // JSON storage mode
      const routes = routesStorage.getAll();
      const routeIndex = routes.findIndex(r => r._id === routeId || r.routeId === routeId);

      if (routeIndex === -1) {
        return res.status(404).json({ error: 'Route not found' });
      }

      const route = routes[routeIndex];

      if (route.assignedDriver !== req.user.username) {
        return res.status(403).json({ error: 'You are not assigned to this route' });
      }

      // Calculate fuel if not provided or use GPS data
      let calculatedFuel = tripStats.fuelConsumed;
      if (tripStats.distanceTraveled > 0 && (!calculatedFuel || calculatedFuel === 0)) {
        calculatedFuel = calculateFuelConsumption(
          tripStats.distanceTraveled,
          tripStats.averageSpeed || 30,
          tripStats.stopsCompleted || 0
        );
        tripStats.fuelConsumed = calculatedFuel;
      }

      routes[routeIndex] = {
        ...route,
        status: 'completed',
        completedAt: new Date(),
        completedBy: req.user.username,
        completionNotes: notes || '',
        completionPhotos: photos,
        notificationSent: false,
        tripStats: tripStats
      };

      routesStorage.save(routes);

      // Auto-deduct fuel from truck and log consumption (JSON mode)
      let fuelLogResult = null;
      if (route.assignedVehicle && tripStats.distanceTraveled > 0 && calculatedFuel > 0) {
        try {
          const trucks = trucksStorage.getAll();
          const truckIndex = trucks.findIndex(t => t.truckId === route.assignedVehicle);

          if (truckIndex !== -1) {
            const truck = trucks[truckIndex];
            const tankCapacity = truck.fuelTankCapacity || 60;
            const fuelLevelBefore = truck.fuelLevel || 50;
            const currentLiters = (fuelLevelBefore / 100) * tankCapacity;
            const newLiters = Math.max(currentLiters - calculatedFuel, 0);
            const fuelLevelAfter = Math.round((newLiters / tankCapacity) * 100);

            // Update truck fuel level and stats
            trucks[truckIndex] = {
              ...truck,
              fuelLevel: fuelLevelAfter,
              totalFuelConsumed: (truck.totalFuelConsumed || 0) + calculatedFuel,
              mileage: (truck.mileage || 0) + tripStats.distanceTraveled
            };
            trucksStorage.save(trucks);

            fuelLogResult = {
              truckId: truck.truckId,
              fuelLevelBefore,
              fuelLevelAfter,
              litersConsumed: calculatedFuel,
              distanceTraveled: tripStats.distanceTraveled
            };

            console.log('Auto fuel deduction (JSON):', fuelLogResult);
          }
        } catch (fuelError) {
          console.error('Error auto-deducting fuel:', fuelError);
        }
      }

      console.log('Route completed successfully (JSON):', routeId);

      res.json({
        message: 'Route marked as completed successfully!',
        route: {
          _id: routes[routeIndex]._id,
          routeId: routes[routeIndex].routeId,
          name: routes[routeIndex].name,
          status: routes[routeIndex].status,
          completedAt: routes[routeIndex].completedAt,
          completedBy: routes[routeIndex].completedBy,
          completionNotes: routes[routeIndex].completionNotes,
          photosCount: photos.length,
          tripStats: tripStats
        },
        fuelLog: fuelLogResult
      });
    }
  } catch (error) {
    console.error('Error completing route:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get completion details
router.get('/:routeId/completion', authenticateToken, async (req, res) => {
  try {
    const { routeId } = req.params;
    let route;

    if (!useMockAuth && Route) {
      route = await Route.findOne({ $or: [{ _id: routeId }, { routeId: routeId }] });
    } else {
      const routes = routesStorage.getAll();
      route = routes.find(r => r._id === routeId || r.routeId === routeId);
    }

    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    if (!route.completedAt) {
      return res.status(404).json({ error: 'Route not completed yet' });
    }

    res.json({
      completedAt: route.completedAt,
      completedBy: route.completedBy,
      completionNotes: route.completionNotes,
      completionPhotos: route.completionPhotos || [],
      tripStats: route.tripStats || null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pending notifications (for admin)
router.get('/notifications/pending', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    let pendingNotifications;

    if (!useMockAuth && Route) {
      const routes = await Route.find({
        status: 'completed',
        completedAt: { $exists: true },
        notificationSent: { $ne: true }
      }).select('-completionPhotos').lean();
      pendingNotifications = routes;
    } else {
      const routes = routesStorage.getAll();
      pendingNotifications = routes.filter(r =>
        r.status === 'completed' &&
        r.completedAt &&
        !r.notificationSent
      ).map(r => ({
        ...r,
        completionPhotos: undefined
      }));
    }

    console.log('Pending notifications found:', pendingNotifications.length);
    res.json(pendingNotifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single route with full details
router.get('/:routeId', authenticateToken, async (req, res) => {
  try {
    const { routeId } = req.params;
    let route;

    if (!useMockAuth && Route) {
      route = await Route.findOne({ $or: [{ _id: routeId }, { routeId: routeId }] });
    } else {
      const routes = routesStorage.getAll();
      route = routes.find(r => r._id === routeId || r.routeId === routeId);
    }

    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    res.json(route);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
router.post('/notifications/:routeId/read', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { routeId } = req.params;

    if (!useMockAuth && Route) {
      await Route.updateOne(
        { $or: [{ _id: routeId }, { routeId: routeId }] },
        { $set: { notificationSent: true } }
      );
    } else {
      const routes = routesStorage.getAll();
      const routeIndex = routes.findIndex(r => r._id === routeId || r.routeId === routeId);

      if (routeIndex !== -1) {
        routes[routeIndex].notificationSent = true;
        routesStorage.save(routes);
      }
    }

    console.log('Notification marked as read:', routeId);
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
