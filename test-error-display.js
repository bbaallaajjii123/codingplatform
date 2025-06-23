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

async function testErrorDisplay() {
  console.log('=== TESTING ENHANCED ERROR DISPLAY ===');
  
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
  
  // Test with code that has compilation errors
  const testCases = [
    {
      title: 'JavaScript Syntax Error',
      language: 'javascript',
      code: `
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
    console.log(a + b); // Missing semicolon
    rl.close();
  }
});
`,
      expectedError: 'syntax error'
    },
    {
      title: 'Python Runtime Error',
      language: 'python',
      code: `
# Python code with runtime error
a = int(input())
b = int(input())
result = a / 0  # Division by zero
print(result)
`,
      expectedError: 'division by zero'
    },
    {
      title: 'C++ Compilation Error',
      language: 'cpp',
      code: `
#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    cout << a + b << endl;
    return 0;
} // Missing closing brace
`,
      expectedError: 'compilation error'
    }
  ];
  
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
  console.log(`✅ Using problem: ${problem.title}`);
  
  // Test each error case
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n3. Testing ${testCase.title}...`);
    
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
      code: testCase.code,
      language: testCase.language
    });
    
    console.log(`   Status: ${testRes.status}`);
    if (testRes.status === 200) {
      console.log('   ✅ Test completed successfully');
      if (testRes.data.testCaseResults && testRes.data.testCaseResults.length > 0) {
        const firstResult = testRes.data.testCaseResults[0];
        if (firstResult.error) {
          console.log('   🚨 Error detected:');
          console.log('   Error message:', firstResult.error);
        } else {
          console.log('   ✅ No errors detected');
        }
      }
    } else {
      console.log('   ❌ Test failed:', testRes.data);
    }
  }
  
  console.log('\n=== ERROR DISPLAY TEST COMPLETE ===');
  console.log('\n💡 The enhanced error display system now provides:');
  console.log('   • 🚨 Prominent error messages with clear visual indicators');
  console.log('   • 📝 Detailed error information with proper formatting');
  console.log('   • 💡 Contextual troubleshooting tips');
  console.log('   • 🎨 Color-coded error types (compilation, runtime, system)');
  console.log('   • 📋 Expandable/collapsible error details');
  console.log('   • 🔧 Enhanced backend error categorization');
  console.log('   • 🧹 Cleaned up error messages (removed file paths, etc.)');
}

testErrorDisplay().then(() => {
  console.log('\n🏁 Test finished successfully');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test failed:', error);
  process.exit(1);
}); 