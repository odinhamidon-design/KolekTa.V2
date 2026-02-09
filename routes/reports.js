const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { routesStorage, usersStorage, complaintsStorage } = require('../data/storage');
const logger = require('../lib/logger');

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
    logger.error('Error generating collection summary:', error);
    res.status(500).json({ error: 'An internal error occurred' });
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
    logger.error('Error generating driver performance report:', error);
    res.status(500).json({ error: 'An internal error occurred' });
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
    logger.error('Error generating complaint analytics:', error);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// Analytics Heatmap Data (mock mode)
router.get('/analytics-data', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const barangays = [
      { name: 'Badas', center: { lat: 6.9380, lng: 126.2050 } },
      { name: 'Bobon', center: { lat: 6.9420, lng: 126.2250 } },
      { name: 'Buso', center: { lat: 6.9350, lng: 126.2380 } },
      { name: 'Cabuaya', center: { lat: 6.9580, lng: 126.1980 } },
      { name: 'Central', center: { lat: 6.9549, lng: 126.2185 } },
      { name: 'Culaman', center: { lat: 6.9680, lng: 126.2350 } },
      { name: 'Dahican', center: { lat: 6.9150, lng: 126.2850 } },
      { name: 'Danao', center: { lat: 6.9750, lng: 126.2100 } },
      { name: 'Dawan', center: { lat: 6.9480, lng: 126.2450 } },
      { name: 'Don Enrique Lopez', center: { lat: 6.9620, lng: 126.2280 } },
      { name: 'Don Martin Marundan', center: { lat: 6.9720, lng: 126.1950 } },
      { name: 'Don Salvador Lopez', center: { lat: 6.9520, lng: 126.2080 } },
      { name: 'Langka', center: { lat: 6.9450, lng: 126.1920 } },
      { name: 'Lawigan', center: { lat: 6.9280, lng: 126.2180 } },
      { name: 'Libudon', center: { lat: 6.9650, lng: 126.2480 } },
      { name: 'Limot', center: { lat: 6.9180, lng: 126.2650 } },
      { name: 'Luban', center: { lat: 6.9320, lng: 126.2520 } },
      { name: 'Macambol', center: { lat: 6.9580, lng: 126.2550 } },
      { name: 'Mamali', center: { lat: 6.9480, lng: 126.1850 } },
      { name: 'Matiao', center: { lat: 6.9380, lng: 126.2680 } },
      { name: 'Mayo', center: { lat: 6.9220, lng: 126.2350 } },
      { name: 'Sainz', center: { lat: 6.9620, lng: 126.2080 } },
      { name: 'Sanghay', center: { lat: 6.9250, lng: 126.2480 } },
      { name: 'Tagabakid', center: { lat: 6.9780, lng: 126.2250 } },
      { name: 'Tagbinonga', center: { lat: 6.9480, lng: 126.2320 } },
      { name: 'Taguibo', center: { lat: 6.9350, lng: 126.1780 } }
    ];

    const routes = routesStorage.getAll();
    const complaints = complaintsStorage.getAll();

    // Filter completed routes within date range
    const completedRoutes = routes.filter(r => {
      if (r.status !== 'completed' || !r.completedAt) return false;
      const completedDate = new Date(r.completedAt);
      return completedDate >= start && completedDate <= end;
    });

    // Extract route points from stops
    const routePoints = [];
    completedRoutes.forEach(route => {
      if (route.stops) {
        route.stops.forEach(stop => {
          if (stop.lat && stop.lng) {
            routePoints.push({
              lat: stop.lat,
              lng: stop.lng,
              intensity: 1,
              routeId: route.routeId || route._id,
              completedAt: route.completedAt
            });
          }
        });
      }
    });

    // Filter complaints within date range
    const filteredComplaints = complaints.filter(c => {
      const createdDate = new Date(c.createdAt);
      return createdDate >= start && createdDate <= end;
    });

    const complaintPoints = filteredComplaints
      .map(c => ({
        lat: c.location?.coordinates?.[1] || c.lat,
        lng: c.location?.coordinates?.[0] || c.lng,
        severity: c.priority || 'medium',
        type: c.type || 'general',
        barangay: c.barangay,
        createdAt: c.createdAt
      }))
      .filter(p => p.lat && p.lng);

    // Calculate barangay statistics
    const proximityRadius = 0.015;
    const barangayStats = barangays.map(barangay => {
      const routeCompletions = routePoints.filter(p => {
        const latDiff = Math.abs(p.lat - barangay.center.lat);
        const lngDiff = Math.abs(p.lng - barangay.center.lng);
        return latDiff < proximityRadius && lngDiff < proximityRadius;
      }).length;

      const barangayComplaints = complaintPoints.filter(p => {
        if (p.barangay && p.barangay.toLowerCase().includes(barangay.name.toLowerCase())) {
          return true;
        }
        const latDiff = Math.abs(p.lat - barangay.center.lat);
        const lngDiff = Math.abs(p.lng - barangay.center.lng);
        return latDiff < proximityRadius && lngDiff < proximityRadius;
      }).length;

      return {
        name: barangay.name,
        center: barangay.center,
        routeCompletions,
        complaints: barangayComplaints
      };
    });

    const maxCompletions = Math.max(...barangayStats.map(b => b.routeCompletions), 1);
    const maxComplaints = Math.max(...barangayStats.map(b => b.complaints), 1);

    const barangayStatsWithScores = barangayStats.map(b => {
      const coverageScore = (b.routeCompletions / maxCompletions) * 100;
      const complaintPenalty = (b.complaints / maxComplaints) * 100;
      let serviceScore = Math.round((coverageScore * 0.7) - (complaintPenalty * 0.3) + 30);
      serviceScore = Math.max(0, Math.min(100, serviceScore));
      const status = serviceScore >= 70 ? 'well-served' :
                     serviceScore >= 40 ? 'moderate' : 'underserved';
      return { ...b, serviceScore, status };
    });

    barangayStatsWithScores.sort((a, b) => b.serviceScore - a.serviceScore);

    const totalRouteCompletions = completedRoutes.length;
    const totalComplaints = complaintPoints.length;
    const avgServiceScore = barangayStatsWithScores.length > 0
      ? Math.round(barangayStatsWithScores.reduce((sum, b) => sum + b.serviceScore, 0) / barangayStatsWithScores.length)
      : 0;
    const wellServedCount = barangayStatsWithScores.filter(b => b.status === 'well-served').length;
    const underservedCount = barangayStatsWithScores.filter(b => b.status === 'underserved').length;

    res.json({
      period: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      },
      routePoints,
      complaintPoints,
      barangayStats: barangayStatsWithScores,
      summary: {
        totalRouteCompletions,
        totalComplaints,
        avgServiceScore,
        wellServedCount,
        underservedCount
      }
    });
  } catch (error) {
    logger.error('Error generating analytics data:', error);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

module.exports = router;
