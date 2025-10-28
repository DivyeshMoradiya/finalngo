const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  type: { type: String, enum: ['once', 'monthly'], required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  paymentMethod: { type: String, required: true },
  reminder: { type: Boolean, default: false },
  date: { type: Date, default: Date.now },
  status: { type: String, default: 'completed' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' }
});

module.exports = mongoose.model('Donation', donationSchema);