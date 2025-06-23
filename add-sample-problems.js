const http = require('http');

// Admin credentials (ensure this admin exists in your DB)
const admin = {
  email: 'admin@example.com',
  password: 'admin123'
};

const teacher = {
  firstName: 'Sample',
  lastName: 'Teacher',
  username: 'sampleteacher',
  email: 'sample.teacher@example.com',
  password: 'password123'
};

const problems = [
  {
    title: 'Sum of Two Numbers',
    description: 'Given two integers, return their sum.',
    difficulty: 'Easy',
    category: 'Mathematics',
    tags: ['math', 'addition'],
    points: 10,
    timeLimit: 1000,
    memoryLimit: 128,
    testCases: [
      { input: '2 3', expectedOutput: '5', isHidden: false },
      { input: '10 20', expectedOutput: '30', isHidden: true }
    ],
    sampleInput: '2 3',
    sampleOutput: '5',
    constraints: 'Numbers will be between 1 and 1000'
  },
  {
    title: 'Reverse a String',
    description: 'Given a string, return the string reversed.',
    difficulty: 'Easy',
    category: 'String Manipulation',
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
  },
  {
    title: 'Find Maximum',
    description: 'Given a list of integers, return the maximum value.',
    difficulty: 'Medium',
    category: 'Arrays',
    tags: ['array', 'maximum'],
    points: 20,
    timeLimit: 1000,
    memoryLimit: 128,
    testCases: [
      { input: '1 2 3 4 5', expectedOutput: '5', isHidden: false },
      { input: '-1 -2 -3 -4', expectedOutput: '-1', isHidden: true }
    ],
    sampleInput: '1 2 3 4 5',
    sampleOutput: '5',
    constraints: 'Array length will be between 1 and 1000'
  }
];

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

async function addProblems() {
  console.log('=== STARTING SAMPLE PROBLEMS SCRIPT ===');
  process.stdout.write('=== STARTING SAMPLE PROBLEMS SCRIPT ===\n');
  
  try {
    // Step 1: Admin login
    console.log('Step 1: Logging in as admin...');
    process.stdout.write('Step 1: Logging in as admin...\n');
    
    const loginRes = await makeRequest({
      hostname: 'localhost',
      port: 5051,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, admin);

    if (loginRes.status !== 200) {
      console.log('❌ Admin login failed:', loginRes.data);
      process.stdout.write(`❌ Admin login failed: ${JSON.stringify(loginRes.data)}\n`);
      return;
    }
    const adminToken = loginRes.data.token;
    console.log('✅ Admin logged in successfully');
    process.stdout.write('✅ Admin logged in successfully\n');

    // Step 2: Create teacher using admin endpoint
    console.log('Step 2: Creating teacher using admin endpoint...');
    process.stdout.write('Step 2: Creating teacher using admin endpoint...\n');
    
    const teacherRes = await makeRequest({
      hostname: 'localhost',
      port: 5051,
      path: '/api/auth/admin/create-teacher',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, teacher);

    let teacherToken;
    if (teacherRes.status === 201) {
      console.log('✅ Teacher created successfully');
      process.stdout.write('✅ Teacher created successfully\n');
      // Now login as teacher to get token
      const teacherLoginRes = await makeRequest({
        hostname: 'localhost',
        port: 5051,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, { email: teacher.email, password: teacher.password });
      if (teacherLoginRes.status === 200) {
        teacherToken = teacherLoginRes.data.token;
        console.log('✅ Teacher logged in successfully');
        process.stdout.write('✅ Teacher logged in successfully\n');
      } else {
        console.log('❌ Teacher login failed:', teacherLoginRes.data);
        process.stdout.write(`❌ Teacher login failed: ${JSON.stringify(teacherLoginRes.data)}\n`);
        return;
      }
    } else if (teacherRes.status === 400 && teacherRes.data.error && teacherRes.data.error.includes('already exists')) {
      // Teacher already exists, just login
      console.log('ℹ️ Teacher already exists, logging in...');
      process.stdout.write('ℹ️ Teacher already exists, logging in...\n');
      const teacherLoginRes = await makeRequest({
        hostname: 'localhost',
        port: 5051,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, { email: teacher.email, password: teacher.password });
      if (teacherLoginRes.status === 200) {
        teacherToken = teacherLoginRes.data.token;
        console.log('✅ Teacher logged in successfully');
        process.stdout.write('✅ Teacher logged in successfully\n');
      } else {
        console.log('❌ Teacher login failed:', teacherLoginRes.data);
        process.stdout.write(`❌ Teacher login failed: ${JSON.stringify(teacherLoginRes.data)}\n`);
        return;
      }
    } else {
      console.log('❌ Teacher creation failed:', teacherRes.data);
      process.stdout.write(`❌ Teacher creation failed: ${JSON.stringify(teacherRes.data)}\n`);
      return;
    }

    // Step 3: Add problems as teacher
    console.log('Step 3: Adding sample problems...');
    process.stdout.write('Step 3: Adding sample problems...\n');
    
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < problems.length; i++) {
      const problem = problems[i];
      console.log(`\n--- Problem ${i + 1}: ${problem.title} ---`);
      process.stdout.write(`\n--- Problem ${i + 1}: ${problem.title} ---\n`);
      
      const probRes = await makeRequest({
        hostname: 'localhost',
        port: 5051,
        path: '/api/problems',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${teacherToken}`
        }
      }, problem);
      
      if (probRes.status === 201) {
        successCount++;
        console.log('✅ SUCCESS!');
        console.log('📋 Response:', JSON.stringify(probRes.data, null, 2));
        process.stdout.write('✅ SUCCESS!\n');
        process.stdout.write(`📋 Response: ${JSON.stringify(probRes.data, null, 2)}\n`);
        // If test case status is present, print it
        if (probRes.data.testCaseStatus) {
          console.log('🧪 Test Case Status:', JSON.stringify(probRes.data.testCaseStatus, null, 2));
          process.stdout.write(`🧪 Test Case Status: ${JSON.stringify(probRes.data.testCaseStatus, null, 2)}\n`);
        }
      } else {
        failCount++;
        console.log('❌ FAILED:', probRes.data);
        process.stdout.write(`❌ FAILED: ${JSON.stringify(probRes.data)}\n`);
      }
    }
    
    console.log('\n=== FINAL SUMMARY ===');
    process.stdout.write('\n=== FINAL SUMMARY ===\n');
    console.log(`✅ Successful: ${successCount} problems`);
    console.log(`❌ Failed: ${failCount} problems`);
    console.log(`📊 Total: ${problems.length} problems`);
    process.stdout.write(`✅ Successful: ${successCount} problems\n`);
    process.stdout.write(`❌ Failed: ${failCount} problems\n`);
    process.stdout.write(`📊 Total: ${problems.length} problems\n`);
    
    console.log('\n=== SCRIPT COMPLETED ===');
    process.stdout.write('\n=== SCRIPT COMPLETED ===\n');
    
  } catch (error) {
    console.error('💥 CRITICAL ERROR:', error);
    process.stdout.write(`💥 CRITICAL ERROR: ${error.message}\n`);
  }
}

// Force output flushing and run the script
process.stdout.write('🚀 Starting script execution...\n');
addProblems().then(() => {
  process.stdout.write('🏁 Script finished successfully\n');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Script failed:', error);
  process.stdout.write(`💥 Script failed: ${error.message}\n`);
  process.exit(1);
}); 