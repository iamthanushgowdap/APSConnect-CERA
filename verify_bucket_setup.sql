-- Verify bucket exists and is properly configured
SELECT
    id,
    name,
    public,
    created_at
FROM storage.buckets
WHERE name = 'chat-attachments';

-- Check if policies exist for the bucket
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'objects'
    AND schemaname = 'storage'
    AND policyname LIKE '%chat%';

-- Test bucket access
SELECT COUNT(*) as files_in_bucket
FROM storage.objects
WHERE bucket_id = 'chat-attachments';
