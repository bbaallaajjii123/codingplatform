const http = require('http');

function testRegistration() {
  const data = JSON.stringify({
    firstName: 'Test',
    lastName: 'User',
    username: 'testuser123',
    email: 'test123@example.com',
    password: 'password123'
  });

  const options = {
    hostname: 'localhost',
    port: 5051,
    path: '/api/auth/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = http.request(options, (res) => {
    let responseData = '';
    
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Response:', responseData);
    });
  });

  req.on('error', (error) => {
    console.error('Request failed:', error);
  });

  req.write(data);
  req.end();
}

testRegistration(); 