const express = require('express');
const router = express.Router();
const { authenticateToken: auth } = require('../middleware/auth');

// Check if using mock mode
const useMockAuth = process.env.USE_MOCK_AUTH === 'true';

// Models (only load if not mock mode)
let VehicleInspection, StopCompletion, DriverNotification, Route, Truck;
let modelsLoaded = false;

// Lazy load models to prevent Vercel crash
function loadModels() {
  if (modelsLoaded || useMockAuth) return;
  try {
    VehicleInspection = require('../models/VehicleInspection');
    StopCompletion = require('../models/StopCompletion');
    DriverNotification = require('../models/DriverNotification');
    Route = require('../models/Route');
    Truck = require('../models/Truck');
    modelsLoaded = true;
  } catch (error) {
    console.error('Failed to load driver feature models:', error.message);
  }
}

// Middleware to ensure models are loaded
router.use((req, res, next) => {
  loadModels();
  next();
});

// In-memory storage for mock mode
let mockInspections = [];
let mockStopCompletions = [];
let mockNotifications = [];
let inspectionCounter = 1;
let stopCompletionCounter = 1;
let notificationCounter = 1;

// ============================================
// VEHICLE INSPECTIONS
// ============================================

// Submit vehicle inspection
router.post('/inspections', auth, async (req, res) => {
  try {
    const { truckId, inspectionType, items, odometerReading, fuelLevel, photos, notes } = req.body;

    if (!truckId || !items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Missing required fields: truckId, items' });
    }

    // Calculate overall status
    const failedItems = items.filter(i => i.status === 'fail').map(i => i.item);
    let overallStatus = 'passed';
    if (failedItems.length > 0) {
      overallStatus = failedItems.length >= 3 ? 'failed' : 'needs-attention';
    }

    const inspectionData = {
      inspectionId: `INS-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
      truckId,
      driverUsername: req.user.username,
      driverName: req.user.fullName || req.user.username,
      inspectionType: inspectionType || 'pre-trip',
      inspectionDate: new Date(),
      items,
      overallStatus,
      failedItems,
      odometerReading: odometerReading || null,
      fuelLevel: fuelLevel || null,
      photos: photos || [],
      notes: notes || '',
      status: overallStatus === 'passed' ? 'reviewed' : 'pending'
    };

    if (!useMockAuth && VehicleInspection) {
      const inspection = await VehicleInspection.create(inspectionData);

      // If inspection failed, notify admin
      if (overallStatus !== 'passed') {
        if (DriverNotification) {
          await DriverNotification.notify(
            'admin',
            'inspection-required',
            `Vehicle Inspection Issue: ${truckId}`,
            `Driver ${req.user.fullName || req.user.username} reported ${failedItems.length} issue(s) during ${inspectionType} inspection: ${failedItems.join(', ')}`,
            {
              priority: overallStatus === 'failed' ? 'urgent' : 'high',
              relatedEntity: { type: 'inspection', id: inspection.inspectionId },
              createdBy: req.user.username
            }
          );
        }
      }

      res.status(201).json({
        success: true,
        inspection,
        message: overallStatus === 'passed' ? 'Inspection completed successfully' : 'Inspection submitted - issues reported to admin'
      });
    } else {
      // Mock mode
      inspectionData._id = `mock-${inspectionCounter++}`;
      inspectionData.createdAt = new Date();
      mockInspections.push(inspectionData);

      res.status(201).json({
        success: true,
        inspection: inspectionData,
        message: overallStatus === 'passed' ? 'Inspection completed successfully' : 'Inspection submitted - issues reported to admin'
      });
    }
  } catch (error) {
    console.error('Inspection submission error:', error);
    res.status(500).json({ error: 'Failed to submit inspection' });
  }
});

// Get driver's inspections
router.get('/inspections', auth, async (req, res) => {
  try {
    const { date, truckId } = req.query;

    if (!useMockAuth && VehicleInspection) {
      const query = { driverUsername: req.user.username };

      if (date) {
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        query.inspectionDate = { $gte: startDate, $lt: endDate };
      }

      if (truckId) {
        query.truckId = truckId;
      }

      const inspections = await VehicleInspection.find(query)
        .sort({ inspectionDate: -1 })
        .limit(50);
      res.json(inspections);
    } else {
      // Mock mode
      let filtered = mockInspections.filter(i => i.driverUsername === req.user.username);
      if (truckId) {
        filtered = filtered.filter(i => i.truckId === truckId);
      }
      res.json(filtered.slice(0, 50));
    }
  } catch (error) {
    console.error('Get inspections error:', error);
    res.status(500).json({ error: 'Failed to get inspections' });
  }
});

// Get all inspections (admin)
router.get('/inspections/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { status, overallStatus } = req.query;

    if (!useMockAuth && VehicleInspection) {
      const query = {};
      if (status) query.status = status;
      if (overallStatus) query.overallStatus = overallStatus;

      const inspections = await VehicleInspection.find(query)
        .sort({ inspectionDate: -1 })
        .limit(100);
      res.json(inspections);
    } else {
      let filtered = mockInspections;
      if (status) filtered = filtered.filter(i => i.status === status);
      if (overallStatus) filtered = filtered.filter(i => i.overallStatus === overallStatus);
      res.json(filtered.slice(0, 100));
    }
  } catch (error) {
    console.error('Get all inspections error:', error);
    res.status(500).json({ error: 'Failed to get inspections' });
  }
});

// ============================================
// STOP COMPLETIONS
// ============================================

// Mark stop as completed
router.post('/stops/complete', auth, async (req, res) => {
  try {
    const { routeId, stopIndex, stopName, location, gpsLocation, binsCollected, wasteType, notes, photos } = req.body;

    if (!routeId || stopIndex === undefined || !location) {
      return res.status(400).json({ error: 'Missing required fields: routeId, stopIndex, location' });
    }

    // Calculate distance from expected stop if GPS provided
    let distanceFromStop = null;
    if (gpsLocation && location) {
      const R = 6371000; // Earth's radius in meters
      const lat1 = location.coordinates[1] * Math.PI / 180;
      const lat2 = gpsLocation.coordinates[1] * Math.PI / 180;
      const dLat = (gpsLocation.coordinates[1] - location.coordinates[1]) * Math.PI / 180;
      const dLng = (gpsLocation.coordinates[0] - location.coordinates[0]) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      distanceFromStop = Math.round(R * c);
    }

    const completionData = {
      routeId,
      stopIndex,
      stopName: stopName || `Stop ${stopIndex + 1}`,
      location,
      driverUsername: req.user.username,
      driverName: req.user.fullName || req.user.username,
      status: 'completed',
      completedAt: new Date(),
      gpsLocation: gpsLocation || null,
      distanceFromStop,
      binsCollected: binsCollected || 1,
      wasteType: wasteType || 'mixed',
      notes: notes || '',
      photos: photos || []
    };

    if (!useMockAuth && StopCompletion) {
      // Upsert to handle re-completion
      const completion = await StopCompletion.findOneAndUpdate(
        { routeId, stopIndex },
        completionData,
        { upsert: true, new: true }
      );
      res.status(201).json({ success: true, completion });
    } else {
      // Mock mode
      const existing = mockStopCompletions.findIndex(s => s.routeId === routeId && s.stopIndex === stopIndex);
      if (existing >= 0) {
        mockStopCompletions[existing] = { ...completionData, _id: mockStopCompletions[existing]._id };
      } else {
        completionData._id = `mock-stop-${stopCompletionCounter++}`;
        mockStopCompletions.push(completionData);
      }
      res.status(201).json({ success: true, completion: completionData });
    }
  } catch (error) {
    console.error('Stop completion error:', error);
    res.status(500).json({ error: 'Failed to mark stop as completed' });
  }
});

// Skip stop with justification
router.post('/stops/skip', auth, async (req, res) => {
  try {
    const { routeId, stopIndex, stopName, location, gpsLocation, skipReason, skipNotes, skipPhoto } = req.body;

    if (!routeId || stopIndex === undefined || !skipReason) {
      return res.status(400).json({ error: 'Missing required fields: routeId, stopIndex, skipReason' });
    }

    // Validate skip reason
    const validReasons = ['road-blocked', 'no-access', 'safety-concern', 'no-waste', 'resident-request', 'vehicle-issue', 'weather', 'other'];
    if (!validReasons.includes(skipReason)) {
      return res.status(400).json({ error: 'Invalid skip reason' });
    }

    // Require photo for certain reasons
    const photoRequiredReasons = ['road-blocked', 'no-access', 'safety-concern', 'vehicle-issue'];
    if (photoRequiredReasons.includes(skipReason) && !skipPhoto) {
      return res.status(400).json({ error: 'Photo required for this skip reason' });
    }

    const skipData = {
      routeId,
      stopIndex,
      stopName: stopName || `Stop ${stopIndex + 1}`,
      location: location || { type: 'Point', coordinates: [0, 0] },
      driverUsername: req.user.username,
      driverName: req.user.fullName || req.user.username,
      status: 'skipped',
      skipReason,
      skipNotes: skipNotes || '',
      skipPhoto: skipPhoto || null,
      completedAt: new Date(),
      gpsLocation: gpsLocation || null
    };

    if (!useMockAuth && StopCompletion) {
      const skip = await StopCompletion.findOneAndUpdate(
        { routeId, stopIndex },
        skipData,
        { upsert: true, new: true }
      );

      // Notify admin about skipped stop
      if (DriverNotification) {
        await DriverNotification.notify(
          'admin',
          'route-changed',
          `Stop Skipped: ${stopName || `Stop ${stopIndex + 1}`}`,
          `Driver ${req.user.fullName || req.user.username} skipped a stop on route ${routeId}. Reason: ${skipReason}. ${skipNotes ? `Notes: ${skipNotes}` : ''}`,
          {
            priority: 'normal',
            relatedEntity: { type: 'route', id: routeId },
            createdBy: req.user.username
          }
        );
      }

      res.status(201).json({ success: true, skip });
    } else {
      // Mock mode
      const existing = mockStopCompletions.findIndex(s => s.routeId === routeId && s.stopIndex === stopIndex);
      if (existing >= 0) {
        mockStopCompletions[existing] = { ...skipData, _id: mockStopCompletions[existing]._id };
      } else {
        skipData._id = `mock-skip-${stopCompletionCounter++}`;
        mockStopCompletions.push(skipData);
      }
      res.status(201).json({ success: true, skip: skipData });
    }
  } catch (error) {
    console.error('Skip stop error:', error);
    res.status(500).json({ error: 'Failed to skip stop' });
  }
});

// Get route progress
router.get('/stops/progress/:routeId', auth, async (req, res) => {
  try {
    const { routeId } = req.params;

    if (!useMockAuth && StopCompletion) {
      const progress = await StopCompletion.getRouteProgress(routeId);
      res.json(progress);
    } else {
      // Mock mode
      const stops = mockStopCompletions.filter(s => s.routeId === routeId).sort((a, b) => a.stopIndex - b.stopIndex);
      const completed = stops.filter(s => s.status === 'completed').length;
      const skipped = stops.filter(s => s.status === 'skipped').length;
      res.json({
        routeId,
        total: stops.length,
        completed,
        skipped,
        remaining: 0,
        percentComplete: stops.length > 0 ? Math.round((completed / stops.length) * 100) : 0,
        stops
      });
    }
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'Failed to get route progress' });
  }
});

// ============================================
// DRIVER NOTIFICATIONS
// ============================================

// Get notifications for current driver
router.get('/notifications', auth, async (req, res) => {
  try {
    const { unreadOnly } = req.query;

    if (!useMockAuth && DriverNotification) {
      let notifications;
      if (unreadOnly === 'true') {
        notifications = await DriverNotification.getUnread(req.user.username);
      } else {
        notifications = await DriverNotification.getRecent(req.user.username);
      }
      res.json(notifications);
    } else {
      // Mock mode
      let filtered = mockNotifications.filter(n =>
        n.targetDriver === req.user.username || n.targetDriver === 'all'
      );
      if (unreadOnly === 'true') {
        filtered = filtered.filter(n => !n.isRead);
      }
      res.json(filtered.slice(0, 50));
    }
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

// Get unread count
router.get('/notifications/count', auth, async (req, res) => {
  try {
    if (!useMockAuth && DriverNotification) {
      const count = await DriverNotification.countDocuments({
        $or: [
          { targetDriver: req.user.username },
          { targetDriver: 'all' }
        ],
        isRead: false
      });
      res.json({ count });
    } else {
      const count = mockNotifications.filter(n =>
        (n.targetDriver === req.user.username || n.targetDriver === 'all') && !n.isRead
      ).length;
      res.json({ count });
    }
  } catch (error) {
    console.error('Get notification count error:', error);
    res.status(500).json({ error: 'Failed to get notification count' });
  }
});

// Mark notification as read
router.put('/notifications/:id/read', auth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!useMockAuth && DriverNotification) {
      const notification = await DriverNotification.markAsRead(id, req.user.username);
      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      res.json({ success: true, notification });
    } else {
      const idx = mockNotifications.findIndex(n => n._id === id);
      if (idx >= 0) {
        mockNotifications[idx].isRead = true;
        mockNotifications[idx].readAt = new Date();
        res.json({ success: true, notification: mockNotifications[idx] });
      } else {
        res.status(404).json({ error: 'Notification not found' });
      }
    }
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all as read
router.put('/notifications/read-all', auth, async (req, res) => {
  try {
    if (!useMockAuth && DriverNotification) {
      await DriverNotification.markAllAsRead(req.user.username);
      res.json({ success: true });
    } else {
      mockNotifications.forEach(n => {
        if (n.targetDriver === req.user.username || n.targetDriver === 'all') {
          n.isRead = true;
          n.readAt = new Date();
        }
      });
      res.json({ success: true });
    }
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

// Send notification (admin only)
router.post('/notifications/send', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { targetDriver, type, title, message, priority, relatedEntity } = req.body;

    if (!targetDriver || !type || !title || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!useMockAuth && DriverNotification) {
      const notification = await DriverNotification.notify(
        targetDriver,
        type,
        title,
        message,
        { priority, relatedEntity, createdBy: req.user.username }
      );
      res.status(201).json({ success: true, notification });
    } else {
      const notification = {
        _id: `mock-notif-${notificationCounter++}`,
        targetDriver,
        type,
        title,
        message,
        priority: priority || 'normal',
        relatedEntity: relatedEntity || null,
        isRead: false,
        createdBy: req.user.username,
        createdAt: new Date()
      };
      mockNotifications.push(notification);
      res.status(201).json({ success: true, notification });
    }
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// ============================================
// DRIVER PERFORMANCE / STATS
// ============================================

// Get driver performance stats
router.get('/performance', auth, async (req, res) => {
  try {
    const { period } = req.query; // 'today', 'week', 'month'
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      default: // today
        startDate.setHours(0, 0, 0, 0);
    }

    if (!useMockAuth && StopCompletion) {
      // Get stop stats
      const stopStats = await StopCompletion.getDriverStats(req.user.username, startDate, now);

      // Get route completions from completions collection (if available)
      let routeStats = { completed: 0, totalDistance: 0, totalFuel: 0 };
      try {
        const Completion = require('../models/Completion');
        const completions = await Completion.find({
          driverUsername: req.user.username,
          completedAt: { $gte: startDate, $lte: now }
        });
        routeStats.completed = completions.length;
        routeStats.totalDistance = completions.reduce((sum, c) => sum + (c.distanceTraveled || 0), 0);
        routeStats.totalFuel = completions.reduce((sum, c) => sum + (c.fuelUsed || 0), 0);
      } catch (e) {
        // Completion model might not exist
      }

      // Get inspection stats
      let inspectionStats = { total: 0, passed: 0, issues: 0 };
      const inspections = await VehicleInspection.find({
        driverUsername: req.user.username,
        inspectionDate: { $gte: startDate, $lte: now }
      });
      inspectionStats.total = inspections.length;
      inspectionStats.passed = inspections.filter(i => i.overallStatus === 'passed').length;
      inspectionStats.issues = inspections.filter(i => i.overallStatus !== 'passed').length;

      res.json({
        period: period || 'today',
        startDate,
        endDate: now,
        stops: stopStats,
        routes: routeStats,
        inspections: inspectionStats,
        efficiency: {
          completionRate: stopStats.completed + stopStats.skipped > 0
            ? Math.round((stopStats.completed / (stopStats.completed + stopStats.skipped)) * 100)
            : 100,
          avgBinsPerStop: stopStats.completed > 0
            ? Math.round((stopStats.totalBins / stopStats.completed) * 10) / 10
            : 0
        }
      });
    } else {
      // Mock mode - return sample data
      const mockStops = mockStopCompletions.filter(s =>
        s.driverUsername === req.user.username &&
        new Date(s.completedAt) >= startDate
      );

      res.json({
        period: period || 'today',
        startDate,
        endDate: now,
        stops: {
          completed: mockStops.filter(s => s.status === 'completed').length,
          skipped: mockStops.filter(s => s.status === 'skipped').length,
          totalBins: mockStops.reduce((sum, s) => sum + (s.binsCollected || 0), 0),
          totalWeight: 0
        },
        routes: {
          completed: 0,
          totalDistance: 0,
          totalFuel: 0
        },
        inspections: {
          total: mockInspections.filter(i => i.driverUsername === req.user.username).length,
          passed: mockInspections.filter(i => i.driverUsername === req.user.username && i.overallStatus === 'passed').length,
          issues: mockInspections.filter(i => i.driverUsername === req.user.username && i.overallStatus !== 'passed').length
        },
        efficiency: {
          completionRate: 100,
          avgBinsPerStop: 1
        }
      });
    }
  } catch (error) {
    console.error('Get performance error:', error);
    res.status(500).json({ error: 'Failed to get performance stats' });
  }
});

// Get performance leaderboard (admin)
router.get('/performance/leaderboard', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    if (!useMockAuth && StopCompletion) {
      const leaderboard = await StopCompletion.aggregate([
        {
          $match: {
            completedAt: { $gte: startDate },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: '$driverUsername',
            driverName: { $first: '$driverName' },
            stopsCompleted: { $sum: 1 },
            binsCollected: { $sum: '$binsCollected' }
          }
        },
        { $sort: { stopsCompleted: -1 } },
        { $limit: 10 }
      ]);

      res.json(leaderboard);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

module.exports = router;
