-- Create notifications table for real-time notifications
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('assignment_deadline', 'fee_due', 'low_attendance', 'timetable_update', 'fundraising_campaign')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    href TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read BOOLEAN DEFAULT false
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read) WHERE read = false;

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
-- Allow users to view their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert notifications for themselves OR allow authenticated users to insert system notifications
CREATE POLICY "Users can insert notifications for themselves or system notifications" ON notifications
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR
        auth.role() = 'authenticated'
    );

-- Allow users to update their own notifications
CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to delete their own notifications
CREATE POLICY "Users can delete their own notifications" ON notifications
    FOR DELETE USING (auth.uid() = user_id);

-- Allow service role to manage all notifications (for system-generated notifications)
CREATE POLICY "Service role can manage all notifications" ON notifications
    FOR ALL USING (auth.role() = 'service_role');
