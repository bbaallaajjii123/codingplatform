const bcrypt = require('bcryptjs');

// Change this to your desired admin password
const password = 'admin123';

bcrypt.hash(password, 12)
  .then(hash => {
    console.log('Password:', password);
    console.log('Bcrypt Hash:', hash);
    console.log('\nCopy the hash above and use it in your MongoDB update command.');
  })
  .catch(err => {
    console.error('Error generating hash:', err);
  }); 