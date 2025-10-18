// API route for Cera.Ai database operations
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

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

// GET /api/cera?path=user-profile&userId=...
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const path = url.searchParams.get('path');

  // Handle user-profile endpoint
  if (path === 'user-profile') {
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    try {
      const { data: profile, error } = await ceraSupabaseServer
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data: profile });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return NextResponse.json({ success: false, error: 'Failed to fetch user profile' }, { status: 500 });
    }
  }

  return NextResponse.json({ success: false, error: 'Endpoint not found' }, { status: 404 });
}

// POST /api/cera?path=database-context
export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const path = url.searchParams.get('path');

  // Handle database-context endpoint
  if (path === 'database-context') {
    try {
      const [timetables, attendance, subjects, profiles] = await Promise.all([
        ceraSupabaseServer.from('timetables').select('*'),
        ceraSupabaseServer.from('attendance_records').select('*').limit(1000),
        ceraSupabaseServer.from('subjects').select('*'),
        ceraSupabaseServer.from('user_profiles').select('*')
      ]);

      console.log('🔄 API: Fetched database context');
      console.log('📊 API: Attendance records count:', attendance.data?.length || 0);
      console.log('📋 API: Sample attendance record:', attendance.data?.[0] || 'No data');

      const context = {
        timetables: timetables.data || [],
        attendanceRecords: attendance.data || [],
        subjects: subjects.data || [],
        userProfiles: profiles.data || [],
        lastUpdated: new Date()
      };

      return NextResponse.json({ success: true, data: context });
    } catch (error) {
      console.error('Error fetching database context:', error);
      return NextResponse.json({ success: false, error: 'Failed to fetch database context' }, { status: 500 });
    }
  }

  return NextResponse.json({ success: false, error: 'Endpoint not found' }, { status: 404 });
}
