const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticateToken } = require('../middleware/auth');
const connectDB = require('../lib/mongodb');
const Route = require('../models/Route');

// Configure multer for memory storage (works on Vercel serverless)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
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

// Complete route with photos (stores as base64 in MongoDB)
router.post('/:routeId/complete', authenticateToken, upload.array('photos', 10), async (req, res) => {
  try {
    await connectDB();
    const { routeId } = req.params;
    const { notes } = req.body;
    
    console.log('Completing route:', routeId);
    console.log('User:', req.user.username);
    console.log('Files received:', req.files ? req.files.length : 0);
    
    const route = await Route.findOne({
      $or: [
        { _id: routeId.match(/^[0-9a-fA-F]{24}$/) ? routeId : null },
        { routeId: routeId }
      ]
    });
    
    if (!route) {
      console.log('Route not found:', routeId);
      return res.status(404).json({ error: 'Route not found' });
    }
    
    // Check if driver is assigned to this route
    if (route.assignedDriver !== req.user.username) {
      console.log('Driver mismatch:', route.assignedDriver, 'vs', req.user.username);
      return res.status(403).json({ error: 'You are not assigned to this route' });
    }
    
    // Convert uploaded files to base64 data URLs (stored in MongoDB)
    const photos = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const base64 = file.buffer.toString('base64');
        const dataUrl = `data:${file.mimetype};base64,${base64}`;
        photos.push(dataUrl);
        console.log('Photo converted to base64, size:', file.size);
      }
    }
    
    // Update route with completion data
    route.status = 'completed';
    route.completedAt = new Date();
    route.completedBy = req.user.username;
    route.completionNotes = notes || '';
    route.completionPhotos = photos;
    route.notificationSent = false;
    
    await route.save();
    
    console.log('Route completed successfully:', routeId);
    console.log('Photos saved:', photos.length);
    
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
        photosCount: photos.length
      }
    });
  } catch (error) {
    console.error('Error completing route:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get completion details
router.get('/:routeId/completion', authenticateToken, async (req, res) => {
  try {
    await connectDB();
    const { routeId } = req.params;
    
    const route = await Route.findOne({
      $or: [
        { _id: routeId.match(/^[0-9a-fA-F]{24}$/) ? routeId : null },
        { routeId: routeId }
      ]
    });
    
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
      completionPhotos: route.completionPhotos || []
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
    
    await connectDB();
    const pendingNotifications = await Route.find({
      status: 'completed',
      completedAt: { $exists: true },
      notificationSent: { $ne: true }
    }).select('-completionPhotos'); // Don't send photos in list to reduce payload
    
    console.log('Pending notifications found:', pendingNotifications.length);
    
    res.json(pendingNotifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single route with full details (including photos)
router.get('/:routeId', authenticateToken, async (req, res) => {
  try {
    await connectDB();
    const { routeId } = req.params;
    
    const route = await Route.findOne({
      $or: [
        { _id: routeId.match(/^[0-9a-fA-F]{24}$/) ? routeId : null },
        { routeId: routeId }
      ]
    });
    
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
    
    await connectDB();
    const { routeId } = req.params;
    
    await Route.updateOne(
      { $or: [{ _id: routeId.match(/^[0-9a-fA-F]{24}$/) ? routeId : null }, { routeId: routeId }] },
      { notificationSent: true }
    );
    
    console.log('Notification marked as read:', routeId);
    
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
