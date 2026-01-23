const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  routeId: { type: String, required: true, unique: true },
  name: String,
  areas: [{ type: String, trim: true }], // Array of area/barangay names covered by this route
  bins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Bin' }],
  path: {
    type: { type: String, enum: ['LineString'], default: 'LineString' },
    coordinates: [[Number]]
  },
  distance: Number,
  estimatedTime: Number,
  status: { type: String, enum: ['planned', 'active', 'completed'], default: 'planned' },
  assignedVehicle: String,
  assignedDriver: String,
  scheduledDate: Date,
  expiresAt: { type: Date, default: null },
  isExpired: { type: Boolean, default: false },
  notes: String,
  // Completion fields
  completedAt: Date,
  completedBy: String,
  completionNotes: String,
  completionPhotos: [String],
  photoCount: { type: Number, default: 0 }, // Track photo count separately for performance
  notificationSent: { type: Boolean, default: false },
  // Auto-calculated trip stats from GPS tracking
  tripStats: {
    distanceTraveled: { type: Number, default: 0 },
    fuelConsumed: { type: Number, default: 0 },
    stopsCompleted: { type: Number, default: 0 },
    averageSpeed: { type: Number, default: 0 }
  }
}, { timestamps: true });

// Add indexes for faster queries
routeSchema.index({ assignedDriver: 1 });
routeSchema.index({ status: 1 });
routeSchema.index({ expiresAt: 1 });
routeSchema.index({ isExpired: 1 });

module.exports = mongoose.models.Route || mongoose.model('Route', routeSchema);
