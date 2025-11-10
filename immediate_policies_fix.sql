-- IMMEDIATE FIX: Create policies for chat-attachments bucket

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public Access to chat attachments" ON storage.objects
FOR SELECT USING (bucket_id = 'chat-attachments');

-- Authenticated users can upload
CREATE POLICY "Authenticated users can upload chat files" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'chat-attachments' AND auth.role() = 'authenticated');

-- Users can update their own files
CREATE POLICY "Users can update their own chat files" ON storage.objects
FOR UPDATE USING (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own files
CREATE POLICY "Users can delete their own chat files" ON storage.objects
FOR DELETE USING (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Verify policies
SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
