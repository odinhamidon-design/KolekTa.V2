require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const { initialize } = require('./data/storage');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Define explicit routes BEFORE static middleware
// (so they take precedence over index.html)
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

// Static file serving (after explicit routes)
app.use(express.static('public'));

// Check if using mock authentication
const useMockAuth = process.env.USE_MOCK_AUTH === 'true';

// MongoDB Connection - Only connect if not using mock auth
if (!useMockAuth) {
  const connectDB = require('./lib/mongodb');
  connectDB().then(() => {
    console.log('✅ MongoDB connected for live tracking');
  }).catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('⚠️ Live GPS tracking will not work without MongoDB');
  });
} else {
  console.log('📝 Skipping MongoDB connection (mock auth mode)');
}

// Initialize persistent storage for mock auth
if (useMockAuth) {
  console.log('📝 Mock authentication enabled - using JSON storage for users');
  initialize();
  console.log('💾 Persistent storage initialized');
}

// Routes - Using MongoDB for persistent storage on Vercel
if (useMockAuth) {
  console.log('⚠️  Using MOCK authentication');
  app.use('/api/auth', require('./routes/auth-mock'));
} else {
  app.use('/api/auth', require('./routes/auth'));
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

// Schedules and Reports routes
if (useMockAuth) {
  app.use('/api/schedules', require('./routes/schedules'));
  app.use('/api/reports', require('./routes/reports'));
} else {
  app.use('/api/schedules', require('./routes/schedules-mongo'));
  app.use('/api/reports', require('./routes/reports-mongo'));
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Kolek-Ta server running on port ${PORT}`);
  console.log(`Access from this computer: http://localhost:${PORT}`);
  console.log(`Access from other devices: http://YOUR-IP-ADDRESS:${PORT}`);
  console.log(`\nTo find your IP address, run: ipconfig`);
});
