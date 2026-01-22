const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const connectDB = require('../lib/mongodb');
const User = require('../models/User');
const Truck = require('../models/Truck');
const Route = require('../models/Route');
const LiveLocation = require('../models/LiveLocation');
const TripData = require('../models/TripData');

// Haversine distance calculation (in km)
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Update driver location
router.post('/update', authenticateToken, async (req, res) => {
  try {
    const { lat, lng, routeId, speed, heading } = req.body;
    const username = req.user.username;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    const parsedSpeed = parseFloat(speed) || 0;

    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    // Connect to MongoDB
    await connectDB();

    // Save to MongoDB LiveLocation collection (upsert by username)
    await LiveLocation.findOneAndUpdate(
      { username },
      {
        username,
        lat: parsedLat,
        lng: parsedLng,
        routeId: routeId || null,
        speed: parsedSpeed,
        heading: heading || 0,
        timestamp: new Date(),
        lastUpdate: new Date()
      },
      { upsert: true, new: true }
    );

    // Get or create trip data from MongoDB
    let trip = await TripData.findOne({ username, isActive: true });
    if (!trip) {
      trip = new TripData({
        username,
        startTime: new Date(),
        isActive: true,
        routeId: routeId || null
      });
    }

    // Calculate distance
    if (trip.lastLocation && trip.lastLocation.lat && trip.lastLocation.lng) {
      const distance = haversineDistance(
        trip.lastLocation.lat, trip.lastLocation.lng,
        parsedLat, parsedLng
      );
      if (distance < 1) trip.totalDistance += distance;

      const timeDiff = Date.now() - (trip.lastUpdateTime ? trip.lastUpdateTime.getTime() : Date.now());
      if (parsedSpeed < 3 && trip.lastSpeed >= 3) trip.stopCount++;
      if (parsedSpeed < 5) trip.idleTimeMs += timeDiff;
    }

    trip.lastLocation = { lat: parsedLat, lng: parsedLng };
    trip.lastUpdateTime = new Date();
    trip.lastSpeed = parsedSpeed;
    if (parsedSpeed > 0) {
      trip.speedSamples.push(parsedSpeed);
      if (trip.speedSamples.length > 100) trip.speedSamples.shift();
    }

    // Calculate fuel estimate
    const avgSpeed = trip.speedSamples.length > 0
      ? trip.speedSamples.reduce((a, b) => a + b, 0) / trip.speedSamples.length
      : 30;
    let speedFactor = avgSpeed < 30 ? 1.3 : avgSpeed < 50 ? 1.1 : 1.0;
    const baseFuel = (trip.totalDistance / 100) * 25 * speedFactor * 1.09;
    const stopFuel = trip.stopCount * 0.05;
    const idleFuel = (trip.idleTimeMs / 3600000) * 2.5;
    trip.fuelEstimate = Math.round((baseFuel + stopFuel + idleFuel) * 100) / 100;

    // Save trip data to MongoDB
    await trip.save();

    console.log(`📍 GPS Update from ${username}: ${parsedLat}, ${parsedLng} | Distance: ${trip.totalDistance.toFixed(2)}km`);

    res.json({
      message: 'Location updated',
      location: { lat: parsedLat, lng: parsedLng },
      savedAt: new Date().toISOString(),
      trip: {
        distance: Math.round(trip.totalDistance * 100) / 100,
        fuelEstimate: trip.fuelEstimate,
        stops: trip.stopCount
      }
    });
  } catch (error) {
    console.error('❌ Error updating location:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get all active driver locations (Admin only)
router.get('/active', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    await connectDB();

    // Get locations updated within last 5 minutes from MongoDB
    const fiveMinutesAgo = new Date(Date.now() - (5 * 60 * 1000));
    const locations = await LiveLocation.find({
      lastUpdate: { $gte: fiveMinutesAgo }
    }).lean();

    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get ALL assigned trucks (with last known or default location) - MongoDB version
router.get('/all-trucks', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    await connectDB();

    // Use lean() for faster read-only queries and run in parallel
    const fiveMinutesAgo = new Date(Date.now() - (5 * 60 * 1000));
    const [users, trucks, routes, liveLocations] = await Promise.all([
      User.find({ role: 'driver' }).select('username fullName').lean(),
      Truck.find({}).select('truckId plateNumber model assignedDriver').lean(),
      Route.find({}).select('routeId name path assignedDriver').lean(),
      LiveLocation.find({ lastUpdate: { $gte: fiveMinutesAgo } }).lean()
    ]);

    // Create a map of live locations by username for quick lookup
    const liveLocationMap = {};
    for (const loc of liveLocations) {
      liveLocationMap[loc.username] = loc;
    }

    const allTrucks = [];

    for (const driver of users) {
      const assignedTruck = trucks.find(t => t.assignedDriver === driver.username);
      const assignedRoute = routes.find(r => r.assignedDriver === driver.username);

      if (assignedTruck) {
        const live = liveLocationMap[driver.username];

        let location;
        if (live) {
          location = {
            lat: live.lat,
            lng: live.lng,
            speed: live.speed || 0,
            heading: live.heading || 0,
            isLive: true,
            timestamp: live.timestamp
          };
        } else if (assignedRoute && assignedRoute.path && assignedRoute.path.coordinates && assignedRoute.path.coordinates[0]) {
          const firstCoord = assignedRoute.path.coordinates[0];
          location = {
            lat: firstCoord[1],
            lng: firstCoord[0],
            speed: 0,
            heading: 0,
            isLive: false,
            timestamp: null
          };
        } else {
          // Default to Mati City Hall
          location = { lat: 6.9549, lng: 126.2185, speed: 0, heading: 0, isLive: false, timestamp: null };
        }

        allTrucks.push({
          username: driver.username,
          fullName: driver.fullName || driver.username,
          truckId: assignedTruck.truckId,
          plateNumber: assignedTruck.plateNumber,
          model: assignedTruck.model,
          routeId: assignedRoute ? assignedRoute.routeId : null,
          routeName: assignedRoute ? assignedRoute.name : 'No route assigned',
          ...location
        });
      }
    }

    console.log(`📡 Returning ${allTrucks.length} trucks from MongoDB`);
    res.json(allTrucks);
  } catch (error) {
    console.error('❌ Error getting all trucks:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get specific driver location
router.get('/driver/:username', authenticateToken, async (req, res) => {
  try {
    const { username } = req.params;

    if (req.user.role !== 'admin' && req.user.username !== username) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await connectDB();

    const fiveMinutesAgo = new Date(Date.now() - (5 * 60 * 1000));
    const location = await LiveLocation.findOne({
      username,
      lastUpdate: { $gte: fiveMinutesAgo }
    }).lean();

    if (!location) {
      return res.status(404).json({ error: 'Location not found or stale' });
    }

    res.json(location);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear driver location
router.delete('/clear', authenticateToken, async (req, res) => {
  try {
    const username = req.user.username;
    await connectDB();
    await LiveLocation.deleteOne({ username });
    res.json({ message: 'Location cleared' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current trip summary
router.get('/my-trip', authenticateToken, async (req, res) => {
  try {
    const username = req.user.username;
    await connectDB();

    const trip = await TripData.findOne({ username, isActive: true });

    if (!trip) {
      return res.json({
        hasActiveTrip: false,
        message: 'No active trip. Start GPS tracking to begin a trip.'
      });
    }

    const avgSpeed = trip.speedSamples && trip.speedSamples.length > 0
      ? trip.speedSamples.reduce((a, b) => a + b, 0) / trip.speedSamples.length
      : 0;
    const durationMinutes = Math.round((Date.now() - trip.startTime.getTime()) / 60000);

    res.json({
      hasActiveTrip: true,
      trip: {
        distance: { km: Math.round(trip.totalDistance * 100) / 100 },
        fuel: { liters: trip.fuelEstimate },
        stops: trip.stopCount,
        averageSpeed: Math.round(avgSpeed),
        duration: { minutes: durationMinutes }
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start a new trip
router.post('/start-trip', authenticateToken, async (req, res) => {
  try {
    const username = req.user.username;
    const { routeId } = req.body;
    await connectDB();

    // End any existing active trip
    await TripData.updateMany({ username, isActive: true }, { isActive: false });

    // Create new trip
    const trip = new TripData({
      username,
      startTime: new Date(),
      isActive: true,
      routeId: routeId || null,
      totalDistance: 0,
      stopCount: 0,
      idleTimeMs: 0,
      fuelEstimate: 0,
      speedSamples: []
    });
    await trip.save();

    res.json({
      message: 'Trip started',
      trip: { username, startTime: trip.startTime.toISOString() }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// End trip
router.post('/end-trip', authenticateToken, async (req, res) => {
  try {
    const username = req.user.username;
    await connectDB();

    const trip = await TripData.findOne({ username, isActive: true });

    if (!trip) {
      return res.status(404).json({ error: 'No active trip found' });
    }

    const summary = {
      distance: { km: Math.round(trip.totalDistance * 100) / 100 },
      fuel: { liters: trip.fuelEstimate },
      stops: trip.stopCount
    };

    // Mark trip as inactive instead of deleting (for historical records)
    trip.isActive = false;
    await trip.save();

    res.json({ message: 'Trip ended', summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fuel dashboard
router.get('/fuel-dashboard', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    await connectDB();

    // Fetch live locations and active trips from MongoDB
    const fiveMinutesAgo = new Date(Date.now() - (5 * 60 * 1000));
    const [trucks, users, liveLocations, activeTrips] = await Promise.all([
      Truck.find({}).select('truckId plateNumber assignedDriver').lean(),
      User.find({ role: 'driver' }).select('username fullName').lean(),
      LiveLocation.find({ lastUpdate: { $gte: fiveMinutesAgo } }).lean(),
      TripData.find({ isActive: true }).lean()
    ]);

    // Create location map for quick lookup
    const locationMap = {};
    for (const loc of liveLocations) {
      locationMap[loc.username] = loc;
    }

    let totalDistance = 0;
    let totalFuel = 0;

    const truckFuelData = [];

    for (const trip of activeTrips) {
      const driver = users.find(u => u.username === trip.username);
      const truck = trucks.find(t => t.assignedDriver === trip.username);
      const location = locationMap[trip.username];

      totalDistance += trip.totalDistance || 0;
      totalFuel += trip.fuelEstimate || 0;

      truckFuelData.push({
        username: trip.username,
        driverName: driver ? driver.fullName : trip.username,
        truckId: truck ? truck.truckId : 'N/A',
        plateNumber: truck ? truck.plateNumber : 'N/A',
        distance: Math.round((trip.totalDistance || 0) * 100) / 100,
        fuelUsed: trip.fuelEstimate || 0,
        stops: trip.stopCount || 0,
        isActive: true,
        lastLocation: location ? { lat: location.lat, lng: location.lng } : null
      });
    }

    res.json({
      timestamp: new Date().toISOString(),
      fleet: {
        activeDrivers: truckFuelData.length,
        totalDistance: Math.round(totalDistance * 100) / 100,
        totalFuelUsed: Math.round(totalFuel * 100) / 100
      },
      trucks: truckFuelData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all active trips
router.get('/all-trips', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    await connectDB();

    const activeTrips = await TripData.find({ isActive: true }).lean();

    const trips = activeTrips.map(trip => ({
      username: trip.username,
      distance: { km: Math.round((trip.totalDistance || 0) * 100) / 100 },
      fuel: { liters: trip.fuelEstimate || 0 },
      stops: trip.stopCount || 0
    }));

    res.json({ count: trips.length, trips });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fuel estimate for specific driver
router.get('/fuel-estimate/:username', authenticateToken, async (req, res) => {
  try {
    const { username } = req.params;

    if (req.user.role !== 'admin' && req.user.username !== username) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await connectDB();

    const trip = await TripData.findOne({ username, isActive: true });

    if (!trip) {
      return res.json({ username, hasData: false, message: 'No trip data available' });
    }

    res.json({
      username,
      hasData: true,
      distance: { km: Math.round((trip.totalDistance || 0) * 100) / 100 },
      fuel: { liters: trip.fuelEstimate || 0 },
      stops: trip.stopCount || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
