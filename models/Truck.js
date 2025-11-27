const mongoose = require('mongoose');

const truckSchema = new mongoose.Schema({
  truckId: { type: String, required: true, unique: true },
  plateNumber: { type: String, required: true, unique: true },
  model: String,
  capacity: { type: Number, default: 1000 }, // in kg
  status: { 
    type: String, 
    enum: ['available', 'in-use', 'maintenance', 'out-of-service'], 
    default: 'available' 
  },
  assignedDriver: String, // Changed to String for username
  lastMaintenance: Date,
  nextMaintenance: Date,
  fuelLevel: { type: Number, default: 100 }, // percentage
  mileage: { type: Number, default: 0 }, // in km
  notes: String
}, { timestamps: true });

module.exports = mongoose.models.Truck || mongoose.model('Truck', truckSchema);
