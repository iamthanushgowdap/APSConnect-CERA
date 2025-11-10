-- Remove Faculty Lounge from admin assignments
-- Faculty Lounge should only be for faculty, not admins

DELETE FROM public.group_members
WHERE group_id = 'faculty_lounge'
  AND user_id IN (
    SELECT id FROM public.user_profiles WHERE role = 'admin'
  );

-- Verify removal
SELECT 'Faculty Lounge assignments after cleanup:' as check,
       up.email, up.role
FROM public.group_members gm
JOIN public.user_profiles up ON gm.user_id = up.id
WHERE gm.group_id = 'faculty_lounge';
