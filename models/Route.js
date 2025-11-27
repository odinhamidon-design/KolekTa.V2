const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  routeId: { type: String, required: true, unique: true },
  name: String,
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
  notes: String,
  // Completion fields
  completedAt: Date,
  completedBy: String,
  completionNotes: String,
  completionPhotos: [String],
  notificationSent: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.models.Route || mongoose.model('Route', routeSchema);
