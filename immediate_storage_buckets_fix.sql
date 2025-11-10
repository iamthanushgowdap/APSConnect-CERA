-- IMMEDIATE FIX: Disable RLS on storage.buckets table

ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;

-- Now create the chat-attachments bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for the bucket
CREATE POLICY "Public Access to chat attachments" ON storage.objects FOR SELECT USING (bucket_id = 'chat-attachments');
CREATE POLICY "Authenticated users can upload chat files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'chat-attachments' AND auth.role() = 'authenticated');

-- Verify bucket creation
SELECT id, name, public FROM storage.buckets WHERE name = 'chat-attachments';
