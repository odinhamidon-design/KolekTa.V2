const mongoose = require('mongoose');

// Waste density by bin type (kg per liter)
const WASTE_DENSITY = {
  general: 0.25,    // Mixed municipal waste: ~200-300 kg/m³
  recyclable: 0.15, // Paper, plastic, etc: lighter
  organic: 0.35     // Food waste: heavier, more dense
};

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
  // Manual weight override (if available from sensors)
  manualWeight: { type: Number, default: null }
}, { timestamps: true });

// Virtual field for estimated weight in kg
binSchema.virtual('estimatedWeight').get(function() {
  // Use manual weight if available
  if (this.manualWeight !== null && this.manualWeight !== undefined) {
    return this.manualWeight;
  }
  // Calculate based on capacity, fill level, and waste density
  const density = WASTE_DENSITY[this.binType] || WASTE_DENSITY.general;
  const fillLevel = (this.currentLevel || 0) / 100;
  return Math.round(this.capacity * fillLevel * density * 10) / 10;
});

// Ensure virtuals are included in JSON output
binSchema.set('toJSON', { virtuals: true });
binSchema.set('toObject', { virtuals: true });

binSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Bin', binSchema);
