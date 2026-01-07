const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { schedulesStorage, routesStorage } = require('../data/storage');

// Get all schedules
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    let schedules = schedulesStorage.getAll();
    const { isActive, routeId } = req.query;

    // Apply filters
    if (isActive !== undefined) {
      const activeFilter = isActive === 'true';
      schedules = schedules.filter(s => s.isActive === activeFilter);
    }

    if (routeId) {
      schedules = schedules.filter(s => s.routeId === routeId);
    }

    // Enrich with route names
    const routes = routesStorage.getAll();
    schedules = schedules.map(schedule => {
      const route = routes.find(r => r.routeId === schedule.routeId);
      return {
        ...schedule,
        routeName: route ? route.name : 'Unknown Route'
      };
    });

    // Sort by creation date (newest first)
    schedules.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(schedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get upcoming collections
router.get('/upcoming', authenticateToken, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const upcoming = schedulesStorage.getUpcomingCollections(days);

    // Enrich with route names
    const routes = routesStorage.getAll();
    const enriched = upcoming.map(item => {
      const route = routes.find(r => r.routeId === item.routeId);
      return {
        ...item,
        routeName: route ? route.name : 'Unknown Route'
      };
    });

    res.json(enriched);
  } catch (error) {
    console.error('Error fetching upcoming collections:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get schedule stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const schedules = schedulesStorage.getAll();

    const stats = {
      total: schedules.length,
      active: schedules.filter(s => s.isActive).length,
      inactive: schedules.filter(s => !s.isActive).length,
      byRecurrence: {
        daily: schedules.filter(s => s.recurrenceType === 'daily').length,
        weekly: schedules.filter(s => s.recurrenceType === 'weekly').length,
        monthly: schedules.filter(s => s.recurrenceType === 'monthly').length
      }
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching schedule stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single schedule
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const schedule = schedulesStorage.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // Enrich with route name
    const routes = routesStorage.getAll();
    const route = routes.find(r => r.routeId === schedule.routeId);

    res.json({
      ...schedule,
      routeName: route ? route.name : 'Unknown Route'
    });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new schedule
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const {
      name,
      routeId,
      recurrenceType,
      weeklyDays,
      monthlyDates,
      scheduledTime,
      assignedDriver,
      assignedVehicle,
      startDate,
      endDate,
      notes
    } = req.body;

    // Validate required fields
    if (!name || !routeId || !recurrenceType) {
      return res.status(400).json({ error: 'Name, routeId, and recurrenceType are required' });
    }

    // Validate recurrence type
    if (!['daily', 'weekly', 'monthly'].includes(recurrenceType)) {
      return res.status(400).json({ error: 'Invalid recurrence type' });
    }

    // Validate weekly days
    if (recurrenceType === 'weekly' && (!weeklyDays || weeklyDays.length === 0)) {
      return res.status(400).json({ error: 'Weekly schedule requires at least one day selected' });
    }

    // Validate monthly dates
    if (recurrenceType === 'monthly' && (!monthlyDates || monthlyDates.length === 0)) {
      return res.status(400).json({ error: 'Monthly schedule requires at least one date selected' });
    }

    // Verify route exists
    const route = routesStorage.findById(routeId);
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    const scheduleId = schedulesStorage.generateScheduleId();
    const now = new Date().toISOString();

    const schedule = {
      _id: scheduleId,
      scheduleId,
      name,
      routeId,
      recurrenceType,
      weeklyDays: recurrenceType === 'weekly' ? weeklyDays : [],
      monthlyDates: recurrenceType === 'monthly' ? monthlyDates : [],
      scheduledTime: scheduledTime || '07:00',
      assignedDriver: assignedDriver || null,
      assignedVehicle: assignedVehicle || null,
      isActive: true,
      startDate: startDate || now,
      endDate: endDate || null,
      notes: notes || '',
      createdAt: now,
      updatedAt: now
    };

    schedulesStorage.add(schedule);

    console.log('Schedule created (JSON):', scheduleId);
    res.status(201).json({ message: 'Schedule created successfully', schedule });
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update schedule
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const updates = req.body;

    // Verify schedule exists
    const existing = schedulesStorage.findById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // Validate recurrence type if updating
    if (updates.recurrenceType && !['daily', 'weekly', 'monthly'].includes(updates.recurrenceType)) {
      return res.status(400).json({ error: 'Invalid recurrence type' });
    }

    updates.updatedAt = new Date().toISOString();

    const success = schedulesStorage.update(id, updates);

    if (success) {
      const updated = schedulesStorage.findById(id);
      console.log('Schedule updated (JSON):', id);
      res.json({ message: 'Schedule updated successfully', schedule: updated });
    } else {
      res.status(500).json({ error: 'Failed to update schedule' });
    }
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({ error: error.message });
  }
});

// Toggle schedule active status
router.post('/:id/toggle', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const schedule = schedulesStorage.findById(id);

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const success = schedulesStorage.update(id, {
      isActive: !schedule.isActive,
      updatedAt: new Date().toISOString()
    });

    if (success) {
      const updated = schedulesStorage.findById(id);
      console.log('Schedule toggled (JSON):', id, '-> isActive:', updated.isActive);
      res.json({ message: `Schedule ${updated.isActive ? 'activated' : 'deactivated'}`, schedule: updated });
    } else {
      res.status(500).json({ error: 'Failed to toggle schedule' });
    }
  } catch (error) {
    console.error('Error toggling schedule:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete schedule
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const schedule = schedulesStorage.findById(id);

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    schedulesStorage.delete(id);

    console.log('Schedule deleted (JSON):', id);
    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
