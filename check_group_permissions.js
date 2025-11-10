const fetch = require('node-fetch');

async function checkGroupPermissions() {
  const SUPABASE_URL = 'https://drbeyzugnvhheyimbqxn.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyYmV5enVnbnZoaGV5aW1icXhuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODQ5MTA0NiwiZXhwIjoyMDc0MDY3MDQ2fQ.fC0D4oCoWeLuWA2Dvu1DC3ISmyEalL-nMit6GqLhR3c';

  try {
    console.log('🔍 CHECKING GROUP MEMBERSHIPS & PERMISSIONS...\n');

    // 1. Get all groups
    const groupsRes = await fetch(`${SUPABASE_URL}/rest/v1/groups?select=id,name,type,branch,semester`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const groups = await groupsRes.json();
    console.log('📋 ALL GROUPS:');
    groups.forEach(group => {
      console.log(`  ${group.type.toUpperCase()}: ${group.name} (ID: ${group.id})`);
    });

    console.log('\n👥 GROUP MEMBERSHIPS:');
    // 2. Get all group memberships
    const membershipsRes = await fetch(`${SUPABASE_URL}/rest/v1/group_members?select=group_id,user_id,can_post`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const memberships = await membershipsRes.json();
    console.log('Raw memberships response:', memberships);

    // 3. Get all users
    const usersRes = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?select=id,role,full_name,email`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const users = await usersRes.json();
    console.log('Raw users response:', users);

    // Create user lookup map
    const userMap = {};
    if (Array.isArray(users)) {
      users.forEach(user => {
        userMap[user.id] = user;
      });
    }

    // Group memberships by group
    const groupedMemberships = {};
    if (Array.isArray(memberships)) {
      memberships.forEach(m => {
        if (!groupedMemberships[m.group_id]) {
          groupedMemberships[m.group_id] = [];
        }
        groupedMemberships[m.group_id].push(m);
      });
    } else {
      console.log('Memberships is not an array:', memberships);
      return;
    }

    // Display by group
    groups.forEach(group => {
      const groupMembers = groupedMemberships[group.id] || [];
      console.log(`\n📝 ${group.name} (${group.type}):`);
      console.log(`   Members: ${groupMembers.length}`);

      groupMembers.forEach(member => {
        const user = userMap[member.user_id];
        if (user) {
          console.log(`   • ${user.full_name || user.email} (${user.role}) - Can Post: ${member.can_post ? '✅' : '❌'}`);
        } else {
          console.log(`   • Unknown User (${member.user_id}) - Can Post: ${member.can_post ? '✅' : '❌'}`);
        }
      });
    });

    console.log('\n🎯 OFFICIAL GROUP PERMISSIONS SUMMARY:');
    const officialGroups = groups.filter(g => g.type === 'official');
    officialGroups.forEach(group => {
      const members = groupedMemberships[group.id] || [];
      const studentsCanPost = members.filter(m => {
        const user = userMap[m.user_id];
        return user && user.role === 'student' && m.can_post;
      }).length;
      const totalStudents = members.filter(m => {
        const user = userMap[m.user_id];
        return user && user.role === 'student';
      }).length;

      console.log(`${group.name}:`);
      console.log(`  Students who can post: ${studentsCanPost}/${totalStudents}`);
      if (totalStudents > 0 && studentsCanPost === 0) {
        console.log(`  ⚠️  PROBLEM: No students can post in this official group!`);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkGroupPermissions();
