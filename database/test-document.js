/**
 * Test script to manually test document initialization
 */

const axios = require('axios');

async function testDocumentInitialization() {
  const baseURL = process.env.REACT_APP_DATABASE_API_URL || 'http://localhost:3001';
  
  console.log('🧪 Testing Document Initialization...');
  
  try {
    // 1. Health check
    console.log('\n1. Health Check...');
    const healthResponse = await axios.get(`${baseURL}/health`);
    console.log('✅ Health:', healthResponse.data);
    
    // 2. Check existing documents
    console.log('\n2. Existing Documents...');
    const docsResponse = await axios.get(`${baseURL}/api/documents`);
    console.log('📋 Documents:', docsResponse.data);
    
    // 3. Test document initialization
    console.log('\n3. Testing Document Initialization...');
    const testData = {
      docId: 'test_doc_' + Date.now(),
      userId: 'test_user',
      modalData: {
        'talep_bilgileri_modal': {
          title: 'Test Talep Bilgileri',
          content: 'Test içerik',
          timestamp: new Date().toISOString()
        },
        'muhasebe_modal': {
          title: 'Test Muhasebe',
          content: 'Test muhasebe içeriği',
          timestamp: new Date().toISOString()
        },
        'case1_modal': {
          title: 'Test Case1',
          content: 'Test case içeriği',
          timestamp: new Date().toISOString()
        }
      }
    };
    
    const initResponse = await axios.post(`${baseURL}/api/initialize-document`, testData);
    console.log('✅ Initialize Response:', initResponse.data);
    
    // 4. Check documents again
    console.log('\n4. Documents After Test...');
    const docsAfterResponse = await axios.get(`${baseURL}/api/documents`);
    console.log('📋 Documents After:', docsAfterResponse.data);
    
    // 5. Get specific document
    console.log('\n5. Get Specific Document...');
    const getDocResponse = await axios.get(`${baseURL}/api/modals/${testData.docId}/${testData.userId}`);
    console.log('📄 Document Data:', getDocResponse.data);
    
  } catch (error) {
    console.error('❌ Test Error:', error.response?.data || error.message);
  }
}

// Run test
testDocumentInitialization();
