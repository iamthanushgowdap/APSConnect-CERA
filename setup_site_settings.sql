-- Setup site_settings table with collegename column and default record

-- Add collegename column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'site_settings'
                   AND column_name = 'collegename') THEN
        ALTER TABLE site_settings ADD COLUMN collegename TEXT;
    END IF;
END $$;

-- Insert or update the default site_settings record
INSERT INTO site_settings (
    id,
    collegename,
    collegelogourl,
    contactemail,
    socialfacebook,
    socialtwitter,
    sociallinkedin,
    socialinstagram,
    socialgithub,
    enablealumnitransition,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'APS College',
    NULL,
    'info@apsconnect.example.com',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    false,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    collegename = EXCLUDED.collegename,
    contactemail = EXCLUDED.contactemail,
    updated_at = NOW()
WHERE site_settings.id = '00000000-0000-0000-0000-000000000000';

-- Verify the record exists
SELECT * FROM site_settings WHERE id = '00000000-0000-0000-0000-000000000000';
