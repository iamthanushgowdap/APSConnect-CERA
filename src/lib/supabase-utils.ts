import { supabase } from './supabase';
import type { UserProfile, Semester, FeeRecord, Assignment, Subject, TimeTable, Branch } from '@/types';

// Export supabase client for use in other files
export { supabase };
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
  console.log('🔄 updateUserProfile called with:', { userId, profile });

  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      ...profile,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  console.log('📊 updateUserProfile result:', { data, error });

  if (error) {
    console.error('❌ updateUserProfile error:', error);
    throw error;
  }

  console.log('✅ updateUserProfile success:', data);
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
    // Use the API route to create faculty account server-side
    const response = await fetch('/api/admin/create-faculty', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(facultyData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create faculty account');
    }

    const data = await response.json();

    if (!data.success || !data.faculty) {
      throw new Error('Invalid response from faculty creation API');
    }

    return data.faculty;
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

  // Create notification for the student if fee status changed
  try {
    const studentId = data.student_id;
    if (studentId && (updates.payment_status || updates.paid_amount)) {
      const notification = {
        id: `fee-${id}-${Date.now()}`,
        userId: studentId,
        type: 'fee_due',
        title: 'Fee Record Updated',
        message: `Your fee record for ${data.semester} ${data.year} has been updated. ${updates.payment_status === 'paid' ? 'Payment confirmed!' : 'Please check your fee details.'}`,
        href: '/student/fee-details',
        createdAt: new Date().toISOString(),
        isRead: false
      };

      // Save to Supabase database
      const { error: notifError } = await supabase
        .from('notifications')
        .insert([{
          id: notification.id,
          user_id: notification.userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          href: notification.href,
          created_at: notification.createdAt,
          read: notification.isRead
        }]);

      if (notifError) {
        console.error('Error creating fee update notification:', notifError);
      } else {
        console.log('Created fee update notification for student:', studentId);
      }
    }
  } catch (notifError) {
    console.error('Error in fee notification creation:', notifError);
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

  console.log('✅ Timetable updated, now creating notifications...');

  // Create notifications for all students in the branch/semester
  try {
    console.log('🔔 Starting notification creation for timetable:', data.id);
    console.log('🔔 Timetable details:', { branch: data.branch, semester: data.semester });
    
    const { data: students, error: studentsError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('role', 'student')
      .eq('branch', data.branch)
      .eq('semester', data.semester);

    console.log('🔔 Students query result:', { students: students?.length, error: studentsError });

    if (studentsError) {
      console.error('❌ Error querying students:', studentsError);
      console.error('Error details:', JSON.stringify(studentsError, null, 2));
      return data; // Return early if students query fails
    }

    if (students && students.length > 0) {
      console.log('🔔 Found students:', students.map(s => s.id));
      
      const notifications = students.map(student => ({
        id: `timetable-${data.id}-${student.id}-${Date.now()}`,
        userId: student.id,
        type: 'fee_due', // Using fee_due type as it's generic enough, could add timetable_update type
        title: 'Timetable Updated',
        message: `The timetable for ${data.branch} ${data.semester} has been updated. Please check the latest schedule.`,
        href: '/student/timetable',
        createdAt: new Date().toISOString(),
        isRead: false
      }));

      console.log('🔔 Created notification objects:', notifications.length);

      // Save to Supabase database
      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications.map(n => ({
          id: n.id,
          user_id: n.userId,
          type: n.type,
          title: n.title,
          message: n.message,
          href: n.href,
          created_at: n.createdAt,
          read: n.isRead
        })));

      if (notifError) {
        console.error('❌ Error creating timetable notifications:', notifError);
        console.error('Error details:', JSON.stringify(notifError, null, 2));
      } else {
        console.log(`✅ Created ${notifications.length} notifications for timetable update`);
      }
    } else {
      console.log('⚠️ No students found for branch/semester:', data.branch, data.semester);
    }
    } catch (notifError: unknown) {
      console.error('❌ Exception in timetable notification creation:', notifError);
      const errorMessage = notifError instanceof Error ? notifError.stack : String(notifError);
      console.error('Exception details:', errorMessage);
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

export const createFundraisingCampaign = async (campaign: {
  title: string;
  description: string;
  qrCodeDataUrl: string;
  contactDetails: string;
  startDate: string;
  endDate: string;
  targetBranches: string[];
  targetSemesters: string[];
  createdByUid: string;
  goalAmount: number;
  currentAmount?: number;
}) => {
  const record = {
    title: campaign.title,
    description: campaign.description,
    qr_code_data_url: campaign.qrCodeDataUrl,
    contact_details: campaign.contactDetails,
    start_date: campaign.startDate,
    end_date: campaign.endDate,
    target_branches: campaign.targetBranches,
    target_semesters: campaign.targetSemesters,
    created_by_uid: campaign.createdByUid,
    goal_amount: campaign.goalAmount,
    current_amount: campaign.currentAmount || 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('fundraising_campaigns')
    .insert([record])
    .select()
    .single();

  if (error) {
    console.error('Error creating fundraising campaign:', error);
    throw error;
  }

  // Create notifications for all students in the target branches/semesters
  try {
    const { data: students } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('role', 'student')
      .in('branch', campaign.targetBranches)
      .in('semester', campaign.targetSemesters);

    if (students && students.length > 0) {
      const notifications = students.map(student => ({
        id: `fundraising-${data.id}-${student.id}-${Date.now()}`,
        userId: student.id,
        type: 'low_attendance', // Using existing type, could add fundraising type
        title: 'New Fundraising Campaign',
        message: `New fundraising campaign "${campaign.title}" has been launched. Goal: ₹${campaign.goalAmount.toLocaleString()}. Help us reach our target!`,
        href: '/student/fundraising',
        createdAt: new Date().toISOString(),
        isRead: false
      }));

      // Save to Supabase database
      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications.map(n => ({
          id: n.id,
          user_id: n.userId,
          type: n.type,
          title: n.title,
          message: n.message,
          href: n.href,
          created_at: n.createdAt,
          read: n.isRead
        })));

      if (notifError) {
        console.error('Error creating fundraising notifications:', notifError);
      } else {
        console.log(`Created ${notifications.length} notifications for new fundraising campaign`);
      }
    }
  } catch (notifError) {
    console.error('Error in fundraising notification creation:', notifError);
  }

  return data;
};

// Test function to create a test notification
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

  console.log('✅ Assignment record inserted, now creating notifications...');

  // Create notifications for all students in the branch/semester
  try {
    console.log('🔔 Starting notification creation for assignment:', data.id);
    console.log('🔔 Assignment details:', { branch: assignment.branch, semester: assignment.semester });
    
    const { data: students, error: studentsError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('role', 'student')
      .eq('branch', assignment.branch)
      .eq('semester', assignment.semester);

    console.log('🔔 Students query result:', { students: students?.length, error: studentsError });

    if (studentsError) {
      console.error('❌ Error querying students:', studentsError);
      console.error('Error details:', JSON.stringify(studentsError, null, 2));
      return data; // Return early if students query fails
    }

    if (students && students.length > 0) {
      console.log('🔔 Found students:', students.map(s => s.id));
      
      const notifications = students.map(student => ({
        id: `assignment-${data.id}-${student.id}-${Date.now()}`,
        user_id: student.id,
        type: 'assignment_deadline',
        title: 'New Assignment Posted',
        message: `New assignment "${assignment.title}" has been posted for ${assignment.branch} ${assignment.semester}. Due date: ${assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'Not specified'}`,
        href: '/student/assignments',
        created_at: new Date().toISOString(),
        read: false
      }));

      console.log('🔔 Created notification objects:', notifications.length);

      // Save to Supabase database
      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications.map(n => ({
          id: n.id,
          user_id: n.user_id,
          type: n.type,
          title: n.title,
          message: n.message,
          href: n.href,
          created_at: n.created_at,
          read: n.read
        })));

      if (notifError) {
        console.error('❌ Error creating assignment notifications:', notifError);
        console.error('❌ Notification error details:', JSON.stringify(notifError, null, 2));
      } else {
        console.log(`✅ Created ${notifications.length} notifications for new assignment`);
      }
    } else {
      console.log('⚠️ No students found for branch/semester:', assignment.branch, assignment.semester);
    }
  } catch (notifError: unknown) {
    console.error('❌ Exception in assignment notification creation:', notifError);
    const errorMessage = notifError instanceof Error ? notifError.stack : String(notifError);
    console.error('❌ Exception details:', errorMessage);
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

export const getAssignments = async (filters?: {
  instructor_id?: string;
  branch?: string;
  semester?: string;
}): Promise<Assignment[]> => {
  try {
    let query = supabase
      .from('assignments')
      .select('*')
      .order('posted_at', { ascending: false });

    if (filters) {
      if (filters.instructor_id) query = query.eq('instructor_id', filters.instructor_id);
      if (filters.branch) query = query.eq('branch', filters.branch);
      if (filters.semester) query = query.eq('semester', filters.semester);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching assignments:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAssignments:', error);
    throw error;
  }
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
      .select('*')
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

    console.log('✅ Returning branches from database:', data);
    return data.map(branch => branch.name);
  } catch (error) {
    console.error('❌ Exception in getBranches:', error);
    return ["CSE", "ISE", "ECE", "ME", "CIVIL", "AI & ML", "OTHER"];
  }
};

export const createBranch = async (branchName: string): Promise<string> => {
  try {
    const upperCaseName = branchName.trim().toUpperCase();
    console.log('🏫 Creating branch:', upperCaseName);

    const record = {
      name: upperCaseName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    console.log('📝 Branch record to insert:', record);

    const { data, error } = await supabase
      .from('branches')
      .insert([record])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating branch:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        fullError: error
      });
      throw error;
    }

    console.log('✅ Branch created successfully:', data);

    // Now create all the groups for this branch
    console.log('📝 Creating groups for new branch:', upperCaseName);

    // Department group
    const departmentGroup = {
      id: `${upperCaseName}_official`,
      name: `${upperCaseName} Department`,
      type: 'official',
      branch: upperCaseName,
      semester: 'ALL',
      description: `Department announcements for ${upperCaseName}`
    };

    // Class groups for all semesters
    const semesters = ['1st Sem', '2nd Sem', '3rd Sem', '4th Sem', '5th Sem', '6th Sem', '7th Sem', '8th Sem'];
    const classGroups = semesters.map(sem => ({
      id: `${upperCaseName}_${sem.replace(' ', '-')}_official`,
      name: `${upperCaseName} - ${sem}`,
      type: 'official',
      branch: upperCaseName,
      semester: sem,
      description: `${upperCaseName} ${sem} official announcements`
    }));

    // Student discussion groups
    const studentGroups = semesters.map(sem => ({
      id: `${upperCaseName}_${sem.replace(' ', '-')}_student`,
      name: `${upperCaseName} ${sem} Discussion`,
      type: 'student',
      branch: upperCaseName,
      semester: sem,
      description: `Peer-to-peer discussion for ${upperCaseName} ${sem}`
    }));

    const allGroups = [departmentGroup, ...classGroups, ...studentGroups];

    console.log('📋 Groups to create:', allGroups.map(g => g.id));

    const { error: groupsError } = await supabase
      .from('groups')
      .insert(allGroups);

    if (groupsError) {
      console.error('❌ Error creating groups for branch:', {
        code: groupsError.code,
        message: groupsError.message,
        details: groupsError.details,
        hint: groupsError.hint,
        fullError: groupsError,
        groupsAttempted: allGroups.map(g => g.id)
      });
      // Don't throw here - branch was created successfully, just log the groups error
    } else {
      console.log('✅ Created', allGroups.length, 'groups for branch:', upperCaseName);

      // Automatically assign admin to all the new groups
      // We need to get the current user's ID (admin) to assign them
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const adminAssignments = allGroups.map(group => ({
            group_id: group.id,
            user_id: user.id,
            role: 'admin',
            can_post: true
          }));

          const { error: assignError } = await supabase
            .from('group_members')
            .insert(adminAssignments);

          if (assignError) {
            console.error('❌ Error assigning admin to new groups:', assignError);
          } else {
            console.log('✅ Assigned admin to', allGroups.length, 'new groups');
          }
        }
      } catch (assignError) {
        console.error('❌ Error in admin assignment:', assignError);
      }
    }

    return data.name;
  } catch (error) {
    console.error('❌ Exception in createBranch:', error);
    throw error;
  }
};

export const deleteBranch = async (branchName: string): Promise<void> => {
  try {
    console.log('🗑️ Starting branch deletion process for:', branchName);

    // First check how many groups exist for this branch
    const { count: groupsCount, error: countError } = await supabase
      .from('groups')
      .select('*', { count: 'exact', head: true })
      .eq('branch', branchName);

    if (countError) {
      console.error('❌ Error counting groups for branch:', countError);
    } else {
      console.log(`📊 Found ${groupsCount} groups associated with branch: ${branchName}`);
    }

    // Delete all groups associated with this branch
    console.log('🗑️ Deleting all groups for branch:', branchName);
    const { error: groupsError } = await supabase
      .from('groups')
      .delete()
      .eq('branch', branchName);

    if (groupsError) {
      console.error('❌ Error deleting groups for branch:', groupsError);
      console.log('⚠️ Continuing with branch deletion despite groups error...');
    } else {
      console.log('✅ Successfully deleted all groups for branch:', branchName);
    }

    // Also clean up any group memberships for this branch's groups
    console.log('🧹 Cleaning up group memberships...');
    const { error: membershipsError } = await supabase
      .from('group_members')
      .delete()
      .like('group_id', `${branchName}_%`);

    if (membershipsError) {
      console.error('❌ Error cleaning up group memberships:', membershipsError);
    } else {
      console.log('✅ Successfully cleaned up group memberships');
    }

    // Finally delete the branch itself
    console.log('🗑️ Deleting branch record:', branchName);
    const { error } = await supabase
      .from('branches')
      .delete()
      .eq('name', branchName);

    if (error) {
      console.error('❌ Error deleting branch:', error);
      throw error;
    }

    console.log('✅ Branch deletion completed successfully:', branchName);
    console.log('📋 Summary: Deleted branch, all associated groups, and memberships');

  } catch (error) {
    console.error('❌ Exception in deleteBranch:', error);
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

// Timetable operations (using timetables table)
export const getTimetable = async (branch: Branch, semester: Semester): Promise<TimeTable | null> => {
  console.log('🔍 Fetching timetable for:', { branch, semester });

  try {
    // First try the original query
    let { data, error } = await supabase
      .from('timetables')
      .select('*')
      .eq('branch', branch)
      .eq('semester', semester)
      .single();

    // If we get a 406 error (RLS issue), try without .single() to see if we can access the table at all
    if (error && error.code === '406') {
      console.log('⚠️ 406 error detected, trying alternative query approach...');

      // Try with a more permissive query
      const { data: altData, error: altError } = await supabase
        .from('timetables')
        .select('*')
        .eq('branch', branch)
        .eq('semester', semester);

      if (!altError && altData && altData.length > 0) {
        console.log('✅ Alternative query successful, found data');
        data = altData[0];
        error = null;
      } else {
        console.log('❌ Alternative query also failed:', altError);
        // Try even more permissive - get all timetables to test RLS
        const { data: allData, error: allError } = await supabase
          .from('timetables')
          .select('*')
          .limit(1);

        if (!allError && allData && allData.length > 0) {
          console.log('✅ Can access timetables table, but specific query fails');
          console.log('🔍 Available data sample:', allData[0]);
        } else {
          console.log('❌ Cannot access timetables table at all - RLS policy issue');
        }
      }
    }

    // Handle Supabase-specific errors
    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('❌ Error fetching timetable:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        fullError: error
      });
      throw new Error(`Database error: ${error.message || 'Unknown error'} (Code: ${error.code})`);
    }

    if (data) {
      console.log('✅ Timetable found:', {
        id: data.id,
        branch: data.branch,
        semester: data.semester,
        lastUpdatedBy: data.lastUpdatedBy,
        lastUpdatedAt: data.lastUpdatedAt
      });
      return data as TimeTable;
    }

    console.log('⚠️ No timetable found for:', { branch, semester });
    return null;
  } catch (error: any) {
    // Handle network errors and other unexpected errors
    if (error?.name === 'TypeError' && error?.message?.includes('Failed to fetch')) {
      console.error('❌ Network error in getTimetable:', {
        name: error.name,
        message: error.message,
        cause: 'Network connectivity issue'
      });
      throw new Error('Network error: Unable to connect to the server. Please check your internet connection.');
    }

    // Handle other errors
    console.error('❌ Unexpected error in getTimetable:', {
      error: error?.message || error,
      type: typeof error,
      name: error?.name
    });

    if (error instanceof Error) {
      throw error;
    }

    throw new Error('An unexpected error occurred while fetching the timetable.');
  }
};

export const saveTimetable = async (timetable: TimeTable): Promise<TimeTable> => {
  console.log('💾 Saving timetable:', {
    branch: timetable.branch,
    semester: timetable.semester,
    scheduleLength: timetable.schedule?.length || 0
  });

  try {
    const { data, error } = await supabase
      .from('timetables')
      .upsert(timetable, {
        onConflict: 'branch,semester'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error saving timetable:', error);
      throw error;
    }

    console.log('✅ Timetable saved successfully:', data.id);

    // Create notifications for all students in the branch/semester
    try {
      console.log('🔔 Starting notification creation for timetable update:', data.id);
      console.log('🔔 Timetable details:', { branch: timetable.branch, semester: timetable.semester });

      const { data: students, error: studentsError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('role', 'student')
        .eq('branch', timetable.branch)
        .eq('semester', timetable.semester);

      console.log('🔔 Students query result:', { students: students?.length, error: studentsError });

      if (studentsError) {
        console.error('❌ Error querying students for timetable notifications:', studentsError);
        console.error('Error details:', JSON.stringify(studentsError, null, 2));
        return data; // Return early if students query fails
      }

      if (students && students.length > 0) {
        console.log('🔔 Found students for timetable:', students.map(s => s.id));

        const notifications = students.map(student => ({
          id: `timetable-${data.id}-${student.id}-${Date.now()}`,
          user_id: student.id,
          type: 'timetable_update',
          title: 'Timetable Updated',
          message: `The timetable for ${timetable.branch} ${timetable.semester} has been updated. Please check the latest schedule.`,
          href: '/student/timetable',
          created_at: new Date().toISOString(),
          read: false
        }));

        console.log('🔔 Created timetable notification objects:', notifications.length);

        // Save to Supabase database
        const { error: notifError } = await supabase
          .from('notifications')
          .insert(notifications.map(n => ({
            id: n.id,
            user_id: n.user_id,
            type: n.type,
            title: n.title,
            message: n.message,
            href: n.href,
            created_at: n.created_at,
            read: n.read
          })));

        if (notifError) {
          console.error('❌ Error creating timetable notifications:', notifError);
          console.error('❌ Notification error details:', JSON.stringify(notifError, null, 2));
        } else {
          console.log(`✅ Created ${notifications.length} timetable notifications for update`);
        }
      } else {
        console.log('⚠️ No students found for timetable branch/semester:', timetable.branch, timetable.semester);
      }
    } catch (notifError: unknown) {
      console.error('❌ Exception in timetable notification creation:', notifError);
      const errorMessage = notifError instanceof Error ? notifError.stack : String(notifError);
      console.error('❌ Exception details:', errorMessage);
    }

    return data as TimeTable;
  } catch (error) {
    console.error('❌ Error in saveTimetable:', error);
    throw error;
  }
};

export const getAllTimetables = async (): Promise<TimeTable[]> => {
  console.log('🔍 Fetching all timetables');

  try {
    const { data, error } = await supabase
      .from('timetables')
      .select('*')
      .order('branch', { ascending: true })
      .order('semester', { ascending: true });

    if (error) {
      console.error('❌ Error fetching all timetables:', error);
      throw error;
    }

    console.log('✅ Found', data?.length || 0, 'timetables');
    return data as TimeTable[];
  } catch (error) {
    console.error('❌ Error in getAllTimetables:', error);
    throw error;
  }
};
