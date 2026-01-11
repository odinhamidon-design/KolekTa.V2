/**
 * Seed Resident Portal Data: Announcements and Schedules
 * Run: node scripts/seed-resident-portal-data.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Announcement = require('../models/Announcement');
const Schedule = require('../models/Schedule');
const Route = require('../models/Route');

// Mati City barangays
const BARANGAYS = [
  'Badas', 'Bobon', 'Buso', 'Cabuaya', 'Central', 'Dahican', 'Dawan',
  'Don Enrique Lopez', 'Don Martin Marundan', 'Don Salvador Lopez Sr.',
  'Langka', 'Libudon', 'Luban', 'Macambol', 'Mamali', 'Matiao', 'Mayo',
  'Sainz', 'San Agustin', 'San Antonio', 'Sanghay', 'Tagabakid',
  'Tagbinonga', 'Taguibo', 'Tamisan', 'Tarragona'
];

// Sample announcements
const announcementsData = [
  {
    title: 'Weekly Collection Schedule Reminder',
    content: 'Please ensure your waste bins are placed outside by 6:00 AM on your scheduled collection day. Segregate your waste properly: biodegradable (green), recyclable (blue), and residual waste (black).',
    type: 'info',
    targetScope: 'city-wide',
    targetBarangays: [],
    priority: 'normal',
    isActive: true
  },
  {
    title: 'Holiday Schedule: New Year 2026',
    content: 'There will be NO garbage collection on January 1, 2026 (New Year\'s Day). Collection will resume on January 2, 2026. Please store your waste properly during this period.',
    type: 'schedule-change',
    targetScope: 'city-wide',
    targetBarangays: [],
    priority: 'high',
    isActive: true
  },
  {
    title: 'E-Waste Collection Drive - January 2026',
    content: 'The City Environment Office is conducting a special e-waste collection drive from January 15-20, 2026. Bring your old electronics, batteries, and appliances to the designated drop-off points. Free disposal for all residents!',
    type: 'info',
    targetScope: 'city-wide',
    targetBarangays: [],
    priority: 'high',
    isActive: true
  },
  {
    title: 'Road Maintenance Notice - Central Area',
    content: 'Due to ongoing road repairs along National Highway, garbage trucks may experience delays in Barangay Central. We apologize for any inconvenience and ask for your patience.',
    type: 'warning',
    targetScope: 'barangay',
    targetBarangays: ['Central'],
    priority: 'normal',
    isActive: true
  },
  {
    title: 'Composting Workshop - Free Registration',
    content: 'Learn how to turn your kitchen waste into nutrient-rich compost! Free workshop on January 25, 2026 at Mati City Hall. Register at the City Environment Office. Limited slots available.',
    type: 'info',
    targetScope: 'city-wide',
    targetBarangays: [],
    priority: 'normal',
    isActive: true
  },
  {
    title: 'Flooding Advisory - Coastal Barangays',
    content: 'Due to expected heavy rains, garbage collection in coastal barangays may be suspended if flooding occurs. Please secure your waste bins and avoid placing them near drainage areas.',
    type: 'alert',
    targetScope: 'barangay',
    targetBarangays: ['Dahican', 'Bobon', 'Badas', 'Mayo'],
    priority: 'urgent',
    isActive: true
  },
  {
    title: 'Plastic-Free Week Initiative',
    content: 'Join us in reducing plastic waste! From January 20-27, 2026, we encourage all residents to minimize single-use plastics. Bring your own bags when shopping and refuse plastic straws.',
    type: 'info',
    targetScope: 'city-wide',
    targetBarangays: [],
    priority: 'normal',
    isActive: true
  },
  {
    title: 'New Recycling Drop-off Center',
    content: 'A new recycling drop-off center is now open at Barangay San Antonio! Accept items: plastic bottles, aluminum cans, paper, cardboard. Operating hours: Monday-Saturday, 8AM-5PM.',
    type: 'info',
    targetScope: 'barangay',
    targetBarangays: ['San Antonio', 'San Agustin', 'Sainz'],
    priority: 'normal',
    isActive: true
  }
];

// Sample schedules - will be linked to routes by barangay
const schedulesData = [
  // Monday-Wednesday-Friday schedules (Biodegradable)
  { barangay: 'Central', weeklyDays: [1, 3, 5], time: '07:00', wasteType: 'Biodegradable' },
  { barangay: 'Dahican', weeklyDays: [1, 3, 5], time: '07:30', wasteType: 'Biodegradable' },
  { barangay: 'Badas', weeklyDays: [1, 3, 5], time: '08:00', wasteType: 'Biodegradable' },
  { barangay: 'Bobon', weeklyDays: [1, 3, 5], time: '08:30', wasteType: 'Biodegradable' },
  { barangay: 'Sainz', weeklyDays: [1, 3, 5], time: '07:00', wasteType: 'Biodegradable' },
  { barangay: 'San Antonio', weeklyDays: [1, 3, 5], time: '07:30', wasteType: 'Biodegradable' },
  { barangay: 'San Agustin', weeklyDays: [1, 3, 5], time: '08:00', wasteType: 'Biodegradable' },
  { barangay: 'Matiao', weeklyDays: [1, 3, 5], time: '08:30', wasteType: 'Biodegradable' },

  // Tuesday-Thursday-Saturday schedules (Recyclable)
  { barangay: 'Central', weeklyDays: [2, 4, 6], time: '07:00', wasteType: 'Recyclable' },
  { barangay: 'Dahican', weeklyDays: [2, 4, 6], time: '07:30', wasteType: 'Recyclable' },
  { barangay: 'Badas', weeklyDays: [2, 4, 6], time: '08:00', wasteType: 'Recyclable' },
  { barangay: 'Bobon', weeklyDays: [2, 4, 6], time: '08:30', wasteType: 'Recyclable' },
  { barangay: 'Sainz', weeklyDays: [2, 4, 6], time: '07:00', wasteType: 'Recyclable' },
  { barangay: 'San Antonio', weeklyDays: [2, 4, 6], time: '07:30', wasteType: 'Recyclable' },
  { barangay: 'San Agustin', weeklyDays: [2, 4, 6], time: '08:00', wasteType: 'Recyclable' },
  { barangay: 'Matiao', weeklyDays: [2, 4, 6], time: '08:30', wasteType: 'Recyclable' },

  // Weekly Residual Waste (Saturday only)
  { barangay: 'Central', weeklyDays: [6], time: '14:00', wasteType: 'Residual' },
  { barangay: 'Dahican', weeklyDays: [6], time: '14:30', wasteType: 'Residual' },
  { barangay: 'Sainz', weeklyDays: [6], time: '14:00', wasteType: 'Residual' },
  { barangay: 'Matiao', weeklyDays: [6], time: '14:30', wasteType: 'Residual' },

  // Other barangays - twice weekly
  { barangay: 'Dawan', weeklyDays: [2, 5], time: '07:00', wasteType: 'Mixed' },
  { barangay: 'Langka', weeklyDays: [2, 5], time: '07:30', wasteType: 'Mixed' },
  { barangay: 'Cabuaya', weeklyDays: [1, 4], time: '08:00', wasteType: 'Mixed' },
  { barangay: 'Macambol', weeklyDays: [1, 4], time: '08:30', wasteType: 'Mixed' },
  { barangay: 'Mamali', weeklyDays: [3, 6], time: '07:00', wasteType: 'Mixed' },
  { barangay: 'Mayo', weeklyDays: [3, 6], time: '07:30', wasteType: 'Mixed' },
  { barangay: 'Tagabakid', weeklyDays: [2, 5], time: '09:00', wasteType: 'Mixed' },
  { barangay: 'Tagbinonga', weeklyDays: [2, 5], time: '09:30', wasteType: 'Mixed' },
  { barangay: 'Taguibo', weeklyDays: [1, 4], time: '09:00', wasteType: 'Mixed' },
  { barangay: 'Tamisan', weeklyDays: [1, 4], time: '09:30', wasteType: 'Mixed' },
  { barangay: 'Tarragona', weeklyDays: [3, 6], time: '09:00', wasteType: 'Mixed' },
  { barangay: 'Libudon', weeklyDays: [3, 6], time: '09:30', wasteType: 'Mixed' },
  { barangay: 'Luban', weeklyDays: [2, 5], time: '10:00', wasteType: 'Mixed' },
  { barangay: 'Sanghay', weeklyDays: [1, 4], time: '10:00', wasteType: 'Mixed' },
  { barangay: 'Buso', weeklyDays: [2, 5], time: '10:30', wasteType: 'Mixed' },
  { barangay: 'Don Enrique Lopez', weeklyDays: [1, 4], time: '10:30', wasteType: 'Mixed' },
  { barangay: 'Don Martin Marundan', weeklyDays: [3, 6], time: '10:00', wasteType: 'Mixed' },
  { barangay: 'Don Salvador Lopez Sr.', weeklyDays: [3, 6], time: '10:30', wasteType: 'Mixed' }
];

// Generate route path around a center point
function generateRoutePath(lat, lng) {
  const points = [];
  const numPoints = 6;

  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;
    const radius = 0.005 + Math.random() * 0.008;
    points.push([
      lng + radius * Math.cos(angle),
      lat + radius * Math.sin(angle)
    ]);
  }
  points.push(points[0]); // Close the loop

  return {
    type: 'LineString',
    coordinates: points
  };
}

// Base coordinates for barangays (approximate)
const barangayCoords = {
  'Central': { lat: 6.9549, lng: 126.2185 },
  'Dahican': { lat: 6.9833, lng: 126.2500 },
  'Badas': { lat: 6.9200, lng: 126.2300 },
  'Bobon': { lat: 6.9450, lng: 126.2350 },
  'Sainz': { lat: 6.9400, lng: 126.2100 },
  'Matiao': { lat: 6.9300, lng: 126.1900 },
  'Dawan': { lat: 6.9100, lng: 126.2000 },
  'Langka': { lat: 6.9700, lng: 126.2400 },
  'Cabuaya': { lat: 6.9000, lng: 126.2150 },
  'San Antonio': { lat: 6.9500, lng: 126.2250 },
  'San Agustin': { lat: 6.9480, lng: 126.2200 },
  'Macambol': { lat: 6.9350, lng: 126.2050 },
  'Mamali': { lat: 6.9250, lng: 126.2150 },
  'Mayo': { lat: 6.9150, lng: 126.2250 },
  'Tagabakid': { lat: 6.9600, lng: 126.2300 },
  'Tagbinonga': { lat: 6.9650, lng: 126.2100 },
  'Taguibo': { lat: 6.9550, lng: 126.2050 },
  'Tamisan': { lat: 6.9400, lng: 126.2400 },
  'Tarragona': { lat: 6.9300, lng: 126.2350 },
  'Libudon': { lat: 6.9200, lng: 126.2100 },
  'Luban': { lat: 6.9100, lng: 126.2200 },
  'Sanghay': { lat: 6.9050, lng: 126.2300 },
  'Buso': { lat: 6.9350, lng: 126.2450 },
  'Don Enrique Lopez': { lat: 6.9450, lng: 126.2000 },
  'Don Martin Marundan': { lat: 6.9500, lng: 126.1950 },
  'Don Salvador Lopez Sr.': { lat: 6.9550, lng: 126.1900 }
};

async function seedData() {
  console.log('🌱 Seeding Resident Portal data...\n');

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Seed Announcements
    console.log('📢 Seeding Announcements...');
    let announcementCount = 0;

    for (const ann of announcementsData) {
      const existing = await Announcement.findOne({ title: ann.title });
      if (!existing) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 7)); // Random start within last week

        await Announcement.create({
          ...ann,
          startDate,
          endDate: ann.priority === 'urgent' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null,
          createdBy: 'admin'
        });
        console.log(`   ✅ Created: ${ann.title}`);
        announcementCount++;
      } else {
        console.log(`   ⏭️  Skipped (exists): ${ann.title}`);
      }
    }

    // Seed Routes and Schedules
    console.log('\n🗺️  Seeding Routes and Schedules...');
    let routeCount = 0;
    let scheduleCount = 0;

    for (const sched of schedulesData) {
      const barangay = sched.barangay;
      const coords = barangayCoords[barangay] || { lat: 6.9549, lng: 126.2185 };

      // Create or find route
      const routeId = `RTE-${barangay.replace(/\s+/g, '-').toUpperCase()}-${sched.wasteType.toUpperCase().substring(0, 3)}`;
      let route = await Route.findOne({ routeId });

      if (!route) {
        route = await Route.create({
          routeId,
          name: `Brgy. ${barangay} - ${sched.wasteType} Collection`,
          path: generateRoutePath(coords.lat, coords.lng),
          distance: 2000 + Math.floor(Math.random() * 3000),
          status: 'active',
          notes: `${sched.wasteType} waste collection route for Barangay ${barangay}`
        });
        console.log(`   🗺️  Created route: ${routeId}`);
        routeCount++;
      }

      // Create schedule
      const scheduleId = `SCH-${barangay.replace(/\s+/g, '-').toUpperCase()}-${sched.wasteType.toUpperCase().substring(0, 3)}`;
      const existingSchedule = await Schedule.findOne({ scheduleId });

      if (!existingSchedule) {
        await Schedule.create({
          scheduleId,
          name: `${barangay} - ${sched.wasteType} Collection`,
          routeId: route.routeId,
          recurrenceType: 'weekly',
          weeklyDays: sched.weeklyDays,
          scheduledTime: sched.time,
          isActive: true,
          notes: `${sched.wasteType} waste collection for Brgy. ${barangay}`
        });
        console.log(`   📅 Created schedule: ${scheduleId}`);
        scheduleCount++;
      } else {
        console.log(`   ⏭️  Skipped (exists): ${scheduleId}`);
      }
    }

    // Summary
    const totalAnnouncements = await Announcement.countDocuments();
    const totalSchedules = await Schedule.countDocuments();
    const totalRoutes = await Route.countDocuments();

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Database Summary:');
    console.log(`   📢 Announcements: ${totalAnnouncements} (${announcementCount} new)`);
    console.log(`   🗺️  Routes: ${totalRoutes} (${routeCount} new)`);
    console.log(`   📅 Schedules: ${totalSchedules} (${scheduleCount} new)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ Resident Portal data seeding complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

seedData();
