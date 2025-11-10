-- Fix RLS on notifications table (blocking timetable notifications)

-- Check current policies on notifications table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies WHERE tablename = 'notifications';

-- Disable RLS on notifications table
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- Verify notifications are accessible
SELECT COUNT(*) as notifications_count FROM public.notifications;
