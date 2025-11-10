-- Add missing semesters (2nd, 4th, 6th, 8th) to all existing branches

-- Get all existing branches
SELECT name FROM public.branches ORDER BY name;

-- Add missing class groups for all branches
INSERT INTO public.groups (id, name, type, branch, semester, description)
SELECT
  branch || '_2nd-Sem_official',
  branch || ' - 2nd Sem',
  'official',
  branch,
  '2nd Sem',
  branch || ' 2nd semester official announcements'
FROM public.branches
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.groups (id, name, type, branch, semester, description)
SELECT
  branch || '_4th-Sem_official',
  branch || ' - 4th Sem',
  'official',
  branch,
  '4th Sem',
  branch || ' 4th semester official announcements'
FROM public.branches
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.groups (id, name, type, branch, semester, description)
SELECT
  branch || '_6th-Sem_official',
  branch || ' - 6th Sem',
  'official',
  branch,
  '6th Sem',
  branch || ' 6th semester official announcements'
FROM public.branches
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.groups (id, name, type, branch, semester, description)
SELECT
  branch || '_8th-Sem_official',
  branch || ' - 8th Sem',
  'official',
  branch,
  '8th Sem',
  branch || ' 8th semester official announcements'
FROM public.branches
ON CONFLICT (id) DO NOTHING;

-- Add missing student discussion groups
INSERT INTO public.groups (id, name, type, branch, semester, description)
SELECT
  branch || '_2nd-Sem_student',
  branch || ' 2nd Sem Discussion',
  'student',
  branch,
  '2nd Sem',
  'Peer-to-peer discussion for ' || branch || ' 2nd semester'
FROM public.branches
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.groups (id, name, type, branch, semester, description)
SELECT
  branch || '_4th-Sem_student',
  branch || ' 4th Sem Discussion',
  'student',
  branch,
  '4th Sem',
  'Peer-to-peer discussion for ' || branch || ' 4th semester'
FROM public.branches
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.groups (id, name, type, branch, semester, description)
SELECT
  branch || '_6th-Sem_student',
  branch || ' 6th Sem Discussion',
  'student',
  branch,
  '6th Sem',
  'Peer-to-peer discussion for ' || branch || ' 6th semester'
FROM public.branches
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.groups (id, name, type, branch, semester, description)
SELECT
  branch || '_8th-Sem_student',
  branch || ' 8th Sem Discussion',
  'student',
  branch,
  '8th Sem',
  'Peer-to-peer discussion for ' || branch || ' 8th semester'
FROM public.branches
ON CONFLICT (id) DO NOTHING;

-- Assign admin to all the new groups
INSERT INTO public.group_members (group_id, user_id, role, can_post)
SELECT g.id, '3700d0d9-96a8-44f8-9d63-3d9a2ad57ae2', 'admin', true
FROM public.groups g
WHERE g.semester IN ('2nd Sem', '4th Sem', '6th Sem', '8th Sem')
  AND g.id NOT IN (
    SELECT gm.group_id FROM public.group_members gm
    WHERE gm.user_id = '3700d0d9-96a8-44f8-9d63-3d9a2ad57ae2'
  )
ON CONFLICT (group_id, user_id) DO NOTHING;

-- Verify the additions
SELECT 'Total groups after adding semesters:' as status, COUNT(*) as count FROM public.groups;
SELECT branch, semester, type, COUNT(*) as count
FROM public.groups
GROUP BY branch, semester, type
ORDER BY branch, semester;
