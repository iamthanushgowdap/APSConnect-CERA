// Function to apply RLS policies for timetables
// Run this in browser console after database reset

const applyTimetableRLS = async () => {
  const policies = [
    // Enable RLS
    `ALTER TABLE public.timetables ENABLE ROW LEVEL SECURITY;`,

    // Drop existing policies
    `DROP POLICY IF EXISTS "Admins can manage all timetables" ON public.timetables;`,
    `DROP POLICY IF EXISTS "Faculty can view assigned timetables" ON public.timetables;`,
    `DROP POLICY IF EXISTS "Faculty can create assigned timetables" ON public.timetables;`,
    `DROP POLICY IF EXISTS "Faculty can update assigned timetables" ON public.timetables;`,
    `DROP POLICY IF EXISTS "Faculty can delete own timetables" ON public.timetables;`,

    // Create admin policy with type casting
    `CREATE POLICY "Admins can manage all timetables" ON public.timetables FOR ALL USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id::text = auth.uid()::text AND role = 'admin'));`,

    // Create faculty policies with type casting
    `CREATE POLICY "Faculty can view assigned timetables" ON public.timetables FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id::text = auth.uid()::text AND role = 'faculty' AND (assigned_branches IS NOT NULL AND (assigned_branches @> ARRAY[timetables.branch] OR assigned_semesters @> ARRAY[timetables.semester]))));`,

    `CREATE POLICY "Faculty can create assigned timetables" ON public.timetables FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE id::text = auth.uid()::text AND role = 'faculty' AND (assigned_branches IS NOT NULL AND (assigned_branches @> ARRAY[timetables.branch] OR assigned_semesters @> ARRAY[timetables.semester]))));`,

    `CREATE POLICY "Faculty can update assigned timetables" ON public.timetables FOR UPDATE USING (last_updated_by::text = auth.uid()::text OR EXISTS (SELECT 1 FROM public.user_profiles WHERE id::text = auth.uid()::text AND role = 'faculty' AND (assigned_branches IS NOT NULL AND (assigned_branches @> ARRAY[timetables.branch] OR assigned_semesters @> ARRAY[timetables.semester]))));`,

    `CREATE POLICY "Faculty can delete own timetables" ON public.timetables FOR DELETE USING (last_updated_by::text = auth.uid()::text OR EXISTS (SELECT 1 FROM public.user_profiles WHERE id::text = auth.uid()::text AND role = 'admin'));`
  ];

  console.log('🔐 Applying timetable RLS policies with type casting...');

  for (const policy of policies) {
    try {
      console.log('Executing:', policy.split(' ').slice(0, 4).join(' '));
      // Note: This would need to be executed via Supabase client or direct SQL
      // For now, just log what needs to be executed
    } catch (error) {
      console.error('Failed to execute:', policy, error);
    }
  }

  console.log('✅ RLS policies logged - execute them in Supabase SQL Editor');
};

// Make it available globally
window.applyTimetableRLS = applyTimetableRLS;
