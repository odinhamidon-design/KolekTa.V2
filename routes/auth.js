const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

const { authenticateToken } = require('../middleware/auth');
const logger = require('../lib/logger');
const { loginRules, forgotPasswordQuestionRules, forgotPasswordVerifyRules, resetPasswordRules } = require('../middleware/validate');

const JWT_SECRET = process.env.JWT_SECRET || 'kolek-ta-secret-key-2024';
if (!process.env.JWT_SECRET) {
  logger.warn('JWT_SECRET not set — using default fallback. Set JWT_SECRET env var in production!');
}

// Login
router.post('/login', loginRules, async (req, res) => {
  try {
    const { username, password, role } = req.body;
    logger.info('[LOGIN] Attempt:', username, role);

    // Ensure MongoDB connection is ready
    const connectDB = require('../lib/mongodb');
    await connectDB();
    logger.debug('[LOGIN] DB connected');

    const user = await User.findOne({ username, role, isActive: true }).maxTimeMS(60000);
    logger.debug('[LOGIN] User found:', !!user);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    logger.debug('[LOGIN] Password match:', isMatch);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    logger.info('[LOGIN] Success for:', username);
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
    logger.error('[LOGIN] Error:', error);
    res.status(500).json({ error: 'An internal error occurred' });
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
    logger.error('Error during face login:', error);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// Register face data (requires authentication)
router.post('/register-face', authenticateToken, async (req, res) => {
  try {
    const { username, faceDescriptor } = req.body;

    // Only allow users to register their own face, or admin to register any
    if (req.user.role !== 'admin' && req.user.username !== username) {
      return res.status(403).json({ error: 'You can only register your own face data' });
    }

    // Validate face descriptor
    if (!faceDescriptor || !Array.isArray(faceDescriptor) || faceDescriptor.length === 0) {
      return res.status(400).json({ error: 'Valid face descriptor is required' });
    }

    // Validate descriptor values are numbers
    if (!faceDescriptor.every(val => typeof val === 'number' && !isNaN(val))) {
      return res.status(400).json({ error: 'Invalid face descriptor format' });
    }

    const user = await User.findOne({ username, role: 'driver' });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.faceDescriptor = faceDescriptor;
    await user.save();

    logger.info(`Face data registered for user: ${username}`);
    res.json({ message: 'Face data registered successfully' });
  } catch (error) {
    logger.error('Error registering face:', error.message);
    res.status(500).json({ error: 'Failed to register face data' });
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

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const resetLink = `${baseUrl}/reset-password.html?token=${resetToken}`;

    // Send password reset email (falls back to logging if SMTP not configured)
    const { sendPasswordResetEmail } = require('../lib/mailer');
    await sendPasswordResetEmail(email, resetLink);

    res.json({
      message: 'If an account exists with this email, a password reset link has been sent.'
    });
  } catch (error) {
    logger.error('Error in forgot-password:', error);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// Forgot password Step 1: Get security question by username
router.post('/forgot-password/question', forgotPasswordQuestionRules, async (req, res) => {
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
    logger.error('Error in forgot-password/question:', error);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// Forgot password Step 2: Verify security answer
router.post('/forgot-password/verify', forgotPasswordVerifyRules, async (req, res) => {
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
    logger.error('Error in forgot-password/verify:', error);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// Forgot password Step 3: Reset password with token
router.post('/forgot-password/reset', resetPasswordRules, async (req, res) => {
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
    logger.error('Error in forgot-password/reset:', error);
    res.status(500).json({ error: 'An internal error occurred' });
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

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    user.password = newPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();
    
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    logger.error('Error in reset-password:', error);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// Helper function
function calculateDistance(desc1, desc2) {
  if (!Array.isArray(desc1) || !Array.isArray(desc2) || desc1.length !== desc2.length) {
    return Infinity;
  }
  let sum = 0;
  for (let i = 0; i < desc1.length; i++) {
    sum += Math.pow(desc1[i] - desc2[i], 2);
  }
  return Math.sqrt(sum);
}

module.exports = router;
