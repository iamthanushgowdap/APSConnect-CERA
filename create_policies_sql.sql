-- CREATE POLICIES FOR CHAT-ATTACHMENTS BUCKET

-- Public read access (anyone can view files)
CREATE POLICY "Public Access to chat attachments" ON storage.objects
FOR SELECT USING (bucket_id = 'chat-attachments');

-- Authenticated users can upload files
CREATE POLICY "Authenticated users can upload chat files" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'chat-attachments' AND auth.role() = 'authenticated');

-- Users can update their own files (files in their user folder)
CREATE POLICY "Users can update their own chat files" ON storage.objects
FOR UPDATE USING (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own files
CREATE POLICY "Users can delete their own chat files" ON storage.objects
FOR DELETE USING (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- VERIFY POLICIES WERE CREATED
SELECT
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE tablename = 'objects'
    AND schemaname = 'storage'
    AND policyname LIKE '%chat%';

-- VERIFY BUCKET EXISTS
SELECT id, name, public FROM storage.buckets WHERE name = 'chat-attachments';
