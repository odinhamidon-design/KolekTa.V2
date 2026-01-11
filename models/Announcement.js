const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },

  content: {
    type: String,
    required: true
  },

  // Announcement type for styling/categorization
  type: {
    type: String,
    enum: ['info', 'warning', 'alert', 'schedule-change'],
    default: 'info'
  },

  // Target scope
  targetScope: {
    type: String,
    enum: ['city-wide', 'barangay'],
    default: 'city-wide'
  },

  // Specific barangays (empty = city-wide)
  targetBarangays: [{
    type: String
  }],

  // Priority for sorting/display
  priority: {
    type: String,
    enum: ['normal', 'high', 'urgent'],
    default: 'normal'
  },

  // Visibility dates
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date
  },

  // Active status
  isActive: {
    type: Boolean,
    default: true
  },

  // Admin tracking
  createdBy: String,
  updatedBy: String
}, { timestamps: true });

// Check if announcement is currently visible
announcementSchema.methods.isVisible = function() {
  const now = new Date();
  if (!this.isActive) return false;
  if (this.startDate && now < this.startDate) return false;
  if (this.endDate && now > this.endDate) return false;
  return true;
};

// Check if announcement applies to a barangay
announcementSchema.methods.appliesToBarangay = function(barangay) {
  if (this.targetScope === 'city-wide') return true;
  if (!this.targetBarangays || this.targetBarangays.length === 0) return true;
  return this.targetBarangays.includes(barangay);
};

// Static method to get active announcements for a barangay
announcementSchema.statics.getActiveForBarangay = async function(barangay) {
  const now = new Date();

  const announcements = await this.find({
    isActive: true,
    startDate: { $lte: now },
    $or: [
      { endDate: null },
      { endDate: { $gte: now } }
    ],
    $or: [
      { targetScope: 'city-wide' },
      { targetBarangays: { $size: 0 } },
      { targetBarangays: barangay }
    ]
  }).sort({ priority: -1, createdAt: -1 });

  return announcements;
};

// Add indexes for faster queries
announcementSchema.index({ isActive: 1 });
announcementSchema.index({ startDate: 1 });
announcementSchema.index({ endDate: 1 });
announcementSchema.index({ targetScope: 1 });
announcementSchema.index({ targetBarangays: 1 });
announcementSchema.index({ priority: -1, createdAt: -1 });

module.exports = mongoose.models.Announcement || mongoose.model('Announcement', announcementSchema);
