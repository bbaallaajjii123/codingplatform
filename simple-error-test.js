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

async function testSimpleError() {
  console.log('🚨 SIMPLE COMPILER ERROR TEST 🚨');
  console.log('================================\n');
  
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
  console.log('✅ Teacher logged in successfully\n');
  
  // Get a problem to test with
  console.log('2. Getting a problem to test with...');
  const problemsRes = await makeRequest({
    hostname: 'localhost',
    port: 5051,
    path: '/api/problems?limit=1',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${teacherToken}`
    }
  });
  
  if (problemsRes.status !== 200 || !problemsRes.data.problems || problemsRes.data.problems.length === 0) {
    console.log('❌ Failed to get problems:', problemsRes.data);
    return;
  }
  
  const problem = problemsRes.data.problems[0];
  console.log(`✅ Using problem: ${problem.title}\n`);
  
  // Test with JavaScript code that has a syntax error
  const errorCode = `
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let lines = [];
rl.on('line', (line) => {
  lines.push(line);
  if (lines.length === 2) {
    const a = parseInt(lines[0]);
    const b = parseInt(lines[1]);
    console.log(a + b) // Missing semicolon!
    rl.close();
  }
});
`;
  
  console.log('3. Testing JavaScript code with syntax error...');
  console.log('   Code:');
  console.log('   ' + errorCode.split('\n').slice(1, 3).join('\n   ') + '...');
  console.log('   (Missing semicolon after console.log)');
  
  const testRes = await makeRequest({
    hostname: 'localhost',
    port: 5051,
    path: `/api/submissions/test`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${teacherToken}`
    }
  }, {
    problemId: problem.id,
    code: errorCode,
    language: 'javascript'
  });
  
  console.log(`\n   API Response Status: ${testRes.status}`);
  console.log('   API Response Data:', JSON.stringify(testRes.data, null, 2));
  
  if (testRes.status === 200 && testRes.data.testCaseResults && testRes.data.testCaseResults.length > 0) {
    const firstResult = testRes.data.testCaseResults[0];
    if (firstResult.error) {
      console.log('\n   🚨 COMPILER ERROR DETECTED:');
      console.log('   ┌─────────────────────────────────────────────────────────┐');
      console.log('   │                  ERROR MESSAGE                          │');
      console.log('   ├─────────────────────────────────────────────────────────┤');
      console.log('   │ ' + firstResult.error.split('\n').join('\n   │ ') + ' │');
      console.log('   └─────────────────────────────────────────────────────────┘');
      
      console.log('\n   💡 In the UI, this error will be displayed as:');
      console.log('      ┌─────────────────────────────────────────────────────┐');
      console.log('      │ 🚨 Compiler/Runtime Error:                          │');
      console.log('      │                                                     │');
      console.log('      │ [Error message in red text with monospace font]     │');
      console.log('      │                                                     │');
      console.log('      │ 💡 Tip: Check your syntax, variable names, and      │');
      console.log('      │     make sure all required functions are defined.   │');
      console.log('      └─────────────────────────────────────────────────────┘');
    } else {
      console.log('\n   ✅ No errors detected (unexpected)');
    }
  } else {
    console.log('\n   ❌ Test failed or no results');
    console.log('   This might be because:');
    console.log('   - The test endpoint is not working properly');
    console.log('   - The code execution system is not running');
    console.log('   - There are issues with the Docker containers');
  }
  
  console.log('\n🎯 To see compiler errors in the UI:');
  console.log('   1. Open your browser and go to: http://localhost:3051');
  console.log('   2. Navigate to a problem page');
  console.log('   3. Enter this JavaScript code with the syntax error:');
  console.log('      const a = 5');
  console.log('      const b = 3');
  console.log('      console.log(a + b) // Missing semicolon!');
  console.log('   4. Click "Test Code" or "Run Code"');
  console.log('   5. See the enhanced error display in action!');
}

testSimpleError().then(() => {
  console.log('\n🏁 Simple error test complete!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test failed:', error);
  process.exit(1);
}); 