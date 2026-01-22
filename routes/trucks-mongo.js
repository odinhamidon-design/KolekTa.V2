const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const connectDB = require('../lib/mongodb');
const Truck = require('../models/Truck');

// Helper function to build query for finding truck by id or truckId
function buildTruckQuery(id) {
  // Only add _id to query if it's a valid ObjectId
  if (mongoose.Types.ObjectId.isValid(id)) {
    return { $or: [{ _id: id }, { truckId: id }] };
  }
  return { truckId: id };
}

// Get all trucks
router.get('/', authenticateToken, async (req, res) => {
  try {
    await connectDB();
    const trucks = await Truck.find({});
    res.json(trucks);
  } catch (error) {
    console.error('Error getting trucks:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single truck
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    await connectDB();
    const truck = await Truck.findOne(buildTruckQuery(req.params.id));
    if (!truck) {
      return res.status(404).json({ error: 'Truck not found' });
    }
    res.json(truck);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new truck (Admin only)
router.post('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    await connectDB();
    const { truckId, plateNumber, model, capacity, notes } = req.body;
    
    // Check if truckId exists
    const existingTruck = await Truck.findOne({ truckId });
    if (existingTruck) {
      return res.status(400).json({ error: 'Truck ID already exists' });
    }
    
    // Check if plate number exists
    const existingPlate = await Truck.findOne({ plateNumber: plateNumber.toUpperCase() });
    if (existingPlate) {
      return res.status(400).json({ error: 'Plate number already exists' });
    }
    
    const newTruck = new Truck({
      truckId,
      plateNumber: plateNumber.toUpperCase(),
      model: model || '',
      capacity: capacity || 1000,
      status: 'available',
      assignedDriver: null,
      fuelLevel: 100,
      mileage: 0,
      notes: notes || ''
    });
    
    await newTruck.save();
    console.log('✅ Truck created in MongoDB:', truckId);
    res.status(201).json(newTruck);
  } catch (error) {
    console.error('Error creating truck:', error);
    res.status(400).json({ error: error.message });
  }
});

// Update truck (Admin only)
router.put('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    await connectDB();
    const truck = await Truck.findOne(buildTruckQuery(req.params.id));

    if (!truck) {
      return res.status(404).json({ error: 'Truck not found' });
    }
    
    const { plateNumber, model, capacity, status, assignedDriver, lastMaintenance, nextMaintenance, fuelLevel, mileage, notes } = req.body;
    
    // Check if plate number is taken by another truck
    if (plateNumber) {
      const existingPlate = await Truck.findOne({ 
        plateNumber: plateNumber.toUpperCase(),
        _id: { $ne: truck._id }
      });
      if (existingPlate) {
        return res.status(400).json({ error: 'Plate number already exists' });
      }
      truck.plateNumber = plateNumber.toUpperCase();
    }
    
    if (model !== undefined) truck.model = model;
    if (capacity !== undefined) truck.capacity = capacity;
    if (status) truck.status = status;
    if (assignedDriver !== undefined) truck.assignedDriver = assignedDriver;
    if (lastMaintenance !== undefined) truck.lastMaintenance = lastMaintenance;
    if (nextMaintenance !== undefined) truck.nextMaintenance = nextMaintenance;
    if (fuelLevel !== undefined) truck.fuelLevel = fuelLevel;
    if (mileage !== undefined) truck.mileage = mileage;
    if (notes !== undefined) truck.notes = notes;
    
    await truck.save();
    console.log('✅ Truck updated in MongoDB:', truck.truckId);
    res.json(truck);
  } catch (error) {
    console.error('Error updating truck:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete truck (Admin only)
router.delete('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    await connectDB();
    const truck = await Truck.findOne(buildTruckQuery(req.params.id));

    if (!truck) {
      return res.status(404).json({ error: 'Truck not found' });
    }
    
    // Check if truck is in use
    if (truck.status === 'in-use') {
      return res.status(400).json({ error: 'Cannot delete truck that is currently in use' });
    }
    
    await Truck.deleteOne({ _id: truck._id });
    console.log('✅ Truck deleted from MongoDB:', truck.truckId);
    res.json({ message: 'Truck deleted successfully' });
  } catch (error) {
    console.error('Error deleting truck:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get available trucks
router.get('/status/available', authenticateToken, async (req, res) => {
  try {
    await connectDB();
    const available = await Truck.find({ status: 'available' });
    res.json(available);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
