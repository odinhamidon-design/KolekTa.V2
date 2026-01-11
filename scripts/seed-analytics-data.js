/**
 * Seed Analytics Mock Data: Completed routes for the past 30 days
 * Run: node scripts/seed-analytics-data.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Route = require('../models/Route');
const User = require('../models/User');
const Truck = require('../models/Truck');

// All 26 Mati City barangays with approximate center coordinates
const barangays = [
  { name: 'Badas', center: { lat: 6.9380, lng: 126.2050 } },
  { name: 'Bobon', center: { lat: 6.9420, lng: 126.2250 } },
  { name: 'Buso', center: { lat: 6.9350, lng: 126.2380 } },
  { name: 'Cabuaya', center: { lat: 6.9580, lng: 126.1980 } },
  { name: 'Central', center: { lat: 6.9549, lng: 126.2185 } },
  { name: 'Culaman', center: { lat: 6.9680, lng: 126.2350 } },
  { name: 'Dahican', center: { lat: 6.9150, lng: 126.2850 } },
  { name: 'Danao', center: { lat: 6.9750, lng: 126.2100 } },
  { name: 'Dawan', center: { lat: 6.9480, lng: 126.2450 } },
  { name: 'Don Enrique Lopez', center: { lat: 6.9620, lng: 126.2280 } },
  { name: 'Don Martin Marundan', center: { lat: 6.9720, lng: 126.1950 } },
  { name: 'Don Salvador Lopez', center: { lat: 6.9520, lng: 126.2080 } },
  { name: 'Langka', center: { lat: 6.9450, lng: 126.1920 } },
  { name: 'Lawigan', center: { lat: 6.9280, lng: 126.2180 } },
  { name: 'Libudon', center: { lat: 6.9650, lng: 126.2480 } },
  { name: 'Limot', center: { lat: 6.9180, lng: 126.2650 } },
  { name: 'Luban', center: { lat: 6.9320, lng: 126.2520 } },
  { name: 'Macambol', center: { lat: 6.9580, lng: 126.2550 } },
  { name: 'Mamali', center: { lat: 6.9480, lng: 126.1850 } },
  { name: 'Matiao', center: { lat: 6.9380, lng: 126.2680 } },
  { name: 'Mayo', center: { lat: 6.9220, lng: 126.2350 } },
  { name: 'Sainz', center: { lat: 6.9620, lng: 126.2080 } },
  { name: 'Sanghay', center: { lat: 6.9250, lng: 126.2480 } },
  { name: 'Tagabakid', center: { lat: 6.9780, lng: 126.2250 } },
  { name: 'Tagbinonga', center: { lat: 6.9480, lng: 126.2320 } },
  { name: 'Taguibo', center: { lat: 6.9350, lng: 126.1780 } }
];

// High-activity barangays (urban areas - more collections)
const highActivityBarangays = ['Central', 'Sainz', 'Bobon', 'Don Salvador Lopez', 'Dahican', 'Badas'];

// Medium-activity barangays
const mediumActivityBarangays = ['Dawan', 'Tagbinonga', 'Don Enrique Lopez', 'Langka', 'Cabuaya', 'Danao'];

// Generate route path coordinates around a center point
function generateRoutePath(center, numPoints = 8) {
  const points = [];

  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;
    const radius = 0.003 + Math.random() * 0.008; // ~300m-1.1km radius
    points.push([
      center.lng + radius * Math.cos(angle) + (Math.random() - 0.5) * 0.002,
      center.lat + radius * Math.sin(angle) + (Math.random() - 0.5) * 0.002
    ]);
  }
  // Close the loop
  points.push([points[0][0], points[0][1]]);

  return {
    type: 'LineString',
    coordinates: points
  };
}

// Generate random date within past N days
function randomDateInPastDays(days) {
  const now = new Date();
  const pastDate = new Date(now.getTime() - Math.random() * days * 24 * 60 * 60 * 1000);
  return pastDate;
}

// Get specific date N days ago
function daysAgo(n) {
  const date = new Date();
  date.setDate(date.getDate() - n);
  date.setHours(Math.floor(Math.random() * 10) + 6, Math.floor(Math.random() * 60), 0, 0); // 6 AM - 4 PM
  return date;
}

async function seedAnalyticsData() {
  console.log('🌱 Seeding analytics mock data to MongoDB...\n');

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get existing drivers
    const drivers = await User.find({ role: 'driver' }).lean();
    if (drivers.length === 0) {
      console.log('⚠️  No drivers found. Please run seed-mock-data.js first.');
      return;
    }

    // Get existing trucks
    const trucks = await Truck.find().lean();
    if (trucks.length === 0) {
      console.log('⚠️  No trucks found. Please run seed-mock-data.js first.');
      return;
    }

    console.log(`📊 Found ${drivers.length} drivers and ${trucks.length} trucks\n`);

    let completedCount = 0;
    const routesToCreate = [];

    // Generate completed routes for the past 30 days
    for (let day = 0; day < 30; day++) {
      const collectionDate = daysAgo(day);

      // Determine how many routes for this day (more on weekdays)
      const dayOfWeek = collectionDate.getDay();
      const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
      const baseRoutes = isWeekday ? 8 : 3; // More routes on weekdays
      const numRoutes = baseRoutes + Math.floor(Math.random() * 4);

      // Select barangays for this day with weighted distribution
      const selectedBarangays = [];

      // Always include some high-activity barangays
      const numHighActivity = Math.min(Math.floor(numRoutes * 0.5), highActivityBarangays.length);
      for (let i = 0; i < numHighActivity; i++) {
        const idx = Math.floor(Math.random() * highActivityBarangays.length);
        const barangayName = highActivityBarangays[idx];
        const barangay = barangays.find(b => b.name === barangayName);
        if (barangay && !selectedBarangays.find(b => b.name === barangay.name)) {
          selectedBarangays.push(barangay);
        }
      }

      // Add some medium-activity barangays
      const numMediumActivity = Math.min(Math.floor(numRoutes * 0.3), mediumActivityBarangays.length);
      for (let i = 0; i < numMediumActivity; i++) {
        const idx = Math.floor(Math.random() * mediumActivityBarangays.length);
        const barangayName = mediumActivityBarangays[idx];
        const barangay = barangays.find(b => b.name === barangayName);
        if (barangay && !selectedBarangays.find(b => b.name === barangay.name)) {
          selectedBarangays.push(barangay);
        }
      }

      // Fill remaining with random barangays
      while (selectedBarangays.length < numRoutes) {
        const randomBarangay = barangays[Math.floor(Math.random() * barangays.length)];
        if (!selectedBarangays.find(b => b.name === randomBarangay.name)) {
          selectedBarangays.push(randomBarangay);
        }
      }

      // Create completed routes for selected barangays
      for (let i = 0; i < selectedBarangays.length; i++) {
        const barangay = selectedBarangays[i];
        const driver = drivers[Math.floor(Math.random() * drivers.length)];
        const truck = trucks[Math.floor(Math.random() * trucks.length)];

        const routeId = `ANALYTICS-${collectionDate.toISOString().split('T')[0]}-${barangay.name.replace(/\s+/g, '-').toUpperCase()}-${i}`;

        // Vary completion time slightly
        const completedAt = new Date(collectionDate);
        completedAt.setHours(completedAt.getHours() + Math.floor(Math.random() * 3) + 1);

        const distance = 2 + Math.random() * 5; // 2-7 km
        const numStops = 5 + Math.floor(Math.random() * 10); // 5-15 stops

        routesToCreate.push({
          routeId,
          name: `Brgy. ${barangay.name} Collection`,
          path: generateRoutePath(barangay.center, 6 + Math.floor(Math.random() * 6)),
          distance: Math.round(distance * 1000), // in meters
          estimatedTime: Math.round(distance * 15), // ~15 min per km
          status: 'completed',
          assignedVehicle: truck.truckId,
          assignedDriver: driver.username,
          scheduledDate: collectionDate,
          completedAt: completedAt,
          completedBy: driver.username,
          completionNotes: `Regular collection completed in Barangay ${barangay.name}`,
          tripStats: {
            distanceTraveled: Math.round(distance * 1000) / 1000,
            fuelConsumed: Math.round(distance * 0.25 * 100) / 100, // ~0.25 L/km
            stopsCompleted: numStops,
            averageSpeed: 15 + Math.random() * 10 // 15-25 km/h
          }
        });

        completedCount++;
      }
    }

    // Insert all routes
    console.log(`📝 Creating ${routesToCreate.length} completed routes...`);

    // Use insertMany with ordered: false to skip duplicates
    try {
      const result = await Route.insertMany(routesToCreate, { ordered: false });
      console.log(`✅ Successfully created ${result.length} routes\n`);
    } catch (err) {
      if (err.code === 11000) {
        // Handle duplicate key errors
        const inserted = err.insertedDocs ? err.insertedDocs.length : 0;
        console.log(`✅ Created ${inserted} new routes (some already existed)\n`);
      } else {
        throw err;
      }
    }

    // Generate summary by barangay
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Analytics Data Summary (past 30 days):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Count routes by barangay
    const completedRoutes = await Route.find({
      status: 'completed',
      routeId: { $regex: /^ANALYTICS-/ }
    }).lean();

    const barangayCounts = {};
    completedRoutes.forEach(route => {
      const match = route.name.match(/Brgy\. (.+) Collection/);
      if (match) {
        const name = match[1];
        barangayCounts[name] = (barangayCounts[name] || 0) + 1;
      }
    });

    // Sort by count descending
    const sortedBarangays = Object.entries(barangayCounts)
      .sort((a, b) => b[1] - a[1]);

    console.log('\nTop 10 serviced barangays:');
    sortedBarangays.slice(0, 10).forEach(([name, count], i) => {
      console.log(`   ${i + 1}. ${name}: ${count} collections`);
    });

    const totalCompletions = await Route.countDocuments({
      status: 'completed',
      completedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    console.log(`\n   📍 Total completed routes (30 days): ${totalCompletions}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ Analytics mock data seeding complete!');
    console.log('\n📈 Now check the Analytics module to see the heatmap data.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

seedAnalyticsData();
