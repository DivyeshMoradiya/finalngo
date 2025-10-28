const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');
const Campaign = require('../models/Campaign');
const { sendMail } = require('../utils/mailer');
const { requireAuth } = require('../middleware/auth');

// Create a new donation (requires login)
router.post('/', requireAuth, async (req, res) => {
  try {
    // Always associate donation to the authenticated user
    const donation = new Donation({
      ...req.body,
      userId: req.userId,
    });
    await donation.save();
    
    // Update campaign amount if campaignId is provided
    if (req.body.campaignId) {
      try {
        const campaign = await Campaign.findById(req.body.campaignId);
        if (campaign) {
          campaign.currentAmount = (campaign.currentAmount || 0) + req.body.amount;
          await campaign.save();
          console.log(`Campaign ${campaign.title} amount updated to ${campaign.currentAmount}`);
        }
      } catch (campaignError) {
        console.error('Error updating campaign amount:', campaignError);
      }
    }
    
    // Send a simple email receipt (best-effort)
    try {
      const appName = process.env.APP_NAME || 'HopeNest';
      const subject = `${appName} donation receipt`;
      const html = `
        <div style="font-family:Arial,sans-serif;line-height:1.6">
          <p>Hi ${donation.name},</p>
          <p>Thank you for your ${donation.type} donation of <strong>$${Number(donation.amount).toFixed(2)}</strong>${donation.campaignId ? ' to campaign #' + donation.campaignId : ''}.</p>
          <p>Your transaction ID is <strong>${donation._id}</strong>.</p>
          <p>We appreciate your support.</p>
          <p>— ${appName}</p>
        </div>
      `;
      if (donation.email) {
        await sendMail(donation.email, subject, html);
      }
    } catch (mailError) {
      console.error('Failed to send donation receipt:', mailError);
    }

    res.status(201).json({
      success: true,
      donation: {
        ...donation._doc,
        transactionId: donation._id
      }
    });
  } catch (error) {
    console.error('Error saving donation:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process donation' 
    });
  }
});

// Get current user's donations (requires login)
router.get('/my', requireAuth, async (req, res) => {
  try {
    // Get date range parameters from query
    const { startDate, endDate } = req.query;
    
    // Build query filter
    const filter = { userId: req.userId };
    
    // Add date range filter if provided
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        filter.date.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.date.$lte = new Date(endDate);
      }
    }
    
    const donations = await Donation.find(filter)
      .populate('campaignId', 'title')
      .sort({ date: -1 });
    return res.json({ success: true, donations });
  } catch (error) {
    console.error('Error fetching user donations:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch user donations' });
  }
});

// Get all donations
router.get('/', async (req, res) => {
  try {
    const donations = await Donation.find()
      .populate('campaignId', 'title')
      .sort({ date: -1 });
    res.json(donations);
  } catch (error) {
    console.error('Error fetching donations:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch donations' 
    });
  }
});

module.exports = router;