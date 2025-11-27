const express = require('express');
const router = express.Router();
const Bin = require('../models/Bin');

// Get all bins
router.get('/', async (req, res) => {
  try {
    const bins = await Bin.find();
    res.json(bins);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new bin
router.post('/', async (req, res) => {
  try {
    const bin = new Bin(req.body);
    await bin.save();
    res.status(201).json(bin);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update bin
router.put('/:id', async (req, res) => {
  try {
    const bin = await Bin.findByIdAndUpdate(req.id.params.id, req.body, { new: true });
    res.json(bin);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get bins by proximity
router.get('/nearby', async (req, res) => {
  try {
    const { lng, lat, maxDistance = 5000 } = req.query;
    const bins = await Bin.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(maxDistance)
        }
      }
    });
    res.json(bins);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
