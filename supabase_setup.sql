-- Complete Supabase setup for chat with file storage and reactions

-- MANUAL STEPS REQUIRED (Do these in Supabase Dashboard):

-- 1. Create Storage Bucket:
--   - Go to Supabase Dashboard > Storage
--   - Click "Create bucket"
--   - Name: chat-attachments
--   - Make it public
--   - Set file size limit to 10MB

-- 2. Set up Storage Policies:
--   - Go to Storage > chat-attachments > Policies
--   - Create these policies:

-- Policy 1: Allow uploads (for authenticated users)
/*
CREATE POLICY "Users can upload chat files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'chat-attachments'
  AND auth.role() = 'authenticated'
);
*/

-- Policy 2: Allow viewing/downloading (public)
/*
CREATE POLICY "Anyone can view chat files" ON storage.objects
FOR SELECT USING (bucket_id = 'chat-attachments');
*/

-- Policy 3: Allow users to delete their own files
/*
CREATE POLICY "Users can delete their own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'chat-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
*/

-- 3. Enable Real-Time for group_messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;

-- 4. Add reactions column to group_messages table
ALTER TABLE public.group_messages
ADD COLUMN IF NOT EXISTS reactions jsonb DEFAULT '[]'::jsonb;

-- 5. Update existing records to have empty reactions array
UPDATE public.group_messages
SET reactions = '[]'::jsonb
WHERE reactions IS NULL;

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_group_messages_reactions
ON public.group_messages USING GIN (reactions);

CREATE INDEX IF NOT EXISTS idx_group_messages_timestamp_desc
ON public.group_messages (timestamp DESC);

-- INSTRUCTIONS:
-- 1. Run steps 1-2 MANUALLY in Supabase Dashboard first
-- 2. Then run the SQL commands (steps 3-6) in Supabase SQL Editor
-- 3. Files will then upload to Supabase Storage instead of blob URLs
-- 4. Downloads will work properly with permanent URLs
