import { supabase } from './supabase';
import type { UserProfile, Semester, FeeRecord, Assignment, Subject } from '@/types';

// Export supabase client for use in other files
export { supabase };

// Profile operations (using user_profiles table)
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  console.log('🔍 Fetching profile for userId:', userId);

  // First check if user is authenticated
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  console.log('🔐 Auth session check:', { hasSession: !!session, sessionError });

  if (!session) {
    console.error('❌ No active session found');
    return null;
  }

  // First try to get profile by user ID
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (!error && data) {
    console.log('✅ Profile found by user ID:', {
      id: data.id,
      email: data.email,
      full_name: data.full_name,
      branch: data.branch,
      semester: data.semester,
      department: data.department,
      year_of_study: data.year_of_study,
      usn: data.usn,
      student_id: data.student_id
    });
    return data as UserProfile;
  }

  // If no profile found by ID, try to find by email and update it
  console.log('🔄 Profile not found by ID, checking by email...');
  const { data: emailData, error: emailError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('email', session.user?.email)
    .single();

  if (!emailError && emailData) {
    console.log('📝 Found profile by email, updating user ID...');
    try {
      // Update the existing profile to use the correct user ID
      const { data: updatedData, error: updateError } = await supabase
        .from('user_profiles')
        .update({ id: userId })
        .eq('email', session.user.email)
        .select()
        .single();

      if (!updateError && updatedData) {
        console.log('✅ Profile updated with correct user ID:', updatedData);
        return updatedData as UserProfile;
      }
    } catch (updateError) {
      console.error('❌ Failed to update profile user ID:', updateError);
    }
  }

  // If still no profile, create one
  console.log('📝 Creating new profile...');
  try {
    const newProfile: Partial<UserProfile> = {
      id: userId,
      email: session.user?.email || '',
      full_name: session.user?.user_metadata?.full_name || session.user?.user_metadata?.name || session.user?.email?.split('@')[0] || '',
      role: 'student', // Default role
      is_approved: false, // Needs admin approval
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Try to create, but handle duplicate email by using a different approach
    const createdProfile = await createUserProfileForce(newProfile as UserProfile);
    if (createdProfile) {
      console.log('✅ Profile fetched successfully:', {
        id: createdProfile.id,
        email: createdProfile.email,
        full_name: createdProfile.full_name,
        branch: createdProfile.branch,
        semester: createdProfile.semester,
        department: createdProfile.department,
        year_of_study: createdProfile.year_of_study,
        usn: createdProfile.usn,
        student_id: createdProfile.student_id
      });
      return createdProfile;
    }
  } catch (createError) {
    console.error('❌ Failed to create profile:', createError);
  }

  console.error('❌ All profile operations failed');
  return null;
};

// Force create profile (for handling duplicate email issues)
export const createUserProfileForce = async (profile: UserProfile): Promise<UserProfile | null> => {
  try {
    // First check if email already exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', profile.email)
      .single();

    if (existingProfile) {
      console.log('📝 Email already exists, updating existing profile...');
      // Update existing profile instead - but keep the existing ID
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...profile,
          // Don't update the id - keep the existing one
          id: existingProfile.id,
        })
        .eq('email', profile.email)
        .select()
        .single();

      if (error) throw error;
      return data as UserProfile;
    } else {
      // Create new profile with the provided ID (which should be the auth user ID)
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([profile])
        .select()
        .single();

      if (error) throw error;
      return data as UserProfile;
    }
  } catch (error) {
    console.error('Error in force create profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (userId: string, profile: Partial<UserProfile>): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      ...profile,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    throw error;
  }

  return data as UserProfile;
};

export const deleteUserProfile = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Error deleting user profile:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteUserProfile:', error);
    return false;
  }
};

export const getUserProfiles = async (filters?: { role?: string }): Promise<UserProfile[]> => {
  let query = supabase.from('user_profiles').select('*');

  if (filters?.role) {
    query = query.eq('role', filters.role);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user profiles:', error);
    return [];
  }

  return data || [];
};

// Posts operations
export const getPosts = async (limit = 50, offset = 0) => {
  const { data, error } = await supabase
    .from('posts')
    .select('*, user_profiles(full_name)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching posts:', error);
    return [];
  }

  return data || [];
};

export const createPost = async (post: {
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  category?: string;
  tags?: string[];
  attachments?: any[];
  metadata?: any;
}) => {
  const { data, error } = await supabase
    .from('posts')
    .insert([post])
    .select()
    .single();

  if (error) {
    console.error('Error creating post:', error);
    throw error;
  }

  return data;
};

export const createFaculty = async (facultyData: {
  email: string;
  password: string;
  displayName: string;
  pronouns?: string;
  phone?: string;
  assignedBranches: string[];
  assignedSemesters: string[];
  facultyTitle?: string;
}): Promise<UserProfile | null> => {
  try {
    // First, create the auth account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: facultyData.email.toLowerCase(),
      password: facultyData.password,
    });

    if (authError) {
      console.error('Auth account creation error:', authError);
      throw new Error(`Failed to create auth account: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('Failed to create auth account');
    }

    // Then create the profile
    const facultyProfile: UserProfile = {
      id: authData.user.id,
      email: facultyData.email.toLowerCase(),
      full_name: facultyData.displayName,
      pronouns: facultyData.pronouns || undefined,
      phone: facultyData.phone || undefined,
      password: facultyData.password,
      assigned_branches: facultyData.assignedBranches,
      assigned_semesters: facultyData.assignedSemesters as Semester[],
      faculty_title: facultyData.facultyTitle || undefined,
      role: 'faculty',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_approved: true,
    };

    const createdProfile = await createUserProfileForce(facultyProfile);
    if (!createdProfile) {
      throw new Error('Failed to create faculty profile');
    }

    return createdProfile;
  } catch (error) {
    console.error('Error creating faculty:', error);
    throw error;
  }
};

// Attendance management operations
export const markAttendance = async (attendanceData: {
  student_uid: string;
  subject: string;
  date: string;
  period: string;
  status: 'present' | 'absent';
  branch: string;
  semester: string;
  marked_by: string;
  marked_by_name: string;
  notes?: string;
}): Promise<void> => {
  try {
    const { error } = await supabase
      .from('attendance_records')
      .upsert(attendanceData, {
        onConflict: 'student_uid,subject,date,period'
      });

    if (error) {
      console.error('Error marking attendance:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in markAttendance:', error);
    throw error;
  }
};

export const getAttendance = async (filters?: {
  student_uid?: string;
  subject?: string;
  date?: string;
  period?: string;
  branch?: string;
  semester?: string;
  marked_by?: string;
}): Promise<any[]> => {
  try {
    let query = supabase
      .from('attendance_records')
      .select('*')
      .order('date', { ascending: false })
      .order('period', { ascending: true });

    if (filters) {
      if (filters.student_uid) query = query.eq('student_uid', filters.student_uid);
      if (filters.subject) query = query.eq('subject', filters.subject);
      if (filters.date) query = query.eq('date', filters.date);
      if (filters.period) query = query.eq('period', filters.period);
      if (filters.branch) query = query.eq('branch', filters.branch);
      if (filters.semester) query = query.eq('semester', filters.semester);
      if (filters.marked_by) query = query.eq('marked_by', filters.marked_by);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching attendance:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAttendance:', error);
    throw error;
  }
};

export const getAttendanceSummary = async (filters: {
  branch: string;
  semester: string;
  subject?: string;
  date_from?: string;
  date_to?: string;
}): Promise<any[]> => {
  try {
    let query = supabase
      .from('attendance_records')
      .select(`
        student_uid,
        subject,
        date,
        period,
        status,
        branch,
        semester,
        marked_by_name,
        user_profiles!attendance_records_student_uid_fkey (
          full_name,
          usn,
          email
        )
      `)
      .eq('branch', filters.branch)
      .eq('semester', filters.semester)
      .order('date', { ascending: false });

    if (filters.subject) query = query.eq('subject', filters.subject);
    if (filters.date_from) query = query.gte('date', filters.date_from);
    if (filters.date_to) query = query.lte('date', filters.date_to);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching attendance summary:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAttendanceSummary:', error);
    throw error;
  }
};

export const getFeeRecords = async (studentId?: string) => {
  let query = supabase.from('fee_records').select('*');

  if (studentId) {
    query = query.eq('student_id', studentId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching fee records:', error);
    return [];
  }

  return data;
};

export const createFeeRecord = async (feeRecord: Omit<FeeRecord, 'id' | 'created_at' | 'updated_at'>) => {
  const record = {
    ...feeRecord,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('fee_records')
    .insert([record])
    .select()
    .single();

  if (error) {
    console.error('Error creating fee record:', error);
    throw error;
  }

  return data;
};

export const updateFeeRecord = async (id: string, updates: Partial<FeeRecord>) => {
  const { data, error } = await supabase
    .from('fee_records')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating fee record:', error);
    throw error;
  }

  return data;
};

export const deleteFeeRecord = async (id: string) => {
  const { error } = await supabase
    .from('fee_records')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting fee record:', error);
    throw error;
  }

  return true;
};

// Study materials operations
export const getStudyMaterials = async (filters?: { branch?: string; semester?: string }) => {
  let query = supabase.from('study_materials').select('*');

  if (filters?.branch) query = query.eq('branch', filters.branch);
  if (filters?.semester) query = query.eq('semester', filters.semester);

  const { data, error } = await query.order('uploaded_at', { ascending: false });

  if (error) {
    console.error('Error fetching study materials:', error);
    return [];
  }

  return data;
};

// Timetables operations
export const getTimetables = async (filters?: { branch?: string; semester?: string }) => {
  let query = supabase.from('timetables').select('*');

  if (filters?.branch) query = query.eq('branch', filters.branch);
  if (filters?.semester) query = query.eq('semester', filters.semester);

  const { data, error } = await query.order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching timetables:', error);
    return [];
  }

  return data;
};

export const createTimetable = async (timetable: {
  id: string;
  branch: string;
  semester: string;
  schedule: any[];
  lastUpdatedBy: string;
}) => {
  console.log('🗓️ createTimetable: Starting with data:', {
    id: timetable.id,
    branch: timetable.branch,
    semester: timetable.semester,
    scheduleLength: timetable.schedule?.length,
    lastUpdatedBy: timetable.lastUpdatedBy
  });

  try {
    const record = {
      id: timetable.id,
      branch: timetable.branch,
      semester: timetable.semester,
      schedule: timetable.schedule,
      last_updated_by: timetable.lastUpdatedBy,
      last_updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('📝 createTimetable: Prepared record for database:', record);

    const { data, error } = await supabase
      .from('timetables')
      .insert([record])
      .select()
      .single();

    if (error) {
      console.error('❌ createTimetable: Database error:', error);
      throw error;
    }

    console.log('✅ createTimetable: Successfully created:', data);
    return data;
  } catch (error) {
    console.error('❌ createTimetable: Exception:', error);
    throw error;
  }
};

export const updateTimetable = async (id: string, timetable: {
  schedule?: any[];
  lastUpdatedBy?: string;
}) => {
  const record: any = {
    updated_at: new Date().toISOString(),
  };

  if (timetable.schedule !== undefined) {
    record.schedule = timetable.schedule;
  }

  if (timetable.lastUpdatedBy) {
    record.last_updated_by = timetable.lastUpdatedBy;
    record.last_updated_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('timetables')
    .update(record)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating timetable:', error);
    throw error;
  }

  console.log('✅ Timetable updated:', data);
  return data;
};

export const deleteTimetable = async (id: string) => {
  const { error } = await supabase
    .from('timetables')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting timetable:', error);
    throw error;
  }

  console.log('✅ Timetable deleted:', id);
  return true;
};

// Test database connection and timetables table
export const testTimetablesTable = async () => {
  console.log('🧪 Testing timetables table...');

  try {
    // Test basic connection
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'timetables');

    if (tableError) {
      console.error('❌ Table check error:', tableError);
      return { success: false, error: tableError.message };
    }

    const tableExists = tables && tables.length > 0;
    console.log('📊 Timetables table exists:', tableExists);

    if (tableExists) {
      // Test if we can query the table
      const { data: timetableData, error: queryError } = await supabase
        .from('timetables')
        .select('count')
        .limit(1);

      if (queryError) {
        console.error('❌ Query test error:', queryError);
        return { success: false, error: queryError.message };
      }

      console.log('✅ Timetables table is accessible');
      return { success: true, tableExists: true };
    } else {
      console.error('❌ Timetables table does not exist');
      return { success: false, error: 'Timetables table not found' };
    }
  } catch (error) {
    console.error('❌ Test exception:', error);
    return { success: false, error: String(error) };
  }
};

// Test RLS policies for timetables
export const testTimetableRLS = async () => {
  console.log('🔐 Testing timetable RLS policies...');

  try {
    // Test 1: Try to create a test timetable
    const testTimetable = {
      id: 'test-rls-' + Date.now(),
      branch: 'CSE',
      semester: '5th Sem',
      schedule: [{
        day: 'Monday',
        entries: [{
          period: 0,
          type: 'class',
          subject: 'Test Subject',
          subject_code: 'TEST101',
          room_number: '101',
          faculty_name: 'Test Faculty'
        }]
      }],
      lastUpdatedBy: 'test-user'
    };

    console.log('📝 Testing timetable creation...');
    const result = await createTimetable(testTimetable);

    if (result) {
      console.log('✅ RLS policies allow timetable creation');

      // Test 2: Try to read it back
      console.log('📖 Testing timetable reading...');
      const timetables = await getTimetables({ branch: 'CSE', semester: '5th Sem' });
      const found = timetables.some(t => t.id === testTimetable.id);

      if (found) {
        console.log('✅ RLS policies allow timetable reading');

        // Test 3: Try to delete it
        console.log('🗑️ Testing timetable deletion...');
        await deleteTimetable(testTimetable.id);
        console.log('✅ RLS policies allow timetable deletion');

        return { success: true, message: 'All RLS tests passed' };
      } else {
        return { success: false, message: 'Cannot read created timetable' };
      }
    } else {
      return { success: false, message: 'Cannot create timetable' };
    }
  } catch (error) {
    console.error('❌ RLS test failed:', error);
    return { success: false, message: String(error) };
  }
};

// Notifications operations
export const getNotifications = async (userId: string) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }

  return data;
};

// Fundraising operations
export const getFundraisingCampaigns = async () => {
  const { data, error } = await supabase
    .from('fundraising_campaigns')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching fundraising campaigns:', error);
    return [];
  }

  return data;
};

// Skill build courses operations
export const getSkillBuildCourses = async () => {
  const { data, error } = await supabase
    .from('skill_build_courses')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching skill build courses:', error);
    return [];
  }

  return data;
};

// File upload/download operations
export const uploadFile = async (bucket: string, filePath: string, file: File) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file);

  if (error) {
    console.error('Error uploading file:', error);
    throw error;
  }

  return data;
};

export const downloadFile = async (bucket: string, filePath: string) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .download(filePath);

  if (error) {
    console.error('Error downloading file:', error);
    throw error;
  }

  return data;
};

export const createAssignment = async (assignment: Omit<Assignment, 'id' | 'posted_at'>) => {
  console.log('createAssignment: Starting with data:', assignment);

  const record = {
    title: assignment.title,
    description: assignment.description,
    course_name: assignment.title, // Assuming course_name is title or adjust
    instructor_id: assignment.instructor_id,
    instructor_name: assignment.instructor_name,
    due_date: assignment.due_date,
    attachments: assignment.attachments,
    branch: assignment.branch,
    semester: assignment.semester,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  console.log('createAssignment: Prepared record:', record);

  const { data, error } = await supabase
    .from('assignments')
    .insert([record])
    .select()
    .single();

  if (error) {
    console.error('Error creating assignment:', error);
    throw error;
  }

  return data;
};

export const updateAssignment = async (id: string, assignment: Partial<Omit<Assignment, 'id' | 'posted_at'>>) => {
  console.log('updateAssignment: Starting with id:', id, 'and data:', assignment);

  const record = {
    ...assignment,
    updated_at: new Date().toISOString(),
  };

  console.log('updateAssignment: Prepared record:', record);

  const { data, error } = await supabase
    .from('assignments')
    .update(record)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating assignment:', error);
    throw error;
  }

  return data;
};

export const deleteAssignment = async (id: string) => {
  console.log('deleteAssignment: Starting with id:', id);

  const { error } = await supabase
    .from('assignments')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting assignment:', error);
    throw error;
  }

  return true;
};

export const createUserProfile = async (profile: Omit<UserProfile, 'created_at' | 'updated_at'>) => {
  console.log('createUserProfile: Starting with profile:', profile);

  const record = {
    ...profile,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  console.log('createUserProfile: Prepared record:', record);

  const { data, error } = await supabase
    .from('user_profiles')
    .insert([record])
    .select()
    .single();

  if (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }

  return data;
};

export const checkExistingUser = async (usn: string, studentId?: string) => {
  console.log('checkExistingUser: Checking for usn:', usn, 'studentId:', studentId);

  const { data, error } = await supabase
    .from('user_profiles')
    .select('email, usn, student_id')
    .or(`usn.eq.${usn}${studentId ? `,student_id.eq.${studentId}` : ''}`)
    .eq('role', 'student');

  if (error) {
    console.error('Error checking existing user:', error);
    throw error;
  }

  return data;
};

// Test database connection and permissions
export const testDatabaseConnection = async () => {
  console.log('🧪 Testing database connection...');

  try {
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('❌ Database connection test failed:', testError);
      return false;
    }

    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database test error:', error);
    return false;
  }
};

export const migrateProfileByUsn = async (authUserId: string, email: string): Promise<UserProfile | null> => {
  try {
    console.log('🔄 Attempting to migrate profile for user:', authUserId, 'with email:', email);

    // Find profile by email (since we know the user's email)
    const { data: profileByEmail, error: emailError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (emailError && emailError.code !== 'PGRST116') {
      console.error('Error finding profile by email:', emailError);
      return null;
    }

    if (profileByEmail && profileByEmail.id !== authUserId) {
      console.log('🔄 Found existing profile, migrating ID from', profileByEmail.id, 'to', authUserId);

      // Update the profile ID to match the auth user ID
      const { data: updatedProfile, error: updateError } = await supabase
        .from('user_profiles')
        .update({ id: authUserId })
        .eq('email', email)
        .select()
        .single();

      if (updateError) {
        console.error('Error migrating profile ID:', updateError);
        return null;
      }

      console.log('✅ Profile ID migrated successfully');
      return updatedProfile as UserProfile;
    } else if (profileByEmail && profileByEmail.id === authUserId) {
      console.log('✅ Profile already has correct ID');
      return profileByEmail as UserProfile;
    } else {
      console.log('📝 No existing profile found, will create new one');
      return null;
    }
  } catch (error) {
    console.error('Error in profile migration by email:', error);
    return null;
  }
};

// Branch management operations
export const getBranches = async (): Promise<string[]> => {
  try {
    console.log('🔍 getBranches: Starting query...');
    const { data, error } = await supabase
      .from('branches')
      .select('name')
      .order('name');

    console.log('📊 getBranches query result:', { data, error, dataLength: data?.length });

    if (error) {
      console.error('❌ Error fetching branches:', error);
      // Fallback to default branches if table doesn't exist yet
      return ["CSE", "ISE", "ECE", "ME", "CIVIL", "AI & ML", "OTHER"];
    }

    // If no data or empty array, return defaults
    if (!data || data.length === 0) {
      console.log('ℹ️ No branches found in database, using defaults');
      return ["CSE", "ISE", "ECE", "ME", "CIVIL", "AI & ML", "OTHER"];
    }

    const branchNames = data.map(branch => branch.name);
    console.log('✅ Returning branches from database:', branchNames);
    return branchNames;
  } catch (error) {
    console.error('❌ Exception in getBranches:', error);
    return ["CSE", "ISE", "ECE", "ME", "CIVIL", "AI & ML", "OTHER"];
  }
};

export const createBranch = async (branchName: string): Promise<string> => {
  try {
    const upperCaseName = branchName.trim().toUpperCase();

    const { data, error } = await supabase
      .from('branches')
      .insert([{ name: upperCaseName }])
      .select()
      .single();

    if (error) {
      console.error('Error creating branch:', error);
      throw error;
    }

    return data.name;
  } catch (error) {
    console.error('Error in createBranch:', error);
    throw error;
  }
};

export const deleteBranch = async (branchName: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('branches')
      .delete()
      .eq('name', branchName);

    if (error) {
      console.error('Error deleting branch:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteBranch:', error);
    throw error;
  }
};

export const getSubjects = async (filters?: { branch?: string; semester?: string }) => {
  let query = supabase.from('subjects').select('*');

  if (filters?.branch) query = query.eq('branch', filters.branch);
  if (filters?.semester) query = query.eq('semester', filters.semester);

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching subjects:', error);
    return [];
  }

  return data;
};

export const createSubject = async (subject: Omit<Subject, 'id' | 'created_at' | 'updated_at'>) => {
  const record = {
    ...subject,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('subjects')
    .insert([record])
    .select()
    .single();

  if (error) {
    console.error('Error creating subject:', error);
    throw error;
  }

  return data;
};

export const updateSubject = async (id: string, subject: Partial<Subject>) => {
  const { data, error } = await supabase
    .from('subjects')
    .update({ ...subject, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating subject:', error);
    throw error;
  }

  return data;
};

export const deleteSubject = async (id: string) => {
  const { error } = await supabase
    .from('subjects')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting subject:', error);
    throw error;
  }

  return true;
};
