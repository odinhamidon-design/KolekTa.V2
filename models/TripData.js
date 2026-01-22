const mongoose = require('mongoose');

const tripDataSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  totalDistance: {
    type: Number,
    default: 0
  },
  stopCount: {
    type: Number,
    default: 0
  },
  idleTimeMs: {
    type: Number,
    default: 0
  },
  fuelEstimate: {
    type: Number,
    default: 0
  },
  lastLocation: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null }
  },
  lastUpdateTime: {
    type: Date,
    default: null
  },
  lastSpeed: {
    type: Number,
    default: 0
  },
  speedSamples: {
    type: [Number],
    default: []
  },
  isActive: {
    type: Boolean,
    default: true
  },
  routeId: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for finding active trips
tripDataSchema.index({ isActive: 1 });

// Static method to get or create trip for a user
tripDataSchema.statics.getOrCreateTrip = async function(username) {
  let trip = await this.findOne({ username, isActive: true });
  if (!trip) {
    trip = await this.create({
      username,
      startTime: new Date(),
      isActive: true
    });
  }
  return trip;
};

// Static method to end a trip
tripDataSchema.statics.endTrip = async function(username) {
  const trip = await this.findOneAndUpdate(
    { username, isActive: true },
    { isActive: false },
    { new: true }
  );
  return trip;
};

module.exports = mongoose.models.TripData || mongoose.model('TripData', tripDataSchema);
