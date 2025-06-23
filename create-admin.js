const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('./server/models/User');

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/programming-platform', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists');
      console.log('Email: admin@example.com');
      console.log('Password: admin123');
      console.log('Role: admin');
      return;
    }

    // Create admin user
    const adminUser = new User({
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isActive: true,
      points: 0,
      rank: 'Beginner',
      solvedProblems: [],
      achievements: [],
      preferences: {
        theme: 'light',
        language: 'javascript',
        notifications: true
      }
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    console.log('Role: admin');

  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

createAdmin(); 