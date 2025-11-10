-- Migration: Create drafts table for form data storage
CREATE TABLE drafts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  form_id TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX drafts_user_form_idx ON drafts (user_id, form_id);

-- Add comment explaining table purpose
COMMENT ON TABLE drafts IS 'Stores user form drafts migrated from localStorage';
