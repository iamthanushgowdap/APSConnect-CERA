-- Timetable RLS Policies - Fixed for UUID/text compatibility
-- Execute these commands in Supabase SQL Editor or via CLI

-- 1. Enable RLS on timetables table
ALTER TABLE public.timetables ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if any
DROP POLICY IF EXISTS "Admins can manage all timetables" ON public.timetables;
DROP POLICY IF EXISTS "Faculty can view assigned timetables" ON public.timetables;
DROP POLICY IF EXISTS "Faculty can create assigned timetables" ON public.timetables;
DROP POLICY IF EXISTS "Faculty can update assigned timetables" ON public.timetables;
DROP POLICY IF EXISTS "Faculty can delete own timetables" ON public.timetables;

-- 3. Create new policies with proper type casting

-- Allow all operations for admins (cast auth.uid() to text)
CREATE POLICY "Admins can manage all timetables" ON public.timetables
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id::text = auth.uid()::text AND role = 'admin'
  )
);

-- Faculty can view timetables for their assigned branches/semesters
CREATE POLICY "Faculty can view assigned timetables" ON public.timetables
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id::text = auth.uid()::text
      AND role = 'faculty'
      AND (
        assigned_branches IS NOT NULL AND
        (assigned_branches @> ARRAY[timetables.branch] OR
         assigned_semesters @> ARRAY[timetables.semester])
      )
  )
);

-- Faculty can create timetables for their assigned branches/semesters
CREATE POLICY "Faculty can create assigned timetables" ON public.timetables
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id::text = auth.uid()::text
      AND role = 'faculty'
      AND (
        assigned_branches IS NOT NULL AND
        (assigned_branches @> ARRAY[timetables.branch] OR
         assigned_semesters @> ARRAY[timetables.semester])
      )
  )
);

-- Faculty can update timetables for their assigned branches/semesters
CREATE POLICY "Faculty can update assigned timetables" ON public.timetables
FOR UPDATE USING (
  last_updated_by::text = auth.uid()::text OR
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id::text = auth.uid()::text
      AND role = 'faculty'
      AND (
        assigned_branches IS NOT NULL AND
        (assigned_branches @> ARRAY[timetables.branch] OR
         assigned_semesters @> ARRAY[timetables.semester])
      )
  )
);

-- Faculty can delete timetables they created or admins can delete any
CREATE POLICY "Faculty can delete own timetables" ON public.timetables
FOR DELETE USING (
  last_updated_by::text = auth.uid()::text OR
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id::text = auth.uid()::text AND role = 'admin'
  )
);
