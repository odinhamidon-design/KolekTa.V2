const mongoose = require('mongoose');

const inspectionItemSchema = new mongoose.Schema({
  item: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pass', 'fail', 'na'],
    required: true
  },
  notes: {
    type: String,
    default: ''
  }
}, { _id: false });

const vehicleInspectionSchema = new mongoose.Schema({
  inspectionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  truckId: {
    type: String,
    required: true,
    index: true
  },
  driverUsername: {
    type: String,
    required: true,
    index: true
  },
  driverName: {
    type: String,
    required: true
  },
  inspectionType: {
    type: String,
    enum: ['pre-trip', 'post-trip'],
    default: 'pre-trip'
  },
  inspectionDate: {
    type: Date,
    default: Date.now,
    index: true
  },

  // Inspection checklist items
  items: [inspectionItemSchema],

  // Summary
  overallStatus: {
    type: String,
    enum: ['passed', 'failed', 'needs-attention'],
    required: true
  },
  failedItems: [{
    type: String
  }],

  // Odometer reading
  odometerReading: {
    type: Number,
    default: null
  },

  // Fuel level at inspection
  fuelLevel: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },

  // Photos of issues
  photos: [{
    type: String // Base64 encoded
  }],

  // General notes
  notes: {
    type: String,
    default: ''
  },

  // Admin review
  reviewedBy: {
    type: String,
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  reviewNotes: {
    type: String,
    default: ''
  },

  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'action-required', 'resolved'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Indexes for common queries
vehicleInspectionSchema.index({ driverUsername: 1, inspectionDate: -1 });
vehicleInspectionSchema.index({ truckId: 1, inspectionDate: -1 });
vehicleInspectionSchema.index({ overallStatus: 1, status: 1 });

// Static method to get today's inspections for a driver
vehicleInspectionSchema.statics.getTodayInspections = async function(driverUsername) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return this.find({
    driverUsername,
    inspectionDate: { $gte: today, $lt: tomorrow }
  }).sort({ inspectionDate: -1 });
};

// Static method to get inspections needing attention
vehicleInspectionSchema.statics.getNeedingAttention = async function() {
  return this.find({
    $or: [
      { overallStatus: 'failed' },
      { overallStatus: 'needs-attention' }
    ],
    status: { $in: ['pending', 'action-required'] }
  }).sort({ inspectionDate: -1 });
};

module.exports = mongoose.models.VehicleInspection || mongoose.model('VehicleInspection', vehicleInspectionSchema);
