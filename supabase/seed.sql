-- Enable RLS on timetables table
ALTER TABLE public.timetables ENABLE ROW LEVEL SECURITY;

-- Policy 1: Admins can do anything
CREATE POLICY "Admins can manage all timetables" ON public.timetables
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy 2: Faculty can view timetables for their assigned branches/semesters
CREATE POLICY "Faculty can view assigned timetables" ON public.timetables
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
      AND role = 'faculty'
      AND (
        assigned_branches @> ARRAY[timetables.branch]
        OR assigned_semesters @> ARRAY[timetables.semester]
      )
  )
);

-- Policy 3: Faculty can insert timetables for their assigned branches/semesters
CREATE POLICY "Faculty can create assigned timetables" ON public.timetables
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
      AND role = 'faculty'
      AND (
        assigned_branches @> ARRAY[timetables.branch]
        OR assigned_semesters @> ARRAY[timetables.semester]
      )
  )
);

-- Policy 4: Faculty can update timetables they created or are assigned to
CREATE POLICY "Faculty can update assigned timetables" ON public.timetables
FOR UPDATE USING (
  last_updated_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
      AND role = 'faculty'
      AND (
        assigned_branches @> ARRAY[timetables.branch]
        OR assigned_semesters @> ARRAY[timetables.semester]
      )
  )
);

-- Policy 5: Faculty can delete timetables they created
CREATE POLICY "Faculty can delete own timetables" ON public.timetables
FOR DELETE USING (
  last_updated_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
