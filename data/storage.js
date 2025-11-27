const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname);
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const TRUCKS_FILE = path.join(DATA_DIR, 'trucks.json');
const ROUTES_FILE = path.join(DATA_DIR, 'routes.json');

// Check if running on Vercel (read-only filesystem)
const IS_VERCEL = process.env.VERCEL || process.env.NOW_REGION;

// In-memory storage for Vercel
let memoryStorage = {
  users: null,
  trucks: null,
  routes: null,
  liveLocations: {}  // Store live GPS locations
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

module.exports = {
  initialize,
  usersStorage,
  trucksStorage,
  routesStorage,
  liveLocationsStorage
};
