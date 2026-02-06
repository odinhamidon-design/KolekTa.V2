const express = require('express');
const router = express.Router();
const Bin = require('../models/Bin');
const { authenticateToken } = require('../middleware/auth');
const connectDB = require('../lib/mongodb');
const logger = require('../lib/logger');

// Get all bins (authenticated)
router.get('/', authenticateToken, async (req, res) => {
  try {
    await connectDB();
    const bins = await Bin.find().lean();
    res.json(bins);
  } catch (error) {
    logger.error('Error fetching bins:', error.message);
    res.status(500).json({ error: 'Failed to fetch bins' });
  }
});

// Create new bin (admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    await connectDB();
    const { binId, location, address, capacity, currentLevel, status, lastCollection, binType, manualVolume } = req.body;
    const bin = new Bin({ binId, location, address, capacity, currentLevel, status, lastCollection, binType, manualVolume });
    await bin.save();
    res.status(201).json(bin);
  } catch (error) {
    logger.error('Error creating bin:', error.message);
    res.status(400).json({ error: 'Failed to create bin' });
  }
});

// Update bin (admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    await connectDB();
    const { binId, location, address, capacity, currentLevel, status, lastCollection, binType, manualVolume } = req.body;
    const allowedUpdates = {};
    if (binId !== undefined) allowedUpdates.binId = binId;
    if (location !== undefined) allowedUpdates.location = location;
    if (address !== undefined) allowedUpdates.address = address;
    if (capacity !== undefined) allowedUpdates.capacity = capacity;
    if (currentLevel !== undefined) allowedUpdates.currentLevel = currentLevel;
    if (status !== undefined) allowedUpdates.status = status;
    if (lastCollection !== undefined) allowedUpdates.lastCollection = lastCollection;
    if (binType !== undefined) allowedUpdates.binType = binType;
    if (manualVolume !== undefined) allowedUpdates.manualVolume = manualVolume;
    const bin = await Bin.findByIdAndUpdate(req.params.id, allowedUpdates, { new: true });

    if (!bin) {
      return res.status(404).json({ error: 'Bin not found' });
    }

    res.json(bin);
  } catch (error) {
    logger.error('Error updating bin:', error.message);
    res.status(400).json({ error: 'Failed to update bin' });
  }
});

// Delete bin (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    await connectDB();
    const bin = await Bin.findByIdAndDelete(req.params.id);

    if (!bin) {
      return res.status(404).json({ error: 'Bin not found' });
    }

    res.json({ message: 'Bin deleted successfully' });
  } catch (error) {
    logger.error('Error deleting bin:', error.message);
    res.status(500).json({ error: 'Failed to delete bin' });
  }
});

// Get bins by proximity (authenticated)
router.get('/nearby', authenticateToken, async (req, res) => {
  try {
    const { lng, lat, maxDistance = 5000 } = req.query;

    // Validate required parameters
    if (!lng || !lat) {
      return res.status(400).json({ error: 'lng and lat parameters are required' });
    }

    const parsedLng = parseFloat(lng);
    const parsedLat = parseFloat(lat);
    const parsedMaxDistance = parseInt(maxDistance);

    // Validate coordinate values
    if (isNaN(parsedLng) || isNaN(parsedLat)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    if (parsedLat < -90 || parsedLat > 90) {
      return res.status(400).json({ error: 'Latitude must be between -90 and 90' });
    }

    if (parsedLng < -180 || parsedLng > 180) {
      return res.status(400).json({ error: 'Longitude must be between -180 and 180' });
    }

    if (isNaN(parsedMaxDistance) || parsedMaxDistance < 1 || parsedMaxDistance > 50000) {
      return res.status(400).json({ error: 'maxDistance must be between 1 and 50000 meters' });
    }

    await connectDB();
    const bins = await Bin.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parsedLng, parsedLat] },
          $maxDistance: parsedMaxDistance
        }
      }
    }).lean();

    res.json(bins);
  } catch (error) {
    logger.error('Error fetching nearby bins:', error.message);
    res.status(500).json({ error: 'Failed to fetch nearby bins' });
  }
});

module.exports = router;
