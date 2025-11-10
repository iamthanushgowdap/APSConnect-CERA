#!/usr/bin/env node

/**
 * Groups Population Script
 *
 * This script populates the groups tables with initial data based on existing user profiles.
 * Run this after creating the groups tables and after users have been registered.
 *
 * Usage: node scripts/populate-groups.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function populateGroups() {
  console.log('🚀 Starting groups population...');

  try {
    // Step 1: Create default groups
    console.log('📝 Creating default groups...');

    const defaultGroups = [
      {
        id: 'official_announcements',
        name: 'Official Announcements',
        type: 'official',
        branch: 'ALL',
        semester: 'ALL',
        description: 'Important announcements from faculty and administration'
      },
      {
        id: 'faculty_lounge',
        name: 'Faculty Lounge',
        type: 'official',
        branch: 'ALL',
        semester: 'ALL',
        description: 'Professional discussions and announcements for faculty members'
      },
      {
        id: 'admin_announcements',
        name: 'Admin Announcements',
        type: 'official',
        branch: 'ALL',
        semester: 'ALL',
        description: 'Administrative announcements and system updates'
      }
    ];

    for (const group of defaultGroups) {
      const { error } = await supabase
        .from('groups')
        .upsert(group, { onConflict: 'id' });

      if (error) {
        console.error(`❌ Error creating group ${group.id}:`, error);
      } else {
        console.log(`✅ Created group: ${group.name}`);
      }
    }

    // Step 2: Get all approved users
    console.log('👥 Fetching approved users...');
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, email, role, branch, semester, is_approved')
      .eq('is_approved', true);

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }

    console.log(`📊 Found ${users.length} approved users`);

    // Step 3: Create department and class groups
    const departments = new Set();
    const classGroups = new Set();

    users.forEach(user => {
      if (user.branch) {
        departments.add(user.branch);
        if (user.semester && (user.role === 'student' || user.role === 'faculty')) {
          classGroups.add(`${user.branch}:${user.semester}`);
        }
      }
    });

    // Create department groups
    console.log('🏢 Creating department groups...');
    for (const branch of departments) {
      const group = {
        id: `${branch}_official`,
        name: `${branch} Department`,
        type: 'official',
        branch: branch,
        semester: 'ALL',
        description: `Official communication for ${branch} department`
      };

      const { error } = await supabase
        .from('groups')
        .upsert(group, { onConflict: 'id' });

      if (error) {
        console.error(`❌ Error creating department group for ${branch}:`, error);
      } else {
        console.log(`✅ Created department group: ${group.name}`);
      }
    }

    // Create class groups
    console.log('📚 Creating class groups...');
    for (const classGroup of classGroups) {
      const [branch, semester] = classGroup.split(':');
      const groupId = `${branch}_${semester.replace(/ & /g, '-').replace(/ /g, '-')}_official`;

      const group = {
        id: groupId,
        name: `${branch} - ${semester}`,
        type: 'official',
        branch: branch,
        semester: semester,
        description: `Class-specific announcements for ${branch} ${semester}`
      };

      const { error } = await supabase
        .from('groups')
        .upsert(group, { onConflict: 'id' });

      if (error) {
        console.error(`❌ Error creating class group ${groupId}:`, error);
      } else {
        console.log(`✅ Created class group: ${group.name}`);
      }
    }

    // Create student peer groups
    console.log('👥 Creating student peer groups...');
    const studentClassGroups = new Set();
    users
      .filter(user => user.role === 'student')
      .forEach(user => {
        if (user.branch && user.semester) {
          studentClassGroups.add(`${user.branch}:${user.semester}`);
        }
      });

    for (const classGroup of studentClassGroups) {
      const [branch, semester] = classGroup.split(':');
      const groupId = `${branch}_${semester.replace(/ & /g, '-').replace(/ /g, '-')}_student`;

      const group = {
        id: groupId,
        name: `${branch} ${semester} Students`,
        type: 'student',
        branch: branch,
        semester: semester,
        description: `Peer discussion group for ${branch} ${semester} students`
      };

      const { error } = await supabase
        .from('groups')
        .upsert(group, { onConflict: 'id' });

      if (error) {
        console.error(`❌ Error creating student group ${groupId}:`, error);
      } else {
        console.log(`✅ Created student group: ${group.name}`);
      }
    }

    // Step 4: Assign users to groups
    console.log('🔗 Assigning users to groups...');

    const assignments = [];

    for (const user of users) {
      // All users get official announcements
      assignments.push({
        group_id: 'official_announcements',
        user_id: user.id,
        role: user.role,
        can_post: ['admin', 'faculty'].includes(user.role)
      });

      // Faculty get faculty lounge
      if (user.role === 'faculty') {
        assignments.push({
          group_id: 'faculty_lounge',
          user_id: user.id,
          role: user.role,
          can_post: true
        });
      }

      // Admins get admin announcements
      if (user.role === 'admin') {
        assignments.push({
          group_id: 'admin_announcements',
          user_id: user.id,
          role: user.role,
          can_post: true
        });
      }

      // Department groups
      if (user.branch) {
        assignments.push({
          group_id: `${user.branch}_official`,
          user_id: user.id,
          role: user.role,
          can_post: ['admin', 'faculty'].includes(user.role)
        });

        // Class groups for students and faculty
        if (user.semester && (user.role === 'student' || user.role === 'faculty')) {
          assignments.push({
            group_id: `${user.branch}_${user.semester.replace(/ & /g, '-').replace(/ /g, '-')}_official`,
            user_id: user.id,
            role: user.role,
            can_post: ['admin', 'faculty'].includes(user.role)
          });
        }

        // Student peer groups for students
        if (user.role === 'student' && user.semester) {
          assignments.push({
            group_id: `${user.branch}_${user.semester.replace(/ & /g, '-').replace(/ /g, '-')}_student`,
            user_id: user.id,
            role: user.role,
            can_post: true
          });
        }
      }
    }

    // Insert assignments in batches to avoid conflicts
    console.log(`📝 Creating ${assignments.length} group memberships...`);

    for (let i = 0; i < assignments.length; i += 100) {
      const batch = assignments.slice(i, i + 100);
      const { error } = await supabase
        .from('group_members')
        .upsert(batch, { onConflict: 'group_id,user_id' });

      if (error) {
        console.error(`❌ Error creating memberships batch ${i/100 + 1}:`, error);
      } else {
        console.log(`✅ Created memberships batch ${i/100 + 1}`);
      }
    }

    console.log('🎉 Groups population completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - ${defaultGroups.length} default groups created`);
    console.log(`   - ${departments.size} department groups created`);
    console.log(`   - ${classGroups.size} class groups created`);
    console.log(`   - ${studentClassGroups.size} student peer groups created`);
    console.log(`   - ${assignments.length} group memberships created`);

  } catch (error) {
    console.error('❌ Error during groups population:', error);
    process.exit(1);
  }
}

// Run the script
populateGroups();
