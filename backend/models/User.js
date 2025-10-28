const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: function() {
      // Password is only required for local auth, not OAuth
      return !this.googleId && !this.facebookId;
    }
  },
  // OAuth fields
  googleId: {
    type: String,
    sparse: true  // Allow multiple documents without this field
  },
  facebookId: {
    type: String,
    sparse: true  // Allow multiple documents without this field
  },
  avatar: {
    type: String,
    default: ''
  },
  // Track the provider used for account creation
  provider: {
    type: String,
    enum: ['local', 'google', 'facebook'],
    default: 'local'
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  donations: [{
    campaignId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Campaign' 
    },
    amount: Number,
    date: { 
      type: Date, 
      default: Date.now 
    }
  }],
  resetToken: {
    type: String
  },
  resetTokenExpiry: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate and save reset token
userSchema.methods.generateResetToken = function() {
  const crypto = require('crypto');
  const resetToken = crypto.randomBytes(20).toString('hex');
  
  // Set expiry to 1 hour from now
  this.resetToken = resetToken;
  this.resetTokenExpiry = Date.now() + 3600000; 
  
  return resetToken;
};

// Method to clear reset token after use
userSchema.methods.clearResetToken = function() {
  this.resetToken = undefined;
  this.resetTokenExpiry = undefined;
};

module.exports = mongoose.model('User', userSchema);