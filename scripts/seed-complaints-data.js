/**
 * Seed Complaints Mock Data: 20+ complaints for Analytics heatmap
 * Run: node scripts/seed-complaints-data.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');

// Barangays with coordinates - some will have more complaints (hotspots)
const barangayData = [
  // High complaint areas (urban/dense)
  { name: 'Central', center: { lat: 6.9549, lng: 126.2185 }, weight: 4 },
  { name: 'Sainz', center: { lat: 6.9620, lng: 126.2080 }, weight: 3 },
  { name: 'Bobon', center: { lat: 6.9420, lng: 126.2250 }, weight: 3 },
  { name: 'Dahican', center: { lat: 6.9150, lng: 126.2850 }, weight: 2 },

  // Medium complaint areas
  { name: 'Don Salvador Lopez', center: { lat: 6.9520, lng: 126.2080 }, weight: 2 },
  { name: 'Tagbinonga', center: { lat: 6.9480, lng: 126.2320 }, weight: 2 },
  { name: 'Dawan', center: { lat: 6.9480, lng: 126.2450 }, weight: 1 },
  { name: 'Langka', center: { lat: 6.9450, lng: 126.1920 }, weight: 1 },

  // Low complaint areas
  { name: 'Badas', center: { lat: 6.9380, lng: 126.2050 }, weight: 1 },
  { name: 'Mayo', center: { lat: 6.9220, lng: 126.2350 }, weight: 1 },
  { name: 'Matiao', center: { lat: 6.9380, lng: 126.2680 }, weight: 1 }
];

// Complaint types with realistic distribution
const complaintTypes = [
  { type: 'missed_collection', weight: 5, descriptions: [
    'Garbage truck did not come today as scheduled',
    'No collection for 3 days now',
    'Waste not collected on schedule',
    'Collection truck skipped our street',
    'Garbage left uncollected since last week'
  ]},
  { type: 'overflowing_bin', weight: 3, descriptions: [
    'Public bin overflowing with garbage',
    'Communal bin is full and spilling onto street',
    'Waste bin has not been emptied, now overflowing',
    'Garbage piling up around full bin'
  ]},
  { type: 'illegal_dumping', weight: 2, descriptions: [
    'Someone dumped construction waste in vacant lot',
    'Illegal garbage dump near the creek',
    'Household waste dumped on roadside',
    'Trash thrown in empty lot overnight'
  ]},
  { type: 'odor_complaint', weight: 1, descriptions: [
    'Strong smell from uncollected garbage',
    'Foul odor from nearby waste pile',
    'Bad smell attracting flies and pests'
  ]},
  { type: 'damaged_bin', weight: 1, descriptions: [
    'Public waste bin is broken',
    'Bin lid is missing',
    'Container has holes, garbage spilling out'
  ]}
];

// Filipino names for realistic data
const firstNames = ['Maria', 'Juan', 'Jose', 'Ana', 'Pedro', 'Rosa', 'Carlos', 'Elena', 'Miguel', 'Carmen', 'Antonio', 'Lucia', 'Roberto', 'Teresa', 'Fernando'];
const lastNames = ['Santos', 'Reyes', 'Cruz', 'Garcia', 'Lopez', 'Dela Cruz', 'Fernandez', 'Martinez', 'Gonzales', 'Ramos', 'Torres', 'Flores', 'Rivera', 'Mendoza', 'Villanueva'];

// Generate random phone number
function randomPhone() {
  return `09${Math.floor(100000000 + Math.random() * 900000000)}`;
}

// Generate random email
function randomEmail(firstName, lastName) {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com'];
  return `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(' ', '')}@${domains[Math.floor(Math.random() * domains.length)]}`;
}

// Generate random coordinates near a center point
function randomNearbyCoord(center, radiusKm = 0.5) {
  const radiusDeg = radiusKm / 111; // Approximate degrees per km
  return {
    lat: center.lat + (Math.random() - 0.5) * 2 * radiusDeg,
    lng: center.lng + (Math.random() - 0.5) * 2 * radiusDeg
  };
}

// Generate random date in past N days
function randomDateInPastDays(days) {
  const now = new Date();
  return new Date(now.getTime() - Math.random() * days * 24 * 60 * 60 * 1000);
}

// Generate reference number
function generateRefNumber() {
  const year = new Date().getFullYear();
  const random = Math.floor(10000 + Math.random() * 90000);
  return `CMPL-${year}-${random}`;
}

// Select weighted random item
function weightedRandom(items) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;

  for (const item of items) {
    random -= item.weight;
    if (random <= 0) return item;
  }
  return items[0];
}

async function seedComplaints() {
  console.log('🌱 Seeding complaint mock data to MongoDB...\n');

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const complaintsToCreate = [];
    const numComplaints = 25; // Create 25 complaints

    for (let i = 0; i < numComplaints; i++) {
      // Select barangay (weighted toward high-complaint areas)
      const barangay = weightedRandom(barangayData);

      // Select complaint type (weighted)
      const complaintType = weightedRandom(complaintTypes);

      // Generate complainant info
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

      // Generate location near barangay center
      const location = randomNearbyCoord(barangay.center, 0.3);

      // Random date in past 30 days
      const createdAt = randomDateInPastDays(30);

      // Random status (most pending/in-progress for visibility)
      const statuses = ['pending', 'pending', 'pending', 'in-progress', 'in-progress', 'resolved'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      // Select random description for this type
      const description = complaintType.descriptions[Math.floor(Math.random() * complaintType.descriptions.length)];

      complaintsToCreate.push({
        referenceNumber: generateRefNumber(),
        reportType: complaintType.type,
        name: `${firstName} ${lastName}`,
        phone: randomPhone(),
        email: randomEmail(firstName, lastName),
        address: `${Math.floor(Math.random() * 500) + 1} ${barangay.name} Street`,
        barangay: barangay.name,
        location: {
          type: 'Point',
          coordinates: [location.lng, location.lat] // GeoJSON is [lng, lat]
        },
        description: description,
        status: status,
        isNew: status === 'pending',
        createdAt: createdAt,
        updatedAt: createdAt
      });
    }

    // Insert complaints
    console.log(`📝 Creating ${complaintsToCreate.length} complaints...`);

    try {
      const result = await Complaint.insertMany(complaintsToCreate, { ordered: false });
      console.log(`✅ Successfully created ${result.length} complaints\n`);
    } catch (err) {
      if (err.code === 11000) {
        const inserted = err.insertedDocs ? err.insertedDocs.length : 0;
        console.log(`✅ Created ${inserted} new complaints (some duplicates skipped)\n`);
      } else {
        throw err;
      }
    }

    // Summary by barangay
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Complaints Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const allComplaints = await Complaint.find({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    }).lean();

    // Count by barangay
    const byBarangay = {};
    allComplaints.forEach(c => {
      byBarangay[c.barangay] = (byBarangay[c.barangay] || 0) + 1;
    });

    const sortedBarangays = Object.entries(byBarangay).sort((a, b) => b[1] - a[1]);

    console.log('\nComplaints by barangay (hotspots):');
    sortedBarangays.forEach(([name, count], i) => {
      const bar = '█'.repeat(count);
      console.log(`   ${name.padEnd(22)} ${bar} ${count}`);
    });

    // Count by type
    const byType = {};
    allComplaints.forEach(c => {
      byType[c.reportType] = (byType[c.reportType] || 0) + 1;
    });

    console.log('\nComplaints by type:');
    Object.entries(byType).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
      console.log(`   ${type.padEnd(20)} ${count}`);
    });

    console.log(`\n   📍 Total complaints (30 days): ${allComplaints.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ Complaint mock data seeding complete!');
    console.log('\n🗺️  Check Analytics module to see complaint hotspots on the heatmap.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

seedComplaints();
