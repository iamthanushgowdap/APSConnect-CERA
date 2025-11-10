-- Test branch deletion with group cleanup
-- This will verify that when a branch is deleted, all its groups disappear

-- First, create a test branch to delete
-- INSERT INTO public.branches (name, created_at, updated_at)
-- VALUES ('TEST_DELETE_BRANCH', NOW(), NOW());

-- Create some test groups for the branch
-- INSERT INTO public.groups (id, name, type, branch, semester, description) VALUES
-- ('TEST_DELETE_BRANCH_official', 'Test Branch Department', 'official', 'TEST_DELETE_BRANCH', 'ALL', 'Test department'),
-- ('TEST_DELETE_BRANCH_1st-Sem_official', 'Test Branch 1st Sem', 'official', 'TEST_DELETE_BRANCH', '1st Sem', 'Test class');

-- Then run the deleteBranch function and check:
-- 1. Branch is deleted from branches table
-- 2. All groups are deleted from groups table
-- 3. All memberships are cleaned up

-- Verification queries:
SELECT 'Branches before deletion:' as check;
SELECT * FROM public.branches WHERE name = 'TEST_DELETE_BRANCH';

SELECT 'Groups before deletion:' as check;
SELECT id, name, branch FROM public.groups WHERE branch = 'TEST_DELETE_BRANCH';

-- After deletion, both should return no rows
