
import { supabase } from '@/lib/supabase';
import type { UserProfile, Group, Branch, Semester, GroupType } from '@/types';
import type { User } from '@/components/auth-provider';
import { defaultBranches, semesters } from '@/types';

// Generates a group for a specific branch and semester
function generateGroupsFor(branch: Branch, semester: Semester): Group[] {
  return [
    {
      id: `${branch}_${semester.replace(/ & /g, '-').replace(/ /g, '-')}_official`,
      name: `${branch} - ${semester} Official`,
      type: 'official',
      branch,
      semester,
      description: `Official announcements for ${branch} ${semester}.`
    },
    {
      id: `${branch}_${semester.replace(/ & /g, '-').replace(/ /g, '-')}_student`,
      name: `${branch} - ${semester} Students`,
      type: 'student',
      branch,
      semester,
      description: `Peer discussion for ${branch} ${semester} students.`
    }
  ];
}

// Main function to get all groups a user belongs to
export async function getMyGroups(user: User): Promise<Group[]> {
  if (!user) return [];

  try {
    // Get user's group memberships from database
    const { data: memberships, error } = await supabase
      .from('group_members')
      .select(`
        group_id,
        can_post,
        groups (
          id,
          name,
          type,
          branch,
          semester,
          description
        )
      `)
      .eq('user_id', user.uid);

    if (error) {
      console.error('Error fetching user groups:', error);
      return [];
    }

    // Transform the data to match our Group interface
    const groups: Group[] = memberships
      ?.map((membership: any) => membership.groups)
      .filter((group: any): group is Group => Boolean(group)) || [];

    return groups.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Error in getMyGroups:', error);
    return [];
  }
}

// Get a single group by its ID
export async function getGroupById(groupId: string): Promise<Group | null> {
  try {
    const { data: group, error } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (error) {
      console.error('Error fetching group:', error);
      return null;
    }

    return group;
  } catch (error) {
    console.error('Error in getGroupById:', error);
    return null;
  }
}

// Get all members of a specific group
export async function getGroupMembers(groupId: string): Promise<UserProfile[]> {
  try {
    // First get the group to understand its type and requirements
    const group = await getGroupById(groupId);
    if (!group) return [];

    // Get user IDs from group_members
    const { data: memberships, error: membershipError } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId);

    console.log('Group ID:', groupId);
    console.log('Memberships result:', memberships, 'Error:', membershipError);

    if (membershipError) {
      console.error('Error fetching group memberships:', membershipError);
      return [];
    }

    if (!memberships || memberships.length === 0) {
      console.log('No memberships found');
      return [];
    }

    const userIds = memberships.map(m => m.user_id);
    console.log('Found user IDs:', userIds);

    // Fetch user profiles - select correct fields
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email, display_name, full_name, faculty_title, role, usn, branch, semester, is_approved, avatar_url, student_id')
      .in('id', userIds);

    console.log('Profile query result:', profiles, 'Error:', profileError);

    if (profileError) {
      console.error('Error fetching user profiles:', profileError);
      return [];
    }

    // Transform the data to match UserProfile interface and filter by role
    const members: UserProfile[] = (profiles || [])
      .filter(profile => {
        // For student groups, only show students
        if (group.type === 'student') {
          return profile.role === 'student';
        }
        // For official groups, show students, faculty, and admins
        return ['student', 'faculty', 'admin'].includes(profile.role);
      })
      .map(profile => ({
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name || profile.display_name,  // Use full_name if available, otherwise display_name
        avatar_url: profile.avatar_url,
        role: profile.role,
        department: profile.branch,
        year_of_study: profile.semester,
        student_id: profile.student_id,
        faculty_title: profile.faculty_title,  // Add faculty_title
        is_approved: profile.is_approved,
        branch: profile.branch,
        semester: profile.semester,
        usn: profile.usn,
        display_name: profile.display_name,
        // Add other required fields with defaults
        created_at: '',
        updated_at: '',
      } as UserProfile));

    console.log('Returning real member data:', members.length, 'members');

    return members.sort((a, b) =>
      (a.full_name || a.email).localeCompare(b.full_name || b.email)
    );
  } catch (error) {
    console.error('Error in getGroupMembers:', error);
    return [];
  }
}

// Check if user can post in a specific group
export async function canUserPostInGroup(userId: string, groupId: string): Promise<boolean> {
  try {
    const { data: membership, error } = await supabase
      .from('group_members')
      .select('can_post')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error checking posting permission:', error);
      return false;
    }

    return membership?.can_post || false;
  } catch (error) {
    console.error('Error in canUserPostInGroup:', error);
    return false;
  }
}

// Automatically assign user to appropriate groups based on their role and profile
export async function assignUserToGroups(user: User): Promise<void> {
  if (!user || !user.uid) {
    console.error('Cannot assign groups: invalid user', user);
    return;
  }

  try {
    console.log('🚀 Starting automatic group assignment for user:', user.uid, user.role);

    // Get user's profile to determine branch/semester assignments
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('branch, semester, assigned_branches, assigned_semesters, role')
      .eq('id', user.uid)
      .single();

    if (profileError) {
      console.error('❌ Error fetching user profile for group assignment:', profileError);
      return;
    }

    console.log('📋 User profile for assignment:', profile);

    // Clear existing group memberships for this user to avoid duplicates
    const { error: deleteError } = await supabase
      .from('group_members')
      .delete()
      .eq('user_id', user.uid);

    if (deleteError) {
      console.error('❌ Error clearing existing group memberships:', deleteError);
      return;
    }

    console.log('🧹 Cleared existing group memberships');

    const memberships: any[] = [];

    // ==================== COMMON GROUPS FOR ALL USERS ====================
    // All users get official announcements (read-only)
    memberships.push({
      group_id: 'official_announcements',
      user_id: user.uid,
      role: user.role,
      can_post: false
    });

    // ==================== ROLE-SPECIFIC ASSIGNMENTS ====================
    if (user.role === 'admin') {
      console.log('👑 Assigning admin to all groups');

      // Admins get all groups with posting rights
      memberships.push(
        { group_id: 'admin_announcements', user_id: user.uid, role: 'admin', can_post: true },
        { group_id: 'faculty_lounge', user_id: user.uid, role: 'admin', can_post: true }
      );

      // Get all existing groups and assign admin to them
      const { data: allGroups, error: groupsError } = await supabase
        .from('groups')
        .select('id, type');

      if (!groupsError && allGroups) {
        allGroups.forEach(group => {
          memberships.push({
            group_id: group.id,
            user_id: user.uid,
            role: 'admin',
            can_post: true
          });
        });
      }

    } else if (user.role === 'faculty') {
      console.log('👨‍🏫 Assigning faculty to their assigned groups');

      // Faculty get faculty lounge
      memberships.push({
        group_id: 'faculty_lounge',
        user_id: user.uid,
        role: 'faculty',
        can_post: true
      });

      // Faculty get groups based on assigned_branches and assigned_semesters
      if (profile.assigned_branches && profile.assigned_branches.length > 0) {
        const { data: facultyGroups, error: facultyGroupsError } = await supabase
          .from('groups')
          .select('id, branch, semester, type')
          .in('branch', profile.assigned_branches);

        if (!facultyGroupsError && facultyGroups) {
          facultyGroups.forEach(group => {
            // Only assign to official groups (department and class groups)
            if (group.type === 'official') {
              memberships.push({
                group_id: group.id,
                user_id: user.uid,
                role: 'faculty',
                can_post: true
              });
            }
          });
        }
      }

    } else if (user.role === 'student') {
      console.log('🎓 Assigning student to their branch/semester groups');

      // Students get assigned based on their branch and semester
      if (profile.branch && profile.semester) {
        console.log(`📚 Looking for groups: branch=${profile.branch}, semester=${profile.semester}`);

        // Get official groups for student's branch/semester
        const { data: studentOfficialGroups, error: officialError } = await supabase
          .from('groups')
          .select('id, branch, semester, type')
          .eq('branch', profile.branch)
          .eq('semester', profile.semester)
          .eq('type', 'official');

        if (!officialError && studentOfficialGroups) {
          console.log(`✅ Found ${studentOfficialGroups.length} official groups for ${profile.branch} ${profile.semester}`);
          studentOfficialGroups.forEach(group => {
            memberships.push({
              group_id: group.id,
              user_id: user.uid,
              role: 'student',
              can_post: false
            });
          });
        } else {
          console.log(`⚠️ No official groups found for ${profile.branch} ${profile.semester}`, officialError);
        }

        // Get student discussion groups for student's branch/semester
        const { data: studentDiscussionGroups, error: discussionError } = await supabase
          .from('groups')
          .select('id, branch, semester, type')
          .eq('branch', profile.branch)
          .eq('semester', profile.semester)
          .eq('type', 'student');

        if (!discussionError && studentDiscussionGroups) {
          console.log(`✅ Found ${studentDiscussionGroups.length} discussion groups for ${profile.branch} ${profile.semester}`);
          studentDiscussionGroups.forEach(group => {
            memberships.push({
              group_id: group.id,
              user_id: user.uid,
              role: 'student',
              can_post: true // Students can post in discussion groups
            });
          });
        } else {
          console.log(`⚠️ No discussion groups found for ${profile.branch} ${profile.semester}`, discussionError);
        }
      } else {
        console.log('⚠️ Student missing branch or semester:', { branch: profile.branch, semester: profile.semester });
      }

    } else if (user.role === 'alumni') {
      console.log('🎓 Assigning alumni to alumni groups');

      // Alumni get official announcements and can post
      memberships.push({
        group_id: 'official_announcements',
        user_id: user.uid,
        role: 'alumni',
        can_post: true
      });

      // Alumni might also get access to their old branch groups if needed
      // For now, just official announcements
    }

    // ==================== INSERT MEMBERSHIPS ====================
    if (memberships.length > 0) {
      console.log(`📝 Inserting ${memberships.length} group memberships for user ${user.uid}`);

      const { error: insertError } = await supabase
        .from('group_members')
        .insert(memberships);

      if (insertError) {
        console.error('❌ Error inserting group memberships:', insertError);
        console.error('Failed memberships:', memberships);
      } else {
        console.log(`✅ Successfully assigned user ${user.uid} to ${memberships.length} groups`);
        console.log('Assigned groups:', memberships.map(m => m.group_id));
      }
    } else {
      console.log('⚠️ No groups to assign for user', user.uid);
    }

  } catch (error) {
    console.error('❌ Error in automatic group assignment:', error);
  }
}
