const mongoose = require('mongoose');
require('dotenv').config();

async function testSetup() {
  console.log('🔧 Testing setup...');
  
  try {
    // Test MongoDB connection
    console.log('📦 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/programming-platform', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully!');
    
    // Test basic server functionality
    const express = require('express');
    const app = express();
    
    app.get('/test', (req, res) => {
      res.json({ message: 'Server is working!' });
    });
    
    const PORT = process.env.PORT || 5051;
    app.listen(PORT, () => {
      console.log(`✅ Server test successful! Server would run on port ${PORT}`);
      console.log('🎉 Setup is ready!');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Setup test failed:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Make sure MongoDB is installed and running');
    console.log('2. Check your .env file configuration');
    console.log('3. Try using MongoDB Atlas for cloud database');
    process.exit(1);
  }
}

testSetup(); 