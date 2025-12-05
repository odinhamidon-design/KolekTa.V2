const express = require('express');
const router = express.Router();
const { authenticateToken: auth } = require('../middleware/auth');
const { trucksStorage } = require('../data/storage');

// In-memory fuel logs storage
let fuelLogs = [];

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
    const { truckId, distance, averageSpeed, stopCount, idleTimeMinutes, loadPercentage } = req.body;

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
    res.status(500).json({ error: error.message });
  }
});

// POST /api/fuel/refuel
router.post('/refuel', auth, async (req, res) => {
  try {
    const { truckId, litersAdded, pricePerLiter, gasStation, odometerReading, notes } = req.body;

    if (!truckId || !litersAdded) {
      return res.status(400).json({ error: 'Truck ID and liters added are required' });
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
    res.status(500).json({ error: error.message });
  }
});

// POST /api/fuel/consumption
router.post('/consumption', auth, async (req, res) => {
  try {
    const { truckId, routeId, routeName, distance, averageSpeed, stopCount, idleTimeMinutes, loadPercentage, notes } = req.body;

    if (!truckId || !distance) {
      return res.status(400).json({ error: 'Truck ID and distance are required' });
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
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
  }
});

// GET /api/fuel/all-stats
router.get('/all-stats', auth, async (req, res) => {
  try {
    const trucks = trucksStorage.getAll();

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
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
