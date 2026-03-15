// Test to check validation requirements
const fetch = require('node-fetch');

const API_BASE_URL = 'http://127.0.0.1:3000/api';

async function testValidation() {
    console.log('🔍 Testing validation requirements...\n');
    
    // Test with different password formats
    const testUsers = [
        {
            name: 'Simple Password',
            data: {
                first_name: 'Test',
                last_name: 'User1',
                email: 'test1@example.com',
                password: 'TestPass123!',
                phone: '9876543213',
                role: 'customer'
            }
        },
        {
            name: 'Simpler Password',
            data: {
                first_name: 'Test',
                last_name: 'User2',
                email: 'test2@example.com',
                password: 'password123',
                phone: '9876543214',
                role: 'customer'
            }
        },
        {
            name: 'Very Simple Password',
            data: {
                first_name: 'Test',
                last_name: 'User3',
                email: 'test3@example.com',
                password: 'test123',
                phone: '9876543215',
                role: 'customer'
            }
        }
    ];
    
    for (const testUser of testUsers) {
        console.log(`Testing: ${testUser.name}`);
        
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testUser.data)
            });
            
            const data = await response.json();
            console.log(`   Status: ${response.status}`);
            console.log(`   Success: ${data.success}`);
            
            if (!data.success) {
                console.log(`   Error: ${data.message}`);
                if (data.errors) {
                    console.log('   Validation Errors:');
                    data.errors.forEach(error => {
                        console.log(`     - ${error.field}: ${error.message}`);
                    });
                }
            } else {
                console.log(`   ✅ Registration successful!`);
            }
            
        } catch (error) {
            console.log(`   ❌ Request failed: ${error.message}`);
        }
        
        console.log('');
    }
}

testValidation();