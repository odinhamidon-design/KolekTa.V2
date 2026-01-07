const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Route = require('../models/Route');
const User = require('../models/User');
const Complaint = require('../models/Complaint');

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

module.exports = router;
