const fetch = require('node-fetch');

async function fixGroupPermissions() {
  const SUPABASE_URL = 'https://drbeyzugnvhheyimbqxn.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyYmV5enVnbnZoaGV5aW1icXhuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODQ5MTA0NiwiZXhwIjoyMDc0MDY3MDQ2fQ.fC0D4oCoWeLuWA2Dvu1DC3ISmyEalL-nMit6GqLhR3c';

  try {
    console.log('🔧 FIXING GROUP PERMISSIONS...\n');

    // 1. Get all users with their roles
    const usersRes = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?select=id,role,full_name,email`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const users = await usersRes.json();

    // Separate users by role
    const admins = users.filter(u => u.role === 'admin');
    const faculty = users.filter(u => u.role === 'faculty');
    const students = users.filter(u => u.role === 'student');

    console.log(`👥 Found: ${admins.length} admins, ${faculty.length} faculty, ${students.length} students`);

    // 2. Get all groups
    const groupsRes = await fetch(`${SUPABASE_URL}/rest/v1/groups?select=id,name,type`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const groups = await groupsRes.json();
    const officialGroups = groups.filter(g => g.type === 'official');
    const studentGroups = groups.filter(g => g.type === 'student');

    console.log(`📋 Found: ${officialGroups.length} official groups, ${studentGroups.length} student groups`);

    // 3. Fix permissions

    // Official groups: Keep admins and faculty (can_post=true), students (can_post=false)
    console.log('\n📝 OFFICIAL GROUPS - Ensuring correct permissions...');
    for (const group of officialGroups) {
      console.log(`\n🏛️ Processing ${group.name}...`);

      // Ensure admins can post
      for (const admin of admins) {
        await updateMembership(group.id, admin.id, true);
      }

      // Ensure faculty can post
      for (const fac of faculty) {
        await updateMembership(group.id, fac.id, true);
      }

      // Ensure students cannot post
      for (const student of students) {
        await updateMembership(group.id, student.id, false);
      }
    }

    // Student groups: Remove faculty and admin access, keep only students
    console.log('\n📝 STUDENT GROUPS - Removing faculty/admin access...');
    for (const group of studentGroups) {
      console.log(`\n👥 Processing ${group.name}...`);

      // Remove admin access
      for (const admin of admins) {
        await removeMembership(group.id, admin.id);
      }

      // Remove faculty access
      for (const fac of faculty) {
        await removeMembership(group.id, fac.id);
      }

      // Ensure students can post (and have access)
      for (const student of students) {
        await updateMembership(group.id, student.id, true);
      }
    }

    console.log('\n✅ GROUP PERMISSIONS FIXED!');
    console.log('\n🎯 NEW PERMISSIONS:');
    console.log('🏛️ OFFICIAL GROUPS:');
    console.log('   • Admins: ✅ Can post');
    console.log('   • Faculty: ✅ Can post');
    console.log('   • Students: ❌ Read-only');
    console.log('👥 STUDENT GROUPS:');
    console.log('   • Students: ✅ Can post');
    console.log('   • Faculty: ❌ No access');
    console.log('   • Admins: ❌ No access');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function updateMembership(groupId, userId, canPost) {
  const SUPABASE_URL = 'https://drbeyzugnvhheyimbqxn.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyYmV5enVnbnZoaGV5aW1icXhuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODQ5MTA0NiwiZXhwIjoyMDc0MDY3MDQ2fQ.fC0D4oCoWeLuWA2Dvu1DC3ISmyEalL-nMit6GqLhR3c';

  try {
    // First check if membership exists
    const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/group_members?group_id=eq.${groupId}&user_id=eq.${userId}`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      }
    });

    const existing = await checkRes.json();

    if (existing && existing.length > 0) {
      // Update existing membership
      const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/group_members?group_id=eq.${groupId}&user_id=eq.${userId}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ can_post: canPost })
      });

      if (updateRes.ok) {
        console.log(`   ✅ Updated membership for user ${userId}: can_post=${canPost}`);
      } else {
        console.log(`   ❌ Failed to update membership for user ${userId}`);
      }
    } else {
      // Create new membership
      const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/group_members`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          group_id: groupId,
          user_id: userId,
          can_post: canPost
        })
      });

      if (insertRes.ok) {
        console.log(`   ✅ Created membership for user ${userId}: can_post=${canPost}`);
      } else {
        console.log(`   ❌ Failed to create membership for user ${userId}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Error updating membership for user ${userId}:`, error.message);
  }
}

async function removeMembership(groupId, userId) {
  const SUPABASE_URL = 'https://drbeyzugnvhheyimbqxn.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyYmV5enVnbnZoaGV5aW1icXhuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODQ5MTA0NiwiZXhwIjoyMDc0MDY3MDQ2fQ.fC0D4oCoWeLuWA2Dvu1DC3ISmyEalL-nMit6GqLhR3c';

  try {
    const deleteRes = await fetch(`${SUPABASE_URL}/rest/v1/group_members?group_id=eq.${groupId}&user_id=eq.${userId}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=minimal'
      }
    });

    if (deleteRes.ok) {
      console.log(`   🗑️ Removed membership for user ${userId}`);
    } else {
      console.log(`   ⚠️ No membership found or failed to remove for user ${userId}`);
    }
  } catch (error) {
    console.log(`   ❌ Error removing membership for user ${userId}:`, error.message);
  }
}

fixGroupPermissions();
