require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function createAdmin() {
  try {
    // Prevent running in production without explicit confirmation
    if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_SEED_SCRIPTS) {
      console.error('❌ Cannot run seed scripts in production.');
      console.error('   Set ALLOW_SEED_SCRIPTS=true to override.');
      process.exit(1);
    }

    // Accept password from CLI argument or env var, with default for development
    const adminPassword = process.argv[2] || process.env.ADMIN_PASSWORD || 'admin123';
    if (adminPassword === 'admin123' && process.env.NODE_ENV === 'production') {
      console.error('❌ Cannot use default password in production. Provide a password:');
      console.error('   node scripts/create-admin.js <password>');
      console.error('   or set ADMIN_PASSWORD env var.');
      process.exit(1);
    }

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
      password: adminPassword,
      email: 'admin@kolekta.com',
      role: 'admin',
      fullName: 'System Administrator',
      isActive: true
    });

    await admin.save();
    console.log('✅ Admin user created successfully!');
    console.log('Username: admin');
    console.log('Password:', adminPassword === 'admin123' ? 'admin123 (default - change in production!)' : '(custom password set)');
    console.log('Role: admin');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdmin();
