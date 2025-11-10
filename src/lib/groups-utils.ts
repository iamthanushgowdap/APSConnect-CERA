
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

// Initialize groups for a new branch/semester combination (admin function)
export async function initializeGroupsForBranchSemester(branch: Branch, semester: Semester): Promise<void> {
  try {
    const groups = generateGroupsFor(branch, semester);

    // Insert groups
    const { error: groupsError } = await supabase
      .from('groups')
      .upsert(groups, { onConflict: 'id' });

    if (groupsError) {
      throw groupsError;
    }

    // This would need to be called by an admin to populate memberships
    // The memberships population is handled by the migration script
    console.log(`Groups initialized for ${branch} ${semester}`);
  } catch (error) {
    console.error('Error initializing groups:', error);
  }
}
