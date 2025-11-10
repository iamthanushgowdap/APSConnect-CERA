#!/usr/bin/env node

// Test script to verify CERA implementation
// Run with: node test-cera-implementation.js

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing CERA Implementation...\n');

// Check if files exist
const filesToCheck = [
  'src/app/api/cera/query/route.js',
  'src/components/CERAChat.tsx',
  'create_user_preferences_table.sql',
  'migrate_user_preferences.sql'
];

let allFilesExist = true;

filesToCheck.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} - EXISTS`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

console.log('\n📋 Implementation Status:');

// Check backend features
const backendFile = path.join(__dirname, 'src/app/api/cera/query/route.js');
if (fs.existsSync(backendFile)) {
  const content = fs.readFileSync(backendFile, 'utf8');

  console.log('🔧 Backend Features:');
  console.log(content.includes('getTranslatedText') ? '✅ Multi-language support' : '❌ Multi-language support');
  console.log(content.includes('user_preferences') ? '✅ Supabase integration' : '❌ Supabase integration');
  console.log(content.includes('themes[currentTheme]') ? '✅ Theme persistence' : '❌ Theme persistence');
  console.log(content.includes('try {') && content.includes('} catch') ? '✅ Error handling' : '❌ Error handling');
}

// Check frontend features
const frontendFile = path.join(__dirname, 'src/components/CERAChat.tsx');
if (fs.existsSync(frontendFile)) {
  const content = fs.readFileSync(frontendFile, 'utf8');

  console.log('🎨 Frontend Features:');
  console.log(content.includes('SpeechRecognition') ? '✅ Speech-to-Text' : '❌ Speech-to-Text');
  console.log(content.includes('dangerouslySetInnerHTML') ? '✅ HTML rendering' : '❌ HTML rendering');
  console.log(content.includes('applyTheme') ? '✅ Theme application' : '❌ Theme application');
  console.log(content.includes('loadUserPreferences') ? '✅ Supabase preferences' : '❌ Supabase preferences');
}

// Check database
const dbFile = path.join(__dirname, 'create_user_preferences_table.sql');
if (fs.existsSync(dbFile)) {
  const content = fs.readFileSync(dbFile, 'utf8');

  console.log('🗄️ Database Features:');
  console.log(content.includes('language') ? '✅ Language column' : '❌ Language column');
  console.log(content.includes('voice_enabled') ? '✅ Voice column' : '❌ Voice column');
  console.log(content.includes('ROW LEVEL SECURITY') ? '✅ RLS policies' : '❌ RLS policies');
}

console.log('\n🎯 Quick Test Commands:');
console.log('1. "language kannada" - Should switch to Kannada');
console.log('2. "theme dark" - Should apply dark theme');
console.log('3. Click 🎤 - Should start speech recognition');
console.log('4. "timetable" - Should show formatted table');
console.log('5. "How am I doing?" - Should show analytics');

if (allFilesExist) {
  console.log('\n🎉 IMPLEMENTATION COMPLETE! All files are in place.');
  console.log('Run the migration scripts in Supabase and test the features.');
} else {
  console.log('\n⚠️ Some files are missing. Please check the implementation.');
}
