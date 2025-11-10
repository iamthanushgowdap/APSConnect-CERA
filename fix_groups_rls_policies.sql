-- Simplified RLS policies for groups table

-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can only see groups they are members of" ON public.groups;
DROP POLICY IF EXISTS "Restrict group access" ON public.groups;
DROP POLICY IF EXISTS "Allow authenticated users to read groups" ON public.groups;
DROP POLICY IF EXISTS "Allow admin group management" ON public.groups;
DROP POLICY IF EXISTS "Allow members to read their groups" ON public.groups;

-- Enable RLS
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Simple policy: Allow all authenticated users to read groups
CREATE POLICY "Allow authenticated users to read groups" ON public.groups
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow admins to manage groups
CREATE POLICY "Allow admin group management" ON public.groups
FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'admin'::text);

-- Alternative: If the above doesn't work, disable RLS temporarily
-- ALTER TABLE public.groups DISABLE ROW LEVEL SECURITY;
