const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { usersStorage, initialize } = require('../data/storage');
const logger = require('../lib/logger');
const { createUserRules, updateUserRules } = require('../middleware/validate');

// Ensure storage is initialized on each request (for Vercel serverless)
initialize();

// Get all users (Admin only)
router.get('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const allUsers = usersStorage.getAll();
    const users = allUsers.map(u => ({
      _id: u._id,
      username: u.username,
      email: u.email,
      role: u.role,
      fullName: u.fullName,
      phoneNumber: u.phoneNumber,
      isActive: u.isActive
    }));
    res.json(users);
  } catch (error) {
    logger.error('Error:', error);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// Get single user (Admin only)
router.get('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const allUsers = usersStorage.getAll();
    const user = allUsers.find(u => u._id === req.params.id || u.username === req.params.id);
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
      isActive: user.isActive
    });
  } catch (error) {
    logger.error('Error:', error);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// Create new user (Admin only)
router.post('/', authenticateToken, authorizeRole('admin'), createUserRules, async (req, res) => {
  try {
    const { username, email, password, role, fullName, phoneNumber } = req.body;
    const allUsers = usersStorage.getAll();
    
    // Only allow creating drivers
    if (role && role !== 'driver') {
      return res.status(400).json({ error: 'Can only create driver accounts' });
    }
    
    // Check if username exists
    if (allUsers.find(u => u.username === username)) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    // Check if email exists
    if (allUsers.find(u => u.email === email)) {
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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = {
      _id: String(Date.now()),
      username,
      email,
      password: hashedPassword,
      role: 'driver', // Always driver
      fullName,
      phoneNumber,
      isActive: true
    };
    
    usersStorage.add(newUser);
    
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
    logger.error('Error creating user:', error);
    res.status(400).json({ error: 'Failed to create user' });
  }
});

// Update user (Admin only)
router.put('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const allUsers = usersStorage.getAll();
    const userIndex = allUsers.findIndex(u => u._id === req.params.id || u.username === req.params.id);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const { email, password, role, fullName, phoneNumber, isActive } = req.body;
    
    // Prevent changing admin role
    if (allUsers[userIndex].role === 'admin' && role && role !== 'admin') {
      return res.status(400).json({ error: 'Cannot change admin role' });
    }
    
    // Prevent changing driver to admin
    if (role && role === 'admin' && allUsers[userIndex].role !== 'admin') {
      return res.status(400).json({ error: 'Cannot promote user to admin' });
    }
    
    // Check if email is taken by another user
    if (email && allUsers.find((u, i) => u.email === email && i !== userIndex)) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    const updates = {};
    if (email) updates.email = email;
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }
      updates.password = await bcrypt.hash(password, 10);
    }
    if (fullName !== undefined) updates.fullName = fullName;
    if (phoneNumber !== undefined) updates.phoneNumber = phoneNumber;
    
    // Only allow changing active status for drivers
    if (isActive !== undefined && allUsers[userIndex].role !== 'admin') {
      updates.isActive = isActive;
    }
    
    usersStorage.update(allUsers[userIndex].username, updates);
    const updatedUser = usersStorage.findByUsername(allUsers[userIndex].username);
    
    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      fullName: updatedUser.fullName,
      phoneNumber: updatedUser.phoneNumber,
      isActive: updatedUser.isActive
    });
  } catch (error) {
    logger.error('Error updating user:', error);
    res.status(400).json({ error: 'Failed to update user' });
  }
});

// Delete user (Admin only)
router.delete('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const allUsers = usersStorage.getAll();
    const user = allUsers.find(u => u._id === req.params.id || u.username === req.params.id);
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
    
    usersStorage.delete(user.username);
    res.json({ message: 'Driver deleted successfully' });
  } catch (error) {
    logger.error('Error:', error);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

module.exports = router;
