-- FINAL BUCKET CREATION - If programmatic creation fails

-- Force create the chat-attachments bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Force create policies (ignore if they already exist)
DO $$
BEGIN
    -- Public read access
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access to chat attachments') THEN
        CREATE POLICY "Public Access to chat attachments" ON storage.objects FOR SELECT USING (bucket_id = 'chat-attachments');
    END IF;

    -- Authenticated upload access
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload chat files') THEN
        CREATE POLICY "Authenticated users can upload chat files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'chat-attachments' AND auth.role() = 'authenticated');
    END IF;

    -- Update access
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own chat files') THEN
        CREATE POLICY "Users can update their own chat files" ON storage.objects FOR UPDATE USING (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;

    -- Delete access
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own chat files') THEN
        CREATE POLICY "Users can delete their own chat files" ON storage.objects FOR DELETE USING (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;
END $$;

-- Verify bucket and policies
SELECT
    b.id as bucket_id,
    b.name as bucket_name,
    b.public as is_public,
    COUNT(p.policyname) as policies_count
FROM storage.buckets b
LEFT JOIN pg_policies p ON p.tablename = 'objects' AND p.schemaname = 'storage'
WHERE b.name = 'chat-attachments'
GROUP BY b.id, b.name, b.public;
