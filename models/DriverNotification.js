const mongoose = require('mongoose');

const driverNotificationSchema = new mongoose.Schema({
  // Target driver (or 'all' for broadcast)
  targetDriver: {
    type: String,
    required: true,
    index: true
  },

  // Notification type
  type: {
    type: String,
    enum: [
      'route-assigned',      // New route assignment
      'route-changed',       // Route modified
      'route-cancelled',     // Route cancelled
      'urgent-message',      // Urgent admin message
      'schedule-change',     // Schedule modification
      'vehicle-assigned',    // New vehicle assignment
      'inspection-required', // Reminder to do inspection
      'performance-update',  // Weekly performance summary
      'system-alert',        // System maintenance, etc.
      'complaint-related'    // Complaint about driver's area
    ],
    required: true
  },

  // Priority
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },

  // Content
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },

  // Related entity (optional)
  relatedEntity: {
    type: {
      type: String,
      enum: ['route', 'truck', 'schedule', 'complaint', 'inspection']
    },
    id: String
  },

  // Action URL (optional - for clickable notifications)
  actionUrl: {
    type: String,
    default: null
  },

  // Status
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date,
    default: null
  },

  // Delivery tracking
  isDelivered: {
    type: Boolean,
    default: false
  },
  deliveredAt: {
    type: Date,
    default: null
  },

  // Expiration (optional)
  expiresAt: {
    type: Date,
    default: null
  },

  // Created by
  createdBy: {
    type: String,
    default: 'system'
  }
}, {
  timestamps: true
});

// Indexes for common queries
driverNotificationSchema.index({ targetDriver: 1, isRead: 1, createdAt: -1 });
driverNotificationSchema.index({ targetDriver: 1, type: 1 });
driverNotificationSchema.index({ createdAt: -1 });
driverNotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Static method to get unread notifications for a driver
driverNotificationSchema.statics.getUnread = async function(driverUsername) {
  const now = new Date();
  return this.find({
    $or: [
      { targetDriver: driverUsername },
      { targetDriver: 'all' }
    ],
    isRead: false,
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: now } }
    ]
  }).sort({ priority: -1, createdAt: -1 });
};

// Static method to get recent notifications (last 7 days)
driverNotificationSchema.statics.getRecent = async function(driverUsername, limit = 50) {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  return this.find({
    $or: [
      { targetDriver: driverUsername },
      { targetDriver: 'all' }
    ],
    createdAt: { $gte: weekAgo }
  }).sort({ createdAt: -1 }).limit(limit);
};

// Static method to mark as read
driverNotificationSchema.statics.markAsRead = async function(notificationId, driverUsername) {
  return this.findOneAndUpdate(
    {
      _id: notificationId,
      $or: [
        { targetDriver: driverUsername },
        { targetDriver: 'all' }
      ]
    },
    {
      isRead: true,
      readAt: new Date()
    },
    { new: true }
  );
};

// Static method to mark all as read for a driver
driverNotificationSchema.statics.markAllAsRead = async function(driverUsername) {
  return this.updateMany(
    {
      $or: [
        { targetDriver: driverUsername },
        { targetDriver: 'all' }
      ],
      isRead: false
    },
    {
      isRead: true,
      readAt: new Date()
    }
  );
};

// Static method to send notification to a driver
driverNotificationSchema.statics.notify = async function(targetDriver, type, title, message, options = {}) {
  return this.create({
    targetDriver,
    type,
    title,
    message,
    priority: options.priority || 'normal',
    relatedEntity: options.relatedEntity || null,
    actionUrl: options.actionUrl || null,
    expiresAt: options.expiresAt || null,
    createdBy: options.createdBy || 'system'
  });
};

// Static method to broadcast to all drivers
driverNotificationSchema.statics.broadcast = async function(type, title, message, options = {}) {
  return this.notify('all', type, title, message, options);
};

module.exports = mongoose.models.DriverNotification || mongoose.model('DriverNotification', driverNotificationSchema);
