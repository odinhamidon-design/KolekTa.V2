const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { usersStorage } = require('../data/storage');
const { authenticateToken } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'kolek-ta-secret-key-2024';
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  WARNING: JWT_SECRET not set — using default fallback. Set JWT_SECRET env var in production!');
}

// Mock face data storage
const faceData = {};

// Login - using local JSON storage
router.post('/login', async (req, res) => {
  try {
    const { username, password, role } = req.body;

    const users = usersStorage.getAll();
    const user = users.find(u =>
      u.username === username &&
      u.role === role &&
      u.isActive === true
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password using bcrypt (supports both hashed and plain-text passwords)
    let passwordValid = false;
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      // Password is bcrypt-hashed
      passwordValid = await bcrypt.compare(password, user.password);
    } else {
      // Legacy plain-text password — compare and upgrade to hashed
      passwordValid = (user.password === password);
      if (passwordValid) {
        const hashedPassword = await bcrypt.hash(password, 10);
        usersStorage.update(user.username, { password: hashedPassword });
        console.log(`🔒 Upgraded password hash for user: ${username}`);
      }
    }

    if (!passwordValid) {
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
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// Face verification login
router.post('/login/face', async (req, res) => {
  try {
    const { username, faceDescriptor } = req.body;

    const users = usersStorage.getAll();
    const user = users.find(u =>
      u.username === username &&
      u.role === 'driver' &&
      u.isActive === true
    );

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
    console.error('Error during face login:', error);
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

    const users = usersStorage.getAll();
    const user = users.find(u => u.username === username && u.role === 'driver');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Validate face descriptor
    if (!faceDescriptor || !Array.isArray(faceDescriptor) || faceDescriptor.length === 0) {
      return res.status(400).json({ error: 'Valid face descriptor is required' });
    }

    // Validate descriptor values are numbers
    if (!faceDescriptor.every(val => typeof val === 'number' && !isNaN(val))) {
      return res.status(400).json({ error: 'Invalid face descriptor format' });
    }

    faceData[username] = faceDescriptor;

    res.json({ message: 'Face data registered successfully' });
  } catch (error) {
    console.error('Error registering face:', error);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// Forgot Password - Get Security Question
router.post('/forgot-password/question', async (req, res) => {
  try {
    const { username, role } = req.body;

    const users = usersStorage.getAll();
    const user = users.find(u => u.username === username && u.role === role);

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
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// Forgot Password - Verify Security Answer
router.post('/forgot-password/verify', async (req, res) => {
  try {
    const { username, role, answer } = req.body;

    const users = usersStorage.getAll();
    const user = users.find(u => u.username === username && u.role === role);

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
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// Forgot Password - Reset Password
router.post('/forgot-password/reset', async (req, res) => {
  try {
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

    // Hash and update password in local storage
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    usersStorage.update(decoded.username, { password: hashedPassword });

    res.json({
      message: 'Password reset successfully'
    });
  } catch (error) {
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
