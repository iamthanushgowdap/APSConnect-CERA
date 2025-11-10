-- ============================================
-- CERA Sample Data Insertion Script
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Update user profile with student_id
-- Replace the UUID with your actual logged-in user's ID
UPDATE user_profiles 
SET 
    student_id = '1MS21CS001',
    usn = '1MS21CS001',
    branch = 'CSE',
    semester = '5th Sem'
WHERE id = '7bb12ed2-e7a1-434a-b815-a86d74656f42';

-- Step 2: Insert Fee Records
INSERT INTO fee_records (
    student_id, semester, year,
    tuition_fee, hostel_fee, library_fee, lab_fee, other_fees,
    total_amount, paid_amount, due_date, payment_status
) VALUES 
(
    '1MS21CS001', '5th Sem', 2024,
    50000.00, 30000.00, 5000.00, 5000.00, 5000.00,
    95000.00, 45000.00, '2024-12-31', 'partial'
),
(
    '1MS21CS001', '4th Sem', 2024,
    50000.00, 30000.00, 5000.00, 5000.00, 5000.00,
    95000.00, 95000.00, '2024-06-30', 'paid'
),
(
    '1MS21CS001', '3rd Sem', 2023,
    45000.00, 28000.00, 4000.00, 4000.00, 4000.00,
    85000.00, 85000.00, '2023-12-31', 'paid'
);

-- Step 3: Insert Attendance Records
INSERT INTO attendance_records (
    student_uid, subject, date, period, status, branch, semester, marked_by_name
) VALUES 
('1MS21CS001', 'Theory of Computation', '2024-10-23', '1', 'present', 'CSE', '5th Sem', 'Dr. Smith'),
('1MS21CS001', 'Theory of Computation', '2024-10-22', '1', 'present', 'CSE', '5th Sem', 'Dr. Smith'),
('1MS21CS001', 'Computer Networks', '2024-10-23', '3', 'present', 'CSE', '5th Sem', 'Prof. Johnson'),
('1MS21CS001', 'Computer Networks', '2024-10-22', '3', 'absent', 'CSE', '5th Sem', 'Prof. Johnson'),
('1MS21CS001', 'Theory of Computation', '2024-10-21', '1', 'present', 'CSE', '5th Sem', 'Dr. Smith'),
('1MS21CS001', 'Computer Networks', '2024-10-21', '3', 'present', 'CSE', '5th Sem', 'Prof. Johnson'),
('1MS21CS001', 'Theory of Computation', '2024-10-20', '1', 'present', 'CSE', '5th Sem', 'Dr. Smith'),
('1MS21CS001', 'Computer Networks', '2024-10-20', '3', 'present', 'CSE', '5th Sem', 'Prof. Johnson'),
('1MS21CS001', 'Theory of Computation', '2024-10-19', '1', 'present', 'CSE', '5th Sem', 'Dr. Smith'),
('1MS21CS001', 'Computer Networks', '2024-10-19', '3', 'absent', 'CSE', '5th Sem', 'Prof. Johnson');

-- Step 4: Verify the data
SELECT 'User Profile' as table_name, COUNT(*) as count FROM user_profiles WHERE student_id = '1MS21CS001'
UNION ALL
SELECT 'Fee Records', COUNT(*) FROM fee_records WHERE student_id = '1MS21CS001'
UNION ALL
SELECT 'Attendance Records', COUNT(*) FROM attendance_records WHERE student_uid = '1MS21CS001';

-- Expected output:
-- User Profile: 1
-- Fee Records: 3
-- Attendance Records: 10
