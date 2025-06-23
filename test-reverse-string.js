const http = require('http');

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (error) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });
    req.on('error', (error) => { reject(error); });
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function testReverseString() {
  console.log('=== TESTING REVERSE STRING PROBLEM ===');
  
  // First login as teacher
  const teacher = {
    email: 'sample.teacher@example.com',
    password: 'password123'
  };
  
  console.log('1. Logging in as teacher...');
  const loginRes = await makeRequest({
    hostname: 'localhost',
    port: 5051,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, teacher);
  
  if (loginRes.status !== 200) {
    console.log('❌ Teacher login failed:', loginRes.data);
    return;
  }
  
  const teacherToken = loginRes.data.token;
  console.log('✅ Teacher logged in successfully');
  
  // Test the Reverse String problem
  const reverseStringProblem = {
    title: 'Reverse a String',
    description: 'Given a string, return the string reversed.',
    difficulty: 'Easy',
    category: 'Strings',
    tags: ['string', 'reverse'],
    points: 15,
    timeLimit: 1000,
    memoryLimit: 128,
    testCases: [
      { input: 'hello', expectedOutput: 'olleh', isHidden: false },
      { input: 'world', expectedOutput: 'dlrow', isHidden: true }
    ],
    sampleInput: 'hello',
    sampleOutput: 'olleh',
    constraints: 'String length will be between 1 and 100'
  };
  
  console.log('2. Testing Reverse String problem...');
  console.log('Problem data:', JSON.stringify(reverseStringProblem, null, 2));
  
  const probRes = await makeRequest({
    hostname: 'localhost',
    port: 5051,
    path: '/api/problems',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${teacherToken}`
    }
  }, reverseStringProblem);
  
  console.log('3. Response status:', probRes.status);
  console.log('4. Response data:', JSON.stringify(probRes.data, null, 2));
  
  if (probRes.status === 201) {
    console.log('✅ SUCCESS!');
  } else {
    console.log('❌ FAILED!');
  }
}

testReverseString().then(() => {
  console.log('=== TEST COMPLETE ===');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test failed:', error);
  process.exit(1);
}); 