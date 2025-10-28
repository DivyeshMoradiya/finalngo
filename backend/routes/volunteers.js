const express = require('express');
const router = express.Router();
const Volunteer = require('../models/Volunteer');
const { requireAuth } = require('../middleware/auth');

// Create a new volunteer (requires login)
router.post('/', requireAuth, async (req, res) => {
  try {
    // Always associate volunteer with authenticated user
    const volunteer = new Volunteer({
      ...req.body,
      userId: req.userId,
    });
    await volunteer.save();
    res.status(201).json({ success: true, volunteer });
  } catch (error) {
    console.error('Error saving volunteer:', error);
    res.status(500).json({ success: false, message: 'Failed to save volunteer' });
  }
});

// Get all volunteers
router.get('/', async (req, res) => {
  try {
    const volunteers = await Volunteer.find().sort({ createdAt: -1 }).populate('campaignId', 'title');
    res.json(volunteers);
  } catch (error) {
    console.error('Error fetching volunteers:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch volunteers' });
  }
});

// Get current user's volunteers (requires login)
router.get('/my', requireAuth, async (req, res) => {
  try {
    const volunteers = await Volunteer.find({ userId: req.userId })
      .populate('campaignId', 'title')
      .sort({ createdAt: -1 });
    return res.json({ success: true, volunteers });
  } catch (error) {
    console.error('Error fetching user volunteers:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch user volunteers' });
  }
});

// Update volunteer status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const volunteer = await Volunteer.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!volunteer) return res.status(404).json({ success: false, message: 'Volunteer not found' });
    res.json({ success: true, volunteer });
  } catch (error) {
    console.error('Error updating volunteer:', error);
    res.status(500).json({ success: false, message: 'Failed to update volunteer' });
  }
});

// Delete volunteer
router.delete('/:id', async (req, res) => {
  try {
    const volunteer = await Volunteer.findByIdAndDelete(req.params.id);
    if (!volunteer) return res.status(404).json({ success: false, message: 'Volunteer not found' });
    res.json({ success: true, message: 'Volunteer deleted' });
  } catch (error) {
    console.error('Error deleting volunteer:', error);
    res.status(500).json({ success: false, message: 'Failed to delete volunteer' });
  }
});

module.exports = router;
