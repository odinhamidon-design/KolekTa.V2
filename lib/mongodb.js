const mongoose = require('mongoose');
const logger = require('./logger');

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null, reconnecting: false };
}

const BASE_DELAY_MS = 2000;
const MAX_DELAY_MS = 30000;

const connectionOpts = {
  bufferCommands: true,
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 60000,
  connectTimeoutMS: 30000,
};

/**
 * Persistent MongoDB connection with exponential backoff.
 * Never stops retrying — server stays alive during disconnection.
 */
async function connectDB() {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!process.env.MONGODB_URI) {
    logger.warn('No MONGODB_URI configured — skipping MongoDB connection');
    return null;
  }

  if (!cached.promise) {
    cached.promise = attemptConnect();
    setupEventListeners();
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

async function attemptConnect() {
  let attempt = 0;

  while (true) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI, connectionOpts);
      if (attempt > 0) {
        logger.info(`MongoDB reconnected after ${attempt} attempts`);
      } else {
        logger.info('Connected to MongoDB');
      }
      cached.reconnecting = false;
      return conn;
    } catch (err) {
      attempt++;
      const delay = Math.min(BASE_DELAY_MS * Math.pow(2, attempt - 1), MAX_DELAY_MS);
      logger.warn(`MongoDB connection attempt ${attempt} failed: ${err.message}. Retrying in ${delay / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

function setupEventListeners() {
  // Only attach once
  if (cached._listenersAttached) return;
  cached._listenersAttached = true;

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
    if (!cached.reconnecting) {
      cached.reconnecting = true;
      cached.conn = null;
      cached.promise = attemptConnect();
      cached.promise.then(conn => { cached.conn = conn; }).catch(() => {});
    }
  });

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB connection error:', err.message);
  });

  mongoose.connection.on('connected', () => {
    logger.info('MongoDB connection established');
    cached.reconnecting = false;
  });
}

/**
 * Returns current DB connection state.
 * 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
 */
function getConnectionState() {
  const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  return states[mongoose.connection.readyState] || 'unknown';
}

/**
 * Middleware that returns 503 when DB is not connected (for MongoDB routes).
 */
function requireDBConnection(req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).set('Retry-After', '5').json({
      error: 'Database temporarily unavailable',
      retryAfter: 5
    });
  }
  next();
}

module.exports = connectDB;
module.exports.getConnectionState = getConnectionState;
module.exports.requireDBConnection = requireDBConnection;
