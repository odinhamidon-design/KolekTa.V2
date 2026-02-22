const express = require('express');
const router = express.Router();
const { authenticateToken: auth } = require('../middleware/auth');
const { trucksStorage } = require('../data/storage');
const logger = require('../lib/logger');

// Check if using MongoDB
const useMockAuth = process.env.USE_MOCK_AUTH === 'true';
let Truck;
if (!useMockAuth) {
  try {
    Truck = require('../models/Truck');
  } catch (e) {
    logger.warn('Truck model not available');
  }
}

// In-memory fuel logs storage with mock data
let fuelLogs = [
  // Mock refuel logs
  {
    _id: 'log-mock-1',
    truckId: 'TRK-001',
    type: 'refuel',
    litersAdded: 45,
    pricePerLiter: 65.50,
    totalCost: 2947.50,
    gasStation: 'Petron Mati City',
    odometerReading: 45230,
    fuelLevelBefore: 15,
    fuelLevelAfter: 90,
    recordedBy: 'admin',
    notes: 'Full tank refuel before morning route',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
  },
  {
    _id: 'log-mock-2',
    truckId: 'TRK-002',
    type: 'refuel',
    litersAdded: 38,
    pricePerLiter: 65.50,
    totalCost: 2489.00,
    gasStation: 'Shell Dahican',
    odometerReading: 32150,
    fuelLevelBefore: 22,
    fuelLevelAfter: 85,
    recordedBy: 'admin',
    notes: 'Regular weekly refuel',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
  },
  {
    _id: 'log-mock-3',
    truckId: 'TRK-001',
    type: 'refuel',
    litersAdded: 50,
    pricePerLiter: 64.75,
    totalCost: 3237.50,
    gasStation: 'Caltex Mati',
    odometerReading: 45050,
    fuelLevelBefore: 8,
    fuelLevelAfter: 92,
    recordedBy: 'admin',
    notes: 'Emergency refuel - low fuel warning',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
  },
  // Mock consumption logs
  {
    _id: 'log-mock-4',
    truckId: 'TRK-001',
    type: 'consumption',
    litersConsumed: 12.5,
    distanceTraveled: 45.2,
    averageSpeed: 28,
    routeId: 'RT-001',
    routeName: 'Barangay Central Collection',
    fuelLevelBefore: 90,
    fuelLevelAfter: 69,
    estimationFactors: { speedFactor: 1.3, loadFactor: 1.15, baseRate: 25 },
    recordedBy: 'driver1',
    notes: 'Morning route completed',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
  },
  {
    _id: 'log-mock-5',
    truckId: 'TRK-002',
    type: 'consumption',
    litersConsumed: 18.3,
    distanceTraveled: 62.8,
    averageSpeed: 35,
    routeId: 'RT-002',
    routeName: 'Dahican Coastal Route',
    fuelLevelBefore: 85,
    fuelLevelAfter: 54,
    estimationFactors: { speedFactor: 1.1, loadFactor: 1.2, baseRate: 25 },
    recordedBy: 'vience',
    notes: 'Full route with extra stops',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
  },
  {
    _id: 'log-mock-6',
    truckId: 'TRK-001',
    type: 'consumption',
    litersConsumed: 8.7,
    distanceTraveled: 32.1,
    averageSpeed: 42,
    routeId: 'RT-003',
    routeName: 'Market Area Collection',
    fuelLevelBefore: 69,
    fuelLevelAfter: 54,
    estimationFactors: { speedFactor: 1.1, loadFactor: 1.1, baseRate: 25 },
    recordedBy: 'driver1',
    notes: 'Afternoon collection',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
  },
  {
    _id: 'log-mock-7',
    truckId: 'TRK-003',
    type: 'refuel',
    litersAdded: 42,
    pricePerLiter: 66.00,
    totalCost: 2772.00,
    gasStation: 'Phoenix Mati',
    odometerReading: 28450,
    fuelLevelBefore: 18,
    fuelLevelAfter: 88,
    recordedBy: 'admin',
    notes: 'Weekly scheduled refuel',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
  },
  {
    _id: 'log-mock-8',
    truckId: 'TRK-003',
    type: 'consumption',
    litersConsumed: 15.2,
    distanceTraveled: 52.4,
    averageSpeed: 32,
    routeId: 'RT-004',
    routeName: 'Residential Zone A',
    fuelLevelBefore: 88,
    fuelLevelAfter: 62,
    estimationFactors: { speedFactor: 1.2, loadFactor: 1.15, baseRate: 25 },
    recordedBy: 'Odin',
    notes: 'Heavy load day',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4 days ago
  }
];

/**
 * FUEL ESTIMATION ALGORITHM
 */
function calculateFuelConsumption(params) {
  const {
    distance,
    averageSpeed,
    stopCount = 0,
    idleTimeMinutes = 0,
    loadPercentage = 50,
    baseConsumption = 25,
    truckType = 'garbage'
  } = params;

  const baseRates = {
    garbage: 25,
    compactor: 28,
    pickup: 15,
    mini: 12
  };

  const baseRate = baseRates[truckType] || baseConsumption;

  let speedFactor = 1.0;
  if (averageSpeed < 30) {
    speedFactor = 1.3;
  } else if (averageSpeed < 50) {
    speedFactor = 1.1;
  } else if (averageSpeed <= 70) {
    speedFactor = 1.0;
  } else if (averageSpeed <= 90) {
    speedFactor = 1.15;
  } else {
    speedFactor = 1.3;
  }

  const loadFactor = 0.85 + (loadPercentage / 100) * 0.4;
  const stopConsumption = stopCount * 0.05;
  const idleConsumption = (idleTimeMinutes / 60) * 2.5;
  const distanceConsumption = (distance / 100) * baseRate * speedFactor * loadFactor;
  const totalConsumption = distanceConsumption + stopConsumption + idleConsumption;
  const efficiency = distance > 0 ? distance / totalConsumption : 0;

  return {
    totalLiters: Math.round(totalConsumption * 100) / 100,
    distanceConsumption: Math.round(distanceConsumption * 100) / 100,
    stopConsumption: Math.round(stopConsumption * 100) / 100,
    idleConsumption: Math.round(idleConsumption * 100) / 100,
    efficiency: Math.round(efficiency * 100) / 100,
    consumptionRate: Math.round((totalConsumption / distance) * 100 * 100) / 100,
    factors: {
      speedFactor: Math.round(speedFactor * 100) / 100,
      loadFactor: Math.round(loadFactor * 100) / 100,
      baseRate
    }
  };
}

// POST /api/fuel/estimate
router.post('/estimate', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'driver') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { truckId, distance, averageSpeed, stopCount, idleTimeMinutes, loadPercentage } = req.body;

    if (distance !== undefined && distance < 0) {
      return res.status(400).json({ error: 'Distance cannot be negative' });
    }

    if (averageSpeed !== undefined && averageSpeed < 0) {
      return res.status(400).json({ error: 'Average speed cannot be negative' });
    }

    let baseConsumption = 25;
    if (truckId) {
      const truck = trucksStorage.findById(truckId);
      if (truck) {
        baseConsumption = truck.averageFuelConsumption || 25;
      }
    }

    const estimation = calculateFuelConsumption({
      distance: distance || 0,
      averageSpeed: averageSpeed || 30,
      stopCount: stopCount || 0,
      idleTimeMinutes: idleTimeMinutes || 0,
      loadPercentage: loadPercentage || 50,
      baseConsumption
    });

    res.json({
      success: true,
      estimation,
      input: { distance, averageSpeed, stopCount, idleTimeMinutes, loadPercentage }
    });
  } catch (error) {
    logger.error('Error:', error);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// POST /api/fuel/refuel
router.post('/refuel', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { truckId, litersAdded, pricePerLiter, gasStation, odometerReading, notes } = req.body;

    if (!truckId || !litersAdded) {
      return res.status(400).json({ error: 'Truck ID and liters added are required' });
    }

    if (litersAdded <= 0) {
      return res.status(400).json({ error: 'Liters added must be greater than 0' });
    }

    const truck = trucksStorage.findById(truckId);
    if (!truck) {
      return res.status(404).json({ error: 'Truck not found' });
    }

    const totalCost = litersAdded * (pricePerLiter || 0);
    const fuelLevelBefore = truck.fuelLevel || 50;
    const tankCapacity = truck.fuelTankCapacity || 60;
    const currentLiters = (fuelLevelBefore / 100) * tankCapacity;
    const newLiters = Math.min(currentLiters + litersAdded, tankCapacity);
    const fuelLevelAfter = Math.round((newLiters / tankCapacity) * 100);

    const fuelLog = {
      _id: `log-${Date.now()}`,
      truckId,
      type: 'refuel',
      litersAdded,
      pricePerLiter: pricePerLiter || 0,
      totalCost,
      gasStation,
      odometerReading,
      fuelLevelBefore,
      fuelLevelAfter,
      recordedBy: req.user.username,
      notes,
      createdAt: new Date()
    };

    fuelLogs.push(fuelLog);

    // Update truck
    trucksStorage.update(truckId, {
      fuelLevel: fuelLevelAfter,
      lastRefuelDate: new Date(),
      lastRefuelLiters: litersAdded,
      totalFuelCost: (truck.totalFuelCost || 0) + totalCost,
      mileage: odometerReading || truck.mileage
    });

    res.json({
      success: true,
      message: 'Refuel logged successfully',
      fuelLog,
      truck: {
        truckId: truck.truckId,
        fuelLevel: fuelLevelAfter,
        totalFuelCost: (truck.totalFuelCost || 0) + totalCost
      }
    });
  } catch (error) {
    logger.error('Error:', error);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// POST /api/fuel/consumption
router.post('/consumption', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'driver') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { truckId, routeId, routeName, distance, averageSpeed, stopCount, idleTimeMinutes, loadPercentage, notes } = req.body;

    if (!truckId || !distance) {
      return res.status(400).json({ error: 'Truck ID and distance are required' });
    }

    if (distance <= 0) {
      return res.status(400).json({ error: 'Distance must be greater than 0' });
    }

    if (averageSpeed !== undefined && averageSpeed < 0) {
      return res.status(400).json({ error: 'Average speed cannot be negative' });
    }

    const truck = trucksStorage.findById(truckId);
    if (!truck) {
      return res.status(404).json({ error: 'Truck not found' });
    }

    const estimation = calculateFuelConsumption({
      distance,
      averageSpeed: averageSpeed || 30,
      stopCount: stopCount || 0,
      idleTimeMinutes: idleTimeMinutes || 0,
      loadPercentage: loadPercentage || 50,
      baseConsumption: truck.averageFuelConsumption || 25
    });

    const fuelLevelBefore = truck.fuelLevel || 50;
    const tankCapacity = truck.fuelTankCapacity || 60;
    const litersConsumed = estimation.totalLiters;
    const currentLiters = (fuelLevelBefore / 100) * tankCapacity;
    const newLiters = Math.max(currentLiters - litersConsumed, 0);
    const fuelLevelAfter = Math.round((newLiters / tankCapacity) * 100);

    const fuelLog = {
      _id: `log-${Date.now()}`,
      truckId,
      type: 'consumption',
      litersConsumed,
      distanceTraveled: distance,
      averageSpeed: averageSpeed || 30,
      routeId,
      routeName,
      fuelLevelBefore,
      fuelLevelAfter,
      estimationFactors: estimation.factors,
      recordedBy: req.user.username,
      notes,
      createdAt: new Date()
    };

    fuelLogs.push(fuelLog);

    // Update truck
    trucksStorage.update(truckId, {
      fuelLevel: fuelLevelAfter,
      totalFuelConsumed: (truck.totalFuelConsumed || 0) + litersConsumed,
      mileage: (truck.mileage || 0) + distance
    });

    res.json({
      success: true,
      message: 'Fuel consumption logged successfully',
      fuelLog,
      estimation,
      truck: {
        truckId: truck.truckId,
        fuelLevel: fuelLevelAfter,
        totalFuelConsumed: (truck.totalFuelConsumed || 0) + litersConsumed
      }
    });
  } catch (error) {
    logger.error('Error:', error);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// GET /api/fuel/logs/:truckId
router.get('/logs/:truckId', auth, async (req, res) => {
  try {
    const { truckId } = req.params;
    const { type, limit = 50 } = req.query;

    let logs = fuelLogs.filter(l => l.truckId === truckId);
    if (type) {
      logs = logs.filter(l => l.type === type);
    }
    logs = logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, parseInt(limit));

    res.json(logs);
  } catch (error) {
    logger.error('Error:', error);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// GET /api/fuel/stats/:truckId
router.get('/stats/:truckId', auth, async (req, res) => {
  try {
    const { truckId } = req.params;
    const { days = 30 } = req.query;

    const truck = trucksStorage.findById(truckId);
    if (!truck) {
      return res.status(404).json({ error: 'Truck not found' });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const logs = fuelLogs.filter(l =>
      l.truckId === truckId && new Date(l.createdAt) >= startDate
    ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const refuelLogs = logs.filter(l => l.type === 'refuel');
    const consumptionLogs = logs.filter(l => l.type === 'consumption');

    const stats = {
      truck: {
        truckId: truck.truckId,
        plateNumber: truck.plateNumber,
        model: truck.model,
        fuelLevel: truck.fuelLevel || 50,
        tankCapacity: truck.fuelTankCapacity || 60,
        currentLiters: Math.round(((truck.fuelLevel || 50) / 100) * (truck.fuelTankCapacity || 60) * 100) / 100,
        fuelType: truck.fuelType || 'diesel',
        averageFuelConsumption: truck.averageFuelConsumption || 25,
        totalFuelConsumed: truck.totalFuelConsumed || 0,
        totalFuelCost: truck.totalFuelCost || 0,
        mileage: truck.mileage || 0
      },
      period: { days: parseInt(days), startDate, endDate: new Date() },
      refueling: {
        count: refuelLogs.length,
        totalLiters: Math.round(refuelLogs.reduce((sum, l) => sum + (l.litersAdded || 0), 0) * 100) / 100,
        totalCost: Math.round(refuelLogs.reduce((sum, l) => sum + (l.totalCost || 0), 0) * 100) / 100
      },
      consumption: {
        count: consumptionLogs.length,
        totalLiters: Math.round(consumptionLogs.reduce((sum, l) => sum + (l.litersConsumed || 0), 0) * 100) / 100,
        totalDistance: Math.round(consumptionLogs.reduce((sum, l) => sum + (l.distanceTraveled || 0), 0) * 100) / 100
      },
      recentLogs: logs.slice(0, 10)
    };

    res.json(stats);
  } catch (error) {
    logger.error('Error:', error);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// GET /api/fuel/all-logs - Get all fuel logs
router.get('/all-logs', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const { type, limit = 50 } = req.query;
    let logs = [...fuelLogs];

    if (type) {
      logs = logs.filter(l => l.type === type);
    }

    logs = logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, parseInt(limit));

    res.json({
      logs,
      summary: {
        totalRefuels: fuelLogs.filter(l => l.type === 'refuel').length,
        totalConsumptions: fuelLogs.filter(l => l.type === 'consumption').length,
        totalLitersRefueled: Math.round(fuelLogs.filter(l => l.type === 'refuel').reduce((sum, l) => sum + (l.litersAdded || 0), 0) * 100) / 100,
        totalLitersConsumed: Math.round(fuelLogs.filter(l => l.type === 'consumption').reduce((sum, l) => sum + (l.litersConsumed || 0), 0) * 100) / 100,
        totalCost: Math.round(fuelLogs.filter(l => l.type === 'refuel').reduce((sum, l) => sum + (l.totalCost || 0), 0) * 100) / 100,
        totalDistance: Math.round(fuelLogs.filter(l => l.type === 'consumption').reduce((sum, l) => sum + (l.distanceTraveled || 0), 0) * 100) / 100
      }
    });
  } catch (error) {
    logger.error('Error:', error);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// GET /api/fuel/all-stats
router.get('/all-stats', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    let trucks = [];

    // Try MongoDB first, then fall back to JSON storage
    if (!useMockAuth && Truck) {
      trucks = await Truck.find({}).lean();
    }

    // Fall back to JSON storage or use mock data if no trucks
    if (trucks.length === 0) {
      trucks = trucksStorage.getAll();
    }

    // If still no trucks, return mock truck data for demo
    if (trucks.length === 0) {
      trucks = [
        {
          truckId: 'TRK-001',
          plateNumber: 'ABC-1234',
          model: 'Isuzu Elf',
          fuelLevel: 65,
          fuelTankCapacity: 60,
          fuelType: 'diesel',
          averageFuelConsumption: 25,
          totalFuelConsumed: 245.5,
          totalFuelCost: 15890,
          mileage: 12450,
          lastRefuelDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          assignedDriver: 'driver1',
          status: 'in-use'
        },
        {
          truckId: 'TRK-002',
          plateNumber: 'XYZ-5678',
          model: 'Mitsubishi Canter',
          fuelLevel: 42,
          fuelTankCapacity: 65,
          fuelType: 'diesel',
          averageFuelConsumption: 28,
          totalFuelConsumed: 312.8,
          totalFuelCost: 20450,
          mileage: 18320,
          lastRefuelDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          assignedDriver: 'vience',
          status: 'in-use'
        },
        {
          truckId: 'TRK-003',
          plateNumber: 'DEF-9012',
          model: 'Hino 300',
          fuelLevel: 18,
          fuelTankCapacity: 70,
          fuelType: 'diesel',
          averageFuelConsumption: 30,
          totalFuelConsumed: 189.2,
          totalFuelCost: 12350,
          mileage: 8750,
          lastRefuelDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          assignedDriver: 'Odin',
          status: 'available'
        }
      ];
    }

    const stats = trucks.map(truck => ({
      truckId: truck.truckId,
      plateNumber: truck.plateNumber,
      model: truck.model,
      fuelLevel: truck.fuelLevel || 50,
      tankCapacity: truck.fuelTankCapacity || 60,
      currentLiters: Math.round(((truck.fuelLevel || 50) / 100) * (truck.fuelTankCapacity || 60) * 100) / 100,
      fuelType: truck.fuelType || 'diesel',
      averageFuelConsumption: truck.averageFuelConsumption || 25,
      totalFuelConsumed: truck.totalFuelConsumed || 0,
      totalFuelCost: truck.totalFuelCost || 0,
      mileage: truck.mileage || 0,
      lastRefuelDate: truck.lastRefuelDate,
      assignedDriver: truck.assignedDriver,
      status: truck.status
    }));

    const fleetStats = {
      totalTrucks: trucks.length,
      totalFuelConsumed: Math.round(stats.reduce((sum, t) => sum + t.totalFuelConsumed, 0) * 100) / 100,
      totalFuelCost: Math.round(stats.reduce((sum, t) => sum + t.totalFuelCost, 0) * 100) / 100,
      totalMileage: Math.round(stats.reduce((sum, t) => sum + t.mileage, 0) * 100) / 100,
      avgFuelLevel: Math.round(stats.reduce((sum, t) => sum + t.fuelLevel, 0) / trucks.length) || 0,
      trucksNeedingRefuel: stats.filter(t => t.fuelLevel < 25).length
    };

    res.json({ trucks: stats, fleet: fleetStats });
  } catch (error) {
    logger.error('Fuel stats error:', error);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

module.exports = router;
