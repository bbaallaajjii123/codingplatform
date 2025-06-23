const axios = require('axios');

const API_BASE = 'http://localhost:5051/api';

async function testLogin() {
  console.log('🔍 Testing Login Functionality...\n');

  try {
    // Test 1: Check if server is running
    console.log('1. Testing server health...');
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log('✅ Server is running:', healthResponse.data);
    console.log('');

    // Test 2: Try to register a test user
    console.log('2. Testing user registration...');
    const testUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
    };

    try {
      const registerResponse = await axios.post(`${API_BASE}/auth/register`, testUser);
      console.log('✅ Registration successful:', registerResponse.data.message);
      console.log('User ID:', registerResponse.data.user.id);
      console.log('');
    } catch (registerError) {
      if (registerError.response?.data?.error?.includes('already exists')) {
        console.log('ℹ️  User already exists, continuing with login test...');
        console.log('');
      } else {
        console.log('❌ Registration failed:', registerError.response?.data?.error || registerError.message);
        console.log('');
      }
    }

    // Test 3: Try to login with the test user
    console.log('3. Testing user login...');
    const loginData = {
      email: 'test@example.com',
      password: 'password123'
    };

    try {
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, loginData);
      console.log('✅ Login successful!');
      console.log('Token received:', loginResponse.data.token ? 'Yes' : 'No');
      console.log('User data:', {
        id: loginResponse.data.user.id,
        username: loginResponse.data.user.username,
        email: loginResponse.data.user.email,
        role: loginResponse.data.user.role
      });
      console.log('');
    } catch (loginError) {
      console.log('❌ Login failed:', loginError.response?.data?.error || loginError.message);
      console.log('Status:', loginError.response?.status);
      console.log('');
    }

    // Test 4: Try to login with wrong password
    console.log('4. Testing login with wrong password...');
    const wrongPasswordData = {
      email: 'test@example.com',
      password: 'wrongpassword'
    };

    try {
      await axios.post(`${API_BASE}/auth/login`, wrongPasswordData);
      console.log('❌ Login should have failed with wrong password!');
    } catch (wrongPasswordError) {
      console.log('✅ Correctly rejected wrong password:', wrongPasswordError.response?.data?.error);
      console.log('');
    }

    // Test 5: Try to login with non-existent user
    console.log('5. Testing login with non-existent user...');
    const nonExistentData = {
      email: 'nonexistent@example.com',
      password: 'password123'
    };

    try {
      await axios.post(`${API_BASE}/auth/login`, nonExistentData);
      console.log('❌ Login should have failed with non-existent user!');
    } catch (nonExistentError) {
      console.log('✅ Correctly rejected non-existent user:', nonExistentError.response?.data?.error);
      console.log('');
    }

    // Test 6: Check if admin user exists
    console.log('6. Testing admin login...');
    const adminData = {
      email: 'admin@example.com',
      password: 'admin123'
    };

    try {
      const adminLoginResponse = await axios.post(`${API_BASE}/auth/login`, adminData);
      console.log('✅ Admin login successful!');
      console.log('Admin role:', adminLoginResponse.data.user.role);
      console.log('');
    } catch (adminError) {
      console.log('❌ Admin login failed:', adminError.response?.data?.error || adminError.message);
      console.log('Status:', adminError.response?.status);
      console.log('');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the server is running on port 5051');
    }
  }
}

testLogin(); 