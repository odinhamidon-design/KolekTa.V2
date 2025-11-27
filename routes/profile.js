const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');
const connectDB = require('../lib/mongodb');
const User = require('../models/User');

// Configure multer for profile picture upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../public/uploads/profiles');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const username = req.user.username;
    const ext = path.extname(file.originalname);
    cb(null, `profile-${username}-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    await connectDB();
    const user = await User.findOne({ username: req.user.username });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      profilePicture: user.profilePicture || null,
      isActive: user.isActive
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update profile
router.put('/me', authenticateToken, async (req, res) => {
  try {
    await connectDB();
    const { fullName, email, phoneNumber, password } = req.body;
    const username = req.user.username;
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (fullName) user.fullName = fullName;
    if (email) user.email = email;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (password) user.password = password;
    
    await user.save();
    
    res.json({
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload profile picture
router.post('/picture', authenticateToken, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    await connectDB();
    const username = req.user.username;
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Delete old profile picture if exists
    if (user.profilePicture) {
      const oldPath = path.join(__dirname, '../public', user.profilePicture);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }
    
    // Update user with new profile picture path
    const profilePicturePath = `/uploads/profiles/${req.file.filename}`;
    user.profilePicture = profilePicturePath;
    await user.save();
    
    res.json({
      message: 'Profile picture updated successfully',
      profilePicture: profilePicturePath
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete profile picture
router.delete('/picture', authenticateToken, async (req, res) => {
  try {
    await connectDB();
    const username = req.user.username;
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.profilePicture) {
      const filePath = path.join(__dirname, '../public', user.profilePicture);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      user.profilePicture = null;
      await user.save();
    }
    
    res.json({ message: 'Profile picture removed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
