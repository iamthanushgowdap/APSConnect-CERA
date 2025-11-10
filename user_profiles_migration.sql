-- Create user_profiles table for storing user information
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'faculty', 'admin', 'pending', 'alumni', 'rejected')),
  student_id TEXT UNIQUE,
  usn TEXT,
  branch TEXT,
  semester TEXT,
  department TEXT, -- Alternative to branch
  year_of_study TEXT, -- Alternative to semester
  assigned_branches TEXT[],
  assigned_semesters TEXT[],
  pronouns TEXT,
  is_approved BOOLEAN DEFAULT false,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_branch ON user_profiles(branch);
CREATE INDEX IF NOT EXISTS idx_user_profiles_semester ON user_profiles(semester);
CREATE INDEX IF NOT EXISTS idx_user_profiles_usn ON user_profiles(usn);
CREATE INDEX IF NOT EXISTS idx_user_profiles_student_id ON user_profiles(student_id);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies - simplified for now
-- Allow authenticated users to read any profile (will be filtered in application)
CREATE POLICY "Allow authenticated users to read profiles" ON user_profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to insert their own profile
CREATE POLICY "Allow users to create own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Allow users to update their own profile
CREATE POLICY "Allow users to update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Create trigger for updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert a sample admin user (replace with actual admin user ID)
-- This is just an example - you should create admin users through proper registration
-- INSERT INTO user_profiles (id, email, full_name, role, is_approved)
-- VALUES ('your-admin-uuid-here', 'admin@example.com', 'Administrator', 'admin', true);
