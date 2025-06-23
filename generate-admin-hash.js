// Simple bcrypt hash generator for admin password
const bcrypt = require('bcryptjs');

async function generateHash() {
  try {
    // Change this to your desired admin password
    const password = 'admin123';
    
    const hash = await bcrypt.hash(password, 12);
    
    console.log('=== ADMIN PASSWORD HASH ===');
    console.log('Password:', password);
    console.log('Bcrypt Hash:', hash);
    console.log('\n=== MONGODB COMMAND ===');
    console.log(`db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { password: "${hash}" } }
)`);
    console.log('\n=== OR CREATE NEW ADMIN ===');
    console.log(`db.users.insertOne({
  username: "admin",
  email: "admin@example.com", 
  password: "${hash}",
  firstName: "Admin",
  lastName: "User",
  role: "admin",
  isActive: true,
  points: 0,
  rank: "Beginner",
  solvedProblems: [],
  achievements: [],
  preferences: {
    theme: "light",
    language: "javascript",
    notifications: true
  }
})`);
    
    console.log('\n=== DELETE EXISTING ADMIN ===');
    console.log(`db.users.deleteOne({ email: "admin@example.com" })`);
    
  } catch (error) {
    console.error('Error generating hash:', error);
  }
}

generateHash(); 