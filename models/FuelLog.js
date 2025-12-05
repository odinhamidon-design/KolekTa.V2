const mongoose = require('mongoose');

const fuelLogSchema = new mongoose.Schema({
  truckId: { type: String, required: true, index: true },
  type: {
    type: String,
    enum: ['refuel', 'consumption'],
    required: true
  },

  // For refuel entries
  litersAdded: { type: Number, default: 0 },
  pricePerLiter: { type: Number, default: 0 },
  totalCost: { type: Number, default: 0 },
  gasStation: String,
  odometerReading: Number, // km at time of refuel

  // For consumption entries (calculated)
  litersConsumed: { type: Number, default: 0 },
  distanceTraveled: { type: Number, default: 0 }, // km
  averageSpeed: { type: Number, default: 0 }, // km/h
  routeId: String,
  routeName: String,

  // Estimation factors used
  estimationFactors: {
    baseConsumption: Number, // L/100km base rate
    speedFactor: Number, // multiplier based on speed
    loadFactor: Number, // multiplier based on cargo load
    idleTime: Number, // minutes of idle time
    stopCount: Number // number of stops made
  },

  // Metadata
  recordedBy: String, // username
  notes: String,

  // Fuel level tracking
  fuelLevelBefore: Number, // percentage
  fuelLevelAfter: Number, // percentage

}, { timestamps: true });

// Index for efficient queries
fuelLogSchema.index({ truckId: 1, createdAt: -1 });
fuelLogSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.models.FuelLog || mongoose.model('FuelLog', fuelLogSchema);
