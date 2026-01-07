const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { routesStorage, usersStorage, complaintsStorage } = require('../data/storage');

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

    const routes = routesStorage.getAll();

    // Filter completed routes within date range
    const completedRoutes = routes.filter(r => {
      if (r.status !== 'completed' || !r.completedAt) return false;
      const completedDate = new Date(r.completedAt);
      return completedDate >= start && completedDate <= end;
    });

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

    // Group by route
    const byRoute = {};
    completedRoutes.forEach(r => {
      const key = r.routeId || r._id;
      if (!byRoute[key]) {
        byRoute[key] = {
          routeId: r.routeId,
          routeName: r.name,
          completions: 0,
          totalDistance: 0,
          totalStops: 0,
          totalTime: 0
        };
      }
      byRoute[key].completions++;
      byRoute[key].totalDistance += r.tripStats?.distanceTraveled || r.distance || 0;
      byRoute[key].totalStops += r.tripStats?.stopsCompleted || 0;
    });

    const byRouteArray = Object.values(byRoute).map(r => ({
      ...r,
      avgCompletionTime: r.completions > 0 ? Math.round(r.totalTime / r.completions) : 0
    }));

    // Group by day
    const daily = {};
    completedRoutes.forEach(r => {
      const dateKey = new Date(r.completedAt).toISOString().split('T')[0];
      if (!daily[dateKey]) {
        daily[dateKey] = { date: dateKey, completions: 0, distance: 0 };
      }
      daily[dateKey].completions++;
      daily[dateKey].distance += r.tripStats?.distanceTraveled || r.distance || 0;
    });

    const dailyArray = Object.values(daily).sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      period: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      },
      summary: {
        totalRoutes: routes.length,
        completedRoutes: completedRoutes.length,
        completionRate: routes.length > 0 ? Math.round((completedRoutes.length / routes.length) * 1000) / 10 : 0,
        totalDistance: Math.round(totalDistance * 100) / 100,
        totalStops,
        totalFuelConsumed: Math.round(totalFuel * 100) / 100
      },
      byRoute: byRouteArray,
      daily: dailyArray
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

    const routes = routesStorage.getAll();
    const users = usersStorage.getAll();
    const drivers = users.filter(u => u.role === 'driver');

    // Filter completed routes within date range
    const completedRoutes = routes.filter(r => {
      if (r.status !== 'completed' || !r.completedAt) return false;
      const completedDate = new Date(r.completedAt);
      return completedDate >= start && completedDate <= end;
    });

    // Group by driver
    const driverStats = {};
    drivers.forEach(d => {
      driverStats[d.username] = {
        username: d.username,
        fullName: d.fullName || d.username,
        routesCompleted: 0,
        totalDistance: 0,
        totalStops: 0,
        totalTime: 0,
        speedSamples: [],
        fuelConsumed: 0,
        routesByDay: {}
      };
    });

    completedRoutes.forEach(r => {
      const driver = r.completedBy || r.assignedDriver;
      if (!driver) return;

      if (!driverStats[driver]) {
        driverStats[driver] = {
          username: driver,
          fullName: driver,
          routesCompleted: 0,
          totalDistance: 0,
          totalStops: 0,
          totalTime: 0,
          speedSamples: [],
          fuelConsumed: 0,
          routesByDay: {}
        };
      }

      const stats = driverStats[driver];
      stats.routesCompleted++;
      stats.totalDistance += r.tripStats?.distanceTraveled || r.distance || 0;
      stats.totalStops += r.tripStats?.stopsCompleted || 0;
      stats.fuelConsumed += r.tripStats?.fuelConsumed || 0;

      if (r.tripStats?.averageSpeed) {
        stats.speedSamples.push(r.tripStats.averageSpeed);
      }

      const dateKey = new Date(r.completedAt).toISOString().split('T')[0];
      stats.routesByDay[dateKey] = (stats.routesByDay[dateKey] || 0) + 1;
    });

    // Calculate averages and format
    const driversArray = Object.values(driverStats)
      .filter(d => d.routesCompleted > 0)
      .map(d => ({
        username: d.username,
        fullName: d.fullName,
        routesCompleted: d.routesCompleted,
        totalDistance: Math.round(d.totalDistance * 100) / 100,
        totalStops: d.totalStops,
        avgCompletionTime: d.routesCompleted > 0 ? Math.round(d.totalTime / d.routesCompleted) : 0,
        avgSpeed: d.speedSamples.length > 0
          ? Math.round((d.speedSamples.reduce((a, b) => a + b, 0) / d.speedSamples.length) * 10) / 10
          : 0,
        fuelEfficiency: d.totalDistance > 0
          ? Math.round((d.totalDistance / d.fuelConsumed) * 100) / 100
          : 0,
        routesByDay: d.routesByDay
      }))
      .sort((a, b) => b.routesCompleted - a.routesCompleted);

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

    const complaints = complaintsStorage.getAll();

    // Filter complaints within date range
    const filteredComplaints = complaints.filter(c => {
      const createdDate = new Date(c.createdAt);
      return createdDate >= start && createdDate <= end;
    });

    // Count by status
    const statusCounts = {
      pending: 0,
      'in-progress': 0,
      resolved: 0,
      closed: 0
    };

    filteredComplaints.forEach(c => {
      if (statusCounts.hasOwnProperty(c.status)) {
        statusCounts[c.status]++;
      }
    });

    // Count by barangay
    const barangayCounts = {};
    filteredComplaints.forEach(c => {
      if (!barangayCounts[c.barangay]) {
        barangayCounts[c.barangay] = { count: 0, resolved: 0 };
      }
      barangayCounts[c.barangay].count++;
      if (c.status === 'resolved' || c.status === 'closed') {
        barangayCounts[c.barangay].resolved++;
      }
    });

    const byBarangay = Object.entries(barangayCounts)
      .map(([barangay, data]) => ({
        barangay,
        count: data.count,
        resolved: data.resolved
      }))
      .sort((a, b) => b.count - a.count);

    // Calculate average resolution time
    const resolvedComplaints = filteredComplaints.filter(c =>
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

    // Timeline (daily submissions and resolutions)
    const timeline = {};
    filteredComplaints.forEach(c => {
      const dateKey = new Date(c.createdAt).toISOString().split('T')[0];
      if (!timeline[dateKey]) {
        timeline[dateKey] = { date: dateKey, submitted: 0, resolved: 0 };
      }
      timeline[dateKey].submitted++;
    });

    resolvedComplaints.forEach(c => {
      if (c.resolvedAt) {
        const dateKey = new Date(c.resolvedAt).toISOString().split('T')[0];
        if (timeline[dateKey]) {
          timeline[dateKey].resolved++;
        }
      }
    });

    const timelineArray = Object.values(timeline).sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      period: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      },
      summary: {
        total: filteredComplaints.length,
        pending: statusCounts.pending,
        inProgress: statusCounts['in-progress'],
        resolved: statusCounts.resolved + statusCounts.closed,
        avgResolutionTime // in hours
      },
      byBarangay,
      byStatus: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
      timeline: timelineArray
    });
  } catch (error) {
    console.error('Error generating complaint analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
