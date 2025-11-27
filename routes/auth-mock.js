const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const connectDB = require('../lib/mongodb');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'kolek-ta-secret-key-2024';

// Mock face data storage
const faceData = {};

// Login
router.post('/login', async (req, res) => {
  try {
    await connectDB();
    const { username, password, role } = req.body;
    
    const user = await User.findOne({ 
      username, 
      role, 
      isActive: true 
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { userId: user._id, role: user.role, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log(`✅ User logged in: ${username} (${role})`);
    
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        hasFaceData: !!faceData[user.username]
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Face verification login
router.post('/login/face', async (req, res) => {
  try {
    await connectDB();
    const { username, faceDescriptor } = req.body;
    
    const user = await User.findOne({ 
      username, 
      role: 'driver', 
      isActive: true 
    });
    
    if (!user || !faceData[username]) {
      return res.status(401).json({ error: 'Face data not found. Please register your face first.' });
    }
    
    // Simple face matching
    const storedDescriptor = faceData[username];
    const distance = calculateDistance(faceDescriptor, storedDescriptor);
    const threshold = 0.6;
    
    if (distance > threshold) {
      return res.status(401).json({ error: 'Face verification failed. Please try again.' });
    }
    
    const token = jwt.sign(
      { userId: user._id, role: user.role, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.fullName
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register face data
router.post('/register-face', async (req, res) => {
  try {
    await connectDB();
    const { username, faceDescriptor } = req.body;
    
    const user = await User.findOne({ username, role: 'driver' });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    faceData[username] = faceDescriptor;
    
    res.json({ message: 'Face data registered successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Forgot Password - Get Security Question
router.post('/forgot-password/question', async (req, res) => {
  try {
    await connectDB();
    const { username, role } = req.body;
    
    const user = await User.findOne({ username, role });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!user.securityQuestion) {
      return res.status(400).json({ error: 'No security question set for this user' });
    }
    
    res.json({
      username: user.username,
      securityQuestion: user.securityQuestion
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Forgot Password - Verify Security Answer
router.post('/forgot-password/verify', async (req, res) => {
  try {
    await connectDB();
    const { username, role, answer } = req.body;
    
    const user = await User.findOne({ username, role });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!user.securityAnswer || user.securityAnswer.toLowerCase() !== answer.toLowerCase()) {
      return res.status(401).json({ error: 'Incorrect answer' });
    }
    
    const resetToken = jwt.sign(
      { userId: user._id, username: user.username, purpose: 'password-reset' },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
    
    res.json({
      message: 'Answer verified',
      resetToken
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Forgot Password - Reset Password
router.post('/forgot-password/reset', async (req, res) => {
  try {
    await connectDB();
    const { resetToken, newPassword } = req.body;
    
    let decoded;
    try {
      decoded = jwt.verify(resetToken, JWT_SECRET);
      if (decoded.purpose !== 'password-reset') {
        return res.status(403).json({ error: 'Invalid reset token' });
      }
    } catch (error) {
      return res.status(403).json({ error: 'Reset token expired or invalid' });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await User.updateOne(
      { username: decoded.username },
      { password: hashedPassword }
    );
    
    res.json({
      message: 'Password reset successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function
function calculateDistance(desc1, desc2) {
  let sum = 0;
  for (let i = 0; i < Math.min(desc1.length, desc2.length); i++) {
    sum += Math.pow(desc1[i] - desc2[i], 2);
  }
  return Math.sqrt(sum);
}

module.exports = router;
