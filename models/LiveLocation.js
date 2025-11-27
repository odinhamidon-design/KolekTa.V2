const mongoose = require('mongoose');

const liveLocationSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  lat: {
    type: Number,
    required: true
  },
  lng: {
    type: Number,
    required: true
  },
  speed: {
    type: Number,
    default: 0
  },
  heading: {
    type: Number,
    default: 0
  },
  routeId: {
    type: String,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  lastUpdate: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// TTL index - automatically delete documents older than 10 minutes
liveLocationSchema.index({ lastUpdate: 1 }, { expireAfterSeconds: 600 });

module.exports = mongoose.models.LiveLocation || mongoose.model('LiveLocation', liveLocationSchema);
