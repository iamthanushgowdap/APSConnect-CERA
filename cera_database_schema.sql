-- CERA Database Schema: Consolidated Tables
-- This schema includes all necessary tables for the CERA AI assistant to function.

-- 1. Branches Table
CREATE TABLE IF NOT EXISTS public.branches (
  name text NOT NULL PRIMARY KEY,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now()
);

-- 2. User Profiles Table (Central for roles, branch, semester)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id text NOT NULL PRIMARY KEY,
  email text NOT NULL UNIQUE,
  full_name text,
  role text DEFAULT 'student'::text CHECK (role = ANY (ARRAY['student'::text, 'faculty'::text, 'admin'::text, 'pending'::text, 'alumni'::text, 'rejected'::text])),
  branch text,
  semester text,
  usn text UNIQUE, -- University Seat Number (for students)
  faculty_title text, -- Title for faculty
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
  -- NOTE: You will need to ensure a FOREIGN KEY exists from this 'id' to the 'auth.users(id)' if using Supabase standard Auth
);

-- 3. Assignments Table
CREATE TABLE IF NOT EXISTS public.assignments (
  id text NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  course_name text NOT NULL,
  instructor_id text REFERENCES public.user_profiles(id),
  instructor_name text,
  due_date timestamp with time zone NOT NULL,
  total_marks integer DEFAULT 100,
  branch text NOT NULL,
  semester text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT assignments_pkey PRIMARY KEY (id)
);

-- 4. Attendance Records Table
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_uid text NOT NULL REFERENCES public.user_profiles(id),
  subject text NOT NULL,
  date date NOT NULL,
  period text NOT NULL,
  status text NOT NULL CHECK (status = ANY (ARRAY['present'::text, 'absent'::text])),
  branch text NOT NULL,
  semester text NOT NULL,
  marked_by text REFERENCES public.user_profiles(id),
  marked_by_name text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 5. Fee Records Table
CREATE TABLE IF NOT EXISTS public.fee_records (
  id text NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id text REFERENCES public.user_profiles(id),
  semester text NOT NULL,
  year integer NOT NULL,
  total_amount numeric NOT NULL,
  paid_amount numeric DEFAULT 0,
  due_date date NOT NULL,
  payment_status text DEFAULT 'pending'::text CHECK (payment_status = ANY (ARRAY['pending'::text, 'partial'::text, 'paid'::text, 'overdue'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 6. Timetables Table
CREATE TABLE IF NOT EXISTS public.timetables (
  id text NOT NULL PRIMARY KEY,
  branch text NOT NULL,
  semester text NOT NULL,
  schedule jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_updated_by text NOT NULL REFERENCES public.user_profiles(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Optional: Sample Data for Testing CERA (Execute only after running the DDL above)
INSERT INTO public.branches (name) VALUES ('CS'), ('EC') ON CONFLICT (name) DO NOTHING;

INSERT INTO public.user_profiles (id, email, full_name, role, branch, semester, usn) VALUES
('S_UID_12345', 'alice.j@college.edu', 'Alice Johnson', 'student', 'CS', 'S5', '1CS18CS001'),
('F_UID_67890', 'dr.smith@college.edu', 'Dr. Smith', 'faculty', 'EC', 'S7', NULL),
('A_UID_001', 'admin@college.edu', 'Head Admin', 'admin', 'ALL', 'ALL', NULL)
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

INSERT INTO public.assignments (id, title, course_name, instructor_id, due_date, branch, semester) VALUES
('ASS_101', 'AI Final Project', 'Artificial Intelligence', 'F_UID_67890', '2025-11-30 23:59:00+00', 'CS', 'S5'),
('ASS_102', 'Embedded Systems Report', 'Embedded Systems', 'F_UID_67890', '2025-12-15 23:59:00+00', 'EC', 'S7')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.fee_records (id, student_id, semester, year, total_amount, paid_amount, due_date, payment_status, notes) VALUES
('FEE_1', 'S_UID_12345', 'S5', 2025, 50000.00, 30000.00, '2025-11-01', 'partial', 'Semester fee installment 1'),
('FEE_2', 'S_UID_12345', 'S4', 2025, 48000.00, 48000.00, '2025-06-15', 'paid', 'Complete payment'),
('FEE_3', 'S_UID_12345', 'S3', 2024, 45000.00, 35000.00, '2024-12-01', 'partial', 'Pending balance'),
('FEE_4', '7bb12ed2-e7a1-434a-b815-a86d74656f42', 'S5', 2025, 52000.00, 52000.00, '2025-08-01', 'paid', 'Full semester payment'),
('FEE_5', '7bb12ed2-e7a1-434a-b815-a86d74656f42', 'S4', 2025, 50000.00, 25000.00, '2025-03-01', 'partial', 'First installment paid')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.timetables (id, branch, semester, schedule, last_updated_by) VALUES
('TT_CSE_S5', 'CSE', '5th Sem',
 '[
   {"day": "Monday", "entries": [{"type": "class", "batch": "", "period": 0, "subject": "TOC", "room_number": "201", "faculty_name": "Faculty", "subject_code": "BCS205", "is_lab_period": false}, {"type": "class", "batch": "", "period": 1, "subject": "TOC", "room_number": "201", "faculty_name": "Faculty", "subject_code": "BCS205", "is_lab_period": false}, {"type": "break", "batch": "", "period": 2, "subject": "Short Break", "room_number": "", "faculty_name": "", "subject_code": "", "is_lab_period": false}, {"type": "class", "batch": "", "period": 3, "subject": "TOC", "room_number": "201", "faculty_name": "Faculty", "subject_code": "BCS205", "is_lab_period": false}, {"type": "class", "batch": "", "period": 4, "subject": "no-class", "room_number": "", "faculty_name": "", "subject_code": "", "is_lab_period": false}, {"type": "break", "batch": "", "period": 5, "subject": "Lunch Break", "room_number": "", "faculty_name": "", "subject_code": "", "is_lab_period": false}, {"type": "class", "batch": "", "period": 6, "subject": "no-class", "room_number": "", "faculty_name": "", "subject_code": "", "is_lab_period": false}, {"type": "class", "batch": "", "period": 7, "subject": "no-class", "room_number": "", "faculty_name": "", "subject_code": "", "is_lab_period": false}, {"type": "class", "batch": "", "period": 8, "subject": "no-class", "room_number": "", "faculty_name": "", "subject_code": "", "is_lab_period": false}]}, {"day": "Tuesday", "entries": [{"type": "class", "batch": "", "period": 0, "subject": "TOC", "room_number": "201", "faculty_name": "Faculty", "subject_code": "BCS205", "is_lab_period": false}, {"type": "class", "batch": "", "period": 1, "subject": "no-class", "room_number": "", "faculty_name": "", "subject_code": "", "is_lab_period": false}, {"type": "break", "batch": "", "period": 2, "subject": "Short Break", "room_number": "", "faculty_name": "", "subject_code": "", "is_lab_period": false}, {"type": "class", "batch": "", "period": 3, "subject": "no-class", "room_number": "", "faculty_name": "", "subject_code": "", "is_lab_period": false}, {"type": "class", "batch": "", "period": 4, "subject": "no-class", "room_number": "", "faculty_name": "", "subject_code": "", "is_lab_period": false}, {"type": "break", "batch": "", "period": 5, "subject": "Lunch Break", "room_number": "", "faculty_name": "", "subject_code": "", "is_lab_period": false}, {"type": "class", "batch": "", "period": 6, "subject": "no-class", "room_number": "", "faculty_name": "", "subject_code": "", "is_lab_period": false}, {"type": "class", "batch": "", "period": 7, "subject": "no-class", "room_number": "", "faculty_name": "", "subject_code": "", "is_lab_period": false}, {"type": "class", "batch": "", "period": 8, "subject": "no-class", "room_number": "", "faculty_name": "", "subject_code": "", "is_lab_period": false}]}, {"day": "Wednesday", "entries": [{"type": "class", "batch": "", "period": 0, "subject": "CN LAB", "room_number": "B1 - 205", "faculty_name": "Faculty", "subject_code": "BSC208", "is_lab_period": false}, {"type": "class", "batch": "", "period": 1, "subject": "no-class", "room_number": "", "faculty_name": "", "subject_code": "", "is_lab_period": false}, {"type": "break", "batch": "", "period": 2, "subject": "Short Break", "room_number": "", "faculty_name": "", "subject_code": "", "is_lab_period": false}, {"type": "class", "batch": "", "period": 3, "subject": "no-class", "room_number": "", "faculty_name": "", "subject_code": "", "is_lab_period": false}, {"type": "class", "batch": "", "period": 4, "subject": "no-class", "room_number": "", "faculty_name": "", "subject_code": "", "is_lab_period": false}, {"type": "break", "batch": "", "period": 5, "subject": "Lunch Break", "room_number": "", "faculty_name": "", "subject_code": "", "is_lab_period": false}, {"type": "class", "batch": "", "period": 6, "subject": "no-class", "room_number": "", "faculty_name": "", "subject_code": "", "is_lab_period": false}, {"type": "class", "batch": "", "period": 7, "subject": "no-class", "room_number": "", "faculty_name": "", "subject_code": "", "is_lab_period": false}, {"type": "class", "batch": "", "period": 8, "subject": "no-class", "room_number": "", "faculty_name": "", "subject_code": "", "is_lab_period": false}]}, {"day": "Thursday", "entries": [{"type": "class", "batch": "", "period": 0, "subject": "no-class", "room_number": "", "faculty_name": "", "subject_code": "", "is_lab_period": false}, {"type": "class", "batch": "", "period": 1, "subject": "TOC", "room_number": "201", "faculty_name": "Faculty", "subject_code": "BCS205", "is_lab_period": false}, {"type": "break", "batch": "", "period": 2, "subject": "Short Break", "room_number": "", "faculty_name": "", "subject_code": "", "is_lab_period": false}, {"type": "class", "batch": "", "period": 3, "subject": "no-class", "room_number": "", "faculty_name": "", "subject_code": "", "is_lab_period": false}, {"type": "class", "batch": "", "period": 4, "subject": "no-class", "room_number": "", "faculty_name": "", "subject_code": "", "is_lab_period": false}, {"type": "break", "batch": "", "period": 5, "subject": "Lunch Break", "room_number": "", "faculty_name": "", "subject_code": "", "is_lab_period": false}, {"type": "class", "batch": "", "period": 6, "subject": "no-class", "room_number": "", "faculty_name": "", "subject_code": "", "is_lab_period": false}, {"type": "class", "batch": "", "period": 7, "subject": "no-class", "room_number": "", "faculty_name": "", "subject_code": "", "is_lab_period": false}, {"type": "class", "batch": "", "period": 8, "subject": "no-class", "room_number": "", "faculty_name": "", "subject_code": "", "is_lab_period": false}]}, {"day": "Friday", "entries": [{"type": "class", "batch": "", "period": 0, "subject": "no-class", "room_number": "", "faculty_name": "", "subject_code": "", "is_lab_period": false}, {"type": "class", "batch": "", "period": 1, "subject": "TOC", "room_number": "201", "faculty_name": "Faculty", "subject_code": "BCS205", "is_lab_period": false}, {"type": "break", "batch": "", "period": 2, "subject": "Short Break", "room_number": "", "faculty_name": "", "subject_code": "", "is_lab_period": false}, {"type": "class", "batch": "", "period": 3, "subject": "no-class", "room_number": "", "faculty_name": "", "subject_code": "", "is_lab_period": false}, {"type": "class", "batch": "", "period": 4, "subject": "no-class", "room_number": "", "faculty_name": "", "subject_code": "", "is_lab_period": false}, {"type": "break", "batch": "", "period": 5, "subject": "Lunch Break", "room_number": "", "faculty_name": "", "subject_code": "", "is_lab_period": false}, {"type": "class", "batch": "", "period": 6, "subject": "no-class", "room_number": "", "faculty_name": "", "subject_code": "", "is_lab_period": false}, {"type": "class", "batch": "", "period": 7, "subject": "no-class", "room_number": "", "faculty_name": "", "subject_code": "", "is_lab_period": false}, {"type": "class", "batch": "", "period": 8, "subject": "no-class", "room_number": "", "faculty_name": "", "subject_code": "", "is_lab_period": false}]}, {"day": "Saturday", "entries": [{"type": "class", "batch": "", "period": 0, "subject": "TOC", "room_number": "201", "faculty_name": "Faculty", "subject_code": "BCS205", "is_lab_period": false}, {"type": "class", "batch": "", "period": 1, "subject": "no-class", "room_number": "", "faculty_name": "", "subject_code": "", "is_lab_period": false}, {"type": "break", "batch": "", "period": 2, "subject": "Short Break", "room_number": "", "faculty_name": "", "subject_code": "", "is_lab_period": false}, {"type": "class", "batch": "", "period": 3, "subject": "CN LAB", "room_number": "B1 - 205", "faculty_name": "Faculty", "subject_code": "BSC208", "is_lab_period": false}, {"type": "class", "batch": "", "period": 4, "subject": "no-class", "room_number": "", "faculty_name": "", "subject_code": "", "is_lab_period": false}, {"type": "break", "batch": "", "period": 5, "subject": "Lunch Break", "room_number": "", "faculty_name": "", "subject_code": "", "is_lab_period": false}, {"type": "class", "batch": "", "period": 6, "subject": "no-class", "room_number": "", "faculty_name": "", "subject_code": "", "is_lab_period": false}, {"type": "class", "batch": "", "period": 7, "subject": "no-class", "room_number": "", "faculty_name": "", "subject_code": "", "is_lab_period": false}, {"type": "class", "batch": "", "period": 8, "subject": "no-class", "room_number": "", "faculty_name": "", "subject_code": "", "is_lab_period": false}]}]',
 'A_UID_001'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.attendance_records (id, student_uid, subject, date, period, status, branch, semester, marked_by, marked_by_name, created_at, updated_at) VALUES
('ATT_001', '7bb12ed2-e7a1-434a-b815-a86d74656f42', 'TOC', '2025-10-21', 0, 'present', 'CSE', '5th Sem', 'F_UID_67890', 'Faculty', now(), now()),
('ATT_002', '7bb12ed2-e7a1-434a-b815-a86d74656f42', 'TOC', '2025-10-21', 1, 'present', 'CSE', '5th Sem', 'F_UID_67890', 'Faculty', now(), now()),
('ATT_003', '7bb12ed2-e7a1-434a-b815-a86d74656f42', 'TOC', '2025-10-21', 3, 'present', 'CSE', '5th Sem', 'F_UID_67890', 'Faculty', now(), now()),
('ATT_004', '7bb12ed2-e7a1-434a-b815-a86d74656f42', 'TOC', '2025-10-22', 0, 'present', 'CSE', '5th Sem', 'F_UID_67890', 'Faculty', now(), now()),
('ATT_005', '7bb12ed2-e7a1-434a-b815-a86d74656f42', 'TOC', '2025-10-22', 1, 'absent', 'CSE', '5th Sem', 'F_UID_67890', 'Faculty', now(), now()),
('ATT_006', '7bb12ed2-e7a1-434a-b815-a86d74656f42', 'TOC', '2025-10-22', 3, 'present', 'CSE', '5th Sem', 'F_UID_67890', 'Faculty', now(), now()),
('ATT_007', '7bb12ed2-e7a1-434a-b815-a86d74656f42', 'CN LAB', '2025-10-23', 0, 'present', 'CSE', '5th Sem', 'F_UID_67890', 'Faculty', now(), now()),
('ATT_008', '7bb12ed2-e7a1-434a-b815-a86d74656f42', 'TOC', '2025-10-23', 1, 'present', 'CSE', '5th Sem', 'F_UID_67890', 'Faculty', now(), now()),
('ATT_009', '7bb12ed2-e7a1-434a-b815-a86d74656f42', 'TOC', '2025-10-24', 0, 'absent', 'CSE', '5th Sem', 'F_UID_67890', 'Faculty', now(), now()),
('ATT_010', '7bb12ed2-e7a1-434a-b815-a86d74656f42', 'CN LAB', '2025-10-24', 3, 'present', 'CSE', '5th Sem', 'F_UID_67890', 'Faculty', now(), now())
ON CONFLICT (id) DO NOTHING;
