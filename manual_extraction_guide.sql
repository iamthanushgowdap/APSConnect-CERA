-- MANUAL DATA EXTRACTION FROM DUMP FILE
-- Since automated extraction failed, here's how to manually get ALL your data

-- ===========================================
-- STEP 1: Open last_dump.sql in a text editor
-- STEP 2: Search for these patterns and copy ALL matches
-- ===========================================

-- SEARCH PATTERN 1: Basic INSERT statements
-- Find: INSERT INTO public\.
-- Copy ALL lines that start with this pattern

-- SEARCH PATTERN 2: Multi-line INSERT statements
-- Find: VALUES
-- Look backwards for the INSERT INTO statement

-- SEARCH PATTERN 3: COPY statements (alternative format)
-- Find: COPY public\.
-- These are PostgreSQL's bulk data format

-- SEARCH PATTERN 4: Data values
-- Find: \(
-- Look for parenthetical data blocks

-- ===========================================
-- COMMON LOCATIONS FOR DATA IN DUMP FILES
-- ===========================================

-- Data usually appears AFTER all:
-- CREATE TABLE statements
-- CREATE INDEX statements
-- ALTER TABLE statements
-- GRANT statements
-- COMMENT statements

-- Data usually appears BEFORE:
-- ALTER TABLE ... OWNER TO
-- REVOKE statements
-- Final comments

-- ===========================================
-- WHAT TO LOOK FOR IN YOUR DUMP
-- ===========================================

-- Look for blocks like this:
INSERT INTO public.user_profiles (id, user_id, full_name, branch, semester, created_at) VALUES
    ('uuid-here', 'auth-uuid', 'Student Name', 'CSE', '6', '2024-01-01 00:00:00+00'),
    ('another-uuid', 'another-auth-uuid', 'Another Student', 'ECE', '4', '2024-01-02 00:00:00+00');

-- Or COPY format like this:
COPY public.fee_records (id, student_id, total_amount, paid_amount, due_date, created_at) FROM stdin;
uuid-here	auth-uuid	50000.00	25000.00	2024-12-31 00:00:00+00	2024-01-01 00:00:00+00
another-uuid	another-auth-uuid	45000.00	45000.00	2024-12-31 00:00:00+00	2024-01-02 00:00:00+00
\.

-- ===========================================
-- EXTRACTION CHECKLIST
-- ===========================================

-- [ ] user_profiles data
-- [ ] user_preferences data
-- [ ] fee_records data
-- [ ] attendance_records data
-- [ ] assignments data
-- [ ] timetables data
-- [ ] subjects data
-- [ ] groups data
-- [ ] group_members data
-- [ ] group_messages data
-- [ ] messages data
-- [ ] study_materials data
-- [ ] job_postings data
-- [ ] mentorship_requests data
-- [ ] fundraising_campaigns data
-- [ ] student_fundraising_status data
-- [ ] admin_settings data
-- [ ] site_settings data
-- [ ] notifications data
-- [ ] reports data
-- [ ] drafts data
-- [ ] branches data

-- ===========================================
-- PASTE ALL EXTRACTED DATA BELOW THIS LINE
-- ===========================================

-- YOUR DATA GOES HERE - COPY FROM THE DUMP FILE
