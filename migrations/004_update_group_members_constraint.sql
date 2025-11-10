-- Update the group_members role check constraint to include 'alumni'
ALTER TABLE public.group_members
DROP CONSTRAINT group_members_role_check;

ALTER TABLE public.group_members
ADD CONSTRAINT group_members_role_check
CHECK (role = ANY (ARRAY['admin'::text, 'faculty'::text, 'student'::text, 'alumni'::text]));
