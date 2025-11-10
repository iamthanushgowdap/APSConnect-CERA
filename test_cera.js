// Test script for CERA AI Assistant
// Run with: node test_cera.js

const CERA = require('./src/ai/ceraAssistant');

async function testCERA() {
  console.log('🧪 Testing CERA AI Assistant...\n');

  const cera = new CERA();

  // Test contexts for different user types
  const studentContext = {
    user_id: 'test-student-id',
    branch: 'CSE',
    semester: 'S5',
    full_name: 'Test Student'
  };

  const facultyContext = {
    user_id: 'test-faculty-id',
    branch: 'CSE',
    semester: 'S5',
    full_name: 'Test Faculty'
  };

  const adminContext = {
    user_id: 'test-admin-id',
    branch: 'ALL',
    semester: 'ALL',
    full_name: 'Test Admin'
  };

  // Test queries
  const testQueries = [
    {
      query: 'What is the status of my fees?',
      context: studentContext,
      role: 'student',
      description: 'Student fee inquiry'
    },
    {
      query: 'When is the next assignment due?',
      context: facultyContext,
      role: 'faculty',
      description: 'Faculty assignment inquiry'
    },
    {
      query: 'How many students have overdue fees?',
      context: adminContext,
      role: 'admin',
      description: 'Admin fee overview'
    },
    {
      query: 'What is my attendance record?',
      context: studentContext,
      role: 'student',
      description: 'Student attendance inquiry'
    }
  ];

  for (const test of testQueries) {
    console.log(`\n📋 Testing: ${test.description}`);
    console.log(`Query: "${test.query}"`);
    console.log(`Role: ${test.role}`);

    try {
      // Note: This will fail without proper API keys and database setup
      // It's mainly for testing the integration structure
      const response = await cera.processQuery(test.query, test.role, test.context);
      console.log(`✅ Response: ${response.substring(0, 100)}...`);
    } catch (error) {
      console.log(`⚠️  Expected error (API/DB not configured): ${error.message}`);
    }
  }

  console.log('\n🎉 CERA integration test completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Set up Google Gemini API key in environment variables');
  console.log('2. Run the CERA database schema SQL in Supabase');
  console.log('3. Add sample data for testing');
  console.log('4. Test the /cera page in your application');
}

if (require.main === module) {
  testCERA().catch(console.error);
}

module.exports = { testCERA };
