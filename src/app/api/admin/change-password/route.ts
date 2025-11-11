import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    console.log('🔑 Password change API called');

    // Check if required environment variables are available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('❌ Missing required environment variables');
      console.error('SUPABASE_URL:', !!supabaseUrl);
      console.error('SERVICE_ROLE_KEY:', !!serviceRoleKey);
      return NextResponse.json(
        { error: 'Server configuration error: Missing Supabase credentials' },
        { status: 500 }
      );
    }

    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { userId, newPassword } = await request.json();
    console.log('📝 Request data:', { userId, newPassword: newPassword ? '[REDACTED]' : null });

    if (!userId || !newPassword) {
      console.error('❌ Missing required fields');
      return NextResponse.json(
        { error: 'User ID and new password are required' },
        { status: 400 }
      );
    }

    console.log('🔄 Updating auth password...');

    // First, check if the user exists in auth
    console.log('🔍 Checking if user exists in auth...');
    const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (getUserError || !userData.user) {
      console.error('❌ User not found in auth:', getUserError);
      return NextResponse.json(
        { error: 'User not found in authentication system' },
        { status: 404 }
      );
    }
    console.log('✅ User found in auth:', userData.user.email);

    // Update the user's password using admin client
    const { data: authData, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword
    });

    console.log('📊 Auth update response:', { data: authData, error });

    if (error) {
      console.error('❌ Auth password update error:', error);
      return NextResponse.json(
        { error: `Auth update failed: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('✅ Auth password updated successfully');

    // Also update the password in user_profiles table
    console.log('🔄 Updating profile password...');
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .update({ password: newPassword })
      .eq('id', userId);

    if (profileError) {
      console.error('❌ Profile password update error:', profileError);
      // Don't fail the request if profile update fails, password change succeeded
    } else {
      console.log('✅ Profile password updated successfully');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Password change API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
