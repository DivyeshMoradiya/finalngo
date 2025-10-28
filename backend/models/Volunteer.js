const mongoose = require('mongoose');

const volunteerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', default: null },
  availability: { type: String, enum: ['weekdays', 'weekends', 'any'], default: 'any' },
  skills: [{ type: String }],
  message: { type: String, default: '' },
  status: { type: String, enum: ['active', 'archived'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Volunteer', volunteerSchema);
