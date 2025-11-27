require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Import models
const User = require('../models/User');
const Truck = require('../models/Truck');
const Route = require('../models/Route');

async function migrate() {
  try {
    console.log('🚀 Starting migration to MongoDB...\n');
    
    // Check if USE_MOCK_AUTH is false
    if (process.env.USE_MOCK_AUTH === 'true') {
      console.log('⚠️  Warning: USE_MOCK_AUTH is set to true in .env');
      console.log('   Please set USE_MOCK_AUTH=false to use MongoDB');
      console.log('   Migration will continue anyway...\n');
    }
    
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Read JSON files
    console.log('📂 Reading JSON files...');
    const usersPath = path.join(__dirname, '../data/users.json');
    const trucksPath = path.join(__dirname, '../data/trucks.json');
    const routesPath = path.join(__dirname, '../data/routes.json');
    
    if (!fs.existsSync(usersPath)) {
      throw new Error('users.json not found!');
    }
    if (!fs.existsSync(trucksPath)) {
      throw new Error('trucks.json not found!');
    }
    if (!fs.existsSync(routesPath)) {
      throw new Error('routes.json not found!');
    }
    
    const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    const trucksData = JSON.parse(fs.readFileSync(trucksPath, 'utf8'));
    const routesData = JSON.parse(fs.readFileSync(routesPath, 'utf8'));
    
    console.log(`   Found ${usersData.length} users`);
    console.log(`   Found ${trucksData.length} trucks`);
    console.log(`   Found ${routesData.length} routes\n`);
    
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Truck.deleteMany({});
    await Route.deleteMany({});
    console.log('✅ Cleared existing data\n');
    
    // Migrate Users
    console.log('👥 Migrating users...');
    let userCount = 0;
    for (const user of usersData) {
      try {
        // Hash password if not already hashed
        if (!user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
          console.log(`   Hashing password for ${user.username}...`);
          user.password = await bcrypt.hash(user.password, 10);
        }
        
        // Create user
        await User.create({
          username: user.username,
          email: user.email,
          password: user.password,
          role: user.role,
          fullName: user.fullName,
          phoneNumber: user.phoneNumber,
          isActive: user.isActive !== undefined ? user.isActive : true,
          securityQuestion: user.securityQuestion,
          securityAnswer: user.securityAnswer,
          faceDescriptor: user.faceDescriptor
        });
        
        userCount++;
        console.log(`   ✓ Migrated user: ${user.username} (${user.role})`);
      } catch (error) {
        console.error(`   ✗ Failed to migrate user ${user.username}:`, error.message);
      }
    }
    console.log(`✅ Migrated ${userCount}/${usersData.length} users\n`);
    
    // Migrate Trucks
    console.log('🚛 Migrating trucks...');
    let truckCount = 0;
    for (const truck of trucksData) {
      try {
        await Truck.create({
          truckId: truck.truckId,
          plateNumber: truck.plateNumber,
          model: truck.model,
          capacity: truck.capacity,
          status: truck.status || 'available',
          assignedDriver: truck.assignedDriver,
          lastMaintenance: truck.lastMaintenance,
          nextMaintenance: truck.nextMaintenance,
          fuelLevel: truck.fuelLevel,
          mileage: truck.mileage,
          notes: truck.notes
        });
        
        truckCount++;
        console.log(`   ✓ Migrated truck: ${truck.truckId} (${truck.plateNumber})`);
      } catch (error) {
        console.error(`   ✗ Failed to migrate truck ${truck.truckId}:`, error.message);
      }
    }
    console.log(`✅ Migrated ${truckCount}/${trucksData.length} trucks\n`);
    
    // Migrate Routes
    console.log('📍 Migrating routes...');
    let routeCount = 0;
    for (const route of routesData) {
      try {
        await Route.create({
          routeId: route.routeId,
          name: route.name,
          path: route.path,
          distance: route.distance,
          status: route.status || 'planned',
          assignedDriver: route.assignedDriver,
          notes: route.notes,
          completedAt: route.completedAt,
          completedBy: route.completedBy,
          completionNotes: route.completionNotes,
          completionPhotos: route.completionPhotos,
          notificationSent: route.notificationSent
        });
        
        routeCount++;
        console.log(`   ✓ Migrated route: ${route.routeId} (${route.name})`);
      } catch (error) {
        console.error(`   ✗ Failed to migrate route ${route.routeId}:`, error.message);
      }
    }
    console.log(`✅ Migrated ${routeCount}/${routesData.length} routes\n`);
    
    // Summary
    console.log('═══════════════════════════════════════');
    console.log('🎉 Migration completed successfully!');
    console.log('═══════════════════════════════════════');
    console.log(`✅ Users:  ${userCount}/${usersData.length}`);
    console.log(`✅ Trucks: ${truckCount}/${trucksData.length}`);
    console.log(`✅ Routes: ${routeCount}/${routesData.length}`);
    console.log('═══════════════════════════════════════\n');
    
    console.log('📝 Next steps:');
    console.log('   1. Make sure USE_MOCK_AUTH=false in .env');
    console.log('   2. Restart server: npm start');
    console.log('   3. Test login and features\n');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

// Run migration
migrate();
