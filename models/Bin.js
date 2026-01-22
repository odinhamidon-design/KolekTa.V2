const mongoose = require('mongoose');

const binSchema = new mongoose.Schema({
  binId: { type: String, required: true, unique: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }
  },
  address: String,
  capacity: { type: Number, default: 100 }, // liters
  currentLevel: { type: Number, default: 0 }, // percentage 0-100
  status: { type: String, enum: ['empty', 'low', 'medium', 'high', 'full'], default: 'empty' },
  lastCollection: Date,
  binType: { type: String, enum: ['general', 'recyclable', 'organic'], default: 'general' },
  // Manual volume override (if available from sensors)
  manualVolume: { type: Number, default: null }
}, { timestamps: true });

// Virtual field for estimated volume in cubic meters (m³)
binSchema.virtual('estimatedVolume').get(function() {
  // Use manual volume if available
  if (this.manualVolume !== null && this.manualVolume !== undefined) {
    return this.manualVolume;
  }
  // Calculate based on capacity (liters) and fill level
  // Convert liters to cubic meters: 1000 liters = 1 m³
  const fillLevel = (this.currentLevel || 0) / 100;
  const volumeLiters = this.capacity * fillLevel;
  return Math.round((volumeLiters / 1000) * 1000) / 1000; // Round to 3 decimal places
});

// Virtual field for capacity in cubic meters
binSchema.virtual('capacityM3').get(function() {
  return Math.round((this.capacity / 1000) * 1000) / 1000; // Convert liters to m³
});

// Ensure virtuals are included in JSON output
binSchema.set('toJSON', { virtuals: true });
binSchema.set('toObject', { virtuals: true });

binSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Bin', binSchema);
