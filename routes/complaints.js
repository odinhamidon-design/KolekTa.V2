const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticateToken } = require('../middleware/auth');
const { complaintsStorage } = require('../data/storage');

// MongoDB support
const useMockAuth = process.env.USE_MOCK_AUTH === 'true';
let Complaint;
if (!useMockAuth) {
  Complaint = require('../models/Complaint');
}

// Mati City Barangays
const BARANGAYS = [
  'Badas', 'Bobon', 'Buso', 'Cabuaya', 'Central', 'Dahican', 'Dawan',
  'Don Enrique Lopez', 'Don Martin Marundan', 'Don Salvador Lopez Sr.',
  'Langka', 'Libudon', 'Luban', 'Macambol', 'Mamali', 'Matiao', 'Mayo',
  'Sainz', 'San Agustin', 'San Antonio', 'Sanghay', 'Tagabakid',
  'Tagbinonga', 'Taguibo', 'Tamisan', 'Tarragona'
];

// Configure multer for memory storage (photos)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Generate reference number
function generateReferenceNumber() {
  const year = new Date().getFullYear();
  const random = Math.floor(10000 + Math.random() * 90000);
  return `CMPL-${year}-${random}`;
}

// ===== PUBLIC ENDPOINTS (No authentication required) =====

// Get list of barangays
router.get('/barangays', (req, res) => {
  res.json(BARANGAYS);
});

// Submit a new complaint (PUBLIC)
router.post('/submit', upload.array('photos', 3), async (req, res) => {
  try {
    const { name, phone, email, address, barangay, description, missedCollectionDate } = req.body;

    // Validate required fields
    if (!name || !phone || !email || !address || !barangay || !description || !missedCollectionDate) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate barangay
    if (!BARANGAYS.includes(barangay)) {
      return res.status(400).json({ error: 'Invalid barangay selected' });
    }

    // Convert uploaded files to base64 data URLs
    const photos = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const base64 = file.buffer.toString('base64');
        const dataUrl = `data:${file.mimetype};base64,${base64}`;
        photos.push(dataUrl);
      }
    }

    const referenceNumber = generateReferenceNumber();

    if (!useMockAuth && Complaint) {
      // MongoDB mode
      const complaint = new Complaint({
        referenceNumber,
        name,
        phone,
        email,
        address,
        barangay,
        description,
        missedCollectionDate: new Date(missedCollectionDate),
        photos,
        status: 'pending',
        isNew: true
      });

      await complaint.save();

      console.log('New complaint submitted (MongoDB):', referenceNumber);

      res.status(201).json({
        message: 'Complaint submitted successfully',
        referenceNumber,
        complaint: {
          referenceNumber: complaint.referenceNumber,
          status: complaint.status,
          createdAt: complaint.createdAt
        }
      });
    } else {
      // JSON storage mode
      const complaint = {
        _id: Date.now().toString(),
        referenceNumber,
        name,
        phone,
        email,
        address,
        barangay,
        description,
        missedCollectionDate: new Date(missedCollectionDate).toISOString(),
        photos,
        status: 'pending',
        isNew: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      complaintsStorage.add(complaint);

      console.log('New complaint submitted (JSON):', referenceNumber);

      res.status(201).json({
        message: 'Complaint submitted successfully',
        referenceNumber,
        complaint: {
          referenceNumber: complaint.referenceNumber,
          status: complaint.status,
          createdAt: complaint.createdAt
        }
      });
    }
  } catch (error) {
    console.error('Error submitting complaint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Track complaint status (PUBLIC)
router.get('/track/:referenceNumber', async (req, res) => {
  try {
    const { referenceNumber } = req.params;
    let complaint;

    if (!useMockAuth && Complaint) {
      complaint = await Complaint.findOne({ referenceNumber })
        .select('-photos -adminNotes'); // Don't expose photos and internal notes
    } else {
      const complaints = complaintsStorage.getAll();
      complaint = complaints.find(c => c.referenceNumber === referenceNumber);
      if (complaint) {
        // Remove sensitive fields
        const { photos, adminNotes, ...safeComplaint } = complaint;
        complaint = safeComplaint;
      }
    }

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found. Please check your reference number.' });
    }

    res.json({
      referenceNumber: complaint.referenceNumber,
      status: complaint.status,
      barangay: complaint.barangay,
      description: complaint.description,
      missedCollectionDate: complaint.missedCollectionDate,
      adminResponse: complaint.adminResponse || null,
      assignedDriver: complaint.assignedDriver || null,
      resolvedAt: complaint.resolvedAt || null,
      createdAt: complaint.createdAt,
      updatedAt: complaint.updatedAt
    });
  } catch (error) {
    console.error('Error tracking complaint:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== ADMIN ENDPOINTS (Authentication required) =====

// Get all complaints (Admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { status, barangay, startDate, endDate } = req.query;
    let complaints;

    if (!useMockAuth && Complaint) {
      // MongoDB mode with filters
      const query = {};
      if (status) query.status = status;
      if (barangay) query.barangay = barangay;
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      complaints = await Complaint.find(query)
        .select('-photos') // Don't include photos in list view
        .sort({ createdAt: -1 })
        .lean();
    } else {
      // JSON storage mode with filters
      complaints = complaintsStorage.getAll();

      if (status) {
        complaints = complaints.filter(c => c.status === status);
      }
      if (barangay) {
        complaints = complaints.filter(c => c.barangay === barangay);
      }
      if (startDate) {
        const start = new Date(startDate);
        complaints = complaints.filter(c => new Date(c.createdAt) >= start);
      }
      if (endDate) {
        const end = new Date(endDate);
        complaints = complaints.filter(c => new Date(c.createdAt) <= end);
      }

      // Sort by newest first and remove photos for list view
      complaints = complaints
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map(c => {
          const { photos, ...rest } = c;
          return { ...rest, hasPhotos: photos && photos.length > 0 };
        });
    }

    res.json(complaints);
  } catch (error) {
    console.error('Error fetching complaints:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get complaint statistics (Admin only)
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    let stats;

    if (!useMockAuth && Complaint) {
      // MongoDB aggregation
      const total = await Complaint.countDocuments();
      const pending = await Complaint.countDocuments({ status: 'pending' });
      const inProgress = await Complaint.countDocuments({ status: 'in-progress' });
      const resolved = await Complaint.countDocuments({ status: 'resolved' });
      const closed = await Complaint.countDocuments({ status: 'closed' });
      const newCount = await Complaint.countDocuments({ isNew: true });

      // Get complaints by barangay
      const byBarangay = await Complaint.aggregate([
        { $group: { _id: '$barangay', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      stats = {
        total,
        pending,
        inProgress,
        resolved,
        closed,
        newCount,
        byBarangay: byBarangay.map(b => ({ barangay: b._id, count: b.count }))
      };
    } else {
      // JSON storage
      const complaints = complaintsStorage.getAll();
      const total = complaints.length;
      const pending = complaints.filter(c => c.status === 'pending').length;
      const inProgress = complaints.filter(c => c.status === 'in-progress').length;
      const resolved = complaints.filter(c => c.status === 'resolved').length;
      const closed = complaints.filter(c => c.status === 'closed').length;
      const newCount = complaints.filter(c => c.isNew).length;

      // Group by barangay
      const barangayCounts = {};
      complaints.forEach(c => {
        barangayCounts[c.barangay] = (barangayCounts[c.barangay] || 0) + 1;
      });
      const byBarangay = Object.entries(barangayCounts)
        .map(([barangay, count]) => ({ barangay, count }))
        .sort((a, b) => b.count - a.count);

      stats = { total, pending, inProgress, resolved, closed, newCount, byBarangay };
    }

    res.json(stats);
  } catch (error) {
    console.error('Error fetching complaint stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get new complaints count (for notification badge)
router.get('/new-count', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    let count;

    if (!useMockAuth && Complaint) {
      count = await Complaint.countDocuments({ isNew: true });
    } else {
      const complaints = complaintsStorage.getAll();
      count = complaints.filter(c => c.isNew).length;
    }

    res.json({ count });
  } catch (error) {
    console.error('Error fetching new complaints count:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single complaint with photos (Admin only)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    let complaint;

    if (!useMockAuth && Complaint) {
      complaint = await Complaint.findOne({
        $or: [{ _id: id }, { referenceNumber: id }]
      });
    } else {
      complaint = complaintsStorage.findById(id);
    }

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    res.json(complaint);
  } catch (error) {
    console.error('Error fetching complaint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update complaint (Admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { status, assignedDriver, assignedVehicle, adminResponse, adminNotes } = req.body;

    const updates = { updatedAt: new Date() };
    if (status) updates.status = status;
    if (assignedDriver !== undefined) updates.assignedDriver = assignedDriver;
    if (assignedVehicle !== undefined) updates.assignedVehicle = assignedVehicle;
    if (adminResponse !== undefined) updates.adminResponse = adminResponse;
    if (adminNotes !== undefined) updates.adminNotes = adminNotes;

    // If resolved, set resolved timestamp
    if (status === 'resolved' || status === 'closed') {
      updates.resolvedAt = new Date();
      updates.resolvedBy = req.user.username;
    }

    if (!useMockAuth && Complaint) {
      const complaint = await Complaint.findOneAndUpdate(
        { $or: [{ _id: id }, { referenceNumber: id }] },
        { $set: updates },
        { new: true }
      );

      if (!complaint) {
        return res.status(404).json({ error: 'Complaint not found' });
      }

      console.log('Complaint updated (MongoDB):', complaint.referenceNumber);
      res.json({ message: 'Complaint updated successfully', complaint });
    } else {
      const success = complaintsStorage.update(id, updates);

      if (!success) {
        return res.status(404).json({ error: 'Complaint not found' });
      }

      const complaint = complaintsStorage.findById(id);
      console.log('Complaint updated (JSON):', complaint.referenceNumber);
      res.json({ message: 'Complaint updated successfully', complaint });
    }
  } catch (error) {
    console.error('Error updating complaint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark complaint as read (Admin only)
router.post('/:id/mark-read', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;

    if (!useMockAuth && Complaint) {
      await Complaint.updateOne(
        { $or: [{ _id: id }, { referenceNumber: id }] },
        { $set: { isNew: false } }
      );
    } else {
      complaintsStorage.update(id, { isNew: false });
    }

    console.log('Complaint marked as read:', id);
    res.json({ message: 'Complaint marked as read' });
  } catch (error) {
    console.error('Error marking complaint as read:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark all complaints as read (Admin only)
router.post('/mark-all-read', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (!useMockAuth && Complaint) {
      await Complaint.updateMany({ isNew: true }, { $set: { isNew: false } });
    } else {
      const complaints = complaintsStorage.getAll();
      const updated = complaints.map(c => ({ ...c, isNew: false }));
      complaintsStorage.save(updated);
    }

    console.log('All complaints marked as read');
    res.json({ message: 'All complaints marked as read' });
  } catch (error) {
    console.error('Error marking all complaints as read:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete complaint (Admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;

    if (!useMockAuth && Complaint) {
      const result = await Complaint.deleteOne({
        $or: [{ _id: id }, { referenceNumber: id }]
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Complaint not found' });
      }
    } else {
      const complaint = complaintsStorage.findById(id);
      if (!complaint) {
        return res.status(404).json({ error: 'Complaint not found' });
      }
      complaintsStorage.delete(id);
    }

    console.log('Complaint deleted:', id);
    res.json({ message: 'Complaint deleted successfully' });
  } catch (error) {
    console.error('Error deleting complaint:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
