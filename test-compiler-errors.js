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

async function testCompilerErrors() {
  console.log('=== TESTING COMPILER ERROR DISPLAY ===');
  console.log('This test will intentionally generate compiler errors to show the enhanced error display system.\n');
  
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
  
  // Test cases with intentional compiler errors
  const errorTestCases = [
    {
      title: 'JavaScript Syntax Error - Missing Semicolon',
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
    console.log(a + b) // Missing semicolon here!
    rl.close();
  }
});
`,
      expectedError: 'syntax error'
    },
    {
      title: 'JavaScript Reference Error - Undefined Variable',
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
    console.log(a + b + undefinedVariable); // Undefined variable!
    rl.close();
  }
});
`,
      expectedError: 'reference error'
    },
    {
      title: 'Python Syntax Error - Missing Colon',
      language: 'python',
      code: `
# Python code with syntax error
a = int(input())
b = int(input())
if a > b  # Missing colon here!
    print(a)
else
    print(b)
`,
      expectedError: 'syntax error'
    },
    {
      title: 'Python Name Error - Undefined Function',
      language: 'python',
      code: `
# Python code with undefined function
a = int(input())
b = int(input())
result = undefined_function(a, b)  # Undefined function!
print(result)
`,
      expectedError: 'name error'
    },
    {
      title: 'C++ Compilation Error - Missing Include',
      language: 'cpp',
      code: `
// C++ code with missing include
int main() {
    int a, b;
    cin >> a >> b;  // cin not defined without iostream
    cout << a + b << endl;  // cout not defined without iostream
    return 0;
}
`,
      expectedError: 'compilation error'
    },
    {
      title: 'C++ Syntax Error - Missing Brace',
      language: 'cpp',
      code: `
#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    cout << a + b << endl;
    return 0;
// Missing closing brace!
`,
      expectedError: 'syntax error'
    },
    {
      title: 'Java Compilation Error - Missing Semicolon',
      language: 'java',
      code: `
import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        int a = scanner.nextInt();
        int b = scanner.nextInt();
        System.out.println(a + b) // Missing semicolon!
        scanner.close();
    }
}
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
  for (let i = 0; i < errorTestCases.length; i++) {
    const testCase = errorTestCases[i];
    console.log(`\n${i + 3}. Testing: ${testCase.title}`);
    console.log('   Code snippet:');
    console.log('   ' + testCase.code.split('\n').slice(1, 3).join('\n   ') + '...');
    
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
          console.log('   🚨 COMPILER ERROR DETECTED:');
          console.log('   ┌─────────────────────────────────────────────────────────┐');
          console.log('   │                    ERROR MESSAGE                       │');
          console.log('   ├─────────────────────────────────────────────────────────┤');
          console.log('   │ ' + firstResult.error.split('\n').join('\n   │ ') + ' │');
          console.log('   └─────────────────────────────────────────────────────────┘');
          console.log('   💡 This error will be displayed prominently in the UI with:');
          console.log('      • Color-coded error type (red for compilation errors)');
          console.log('      • Expandable error details');
          console.log('      • Contextual troubleshooting tips');
          console.log('      • Clean, readable formatting');
        } else {
          console.log('   ✅ No errors detected (unexpected)');
        }
      }
    } else {
      console.log('   ❌ Test failed:', testRes.data);
    }
  }
  
  console.log('\n=== COMPILER ERROR TEST COMPLETE ===');
  console.log('\n🎯 What you should see in the UI:');
  console.log('   • 🚨 Prominent red error boxes with clear error messages');
  console.log('   • 📝 Detailed compiler error information');
  console.log('   • 💡 Helpful troubleshooting tips');
  console.log('   • 📋 Expandable/collapsible error details');
  console.log('   • 🎨 Professional formatting with proper typography');
  console.log('\n🔧 To see these errors in the UI:');
  console.log('   1. Go to a problem page');
  console.log('   2. Enter one of the error codes above');
  console.log('   3. Click "Test Code" or "Run Code"');
  console.log('   4. See the enhanced error display in action!');
}

testCompilerErrors().then(() => {
  console.log('\n🏁 Compiler error test finished successfully');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Compiler error test failed:', error);
  process.exit(1);
}); 