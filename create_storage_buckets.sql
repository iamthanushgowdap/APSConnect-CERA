-- Create Supabase Storage Buckets for file uploads

-- Create a public bucket for general file uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true);

-- Create a private bucket for sensitive documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('private-uploads', 'private-uploads', false);

-- Create bucket for profile pictures
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Set up RLS policies for the uploads bucket (public access for reading)
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'uploads');
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'uploads' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update their own uploads" ON storage.objects FOR UPDATE USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own uploads" ON storage.objects FOR DELETE USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Set up policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- List all buckets to verify creation
SELECT id, name, public FROM storage.buckets;
