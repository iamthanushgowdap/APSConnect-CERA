-- Check the actual data types in the tables
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name IN ('group_members', 'user_profiles')
  AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- Check a sample of the data
SELECT user_id, group_id FROM public.group_members LIMIT 5;

-- Check user_profiles id type
SELECT id FROM public.user_profiles LIMIT 1;
