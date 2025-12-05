const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');
const { usersStorage } = require('../data/storage');

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
  limits: { fileSize: 2 * 1024 * 1024 },
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
    const user = usersStorage.findByUsername(req.user.username);

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
    const { fullName, email, phoneNumber, password } = req.body;
    const username = req.user.username;

    const user = usersStorage.findByUsername(username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updates = {};
    if (fullName) updates.fullName = fullName;
    if (email) updates.email = email;
    if (phoneNumber) updates.phoneNumber = phoneNumber;
    if (password) updates.password = password;

    usersStorage.update(username, updates);

    const updatedUser = usersStorage.findByUsername(username);

    res.json({
      message: 'Profile updated successfully',
      user: {
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        fullName: updatedUser.fullName,
        phoneNumber: updatedUser.phoneNumber,
        profilePicture: updatedUser.profilePicture
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

    const username = req.user.username;
    const user = usersStorage.findByUsername(username);

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
    usersStorage.update(username, { profilePicture: profilePicturePath });

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
    const username = req.user.username;
    const user = usersStorage.findByUsername(username);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.profilePicture) {
      const filePath = path.join(__dirname, '../public', user.profilePicture);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      usersStorage.update(username, { profilePicture: null });
    }

    res.json({ message: 'Profile picture removed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
