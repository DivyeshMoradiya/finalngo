# Database Collections

This document outlines the database collections and their respective schemas used in the project, based on the Mongoose models defined in `backend/models`.

## 1. Users Collection

**Model File:** `backend/models/User.js`

**Description:** Stores information about registered users, including their authentication details and basic profile information.

**Schema:**
```javascript
{
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hashed
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isBlocked: { type: Boolean, default: false },
  avatar: { type: String, default: '' },
  donations: [ // Embedded documents
    {
      campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
      amount: Number,
      date: { type: Date, default: Date.now }
    }
  ],
  resetToken: { type: String },
  resetTokenExpiry: { type: Date },
  createdAt: { type: Date, default: Date.now }
}
```

## 2. Campaigns Collection

**Model File:** `backend/models/Campaign.js`

**Description:** Stores details about crowdfunding campaigns and general campaigns, including their goals, status, and associated organizer.

**Schema:**
```javascript
{
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
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  documents: [{ type: String }], // stored file paths
  rejectionReason: { type: String },
  emailVerified: { type: Boolean, default: false }
}
```

## 3. Donations Collection

**Model File:** `backend/models/Donation.js`

**Description:** Records individual donations made by users to campaigns or as general donations.

**Schema:**
```javascript
{
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
}
```

## 4. Volunteers Collection

**Model File:** `backend/models/Volunteer.js`

**Description:** Stores details of individuals who have registered to volunteer, including their contact information and availability.

**Schema:**
```javascript
{
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
}
```
