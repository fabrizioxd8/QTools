// Simple test to verify API is working
const API_URL = 'https://localhost:3000/api';

async function testAPI() {
  try {
    console.log('Testing API connection...');
    
    // Test health endpoint
    const healthResponse = await fetch(`${API_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      console.log('✅ Health check:', health);
    } else {
      console.log('❌ Health check failed:', healthResponse.status);
    }
    
    // Test tools endpoint
    const toolsResponse = await fetch(`${API_URL}/tools`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (toolsResponse.ok) {
      const tools = await toolsResponse.json();
      console.log('✅ Tools loaded:', tools.length, 'tools found');
    } else {
      console.log('❌ Tools fetch failed:', toolsResponse.status);
    }
    
    // Test creating a tool
    const testTool = {
      name: 'Test Tool',
      category: 'Electrical',
      status: 'Available',
      isCalibrable: false,
      customAttributes: { brand: 'Test Brand', model: 'Test Model' }
    };
    
    console.log('Testing tool creation...');
    const createResponse = await fetch(`${API_URL}/tools`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...testTool,
        customAttributes: JSON.stringify(testTool.customAttributes)
      })
    });
    
    if (createResponse.ok) {
      const newTool = await createResponse.json();
      console.log('✅ Tool created successfully:', newTool.name);
    } else {
      const error = await createResponse.text();
      console.log('❌ Tool creation failed:', createResponse.status, error);
    }
    
  } catch (error) {
    console.log('❌ API test failed:', error.message);
    console.log('Make sure the server is running on port 3000');
  }
}

testAPI();