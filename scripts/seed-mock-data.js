/**
 * Seed Mock Data: 10 Drivers with Trucks and Routes
 * Run: node scripts/seed-mock-data.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Truck = require('../models/Truck');
const Route = require('../models/Route');

// Mati City and surrounding barangays coordinates
const locations = {
  matiCityHall: { lat: 6.9549, lng: 126.2185 },
  poblacion: { lat: 6.9551, lng: 126.2166 },
  dahican: { lat: 6.9833, lng: 126.2500 },
  badas: { lat: 6.9200, lng: 126.2300 },
  sainz: { lat: 6.9400, lng: 126.2100 },
  matiao: { lat: 6.9300, lng: 126.1900 },
  dawan: { lat: 6.9100, lng: 126.2000 },
  langka: { lat: 6.9700, lng: 126.2400 },
  mayaon: { lat: 6.9600, lng: 126.2050 },
  bobon: { lat: 6.9450, lng: 126.2350 },
  limot: { lat: 6.9650, lng: 126.1950 },
  cabuaya: { lat: 6.9000, lng: 126.2150 }
};

// Mock drivers data
const driversData = [
  { username: 'pedro_garcia', fullName: 'Pedro Garcia', phone: '09171234501', area: 'poblacion' },
  { username: 'juan_santos', fullName: 'Juan Santos', phone: '09171234502', area: 'dahican' },
  { username: 'miguel_reyes', fullName: 'Miguel Reyes', phone: '09171234503', area: 'badas' },
  { username: 'carlos_cruz', fullName: 'Carlos Cruz', phone: '09171234504', area: 'sainz' },
  { username: 'ramon_lopez', fullName: 'Ramon Lopez', phone: '09171234505', area: 'matiao' },
  { username: 'antonio_dela_cruz', fullName: 'Antonio Dela Cruz', phone: '09171234506', area: 'dawan' },
  { username: 'jose_mendoza', fullName: 'Jose Mendoza', phone: '09171234507', area: 'langka' },
  { username: 'mario_fernandez', fullName: 'Mario Fernandez', phone: '09171234508', area: 'mayaon' },
  { username: 'roberto_villanueva', fullName: 'Roberto Villanueva', phone: '09171234509', area: 'bobon' },
  { username: 'francisco_ramos', fullName: 'Francisco Ramos', phone: '09171234510', area: 'limot' }
];

// Truck models
const truckModels = [
  'Isuzu Elf NKR',
  'Mitsubishi Canter',
  'Hino Dutro',
  'Isuzu Forward',
  'Fuso Fighter',
  'Hino Ranger',
  'Isuzu Giga',
  'Mitsubishi Fuso',
  'Foton Tornado',
  'JAC N-Series'
];

// Generate random plate number
function generatePlate() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const l1 = letters[Math.floor(Math.random() * 26)];
  const l2 = letters[Math.floor(Math.random() * 26)];
  const l3 = letters[Math.floor(Math.random() * 26)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${l1}${l2}${l3}-${num}`;
}

// Generate route path around a center point
function generateRoutePath(center, routeName) {
  const points = [];
  const numPoints = 5 + Math.floor(Math.random() * 5); // 5-10 points

  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;
    const radius = 0.005 + Math.random() * 0.01; // ~0.5-1.5km radius
    points.push([
      center.lng + radius * Math.cos(angle),
      center.lat + radius * Math.sin(angle)
    ]);
  }
  // Close the loop
  points.push(points[0]);

  return {
    type: 'LineString',
    coordinates: points
  };
}

async function seedData() {
  // Prevent running in production without explicit confirmation
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_SEED_SCRIPTS) {
    console.error('❌ Cannot run seed scripts in production.');
    console.error('   Set ALLOW_SEED_SCRIPTS=true to override.');
    process.exit(1);
  }

  // Accept driver password from CLI argument or env var
  const driverPassword = process.argv[2] || process.env.SEED_PASSWORD || 'driver123';
  if (driverPassword === 'driver123' && process.env.NODE_ENV === 'production') {
    console.error('❌ Cannot use default password in production. Provide a password:');
    console.error('   node scripts/seed-mock-data.js <password>');
    console.error('   or set SEED_PASSWORD env var.');
    process.exit(1);
  }

  console.log('🌱 Seeding mock data to MongoDB...\n');

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const hashedPassword = await bcrypt.hash(driverPassword, 10);

    for (let i = 0; i < driversData.length; i++) {
      const driver = driversData[i];
      const areaCoords = locations[driver.area];

      // Check if driver already exists
      const existingUser = await User.findOne({ username: driver.username });
      if (existingUser) {
        console.log(`⏭️  Driver ${driver.username} already exists, skipping...`);
        continue;
      }

      // Create User
      const newUser = await User.create({
        username: driver.username,
        email: `${driver.username}@kolekta.ph`,
        password: hashedPassword,
        role: 'driver',
        fullName: driver.fullName,
        phoneNumber: driver.phone,
        isActive: true,
        securityQuestion: 'What is your favorite color?',
        securityAnswer: 'blue'
      });
      console.log(`✅ Created driver: ${driver.fullName}`);

      // Create Truck
      const truckId = `TRK-${String(i + 1).padStart(3, '0')}`;
      const existingTruck = await Truck.findOne({ truckId });

      if (!existingTruck) {
        await Truck.create({
          truckId: truckId,
          plateNumber: generatePlate(),
          model: truckModels[i],
          capacity: 1000 + Math.floor(Math.random() * 500),
          status: 'in-use',
          assignedDriver: driver.username,
          fuelLevel: 50 + Math.floor(Math.random() * 50),
          mileage: Math.floor(Math.random() * 50000),
          fuelTankCapacity: 60,
          fuelType: 'diesel',
          notes: `Assigned to ${driver.fullName} for ${driver.area} route`
        });
        console.log(`   🚛 Created truck: ${truckId} (${truckModels[i]})`);
      }

      // Create Route
      const routeId = `RTE-${driver.area.toUpperCase()}-${String(i + 1).padStart(2, '0')}`;
      const existingRoute = await Route.findOne({ routeId });

      if (!existingRoute) {
        await Route.create({
          routeId: routeId,
          name: `Brgy. ${driver.area.charAt(0).toUpperCase() + driver.area.slice(1)} Collection Route`,
          path: generateRoutePath(areaCoords, driver.area),
          distance: 2000 + Math.floor(Math.random() * 3000), // 2-5km
          status: 'active',
          assignedDriver: driver.username,
          assignedVehicle: truckId,
          notes: `Daily collection route for Barangay ${driver.area}`
        });
        console.log(`   🗺️  Created route: ${routeId}`);
      }

      console.log('');
    }

    // Summary
    const userCount = await User.countDocuments({ role: 'driver' });
    const truckCount = await Truck.countDocuments();
    const routeCount = await Route.countDocuments();

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Database Summary:');
    console.log(`   👥 Total Drivers: ${userCount}`);
    console.log(`   🚛 Total Trucks: ${truckCount}`);
    console.log(`   🗺️  Total Routes: ${routeCount}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ Mock data seeding complete!');
    console.log(`\n📝 All new drivers use password: ${driverPassword === 'driver123' ? 'driver123 (default - change in production!)' : '(custom password set)'}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

seedData();
