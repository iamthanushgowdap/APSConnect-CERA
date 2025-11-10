import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { UserProfile } from '@/types';

// This API route uses the service role key for admin operations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      displayName,
      pronouns,
      phone,
      assignedBranches,
      assignedSemesters,
      facultyTitle
    } = body;

    // Validate required fields
    if (!email || !password || !displayName || !assignedBranches || assignedBranches.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create Supabase admin client with service role
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Create the auth account using admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password: password,
      email_confirm: true, // Auto-confirm the email
      user_metadata: {
        displayName: displayName,
        role: 'faculty'
      }
    });

    if (authError) {
      console.error('Auth account creation error:', authError);
      return NextResponse.json(
        { error: `Failed to create auth account: ${authError.message}` },
        { status: 500 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create auth account' },
        { status: 500 }
      );
    }

    // Create the profile
    const facultyProfile: UserProfile = {
      id: authData.user.id,
      email: email.toLowerCase(),
      full_name: displayName,
      pronouns: pronouns || undefined,
      phone: phone || undefined,
      assigned_branches: assignedBranches,
      assigned_semesters: assignedSemesters || [],
      faculty_title: facultyTitle || undefined,
      role: 'faculty',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_approved: true,
    };

    // Insert profile using admin client
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert([facultyProfile])
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Try to clean up the auth account if profile creation failed
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      } catch (cleanupError) {
        console.error('Failed to cleanup auth account:', cleanupError);
      }

      return NextResponse.json(
        { error: `Failed to create faculty profile: ${profileError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      faculty: profileData,
      message: 'Faculty account created successfully'
    });

  } catch (error) {
    console.error('Error in create-faculty API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
