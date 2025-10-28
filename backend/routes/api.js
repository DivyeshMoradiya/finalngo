const express = require('express');
const router = express.Router();
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const Donation = require('../models/Donation');

// GET all campaigns
router.get('/campaigns', async (req, res) => {
  try {
    const campaigns = await Campaign.find().populate('organizer', 'name');
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single campaign
router.get('/campaigns/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id).populate('organizer');
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new campaign
router.post('/campaigns', async (req, res) => {
  try {
    const campaign = new Campaign(req.body);
    const savedCampaign = await campaign.save();
    res.status(201).json(savedCampaign);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update campaign
router.put('/campaigns/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    res.json(campaign);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE campaign
router.delete('/campaigns/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndDelete(req.params.id);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    res.json({ message: 'Campaign deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all users (admin only)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single user
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new user (admin only)
router.post('/users', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({ name, email, password, role });
    const savedUser = await user.save();
    
    // Return user without password
    const userResponse = savedUser.toObject();
    delete userResponse.password;
    
    res.status(201).json(userResponse);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update user
router.put('/users/:id', async (req, res) => {
  try {
    const { name, email, password, role, isBlocked } = req.body;
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (typeof isBlocked === 'boolean') updateData.isBlocked = isBlocked;

    // Only update password if provided
    if (password) {
      updateData.password = password;
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE user
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// NOTE: Donations endpoints are handled in routes/donations.js mounted at /api/donations
module.exports = router;