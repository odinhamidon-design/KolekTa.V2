const mongoose = require('mongoose');

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000; // Start with 2 seconds, doubles each retry

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  // Skip connection if no MongoDB URI is configured
  if (!process.env.MONGODB_URI) {
    console.log('⚠️ No MONGODB_URI configured - skipping MongoDB connection');
    return null;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: true,
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 60000,
      connectTimeoutMS: 30000,
    };

    cached.promise = (async () => {
      let lastError;
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const conn = await mongoose.connect(process.env.MONGODB_URI, opts);
          console.log('✅ Connected to MongoDB');
          return conn;
        } catch (err) {
          lastError = err;
          console.error(`❌ MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed: ${err.message}`);
          if (attempt < MAX_RETRIES) {
            const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
            console.log(`⏳ Retrying in ${delay / 1000}s...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      throw lastError;
    })();
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

module.exports = connectDB;
