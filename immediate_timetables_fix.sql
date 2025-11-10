-- IMMEDIATE FIX: Disable RLS on timetables table

ALTER TABLE public.timetables DISABLE ROW LEVEL SECURITY;

-- Verify timetables are now accessible
SELECT COUNT(*) as timetables_accessible FROM public.timetables;
