const express = require('express');
const router = express.Router();
const Collection = require('../models/Collection');
const Bin = require('../models/Bin');

// Get all collections
router.get('/', async (req, res) => {
  try {
    const collections = await Collection.find().populate('bin route');
    res.json(collections);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Record new collection
router.post('/', async (req, res) => {
  try {
    const collection = new Collection(req.body);
    await collection.save();
    
    // Update bin status
    await Bin.findByIdAndUpdate(req.body.bin, {
      currentLevel: 0,
      status: 'empty',
      lastCollection: new Date()
    });
    
    res.status(201).json(collection);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get collection statistics
router.get('/stats', async (req, res) => {
  try {
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
    res.json(stats[0] || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
