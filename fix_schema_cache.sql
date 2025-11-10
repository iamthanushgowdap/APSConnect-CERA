-- Force refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- Or try this alternative
SELECT pg_notify('pgrst', 'reload schema');

-- Check if the site_settings table is accessible
SELECT * FROM site_settings LIMIT 1;

-- Check if the column exists
SELECT column_name FROM information_schema.columns
WHERE table_name = 'site_settings' AND table_schema = 'public';

-- Test the specific query that's failing
SELECT enableAlumniTransition FROM site_settings;

-- Check if RLS is enabled on site_settings
SELECT tablename, rowsecurity FROM pg_tables
WHERE tablename = 'site_settings';
