const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'kolek-ta-secret-key-2024';

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    
    // Ensure MongoDB connection is ready
    const connectDB = require('../lib/mongodb');
    await connectDB();
    
    const user = await User.findOne({ username, role, isActive: true }).maxTimeMS(30000);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
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
        fullName: user.fullName,
        hasFaceData: user.faceDescriptor && user.faceDescriptor.length > 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Face verification login
router.post('/login/face', async (req, res) => {
  try {
    const { username, faceDescriptor } = req.body;
    
    const user = await User.findOne({ username, role: 'driver', isActive: true });
    if (!user || !user.faceDescriptor || user.faceDescriptor.length === 0) {
      return res.status(401).json({ error: 'Face data not found' });
    }
    
    // Calculate Euclidean distance
    const distance = calculateDistance(faceDescriptor, user.faceDescriptor);
    const threshold = 0.6; // Adjust based on accuracy needs
    
    if (distance > threshold) {
      return res.status(401).json({ error: 'Face verification failed' });
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
    const { username, faceDescriptor } = req.body;
    
    const user = await User.findOne({ username, role: 'driver' });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    user.faceDescriptor = faceDescriptor;
    await user.save();
    
    res.json({ message: 'Face data registered successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Forgot password - Send reset token (email-based - legacy)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email, role } = req.body;

    const user = await User.findOne({ email, role });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
    await user.save();

    // In production, send email with reset link
    // For now, return token (remove in production)
    res.json({
      message: 'Reset token generated',
      resetToken, // Remove this in production
      resetLink: `http://localhost:3001/reset-password.html?token=${resetToken}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Forgot password Step 1: Get security question by username
router.post('/forgot-password/question', async (req, res) => {
  try {
    const { username, role } = req.body;

    // Ensure MongoDB connection is ready
    const connectDB = require('../lib/mongodb');
    await connectDB();

    const user = await User.findOne({ username, role, isActive: true }).maxTimeMS(30000);
    if (!user) {
      return res.status(404).json({ error: 'User not found. Please check your username.' });
    }

    if (!user.securityQuestion) {
      return res.status(400).json({ error: 'No security question set for this account. Please contact administrator.' });
    }

    res.json({
      securityQuestion: user.securityQuestion
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Forgot password Step 2: Verify security answer
router.post('/forgot-password/verify', async (req, res) => {
  try {
    const { username, role, answer } = req.body;

    // Ensure MongoDB connection is ready
    const connectDB = require('../lib/mongodb');
    await connectDB();

    const user = await User.findOne({ username, role, isActive: true }).maxTimeMS(30000);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.securityAnswer) {
      return res.status(400).json({ error: 'No security answer set for this account' });
    }

    // Compare answers (case-insensitive)
    if (user.securityAnswer.toLowerCase().trim() !== answer.toLowerCase().trim()) {
      return res.status(401).json({ error: 'Incorrect security answer. Please try again.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
    await user.save();

    res.json({
      message: 'Security answer verified',
      resetToken
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Forgot password Step 3: Reset password with token
router.post('/forgot-password/reset', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    // Ensure MongoDB connection is ready
    const connectDB = require('../lib/mongodb');
    await connectDB();

    const user = await User.findOne({
      resetToken: resetToken,
      resetTokenExpiry: { $gt: Date.now() }
    }).maxTimeMS(30000);

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token. Please try again.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    user.password = newPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully! You can now login with your new password.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }
    
    user.password = newPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();
    
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function
function calculateDistance(desc1, desc2) {
  let sum = 0;
  for (let i = 0; i < desc1.length; i++) {
    sum += Math.pow(desc1[i] - desc2[i], 2);
  }
  return Math.sqrt(sum);
}

module.exports = router;
