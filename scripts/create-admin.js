require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Check if admin exists
    const existingAdmin = await User.findOne({ username: 'admin', role: 'admin' });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      console.log('Username:', existingAdmin.username);
      console.log('Email:', existingAdmin.email);
      process.exit(0);
    }
    
    // Create admin user
    const admin = new User({
      username: 'admin',
      password: 'admin123',
      email: 'admin@kolekta.com',
      role: 'admin',
      fullName: 'System Administrator',
      isActive: true
    });
    
    await admin.save();
    console.log('✅ Admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Role: admin');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdmin();
