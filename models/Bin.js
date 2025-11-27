const mongoose = require('mongoose');

const binSchema = new mongoose.Schema({
  binId: { type: String, required: true, unique: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }
  },
  address: String,
  capacity: { type: Number, default: 100 },
  currentLevel: { type: Number, default: 0 },
  status: { type: String, enum: ['empty', 'low', 'medium', 'high', 'full'], default: 'empty' },
  lastCollection: Date,
  binType: { type: String, enum: ['general', 'recyclable', 'organic'], default: 'general' }
}, { timestamps: true });

binSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Bin', binSchema);
