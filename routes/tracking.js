const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { usersStorage, trucksStorage, routesStorage, liveLocationsStorage, tripDataStorage } = require('../data/storage');

// Batch update for syncing offline GPS points
router.post('/batch-update', authenticateToken, async (req, res) => {
  try {
    // Only drivers can submit GPS batch updates
    if (req.user.role !== 'driver') {
      return res.status(403).json({ error: 'Driver access required' });
    }

    const { points } = req.body;
    const username = req.user.username;

    if (!points || !Array.isArray(points) || points.length === 0) {
      return res.status(400).json({ error: 'Points array required' });
    }

    // Limit batch size to prevent DoS
    const MAX_BATCH_SIZE = 1000;
    if (points.length > MAX_BATCH_SIZE) {
      return res.status(400).json({ error: `Batch size exceeds maximum of ${MAX_BATCH_SIZE} points` });
    }

    console.log(`📍 Batch GPS Update from ${username}: ${points.length} points`);

    let processed = 0;
    let failed = 0;

    // Sort by timestamp to process in order
    const sortedPoints = [...points].sort((a, b) =>
      new Date(a.timestamp) - new Date(b.timestamp)
    );

    for (const point of sortedPoints) {
      try {
        const lat = parseFloat(point.lat);
        const lng = parseFloat(point.lng);
        let speed = parseFloat(point.speed) || 0;
        if (speed < 0) speed = 0;

        if (isNaN(lat) || isNaN(lng)) {
          console.warn(`Invalid coordinates in batch: ${point.lat}, ${point.lng}`);
          failed++;
          continue;
        }

        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          console.warn(`Coordinates out of range in batch: ${lat}, ${lng}`);
          failed++;
          continue;
        }

        // Save to live locations storage (update to latest)
        liveLocationsStorage.set(username, {
          username,
          lat,
          lng,
          routeId: point.routeId || null,
          speed,
          heading: point.heading || 0,
          timestamp: new Date(point.timestamp || Date.now())
        });

        // Update trip data
        tripDataStorage.updateTrip(username, lat, lng, speed);

        processed++;
      } catch (pointError) {
        console.error(`Error processing point:`, pointError);
        failed++;
      }
    }

    console.log(`✅ Batch update complete: ${processed} processed, ${failed} failed`);

    res.json({
      message: 'Batch update complete',
      processed,
      failed,
      total: points.length,
      processedCount: processed,
      failedCount: failed
    });
  } catch (error) {
    console.error('❌ Error in batch update:', error.message);
    console.error('Error:', error);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// Update driver location - saves to local storage and tracks trip data
router.post('/update', authenticateToken, async (req, res) => {
  try {
    const { lat, lng, routeId, speed, heading } = req.body;
    const username = req.user.username;

    console.log(`📍 GPS Update from ${username}: lat=${lat}, lng=${lng}, speed=${speed}`);

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    let parsedSpeed = parseFloat(speed) || 0;
    if (parsedSpeed < 0) parsedSpeed = 0;

    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    if (parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) {
      return res.status(400).json({ error: 'Coordinates out of range' });
    }

    // Save to live locations storage
    liveLocationsStorage.set(username, {
      username,
      lat: parsedLat,
      lng: parsedLng,
      routeId: routeId || null,
      speed: parsedSpeed,
      heading: heading || 0,
      timestamp: new Date()
    });

    // Update trip data for automatic fuel estimation
    const tripData = tripDataStorage.updateTrip(username, parsedLat, parsedLng, parsedSpeed);

    console.log(`✅ Location saved for ${username}: ${parsedLat}, ${parsedLng} | Distance: ${tripData.totalDistance.toFixed(2)}km | Fuel: ${tripData.fuelEstimate}L`);

    res.json({
      message: 'Location updated',
      location: { lat: parsedLat, lng: parsedLng },
      savedAt: new Date().toISOString(),
      trip: {
        distance: Math.round(tripData.totalDistance * 100) / 100,
        fuelEstimate: tripData.fuelEstimate,
        stops: tripData.stopCount
      }
    });
  } catch (error) {
    console.error('❌ Error updating location:', error.message);
    console.error('Error:', error);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// Get all active driver locations (Admin only)
router.get('/active', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Clean stale locations
    liveLocationsStorage.cleanStale();

    const locations = liveLocationsStorage.getAll();
    const activeLocations = Object.values(locations);

    console.log(`📡 Active locations: ${activeLocations.length}`);

    res.json(activeLocations);
  } catch (error) {
    console.error('❌ Error getting active locations:', error);
    console.error('Error:', error);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// Get ALL assigned trucks (with last known or default location)
router.get('/all-trucks', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const users = usersStorage.getAll();
    const routes = routesStorage.getAll();
    const trucks = trucksStorage.getAll();

    // Clean stale locations
    liveLocationsStorage.cleanStale();
    const liveLocations = liveLocationsStorage.getAll();

    const allTrucks = [];
    const drivers = users.filter(u => u.role === 'driver');

    drivers.forEach(driver => {
      const assignedRoute = routes.find(r => r.assignedDriver === driver.username || r.driverId === driver.username);
      const assignedTruck = trucks.find(t => t.assignedDriver === driver.username || t.driverId === driver.username);

      if (assignedTruck) {
        const liveLocation = liveLocations[driver.username];

        let location;
        if (liveLocation) {
          location = {
            lat: liveLocation.lat,
            lng: liveLocation.lng,
            speed: liveLocation.speed || 0,
            heading: liveLocation.heading || 0,
            isLive: true,
            timestamp: liveLocation.timestamp
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
    console.error('Error:', error);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// Get specific driver location
router.get('/driver/:username', authenticateToken, async (req, res) => {
  try {
    const { username } = req.params;

    if (req.user.role !== 'admin' && req.user.username !== username) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const location = liveLocationsStorage.get(username);

    if (!location) {
      return res.status(404).json({ error: 'Location not found or stale' });
    }

    // Check if stale (older than 5 minutes)
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    if (location.lastUpdate < fiveMinutesAgo) {
      return res.status(404).json({ error: 'Location not found or stale' });
    }

    res.json(location);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// Clear driver location
router.delete('/clear', authenticateToken, async (req, res) => {
  try {
    const username = req.user.username;
    liveLocationsStorage.delete(username);
    res.json({ message: 'Location cleared' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// Debug endpoint
router.get('/debug', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const allLocations = liveLocationsStorage.getAll();
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);

    const locationsArray = Object.values(allLocations);
    const activeLocations = locationsArray.filter(loc => loc.lastUpdate >= fiveMinutesAgo);

    res.json({
      message: 'Live locations debug (local storage)',
      totalCount: locationsArray.length,
      activeCount: activeLocations.length,
      serverTime: new Date().toISOString(),
      locations: locationsArray.map(loc => ({
        username: loc.username,
        lat: loc.lat,
        lng: loc.lng,
        lastUpdate: loc.lastUpdate,
        isActive: loc.lastUpdate >= fiveMinutesAgo,
        ageSeconds: Math.round((Date.now() - loc.lastUpdate) / 1000)
      }))
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// Test GPS endpoint
router.get('/test-my-location', authenticateToken, async (req, res) => {
  try {
    const username = req.user.username;
    const location = liveLocationsStorage.get(username);

    if (!location) {
      return res.json({
        status: 'not_found',
        message: 'No GPS data found for your account.',
        username: username
      });
    }

    const ageSeconds = Math.round((Date.now() - location.lastUpdate) / 1000);
    const isRecent = ageSeconds < 60;

    res.json({
      status: isRecent ? 'active' : 'stale',
      message: isRecent ? 'GPS tracking is working!' : 'GPS data is old.',
      username: username,
      location: {
        lat: location.lat,
        lng: location.lng,
        lastUpdate: location.lastUpdate,
        ageSeconds: ageSeconds
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// ============================================
// TRIP & AUTOMATIC FUEL ESTIMATION ENDPOINTS
// ============================================

// Get current trip summary with automatic fuel estimation (for driver)
router.get('/my-trip', authenticateToken, async (req, res) => {
  try {
    const username = req.user.username;
    const tripSummary = tripDataStorage.getTripSummary(username);

    if (!tripSummary) {
      return res.json({
        hasActiveTrip: false,
        message: 'No active trip. Start GPS tracking to begin a trip.'
      });
    }

    res.json({
      hasActiveTrip: tripSummary.isActive,
      trip: tripSummary
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// Get real-time fuel estimation for a specific driver (Admin or self)
router.get('/fuel-estimate/:username', authenticateToken, async (req, res) => {
  try {
    const { username } = req.params;

    // Only admin or the driver themselves can view
    if (req.user.role !== 'admin' && req.user.username !== username) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const tripSummary = tripDataStorage.getTripSummary(username);

    if (!tripSummary) {
      return res.json({
        username,
        hasData: false,
        message: 'No trip data available'
      });
    }

    res.json({
      username,
      hasData: true,
      distance: tripSummary.distance,
      fuel: tripSummary.fuel,
      stops: tripSummary.stops,
      idleTime: tripSummary.idleTime,
      averageSpeed: tripSummary.averageSpeed,
      duration: tripSummary.duration,
      isActive: tripSummary.isActive
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// Get all active trips with fuel data (Admin only)
router.get('/all-trips', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const activeTrips = tripDataStorage.getAllActive();

    // Enhance with truck and driver info
    const trucks = trucksStorage.getAll();
    const users = usersStorage.getAll();

    const enrichedTrips = activeTrips.map(trip => {
      const driver = users.find(u => u.username === trip.username);
      const truck = trucks.find(t => t.assignedDriver === trip.username);

      return {
        ...trip,
        driverName: driver ? driver.fullName : trip.username,
        truckId: truck ? truck.truckId : null,
        plateNumber: truck ? truck.plateNumber : null,
        truckModel: truck ? truck.model : null
      };
    });

    res.json({
      count: enrichedTrips.length,
      trips: enrichedTrips
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// Start a new trip (for driver)
router.post('/start-trip', authenticateToken, async (req, res) => {
  try {
    const username = req.user.username;

    // Find assigned truck
    const trucks = trucksStorage.getAll();
    const assignedTruck = trucks.find(t => t.assignedDriver === username);

    // Clear any existing trip and start fresh
    tripDataStorage.clear(username);
    const trip = tripDataStorage.startTrip(username, assignedTruck?.truckId || null);

    console.log(`🚀 Trip started for ${username}`);

    res.json({
      message: 'Trip started',
      trip: {
        username,
        truckId: assignedTruck?.truckId || null,
        startTime: new Date(trip.startTime).toISOString()
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// End trip and get final summary (for driver)
router.post('/end-trip', authenticateToken, async (req, res) => {
  try {
    const username = req.user.username;
    const tripSummary = tripDataStorage.endTrip(username);

    if (!tripSummary) {
      return res.status(404).json({ error: 'No active trip found' });
    }

    console.log(`🏁 Trip ended for ${username} - Distance: ${tripSummary.distance.km}km, Fuel: ${tripSummary.fuel.liters}L`);

    res.json({
      message: 'Trip ended',
      summary: tripSummary
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// Get live fuel dashboard data (Admin only)
router.get('/fuel-dashboard', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const activeTrips = tripDataStorage.getAllActive();
    const trucks = trucksStorage.getAll();
    const users = usersStorage.getAll();
    const liveLocations = liveLocationsStorage.getAll();

    // Calculate fleet totals
    let totalDistance = 0;
    let totalFuel = 0;
    let totalStops = 0;

    const truckFuelData = activeTrips.map(trip => {
      const driver = users.find(u => u.username === trip.username);
      const truck = trucks.find(t => t.assignedDriver === trip.username);
      const location = liveLocations[trip.username];

      totalDistance += trip.distance.km;
      totalFuel += trip.fuel.liters;
      totalStops += trip.stops;

      return {
        username: trip.username,
        driverName: driver ? driver.fullName : trip.username,
        truckId: truck ? truck.truckId : 'N/A',
        plateNumber: truck ? truck.plateNumber : 'N/A',
        distance: trip.distance.km,
        fuelUsed: trip.fuel.liters,
        efficiency: trip.fuel.efficiency,
        stops: trip.stops,
        averageSpeed: trip.averageSpeed,
        duration: trip.duration.formatted,
        isActive: trip.isActive,
        lastLocation: location ? { lat: location.lat, lng: location.lng } : null
      };
    });

    res.json({
      timestamp: new Date().toISOString(),
      fleet: {
        activeDrivers: activeTrips.length,
        totalDistance: Math.round(totalDistance * 100) / 100,
        totalFuelUsed: Math.round(totalFuel * 100) / 100,
        totalStops: totalStops,
        averageEfficiency: totalDistance > 0 ? Math.round((totalDistance / totalFuel) * 100) / 100 : 0
      },
      trucks: truckFuelData
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

module.exports = router;
