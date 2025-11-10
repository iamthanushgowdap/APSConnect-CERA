-- Check RLS policies on groups table (might need admin access)
SELECT schemaname, tablename, policyname, pe                                                                                              uuuuuuuuiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii
WHERE tablename = 'groups';

-- If groups table has restrictive RLS, add admin policy
CREATE POLICY "Allow admin group management" ON public.groups
FOR ALL USING (
  (auth.jwt() ->> 'role'::text) = 'admin'::text
);
