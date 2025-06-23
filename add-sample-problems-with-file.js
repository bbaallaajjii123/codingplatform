const http = require('http');
const fs = require('fs');

// Create a log file
const logFile = 'script-output.log';
const logStream = fs.createWriteStream(logFile, { flags: 'w' });

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  process.stdout.write(message + '\n');
  logStream.write(logMessage);
}

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
  log('🚀 STARTING SAMPLE PROBLEMS SCRIPT');
  log('📝 Output will be saved to: ' + logFile);
  
  try {
    // Step 1: Admin login
    log('Step 1: Logging in as admin...');
    
    const loginRes = await makeRequest({
      hostname: 'localhost',
      port: 5051,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, admin);

    if (loginRes.status !== 200) {
      log('❌ Admin login failed: ' + JSON.stringify(loginRes.data));
      return;
    }
    const adminToken = loginRes.data.token;
    log('✅ Admin logged in successfully');

    // Step 2: Create teacher using admin endpoint
    log('Step 2: Creating teacher using admin endpoint...');
    
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
      log('✅ Teacher created successfully');
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
        log('✅ Teacher logged in successfully');
      } else {
        log('❌ Teacher login failed: ' + JSON.stringify(teacherLoginRes.data));
        return;
      }
    } else if (teacherRes.status === 400 && teacherRes.data.error && teacherRes.data.error.includes('already exists')) {
      // Teacher already exists, just login
      log('ℹ️ Teacher already exists, logging in...');
      const teacherLoginRes = await makeRequest({
        hostname: 'localhost',
        port: 5051,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, { email: teacher.email, password: teacher.password });
      if (teacherLoginRes.status === 200) {
        teacherToken = teacherLoginRes.data.token;
        log('✅ Teacher logged in successfully');
      } else {
        log('❌ Teacher login failed: ' + JSON.stringify(teacherLoginRes.data));
        return;
      }
    } else {
      log('❌ Teacher creation failed: ' + JSON.stringify(teacherRes.data));
      return;
    }

    // Step 3: Add problems as teacher
    log('Step 3: Adding sample problems...');
    
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < problems.length; i++) {
      const problem = problems[i];
      log(`\n--- Problem ${i + 1}: ${problem.title} ---`);
      
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
        log('✅ SUCCESS!');
        log('📋 Response: ' + JSON.stringify(probRes.data, null, 2));
        // If test case status is present, print it
        if (probRes.data.testCaseStatus) {
          log('🧪 Test Case Status: ' + JSON.stringify(probRes.data.testCaseStatus, null, 2));
        }
      } else {
        failCount++;
        log('❌ FAILED: ' + JSON.stringify(probRes.data));
      }
    }
    
    log('\n=== FINAL SUMMARY ===');
    log(`✅ Successful: ${successCount} problems`);
    log(`❌ Failed: ${failCount} problems`);
    log(`📊 Total: ${problems.length} problems`);
    
    log('\n=== SCRIPT COMPLETED ===');
    
  } catch (error) {
    log('💥 CRITICAL ERROR: ' + error.message);
  } finally {
    logStream.end();
  }
}

// Run the script
log('🚀 Starting script execution...');
addProblems().then(() => {
  log('🏁 Script finished successfully');
  process.exit(0);
}).catch((error) => {
  log('💥 Script failed: ' + error.message);
  process.exit(1);
}); 