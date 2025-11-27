require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function fixAllPasswords() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get all users
    const users = await User.find({});
    console.log(`\n📋 Found ${users.length} users\n`);
    
    for (const user of users) {
      // Set default password based on role
      const defaultPassword = user.role === 'admin' ? 'admin123' : 'driver123';
      
      // Hash and update directly
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      await User.updateOne(
        { _id: user._id },
        { $set: { password: hashedPassword } }
      );
      
      console.log(`✅ Fixed password for: ${user.username} (${user.role})`);
      console.log(`   Password: ${defaultPassword}`);
    }
    
    console.log('\n✅ All passwords fixed!');
    console.log('\n📝 Login credentials:');
    console.log('Admin: username=admin, password=admin123');
    console.log('Drivers: username=<driver_username>, password=driver123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixAllPasswords();
