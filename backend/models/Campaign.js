const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  targetAmount: { type: Number, required: true },
  currentAmount: { type: Number, default: 0 },
  startDate: { type: Date, default: Date.now },
  endDate: Date,
  imageUrl: String,
  type: { type: String, enum: ['campaign', 'crowdfunding'], default: 'campaign' },
  category: String,
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Approval workflow fields
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  documents: [{ type: String }], // stored file paths like "uploads/crowdfunding/<file>"
  rejectionReason: { type: String },
  // Verification flags
  emailVerified: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Campaign', campaignSchema);