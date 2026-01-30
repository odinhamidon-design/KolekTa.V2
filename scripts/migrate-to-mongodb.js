/**
 * Migration Script: JSON Files to MongoDB
 * Run this once to migrate existing data to MongoDB
 * 
 * Usage: node scripts/migrate-to-mongodb.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Models
const User = require('../models/User');
const Truck = require('../models/Truck');
const Route = require('../models/Route');

const MONGODB_URI = process.env.MONGODB_URI;

async function migrate() {
  console.log('🚀 Starting migration to MongoDB...\n');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Migrate Users
    console.log('📦 Migrating Users...');
    const usersFile = path.join(__dirname, '../data/users.json');
    if (fs.existsSync(usersFile)) {
      const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
      
      for (const user of users) {
        const existing = await User.findOne({ username: user.username });
        if (!existing) {
          // Check if password is already hashed (starts with bcrypt prefix)
          const isAlreadyHashed = user.password.startsWith('$2a') || user.password.startsWith('$2b');

          if (isAlreadyHashed) {
            // Use insertOne to bypass the pre-save hook which would double-hash
            await User.collection.insertOne({
              username: user.username,
              email: user.email,
              password: user.password, // Already hashed, don't hash again
              role: user.role,
              fullName: user.fullName,
              phoneNumber: user.phoneNumber,
              profilePicture: user.profilePicture,
              securityQuestion: user.securityQuestion,
              securityAnswer: user.securityAnswer,
              isActive: user.isActive !== false,
              createdAt: new Date(),
              updatedAt: new Date()
            });
          } else {
            // Plain text password - use create() to trigger pre-save hook for hashing
            await User.create({
              username: user.username,
              email: user.email,
              password: user.password, // Will be hashed by pre-save hook
              role: user.role,
              fullName: user.fullName,
              phoneNumber: user.phoneNumber,
              profilePicture: user.profilePicture,
              securityQuestion: user.securityQuestion,
              securityAnswer: user.securityAnswer,
              isActive: user.isActive !== false
            });
          }
          console.log(`  ✅ Created user: ${user.username}${isAlreadyHashed ? ' (pre-hashed)' : ''}`);
        } else {
          console.log(`  ⏭️ User already exists: ${user.username}`);
        }
      }
    }
    
    // Migrate Trucks
    console.log('\n📦 Migrating Trucks...');
    const trucksFile = path.join(__dirname, '../data/trucks.json');
    if (fs.existsSync(trucksFile)) {
      const trucks = JSON.parse(fs.readFileSync(trucksFile, 'utf8'));
      
      for (const truck of trucks) {
        const existing = await Truck.findOne({ truckId: truck.truckId });
        if (!existing) {
          await Truck.create({
            truckId: truck.truckId,
            plateNumber: truck.plateNumber,
            model: truck.model,
            capacity: truck.capacity,
            status: truck.status,
            assignedDriver: truck.assignedDriver,
            lastMaintenance: truck.lastMaintenance,
            nextMaintenance: truck.nextMaintenance,
            fuelLevel: truck.fuelLevel,
            mileage: truck.mileage,
            notes: truck.notes
          });
          console.log(`  ✅ Created truck: ${truck.truckId}`);
        } else {
          console.log(`  ⏭️ Truck already exists: ${truck.truckId}`);
        }
      }
    }
    
    // Migrate Routes
    console.log('\n📦 Migrating Routes...');
    const routesFile = path.join(__dirname, '../data/routes.json');
    if (fs.existsSync(routesFile)) {
      const routes = JSON.parse(fs.readFileSync(routesFile, 'utf8'));
      
      for (const route of routes) {
        const existing = await Route.findOne({ routeId: route.routeId });
        if (!existing) {
          await Route.create({
            routeId: route.routeId,
            name: route.name,
            path: route.path,
            distance: route.distance,
            status: route.status,
            assignedDriver: route.assignedDriver,
            notes: route.notes,
            completedAt: route.completedAt,
            completedBy: route.completedBy,
            completionNotes: route.completionNotes,
            completionPhotos: route.completionPhotos,
            notificationSent: route.notificationSent
          });
          console.log(`  ✅ Created route: ${route.routeId}`);
        } else {
          console.log(`  ⏭️ Route already exists: ${route.routeId}`);
        }
      }
    }
    
    console.log('\n✅ Migration completed successfully!');
    
    // Show summary
    const userCount = await User.countDocuments();
    const truckCount = await Truck.countDocuments();
    const routeCount = await Route.countDocuments();
    
    console.log('\n📊 Summary:');
    console.log(`  Users: ${userCount}`);
    console.log(`  Trucks: ${truckCount}`);
    console.log(`  Routes: ${routeCount}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

migrate();
