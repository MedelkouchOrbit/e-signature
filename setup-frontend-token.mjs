import fetch from 'node-fetch';

console.log('🔧 Setting up working session token for your frontend...\n');

async function setupFrontendToken() {
  try {
    // Get a fresh admin session token
    console.log('🔐 Getting fresh admin session token...');
    const loginResponse = await fetch('http://94.249.71.89:9000/1/login', {
      method: 'POST',
      headers: {
        'X-Parse-Application-Id': 'opensign',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin@admin.com',
        password: 'admin@123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    const sessionToken = loginData.sessionToken;
    
    console.log(`✅ Fresh admin token obtained: ${sessionToken}`);

    // Test the token works
    console.log('\n🧪 Testing token validity...');
    const testResponse = await fetch('http://94.249.71.89:9000/1/functions/getteams', {
      method: 'POST',
      headers: {
        'X-Parse-Application-Id': 'opensign',
        'X-Parse-Session-Token': sessionToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ active: true })
    });

    if (testResponse.ok) {
      const testData = await testResponse.json();
      console.log(`✅ Token works! Found ${testData.result?.length || 0} teams`);
      
      console.log('\n🔧 Frontend Setup Instructions:');
      console.log('1. Open your browser Developer Tools (F12)');
      console.log('2. Go to Console tab');
      console.log('3. Run this command:');
      console.log(`   localStorage.setItem('opensign_session_token', '${sessionToken}')`);
      console.log('4. Refresh the page (F5)');
      console.log('\n✅ Your teams page should now load successfully!');
      
      // Also create a simple HTML file to set the token
      const htmlScript = `
<!DOCTYPE html>
<html>
<head>
    <title>Set OpenSign Session Token</title>
</head>
<body>
    <h1>OpenSign Session Token Setup</h1>
    <p>Click the button below to set the working session token:</p>
    <button onclick="setToken()">Set Working Token</button>
    <div id="status"></div>
    
    <script>
    function setToken() {
        localStorage.setItem('opensign_session_token', '${sessionToken}');
        document.getElementById('status').innerHTML = '<p style="color: green;">✅ Token set successfully! You can now close this page and refresh your app.</p>';
        
        // Optionally redirect to the team page
        setTimeout(() => {
            window.location.href = 'http://localhost:3000/en/team';
        }, 2000);
    }
    </script>
</body>
</html>`;

      // Write the HTML file
      const fs = await import('fs');
      fs.writeFileSync('/Users/medelkouch/Projects/orbit/e-signature/set-token.html', htmlScript);
      console.log('\n📄 Created set-token.html file for easy token setup');
      console.log('   Open: http://localhost:3000/set-token.html');
      
    } else {
      const errorData = await testResponse.json();
      console.log('❌ Token test failed:', errorData);
    }

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

setupFrontendToken();
