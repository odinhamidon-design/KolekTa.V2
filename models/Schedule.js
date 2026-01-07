const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  scheduleId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  routeId: {
    type: String,
    required: true,
    index: true
  },

  // Recurrence Pattern
  recurrenceType: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: true
  },

  // Weekly: array of day indices (0=Sunday, 1=Monday, ..., 6=Saturday)
  weeklyDays: [{
    type: Number,
    min: 0,
    max: 6
  }],

  // Monthly: array of dates (1-31)
  monthlyDates: [{
    type: Number,
    min: 1,
    max: 31
  }],

  // Time of collection (HH:mm format)
  scheduledTime: {
    type: String,
    default: '07:00'
  },

  // Assignment
  assignedDriver: {
    type: String,
    default: null
  },
  assignedVehicle: {
    type: String,
    default: null
  },

  // Status
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },

  // Date range (optional - for limited schedules)
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    default: null  // null = indefinite
  },

  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Compound indexes for common queries
scheduleSchema.index({ isActive: 1, routeId: 1 });
scheduleSchema.index({ assignedDriver: 1 });

// Helper method to check if schedule is active on a given date
scheduleSchema.methods.isActiveOnDate = function(date) {
  if (!this.isActive) return false;

  const checkDate = new Date(date);
  const startDate = new Date(this.startDate);

  if (checkDate < startDate) return false;
  if (this.endDate && checkDate > new Date(this.endDate)) return false;

  const dayOfWeek = checkDate.getDay();
  const dayOfMonth = checkDate.getDate();

  switch (this.recurrenceType) {
    case 'daily':
      return true;
    case 'weekly':
      return this.weeklyDays.includes(dayOfWeek);
    case 'monthly':
      return this.monthlyDates.includes(dayOfMonth);
    default:
      return false;
  }
};

// Static method to get upcoming collections
scheduleSchema.statics.getUpcomingCollections = async function(days = 7) {
  const schedules = await this.find({ isActive: true });
  const upcoming = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < days; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() + i);

    for (const schedule of schedules) {
      if (schedule.isActiveOnDate(checkDate)) {
        upcoming.push({
          date: checkDate.toISOString().split('T')[0],
          scheduleId: schedule.scheduleId,
          scheduleName: schedule.name,
          routeId: schedule.routeId,
          scheduledTime: schedule.scheduledTime,
          assignedDriver: schedule.assignedDriver,
          assignedVehicle: schedule.assignedVehicle,
          recurrenceType: schedule.recurrenceType
        });
      }
    }
  }

  // Sort by date and time
  upcoming.sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.scheduledTime}`);
    const dateB = new Date(`${b.date}T${b.scheduledTime}`);
    return dateA - dateB;
  });

  return upcoming;
};

module.exports = mongoose.models.Schedule || mongoose.model('Schedule', scheduleSchema);
