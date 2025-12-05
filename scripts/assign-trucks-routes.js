/**
 * Assign Trucks and Routes to All Drivers
 * Run: node scripts/assign-trucks-routes.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Truck = require('../models/Truck');
const Route = require('../models/Route');

// Mati City barangay locations for routes
const barangayLocations = {
  'Central': { lat: 6.9549, lng: 126.2185 },
  'Poblacion': { lat: 6.9551, lng: 126.2166 },
  'Dahican': { lat: 6.9833, lng: 126.2500 },
  'Badas': { lat: 6.9200, lng: 126.2300 },
  'Sainz': { lat: 6.9400, lng: 126.2100 },
  'Matiao': { lat: 6.9300, lng: 126.1900 },
  'Dawan': { lat: 6.9100, lng: 126.2000 },
  'Langka': { lat: 6.9700, lng: 126.2400 },
  'Mayaon': { lat: 6.9600, lng: 126.2050 },
  'Bobon': { lat: 6.9450, lng: 126.2350 },
  'Limot': { lat: 6.9650, lng: 126.1950 },
  'Cabuaya': { lat: 6.9000, lng: 126.2150 },
  'Don Marcelino': { lat: 6.9750, lng: 126.2250 },
  'Tagbinonga': { lat: 6.9350, lng: 126.2450 },
  'Luzon': { lat: 6.9150, lng: 126.2250 },
  'Mamali': { lat: 6.9500, lng: 126.1850 },
  'Don Enrique': { lat: 6.9250, lng: 126.2050 },
  'Sanghay': { lat: 6.9050, lng: 126.2350 },
  'Macangao': { lat: 6.9800, lng: 126.2150 },
  'Taguibo': { lat: 6.9400, lng: 126.2500 },
  'Mayo': { lat: 6.9650, lng: 126.2300 },
  'Bagumbayan': { lat: 6.9550, lng: 126.2000 }
};

const truckModels = [
  'Isuzu Elf NKR', 'Mitsubishi Canter', 'Hino Dutro', 'Isuzu Forward',
  'Fuso Fighter', 'Hino Ranger', 'Isuzu Giga', 'Mitsubishi Fuso',
  'Foton Tornado', 'JAC N-Series', 'Sinotruk Howo', 'Dongfeng DFA'
];

function generatePlate() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const l1 = letters[Math.floor(Math.random() * 26)];
  const l2 = letters[Math.floor(Math.random() * 26)];
  const l3 = letters[Math.floor(Math.random() * 26)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${l1}${l2}${l3}-${num}`;
}

function generateRoutePath(center) {
  const points = [];
  const numPoints = 6 + Math.floor(Math.random() * 4);
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;
    const radius = 0.003 + Math.random() * 0.008;
    points.push([
      center.lng + radius * Math.cos(angle),
      center.lat + radius * Math.sin(angle)
    ]);
  }
  points.push(points[0]);
  return { type: 'LineString', coordinates: points };
}

async function assignAll() {
  console.log('🔧 Assigning trucks and routes to all drivers...\n');

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all drivers without truck assignment
    const drivers = await User.find({ role: 'driver' }).select('username fullName');
    console.log(`Found ${drivers.length} drivers\n`);

    const barangays = Object.keys(barangayLocations);
    let assignedCount = 0;

    for (let i = 0; i < drivers.length; i++) {
      const driver = drivers[i];
      const barangay = barangays[i % barangays.length];
      const coords = barangayLocations[barangay];

      // Check if driver already has a truck
      let truck = await Truck.findOne({ assignedDriver: driver.username });

      if (!truck) {
        // Create new truck for driver
        const truckId = `GCT-${String(i + 1).padStart(3, '0')}`;
        const existingTruck = await Truck.findOne({ truckId });

        if (!existingTruck) {
          truck = await Truck.create({
            truckId: truckId,
            plateNumber: generatePlate(),
            model: truckModels[i % truckModels.length],
            capacity: 1000 + Math.floor(Math.random() * 500),
            status: 'in-use',
            assignedDriver: driver.username,
            fuelLevel: 40 + Math.floor(Math.random() * 60),
            mileage: Math.floor(Math.random() * 80000),
            fuelTankCapacity: 60,
            fuelType: 'diesel'
          });
          console.log(`🚛 Created & assigned truck ${truckId} to ${driver.username}`);
        } else {
          // Assign existing unassigned truck
          if (!existingTruck.assignedDriver) {
            existingTruck.assignedDriver = driver.username;
            existingTruck.status = 'in-use';
            await existingTruck.save();
            truck = existingTruck;
            console.log(`🚛 Assigned existing truck ${truckId} to ${driver.username}`);
          }
        }
      } else {
        console.log(`✓ ${driver.username} already has truck ${truck.truckId}`);
      }

      // Check if driver already has a route
      let route = await Route.findOne({ assignedDriver: driver.username });

      if (!route) {
        // Create new route for driver
        const routeId = `RTE-${barangay.toUpperCase().replace(/\s+/g, '')}-${String(i + 1).padStart(2, '0')}`;
        const existingRoute = await Route.findOne({ routeId });

        if (!existingRoute) {
          route = await Route.create({
            routeId: routeId,
            name: `Brgy. ${barangay} Collection`,
            path: generateRoutePath(coords),
            distance: 2000 + Math.floor(Math.random() * 4000),
            status: 'active',
            assignedDriver: driver.username,
            assignedVehicle: truck ? truck.truckId : null,
            notes: `Daily waste collection for Barangay ${barangay}`
          });
          console.log(`🗺️  Created & assigned route ${routeId} to ${driver.username}`);
        }
      } else {
        console.log(`✓ ${driver.username} already has route ${route.routeId}`);
      }

      // Update route with vehicle if missing
      if (route && truck && !route.assignedVehicle) {
        route.assignedVehicle = truck.truckId;
        await route.save();
      }

      assignedCount++;
    }

    // Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 ASSIGNMENT SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const allDrivers = await User.find({ role: 'driver' }).select('username fullName');
    const allTrucks = await Truck.find({});
    const allRoutes = await Route.find({});

    console.log(`\n👥 Drivers: ${allDrivers.length}`);
    console.log(`🚛 Trucks: ${allTrucks.length} (${allTrucks.filter(t => t.assignedDriver).length} assigned)`);
    console.log(`🗺️  Routes: ${allRoutes.length} (${allRoutes.filter(r => r.assignedDriver).length} assigned)`);

    console.log('\n📋 DRIVER ASSIGNMENTS:');
    console.log('─────────────────────────────────────────');

    for (const driver of allDrivers) {
      const truck = await Truck.findOne({ assignedDriver: driver.username });
      const route = await Route.findOne({ assignedDriver: driver.username });
      console.log(`${driver.fullName || driver.username}:`);
      console.log(`   🚛 ${truck ? truck.truckId + ' (' + truck.plateNumber + ')' : 'No truck'}`);
      console.log(`   🗺️  ${route ? route.name : 'No route'}`);
    }

    console.log('\n✅ All assignments complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

assignAll();
