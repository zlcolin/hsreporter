// Simple test script to verify the new API endpoints
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

async function testAPI() {
  console.log('Testing new API endpoints...\n');
  
  try {
    // Test health check
    console.log('1. Testing health check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✓ Health check:', healthResponse.data.data.status);
    
    // Test captcha generation
    console.log('\n2. Testing captcha generation...');
    const captchaResponse = await axios.get(`${BASE_URL}/captcha/generate`);
    console.log('✓ Captcha generated:', captchaResponse.data.success);
    
    // Test feedback submission with invalid data (should fail validation)
    console.log('\n3. Testing feedback validation...');
    try {
      await axios.post(`${BASE_URL}/feedback`, {
        type: 'invalid',
        description: 'short'
      });
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✓ Validation working:', error.response.data.error.code);
      } else {
        throw error;
      }
    }
    
    console.log('\n✅ All tests passed! New API structure is working.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run tests if server is running
testAPI();