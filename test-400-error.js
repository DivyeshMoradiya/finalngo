// Test script to reproduce and debug 400 errors
const test400Error = async () => {
  try {
    console.log('Testing API endpoints for 400 errors...');
    
    // Test 1: Login with missing email
    console.log('\n1. Testing login with missing email');
    const missingEmailResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        password: 'testpassword'
        // Missing email field
      })
    });
    console.log(`Status: ${missingEmailResponse.status}`);
    console.log(`Status Text: ${missingEmailResponse.statusText}`);
    if (!missingEmailResponse.ok) {
      const errorData = await missingEmailResponse.json();
      console.log('Error response:', errorData);
    }
    
    // Test 2: Login with missing password
    console.log('\n2. Testing login with missing password');
    const missingPasswordResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com'
        // Missing password field
      })
    });
    console.log(`Status: ${missingPasswordResponse.status}`);
    console.log(`Status Text: ${missingPasswordResponse.statusText}`);
    if (!missingPasswordResponse.ok) {
      const errorData = await missingPasswordResponse.json();
      console.log('Error response:', errorData);
    }
    
    // Test 3: Signup with missing fields
    console.log('\n3. Testing signup with missing fields');
    const missingFieldsResponse = await fetch('http://localhost:5000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com'
        // Missing name and password fields
      })
    });
    console.log(`Status: ${missingFieldsResponse.status}`);
    console.log(`Status Text: ${missingFieldsResponse.statusText}`);
    if (!missingFieldsResponse.ok) {
      const errorData = await missingFieldsResponse.json();
      console.log('Error response:', errorData);
    }
    
    // Test 4: Malformed JSON in request body
    console.log('\n4. Testing malformed JSON in request body');
    const malformedJsonResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: '{ invalid json }'
    });
    console.log(`Status: ${malformedJsonResponse.status}`);
    console.log(`Status Text: ${malformedJsonResponse.statusText}`);
    if (!malformedJsonResponse.ok) {
      try {
        const errorData = await malformedJsonResponse.json();
        console.log('Error response:', errorData);
      } catch (e) {
        console.log('Could not parse error response as JSON');
      }
    }
    
  } catch (error) {
    console.error('Test failed with error:', error);
  }
};

test400Error();