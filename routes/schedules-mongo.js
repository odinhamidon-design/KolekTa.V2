const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authenticateToken } = require('../middleware/auth');
const Schedule = require('../models/Schedule');
const Route = require('../models/Route');

// Helper function to build query for finding schedule by id or scheduleId
function buildScheduleQuery(id) {
  const query = { scheduleId: id };
  // Only add _id to query if it's a valid ObjectId
  if (mongoose.Types.ObjectId.isValid(id)) {
    return { $or: [{ _id: id }, { scheduleId: id }] };
  }
  return query;
}

// Get all schedules
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { isActive, routeId } = req.query;
    const query = {};

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (routeId) {
      query.routeId = routeId;
    }

    const schedules = await Schedule.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Enrich with route names
    const routeIds = [...new Set(schedules.map(s => s.routeId))];
    const routes = await Route.find({ routeId: { $in: routeIds } }).lean();
    const routeMap = routes.reduce((acc, r) => {
      acc[r.routeId] = r.name;
      return acc;
    }, {});

    const enriched = schedules.map(schedule => ({
      ...schedule,
      routeName: routeMap[schedule.routeId] || 'Unknown Route'
    }));

    res.json(enriched);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get upcoming collections
router.get('/upcoming', authenticateToken, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const upcoming = await Schedule.getUpcomingCollections(days);

    // Enrich with route names
    const routeIds = [...new Set(upcoming.map(u => u.routeId))];
    const routes = await Route.find({ routeId: { $in: routeIds } }).lean();
    const routeMap = routes.reduce((acc, r) => {
      acc[r.routeId] = r.name;
      return acc;
    }, {});

    const enriched = upcoming.map(item => ({
      ...item,
      routeName: routeMap[item.routeId] || 'Unknown Route'
    }));

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

    const [total, active, daily, weekly, monthly] = await Promise.all([
      Schedule.countDocuments(),
      Schedule.countDocuments({ isActive: true }),
      Schedule.countDocuments({ recurrenceType: 'daily' }),
      Schedule.countDocuments({ recurrenceType: 'weekly' }),
      Schedule.countDocuments({ recurrenceType: 'monthly' })
    ]);

    const stats = {
      total,
      active,
      inactive: total - active,
      byRecurrence: { daily, weekly, monthly }
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

    const schedule = await Schedule.findOne(buildScheduleQuery(req.params.id)).lean();

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // Enrich with route name
    const route = await Route.findOne({ routeId: schedule.routeId }).lean();

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
    const route = await Route.findOne({ routeId: routeId });
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    const scheduleId = `SCHED-${Date.now()}`;

    const schedule = new Schedule({
      scheduleId,
      name,
      routeId: route.routeId,
      recurrenceType,
      weeklyDays: recurrenceType === 'weekly' ? weeklyDays : [],
      monthlyDates: recurrenceType === 'monthly' ? monthlyDates : [],
      scheduledTime: scheduledTime || '07:00',
      assignedDriver: assignedDriver || null,
      assignedVehicle: assignedVehicle || null,
      isActive: true,
      startDate: startDate || new Date(),
      endDate: endDate || null,
      notes: notes || ''
    });

    await schedule.save();

    console.log('Schedule created (MongoDB):', scheduleId);
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

    // Validate recurrence type if updating
    if (updates.recurrenceType && !['daily', 'weekly', 'monthly'].includes(updates.recurrenceType)) {
      return res.status(400).json({ error: 'Invalid recurrence type' });
    }

    const schedule = await Schedule.findOneAndUpdate(
      buildScheduleQuery(id),
      { $set: updates },
      { new: true }
    );

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    console.log('Schedule updated (MongoDB):', id);
    res.json({ message: 'Schedule updated successfully', schedule });
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

    const schedule = await Schedule.findOne(buildScheduleQuery(id));

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    schedule.isActive = !schedule.isActive;
    await schedule.save();

    console.log('Schedule toggled (MongoDB):', id, '-> isActive:', schedule.isActive);
    res.json({ message: `Schedule ${schedule.isActive ? 'activated' : 'deactivated'}`, schedule });
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

    const result = await Schedule.deleteOne(buildScheduleQuery(id));

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    console.log('Schedule deleted (MongoDB):', id);
    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
