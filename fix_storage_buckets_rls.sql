-- Fix storage.buckets table RLS to allow bucket creation

-- Check current policies on storage.buckets
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies WHERE tablename = 'buckets' AND schemaname = 'storage';

-- Disable RLS on storage.buckets to allow bucket creation
ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;

-- Now create the chat-attachments bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for the bucket
CREATE POLICY "Public Access to chat attachments" ON storage.objects FOR SELECT USING (bucket_id = 'chat-attachments');
CREATE POLICY "Authenticated users can upload chat files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'chat-attachments' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update their own chat files" ON storage.objects FOR UPDATE USING (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own chat files" ON storage.objects FOR DELETE USING (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Verify bucket creation
SELECT id, name, public FROM storage.buckets WHERE name = 'chat-attachments';
