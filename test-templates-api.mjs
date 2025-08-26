import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:3000/api/proxy/opensign';

// Test the updated templates API
async function testTemplatesAPI() {
  console.log('Testing Templates API...\n');

  try {
    // Get session token from browser storage (you'll need to update this)
    const sessionToken = 'r:fa85df0cfcdec34b5c0db2b44a0bb1da'; // Update this with your actual token
    
    console.log('1. Testing getReport for templates...');
    const templatesResponse = await fetch(`${API_BASE_URL}/functions/getReport`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': 'opensign',
        'sessiontoken': sessionToken,
      },
      body: JSON.stringify({
        reportId: '6TeaPr321t', // Templates report ID
        limit: 10,
        skip: 0,
        searchTerm: ''
      })
    });

    const templatesData = await templatesResponse.json();
    console.log('Templates Response Status:', templatesResponse.status);
    console.log('Templates Response:', JSON.stringify(templatesData, null, 2));

    if (templatesData.result && templatesData.result.length > 0) {
      console.log('\n2. Testing GetTemplate for single template...');
      const templateId = templatesData.result[0].objectId;
      
      const singleTemplateResponse = await fetch(`${API_BASE_URL}/functions/GetTemplate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Parse-Application-Id': 'opensign',
          'sessiontoken': sessionToken,
        },
        body: JSON.stringify({
          templateId: templateId
        })
      });

      const singleTemplateData = await singleTemplateResponse.json();
      console.log('Single Template Response Status:', singleTemplateResponse.status);
      console.log('Single Template Response:', JSON.stringify(singleTemplateData, null, 2));
    }

  } catch (error) {
    console.error('Error testing Templates API:', error);
  }
}

testTemplatesAPI();
