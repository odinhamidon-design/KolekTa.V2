const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema({
  bin: { type: mongoose.Schema.Types.ObjectId, ref: 'Bin', required: true },
  route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route' },
  collectedAt: { type: Date, default: Date.now, index: true },
  wasteAmount: Number,
  collectorId: { type: String, index: true },
  collectorName: String,
  notes: String
}, { timestamps: true });

// Indexes for common queries
collectionSchema.index({ collectedAt: -1 }); // For sorting by date
collectionSchema.index({ bin: 1 }); // For bin lookups
collectionSchema.index({ route: 1 }); // For route lookups
collectionSchema.index({ collectedAt: 1, route: 1 }); // For date range queries by route

module.exports = mongoose.model('Collection', collectionSchema);
