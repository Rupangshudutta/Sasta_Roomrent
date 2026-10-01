// Test script to check backend connection and login functionality
const fetch = require('node-fetch');

const API_BASE_URL = 'http://127.0.0.1:3000/api';

async function testConnection() {
    console.log('🔍 Testing backend connection...\n');
    
    try {
        // Test health endpoint
        console.log('1. Testing health endpoint...');
        const healthResponse = await fetch(`${API_BASE_URL}/health`);
        const healthData = await healthResponse.json();
        console.log('✅ Health check:', healthData);
        
        // Test root endpoint (should return 404)
        console.log('\n2. Testing root endpoint...');
        const rootResponse = await fetch('http://127.0.0.1:3000/');
        const rootData = await rootResponse.json();
        console.log('📍 Root endpoint response:', rootData);
        
        // Test login endpoint with invalid credentials
        console.log('\n3. Testing login endpoint...');
        const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'wrongpassword'
            })
        });
        
        const loginData = await loginResponse.json();
        console.log('🔐 Login test response:', loginData);
        console.log('🔐 Login response status:', loginResponse.status);
        
        // Test if we can create a test user
        console.log('\n4. Testing user registration...');
        const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                first_name: 'Test',
                last_name: 'User',
                email: 'testuser@example.com',
                password: 'TestPass123!',
                phone: '9876543210',
                role: 'customer'
            })
        });
        
        const registerData = await registerResponse.json();
        console.log('📝 Registration test response:', registerData);
        console.log('📝 Registration response status:', registerResponse.status);
        
        // If registration successful, try login with the new user
        if (registerResponse.status === 201) {
            console.log('\n5. Testing login with registered user...');
            const loginTestResponse = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: 'testuser@example.com',
                    password: 'TestPass123!'
                })
            });
            
            const loginTestData = await loginTestResponse.json();
            console.log('✅ Login with registered user:', loginTestData);
            console.log('✅ Login response status:', loginTestResponse.status);
        }
        
    } catch (error) {
        console.error('❌ Connection test failed:', error.message);
        console.error('❌ Make sure the backend server is running on port 3000');
    }
}

// Run the test
testConnection();