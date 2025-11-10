-- IMMEDIATE FIX: Disable RLS on subjects table

ALTER TABLE public.subjects DISABLE ROW LEVEL SECURITY;

-- Verify it works
SELECT COUNT(*) as subjects_accessible FROM public.subjects;
