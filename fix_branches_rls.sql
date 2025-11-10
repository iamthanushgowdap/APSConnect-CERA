-- Fix RLS policy for branches table to allow admin management

-- First, check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'branches';

-- Enable RLS on branches table (if not already enabled)
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

-- Create policy to allow admins to manage branches
-- Drop existing restrictive policies first
DROP POLICY IF EXISTS "Allow admin branch management" ON public.branches;

-- Create new policy allowing admins full access
CREATE POLICY "Allow admin branch management" ON public.branches
FOR ALL USING (
  (auth.jwt() ->> 'role'::text) = 'admin'::text
);

-- Alternative: If you want to disable RLS completely for branches table
-- ALTER TABLE public.branches DISABLE ROW LEVEL SECURITY;
