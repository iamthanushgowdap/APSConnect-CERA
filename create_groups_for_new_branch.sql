-- Create groups for a new branch (replace 'NEW_BRANCH_NAME' with actual branch)
-- This creates department, class, and student discussion groups

-- Department group
INSERT INTO public.groups (id, name, type, branch, semester, description) VALUES
('NEW_BRANCH_NAME_official', 'NEW_BRANCH_NAME Department', 'official', 'NEW_BRANCH_NAME', 'ALL', 'Department announcements for NEW_BRANCH_NAME')
ON CONFLICT (id) DO NOTHING;

-- Class groups for all semesters
INSERT INTO public.groups (id, name, type, branch, semester, description) VALUES
('NEW_BRANCH_NAME_1st-Sem_official', 'NEW_BRANCH_NAME - 1st Sem', 'official', 'NEW_BRANCH_NAME', '1st Sem', 'NEW_BRANCH_NAME 1st semester official'),
('NEW_BRANCH_NAME_3rd-Sem_official', 'NEW_BRANCH_NAME - 3rd Sem', 'official', 'NEW_BRANCH_NAME', '3rd Sem', 'NEW_BRANCH_NAME 3rd semester official'),
('NEW_BRANCH_NAME_5th-Sem_official', 'NEW_BRANCH_NAME - 5th Sem', 'official', 'NEW_BRANCH_NAME', '5th Sem', 'NEW_BRANCH_NAME 5th semester official'),
('NEW_BRANCH_NAME_7th-Sem_official', 'NEW_BRANCH_NAME - 7th Sem', 'official', 'NEW_BRANCH_NAME', '7th Sem', 'NEW_BRANCH_NAME 7th semester official')
ON CONFLICT (id) DO NOTHING;

-- Student discussion groups
INSERT INTO public.groups (id, name, type, branch, semester, description) VALUES
('NEW_BRANCH_NAME_1st-Sem_student', 'NEW_BRANCH_NAME 1st Sem Discussion', 'student', 'NEW_BRANCH_NAME', '1st Sem', 'Peer-to-peer discussion for NEW_BRANCH_NAME 1st semester'),
('NEW_BRANCH_NAME_3rd-Sem_student', 'NEW_BRANCH_NAME 3rd Sem Discussion', 'student', 'NEW_BRANCH_NAME', '3rd Sem', 'Peer-to-peer discussion for NEW_BRANCH_NAME 3rd semester'),
('NEW_BRANCH_NAME_5th-Sem_student', 'NEW_BRANCH_NAME 5th Sem Discussion', 'student', 'NEW_BRANCH_NAME', '5th Sem', 'Peer-to-peer discussion for NEW_BRANCH_NAME 5th semester'),
('NEW_BRANCH_NAME_7th-Sem_student', 'NEW_BRANCH_NAME 7th Sem Discussion', 'student', 'NEW_BRANCH_NAME', '7th Sem', 'Peer-to-peer discussion for NEW_BRANCH_NAME 7th semester')
ON CONFLICT (id) DO NOTHING;

-- Assign admin to all the new groups
INSERT INTO public.group_members (group_id, user_id, role, can_post)
SELECT g.id, 'ADMIN_USER_ID_HERE', 'admin', true
FROM public.groups g
WHERE g.branch = 'NEW_BRANCH_NAME'
ON CONFLICT (group_id, user_id) DO NOTHING;
