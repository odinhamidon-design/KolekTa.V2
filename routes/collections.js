const express = require('express');
const router = express.Router();
const Collection = require('../models/Collection');
const Bin = require('../models/Bin');
const { authenticateToken } = require('../middleware/auth');
const connectDB = require('../lib/mongodb');

// Get all collections (authenticated)
router.get('/', authenticateToken, async (req, res) => {
  try {
    await connectDB();
    const collections = await Collection.find()
      .populate('bin route')
      .sort({ collectedAt: -1 })
      .lean();
    res.json(collections);
  } catch (error) {
    console.error('Error fetching collections:', error.message);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

// Record new collection (driver or admin)
router.post('/', authenticateToken, async (req, res) => {
  try {
    await connectDB();

    // Add collector info from authenticated user
    const collectionData = {
      ...req.body,
      collectorId: req.user.userId || req.user.username,
      collectorName: req.user.username
    };

    const collection = new Collection(collectionData);
    await collection.save();

    // Update bin status if bin ID provided
    if (req.body.bin) {
      await Bin.findByIdAndUpdate(req.body.bin, {
        currentLevel: 0,
        status: 'empty',
        lastCollection: new Date()
      });
    }

    res.status(201).json(collection);
  } catch (error) {
    console.error('Error recording collection:', error.message);
    res.status(400).json({ error: 'Failed to record collection' });
  }
});

// Get collection statistics (admin only)
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    await connectDB();
    const stats = await Collection.aggregate([
      {
        $group: {
          _id: null,
          totalCollections: { $sum: 1 },
          totalWaste: { $sum: '$wasteAmount' },
          avgWaste: { $avg: '$wasteAmount' }
        }
      }
    ]);
    res.json(stats[0] || { totalCollections: 0, totalWaste: 0, avgWaste: 0 });
  } catch (error) {
    console.error('Error fetching collection stats:', error.message);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get collections by date range (admin only)
router.get('/range', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    await connectDB();
    const collections = await Collection.find({
      collectedAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    })
    .populate('bin route')
    .sort({ collectedAt: -1 })
    .lean();

    res.json(collections);
  } catch (error) {
    console.error('Error fetching collections by range:', error.message);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

module.exports = router;
