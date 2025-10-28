const express = require('express');
const router = express.Router();
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const { requireAdmin, requireAuth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { sendMail } = require('../utils/mailer');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads', 'crowdfunding');
fs.mkdirSync(uploadsDir, { recursive: true });

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/\s+/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 }, // 5 MB per file, max 5 files
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'image/jpeg',
      'image/png'
    ];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    return cb(new Error('Only PDF, JPG, and PNG files are allowed'));
  }
});

// GET all APPROVED crowdfunding campaigns (public)
router.get('/', async (req, res) => {
  try {
    const campaigns = await Campaign.find({ type: 'crowdfunding', status: 'approved' })
      .populate('organizer', 'name');
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// POST apply for a new crowdfunding campaign (user)
router.post(
  '/apply',
  requireAuth,
  (req, res, next) => {
    // Run multer and handle validation errors gracefully
    upload.array('documents', 5)(req, res, function (err) {
      if (err) {
        let message = err.message || 'Upload error';
        if (err.code === 'LIMIT_FILE_SIZE') message = 'Each file must be 5MB or smaller';
        if (err.code === 'LIMIT_FILE_COUNT') message = 'You can upload up to 5 documents';
        if (err.code === 'LIMIT_UNEXPECTED_FILE') message = 'Unexpected file field';
        return res.status(400).json({ message });
      }
      return next();
    });
  },
  async (req, res) => {
    try {
      const {
        title,
        description,
        targetAmount,
        startDate,
        endDate,
        category,
        imageUrl
      } = req.body;

      const docs = (req.files || []).map(f => `/uploads/crowdfunding/${f.filename}`);
      if (!docs.length) {
        return res.status(400).json({ message: 'Please upload at least one document (PDF/JPG/PNG).' });
      }
      const payload = {
        title,
        description,
        targetAmount: Number(targetAmount),
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        category,
        imageUrl,
        type: 'crowdfunding',
        organizer: req.userId,
        status: 'pending',
        documents: docs
      };
      const campaign = new Campaign(payload);
      const saved = await campaign.save();

      // Send verification email to organizer
      try {
        const user = await User.findById(req.userId).select('email name');
        if (user && user.email) {
          const token = jwt.sign(
            { t: 'cf_email_verify', cid: saved._id.toString(), uid: req.userId },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
          );
          const base = process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 5000}`;
          const verifyUrl = `${base}/api/crowdfunding/verify-email?token=${encodeURIComponent(token)}`;

          const html = `
            <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
              <h2>Verify your email for HopeNest Crowdfunding</h2>
              <p>Hi ${user.name || 'there'},</p>
              <p>Thanks for applying to start a fundraiser: <strong>${saved.title}</strong>.</p>
              <p>Please verify your email to continue with KYC and bank verification.</p>
              <p>
                <a href="${verifyUrl}" style="display:inline-block;background:#0b3e5e;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Verify Email</a>
              </p>
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break:break-all"><a href="${verifyUrl}">${verifyUrl}</a></p>
              <hr/>
              <p style="font-size:12px;color:#555">This link expires in 24 hours.</p>
            </div>`;

          await sendMail(user.email, 'Verify your email - HopeNest Crowdfunding', html);
        }
      } catch (mailErr) {
        // Log but do not fail the application creation
        console.error('[Crowdfunding] Failed to send verification email:', mailErr?.message || mailErr);
      }

      res.status(201).json(saved);
    } catch (err) {
      res.status(400).json({ message: err.message || 'Failed to submit application' });
    }
  }
);

// Verify email for crowdfunding application
router.get('/verify-email', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).send('Missing token');
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload?.t !== 'cf_email_verify') return res.status(400).send('Invalid token');

    const campaign = await Campaign.findOne({ _id: payload.cid, type: 'crowdfunding', organizer: payload.uid });
    if (!campaign) return res.status(404).send('Application not found');

    if (!campaign.emailVerified) {
      campaign.emailVerified = true;
      await campaign.save();
    }

    const front = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.send(`
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>HopeNest — Email Verified</title>
          <meta http-equiv="refresh" content="6;url=${front}/crowdfunding/apply" />
          <style>
            :root { --brand:#0b3e5e; --accent:#22c55e; --text:#111; --muted:#6b7280; }
            body { margin:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background:#f6faf9; color:var(--text); }
            .wrap { min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px; }
            .card { width:100%; max-width:640px; background:#fff; border:1px solid #e6f0ec; border-radius:12px; box-shadow: 0 6px 24px rgba(11,62,94,0.08); padding:28px; }
            .header { display:flex; align-items:center; gap:12px; margin-bottom:6px; }
            .badge { width:40px; height:40px; border-radius:999px; background:rgba(34,197,94,0.12); display:grid; place-items:center; color:var(--accent); font-weight:700; }
            h1 { font-size:22px; margin:0; color:var(--brand); }
            p { margin:8px 0; line-height:1.6; }
            ul { margin:12px 0 0 18px; padding:0; }
            li { margin:6px 0; }
            .cta { margin-top:16px; }
            .btn { display:inline-block; background:var(--brand); color:#fff; padding:10px 16px; border-radius:8px; text-decoration:none; }
            .btn:hover { filter:brightness(1.05); }
            .hint { margin-top:10px; color:var(--muted); font-size:13px; }
          </style>
        </head>
        <body>
          <div class="wrap">
            <div class="card">
              <div class="header">
                <div class="badge">✓</div>
                <h1>Email verified successfully</h1>
              </div>
              <p>Thank you for confirming your email for the fundraiser <strong>${campaign.title}</strong>.</p>
              <p>Next steps:</p>
              <ul>
                <li>Proceed to complete your identity (KYC) and bank verification in your HopeNest account.</li>
                <li>Our team will contact you within <strong>1–2 hours</strong> to assist with the onboarding review.</li>
              </ul>
              <div class="cta">
                <a class="btn" href="${front}/crowdfunding/apply">Continue to HopeNest</a>
              </div>
              <p class="hint">You will be redirected automatically in a few seconds. If this wasn’t you, please contact support.</p>
            </div>
          </div>
        </body>
      </html>
    `);
  } catch (e) {
    res.status(400).send('Verification link is invalid or expired');
  }
});

// Resend verification email (owner only)
router.post('/:id/resend-verification', requireAuth, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, type: 'crowdfunding', organizer: req.userId });
    if (!campaign) return res.status(404).json({ message: 'Application not found' });
    if (campaign.emailVerified) return res.status(400).json({ message: 'Email already verified' });

    const user = await User.findById(req.userId).select('email name');
    if (!user || !user.email) return res.status(400).json({ message: 'User email not found' });

    const token = jwt.sign(
      { t: 'cf_email_verify', cid: campaign._id.toString(), uid: req.userId },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    const base = process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 5000}`;
    const verifyUrl = `${base}/api/crowdfunding/verify-email?token=${encodeURIComponent(token)}`;

    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
        <h2>Verify your email for HopeNest Crowdfunding</h2>
        <p>Hi ${user.name || 'there'},</p>
        <p>Please verify your email to continue with your fundraiser: <strong>${campaign.title}</strong>.</p>
        <p>
          <a href="${verifyUrl}" style="display:inline-block;background:#0b3e5e;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Verify Email</a>
        </p>
        <p style="font-size:12px;color:#555">This link expires in 24 hours.</p>
      </div>`;

    await sendMail(user.email, 'Verify your email - HopeNest Crowdfunding', html);
    res.json({ message: 'Verification email sent' });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to resend verification' });
  }
});

// GET user's own crowdfunding applications
router.get('/my', requireAuth, async (req, res) => {
  try {
    const items = await Campaign.find({ type: 'crowdfunding', organizer: req.userId })
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ADMIN: GET all crowdfunding campaigns (any status)
router.get('/all', requireAdmin, async (req, res) => {
  try {
    const campaigns = await Campaign.find({ type: 'crowdfunding' })
      .populate('organizer', 'name email')
      .sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new crowdfunding campaign (admin only)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const data = { ...req.body, type: 'crowdfunding' }; // enforce type
    if (!data.status) data.status = 'approved';
    const campaign = new Campaign(data);
    const saved = await campaign.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update crowdfunding campaign (admin only)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const update = { ...req.body, type: 'crowdfunding' }; // maintain type
    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, type: 'crowdfunding' },
      update,
      { new: true }
    );
    if (!campaign) return res.status(404).json({ message: 'Crowdfunding campaign not found' });
    res.json(campaign);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE crowdfunding campaign (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const campaign = await Campaign.findOneAndDelete({ _id: req.params.id, type: 'crowdfunding' });
    if (!campaign) return res.status(404).json({ message: 'Crowdfunding campaign not found' });
    res.json({ message: 'Crowdfunding campaign deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ADMIN: approve crowdfunding campaign
router.put('/:id/approve', requireAdmin, async (req, res) => {
  try {
    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, type: 'crowdfunding' },
      { status: 'approved', rejectionReason: undefined },
      { new: true }
    );
    if (!campaign) return res.status(404).json({ message: 'Crowdfunding campaign not found' });
    res.json(campaign);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ADMIN: reject crowdfunding campaign
router.put('/:id/reject', requireAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, type: 'crowdfunding' },
      { status: 'rejected', rejectionReason: reason || 'Rejected' },
      { new: true }
    );
    if (!campaign) return res.status(404).json({ message: 'Crowdfunding campaign not found' });
    res.json(campaign);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET single APPROVED crowdfunding campaign (public)
router.get('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, type: 'crowdfunding', status: 'approved' })
      .populate('organizer');
    if (!campaign) return res.status(404).json({ message: 'Crowdfunding campaign not found' });
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
