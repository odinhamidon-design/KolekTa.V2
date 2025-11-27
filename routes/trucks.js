const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { trucksStorage, initialize } = require('../data/storage');

// Ensure storage is initialized on each request (for Vercel serverless)
initialize();

// Mock trucks storage (for reference only - now using persistent storage)
const defaultTrucks = [
  {
    _id: '1',
    truckId: 'TRUCK-001',
    plateNumber: 'ABC-1234',
    model: 'Isuzu Elf',
    capacity: 1000,
    status: 'available',
    assignedDriver: null,
    lastMaintenance: '2024-01-15',
    nextMaintenance: '2024-04-15',
    fuelLevel: 85,
    mileage: 15420,
    notes: 'Good condition'
  },
  {
    _id: '2',
    truckId: 'TRUCK-002',
    plateNumber: 'XYZ-5678',
    model: 'Mitsubishi Canter',
    capacity: 1200,
    status: 'in-use',
    assignedDriver: 'driver1',
    lastMaintenance: '2024-02-01',
    nextMaintenance: '2024-05-01',
    fuelLevel: 60,
    mileage: 22350,
    notes: 'Assigned to Juan Dela Cruz'
  }
];

// Get all trucks
router.get('/', authenticateToken, async (req, res) => {
  try {
    const trucks = trucksStorage.getAll();
    res.json(trucks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single truck
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const truck = trucksStorage.findById(req.params.id);
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
    const { truckId, plateNumber, model, capacity, notes } = req.body;
    const allTrucks = trucksStorage.getAll();
    
    // Check if truckId exists
    if (allTrucks.find(t => t.truckId === truckId)) {
      return res.status(400).json({ error: 'Truck ID already exists' });
    }
    
    // Check if plate number exists
    if (allTrucks.find(t => t.plateNumber === plateNumber)) {
      return res.status(400).json({ error: 'Plate number already exists' });
    }
    
    const newTruck = {
      _id: String(Date.now()),
      truckId,
      plateNumber: plateNumber.toUpperCase(),
      model: model || '',
      capacity: capacity || 1000,
      status: 'available',
      assignedDriver: null,
      lastMaintenance: null,
      nextMaintenance: null,
      fuelLevel: 100,
      mileage: 0,
      notes: notes || ''
    };
    
    trucksStorage.add(newTruck);
    res.status(201).json(newTruck);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update truck (Admin only)
router.put('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const truck = trucksStorage.findById(req.params.id);
    if (!truck) {
      return res.status(404).json({ error: 'Truck not found' });
    }
    
    const { plateNumber, model, capacity, status, assignedDriver, lastMaintenance, nextMaintenance, fuelLevel, mileage, notes } = req.body;
    const allTrucks = trucksStorage.getAll();
    
    // Check if plate number is taken by another truck
    if (plateNumber && allTrucks.find(t => t.plateNumber === plateNumber.toUpperCase() && t._id !== truck._id)) {
      return res.status(400).json({ error: 'Plate number already exists' });
    }
    
    const updates = {};
    if (plateNumber) updates.plateNumber = plateNumber.toUpperCase();
    if (model !== undefined) updates.model = model;
    if (capacity !== undefined) updates.capacity = capacity;
    if (status) updates.status = status;
    if (assignedDriver !== undefined) updates.assignedDriver = assignedDriver;
    if (lastMaintenance !== undefined) updates.lastMaintenance = lastMaintenance;
    if (nextMaintenance !== undefined) updates.nextMaintenance = nextMaintenance;
    if (fuelLevel !== undefined) updates.fuelLevel = fuelLevel;
    if (mileage !== undefined) updates.mileage = mileage;
    if (notes !== undefined) updates.notes = notes;
    
    trucksStorage.update(truck._id, updates);
    const updatedTruck = trucksStorage.findById(truck._id);
    res.json(updatedTruck);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete truck (Admin only)
router.delete('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const truck = trucksStorage.findById(req.params.id);
    if (!truck) {
      return res.status(404).json({ error: 'Truck not found' });
    }
    
    // Check if truck is in use
    if (truck.status === 'in-use') {
      return res.status(400).json({ error: 'Cannot delete truck that is currently in use' });
    }
    
    trucksStorage.delete(truck._id);
    res.json({ message: 'Truck deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get available trucks
router.get('/status/available', authenticateToken, async (req, res) => {
  try {
    const allTrucks = trucksStorage.getAll();
    const available = allTrucks.filter(t => t.status === 'available');
    res.json(available);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
