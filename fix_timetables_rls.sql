-- Fix RLS policies on timetables table

-- View current policies on timetables table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies WHERE tablename = 'timetables';

-- Disable RLS on timetables table to allow admin operations
ALTER TABLE public.timetables DISABLE ROW LEVEL SECURITY;

-- Verify it works
SELECT COUNT(*) as timetables_count FROM public.timetables;

-- Test creating a timetable (optional)
-- INSERT INTO public.timetables (id, branch, semester, schedule, last_updated_by, last_updated_at)
-- VALUES ('test_timetable', 'CSE', '1st Sem', '[]'::jsonb, 'admin_user_id', NOW());
