const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  referenceNumber: {
    type: String,
    required: true,
    unique: true
  },
  // Report type
  reportType: {
    type: String,
    enum: ['missed_collection', 'illegal_dumping', 'overflowing_bin', 'damaged_bin', 'odor_complaint', 'other'],
    required: true,
    default: 'missed_collection'
  },
  // Complainant information
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String, required: true },
  barangay: { type: String, required: true },

  // Location (GeoJSON Point) - only set when coordinates are provided
  location: {
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: {
      type: [Number] // [longitude, latitude]
    }
  },

  // Complaint details
  description: { type: String, required: true },
  missedCollectionDate: { type: Date }, // Only required for missed_collection type
  photos: [String], // Base64 data URLs, max 3

  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'resolved', 'closed'],
    default: 'pending'
  },

  // Admin actions
  assignedDriver: String,
  assignedVehicle: String,
  adminResponse: String,
  adminNotes: String,
  resolvedAt: Date,
  resolvedBy: String,

  // For notification badge (renamed from isNew - reserved Mongoose property)
  isUnread: { type: Boolean, default: true }
}, { timestamps: true });

// Generate reference number
complaintSchema.statics.generateReferenceNumber = function() {
  const year = new Date().getFullYear();
  const random = Math.floor(10000 + Math.random() * 90000);
  return `CMPL-${year}-${random}`;
};

// Add indexes for faster queries
complaintSchema.index({ referenceNumber: 1 });
complaintSchema.index({ status: 1 });
complaintSchema.index({ barangay: 1 });
complaintSchema.index({ reportType: 1 });
complaintSchema.index({ isUnread: 1 });
complaintSchema.index({ createdAt: -1 });
complaintSchema.index({ location: '2dsphere' }, { sparse: true });

module.exports = mongoose.models.Complaint || mongoose.model('Complaint', complaintSchema);
