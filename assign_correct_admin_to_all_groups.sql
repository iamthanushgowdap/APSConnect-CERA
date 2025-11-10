-- Assign the CORRECT admin user to ALL groups (including EEE)
-- Admin: admin@gmail.com, ID: 3700d0d9-96a8-44f8-9d63-3d9a2ad57ae2

INSERT INTO public.group_members (group_id, user_id, role, can_post)
SELECT g.id, '3700d0d9-96a8-44f8-9d63-3d9a2ad57ae2', 'admin', true
FROM public.groups g
WHERE g.id NOT IN (
  SELECT gm.group_id FROM public.group_members gm
  WHERE gm.user_id = '3700d0d9-96a8-44f8-9d63-3d9a2ad57ae2'
)
ON CONFLICT (group_id, user_id) DO NOTHING;

-- Verify all groups are now assigned
SELECT 'Total groups in database:' as check, COUNT(*) as count FROM public.groups;
SELECT 'Admin group memberships after assignment:' as check, COUNT(*) as count
FROM public.group_members gm
WHERE gm.user_id = '3700d0d9-96a8-44f8-9d63-3d9a2ad57ae2';
