// Quick test to check CERA configuration
const fetch = require('node-fetch');

async function testCERA() {
  console.log('🧪 Testing CERA configuration...\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/cera/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'timetable',
        userContext: {
          user_id: 'test-user',
          branch: 'CSE',
          semester: '5th Sem'
        }
      })
    });

    const data = await response.json();
    console.log('\n✅ Response received');
    console.log('Success:', data.success);
    
    // Check if response mentions Supabase or Sheets
    if (data.answer && data.answer.includes('Supabase')) {
      console.log('⚠️  Response mentions Supabase - Still using Supabase!');
    } else if (data.answer && data.answer.includes('Sheets')) {
      console.log('✅ Response mentions Sheets - Using Google Sheets!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testCERA();
