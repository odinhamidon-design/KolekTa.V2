require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const mongoose = require('mongoose');
const path = require('path');
const { initialize } = require('./data/storage');

const app = express();
const PORT = process.env.PORT || 3000;

// ===========================================
// Security Middleware
// ===========================================

// SECURITY NOTE: JWT tokens are stored in localStorage on the frontend.
// This is accessible to XSS attacks. For production with sensitive data,
// consider migrating to httpOnly cookie-based auth. The current CSP helps
// mitigate XSS risk but 'unsafe-inline'/'unsafe-eval' are still required by
// the Tailwind Play CDN runtime compiler (now self-hosted in /vendor/).

// Helmet for security headers (with Service Worker support)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://router.project-osrm.org", "https://*.tile.openstreetmap.org"],
      fontSrc: ["'self'"],
      frameSrc: ["'none'"],
      workerSrc: ["'self'"],  // Allow Service Workers
      manifestSrc: ["'self'"]  // Allow manifest.json
    }
  },
  crossOriginEmbedderPolicy: false
}));

// Cache headers for static assets (improves offline experience)
app.use((req, res, next) => {
  // Service Worker and manifest should not be cached by browser
  if (req.path === '/sw.js' || req.path === '/manifest.json') {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Service-Worker-Allowed', '/');
  }
  // Cache JS files for 1 hour
  else if (req.path.endsWith('.js')) {
    res.setHeader('Cache-Control', 'public, max-age=3600');
  }
  // Cache images for 1 day
  else if (req.path.match(/\.(png|jpg|jpeg|gif|ico|svg)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }
  next();
});

// Compression for better performance
app.use(compression());

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:3000', 'http://localhost:3004', 'http://127.0.0.1:3000', 'http://127.0.0.1:3004'],
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 86400 // 24 hours
};

// In development, allow all origins
if (process.env.NODE_ENV !== 'production') {
  corsOptions.origin = true;
}

app.use(cors(corsOptions));

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===========================================
// Rate Limiting
// ===========================================

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per 15 minutes
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for static files
    return req.path.startsWith('/css') || req.path.startsWith('/js') || req.path.startsWith('/images');
  }
});

// Stricter limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per 15 minutes
  message: { error: 'Too many login attempts, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Don't count successful logins
});

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);

// ===========================================
// Static Routes (before API routes)
// ===========================================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'landing.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Redirect /mobile to dashboard (now responsive)
app.get('/mobile', (req, res) => {
  res.redirect('/dashboard');
});

// Public complaint pages (no auth required)
app.get('/complaint', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'complaint.html'));
});

app.get('/track', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'track.html'));
});

// Resident Self-Service Portal (public - no auth required)
app.get('/resident-portal', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'resident-portal.html'));
});

// Static file serving (after explicit routes)
app.use(express.static('public'));

// ===========================================
// Database Connection
// ===========================================

const useMockAuth = process.env.USE_MOCK_AUTH === 'true';

// MongoDB Connection - Only connect if not using mock auth
if (!useMockAuth) {
  // In development, connect non-blocking; production awaits in startServer()
  if (process.env.NODE_ENV !== 'production') {
    const connectDB = require('./lib/mongodb');
    connectDB().then(() => {
      console.log('✅ MongoDB connected for live tracking');
    }).catch(err => {
      console.error('❌ MongoDB connection error:', err.message);
      console.log('⚠️ Live GPS tracking will not work without MongoDB');
    });
  }
} else {
  console.log('📝 Skipping MongoDB connection (mock auth mode)');
}

// Initialize persistent storage for mock auth
if (useMockAuth) {
  console.log('📝 Mock authentication enabled - using JSON storage for users');
  initialize();
  console.log('💾 Persistent storage initialized');
}

// ===========================================
// API Routes
// ===========================================

// Health check endpoint (no auth required)
app.get('/api/health', async (req, res) => {
  const health = {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    mode: useMockAuth ? 'mock' : 'mongodb'
  };

  if (!useMockAuth) {
    try {
      const mongoose = require('mongoose');
      health.database = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    } catch {
      health.database = 'error';
    }
  }

  const statusCode = health.database === 'error' ? 503 : 200;
  res.status(statusCode).json(health);
});

// Auth routes with stricter rate limiting
if (useMockAuth) {
  console.log('⚠️  Using MOCK authentication');
  app.use('/api/auth', authLimiter, require('./routes/auth-mock'));
} else {
  app.use('/api/auth', authLimiter, require('./routes/auth'));
}

// Use local JSON storage or MongoDB based on mock mode
if (useMockAuth) {
  console.log('📦 Using local JSON storage for users, trucks, routes');
  app.use('/api/users', require('./routes/users'));
  app.use('/api/trucks', require('./routes/trucks'));
  app.use('/api/routes', require('./routes/routes'));
} else {
  console.log('📦 Using MongoDB for users, trucks, routes (persistent storage)');
  app.use('/api/users', require('./routes/users-mongo'));
  app.use('/api/trucks', require('./routes/trucks-mongo'));
  app.use('/api/routes', require('./routes/routes-mongo'));
}

app.use('/api/collections', require('./routes/collections'));
app.use('/api/bins', require('./routes/bins'));

// Use mock or MongoDB tracking based on mode
if (useMockAuth) {
  app.use('/api/completions', require('./routes/completions'));
  app.use('/api/tracking', require('./routes/tracking'));
  app.use('/api/profile', require('./routes/profile'));
} else {
  console.log('📡 Using MongoDB for live tracking');
  app.use('/api/completions', require('./routes/completions'));
  app.use('/api/tracking', require('./routes/tracking-mongo'));
  app.use('/api/profile', require('./routes/profile'));
}

app.use('/api/fuel', require('./routes/fuel'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/resident', require('./routes/resident-portal'));
app.use('/api/driver', require('./routes/driver-features'));

// Schedules and Reports routes
if (useMockAuth) {
  app.use('/api/schedules', require('./routes/schedules'));
  app.use('/api/reports', require('./routes/reports'));
} else {
  app.use('/api/schedules', require('./routes/schedules-mongo'));
  app.use('/api/reports', require('./routes/reports-mongo'));
}

// ===========================================
// Error Handling
// ===========================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  // Don't expose error details in production
  const message = process.env.NODE_ENV === 'production'
    ? 'An internal error occurred'
    : err.message;

  res.status(err.status || 500).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// ===========================================
// Start Server
// ===========================================

const host = '0.0.0.0';

async function startServer() {
  // In production with MongoDB, await DB connection before listening
  if (!useMockAuth && process.env.NODE_ENV === 'production') {
    try {
      const connectDB = require('./lib/mongodb');
      await connectDB();
      console.log('✅ MongoDB connected before server start');
    } catch (err) {
      console.error('❌ Cannot start without database in production:', err.message);
      process.exit(1);
    }
  }

  app.listen(PORT, host, () => {
    console.log(`\n🚀 Kolek-Ta server running on port ${PORT}`);
    console.log(`📍 Access from this computer: http://localhost:${PORT}`);
    console.log(`📍 Access from other devices: http://YOUR-IP-ADDRESS:${PORT}`);
    console.log(`\n🔒 Security: Helmet, Rate Limiting, CORS configured`);
    console.log(`💡 To find your IP address, run: ipconfig\n`);
  });
}

startServer();
