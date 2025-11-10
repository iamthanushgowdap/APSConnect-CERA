-- Migration script to update user_preferences table with language and voice_enabled columns
-- Run this after the initial table creation

-- Add new columns if they don't exist
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en' CHECK (language IN ('en', 'hi', 'kn', 'te')),
ADD COLUMN IF NOT EXISTS voice_enabled BOOLEAN DEFAULT false;

-- Update the check constraint for theme if needed
ALTER TABLE user_preferences
DROP CONSTRAINT IF EXISTS user_preferences_theme_check,
ADD CONSTRAINT user_preferences_theme_check CHECK (theme IN ('light', 'dark'));

-- Update the check constraint for language
ALTER TABLE user_preferences
DROP CONSTRAINT IF EXISTS user_preferences_language_check,
ADD CONSTRAINT user_preferences_language_check CHECK (language IN ('en', 'hi', 'kn', 'te'));
