// Test with correct validation format
const fetch = require('node-fetch');

const API_BASE_URL = 'http://127.0.0.1:3000/api';

async function testCorrectFormat() {
    console.log('✅ Testing with correct validation format...\n');
    
    const correctUser = {
        first_name: 'Jane',
        last_name: 'Smith',  // Only letters and spaces
        email: 'jane.smith.correct@example.com',
        password: 'TestPass123!',  // 8+ chars, upper, lower, number, special
        phone: '9876543216',  // 10 digit Indian number starting with 6-9
        role: 'customer'
    };
    
    console.log('Registering user with correct format:');
    console.log('Name:', correctUser.first_name, correctUser.last_name);
    console.log('Email:', correctUser.email);
    console.log('Password:', correctUser.password);
    console.log('Phone:', correctUser.phone);
    console.log('Role:', correctUser.role);
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(correctUser)
        });
        
        const data = await response.json();
        console.log(`\nRegistration Status: ${response.status}`);
        console.log(`Success: ${data.success}`);
        
        if (data.success) {
            console.log('✅ Registration successful!');
            console.log('User ID:', data.data.user.id);
            console.log('User Role:', data.data.user.role);
            console.log('Token generated:', !!data.data.token);
            
            // Test login
            console.log('\n🔐 Testing login with registered user...');
            const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: correctUser.email,
                    password: correctUser.password
                })
            });
            
            const loginData = await loginResponse.json();
            console.log(`Login Status: ${loginResponse.status}`);
            console.log(`Login Success: ${loginData.success}`);
            
            if (loginData.success) {
                console.log('✅ Login successful!');
                console.log('User Role:', loginData.data.user.role);
                console.log('Token generated:', !!loginData.data.token);
            } else {
                console.log('❌ Login failed:', loginData.message);
            }
            
        } else {
            console.log('❌ Registration failed:', data.message);
            if (data.errors) {
                console.log('Validation Errors:');
                data.errors.forEach(error => {
                    console.log(`  - ${error.field}: ${error.message}`);
                });
            }
        }
        
    } catch (error) {
        console.log('❌ Request failed:', error.message);
    }
}

testCorrectFormat();