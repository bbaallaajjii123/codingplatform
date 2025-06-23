const http = require('http');

// Test data
const testData = {
  // Create a test student
  student: {
    firstName: 'John',
    lastName: 'Student',
    username: 'johnstudent',
    email: 'john.student@example.com',
    password: 'password123'
  },
  // Create a test teacher
  teacher: {
    firstName: 'Sarah',
    lastName: 'Teacher',
    username: 'sarahteacher',
    email: 'sarah.teacher@example.com',
    password: 'password123'
  }
};

let teacherToken = '';
let studentId = '';
let teacherId = '';

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (error) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testTeacherFunctionality() {
  console.log('🧪 Testing Teacher Functionality\n');

  try {
    // Step 1: Register a teacher
    console.log('1. Registering teacher...');
    const teacherData = JSON.stringify(testData.teacher);
    const teacherResponse = await makeRequest({
      hostname: 'localhost',
      port: 5051,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': teacherData.length
      }
    }, testData.teacher);

    if (teacherResponse.status === 201) {
      teacherToken = teacherResponse.data.token;
      teacherId = teacherResponse.data.user.id;
      console.log('✅ Teacher registered successfully');
      console.log(`   Teacher ID: ${teacherId}`);
    } else {
      console.log('❌ Teacher registration failed:', teacherResponse.data);
      return;
    }

    // Step 2: Register a student
    console.log('\n2. Registering student...');
    const studentResponse = await makeRequest({
      hostname: 'localhost',
      port: 5051,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, testData.student);

    if (studentResponse.status === 201) {
      studentId = studentResponse.data.user.id;
      console.log('✅ Student registered successfully');
      console.log(`   Student ID: ${studentId}`);
    } else {
      console.log('❌ Student registration failed:', studentResponse.data);
      return;
    }

    // Step 3: Create a test problem (as teacher)
    console.log('\n3. Creating a test problem...');
    const problemData = {
      title: 'Simple Addition',
      description: 'Write a function that adds two numbers.',
      difficulty: 'Easy',
      category: 'Mathematics',
      tags: ['math', 'addition'],
      points: 10,
      timeLimit: 1000,
      memoryLimit: 128,
      testCases: [
        {
          input: '2 3',
          output: '5',
          isHidden: false
        },
        {
          input: '10 20',
          output: '30',
          isHidden: true
        }
      ],
      sampleInput: '2 3',
      sampleOutput: '5',
      constraints: 'Numbers will be between 1 and 1000'
    };

    const problemResponse = await makeRequest({
      hostname: 'localhost',
      port: 5051,
      path: '/api/problems',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${teacherToken}`
      }
    }, problemData);

    if (problemResponse.status === 201) {
      const problemId = problemResponse.data.problem.id;
      console.log('✅ Problem created successfully');
      console.log(`   Problem ID: ${problemId}`);

      // Step 4: Assign problem to student
      console.log('\n4. Assigning problem to student...');
      const assignmentData = {
        studentId: studentId,
        problemId: problemId,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        notes: 'Please complete this assignment by the due date.'
      };

      const assignmentResponse = await makeRequest({
        hostname: 'localhost',
        port: 5051,
        path: '/api/teacher/assign-problem',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${teacherToken}`
        }
      }, assignmentData);

      if (assignmentResponse.status === 201) {
        console.log('✅ Problem assigned successfully');
        console.log(`   Assignment: ${assignmentResponse.data.assignment.problemTitle} → ${assignmentResponse.data.assignment.studentName}`);
      } else {
        console.log('❌ Problem assignment failed:', assignmentResponse.data);
      }

      // Step 5: Get teacher's students
      console.log('\n5. Getting teacher\'s students...');
      const studentsResponse = await makeRequest({
        hostname: 'localhost',
        port: 5051,
        path: '/api/teacher/students',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${teacherToken}`
        }
      });

      if (studentsResponse.status === 200) {
        console.log('✅ Students retrieved successfully');
        console.log(`   Total students: ${studentsResponse.data.total}`);
        if (studentsResponse.data.students.length > 0) {
          const student = studentsResponse.data.students[0];
          console.log(`   Student: ${student.firstName} ${student.lastName}`);
          console.log(`   Assignment stats: ${student.assignmentStats.completed}/${student.assignmentStats.totalAssigned} completed`);
        }
      } else {
        console.log('❌ Failed to get students:', studentsResponse.data);
      }

    } else {
      console.log('❌ Problem creation failed:', problemResponse.data);
    }

    console.log('\n🎉 Teacher functionality test completed!');
    console.log('\n📋 Summary:');
    console.log(`   Teacher ID: ${teacherId}`);
    console.log(`   Student ID: ${studentId}`);
    console.log(`   Teacher Token: ${teacherToken.substring(0, 20)}...`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testTeacherFunctionality(); 