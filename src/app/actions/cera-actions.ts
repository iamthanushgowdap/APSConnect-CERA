// Server action for Cera.Ai database queries
'use server';

import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client with service role access
const ceraSupabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Get user profile and context
export async function getUserProfile(userId: string) {
  try {
    const { data: profile, error } = await ceraSupabaseServer
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return { success: true, data: profile };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return { success: false, error: 'Failed to fetch user profile' };
  }
}

// Get database context for Cera.Ai
export async function getDatabaseContext() {
  try {
    const [timetables, attendance, subjects, profiles] = await Promise.all([
      ceraSupabaseServer.from('timetables').select('*'),
      ceraSupabaseServer.from('attendance_records').select('*').limit(1000),
      ceraSupabaseServer.from('subjects').select('*'),
      ceraSupabaseServer.from('user_profiles').select('*')
    ]);

    const context = {
      timetables: timetables.data || [],
      attendanceRecords: attendance.data || [],
      subjects: subjects.data || [],
      userProfiles: profiles.data || [],
      lastUpdated: new Date()
    };

    return { success: true, data: context };
  } catch (error) {
    console.error('Error fetching database context:', error);
    return { success: false, error: 'Failed to fetch database context' };
  }
}

// Search database for Cera.Ai queries
export async function searchDatabase(query: string, userContext: any) {
  try {
    // Implement search logic based on user context and permissions
    // This is a placeholder - you can expand this based on your needs

    const results = {
      timetables: [],
      attendance: [],
      subjects: [],
      users: []
    };

    return { success: true, data: results };
  } catch (error) {
    console.error('Error searching database:', error);
    return { success: false, error: 'Failed to search database' };
  }
}
