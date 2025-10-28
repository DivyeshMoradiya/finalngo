const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/User');
require('dotenv').config();

console.log('🔧 Passport configuration loading...');
console.log('Google Client ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing');
console.log('Facebook Client ID:', process.env.FACEBOOK_CLIENT_ID ? 'Set' : 'Missing');

// Serialize user for the session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password');
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy - only initialize if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  console.log('✅ Initializing Google OAuth strategy...');
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('Google OAuth Profile:', profile);
      
      // Check if user already exists with this Google ID
      let user = await User.findOne({ googleId: profile.id });
      
      if (user) {
        // User exists with Google ID, log them in
        return done(null, user);
      }
      
      // Check if user exists with same email (from local registration)
      user = await User.findOne({ email: profile.emails[0].value });
      
      if (user) {
        // User exists with email but no Google ID - link accounts
        user.googleId = profile.id;
        user.avatar = user.avatar || profile.photos[0]?.value || '';
        await user.save();
        return done(null, user);
      }
      
      // Create new user with Google profile
      user = new User({
        googleId: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value,
        avatar: profile.photos[0]?.value || '',
        provider: 'google'
      });
      
      await user.save();
      return done(null, user);
      
    } catch (error) {
      console.error('Google OAuth Error:', error);
      return done(error, null);
    }
  }));
} else {
  console.log('⚠️ Google OAuth credentials missing - Google authentication disabled');
}

// Facebook OAuth Strategy - only initialize if credentials are provided
if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
  console.log('✅ Initializing Facebook OAuth strategy...');
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    callbackURL: "/api/auth/facebook/callback",
    profileFields: ['id', 'displayName', 'emails', 'photos']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('Facebook OAuth Profile:', profile);
      
      // Check if user already exists with this Facebook ID
      let user = await User.findOne({ facebookId: profile.id });
      
      if (user) {
        // User exists with Facebook ID, log them in
        return done(null, user);
      }
      
      // Check if user exists with same email (from local registration)
      const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
      if (email) {
        user = await User.findOne({ email: email });
        
        if (user) {
          // User exists with email but no Facebook ID - link accounts
          user.facebookId = profile.id;
          user.avatar = user.avatar || profile.photos[0]?.value || '';
          await user.save();
          return done(null, user);
        }
      }
      
      // Create new user with Facebook profile
      user = new User({
        facebookId: profile.id,
        name: profile.displayName,
        email: email,
        avatar: profile.photos[0]?.value || '',
        provider: 'facebook'
      });
      
      await user.save();
      return done(null, user);
      
    } catch (error) {
      console.error('Facebook OAuth Error:', error);
      return done(error, null);
    }
  }));
} else {
  console.log('⚠️ Facebook OAuth credentials missing - Facebook authentication disabled');
}

module.exports = passport;