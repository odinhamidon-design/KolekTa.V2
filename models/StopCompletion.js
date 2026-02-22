const mongoose = require('mongoose');

const stopCompletionSchema = new mongoose.Schema({
  // Route and stop identification
  routeId: {
    type: String,
    required: true,
    index: true
  },
  stopIndex: {
    type: Number,
    required: true
  },
  stopName: {
    type: String,
    default: ''
  },

  // Location
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true
    }
  },

  // Driver info
  driverUsername: {
    type: String,
    required: true,
    index: true
  },
  driverName: {
    type: String,
    default: ''
  },

  // Status
  status: {
    type: String,
    enum: ['completed', 'skipped', 'partial'],
    required: true
  },

  // Skip justification (required when skipped)
  skipReason: {
    type: String,
    enum: [
      'road-blocked',
      'no-access',
      'safety-concern',
      'no-waste',
      'resident-request',
      'vehicle-issue',
      'weather',
      'other'
    ],
    default: null
  },
  skipNotes: {
    type: String,
    default: ''
  },
  skipPhoto: {
    type: String, // Base64 encoded proof
    default: null
  },

  // Completion details
  completedAt: {
    type: Date,
    default: Date.now
  },

  // GPS verification
  gpsLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number] // [lng, lat] - actual GPS when marking complete
    }
  },
  distanceFromStop: {
    type: Number, // meters from expected stop location
    default: null
  },

  // Collection metrics
  binsCollected: {
    type: Number,
    default: 1
  },
  wasteType: {
    type: String,
    enum: ['biodegradable', 'recyclable', 'residual', 'mixed', 'hazardous'],
    default: 'mixed'
  },
  estimatedVolume: {
    type: Number, // cubic meters (m³)
    default: null
  },

  // Notes
  notes: {
    type: String,
    default: ''
  },

  // Photos (optional completion proof)
  photos: [{
    type: String
  }]
}, {
  timestamps: true
});

// Compound index for route progress queries
stopCompletionSchema.index({ routeId: 1, driverUsername: 1, stopIndex: 1 }, { unique: true });
stopCompletionSchema.index({ driverUsername: 1, completedAt: -1 });
stopCompletionSchema.index({ routeId: 1, status: 1 });

// Geospatial index for location queries
stopCompletionSchema.index({ location: '2dsphere' });
stopCompletionSchema.index({ gpsLocation: '2dsphere' });

// Static method to get route progress
stopCompletionSchema.statics.getRouteProgress = async function(routeId) {
  const stops = await this.find({ routeId }).sort({ stopIndex: 1 });
  const completed = stops.filter(s => s.status === 'completed').length;
  const skipped = stops.filter(s => s.status === 'skipped').length;
  const total = stops.length;

  return {
    routeId,
    total,
    completed,
    skipped,
    remaining: total - completed - skipped,
    percentComplete: total > 0 ? Math.round((completed / total) * 100) : 0,
    stops
  };
};

// Static method to get driver stats for a date range
stopCompletionSchema.statics.getDriverStats = async function(driverUsername, startDate, endDate) {
  const match = {
    driverUsername,
    completedAt: { $gte: startDate, $lte: endDate }
  };

  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalBins: { $sum: '$binsCollected' },
        totalVolume: { $sum: { $ifNull: ['$estimatedVolume', 0] } }
      }
    }
  ]);

  const result = {
    completed: 0,
    skipped: 0,
    totalBins: 0,
    totalVolume: 0
  };

  stats.forEach(s => {
    if (s._id === 'completed') {
      result.completed = s.count;
      result.totalBins += s.totalBins;
      result.totalVolume += s.totalVolume;
    } else if (s._id === 'skipped') {
      result.skipped = s.count;
    }
  });

  return result;
};

module.exports = mongoose.models.StopCompletion || mongoose.model('StopCompletion', stopCompletionSchema);
