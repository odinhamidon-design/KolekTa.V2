const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema({
  bin: { type: mongoose.Schema.Types.ObjectId, ref: 'Bin', required: true },
  route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route' },
  collectedAt: { type: Date, default: Date.now },
  wasteAmount: Number,
  collectorId: String,
  notes: String
}, { timestamps: true });

module.exports = mongoose.model('Collection', collectionSchema);
