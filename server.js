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
app.use(express.static('public'));

// Check if using mock authentication
const useMockAuth = process.env.USE_MOCK_AUTH === 'true';

// MongoDB Connection - ALWAYS connect for live tracking feature
const connectDB = require('./lib/mongodb');
connectDB().then(() => {
  console.log('✅ MongoDB connected for live tracking');
}).catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  console.log('⚠️ Live GPS tracking will not work without MongoDB');
});

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

// Always use MongoDB for users, trucks, routes (persistent on Vercel)
console.log('📦 Using MongoDB for users, trucks, routes (persistent storage)');
app.use('/api/users', require('./routes/users-mongo'));
app.use('/api/trucks', require('./routes/trucks-mongo'));
app.use('/api/routes', require('./routes/routes-mongo'));

app.use('/api/collections', require('./routes/collections'));
app.use('/api/bins', require('./routes/bins'));
app.use('/api/completions', require('./routes/completions'));
app.use('/api/tracking', require('./routes/tracking'));
app.use('/api/profile', require('./routes/profile'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/mobile', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'mobile.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Kolek-Ta server running on port ${PORT}`);
  console.log(`Access from this computer: http://localhost:${PORT}`);
  console.log(`Access from other devices: http://YOUR-IP-ADDRESS:${PORT}`);
  console.log(`\nTo find your IP address, run: ipconfig`);
});
