-- IMMEDIATE FIX: Disable RLS on notifications table

ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- Verify notifications are now accessible
SELECT COUNT(*) as notifications_accessible FROM public.notifications;
