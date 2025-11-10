-- Create the CORRECT bucket that the app is actually using

-- The app uses 'chat-attachments' bucket, not 'uploads'
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true);

-- Set up proper policies for chat-attachments bucket
CREATE POLICY "Public Access to chat attachments" ON storage.objects FOR SELECT USING (bucket_id = 'chat-attachments');
CREATE POLICY "Authenticated users can upload chat files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'chat-attachments' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update their own chat files" ON storage.objects FOR UPDATE USING (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own chat files" ON storage.objects FOR DELETE USING (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Verify bucket creation
SELECT id, name, public FROM storage.buckets WHERE name = 'chat-attachments';
