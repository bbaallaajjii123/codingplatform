// Run this script with: node hash-password.js
// Make sure bcryptjs is installed: npm install bcryptjs

const bcrypt = require('bcryptjs');

const password = 'admin123'; // Change this to your desired password

bcrypt.hash(password, 12)
  .then(hash => {
    console.log('Password:', password);
    console.log('Hash:', hash);
    console.log('\nUse this hash in your MongoDB command:');
    console.log(`db.users.updateOne({ email: "admin@example.com" }, { $set: { password: "${hash}" } })`);
  })
  .catch(err => console.error('Error:', err)); 