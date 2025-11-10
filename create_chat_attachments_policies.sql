-- Create policies for chat-attachments bucket manually

-- Enable RLS on storage.objects (should already be enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
DROP POLICY IF EXISTS "Public Access to chat attachments" ON storage.objects;
CREATE POLICY "Public Access to chat attachments" ON storage.objects
FOR SELECT USING (bucket_id = 'chat-attachments');

-- Create policy for authenticated users to upload
DROP POLICY IF EXISTS "Authenticated users can upload chat files" ON storage.objects;
CREATE POLICY "Authenticated users can upload chat files" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'chat-attachments' AND auth.role() = 'authenticated');

-- Create policy for users to update their own files
DROP POLICY IF EXISTS "Users can update their own chat files" ON storage.objects;
CREATE POLICY "Users can update their own chat files" ON storage.objects
FOR UPDATE USING (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create policy for users to delete their own files
DROP POLICY IF EXISTS "Users can delete their own chat files" ON storage.objects;
CREATE POLICY "Users can delete their own chat files" ON storage.objects
FOR DELETE USING (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Verify policies were created
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'objects'
    AND schemaname = 'storage'
    AND policyname LIKE '%chat%';

-- Verify bucket exists
SELECT id, name, public FROM storage.buckets WHERE name = 'chat-attachments';
