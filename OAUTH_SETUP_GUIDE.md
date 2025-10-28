# 🔐 OAuth Integration Setup Guide

## 🚀 Complete MERN Stack OAuth Implementation

Your MERN stack application now includes **Google and Facebook OAuth authentication** with JWT tokens! Here's everything you need to know.

## 📋 What Was Implemented

### Backend Features:
- ✅ **Passport.js Integration** with Google & Facebook strategies
- ✅ **JWT Token Generation** for OAuth users
- ✅ **MongoDB User Model** updated for OAuth support
- ✅ **API Routes** for OAuth authentication
- ✅ **Account Linking** - OAuth users can link to existing email accounts
- ✅ **Session Management** with secure cookies

### Frontend Features:
- ✅ **OAuth Login Buttons** - Google & Facebook
- ✅ **Token Handling** - Automatic JWT storage and management
- ✅ **Dashboard Component** - Post-login user interface
- ✅ **Error Handling** - OAuth failure and token issues
- ✅ **User Feedback** - Success messages and loading states

## 🔧 Setup Instructions

### 1. Configure OAuth Applications

#### Google OAuth Setup:
1. Go to [Google Cloud Console](https://console.developers.google.com)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Set **Authorized redirect URIs** to:
   ```
   http://localhost:5000/api/auth/google/callback
   ```
6. Copy your **Client ID** and **Client Secret**

#### Facebook OAuth Setup:
1. Go to [Facebook Developers](https://developers.facebook.com)
2. Create a new app or select existing one
3. Add **Facebook Login** product
4. Set **Valid OAuth Redirect URIs** to:
   ```
   http://localhost:5000/api/auth/facebook/callback
   ```
5. Copy your **App ID** and **App Secret**

### 2. Update Environment Variables

Edit `backend/.env` file with your actual OAuth credentials:

```env
# OAuth Configuration
GOOGLE_CLIENT_ID=your_actual_google_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret_here

FACEBOOK_CLIENT_ID=your_actual_facebook_app_id_here
FACEBOOK_CLIENT_SECRET=your_actual_facebook_app_secret_here

# Session Secret (change this to a random string)
SESSION_SECRET=your_random_session_secret_here_make_it_long_and_complex

# Frontend URL for redirects
FRONTEND_URL=http://localhost:3000
```

### 3. Test the Implementation

#### Start Both Servers:
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd HopeNest
npm run dev
```

#### Test OAuth Flow:
1. Open `http://localhost:5175/login` (or your frontend port)
2. Click **"Login with Google"** or **"Login with Facebook"**
3. Complete OAuth authorization
4. You'll be redirected to Dashboard with JWT token
5. User data is stored in MongoDB

## 🎯 API Endpoints

### OAuth Routes:
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/facebook` - Initiate Facebook OAuth  
- `GET /api/auth/facebook/callback` - Facebook OAuth callback

### Standard Auth Routes (still work):
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/signup` - Email/password signup
- `GET /api/auth/me` - Get current user (JWT required)

## 🔄 How It Works

### 1. User Clicks OAuth Button
```javascript
// Frontend redirects to backend OAuth route
window.location.href = 'http://localhost:5000/api/auth/google';
```

### 2. OAuth Provider Authentication
- User completes OAuth flow with Google/Facebook
- Provider redirects back to your callback URL

### 3. Backend Processing
```javascript
// Passport strategy processes OAuth profile
// Creates or finds user in MongoDB
// Generates JWT token
// Redirects to frontend with token
```

### 4. Frontend Token Handling
```javascript
// Extracts token from URL parameters
// Stores token in localStorage
// Redirects to dashboard/main app
```

## 🛡️ Security Features

- **JWT Tokens** - Secure, stateless authentication
- **Session Management** - Secure session handling for OAuth
- **Account Linking** - OAuth accounts link to existing email accounts
- **Password Protection** - OAuth users can't login with password
- **Error Handling** - Graceful failure handling
- **Token Validation** - Backend verifies JWT tokens

## 🗄️ Database Schema Updates

### User Model Changes:
```javascript
{
  // Existing fields...
  googleId: String,        // Google OAuth ID
  facebookId: String,      // Facebook OAuth ID  
  provider: String,        // 'local', 'google', 'facebook'
  password: {              // Optional for OAuth users
    type: String,
    required: function() {
      return !this.googleId && !this.facebookId;
    }
  }
}
```

## 🎨 Frontend Components

### Login Component Features:
- OAuth buttons with provider icons
- Automatic token extraction from OAuth callbacks
- Error handling for OAuth failures
- Success messaging
- Loading states

### Dashboard Component Features:
- User profile display
- Authentication status
- Token validation
- Logout functionality

## 🚨 Troubleshooting

### Common Issues:

1. **OAuth Redirect Mismatch**
   - Ensure redirect URIs in OAuth apps match exactly
   - Check `http://` vs `https://`

2. **CORS Issues**
   - Frontend and backend ports must match OAuth config
   - Update `FRONTEND_URL` in `.env`

3. **Session Errors**
   - Ensure `SESSION_SECRET` is set in `.env`
   - Check MongoDB connection

4. **Token Issues**
   - Verify `JWT_SECRET` is set
   - Check token storage in localStorage

## 🔍 Testing Checklist

- [ ] Google OAuth login works
- [ ] Facebook OAuth login works  
- [ ] JWT tokens generated correctly
- [ ] User data stored in MongoDB
- [ ] Dashboard shows user info
- [ ] Logout functionality works
- [ ] Error handling works
- [ ] Account linking works (OAuth + existing email)

## 🎉 You're All Set!

Your MERN stack application now has full OAuth integration with Google and Facebook! Users can sign in with their social accounts and receive secure JWT tokens for authenticated API access.

**Next Steps:**
- Set up production OAuth apps with production URLs
- Configure HTTPS for production deployment
- Add more OAuth providers if needed (GitHub, Twitter, etc.)
- Implement refresh token functionality for longer sessions