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
  notes: String,

  // Fuel tracking fields
  fuelTankCapacity: { type: Number, default: 60 }, // liters (typical garbage truck tank)
  fuelType: { type: String, enum: ['diesel', 'gasoline', 'cng'], default: 'diesel' },
  fuelEfficiency: { type: Number, default: 4 }, // km per liter (base efficiency)
  totalFuelConsumed: { type: Number, default: 0 }, // lifetime liters consumed
  totalFuelCost: { type: Number, default: 0 }, // lifetime fuel cost
  lastRefuelDate: Date,
  lastRefuelLiters: Number,
  averageFuelConsumption: { type: Number, default: 25 } // L/100km average for garbage trucks
}, { timestamps: true });

// Add indexes for faster queries
truckSchema.index({ assignedDriver: 1 });
truckSchema.index({ status: 1 });

module.exports = mongoose.models.Truck || mongoose.model('Truck', truckSchema);
