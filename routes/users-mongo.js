const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const connectDB = require('../lib/mongodb');
const User = require('../models/User');

// Get all users (Admin only)
router.get('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    await connectDB();
    const users = await User.find({}).select('-password -faceDescriptor');
    res.json(users);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// Get single user (Admin only)
router.get('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    await connectDB();
    const user = await User.findOne({
      $or: [
        { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null },
        { username: req.params.id }
      ]
    }).select('-password -faceDescriptor');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// Create new user (Admin only)
router.post('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    await connectDB();
    const { username, email, password, role, fullName, phoneNumber } = req.body;
    
    // Only allow creating drivers
    if (role && role !== 'driver') {
      return res.status(400).json({ error: 'Can only create driver accounts' });
    }
    
    // Check if username exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    // Check if email exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    // Validate required fields for driver
    if (!fullName || !phoneNumber) {
      return res.status(400).json({ error: 'Full name and phone number are required' });
    }

    // Validate password
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const newUser = new User({
      username,
      email,
      password, // Will be hashed by pre-save hook
      role: 'driver',
      fullName,
      phoneNumber,
      isActive: true
    });
    
    await newUser.save();
    console.log('✅ User created in MongoDB:', username);
    
    res.status(201).json({
      _id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      fullName: newUser.fullName,
      phoneNumber: newUser.phoneNumber,
      isActive: newUser.isActive
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(400).json({ error: 'Failed to create user' });
  }
});

// Update user (Admin only)
router.put('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    await connectDB();
    const user = await User.findOne({
      $or: [
        { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null },
        { username: req.params.id }
      ]
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const { email, password, role, fullName, phoneNumber, isActive } = req.body;
    
    // Prevent changing admin role
    if (user.role === 'admin' && role && role !== 'admin') {
      return res.status(400).json({ error: 'Cannot change admin role' });
    }
    
    // Prevent changing driver to admin
    if (role && role === 'admin' && user.role !== 'admin') {
      return res.status(400).json({ error: 'Cannot promote user to admin' });
    }
    
    // Check if email is taken by another user
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email, _id: { $ne: user._id } });
      if (existingEmail) {
        return res.status(400).json({ error: 'Email already exists' });
      }
      user.email = email;
    }
    
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }
      user.password = await bcrypt.hash(password, 10);
    }
    if (fullName !== undefined) user.fullName = fullName;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    
    // Only allow changing active status for drivers
    if (isActive !== undefined && user.role !== 'admin') {
      user.isActive = isActive;
    }
    
    await user.save();
    console.log('✅ User updated in MongoDB:', user.username);
    
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      isActive: user.isActive
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(400).json({ error: 'Failed to update user' });
  }
});

// Delete user (Admin only)
router.delete('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    await connectDB();
    const user = await User.findOne({
      $or: [
        { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null },
        { username: req.params.id }
      ]
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Prevent deleting admin
    if (user.role === 'admin') {
      return res.status(400).json({ error: 'Cannot delete admin account' });
    }
    
    // Prevent deleting yourself
    if (user.username === req.user.username) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    await User.deleteOne({ _id: user._id });
    console.log('✅ User deleted from MongoDB:', user.username);
    res.json({ message: 'Driver deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

module.exports = router;
