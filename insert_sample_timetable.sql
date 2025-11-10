-- ============================================
-- CERA Sample Timetable Data Insertion
-- Run this in Supabase SQL Editor to add timetable data
-- ============================================

-- Create timetables table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.timetables (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    branch text NOT NULL,
    semester text NOT NULL,
    schedule jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT timetables_pkey PRIMARY KEY (id)
);

-- Insert sample timetable data for CSE 5th Sem
INSERT INTO public.timetables (branch, semester, schedule) VALUES
('CSE', '5th Sem',
'[
  {
    "day": "Monday",
    "entries": [
      {"period": 0, "type": "class", "subject": "TOC", "subject_code": "BCS205", "room_number": "201"},
      {"period": 1, "type": "class", "subject": "TOC", "subject_code": "BCS205", "room_number": "201"},
      {"period": 3, "type": "class", "subject": "TOC", "subject_code": "BCS205", "room_number": "201"}
    ]
  },
  {
    "day": "Tuesday",
    "entries": [
      {"period": 0, "type": "class", "subject": "CN LAB", "subject_code": "BSC208", "room_number": "B1-205"},
      {"period": 3, "type": "class", "subject": "CN LAB", "subject_code": "BSC208", "room_number": "B1-205"},
      {"period": 6, "type": "class", "subject": "CN LAB", "subject_code": "BSC208", "room_number": "B1-205"},
      {"period": 7, "type": "class", "subject": "CN LAB", "subject_code": "BSC208", "room_number": "B1-205"}
    ]
  },
  {
    "day": "Wednesday",
    "entries": [
      {"period": 0, "type": "class", "subject": "TOC", "subject_code": "BCS205", "room_number": "201"},
      {"period": 1, "type": "class", "subject": "TOC", "subject_code": "BCS205", "room_number": "201"}
    ]
  },
  {
    "day": "Thursday",
    "entries": [
      {"period": 3, "type": "class", "subject": "TOC", "subject_code": "BCS205", "room_number": "201"},
      {"period": 6, "type": "class", "subject": "CN LAB", "subject_code": "BSC208", "room_number": "B1-205"},
      {"period": 7, "type": "class", "subject": "CN LAB", "subject_code": "BSC208", "room_number": "B1-205"}
    ]
  },
  {
    "day": "Friday",
    "entries": [
      {"period": 0, "type": "class", "subject": "TOC", "subject_code": "BCS205", "room_number": "201"},
      {"period": 1, "type": "class", "subject": "TOC", "subject_code": "BCS205", "room_number": "201"}
    ]
  },
  {
    "day": "Saturday",
    "entries": []
  }
]'::jsonb);

-- Verify the data was inserted
SELECT 'Timetables inserted' as status, COUNT(*) as count FROM timetables WHERE branch = 'CSE' AND semester = '5th Sem';

-- Expected output: Timetables inserted: 1
