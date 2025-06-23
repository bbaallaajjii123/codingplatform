const mongoose = require('mongoose');
const User = require('./server/models/User');

mongoose.connect('mongodb://localhost:27017/programming-platform', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

User.deleteOne({ username: 'sampleteacher' })
  .then(result => {
    if (result.deletedCount > 0) {
      console.log('sampleteacher user deleted.');
    } else {
      console.log('sampleteacher user not found.');
    }
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('Error deleting sampleteacher:', err.message);
    mongoose.disconnect();
  }); 