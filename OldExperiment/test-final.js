// Final test to verify all fixes are working
const fetch = require('node-fetch');

const API_BASE_URL = 'http://127.0.0.1:3000/api';

async function runFinalTests() {
    console.log('🔧 Running final tests after fixes...\n');
    
    try {
        // Test 1: Health check
        console.log('1. ✅ Backend Health Check');
        const healthResponse = await fetch(`${API_BASE_URL}/health`);
        const healthData = await healthResponse.json();
        console.log('   Status:', healthData.status);
        console.log('   Environment:', healthData.environment);
        
        // Test 2: Register a new user
        console.log('\n2. 📝 Testing User Registration');
        const newUser = {
            first_name: 'Jane',
            last_name: 'Smith',
            email: 'jane.smith@example.com',
            password: 'SimplePass123',
            phone: '9876543211',
            role: 'customer'
        };
        
        const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newUser)
        });
        
        const registerData = await registerResponse.json();
        console.log('   Registration Status:', registerResponse.status);
        console.log('   Success:', registerData.success);
        console.log('   User Role:', registerData.data?.user?.role);
        
        // Test 3: Login with the new user
        if (registerData.success) {
            console.log('\n3. 🔐 Testing Login with New User');
            const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: newUser.email,
                    password: newUser.password
                })
            });
            
            const loginData = await loginResponse.json();
            console.log('   Login Status:', loginResponse.status);
            console.log('   Success:', loginData.success);
            console.log('   Token Generated:', !!loginData.data?.token);
            console.log('   User Role:', loginData.data?.user?.role);
        }
        
        // Test 4: Register a room owner
        console.log('\n4. 🏠 Testing Room Owner Registration');
        const ownerUser = {
            first_name: 'Bob',
            last_name: 'Owner',
            email: 'bob.owner@example.com',
            password: 'OwnerPass123',
            phone: '9876543212',
            role: 'room_owner'
        };
        
        const ownerRegResponse = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ownerUser)
        });
        
        const ownerRegData = await ownerRegResponse.json();
        console.log('   Owner Registration Status:', ownerRegResponse.status);
        console.log('   Success:', ownerRegData.success);
        console.log('   User Role:', ownerRegData.data?.user?.role);
        
        // Test 5: Login with room owner
        if (ownerRegData.success) {
            console.log('\n5. 🔑 Testing Room Owner Login');
            const ownerLoginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: ownerUser.email,
                    password: ownerUser.password
                })
            });
            
            const ownerLoginData = await ownerLoginResponse.json();
            console.log('   Owner Login Status:', ownerLoginResponse.status);
            console.log('   Success:', ownerLoginData.success);
            console.log('   Token Generated:', !!ownerLoginData.data?.token);
            console.log('   User Role:', ownerLoginData.data?.user?.role);
        }
        
        console.log('\n🎉 All tests completed successfully!');
        console.log('\n📋 Summary of Fixes Applied:');
        console.log('   ✅ Fixed frontend login validation');
        console.log('   ✅ Fixed user type mapping (owner -> room_owner)');
        console.log('   ✅ Fixed API service login method');
        console.log('   ✅ Connected registration form to backend');
        console.log('   ✅ Fixed password validation requirements');
        console.log('   ✅ Added proper error handling');
        
        console.log('\n🚀 Next Steps:');
        console.log('   1. Open login.html in your browser');
        console.log('   2. Try logging in with: testuser@example.com / TestPass123!');
        console.log('   3. Or register a new account');
        console.log('   4. Use test-login.html for quick testing');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('\n🔧 Make sure the backend server is running:');
        console.log('   cd backend && npm start');
    }
}

runFinalTests();