const mongoose = require('mongoose');

const specialPickupSchema = new mongoose.Schema({
  referenceNumber: {
    type: String,
    required: true,
    unique: true
  },

  // Pickup type
  pickupType: {
    type: String,
    enum: ['e-waste', 'hazardous'],
    required: true
  },

  // Items to be picked up
  items: [{
    name: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    description: String
  }],

  // Requester information
  requesterName: { type: String, required: true },
  phone: { type: String, required: true },
  email: String,
  barangay: { type: String, required: true },
  address: { type: String, required: true },

  // Location (GeoJSON Point)
  location: {
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: {
      type: [Number] // [longitude, latitude]
    }
  },

  // Scheduling preferences
  preferredDate: { type: Date, required: true },
  preferredTimeSlot: {
    type: String,
    enum: ['morning', 'afternoon'],
    default: 'morning'
  },

  // Photos of items (Base64)
  photos: [String],

  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'scheduled', 'completed', 'cancelled'],
    default: 'pending'
  },

  // Admin assignment
  scheduledDate: Date,
  assignedVehicle: String,
  assignedDriver: String,

  // Notes
  notes: String,
  adminNotes: String,

  // Completion tracking
  completedAt: Date,
  completedBy: String,

  // For notification badge
  isNew: { type: Boolean, default: true }
}, { timestamps: true });

// Generate reference number
specialPickupSchema.statics.generateReferenceNumber = function() {
  const year = new Date().getFullYear();
  const random = Math.floor(10000 + Math.random() * 90000);
  return `PICKUP-${year}-${random}`;
};

// Add indexes for faster queries
specialPickupSchema.index({ referenceNumber: 1 });
specialPickupSchema.index({ status: 1 });
specialPickupSchema.index({ barangay: 1 });
specialPickupSchema.index({ pickupType: 1 });
specialPickupSchema.index({ isNew: 1 });
specialPickupSchema.index({ createdAt: -1 });
specialPickupSchema.index({ scheduledDate: 1 });
specialPickupSchema.index({ location: '2dsphere' }, { sparse: true });

module.exports = mongoose.models.SpecialPickup || mongoose.model('SpecialPickup', specialPickupSchema);
