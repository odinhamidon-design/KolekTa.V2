require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function createDefaultUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kolekta');
    console.log('Connected to MongoDB');
    
    // Create admin user
    const admin = await User.findOne({ username: 'admin' });
    if (!admin) {
      await User.create({
        username: 'admin',
        email: 'admin@kolekta.com',
        password: 'admin123',
        role: 'admin',
        fullName: 'System Administrator'
      });
      console.log('Admin user created: username=admin, password=admin123');
    } else {
      console.log('Admin user already exists');
    }
    
    // Create driver user
    const driver = await User.findOne({ username: 'driver1' });
    if (!driver) {
      await User.create({
        username: 'driver1',
        email: 'driver1@kolekta.com',
        password: 'driver123',
        role: 'driver',
        fullName: 'Juan Dela Cruz',
        phoneNumber: '09123456789'
      });
      console.log('Driver user created: username=driver1, password=driver123');
    } else {
      console.log('Driver user already exists');
    }
    
    console.log('\nDefault users ready!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createDefaultUsers();
