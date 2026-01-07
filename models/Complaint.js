const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  referenceNumber: {
    type: String,
    required: true,
    unique: true
  },
  // Complainant information
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String, required: true },
  barangay: { type: String, required: true },

  // Complaint details
  description: { type: String, required: true },
  missedCollectionDate: { type: Date, required: true },
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

  // For notification badge
  isNew: { type: Boolean, default: true }
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
complaintSchema.index({ isNew: 1 });
complaintSchema.index({ createdAt: -1 });

module.exports = mongoose.models.Complaint || mongoose.model('Complaint', complaintSchema);
