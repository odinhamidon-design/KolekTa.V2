require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function fixAdminPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    const admin = await User.findOne({ username: 'admin', role: 'admin' });
    
    if (!admin) {
      console.log('❌ Admin user not found');
      process.exit(1);
    }
    
    // Hash password manually and update directly
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await User.updateOne(
      { _id: admin._id },
      { $set: { password: hashedPassword } }
    );
    
    console.log('✅ Admin password fixed!');
    console.log('Username: admin');
    console.log('Password: admin123');
    
    // Test it
    const updatedAdmin = await User.findById(admin._id);
    const isMatch = await bcrypt.compare('admin123', updatedAdmin.password);
    console.log('✅ Password verification:', isMatch ? 'SUCCESS' : 'FAILED');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixAdminPassword();
