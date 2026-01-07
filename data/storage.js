const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname);
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const TRUCKS_FILE = path.join(DATA_DIR, 'trucks.json');
const ROUTES_FILE = path.join(DATA_DIR, 'routes.json');
const COMPLAINTS_FILE = path.join(DATA_DIR, 'complaints.json');
const SCHEDULES_FILE = path.join(DATA_DIR, 'schedules.json');

// Check if running on Vercel (read-only filesystem)
const IS_VERCEL = process.env.VERCEL || process.env.NOW_REGION;

// In-memory storage for Vercel
let memoryStorage = {
  users: null,
  trucks: null,
  routes: null,
  complaints: null,
  schedules: null,
  liveLocations: {},  // Store live GPS locations
  tripData: {}        // Store trip data for fuel estimation (distance, stops, idle time)
};

// Ensure data directory exists (only for local)
if (!IS_VERCEL && !fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Read data from file or memory
function readData(filePath, storageKey) {
  if (IS_VERCEL) {
    // Use in-memory storage on Vercel
    if (memoryStorage[storageKey] === null) {
      // Initialize from default file on first read
      try {
        const data = fs.readFileSync(filePath, 'utf8');
        memoryStorage[storageKey] = JSON.parse(data);
      } catch (error) {
        memoryStorage[storageKey] = [];
      }
    }
    return memoryStorage[storageKey];
  } else {
    // Use file storage locally
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading ${filePath}:`, error);
      return [];
    }
  }
}

// Write data to file or memory
function writeData(filePath, data, storageKey) {
  if (IS_VERCEL) {
    // Store in memory on Vercel
    memoryStorage[storageKey] = data;
    return true;
  } else {
    // Write to file locally
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error(`Error writing ${filePath}:`, error);
      return false;
    }
  }
}

// Users storage
const usersStorage = {
  getAll: () => readData(USERS_FILE, 'users'),
  save: (users) => writeData(USERS_FILE, users, 'users'),
  findByUsername: (username) => {
    const users = readData(USERS_FILE, 'users');
    return users.find(u => u.username === username);
  },
  add: (user) => {
    const users = readData(USERS_FILE, 'users');
    users.push(user);
    return writeData(USERS_FILE, users, 'users');
  },
  update: (username, updates) => {
    const users = readData(USERS_FILE, 'users');
    const index = users.findIndex(u => u.username === username);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates };
      return writeData(USERS_FILE, users, 'users');
    }
    return false;
  },
  delete: (username) => {
    const users = readData(USERS_FILE, 'users');
    const filtered = users.filter(u => u.username !== username);
    return writeData(USERS_FILE, filtered, 'users');
  }
};

// Trucks storage
const trucksStorage = {
  getAll: () => readData(TRUCKS_FILE, 'trucks'),
  save: (trucks) => writeData(TRUCKS_FILE, trucks, 'trucks'),
  findById: (id) => {
    const trucks = readData(TRUCKS_FILE, 'trucks');
    return trucks.find(t => t._id === id || t.truckId === id);
  },
  add: (truck) => {
    const trucks = readData(TRUCKS_FILE, 'trucks');
    trucks.push(truck);
    return writeData(TRUCKS_FILE, trucks, 'trucks');
  },
  update: (id, updates) => {
    const trucks = readData(TRUCKS_FILE, 'trucks');
    const index = trucks.findIndex(t => t._id === id || t.truckId === id);
    if (index !== -1) {
      trucks[index] = { ...trucks[index], ...updates };
      return writeData(TRUCKS_FILE, trucks, 'trucks');
    }
    return false;
  },
  delete: (id) => {
    const trucks = readData(TRUCKS_FILE, 'trucks');
    const filtered = trucks.filter(t => t._id !== id && t.truckId !== id);
    return writeData(TRUCKS_FILE, filtered, 'trucks');
  }
};

// Routes storage
const routesStorage = {
  getAll: () => readData(ROUTES_FILE, 'routes'),
  save: (routes) => writeData(ROUTES_FILE, routes, 'routes'),
  findById: (id) => {
    const routes = readData(ROUTES_FILE, 'routes');
    return routes.find(r => r._id === id || r.routeId === id);
  },
  add: (route) => {
    const routes = readData(ROUTES_FILE, 'routes');
    routes.push(route);
    return writeData(ROUTES_FILE, routes, 'routes');
  },
  update: (id, updates) => {
    const routes = readData(ROUTES_FILE, 'routes');
    const index = routes.findIndex(r => r._id === id || r.routeId === id);
    if (index !== -1) {
      routes[index] = { ...routes[index], ...updates };
      return writeData(ROUTES_FILE, routes, 'routes');
    }
    return false;
  },
  delete: (id) => {
    const routes = readData(ROUTES_FILE, 'routes');
    const filtered = routes.filter(r => r._id !== id && r.routeId !== id);
    return writeData(ROUTES_FILE, filtered, 'routes');
  }
};

// Complaints storage
const complaintsStorage = {
  getAll: () => readData(COMPLAINTS_FILE, 'complaints'),
  save: (complaints) => writeData(COMPLAINTS_FILE, complaints, 'complaints'),
  findById: (id) => {
    const complaints = readData(COMPLAINTS_FILE, 'complaints');
    return complaints.find(c => c._id === id || c.referenceNumber === id);
  },
  findByReference: (refNum) => {
    const complaints = readData(COMPLAINTS_FILE, 'complaints');
    return complaints.find(c => c.referenceNumber === refNum);
  },
  add: (complaint) => {
    const complaints = readData(COMPLAINTS_FILE, 'complaints');
    complaints.push(complaint);
    return writeData(COMPLAINTS_FILE, complaints, 'complaints');
  },
  update: (id, updates) => {
    const complaints = readData(COMPLAINTS_FILE, 'complaints');
    const index = complaints.findIndex(c => c._id === id || c.referenceNumber === id);
    if (index !== -1) {
      complaints[index] = { ...complaints[index], ...updates };
      return writeData(COMPLAINTS_FILE, complaints, 'complaints');
    }
    return false;
  },
  delete: (id) => {
    const complaints = readData(COMPLAINTS_FILE, 'complaints');
    const filtered = complaints.filter(c => c._id !== id && c.referenceNumber !== id);
    return writeData(COMPLAINTS_FILE, filtered, 'complaints');
  },
  generateReferenceNumber: () => {
    const year = new Date().getFullYear();
    const random = Math.floor(10000 + Math.random() * 90000);
    return `CMPL-${year}-${random}`;
  }
};

// Schedules storage
const schedulesStorage = {
  getAll: () => readData(SCHEDULES_FILE, 'schedules'),
  save: (schedules) => writeData(SCHEDULES_FILE, schedules, 'schedules'),
  findById: (id) => {
    const schedules = readData(SCHEDULES_FILE, 'schedules');
    return schedules.find(s => s._id === id || s.scheduleId === id);
  },
  findByRouteId: (routeId) => {
    const schedules = readData(SCHEDULES_FILE, 'schedules');
    return schedules.filter(s => s.routeId === routeId);
  },
  add: (schedule) => {
    const schedules = readData(SCHEDULES_FILE, 'schedules');
    schedules.push(schedule);
    return writeData(SCHEDULES_FILE, schedules, 'schedules');
  },
  update: (id, updates) => {
    const schedules = readData(SCHEDULES_FILE, 'schedules');
    const index = schedules.findIndex(s => s._id === id || s.scheduleId === id);
    if (index !== -1) {
      schedules[index] = { ...schedules[index], ...updates };
      return writeData(SCHEDULES_FILE, schedules, 'schedules');
    }
    return false;
  },
  delete: (id) => {
    const schedules = readData(SCHEDULES_FILE, 'schedules');
    const filtered = schedules.filter(s => s._id !== id && s.scheduleId !== id);
    return writeData(SCHEDULES_FILE, filtered, 'schedules');
  },
  generateScheduleId: () => {
    const timestamp = Date.now();
    return `SCHED-${timestamp}`;
  },
  // Check if schedule is active on a given date
  isActiveOnDate: (schedule, date) => {
    if (!schedule.isActive) return false;

    const checkDate = new Date(date);
    const startDate = new Date(schedule.startDate);

    if (checkDate < startDate) return false;
    if (schedule.endDate && checkDate > new Date(schedule.endDate)) return false;

    const dayOfWeek = checkDate.getDay();
    const dayOfMonth = checkDate.getDate();

    switch (schedule.recurrenceType) {
      case 'daily':
        return true;
      case 'weekly':
        return schedule.weeklyDays && schedule.weeklyDays.includes(dayOfWeek);
      case 'monthly':
        return schedule.monthlyDates && schedule.monthlyDates.includes(dayOfMonth);
      default:
        return false;
    }
  },
  // Get upcoming collections for the next N days
  getUpcomingCollections: (days = 7) => {
    const schedules = readData(SCHEDULES_FILE, 'schedules').filter(s => s.isActive);
    const upcoming = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < days; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() + i);

      for (const schedule of schedules) {
        if (schedulesStorage.isActiveOnDate(schedule, checkDate)) {
          upcoming.push({
            date: checkDate.toISOString().split('T')[0],
            scheduleId: schedule.scheduleId,
            scheduleName: schedule.name,
            routeId: schedule.routeId,
            scheduledTime: schedule.scheduledTime,
            assignedDriver: schedule.assignedDriver,
            assignedVehicle: schedule.assignedVehicle,
            recurrenceType: schedule.recurrenceType
          });
        }
      }
    }

    // Sort by date and time
    upcoming.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.scheduledTime}`);
      const dateB = new Date(`${b.date}T${b.scheduledTime}`);
      return dateA - dateB;
    });

    return upcoming;
  }
};

// Track if already initialized to prevent re-initialization
let isInitialized = false;

// Initialize files with default data
function initialize() {
  // Prevent multiple initializations within same process
  if (isInitialized) {
    return;
  }
  
  console.log(IS_VERCEL ? '🌐 Running on Vercel - using in-memory storage' : '💾 Running locally - using file storage');
  
  // On Vercel, check if memory storage already has data (from previous request in same instance)
  if (IS_VERCEL) {
    // If memory already has data, don't reinitialize from files
    if (memoryStorage.users !== null && memoryStorage.users.length > 0) {
      console.log('✅ Using existing in-memory data');
      isInitialized = true;
      return;
    }
  }
  
  // Load data from files (this is the initial load)
  const currentUsers = readData(USERS_FILE, 'users');
  if (!currentUsers || currentUsers.length === 0) {
    const mockUsers = require('./mock-users');
    writeData(USERS_FILE, mockUsers, 'users');
    console.log('✅ Initialized users with default data');
  } else {
    console.log(`✅ Found ${currentUsers.length} existing users`);
  }
  
  const currentTrucks = readData(TRUCKS_FILE, 'trucks');
  if (!currentTrucks || currentTrucks.length === 0) {
    writeData(TRUCKS_FILE, [
    {
      _id: '1',
      truckId: 'TRUCK-001',
      plateNumber: 'ABC-1234',
      model: 'Isuzu Elf',
      capacity: 1000,
      status: 'available',
      assignedDriver: null,
      lastMaintenance: '2024-01-15',
      nextMaintenance: '2024-04-15',
      fuelLevel: 85,
      mileage: 15420,
      notes: 'Good condition'
    },
    {
      _id: '2',
      truckId: 'TRUCK-002',
      plateNumber: 'XYZ-5678',
      model: 'Mitsubishi Canter',
      capacity: 1200,
      status: 'in-use',
      assignedDriver: 'driver1',
      lastMaintenance: '2024-02-01',
      nextMaintenance: '2024-05-01',
      fuelLevel: 60,
      mileage: 22350,
      notes: 'Assigned to Juan Dela Cruz'
    }
    ], 'trucks');
    console.log('✅ Initialized trucks with default data');
  } else {
    console.log(`✅ Found ${currentTrucks.length} existing trucks`);
  }
  
  const currentRoutes = readData(ROUTES_FILE, 'routes');
  if (!currentRoutes || currentRoutes.length === 0) {
    writeData(ROUTES_FILE, [
    {
      _id: '1',
      routeId: 'ROUTE-001',
      name: 'Downtown Collection Route',
      path: {
        type: 'LineString',
        coordinates: [
          [126.2185, 6.9549],
          [126.2200, 6.9560],
          [126.2170, 6.9570]
        ]
      },
      distance: 2500,
      status: 'planned',
      notes: 'Main downtown area collection'
    }
    ], 'routes');
    console.log('✅ Initialized routes with default data');
  } else {
    console.log(`✅ Found ${currentRoutes.length} existing routes`);
  }
  
  // Mark as initialized
  isInitialized = true;
  console.log('✅ Storage initialization complete');
}

// Live Locations storage (for GPS tracking)
const liveLocationsStorage = {
  get: (username) => {
    return memoryStorage.liveLocations[username] || null;
  },
  set: (username, locationData) => {
    memoryStorage.liveLocations[username] = {
      ...locationData,
      lastUpdate: Date.now()
    };
    return true;
  },
  getAll: () => {
    return memoryStorage.liveLocations;
  },
  delete: (username) => {
    delete memoryStorage.liveLocations[username];
    return true;
  },
  // Clean up stale locations (older than 5 minutes)
  cleanStale: () => {
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    const locations = memoryStorage.liveLocations;
    for (const username in locations) {
      if (locations[username].lastUpdate < fiveMinutesAgo) {
        delete locations[username];
      }
    }
  }
};

// Haversine distance calculation (in km)
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Trip Data storage (for automatic fuel estimation)
const tripDataStorage = {
  // Get trip data for a driver
  get: (username) => {
    return memoryStorage.tripData[username] || null;
  },

  // Start a new trip
  startTrip: (username, truckId) => {
    memoryStorage.tripData[username] = {
      username,
      truckId,
      startTime: Date.now(),
      totalDistance: 0,          // km
      stopCount: 0,
      idleTimeMs: 0,             // milliseconds
      lastLocation: null,
      lastUpdateTime: null,
      lastSpeed: 0,
      speedSamples: [],          // For average speed calculation
      isActive: true,
      fuelEstimate: 0            // Liters
    };
    return memoryStorage.tripData[username];
  },

  // Update trip with new GPS data
  updateTrip: (username, lat, lng, speed = 0) => {
    let trip = memoryStorage.tripData[username];

    // Auto-start trip if not exists
    if (!trip) {
      trip = tripDataStorage.startTrip(username, null);
    }

    const now = Date.now();
    const STOP_SPEED_THRESHOLD = 3; // km/h - considered stopped if below this
    const IDLE_SPEED_THRESHOLD = 5; // km/h - considered idling if below this

    // Calculate distance from last location
    if (trip.lastLocation) {
      const distance = haversineDistance(
        trip.lastLocation.lat,
        trip.lastLocation.lng,
        lat,
        lng
      );

      // Only add distance if it's reasonable (not a GPS glitch)
      if (distance < 1) { // Less than 1km between updates (prevents GPS jumps)
        trip.totalDistance += distance;
      }

      // Calculate time since last update
      const timeDiff = now - trip.lastUpdateTime;

      // Detect stops (speed below threshold)
      if (speed < STOP_SPEED_THRESHOLD && trip.lastSpeed >= STOP_SPEED_THRESHOLD) {
        trip.stopCount++;
      }

      // Accumulate idle time
      if (speed < IDLE_SPEED_THRESHOLD) {
        trip.idleTimeMs += timeDiff;
      }
    }

    // Update last location and speed
    trip.lastLocation = { lat, lng };
    trip.lastUpdateTime = now;
    trip.lastSpeed = speed;

    // Track speed samples for average calculation
    if (speed > 0) {
      trip.speedSamples.push(speed);
      // Keep only last 100 samples
      if (trip.speedSamples.length > 100) {
        trip.speedSamples.shift();
      }
    }

    // Calculate real-time fuel estimate
    trip.fuelEstimate = tripDataStorage.calculateFuelEstimate(trip);

    memoryStorage.tripData[username] = trip;
    return trip;
  },

  // Calculate fuel estimate based on trip data
  calculateFuelEstimate: (trip) => {
    if (!trip || trip.totalDistance === 0) return 0;

    const BASE_CONSUMPTION = 25; // L/100km for garbage truck

    // Calculate average speed
    const avgSpeed = trip.speedSamples.length > 0
      ? trip.speedSamples.reduce((a, b) => a + b, 0) / trip.speedSamples.length
      : 30;

    // Speed factor (urban driving efficiency)
    let speedFactor = 1.0;
    if (avgSpeed < 30) speedFactor = 1.3;
    else if (avgSpeed < 50) speedFactor = 1.1;
    else if (avgSpeed <= 70) speedFactor = 1.0;
    else if (avgSpeed <= 90) speedFactor = 1.15;
    else speedFactor = 1.3;

    // Load factor (assume 60% average load during collection)
    const loadFactor = 1.09; // 0.85 + (60/100) * 0.4

    // Distance-based consumption
    const distanceConsumption = (trip.totalDistance / 100) * BASE_CONSUMPTION * speedFactor * loadFactor;

    // Stop consumption (0.05L per stop)
    const stopConsumption = trip.stopCount * 0.05;

    // Idle consumption (2.5L per hour)
    const idleHours = trip.idleTimeMs / (1000 * 60 * 60);
    const idleConsumption = idleHours * 2.5;

    const totalFuel = distanceConsumption + stopConsumption + idleConsumption;

    return Math.round(totalFuel * 100) / 100;
  },

  // Get trip summary with fuel estimation
  getTripSummary: (username) => {
    const trip = memoryStorage.tripData[username];
    if (!trip) return null;

    const avgSpeed = trip.speedSamples.length > 0
      ? trip.speedSamples.reduce((a, b) => a + b, 0) / trip.speedSamples.length
      : 0;

    const idleMinutes = Math.round(trip.idleTimeMs / (1000 * 60));
    const durationMinutes = Math.round((Date.now() - trip.startTime) / (1000 * 60));

    return {
      username: trip.username,
      truckId: trip.truckId,
      isActive: trip.isActive,
      startTime: new Date(trip.startTime).toISOString(),
      duration: {
        minutes: durationMinutes,
        formatted: durationMinutes >= 60
          ? `${Math.floor(durationMinutes/60)}h ${durationMinutes%60}m`
          : `${durationMinutes}m`
      },
      distance: {
        km: Math.round(trip.totalDistance * 100) / 100,
        formatted: trip.totalDistance >= 1
          ? `${trip.totalDistance.toFixed(2)} km`
          : `${Math.round(trip.totalDistance * 1000)} m`
      },
      stops: trip.stopCount,
      idleTime: {
        minutes: idleMinutes,
        formatted: idleMinutes >= 60
          ? `${Math.floor(idleMinutes/60)}h ${idleMinutes%60}m`
          : `${idleMinutes}m`
      },
      averageSpeed: Math.round(avgSpeed * 10) / 10,
      fuel: {
        liters: trip.fuelEstimate,
        efficiency: trip.totalDistance > 0
          ? Math.round((trip.totalDistance / trip.fuelEstimate) * 100) / 100
          : 0,
        consumptionRate: trip.totalDistance > 0
          ? Math.round((trip.fuelEstimate / trip.totalDistance) * 100 * 100) / 100
          : 0
      },
      lastLocation: trip.lastLocation,
      lastUpdate: trip.lastUpdateTime ? new Date(trip.lastUpdateTime).toISOString() : null
    };
  },

  // End trip and return final summary
  endTrip: (username) => {
    const summary = tripDataStorage.getTripSummary(username);
    if (summary) {
      memoryStorage.tripData[username].isActive = false;
    }
    return summary;
  },

  // Get all active trips
  getAllActive: () => {
    const trips = [];
    for (const username in memoryStorage.tripData) {
      if (memoryStorage.tripData[username].isActive) {
        trips.push(tripDataStorage.getTripSummary(username));
      }
    }
    return trips;
  },

  // Clear trip data
  clear: (username) => {
    delete memoryStorage.tripData[username];
    return true;
  }
};

module.exports = {
  initialize,
  usersStorage,
  trucksStorage,
  routesStorage,
  complaintsStorage,
  schedulesStorage,
  liveLocationsStorage,
  tripDataStorage,
  haversineDistance
};
