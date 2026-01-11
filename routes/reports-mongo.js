const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Route = require('../models/Route');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const FuelLog = require('../models/FuelLog');
const Truck = require('../models/Truck');
const Schedule = require('../models/Schedule');

// Collection Summary Report
router.get('/collection-summary', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    // Get all routes for total count
    const totalRoutes = await Route.countDocuments();

    // Get completed routes within date range
    const completedRoutes = await Route.find({
      status: 'completed',
      completedAt: { $gte: start, $lte: end }
    }).lean();

    // Calculate summary
    const totalDistance = completedRoutes.reduce((sum, r) => {
      const dist = r.tripStats?.distanceTraveled || r.distance || 0;
      return sum + dist;
    }, 0);

    const totalStops = completedRoutes.reduce((sum, r) => {
      return sum + (r.tripStats?.stopsCompleted || r.path?.coordinates?.length || 0);
    }, 0);

    const totalFuel = completedRoutes.reduce((sum, r) => {
      return sum + (r.tripStats?.fuelConsumed || 0);
    }, 0);

    // Aggregate by route
    const byRouteAgg = await Route.aggregate([
      {
        $match: {
          status: 'completed',
          completedAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$routeId',
          routeName: { $first: '$name' },
          completions: { $sum: 1 },
          totalDistance: { $sum: { $ifNull: ['$tripStats.distanceTraveled', '$distance'] } },
          totalStops: { $sum: { $ifNull: ['$tripStats.stopsCompleted', 0] } }
        }
      },
      {
        $project: {
          routeId: '$_id',
          routeName: 1,
          completions: 1,
          totalDistance: { $round: ['$totalDistance', 2] },
          totalStops: 1,
          avgCompletionTime: { $literal: 0 }
        }
      },
      { $sort: { completions: -1 } }
    ]);

    // Aggregate by day
    const dailyAgg = await Route.aggregate([
      {
        $match: {
          status: 'completed',
          completedAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
          completions: { $sum: 1 },
          distance: { $sum: { $ifNull: ['$tripStats.distanceTraveled', '$distance'] } }
        }
      },
      {
        $project: {
          date: '$_id',
          completions: 1,
          distance: { $round: ['$distance', 2] }
        }
      },
      { $sort: { date: 1 } }
    ]);

    res.json({
      period: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      },
      summary: {
        totalRoutes,
        completedRoutes: completedRoutes.length,
        completionRate: totalRoutes > 0 ? Math.round((completedRoutes.length / totalRoutes) * 1000) / 10 : 0,
        totalDistance: Math.round(totalDistance * 100) / 100,
        totalStops,
        totalFuelConsumed: Math.round(totalFuel * 100) / 100
      },
      byRoute: byRouteAgg,
      daily: dailyAgg
    });
  } catch (error) {
    console.error('Error generating collection summary:', error);
    res.status(500).json({ error: error.message });
  }
});

// Driver Performance Report
router.get('/driver-performance', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    // Get all drivers
    const drivers = await User.find({ role: 'driver' }).lean();
    const driverMap = drivers.reduce((acc, d) => {
      acc[d.username] = d.fullName || d.username;
      return acc;
    }, {});

    // Aggregate by driver
    const driverAgg = await Route.aggregate([
      {
        $match: {
          status: 'completed',
          completedAt: { $gte: start, $lte: end },
          $or: [
            { completedBy: { $ne: null } },
            { assignedDriver: { $ne: null } }
          ]
        }
      },
      {
        $group: {
          _id: { $ifNull: ['$completedBy', '$assignedDriver'] },
          routesCompleted: { $sum: 1 },
          totalDistance: { $sum: { $ifNull: ['$tripStats.distanceTraveled', '$distance'] } },
          totalStops: { $sum: { $ifNull: ['$tripStats.stopsCompleted', 0] } },
          totalFuel: { $sum: { $ifNull: ['$tripStats.fuelConsumed', 0] } },
          avgSpeed: { $avg: { $ifNull: ['$tripStats.averageSpeed', 0] } }
        }
      },
      {
        $project: {
          username: '$_id',
          routesCompleted: 1,
          totalDistance: { $round: ['$totalDistance', 2] },
          totalStops: 1,
          avgSpeed: { $round: ['$avgSpeed', 1] },
          fuelEfficiency: {
            $cond: {
              if: { $gt: ['$totalFuel', 0] },
              then: { $round: [{ $divide: ['$totalDistance', '$totalFuel'] }, 2] },
              else: 0
            }
          }
        }
      },
      { $sort: { routesCompleted: -1 } }
    ]);

    // Enrich with full names
    const driversArray = driverAgg.map(d => ({
      ...d,
      fullName: driverMap[d.username] || d.username,
      avgCompletionTime: 0,
      routesByDay: {}
    }));

    // Find top performer
    const topPerformer = driversArray.length > 0 ? driversArray[0].username : null;

    res.json({
      period: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      },
      drivers: driversArray,
      summary: {
        totalDrivers: driversArray.length,
        avgRoutesPerDriver: driversArray.length > 0
          ? Math.round((driversArray.reduce((sum, d) => sum + d.routesCompleted, 0) / driversArray.length) * 10) / 10
          : 0,
        topPerformer
      }
    });
  } catch (error) {
    console.error('Error generating driver performance report:', error);
    res.status(500).json({ error: error.message });
  }
});

// Complaint Analytics Report
router.get('/complaint-analytics', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    // Get complaints within date range
    const complaints = await Complaint.find({
      createdAt: { $gte: start, $lte: end }
    }).lean();

    // Count by status
    const statusAgg = await Complaint.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const statusCounts = statusAgg.reduce((acc, s) => {
      acc[s._id] = s.count;
      return acc;
    }, { pending: 0, 'in-progress': 0, resolved: 0, closed: 0 });

    // Count by barangay
    const barangayAgg = await Complaint.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: '$barangay',
          count: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $in: ['$status', ['resolved', 'closed']] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } },
      { $project: { barangay: '$_id', count: 1, resolved: 1 } }
    ]);

    // Calculate average resolution time
    const resolvedComplaints = complaints.filter(c =>
      (c.status === 'resolved' || c.status === 'closed') && c.resolvedAt
    );

    let avgResolutionTime = 0;
    if (resolvedComplaints.length > 0) {
      const totalTime = resolvedComplaints.reduce((sum, c) => {
        const created = new Date(c.createdAt);
        const resolved = new Date(c.resolvedAt);
        return sum + (resolved - created);
      }, 0);
      avgResolutionTime = Math.round(totalTime / resolvedComplaints.length / (1000 * 60 * 60)); // hours
    }

    // Timeline aggregation
    const timelineAgg = await Complaint.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          submitted: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $in: ['$status', ['resolved', 'closed']] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', submitted: 1, resolved: 1 } }
    ]);

    res.json({
      period: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      },
      summary: {
        total: complaints.length,
        pending: statusCounts.pending || 0,
        inProgress: statusCounts['in-progress'] || 0,
        resolved: (statusCounts.resolved || 0) + (statusCounts.closed || 0),
        avgResolutionTime // in hours
      },
      byBarangay: barangayAgg,
      byStatus: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
      timeline: timelineAgg
    });
  } catch (error) {
    console.error('Error generating complaint analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Fuel Consumption Report
router.get('/fuel-consumption', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    // Get all fuel logs within date range
    const fuelLogs = await FuelLog.find({
      createdAt: { $gte: start, $lte: end }
    }).lean();

    // Calculate summary
    const consumptionLogs = fuelLogs.filter(l => l.type === 'consumption');
    const refuelLogs = fuelLogs.filter(l => l.type === 'refuel');

    const totalLitersConsumed = consumptionLogs.reduce((sum, l) => sum + (l.litersConsumed || 0), 0);
    const totalLitersRefueled = refuelLogs.reduce((sum, l) => sum + (l.litersAdded || 0), 0);
    const totalCost = refuelLogs.reduce((sum, l) => sum + (l.totalCost || 0), 0);
    const totalDistance = consumptionLogs.reduce((sum, l) => sum + (l.distanceTraveled || 0), 0);
    const avgEfficiency = totalLitersConsumed > 0 ? totalDistance / totalLitersConsumed : 0;
    const avgCostPerKm = totalDistance > 0 ? totalCost / totalDistance : 0;

    // Aggregate by truck
    const trucks = await Truck.find().lean();
    const truckMap = trucks.reduce((acc, t) => {
      acc[t.truckId] = { name: t.truckId, plateNumber: t.plateNumber };
      return acc;
    }, {});

    const byTruckAgg = await FuelLog.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: '$truckId',
          litersConsumed: {
            $sum: { $cond: [{ $eq: ['$type', 'consumption'] }, '$litersConsumed', 0] }
          },
          litersRefueled: {
            $sum: { $cond: [{ $eq: ['$type', 'refuel'] }, '$litersAdded', 0] }
          },
          totalCost: {
            $sum: { $cond: [{ $eq: ['$type', 'refuel'] }, '$totalCost', 0] }
          },
          distanceTraveled: {
            $sum: { $cond: [{ $eq: ['$type', 'consumption'] }, '$distanceTraveled', 0] }
          }
        }
      },
      { $sort: { litersConsumed: -1 } }
    ]);

    const byTruck = byTruckAgg.map(t => ({
      truckId: t._id,
      truckName: truckMap[t._id]?.name || t._id,
      plateNumber: truckMap[t._id]?.plateNumber || 'N/A',
      litersConsumed: Math.round(t.litersConsumed * 100) / 100,
      litersRefueled: Math.round(t.litersRefueled * 100) / 100,
      totalCost: Math.round(t.totalCost * 100) / 100,
      distanceTraveled: Math.round(t.distanceTraveled * 100) / 100,
      efficiency: t.litersConsumed > 0 ? Math.round((t.distanceTraveled / t.litersConsumed) * 100) / 100 : 0
    }));

    // Aggregate by driver
    const users = await User.find({ role: 'driver' }).lean();
    const userMap = users.reduce((acc, u) => {
      acc[u.username] = u.fullName || u.username;
      return acc;
    }, {});

    const byDriverAgg = await FuelLog.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end }, type: 'consumption', recordedBy: { $ne: null } } },
      {
        $group: {
          _id: '$recordedBy',
          litersConsumed: { $sum: '$litersConsumed' },
          distanceTraveled: { $sum: '$distanceTraveled' }
        }
      },
      { $sort: { litersConsumed: -1 } }
    ]);

    const byDriver = byDriverAgg.map(d => ({
      username: d._id,
      fullName: userMap[d._id] || d._id,
      litersConsumed: Math.round(d.litersConsumed * 100) / 100,
      distanceTraveled: Math.round(d.distanceTraveled * 100) / 100,
      efficiency: d.litersConsumed > 0 ? Math.round((d.distanceTraveled / d.litersConsumed) * 100) / 100 : 0
    }));

    // Aggregate by day
    const dailyAgg = await FuelLog.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          consumption: {
            $sum: { $cond: [{ $eq: ['$type', 'consumption'] }, '$litersConsumed', 0] }
          },
          refuel: {
            $sum: { $cond: [{ $eq: ['$type', 'refuel'] }, '$litersAdded', 0] }
          },
          cost: {
            $sum: { $cond: [{ $eq: ['$type', 'refuel'] }, '$totalCost', 0] }
          }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: '$_id',
          consumption: { $round: ['$consumption', 2] },
          refuel: { $round: ['$refuel', 2] },
          cost: { $round: ['$cost', 2] }
        }
      }
    ]);

    res.json({
      period: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      },
      summary: {
        totalLitersConsumed: Math.round(totalLitersConsumed * 100) / 100,
        totalLitersRefueled: Math.round(totalLitersRefueled * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        avgEfficiency: Math.round(avgEfficiency * 100) / 100,
        avgCostPerKm: Math.round(avgCostPerKm * 100) / 100,
        totalDistance: Math.round(totalDistance * 100) / 100
      },
      byTruck,
      byDriver,
      daily: dailyAgg
    });
  } catch (error) {
    console.error('Error generating fuel consumption report:', error);
    res.status(500).json({ error: error.message });
  }
});

// Schedule Adherence Report
router.get('/schedule-adherence', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    // Get all active schedules
    const schedules = await Schedule.find({ isActive: true }).lean();

    // Get completed routes within date range
    const completedRoutes = await Route.find({
      status: 'completed',
      completedAt: { $gte: start, $lte: end }
    }).lean();

    // Calculate expected collections for each day in range
    const dayMs = 24 * 60 * 60 * 1000;
    const dailyData = [];
    const scheduleStats = {};
    const driverStats = {};

    // Initialize schedule stats
    schedules.forEach(s => {
      scheduleStats[s.scheduleId] = {
        scheduleId: s.scheduleId,
        scheduleName: s.name,
        routeId: s.routeId,
        expectedCount: 0,
        completedCount: 0,
        assignedDriver: s.assignedDriver
      };
    });

    // Iterate through each day in range
    for (let d = new Date(start); d <= end; d = new Date(d.getTime() + dayMs)) {
      const dayOfWeek = d.getDay();
      const dateOfMonth = d.getDate();
      const dateStr = d.toISOString().split('T')[0];

      let scheduledCount = 0;
      let completedCount = 0;

      schedules.forEach(schedule => {
        let isActiveToday = false;

        switch (schedule.recurrenceType) {
          case 'daily':
            isActiveToday = true;
            break;
          case 'weekly':
            isActiveToday = (schedule.weeklyDays || []).includes(dayOfWeek);
            break;
          case 'monthly':
            isActiveToday = (schedule.monthlyDates || []).includes(dateOfMonth);
            break;
        }

        if (isActiveToday) {
          scheduledCount++;
          scheduleStats[schedule.scheduleId].expectedCount++;

          // Check if this route was completed on this day
          const wasCompleted = completedRoutes.some(r => {
            const completedDate = new Date(r.completedAt).toISOString().split('T')[0];
            return r.routeId === schedule.routeId && completedDate === dateStr;
          });

          if (wasCompleted) {
            completedCount++;
            scheduleStats[schedule.scheduleId].completedCount++;
          }

          // Track driver stats
          if (schedule.assignedDriver) {
            if (!driverStats[schedule.assignedDriver]) {
              driverStats[schedule.assignedDriver] = { assignedCount: 0, completedCount: 0 };
            }
            driverStats[schedule.assignedDriver].assignedCount++;
            if (wasCompleted) {
              driverStats[schedule.assignedDriver].completedCount++;
            }
          }
        }
      });

      dailyData.push({
        date: dateStr,
        scheduled: scheduledCount,
        completed: completedCount,
        missed: scheduledCount - completedCount
      });
    }

    // Calculate totals
    const totalScheduled = dailyData.reduce((sum, d) => sum + d.scheduled, 0);
    const totalCompleted = dailyData.reduce((sum, d) => sum + d.completed, 0);
    const adherenceRate = totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 1000) / 10 : 0;

    // Format schedule stats
    const bySchedule = Object.values(scheduleStats)
      .filter(s => s.expectedCount > 0)
      .map(s => ({
        ...s,
        adherenceRate: s.expectedCount > 0 ? Math.round((s.completedCount / s.expectedCount) * 1000) / 10 : 0
      }))
      .sort((a, b) => b.expectedCount - a.expectedCount);

    // Get driver full names
    const users = await User.find({ role: 'driver' }).lean();
    const userMap = users.reduce((acc, u) => {
      acc[u.username] = u.fullName || u.username;
      return acc;
    }, {});

    const byDriver = Object.entries(driverStats).map(([username, stats]) => ({
      username,
      fullName: userMap[username] || username,
      assignedCount: stats.assignedCount,
      completedCount: stats.completedCount,
      adherenceRate: stats.assignedCount > 0 ? Math.round((stats.completedCount / stats.assignedCount) * 1000) / 10 : 0
    })).sort((a, b) => b.assignedCount - a.assignedCount);

    res.json({
      period: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      },
      summary: {
        totalScheduled,
        totalCompleted,
        adherenceRate,
        missedCollections: totalScheduled - totalCompleted
      },
      bySchedule,
      byDriver,
      daily: dailyData
    });
  } catch (error) {
    console.error('Error generating schedule adherence report:', error);
    res.status(500).json({ error: error.message });
  }
});

// Fleet Utilization Report
router.get('/fleet-utilization', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    // Get all trucks
    const trucks = await Truck.find().lean();

    // Get completed routes within date range
    const completedRoutes = await Route.find({
      status: 'completed',
      completedAt: { $gte: start, $lte: end }
    }).lean();

    // Calculate days in period
    const daysInPeriod = Math.ceil((end - start) / (24 * 60 * 60 * 1000));

    // Aggregate by truck
    const truckStats = {};
    trucks.forEach(t => {
      truckStats[t.truckId] = {
        truckId: t.truckId,
        truckName: t.truckId,
        plateNumber: t.plateNumber,
        type: t.model || 'garbage',
        status: t.status,
        routesCompleted: 0,
        distanceTraveled: 0,
        fuelConsumed: 0,
        daysActive: new Set()
      };
    });

    // Count routes and distance per truck
    completedRoutes.forEach(route => {
      const truckId = route.assignedVehicle;
      if (truckId && truckStats[truckId]) {
        truckStats[truckId].routesCompleted++;
        truckStats[truckId].distanceTraveled += route.tripStats?.distanceTraveled || route.distance || 0;
        truckStats[truckId].fuelConsumed += route.tripStats?.fuelConsumed || 0;

        // Track unique active days
        const dateStr = new Date(route.completedAt).toISOString().split('T')[0];
        truckStats[truckId].daysActive.add(dateStr);
      }
    });

    // Format truck data
    const byTruck = Object.values(truckStats).map(t => ({
      truckId: t.truckId,
      truckName: t.truckName,
      plateNumber: t.plateNumber,
      type: t.type,
      status: t.status,
      routesCompleted: t.routesCompleted,
      distanceTraveled: Math.round(t.distanceTraveled * 100) / 100,
      fuelConsumed: Math.round(t.fuelConsumed * 100) / 100,
      daysActive: t.daysActive.size,
      utilizationRate: daysInPeriod > 0 ? Math.round((t.daysActive.size / daysInPeriod) * 1000) / 10 : 0
    })).sort((a, b) => b.routesCompleted - a.routesCompleted);

    // Aggregate by type
    const typeStats = {};
    byTruck.forEach(t => {
      if (!typeStats[t.type]) {
        typeStats[t.type] = { type: t.type, count: 0, routesCompleted: 0, totalUtilization: 0 };
      }
      typeStats[t.type].count++;
      typeStats[t.type].routesCompleted += t.routesCompleted;
      typeStats[t.type].totalUtilization += t.utilizationRate;
    });

    const byType = Object.values(typeStats).map(t => ({
      type: t.type,
      count: t.count,
      routesCompleted: t.routesCompleted,
      avgUtilization: t.count > 0 ? Math.round((t.totalUtilization / t.count) * 10) / 10 : 0
    }));

    // Aggregate by status
    const statusStats = {};
    trucks.forEach(t => {
      if (!statusStats[t.status]) {
        statusStats[t.status] = { status: t.status, count: 0 };
      }
      statusStats[t.status].count++;
    });

    const byStatus = Object.values(statusStats);

    // Calculate summary
    const activeTrucks = byTruck.filter(t => t.routesCompleted > 0).length;
    const totalDistance = byTruck.reduce((sum, t) => sum + t.distanceTraveled, 0);
    const utilizationRate = trucks.length > 0 ? Math.round((activeTrucks / trucks.length) * 1000) / 10 : 0;

    res.json({
      period: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      },
      summary: {
        totalTrucks: trucks.length,
        activeTrucks,
        utilizationRate,
        totalDistance: Math.round(totalDistance * 100) / 100,
        avgDistancePerTruck: trucks.length > 0 ? Math.round((totalDistance / trucks.length) * 100) / 100 : 0
      },
      byTruck,
      byType,
      byStatus
    });
  } catch (error) {
    console.error('Error generating fleet utilization report:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
