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

async function showCompilerErrors() {
  console.log('🚨 COMPILER ERROR DEMONSTRATION 🚨');
  console.log('=====================================\n');
  
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
  
  // Test specific compiler errors
  const errorExamples = [
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
    console.log(a + b) // Missing semicolon!
    rl.close();
  }
});
`,
      description: 'Missing semicolon after console.log'
    },
    {
      title: 'Python Syntax Error',
      language: 'python',
      code: `
# Python code with syntax error
a = int(input())
b = int(input())
if a > b  # Missing colon!
    print(a)
else
    print(b)
`,
      description: 'Missing colon after if statement'
    },
    {
      title: 'C++ Compilation Error',
      language: 'cpp',
      code: `
// C++ code with missing include
int main() {
    int a, b;
    cin >> a >> b;  // cin not defined!
    cout << a + b << endl;  // cout not defined!
    return 0;
}
`,
      description: 'Missing #include <iostream>'
    }
  ];
  
  // Test each error case and show the results
  for (let i = 0; i < errorExamples.length; i++) {
    const example = errorExamples[i];
    console.log(`\n${i + 3}. Testing: ${example.title}`);
    console.log(`   Description: ${example.description}`);
    console.log('   ┌─────────────────────────────────────────────────────────┐');
    console.log('   │                     CODE WITH ERROR                     │');
    console.log('   ├─────────────────────────────────────────────────────────┤');
    console.log('   │ ' + example.code.split('\n').join('\n   │ ') + ' │');
    console.log('   └─────────────────────────────────────────────────────────┘');
    
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
      code: example.code,
      language: example.language
    });
    
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
    }
    
    console.log('\n   ' + '─'.repeat(60));
  }
  
  console.log('\n🎯 SUMMARY:');
  console.log('   The enhanced error display system now shows:');
  console.log('   • 🚨 Prominent error messages with clear visual indicators');
  console.log('   • 📝 Detailed compiler error information');
  console.log('   • 💡 Contextual troubleshooting tips');
  console.log('   • 🎨 Color-coded error types');
  console.log('   • 📋 Expandable/collapsible error details');
  console.log('   • 🧹 Cleaned up error messages (no file paths)');
  
  console.log('\n🔧 To see these errors in the actual UI:');
  console.log('   1. Open your browser and go to the problem page');
  console.log('   2. Copy one of the error codes above');
  console.log('   3. Paste it in the code editor');
  console.log('   4. Click "Test Code" or "Run Code"');
  console.log('   5. See the beautiful error display in action!');
}

showCompilerErrors().then(() => {
  console.log('\n🏁 Compiler error demonstration complete!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Demonstration failed:', error);
  process.exit(1);
}); 