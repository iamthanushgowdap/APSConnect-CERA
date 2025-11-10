-- Comprehensive fix for EEE branch groups visibility

-- 1. Check if EEE branch exists
SELECT * FROM public.branches WHERE name = 'EEE';

-- 2. Check if EEE groups exist
SELECT id, name, branch, semester, type FROM public.groups WHERE branch = 'EEE';

-- 3. If groups don't exist, create them manually
INSERT INTO public.groups (id, name, type, branch, semester, description) VALUES
('EEE_official', 'EEE Department', 'official', 'EEE', 'ALL', 'Department announcements for EEE'),
('EEE_1st-Sem_official', 'EEE - 1st Sem', 'official', 'EEE', '1st Sem', 'EEE 1st semester official'),
('EEE_3rd-Sem_official', 'EEE - 3rd Sem', 'official', 'EEE', '3rd Sem', 'EEE 3rd semester official'),
('EEE_5th-Sem_official', 'EEE - 5th Sem', 'official', 'EEE', '5th Sem', 'EEE 5th semester official'),
('EEE_7th-Sem_official', 'EEE - 7th Sem', 'official', 'EEE', '7th Sem', 'EEE 7th semester official'),
('EEE_1st-Sem_student', 'EEE 1st Sem Discussion', 'student', 'EEE', '1st Sem', 'Peer-to-peer discussion for EEE 1st semester'),
('EEE_3rd-Sem_student', 'EEE 3rd Sem Discussion', 'student', 'EEE', '3rd Sem', 'Peer-to-peer discussion for EEE 3rd semester'),
('EEE_5th-Sem_student', 'EEE 5th Sem Discussion', 'student', 'EEE', '5th Sem', 'Peer-to-peer discussion for EEE 5th semester'),
('EEE_7th-Sem_student', 'EEE 7th Sem Discussion', 'student', 'EEE', '7th Sem', 'Peer-to-peer discussion for EEE 7th semester')
ON CONFLICT (id) DO NOTHING;

-- 4. Assign admin to all EEE groups (replace with actual admin ID)
INSERT INTO public.group_members (group_id, user_id, role, can_post)
SELECT g.id, 'e319d9e9-fa72-4043-98ae-9384091c14a5', 'admin', true
FROM public.groups g
WHERE g.branch = 'EEE'
ON CONFLICT (group_id, user_id) DO NOTHING;

-- 5. Fix RLS policies to ensure visibility
ALTER TABLE public.groups DISABLE ROW LEVEL SECURITY;

-- OR enable with simple policy
-- ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all access to groups" ON public.groups FOR ALL USING (true);

-- 6. Verify everything is working
SELECT 'EEE Groups:' as check, COUNT(*) as count FROM public.groups WHERE branch = 'EEE';
SELECT 'Admin EEE assignments:' as check, COUNT(*) as count
FROM public.group_members gm
JOIN public.groups g ON gm.group_id = g.id
WHERE gm.user_id = 'e319d9e9-fa72-4043-98ae-9384091c14a5' AND g.branch = 'EEE';
