-- IMMEDIATE FIX: Create the chat-attachments bucket that the app needs

INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true);

-- Allow public read access
CREATE POLICY "Public Access to chat attachments" ON storage.objects FOR SELECT USING (bucket_id = 'chat-attachments');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload chat files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'chat-attachments' AND auth.role() = 'authenticated');

-- Verify bucket creation
SELECT id, name, public FROM storage.buckets WHERE name = 'chat-attachments';
