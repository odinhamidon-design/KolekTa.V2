const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticateToken } = require('../middleware/auth');

// MongoDB models
const useMockAuth = process.env.USE_MOCK_AUTH === 'true';
let SpecialPickup, Announcement, Schedule, Route;

if (!useMockAuth) {
  SpecialPickup = require('../models/SpecialPickup');
  Announcement = require('../models/Announcement');
  Schedule = require('../models/Schedule');
  Route = require('../models/Route');
}

// Mati City Barangays
const BARANGAYS = [
  'Badas', 'Bobon', 'Buso', 'Cabuaya', 'Central', 'Dahican', 'Dawan',
  'Don Enrique Lopez', 'Don Martin Marundan', 'Don Salvador Lopez Sr.',
  'Langka', 'Libudon', 'Luban', 'Macambol', 'Mamali', 'Matiao', 'Mayo',
  'Sainz', 'San Agustin', 'San Antonio', 'Sanghay', 'Tagabakid',
  'Tagbinonga', 'Taguibo', 'Tamisan', 'Tarragona'
];

// Configure multer for photos
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Generate reference number
function generateReferenceNumber() {
  const year = new Date().getFullYear();
  const random = Math.floor(10000 + Math.random() * 90000);
  return `PICKUP-${year}-${random}`;
}

// Education content
const EDUCATION_CONTENT = {
  segregation: {
    title: 'Waste Segregation Guide',
    description: 'Learn how to properly sort your waste into the correct bins.',
    bins: [
      {
        name: 'Biodegradable',
        color: 'green',
        colorHex: '#22c55e',
        description: 'Organic waste that decomposes naturally',
        examples: ['Food scraps', 'Fruit and vegetable peels', 'Leaves and garden waste', 'Paper and cardboard', 'Wood scraps', 'Coffee grounds', 'Tea bags']
      },
      {
        name: 'Recyclable',
        color: 'blue',
        colorHex: '#3B82F6',
        description: 'Materials that can be processed and reused',
        examples: ['Plastic bottles (PET, HDPE)', 'Aluminum cans', 'Glass bottles and jars', 'Cardboard boxes', 'Newspapers and magazines', 'Metal containers', 'Clean food containers']
      },
      {
        name: 'Non-Biodegradable',
        color: 'yellow',
        colorHex: '#EAB308',
        description: 'Waste that cannot decompose or be recycled',
        examples: ['Styrofoam', 'Disposable diapers', 'Rubber items', 'Ceramics and pottery', 'Candy wrappers', 'Snack bags', 'Laminated paper']
      },
      {
        name: 'Hazardous',
        color: 'red',
        colorHex: '#EF4444',
        description: 'Dangerous materials requiring special handling',
        examples: ['Batteries (all types)', 'Fluorescent bulbs', 'Paint and solvents', 'Pesticides', 'Medical waste', 'Electronic devices', 'Expired medicines']
      }
    ],
    tips: [
      'Rinse containers before disposing to prevent odors',
      'Flatten cardboard boxes to save space',
      'Remove bottle caps before recycling',
      'Keep hazardous waste separate and clearly labeled'
    ]
  },
  recycling: {
    title: 'Recycling Tips',
    description: 'Make the most of recyclable materials with these helpful tips.',
    dos: [
      'Clean and dry containers before recycling',
      'Remove labels when possible',
      'Separate different materials (plastic, glass, metal)',
      'Flatten boxes and cartons to save space',
      'Check local recycling guidelines',
      'Support local recycling centers',
      'Buy products made from recycled materials'
    ],
    donts: [
      'Do not recycle greasy or food-contaminated items',
      'Do not include plastic bags in regular recycling',
      'Do not mix different types of plastics',
      'Do not recycle broken glass with regular glass',
      'Do not include styrofoam in recycling bins',
      'Do not recycle items smaller than a credit card'
    ],
    recyclableItems: [
      { name: 'Plastic Bottles', symbol: 'PET 1, HDPE 2', recyclable: true },
      { name: 'Glass Bottles', symbol: 'All colors', recyclable: true },
      { name: 'Aluminum Cans', symbol: 'ALU', recyclable: true },
      { name: 'Cardboard', symbol: 'PAP', recyclable: true },
      { name: 'Steel Cans', symbol: 'FE', recyclable: true },
      { name: 'Newspaper', symbol: 'PAP', recyclable: true },
      { name: 'Plastic Bags', symbol: 'LDPE 4', recyclable: false, note: 'Take to special collection points' },
      { name: 'Styrofoam', symbol: 'PS 6', recyclable: false, note: 'Non-recyclable in most areas' }
    ],
    dropOffLocations: [
      { name: 'Mati City MRF', address: 'Central Barangay', accepts: 'All recyclables' },
      { name: 'Junkshops', address: 'Various locations', accepts: 'Metals, paper, plastics' }
    ]
  },
  composting: {
    title: 'Home Composting Guide',
    description: 'Turn your kitchen and garden waste into nutrient-rich compost.',
    steps: [
      {
        step: 1,
        title: 'Choose Your Location',
        description: 'Pick a shady spot with good drainage. Keep it accessible but away from living areas.'
      },
      {
        step: 2,
        title: 'Start with Browns',
        description: 'Add a layer of brown materials (dry leaves, cardboard, straw) as your base.'
      },
      {
        step: 3,
        title: 'Add Greens',
        description: 'Layer green materials (food scraps, grass clippings, coffee grounds) on top.'
      },
      {
        step: 4,
        title: 'Maintain Balance',
        description: 'Keep a ratio of 3 parts brown to 1 part green for optimal decomposition.'
      },
      {
        step: 5,
        title: 'Keep It Moist',
        description: 'The pile should be as moist as a wrung-out sponge. Water if too dry.'
      },
      {
        step: 6,
        title: 'Turn Regularly',
        description: 'Turn the pile weekly to add oxygen and speed up decomposition.'
      },
      {
        step: 7,
        title: 'Harvest',
        description: 'After 2-3 months, your compost will be dark, crumbly, and ready to use.'
      }
    ],
    canCompost: ['Fruit and vegetable scraps', 'Coffee grounds and filters', 'Tea bags', 'Eggshells', 'Grass clippings', 'Dry leaves', 'Shredded paper', 'Cardboard', 'Wood chips'],
    cannotCompost: ['Meat and fish', 'Dairy products', 'Oils and fats', 'Pet waste', 'Diseased plants', 'Treated wood', 'Plastic or synthetic materials', 'Coal or charcoal ash'],
    benefits: [
      'Reduces household waste by up to 30%',
      'Creates free, nutrient-rich fertilizer',
      'Improves soil structure and water retention',
      'Reduces need for chemical fertilizers',
      'Helps fight climate change by reducing methane'
    ]
  }
};

// ===== PUBLIC ENDPOINTS (No authentication required) =====

// Get list of barangays
router.get('/barangays', (req, res) => {
  res.json(BARANGAYS);
});

// Get collection schedules for a barangay
router.get('/schedules/:barangay', async (req, res) => {
  try {
    const { barangay } = req.params;

    if (!BARANGAYS.includes(barangay)) {
      return res.status(400).json({ error: 'Invalid barangay' });
    }

    if (!useMockAuth && Schedule && Route) {
      // Get all active schedules with their routes
      const schedules = await Schedule.find({ isActive: true }).lean();
      const routes = await Route.find({}).lean();

      // Create route lookup map
      const routeMap = {};
      routes.forEach(route => {
        routeMap[route.routeId] = route;
      });

      // Filter schedules where route name contains barangay
      const barangaySchedules = schedules.filter(schedule => {
        const route = routeMap[schedule.routeId];
        if (!route) return false;
        return route.name.toLowerCase().includes(barangay.toLowerCase());
      });

      // Get upcoming collections for the next 14 days
      const upcoming = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < 14; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() + i);
        const dayOfWeek = checkDate.getDay();
        const dayOfMonth = checkDate.getDate();

        for (const schedule of barangaySchedules) {
          let isActiveOnDate = false;

          switch (schedule.recurrenceType) {
            case 'daily':
              isActiveOnDate = true;
              break;
            case 'weekly':
              isActiveOnDate = schedule.weeklyDays && schedule.weeklyDays.includes(dayOfWeek);
              break;
            case 'monthly':
              isActiveOnDate = schedule.monthlyDates && schedule.monthlyDates.includes(dayOfMonth);
              break;
          }

          if (isActiveOnDate) {
            const route = routeMap[schedule.routeId];
            upcoming.push({
              date: checkDate.toISOString().split('T')[0],
              dayName: checkDate.toLocaleDateString('en-US', { weekday: 'long' }),
              time: schedule.scheduledTime || '07:00',
              timeSlot: parseInt(schedule.scheduledTime || '07') < 12 ? 'morning' : 'afternoon',
              scheduleName: schedule.name,
              routeName: route ? route.name : 'Unknown',
              vehicle: schedule.assignedVehicle || 'TBA',
              wasteType: route && route.name.toLowerCase().includes('recyclable') ? 'Recyclable' :
                         route && route.name.toLowerCase().includes('biodegradable') ? 'Biodegradable' : 'Mixed'
            });
          }
        }
      }

      // Sort by date and time
      upcoming.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA - dateB;
      });

      res.json({
        barangay,
        schedules: upcoming,
        message: upcoming.length > 0 ? null : 'No scheduled collections found for this barangay'
      });
    } else {
      // Mock mode - return sample data
      res.json({
        barangay,
        schedules: [],
        message: 'Schedule data not available in mock mode'
      });
    }
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get active announcements
router.get('/announcements', async (req, res) => {
  try {
    if (!useMockAuth && Announcement) {
      const now = new Date();

      const announcements = await Announcement.find({
        isActive: true,
        startDate: { $lte: now },
        $or: [
          { endDate: null },
          { endDate: { $gte: now } }
        ]
      })
      .select('-__v')
      .sort({ priority: -1, createdAt: -1 })
      .lean();

      res.json(announcements);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get announcements for a specific barangay (includes city-wide)
router.get('/announcements/:barangay', async (req, res) => {
  try {
    const { barangay } = req.params;

    if (!useMockAuth && Announcement) {
      const now = new Date();

      const announcements = await Announcement.find({
        isActive: true,
        startDate: { $lte: now },
        $or: [
          { endDate: null },
          { endDate: { $gte: now } }
        ],
        $or: [
          { targetScope: 'city-wide' },
          { targetBarangays: { $size: 0 } },
          { targetBarangays: barangay }
        ]
      })
      .select('-__v')
      .sort({ priority: -1, createdAt: -1 })
      .lean();

      res.json(announcements);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Error fetching barangay announcements:', error);
    res.status(500).json({ error: error.message });
  }
});

// Submit special pickup request
router.post('/special-pickup', upload.array('photos', 3), async (req, res) => {
  try {
    const {
      pickupType, requesterName, phone, email, barangay, address,
      preferredDate, preferredTimeSlot, latitude, longitude, items
    } = req.body;

    // Validate required fields
    if (!pickupType || !requesterName || !phone || !barangay || !address || !preferredDate) {
      return res.status(400).json({
        error: 'Required fields: pickupType, requesterName, phone, barangay, address, preferredDate'
      });
    }

    // Validate pickup type
    if (!['e-waste', 'hazardous'].includes(pickupType)) {
      return res.status(400).json({ error: 'Invalid pickup type' });
    }

    // Validate barangay
    if (!BARANGAYS.includes(barangay)) {
      return res.status(400).json({ error: 'Invalid barangay' });
    }

    // Parse items if string
    let parsedItems = [];
    if (items) {
      try {
        parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
      } catch (e) {
        parsedItems = [{ name: items, quantity: 1 }];
      }
    }

    // Build location object if coordinates provided
    let location = null;
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        location = {
          type: 'Point',
          coordinates: [lng, lat]
        };
      }
    }

    // Convert uploaded files to base64
    const photos = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const base64 = file.buffer.toString('base64');
        const dataUrl = `data:${file.mimetype};base64,${base64}`;
        photos.push(dataUrl);
      }
    }

    const referenceNumber = generateReferenceNumber();

    if (!useMockAuth && SpecialPickup) {
      const pickupData = {
        referenceNumber,
        pickupType,
        items: parsedItems,
        requesterName,
        phone,
        email: email || '',
        barangay,
        address,
        preferredDate: new Date(preferredDate),
        preferredTimeSlot: preferredTimeSlot || 'morning',
        photos,
        status: 'pending',
        isNew: true
      };

      if (location) {
        pickupData.location = location;
      }

      const pickup = new SpecialPickup(pickupData);
      await pickup.save();

      console.log('New special pickup request (MongoDB):', referenceNumber, 'Type:', pickupType);

      res.status(201).json({
        message: 'Special pickup request submitted successfully',
        referenceNumber,
        pickup: {
          referenceNumber: pickup.referenceNumber,
          pickupType: pickup.pickupType,
          status: pickup.status,
          preferredDate: pickup.preferredDate,
          createdAt: pickup.createdAt
        }
      });
    } else {
      // Mock mode - just return success
      res.status(201).json({
        message: 'Special pickup request submitted successfully (mock mode)',
        referenceNumber,
        pickup: {
          referenceNumber,
          pickupType,
          status: 'pending',
          preferredDate,
          createdAt: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    console.error('Error submitting special pickup:', error);
    res.status(500).json({ error: error.message });
  }
});

// Track special pickup request
router.get('/special-pickup/:referenceNumber', async (req, res) => {
  try {
    const { referenceNumber } = req.params;

    if (!useMockAuth && SpecialPickup) {
      const pickup = await SpecialPickup.findOne({ referenceNumber })
        .select('-photos -adminNotes')
        .lean();

      if (!pickup) {
        return res.status(404).json({ error: 'Request not found. Please check your reference number.' });
      }

      res.json({
        referenceNumber: pickup.referenceNumber,
        pickupType: pickup.pickupType,
        status: pickup.status,
        items: pickup.items,
        barangay: pickup.barangay,
        preferredDate: pickup.preferredDate,
        scheduledDate: pickup.scheduledDate,
        assignedVehicle: pickup.assignedVehicle,
        notes: pickup.notes,
        createdAt: pickup.createdAt,
        updatedAt: pickup.updatedAt
      });
    } else {
      res.status(404).json({ error: 'Tracking not available in mock mode' });
    }
  } catch (error) {
    console.error('Error tracking pickup:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get education content
router.get('/education/:topic', (req, res) => {
  const { topic } = req.params;

  if (!EDUCATION_CONTENT[topic]) {
    return res.status(404).json({
      error: 'Topic not found',
      availableTopics: Object.keys(EDUCATION_CONTENT)
    });
  }

  res.json(EDUCATION_CONTENT[topic]);
});

// Get all education topics
router.get('/education', (req, res) => {
  const topics = Object.keys(EDUCATION_CONTENT).map(key => ({
    id: key,
    title: EDUCATION_CONTENT[key].title,
    description: EDUCATION_CONTENT[key].description
  }));
  res.json(topics);
});


// ===== ADMIN ENDPOINTS (Authentication required) =====

// Get all special pickup requests (Admin only)
router.get('/admin/special-pickups', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { status, pickupType, barangay } = req.query;

    if (!useMockAuth && SpecialPickup) {
      const query = {};
      if (status) query.status = status;
      if (pickupType) query.pickupType = pickupType;
      if (barangay) query.barangay = barangay;

      const pickups = await SpecialPickup.find(query)
        .select('-photos')
        .sort({ createdAt: -1 })
        .lean();

      res.json(pickups);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Error fetching special pickups:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single special pickup with photos (Admin only)
router.get('/admin/special-pickups/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;

    if (!useMockAuth && SpecialPickup) {
      const pickup = await SpecialPickup.findOne({
        $or: [{ _id: id }, { referenceNumber: id }]
      }).lean();

      if (!pickup) {
        return res.status(404).json({ error: 'Pickup request not found' });
      }

      res.json(pickup);
    } else {
      res.status(404).json({ error: 'Not available in mock mode' });
    }
  } catch (error) {
    console.error('Error fetching pickup:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update special pickup (Admin only)
router.put('/admin/special-pickups/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { status, scheduledDate, assignedVehicle, assignedDriver, adminNotes, notes } = req.body;

    const updates = { updatedAt: new Date() };
    if (status) updates.status = status;
    if (scheduledDate) updates.scheduledDate = new Date(scheduledDate);
    if (assignedVehicle !== undefined) updates.assignedVehicle = assignedVehicle;
    if (assignedDriver !== undefined) updates.assignedDriver = assignedDriver;
    if (adminNotes !== undefined) updates.adminNotes = adminNotes;
    if (notes !== undefined) updates.notes = notes;

    if (status === 'completed') {
      updates.completedAt = new Date();
      updates.completedBy = req.user.username;
    }

    if (!useMockAuth && SpecialPickup) {
      const pickup = await SpecialPickup.findOneAndUpdate(
        { $or: [{ _id: id }, { referenceNumber: id }] },
        { $set: updates },
        { new: true }
      );

      if (!pickup) {
        return res.status(404).json({ error: 'Pickup request not found' });
      }

      console.log('Special pickup updated (MongoDB):', pickup.referenceNumber);
      res.json({ message: 'Pickup request updated successfully', pickup });
    } else {
      res.status(404).json({ error: 'Not available in mock mode' });
    }
  } catch (error) {
    console.error('Error updating pickup:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark pickup as read (Admin only)
router.post('/admin/special-pickups/:id/mark-read', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;

    if (!useMockAuth && SpecialPickup) {
      await SpecialPickup.updateOne(
        { $or: [{ _id: id }, { referenceNumber: id }] },
        { $set: { isNew: false } }
      );
    }

    res.json({ message: 'Pickup request marked as read' });
  } catch (error) {
    console.error('Error marking pickup as read:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get new pickup requests count
router.get('/admin/special-pickups-count', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (!useMockAuth && SpecialPickup) {
      const count = await SpecialPickup.countDocuments({ isNew: true });
      res.json({ count });
    } else {
      res.json({ count: 0 });
    }
  } catch (error) {
    console.error('Error fetching pickup count:', error);
    res.status(500).json({ error: error.message });
  }
});


// ===== ANNOUNCEMENT ADMIN ENDPOINTS =====

// Get all announcements (Admin)
router.get('/admin/announcements', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (!useMockAuth && Announcement) {
      const announcements = await Announcement.find()
        .sort({ createdAt: -1 })
        .lean();
      res.json(announcements);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create announcement (Admin)
router.post('/admin/announcements', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { title, content, type, targetScope, targetBarangays, priority, startDate, endDate } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    if (!useMockAuth && Announcement) {
      const announcement = new Announcement({
        title,
        content,
        type: type || 'info',
        targetScope: targetScope || 'city-wide',
        targetBarangays: targetBarangays || [],
        priority: priority || 'normal',
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        isActive: true,
        createdBy: req.user.username
      });

      await announcement.save();
      console.log('New announcement created:', title);
      res.status(201).json({ message: 'Announcement created successfully', announcement });
    } else {
      res.status(201).json({ message: 'Announcement created (mock mode)', announcement: { title, content } });
    }
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update announcement (Admin)
router.put('/admin/announcements/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { title, content, type, targetScope, targetBarangays, priority, startDate, endDate, isActive } = req.body;

    const updates = { updatedAt: new Date(), updatedBy: req.user.username };
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (type !== undefined) updates.type = type;
    if (targetScope !== undefined) updates.targetScope = targetScope;
    if (targetBarangays !== undefined) updates.targetBarangays = targetBarangays;
    if (priority !== undefined) updates.priority = priority;
    if (startDate !== undefined) updates.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updates.endDate = endDate ? new Date(endDate) : null;
    if (isActive !== undefined) updates.isActive = isActive;

    if (!useMockAuth && Announcement) {
      const announcement = await Announcement.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true }
      );

      if (!announcement) {
        return res.status(404).json({ error: 'Announcement not found' });
      }

      console.log('Announcement updated:', announcement.title);
      res.json({ message: 'Announcement updated successfully', announcement });
    } else {
      res.status(404).json({ error: 'Not available in mock mode' });
    }
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete announcement (Admin)
router.delete('/admin/announcements/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;

    if (!useMockAuth && Announcement) {
      const result = await Announcement.findByIdAndDelete(id);

      if (!result) {
        return res.status(404).json({ error: 'Announcement not found' });
      }

      console.log('Announcement deleted:', id);
      res.json({ message: 'Announcement deleted successfully' });
    } else {
      res.json({ message: 'Announcement deleted (mock mode)' });
    }
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
