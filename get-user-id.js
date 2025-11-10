// Get current logged-in user ID
// Run this in browser console on your CERA page

console.log(`
🔍 To find your user ID:

1. Open your CERA app in browser
2. Open Developer Tools (F12)
3. Go to Console tab
4. Paste this code:

// Get user from Supabase session
const getUser = async () => {
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  const supabase = createClient(
    'https://rwdxbiuyghpnenusupmi.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3ZHhiaXV5Z2hwbmVudXN1cG1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NjI5OTQsImV4cCI6MjA3NzEzODk5NH0.GMuqtOn_eUk7_XSFVAsuxMjhS59kWTyenu6gmbicCTM'
  );
  const { data: { user } } = await supabase.auth.getUser();
  console.log('👤 Your User ID:', user?.id);
  console.log('📧 Your Email:', user?.email);
  return user?.id;
};
getUser();

5. Copy the User ID that appears
6. Add rows in your Google Sheets with this user ID

OR check browser localStorage:
localStorage.getItem('sb-rwdxbiuyghpnenusupmi-auth-token')
`);
