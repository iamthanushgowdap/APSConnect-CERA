-- IMMEDIATE FIX: Create basic uploads bucket

INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true);

-- Allow public read access
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'uploads');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'uploads' AND auth.role() = 'authenticated');

-- Verify bucket creation
SELECT id, name, public FROM storage.buckets WHERE name = 'uploads';
