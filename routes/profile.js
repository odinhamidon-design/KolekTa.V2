const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');
const { usersStorage } = require('../data/storage');
const logger = require('../lib/logger');

// MongoDB support
const useMockAuth = process.env.USE_MOCK_AUTH === 'true';
let User;
if (!useMockAuth) {
  User = require('../models/User');
}

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
    let user;

    if (!useMockAuth && User) {
      // MongoDB mode
      user = await User.findOne({ username: req.user.username });
    } else {
      // JSON storage mode
      user = usersStorage.findByUsername(req.user.username);
    }

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
    logger.error('Error:', error);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// Update profile
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const { fullName, email, phoneNumber, password } = req.body;
    const username = req.user.username;

    const updates = {};
    if (fullName) updates.fullName = fullName;
    if (email) updates.email = email;
    if (phoneNumber) updates.phoneNumber = phoneNumber;

    let updatedUser;

    if (!useMockAuth && User) {
      // MongoDB mode
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Require current password verification when changing password
      if (password) {
        const { currentPassword } = req.body;
        if (!currentPassword) {
          return res.status(400).json({ error: 'Current password is required to change password' });
        }
        const bcrypt = require('bcryptjs');
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
          return res.status(401).json({ error: 'Current password is incorrect' });
        }
        updates.password = await bcrypt.hash(password, 10);
      }

      updatedUser = await User.findOneAndUpdate(
        { username },
        { $set: updates },
        { new: true }
      );
    } else {
      // JSON storage mode
      const user = usersStorage.findByUsername(username);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Require current password verification when changing password
      if (password) {
        const { currentPassword } = req.body;
        if (!currentPassword) {
          return res.status(400).json({ error: 'Current password is required to change password' });
        }
        const bcrypt = require('bcryptjs');
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
          return res.status(401).json({ error: 'Current password is incorrect' });
        }
        updates.password = await bcrypt.hash(password, 10);
      }

      usersStorage.update(username, updates);
      updatedUser = usersStorage.findByUsername(username);
    }

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
    logger.error('Error:', error);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// Upload profile picture
router.post('/picture', authenticateToken, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const username = req.user.username;
    let user;

    if (!useMockAuth && User) {
      user = await User.findOne({ username });
    } else {
      user = usersStorage.findByUsername(username);
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete old profile picture if exists (with path traversal check)
    if (user.profilePicture) {
      const resolved = path.resolve(path.join(__dirname, '../public', user.profilePicture));
      const allowed = path.resolve(path.join(__dirname, '../public/uploads/profiles'));
      if (resolved.startsWith(allowed) && fs.existsSync(resolved)) {
        fs.unlinkSync(resolved);
      }
    }

    // Update user with new profile picture path
    const profilePicturePath = `/uploads/profiles/${req.file.filename}`;

    if (!useMockAuth && User) {
      await User.updateOne({ username }, { $set: { profilePicture: profilePicturePath } });
    } else {
      usersStorage.update(username, { profilePicture: profilePicturePath });
    }

    res.json({
      message: 'Profile picture updated successfully',
      profilePicture: profilePicturePath
    });
  } catch (error) {
    logger.error('Error:', error);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// Delete profile picture
router.delete('/picture', authenticateToken, async (req, res) => {
  try {
    const username = req.user.username;
    let user;

    if (!useMockAuth && User) {
      user = await User.findOne({ username });
    } else {
      user = usersStorage.findByUsername(username);
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.profilePicture) {
      const resolved = path.resolve(path.join(__dirname, '../public', user.profilePicture));
      const allowed = path.resolve(path.join(__dirname, '../public/uploads/profiles'));
      if (resolved.startsWith(allowed) && fs.existsSync(resolved)) {
        fs.unlinkSync(resolved);
      }

      if (!useMockAuth && User) {
        await User.updateOne({ username }, { $set: { profilePicture: null } });
      } else {
        usersStorage.update(username, { profilePicture: null });
      }
    }

    res.json({ message: 'Profile picture removed' });
  } catch (error) {
    logger.error('Error:', error);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

module.exports = router;
