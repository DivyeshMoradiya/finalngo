const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const passport = require('../config/passport'); // Import configured passport
require('dotenv').config();
const { sendMail } = require('../utils/mailer');

// Test route to verify routes are working
router.get('/test-simple', (req, res) => {
  res.json({ 
    message: 'Simple test route works!',
    timestamp: new Date().toISOString()
  });
});

// Generate random 6-digit alphanumeric token
function generateResetToken() {
  return crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 characters (0-9, A-F)
}

// Helper function to generate JWT token
function generateJWTToken(user) {
  return jwt.sign(
    { 
      userId: user._id,
      email: user.email,
      name: user.name
    }, 
    process.env.JWT_SECRET, 
    { expiresIn: '7d' }
  );
}

// ==================== OAUTH ROUTES ====================

// Test route to verify OAuth routes are loading
router.get('/oauth-test', (req, res) => {
  res.json({ 
    message: 'OAuth routes are loaded successfully',
    timestamp: new Date().toISOString()
  });
});

// Simple Google test route without passport
router.get('/google-test', (req, res) => {
  res.json({ 
    message: 'Google test route works',
    redirectUrl: 'https://accounts.google.com/oauth/authorize?test=true'
  });
});

// Helper function to check if OAuth strategy is available
function isOAuthAvailable(provider) {
  if (provider === 'google') {
    return process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
  }
  if (provider === 'facebook') {
    return process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET;
  }
  return false;
}

// Google OAuth - Initiate authentication
router.get('/google', (req, res, next) => {
  if (!isOAuthAvailable('google')) {
    return res.status(503).json({ 
      error: 'Google OAuth not configured', 
      message: 'Google OAuth credentials are missing. Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in environment variables.' 
    });
  }
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    callbackURL: "/api/auth/google/callback"
  })(req, res, next);
});

// Google OAuth - Callback route
router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth_failed`,
    session: false  // We're using JWT, not sessions
  }),
  (req, res) => {
    try {
      // Generate JWT token for the authenticated user
      const token = generateJWTToken(req.user);
      
      // Dynamically determine frontend URL from referrer or use env var
      const frontendUrl = req.get('Referer')?.split('/').slice(0, 3).join('/') || 
                         process.env.FRONTEND_URL || 
                         'http://localhost:5173';
      
      // Redirect to frontend with token as query parameter
      // Frontend will extract token and store it in localStorage
      const redirectUrl = `${frontendUrl}/?token=${token}&name=${encodeURIComponent(req.user.name)}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      
      // Use the same dynamic frontend URL for error redirects
      const frontendUrl = req.get('Referer')?.split('/').slice(0, 3).join('/') || 
                         process.env.FRONTEND_URL || 
                         'http://localhost:5173';
      res.redirect(`${frontendUrl}/login?error=token_generation_failed`);
    }
  }
);

// Facebook OAuth - Initiate authentication
router.get('/facebook', (req, res, next) => {
  if (!isOAuthAvailable('facebook')) {
    return res.status(503).json({ 
      error: 'Facebook OAuth not configured', 
      message: 'Facebook OAuth credentials are missing. Please configure FACEBOOK_CLIENT_ID and FACEBOOK_CLIENT_SECRET in environment variables.' 
    });
  }
  passport.authenticate('facebook', {
    scope: ['email'],
    callbackURL: "/api/auth/facebook/callback"
  })(req, res, next);
});

// Facebook OAuth - Callback route
router.get('/facebook/callback',
  passport.authenticate('facebook', { 
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth_failed`,
    session: false  // We're using JWT, not sessions
  }),
  (req, res) => {
    try {
      // Generate JWT token for the authenticated user
      const token = generateJWTToken(req.user);
      
      // Dynamically determine frontend URL from referrer or use env var
      const frontendUrl = req.get('Referer')?.split('/').slice(0, 3).join('/') || 
                         process.env.FRONTEND_URL || 
                         'http://localhost:5173';
      
      // Redirect to frontend with token as query parameter
      // Frontend will extract token and store it in localStorage
      const redirectUrl = `${frontendUrl}/?token=${token}&name=${encodeURIComponent(req.user.name)}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Facebook OAuth callback error:', error);
      
      // Use the same dynamic frontend URL for error redirects
      const frontendUrl = req.get('Referer')?.split('/').slice(0, 3).join('/') || 
                         process.env.FRONTEND_URL || 
                         'http://localhost:5173';
      res.redirect(`${frontendUrl}/login?error=token_generation_failed`);
    }
  }
);

// ==================== STANDARD AUTH ROUTES ====================

// Update user profile
router.put('/update', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { name, email, currentPassword, newPassword, avatar } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required' });
      }
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      user.password = newPassword;
    }

    // Update user fields
    user.name = name;
    user.email = email;
    
    // Update avatar if provided
    if (avatar !== undefined) {
      user.avatar = avatar;
    }

    await user.save();

    // Generate new token if email changed
    const updatedToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1d'
    });

    res.json({
      message: 'Profile updated successfully',
      token: updatedToken,
      user: { 
        name: user.name, 
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid data provided' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Delete user account
router.delete('/delete', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await User.findByIdAndDelete(decoded.userId);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Signup route
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = new User({ name, email, password, provider: 'local' });
    await user.save();

    // Create token using helper function
    const token = generateJWTToken(user);

    res.status(201).json({ token, userId: user._id, name: user.name });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      // Security: Don't reveal if user exists or not
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Prevent blocked users from logging in
    if (user.isBlocked) {
      return res.status(403).json({ message: 'Account is blocked' });
    }

    // Check if user registered with OAuth (no password)
    if (!user.password && (user.googleId || user.facebookId)) {
      return res.status(400).json({ 
        message: 'This account was created with social login. Please use Google or Facebook to sign in.' 
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create token using helper function
    const token = generateJWTToken(user);

    res.json({ token, userId: user._id, name: user.name });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
});

// Get authenticated user's data (with role)
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId)
      .select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      userId: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role // <-- Added role here
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user data' });
  }
});

// Password reset request
router.post('/request-reset', async (req, res) => {
  try {
    const { email } = req.body;
    
    // 1. Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'No account with that email exists'
      });
    }

    // 2. Generate and save reset token (valid for 1 hour)
    const resetToken = generateResetToken();
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000; // 1 hour from now
    await user.save();

    // 3. Email the reset token to the user
    const appName = process.env.APP_NAME || 'HopeNest';
    const subject = `${appName} password reset code`;
    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.6">
        <p>Hello${user.name ? ' ' + user.name : ''},</p>
        <p>Use the following code to reset your password:</p>
        <p style="font-size:20px;font-weight:bold;letter-spacing:2px">${resetToken}</p>
        <p>This code will expire in 1 hour.</p>
        <p>If you did not request this, you can safely ignore this email.</p>
        <p>— ${appName}</p>
      </div>
    `;

    try {
      await sendMail(user.email, subject, html);
    } catch (mailError) {
      console.error('Failed to send reset email:', mailError);
    }

    res.json({
      success: true,
      message: 'If an account exists for this email, a reset code has been sent',
      // For dev convenience, also return reset token
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating reset token'
    });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    // 1. Find user by email and check token
    const user = await User.findOne({ 
      email,
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() } // Check if token is not expired
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // 2. Update password and clear reset token
    user.password = newPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password'
    });
  }
});

module.exports = router;
