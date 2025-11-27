require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function testLogin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const username = 'admin';
    const password = 'admin123';
    const role = 'admin';
    
    console.log('\n🔍 Testing login with:');
    console.log('Username:', username);
    console.log('Password:', password);
    console.log('Role:', role);
    
    const user = await User.findOne({ username, role, isActive: true });
    if (!user) {
      console.log('\n❌ User not found in database');
      console.log('\n📋 All users in database:');
      const allUsers = await User.find({});
      allUsers.forEach(u => {
        console.log(`- ${u.username} (${u.role}) - Active: ${u.isActive}`);
      });
      process.exit(1);
    }
    
    console.log('\n✅ User found:', user.username);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Active:', user.isActive);
    
    const isMatch = await user.comparePassword(password);
    console.log('\n🔐 Password match:', isMatch);
    
    if (isMatch) {
      console.log('\n✅ Login would succeed!');
    } else {
      console.log('\n❌ Password does not match');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testLogin();
