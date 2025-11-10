-- Create site_settings table for real-time application configuration
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID DEFAULT '00000000-0000-0000-0000-000000000000'::uuid PRIMARY KEY,
  collegeLogoUrl TEXT,
  contactEmail TEXT,
  enableStudentRegistration BOOLEAN DEFAULT true,
  maintenanceMode BOOLEAN DEFAULT false,
  maintenanceMessage TEXT,
  socialFacebook TEXT,
  socialTwitter TEXT,
  socialLinkedIn TEXT,
  socialInstagram TEXT,
  socialGithub TEXT,
  enableAlumniTransition BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insert default settings record if it doesn't exist
INSERT INTO site_settings (id, collegeLogoUrl, contactEmail, enableStudentRegistration, maintenanceMode, maintenanceMessage, socialFacebook, socialTwitter, socialLinkedIn, socialInstagram, socialGithub, enableAlumniTransition)
VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  '',
  'info@apsconnect.example.com',
  true,
  false,
  'APSConnect is currently undergoing scheduled maintenance. We will be back shortly. Thank you for your patience.',
  '',
  '',
  '',
  '',
  '',
  false
) ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Create simple policy to allow all operations for now
-- You can refine these policies based on your specific auth setup
CREATE POLICY "Allow all operations on site settings" ON site_settings
  FOR ALL USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_site_settings_updated_at
    BEFORE UPDATE ON site_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable real-time for the table (if publication exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE site_settings;
    ELSE
        -- Create publication if it doesn't exist
        CREATE PUBLICATION supabase_realtime FOR TABLE site_settings;
    END IF;
EXCEPTION
    WHEN others THEN
        -- Ignore errors if publication already has the table
        RAISE NOTICE 'Could not add table to publication: %', SQLERRM;
END $$;
