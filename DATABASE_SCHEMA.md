# Database Schema Documentation

## Overview
This document contains the complete database schema for the SIP (Student Information Portal) application.

## Tables

### 1. user_profiles
Main user table containing all user information and roles.

**Key Fields:**
- `id` (text, primary key) - User ID
- `email` (text, unique) - User email
- `full_name` (text) - Display name
- `role` (text) - 'student', 'faculty', 'admin', 'pending', 'alumni', 'rejected'
- `student_id` (text, unique) - Student ID number
- `usn` (text) - University seat number
- `branch` (text) - Academic branch/department
- `semester` (text) - Current semester
- `assigned_branches` (ARRAY) - For faculty: branches they teach
- `assigned_semesters` (ARRAY) - For faculty: semesters they teach
- `is_approved` (boolean) - Approval status
- `display_name` (text) - Alternative display name

### 2. groups
Group definitions for chat system.

**Key Fields:**
- `id` (text, primary key) - Group ID
- `name` (text) - Display name
- `type` (text) - 'official' or 'student'
- `branch` (text) - Academic branch
- `semester` (text) - Academic semester
- `description` (text) - Group description

### 3. group_members
Membership information for groups.

**Key Fields:**
- `group_id` (text, FK to groups) - Reference to group
- `user_id` (text, FK to user_profiles) - Reference to user
- `role` (text) - 'admin', 'faculty', 'student'
- `can_post` (boolean) - Whether user can post messages
- `joined_at` (timestamp) - When user joined

### 4. group_messages
Messages within groups.

**Key Fields:**
- `group_id` (text, FK to groups) - Reference to group
- `author_uid` (text) - Message author ID
- `author_name` (text) - Author display name
- `content` (text) - Message content
- `timestamp` (timestamp) - When message was sent

### 5. assignments
Academic assignments.

**Key Fields:**
- `title` (text) - Assignment title
- `description` (text) - Assignment details
- `course_id` (text) - Related course
- `instructor_id` (text, FK) - Instructor who created it
- `due_date` (timestamp) - Submission deadline
- `total_marks` (integer) - Maximum marks
- `submission_type` (text) - 'file', 'text', or 'link'
- `branch` (text) - Target branch
- `semester` (text) - Target semester

### 6. attendance_records
Student attendance tracking.

**Key Fields:**
- `student_uid` (text, FK) - Student ID
- `subject` (text) - Subject name
- `date` (date) - Attendance date
- `period` (text) - Class period
- `status` (text) - 'present' or 'absent'
- `marked_by` (text, FK) - Who marked attendance

### 7. fee_records
Fee payment tracking.

**Key Fields:**
- `student_id` (text, FK) - Student ID
- `semester` (text) - Academic semester
- `year` (integer) - Academic year
- `total_amount` (numeric) - Total fees due
- `paid_amount` (numeric) - Amount paid
- `payment_status` (text) - 'pending', 'partial', 'paid', 'overdue'

### 8. study_materials
Educational resources.

**Key Fields:**
- `title` (text) - Material title
- `description` (text) - Description
- `branch` (text) - Target branch
- `semester` (text) - Target semester
- `subject` (text) - Subject name
- `attachments` (jsonb) - File attachments
- `uploaded_by` (text, FK) - Uploader ID

### 9. subjects
Course subjects.

**Key Fields:**
- `name` (text) - Subject name
- `code` (text) - Subject code
- `branch` (text) - Academic branch
- `semester` (text) - Academic semester
- `type` (text) - 'class' or 'lab'
- `assignedFacultyUids` (ARRAY) - Faculty assigned to teach

### 10. timetables
Class schedules.

**Key Fields:**
- `branch` (text) - Academic branch
- `semester` (text) - Academic semester
- `schedule` (jsonb) - Schedule data
- `last_updated_by` (text) - Who last updated

### 11. fundraising_campaigns
Fundraising campaigns.

**Key Fields:**
- `title` (text) - Campaign title
- `goal_amount` (numeric) - Fundraising goal
- `current_amount` (numeric) - Amount raised
- `start_date` / `end_date` (date) - Campaign duration
- `target_branches` / `target_semesters` (ARRAY) - Target audience

### 12. notifications
User notifications.

**Key Fields:**
- `user_id` (text, FK) - Target user
- `title` (text) - Notification title
- `message` (text) - Notification content
- `type` (text) - 'info', 'success', 'warning', 'error', etc.
- `read` (boolean) - Read status

### 13. reports
User-submitted reports with specific recipient selection.

**Key Fields:**
- `submittedByUid` (text, FK) - Reporter ID
- `recipientType` (text) - 'faculty' or 'admin'
- `recipient_uid` (text, FK, optional) - Specific faculty/admin member ID
- `recipient_name` (text, optional) - Display name of recipient
- `reportContent` (text) - Report details
- `submittedAt` (timestamp) - When report was submitted
- `status` (text) - 'new', 'viewed', 'resolved', 'archived'
- `contextBranch` (text) - Student branch context
- `contextSemester` (text) - Student semester context

**RLS Policies:**
- Students can insert their own reports
- Students can read their own reports
- Faculty can read reports addressed to them
- Admins can read all reports
- Faculty/admins can update reports for status changes

### 14. admin_settings
Administrative configuration.

**Key Fields:**
- `setting_key` (text, unique) - Setting identifier
- `managed_branches` (ARRAY) - Branches admin manages
- `setting_value` (jsonb) - Setting data

### 15. branches
Available academic branches.

**Key Fields:**
- `name` (text, primary key) - Branch name

## Relationships

- **user_profiles** is the central table referenced by most other tables
- **groups** → **group_members** → **group_messages** (hierarchical chat system)
- **subjects** and **timetables** link to academic branches/semesters
- **assignments**, **attendance_records**, **fee_records** link to students
- **fundraising_campaigns** can target specific branches/semesters

## RLS Policies

All tables have Row Level Security (RLS) enabled with appropriate policies:
- Users can only access their own data or data they're authorized to see
- Group access is restricted to members
- Admin operations require admin role
- Faculty operations restricted to assigned branches/semesters

## Indexes

Key indexes exist on frequently queried fields:
- Branch and semester fields across multiple tables
- User ID foreign keys
- Unique constraints on emails and student IDs

---
*Last updated: October 20, 2025*
