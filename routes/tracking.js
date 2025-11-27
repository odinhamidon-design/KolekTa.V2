const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const connectDB = require('../lib/mongodb');
const LiveLocation = require('../models/LiveLocation');

// Update driver location - saves to MongoDB
router.post('/update', authenticateToken, async (req, res) => {
  try {
    const { lat, lng, routeId, speed, heading } = req.body;
    const username = req.user.username;
    
    console.log(`📍 GPS Update from ${username}: lat=${lat}, lng=${lng}, speed=${speed}`);
    
    if (!lat || !lng) {
      console.log(`❌ Missing coordinates from ${username}`);
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }
    
    // Validate coordinates are numbers
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    
    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      console.log(`❌ Invalid coordinates from ${username}: lat=${lat}, lng=${lng}`);
      return res.status(400).json({ error: 'Invalid coordinates' });
    }
    
    // Connect to MongoDB
    console.log(`🔌 Connecting to MongoDB for ${username}...`);
    await connectDB();
    console.log(`✅ MongoDB connected for ${username}`);
    
    // Upsert location data (update if exists, insert if not)
    const locationData = await LiveLocation.findOneAndUpdate(
      { username },
      {
        username,
        lat: parsedLat,
        lng: parsedLng,
        routeId: routeId || null,
        speed: speed || 0,
        heading: heading || 0,
        timestamp: new Date(),
        lastUpdate: new Date()
      },
      { upsert: true, new: true }
    );
    
    console.log(`✅ Location saved to MongoDB for ${username}: ${parsedLat}, ${parsedLng}`);
    
    res.json({
      message: 'Location updated',
      location: locationData,
      savedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error updating location:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: error.message, details: 'Check server logs for more info' });
  }
});

// Get all active driver locations (Admin only)
router.get('/active', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    await connectDB();
    
    // Get locations updated in last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const activeLocations = await LiveLocation.find({
      lastUpdate: { $gte: fiveMinutesAgo }
    });
    
    console.log(`📡 Active locations from MongoDB: ${activeLocations.length}`);
    
    res.json(activeLocations);
  } catch (error) {
    console.error('❌ Error getting active locations:', error);
    res.status(500).json({ error: error.message });
  }
});


// Get ALL assigned trucks (with last known or default location)
router.get('/all-trucks', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    // Use MongoDB models for persistent data
    const User = require('../models/User');
    const Truck = require('../models/Truck');
    const Route = require('../models/Route');
    
    await connectDB();
    
    const users = await User.find({});
    const routes = await Route.find({});
    const trucks = await Truck.find({});
    
    console.log(`📊 Data loaded from MongoDB: ${users.length} users, ${routes.length} routes, ${trucks.length} trucks`);
    
    // Get all live locations from MongoDB (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const liveLocations = await LiveLocation.find({
      lastUpdate: { $gte: fiveMinutesAgo }
    });
    
    // Create a map for quick lookup
    const locationMap = {};
    liveLocations.forEach(loc => {
      locationMap[loc.username] = loc;
    });
    
    const allTrucks = [];
    
    // Get all drivers
    const drivers = users.filter(u => u.role === 'driver');
    
    console.log(`📡 Checking ${drivers.length} drivers, found ${liveLocations.length} live locations`);
    
    drivers.forEach(driver => {
      // Find assigned route
      const assignedRoute = routes.find(r => r.assignedDriver === driver.username || r.driverId === driver.username);
      
      // Find assigned truck
      const assignedTruck = trucks.find(t => 
        t.assignedDriver === driver.username || t.driverId === driver.username
      );
      
      if (assignedTruck) {
        // Check if driver has live GPS location
        const liveLocation = locationMap[driver.username];
        
        let location;
        if (liveLocation) {
          // Use live GPS location from MongoDB
          console.log(`✅ Live location for ${driver.username}: ${liveLocation.lat}, ${liveLocation.lng}`);
          location = {
            lat: liveLocation.lat,
            lng: liveLocation.lng,
            speed: liveLocation.speed || 0,
            heading: liveLocation.heading || 0,
            isLive: true,
            timestamp: liveLocation.timestamp
          };
        } else if (assignedRoute) {
          // Use route's first location as default
          const firstCoord = assignedRoute.path && assignedRoute.path.coordinates && assignedRoute.path.coordinates[0];
          if (firstCoord) {
            location = {
              lat: firstCoord[1],
              lng: firstCoord[0],
              speed: 0,
              heading: 0,
              isLive: false,
              timestamp: null
            };
          } else {
            location = { lat: 6.9549, lng: 126.2185, speed: 0, heading: 0, isLive: false, timestamp: null };
          }
        } else {
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
    });
    
    console.log(`📡 Returning ${allTrucks.length} trucks`);
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
    
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const location = await LiveLocation.findOne({
      username,
      lastUpdate: { $gte: fiveMinutesAgo }
    });
    
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

// Debug endpoint
router.get('/debug', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    await connectDB();
    
    const allLocations = await LiveLocation.find({});
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const activeLocations = allLocations.filter(loc => loc.lastUpdate >= fiveMinutesAgo);
    
    res.json({
      message: 'Live locations debug (MongoDB)',
      totalCount: allLocations.length,
      activeCount: activeLocations.length,
      serverTime: new Date().toISOString(),
      fiveMinutesAgo: fiveMinutesAgo.toISOString(),
      locations: allLocations.map(loc => ({
        username: loc.username,
        lat: loc.lat,
        lng: loc.lng,
        lastUpdate: loc.lastUpdate,
        isActive: loc.lastUpdate >= fiveMinutesAgo,
        ageSeconds: Math.round((Date.now() - new Date(loc.lastUpdate).getTime()) / 1000)
      }))
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test GPS endpoint - allows driver to test if their GPS is being received
router.get('/test-my-location', authenticateToken, async (req, res) => {
  try {
    const username = req.user.username;
    
    await connectDB();
    
    const location = await LiveLocation.findOne({ username });
    
    if (!location) {
      return res.json({
        status: 'not_found',
        message: 'No GPS data found for your account. Make sure GPS is enabled and allowed.',
        username: username,
        tips: [
          'Allow location permission in browser',
          'Make sure GPS is enabled on your device',
          'Wait 10-15 seconds after login for first update'
        ]
      });
    }
    
    const ageSeconds = Math.round((Date.now() - new Date(location.lastUpdate).getTime()) / 1000);
    const isRecent = ageSeconds < 60;
    
    res.json({
      status: isRecent ? 'active' : 'stale',
      message: isRecent ? 'GPS tracking is working!' : 'GPS data is old. Check if tracking is still active.',
      username: username,
      location: {
        lat: location.lat,
        lng: location.lng,
        lastUpdate: location.lastUpdate,
        ageSeconds: ageSeconds
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
