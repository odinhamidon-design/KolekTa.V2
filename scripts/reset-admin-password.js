require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function resetAdminPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const admin = await User.findOne({ username: 'admin', role: 'admin' });
    if (!admin) {
      console.log('❌ Admin user not found');
      process.exit(1);
    }
    
    // Reset password to admin123
    admin.password = 'admin123';
    await admin.save();
    
    console.log('✅ Admin password reset successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

resetAdminPassword();
