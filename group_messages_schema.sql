-- Updated group_messages table with file attachment support
-- Run this SQL to update your existing table

-- First, add new columns for file attachments
ALTER TABLE public.group_messages
ADD COLUMN message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'audio', 'document', 'file'));

ALTER TABLE public.group_messages
ADD COLUMN file_name text;

ALTER TABLE public.group_messages
ADD COLUMN file_size bigint;

ALTER TABLE public.group_messages
ADD COLUMN file_type text;

ALTER TABLE public.group_messages
ADD COLUMN file_url text;

ALTER TABLE public.group_messages
ADD COLUMN attachments jsonb DEFAULT '[]'::jsonb;

-- Update existing records to have message_type = 'text'
UPDATE public.group_messages
SET message_type = 'text'
WHERE message_type IS NULL;

-- Make message_type NOT NULL after updating existing records
ALTER TABLE public.group_messages
ALTER COLUMN message_type SET NOT NULL;

-- Optional: Create an index for better query performance
CREATE INDEX idx_group_messages_group_id_timestamp
ON public.group_messages(group_id, timestamp DESC);

CREATE INDEX idx_group_messages_message_type
ON public.group_messages(message_type);

-- Optional: Create a separate table for file attachments if you want more detailed tracking
CREATE TABLE public.group_message_attachments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL,
  file_name text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  file_url text NOT NULL,
  uploaded_at timestamp with time zone DEFAULT now(),
  CONSTRAINT group_message_attachments_pkey PRIMARY KEY (id),
  CONSTRAINT group_message_attachments_message_id_fkey
    FOREIGN KEY (message_id) REFERENCES public.group_messages (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Create indexes for the attachments table
CREATE INDEX idx_group_message_attachments_message_id
ON public.group_message_attachments(message_id);
