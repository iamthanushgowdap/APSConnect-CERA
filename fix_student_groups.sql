-- Check if student groups exist
SELECT id, name, type, branch, semester FROM public.groups WHERE type = 'student' ORDER BY branch, semester;

-- Check student group assignments
SELECT up.email, up.branch, up.semester, COUNT(gm.group_id) as student_groups
FROM public.user_profiles up
LEFT JOIN public.group_members gm ON up.id = gm.user_id
LEFT JOIN public.groups g ON gm.group_id = g.id
WHERE up.role = 'student' AND up.is_approved = true AND g.type = 'student'
GROUP BY up.id, up.email, up.branch, up.semester;

-- If student groups don't exist, create them
INSERT INTO public.groups (id, name, type, branch, semester, description) VALUES
('CSE_1st-Sem_student', 'CSE 1st Sem Discussion', 'student', 'CSE', '1st Sem', 'Peer-to-peer discussion for CSE 1st semester'),
('CSE_3rd-Sem_student', 'CSE 3rd Sem Discussion', 'student', 'CSE', '3rd Sem', 'Peer-to-peer discussion for CSE 3rd semester'),
('CSE_5th-Sem_student', 'CSE 5th Sem Discussion', 'student', 'CSE', '5th Sem', 'Peer-to-peer discussion for CSE 5th semester'),
('CSE_7th-Sem_student', 'CSE 7th Sem Discussion', 'student', 'CSE', '7th Sem', 'Peer-to-peer discussion for CSE 7th semester'),
('EC_1st-Sem_student', 'EC 1st Sem Discussion', 'student', 'EC', '1st Sem', 'Peer-to-peer discussion for EC 1st semester'),
('EC_3rd-Sem_student', 'EC 3rd Sem Discussion', 'student', 'EC', '3rd Sem', 'Peer-to-peer discussion for EC 3rd semester'),
('EC_5th-Sem_student', 'EC 5th Sem Discussion', 'student', 'EC', '5th Sem', 'Peer-to-peer discussion for EC 5th semester'),
('EC_7th-Sem_student', 'EC 7th Sem Discussion', 'student', 'EC', '7th Sem', 'Peer-to-peer discussion for EC 7th semester'),
('ISE_1st-Sem_student', 'ISE 1st Sem Discussion', 'student', 'ISE', '1st Sem', 'Peer-to-peer discussion for ISE 1st semester'),
('ISE_3rd-Sem_student', 'ISE 3rd Sem Discussion', 'student', 'ISE', '3rd Sem', 'Peer-to-peer discussion for ISE 3rd semester'),
('ISE_5th-Sem_student', 'ISE 5th Sem Discussion', 'student', 'ISE', '5th Sem', 'Peer-to-peer discussion for ISE 5th semester'),
('ISE_7th-Sem_student', 'ISE 7th Sem Discussion', 'student', 'ISE', '7th Sem', 'Peer-to-peer discussion for ISE 7th semester'),
('ME_1st-Sem_student', 'ME 1st Sem Discussion', 'student', 'ME', '1st Sem', 'Peer-to-peer discussion for ME 1st semester'),
('ME_3rd-Sem_student', 'ME 3rd Sem Discussion', 'student', 'ME', '3rd Sem', 'Peer-to-peer discussion for ME 3rd semester'),
('ME_5th-Sem_student', 'ME 5th Sem Discussion', 'student', 'ME', '5th Sem', 'Peer-to-peer discussion for ME 5th semester'),
('ME_7th-Sem_student', 'ME 7th Sem Discussion', 'student', 'ME', '7th Sem', 'Peer-to-peer discussion for ME 7th semester')
ON CONFLICT (id) DO NOTHING;

-- Assign students to their student discussion groups (can_post = true)
INSERT INTO public.group_members (group_id, user_id, role, can_post)
SELECT g.id, up.id, up.role, true
FROM public.groups g, public.user_profiles up
WHERE g.type = 'student'
  AND up.role = 'student' AND up.is_approved = true
  AND up.branch IS NOT NULL AND up.semester IS NOT NULL
  AND g.branch = up.branch AND g.semester = up.semester
ON CONFLICT (group_id, user_id) DO NOTHING;
