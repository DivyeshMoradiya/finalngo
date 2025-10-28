// MongoDB initialization script
db = db.getSiblingDB('hopenest');

// Create application user
db.createUser({
  user: 'hopenest_user',
  pwd: process.env.MONGO_USER_PASSWORD || 'hopenest_password_change_in_production',
  roles: [
    {
      role: 'readWrite',
      db: 'hopenest'
    }
  ]
});

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.campaigns.createIndex({ status: 1 });
db.campaigns.createIndex({ createdAt: -1 });
db.donations.createIndex({ userId: 1 });
db.donations.createIndex({ campaignId: 1 });
db.volunteers.createIndex({ userId: 1 });

print('Database initialized successfully');