# 🎓 APS Connect - Complete Project Guide

> **Last Updated**: November 4, 2025  
> **Version**: 1.0.3  
> **Status**: Production Ready ✅  
> **Database Schema**: ✅ Updated with actual Supabase export

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Database Schema](#database-schema)
5. [Authentication System](#authentication-system)
6. [CERA AI Assistant](#cera-ai-assistant)
7. [Setup Instructions](#setup-instructions)
8. [Environment Variables](#environment-variables)
9. [Development Workflow](#development-workflow)
10. [Deployment Guide](#deployment-guide)
11. [Key Features by Role](#key-features-by-role)
12. [API Endpoints](#api-endpoints)
13. [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

**APS Connect** is a comprehensive Student Information Portal (SIP) built for educational institutions. It provides role-based dashboards for **Students**, **Faculty**, **Admin**, and **Alumni** with real-time features and AI-powered assistance.

### **Core Features**
- ✅ Role-based authentication and authorization
- ✅ AI-powered assistant (CERA) using Google Gemini
- ✅ Real-time notifications and chat
- ✅ Academic management (timetables, attendance, assignments)
- ✅ Fee management and tracking
- ✅ Social features (posts, clubs, groups)
- ✅ File upload and storage
- ✅ PWA support (installable app)
- ✅ Dark/Light theme
- ✅ Multi-language support (in CERA)

---

## 🛠 Technology Stack

### **Frontend**
```json
{
  "framework": "Next.js 15.3.2",
  "language": "TypeScript 5.9.3",
  "ui-library": "Radix UI + shadcn/ui",
  "styling": "TailwindCSS 3.4.1",
  "animations": "Framer Motion 11.3.19 + GSAP 3.13.0",
  "forms": "React Hook Form 7.52.1 + Zod 3.23.8",
  "charts": "Recharts 2.12.7 + ApexCharts 5.3.5",
  "icons": "Lucide React 0.416.0"
}
```

### **Backend**
```json
{
  "runtime": "Next.js API Routes (Serverless)",
  "database": "Supabase (PostgreSQL)",
  "authentication": "Supabase Auth (JWT)",
  "storage": "Supabase Storage",
  "realtime": "Supabase Realtime (WebSocket)",
  "ai": "Google Gemini 2.5 Flash API"
}
```

### **Development Tools**
- **Build**: Next.js Turbopack
- **Linting**: ESLint
- **Package Manager**: npm
- **PWA**: next-pwa 5.6.0

---

## 📁 Project Structure

```
APS-Connect/
│
├── src/                          # Main source code
│   ├── ai/                       # AI integration
│   │   └── ceraAssistant.js      # CERA core logic (413 lines)
│   │
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               # Authentication pages
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── forgot-password/page.tsx
│   │   │
│   │   ├── admin/                # Admin Dashboard
│   │   │   ├── page.tsx          # Main dashboard
│   │   │   ├── users/            # User management
│   │   │   ├── attendance/       # Attendance management
│   │   │   ├── timetables/       # Timetable management
│   │   │   ├── subjects/         # Subject management
│   │   │   ├── fee-management/   # Fee tracking
│   │   │   └── settings/         # System settings
│   │   │
│   │   ├── faculty/              # Faculty Dashboard
│   │   │   ├── page.tsx
│   │   │   ├── assignments/      # Create/manage assignments
│   │   │   ├── attendance/       # Mark attendance
│   │   │   ├── timetables/       # View schedules
│   │   │   └── reports/          # Student reports
│   │   │
│   │   ├── student/              # Student Dashboard
│   │   │   ├── page.tsx
│   │   │   ├── assignments/      # View assignments
│   │   │   ├── attendance/       # View attendance
│   │   │   ├── fee-details/      # Payment status
│   │   │   ├── timetable/        # Class schedule
│   │   │   └── study-materials/  # Access resources
│   │   │
│   │   ├── alumni/               # Alumni Portal
│   │   │   ├── page.tsx
│   │   │   ├── directory/        # Alumni directory
│   │   │   └── jobs/             # Job postings
│   │   │
│   │   ├── api/                  # API Routes
│   │   │   ├── cera/query/route.js     # CERA query handler
│   │   │   ├── admin/                  # Admin APIs
│   │   │   └── generate-pdf/route.ts   # PDF generation
│   │   │
│   │   ├── cera/page.tsx         # CERA chat interface
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Landing page
│   │
│   ├── components/               # React Components
│   │   ├── auth-provider.tsx     # ⭐ Authentication Context
│   │   ├── CERAChat.tsx          # ⭐ CERA UI Component
│   │   ├── ui/                   # 59 reusable UI components
│   │   ├── layout/               # Navbar, Footer
│   │   ├── admin/                # Admin-specific components
│   │   ├── assignments/          # Assignment components
│   │   ├── timetables/           # Timetable components
│   │   └── notifications/        # Notification components
│   │
│   ├── lib/                      # ⭐ Core Utilities
│   │   ├── supabase-utils.ts     # Database operations (1734 lines)
│   │   ├── supabase.js           # Supabase client
│   │   ├── notification-manager.ts  # Notification engine
│   │   ├── groups-utils.ts       # Group management
│   │   ├── supabase-storage.ts   # File uploads
│   │   └── calendar-utils.ts     # ICS calendar generation
│   │
│   ├── types/                    # TypeScript Definitions
│   │   └── index.ts              # Global types (521 lines)
│   │
│   └── config/
│       └── site.ts               # Site configuration
│
├── public/                       # Static Assets
│   ├── manifest.json             # PWA manifest
│   ├── service-worker.js         # Service worker
│   └── icons/                    # App icons
│
├── migrations/                   # Database Migrations
│   ├── 001_create_drafts_table.sql
│   ├── 002_create_groups_tables.sql
│   ├── 003_populate_groups.sql
│   └── 004_update_group_members_constraint.sql
│
├── .env.local                    # Environment variables (create this)
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── tailwind.config.ts            # Tailwind config
└── next.config.ts                # Next.js config
```

---

## 🗄️ Database Schema

> ⚠️ **Accurate Schema**: This is the actual schema exported from Supabase (November 2025)

### **Complete Table List** (23 Tables)

1. `user_profiles` - User accounts and profiles
2. `assignments` - Course assignments
3. `attendance_records` - Student attendance
4. `fee_records` - Fee payment records
5. `timetables` - Class schedules
6. `subjects` - Course subjects
7. `groups` - Chat groups
8. `group_members` - Group membership
9. `group_messages` - Chat messages
10. `notifications` - User notifications
11. `study_materials` - Educational resources
12. `user_preferences` - User settings
13. `fundraising_campaigns` - Fundraising events
14. `student_fundraising_status` - Fundraising payment status
15. `jobs` - Job postings (alumni portal)
16. `job_postings` - Job listings
17. `mentorship_requests` - Mentorship program
18. `reports` - Bug/issue reports
19. `site_settings` - System configuration
20. `admin_settings` - Admin preferences
21. `branches` - Academic branches/departments
22. `drafts` - Form draft storage
23. `posts` - Social feed posts

---

### **Core Tables (Detailed)**

#### 1. **user_profiles** (Central User Table) ⭐
```sql
CREATE TABLE public.user_profiles (
  id text NOT NULL PRIMARY KEY,                    -- Auth UUID from Supabase Auth
  email text NOT NULL UNIQUE,
  full_name text,
  avatar_url text,
  display_name text,
  
  -- Role & Status
  role text DEFAULT 'student'::text CHECK (role = ANY (ARRAY[
    'student'::text, 'faculty'::text, 'admin'::text, 
    'pending'::text, 'alumni'::text, 'rejected'::text
  ])),
  status text DEFAULT 'pending'::text,
  is_approved boolean DEFAULT true,
  
  -- Student Info
  usn text,                                        -- University Seat Number
  student_id text UNIQUE,
  branch text,                                     -- e.g., "CSE", "ECE", "ME"
  semester text,                                   -- e.g., "1st Sem", "5th Sem"
  year_of_study integer,
  graduation_year integer,
  
  -- Faculty Info
  assigned_branches text[],                        -- For faculty only
  assigned_semesters text[],                       -- For faculty only
  faculty_title text,
  
  -- Alumni Info
  current_position text,
  current_company text,
  placement_company text,
  placement_job_title text,
  is_available_for_mentoring boolean DEFAULT false,
  
  -- Contact & Profile
  phone text,
  address text,
  location text,
  bio text,
  summary text,
  pronouns text,
  
  -- Skills & Experience (JSONB arrays)
  skills text[],
  interests text[],
  education jsonb DEFAULT '[]'::jsonb,
  experience jsonb DEFAULT '[]'::jsonb,
  projects jsonb DEFAULT '[]'::jsonb,
  certifications jsonb DEFAULT '[]'::jsonb,
  achievements jsonb DEFAULT '[]'::jsonb,
  
  -- Social Links
  social_links jsonb DEFAULT '{}'::jsonb,
  linkedin_url text,
  github_url text,
  portfolio_url text,
  
  -- Approval Tracking
  approved_by_uid text REFERENCES user_profiles(id),
  approved_by_display_name text,
  approval_date timestamp with time zone,
  rejected_by_uid text REFERENCES user_profiles(id),
  rejected_by_display_name text,
  rejected_date timestamp with time zone,
  rejection_reason text,
  
  -- Other
  preferences jsonb DEFAULT '{}'::jsonb,
  referral_info text,
  password text,                                   -- Legacy field
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

**⚠️ Critical Notes**:
- `id` is Supabase Auth UUID (NOT auto-generated)
- `student_id` and `usn` are different fields
- Alumni detected via `graduation_year` < current year

---

#### 2. **assignments**
```sql
CREATE TABLE public.assignments (
  id text NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  instructions text,
  
  -- Course Info
  course_id text,
  course_name text NOT NULL,
  branch text,
  semester text,
  
  -- Instructor Info
  instructor_id text REFERENCES user_profiles(id),
  instructor_name text,
  
  -- Assignment Details
  due_date timestamp with time zone NOT NULL,
  posted_at timestamp with time zone DEFAULT now(),
  total_marks integer DEFAULT 100,
  submission_type text DEFAULT 'file'::text CHECK (
    submission_type = ANY (ARRAY['file'::text, 'text'::text, 'link'::text])
  ),
  
  -- Files & Status
  attachments jsonb DEFAULT '[]'::jsonb,
  is_published boolean DEFAULT true,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

---

#### 3. **attendance_records** ⚠️
```sql
CREATE TABLE public.attendance_records (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- ⚠️ CRITICAL: student_uid stores AUTH UUID (NOT USN!)
  student_uid text NOT NULL REFERENCES user_profiles(id),
  
  -- Attendance Details
  subject text NOT NULL,
  date date NOT NULL,
  period text NOT NULL,
  status text NOT NULL CHECK (status = ANY (ARRAY['present'::text, 'absent'::text])),
  
  -- Context
  branch text NOT NULL,
  semester text NOT NULL,
  
  -- Marked By
  marked_by text REFERENCES user_profiles(id),
  marked_by_name text,
  notes text,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

**⚠️ CRITICAL**: `student_uid` stores Supabase Auth UUID, NOT USN!

---

#### 4. **fee_records** ⚠️
```sql
CREATE TABLE public.fee_records (
  id text NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- ⚠️ CRITICAL: student_id stores AUTH UUID (NOT USN!)
  student_id text REFERENCES user_profiles(id),
  
  -- Fee Breakdown
  semester text NOT NULL,
  year integer NOT NULL,
  tuition_fee numeric DEFAULT 0,
  hostel_fee numeric DEFAULT 0,
  library_fee numeric DEFAULT 0,
  lab_fee numeric DEFAULT 0,
  other_fees numeric DEFAULT 0,
  total_amount numeric NOT NULL,
  paid_amount numeric DEFAULT 0,
  
  -- Payment Info
  due_date date NOT NULL,
  payment_status text DEFAULT 'pending'::text CHECK (
    payment_status = ANY (ARRAY[
      'pending'::text, 'partial'::text, 'paid'::text, 'overdue'::text
    ])
  ),
  payment_method text,
  transaction_id text,
  paid_at timestamp with time zone,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

**⚠️ CRITICAL**: `student_id` stores Supabase Auth UUID, NOT USN!

---

#### 5. **timetables**
```sql
CREATE TABLE public.timetables (
  id text NOT NULL PRIMARY KEY,
  branch text NOT NULL,
  semester text NOT NULL,
  
  -- Schedule stored as JSONB (array of day/period objects)
  schedule jsonb NOT NULL DEFAULT '[]'::jsonb,
  
  -- Tracking
  last_updated_by text NOT NULL,
  last_updated_at timestamp with time zone,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

---

#### 6. **subjects**
```sql
CREATE TABLE public.subjects (
  id text NOT NULL PRIMARY KEY DEFAULT (gen_random_uuid())::text,
  name text NOT NULL,
  code text NOT NULL,
  branch text NOT NULL,
  semester text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['class'::text, 'lab'::text])),
  room_number text,
  assignedFacultyUids text[] DEFAULT '{}'::text[],
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

---

#### 7. **groups** (Chat System)
```sql
CREATE TABLE public.groups (
  id text NOT NULL PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['official'::text, 'student'::text])),
  branch text NOT NULL,
  semester text NOT NULL,
  description text,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

**Group Types**:
- `official` - Faculty can post, students read-only
- `student` - All members can post

---

#### 8. **group_members**
```sql
CREATE TABLE public.group_members (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id text NOT NULL REFERENCES groups(id),
  user_id text NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY[
    'admin'::text, 'faculty'::text, 'student'::text, 'alumni'::text
  ])),
  can_post boolean DEFAULT false,
  joined_at timestamp with time zone DEFAULT now()
);
```

---

#### 9. **group_messages**
```sql
CREATE TABLE public.group_messages (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id text NOT NULL REFERENCES groups(id),
  
  -- Author Info
  author_uid text NOT NULL,
  author_name text NOT NULL,
  author_avatar_url text,
  
  -- Message Content
  content text NOT NULL,
  message_type text DEFAULT 'text'::text CHECK (message_type = ANY (ARRAY[
    'text'::text, 'image'::text, 'video'::text, 
    'audio'::text, 'document'::text, 'file'::text
  ])),
  
  -- Attachments
  attachments jsonb DEFAULT '[]'::jsonb,
  file_name text,
  file_size bigint,
  file_type text,
  file_url text,
  
  -- Reactions
  reactions jsonb DEFAULT '[]'::jsonb,
  
  -- Timestamps
  timestamp timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);
```

---

#### 10. **notifications**
```sql
CREATE TABLE public.notifications (
  id text NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  type text NOT NULL CHECK (type = ANY (ARRAY[
    'assignment_deadline'::text,
    'fee_due'::text,
    'low_attendance'::text,
    'timetable_update'::text,
    'fundraising_campaign'::text,
    'event'::text,
    'group_message'::text
  ])),
  title text NOT NULL,
  message text NOT NULL,
  href text,
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);
```

---

#### 11. **study_materials**
```sql
CREATE TABLE public.study_materials (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  branch text NOT NULL,
  semester text NOT NULL,
  subject text,
  
  -- Files
  attachments jsonb DEFAULT '[]'::jsonb,
  
  -- Uploaded By
  uploaded_by text NOT NULL REFERENCES user_profiles(id),
  uploaded_by_display_name text NOT NULL,
  
  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);
```

---

#### 12. **user_preferences**
```sql
CREATE TABLE public.user_preferences (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id),
  theme text DEFAULT 'light'::text CHECK (theme = ANY (ARRAY['light'::text, 'dark'::text])),
  language text DEFAULT 'en'::text CHECK (language = ANY (ARRAY[
    'en'::text, 'hi'::text, 'kn'::text, 'te'::text
  ])),
  voice_enabled boolean DEFAULT false,
  notification_settings jsonb DEFAULT '{}'::jsonb,
  managed_branches text[] DEFAULT '{}'::text[],
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

---

### **Additional Tables**

#### 13. **fundraising_campaigns**
```sql
CREATE TABLE public.fundraising_campaigns (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  goal_amount numeric NOT NULL DEFAULT 0,
  current_amount numeric DEFAULT 0,
  
  -- Targeting
  branch text,
  semester text,
  target_branches text[],
  target_semesters text[],
  
  -- Dates
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date NOT NULL DEFAULT (CURRENT_DATE + '30 days'::interval),
  event_date timestamp with time zone,
  event_location text,
  
  -- Status
  status text NOT NULL DEFAULT 'active'::text CHECK (
    status = ANY (ARRAY['active'::text, 'completed'::text, 'cancelled'::text])
  ),
  
  -- Other
  qr_code_image_url text,
  contact_details text,
  createdByUid text REFERENCES user_profiles(id),
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

#### 14. **student_fundraising_status**
```sql
CREATE TABLE public.student_fundraising_status (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES fundraising_campaigns(id),
  student_uid text NOT NULL,
  status text NOT NULL CHECK (status = ANY (ARRAY[
    'paid'::text, 'not_paid'::text, 'pending'::text
  ])),
  amount_paid numeric DEFAULT 0,
  remarks text,
  updated_at timestamp with time zone DEFAULT now()
);
```

#### 15. **jobs** (Alumni Job Board)
```sql
CREATE TABLE public.jobs (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  company text NOT NULL,
  description text NOT NULL,
  requirements text,
  responsibilities text,
  
  -- Location & Type
  location text,
  job_type text CHECK (job_type = ANY (ARRAY[
    'full-time'::text, 'part-time'::text, 'internship'::text,
    'contract'::text, 'freelance'::text
  ])),
  experience_level text CHECK (experience_level = ANY (ARRAY[
    'entry'::text, 'mid'::text, 'senior'::text, 'executive'::text
  ])),
  
  -- Salary
  salary_min numeric,
  salary_max numeric,
  salary_currency text DEFAULT 'INR'::text,
  
  -- Eligibility
  eligible_branches text[] NOT NULL DEFAULT '{}'::text[],
  eligible_semesters text[] NOT NULL DEFAULT '{}'::text[],
  minimum_cgpa numeric,
  required_skills text[] DEFAULT '{}'::text[],
  preferred_skills text[] DEFAULT '{}'::text[],
  
  -- Application
  application_deadline date,
  application_url text,
  application_email text,
  application_instructions text,
  contact_email text,
  contact_phone text,
  website_url text,
  
  -- Posted By
  posted_by_id text NOT NULL REFERENCES user_profiles(id),
  posted_by_name text NOT NULL,
  posted_by_email text NOT NULL,
  
  -- Status & Stats
  is_active boolean DEFAULT true,
  views_count integer DEFAULT 0,
  applications_count integer DEFAULT 0,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

#### 16. **mentorship_requests**
```sql
CREATE TABLE public.mentorship_requests (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  mentee_id text NOT NULL REFERENCES user_profiles(id),
  mentor_id text NOT NULL REFERENCES user_profiles(id),
  message text NOT NULL,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY[
    'pending'::text, 'accepted'::text, 'rejected'::text, 'completed'::text
  ])),
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

#### 17. **site_settings**
```sql
CREATE TABLE public.site_settings (
  id uuid NOT NULL PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  collegename text,
  collegelogourl text,
  contactemail text,
  
  -- Social Links
  socialfacebook text,
  socialtwitter text,
  sociallinkedin text,
  socialinstagram text,
  socialgithub text,
  
  -- Features
  enablealumnitransition boolean DEFAULT false,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

#### 18. **branches**
```sql
CREATE TABLE public.branches (
  name text NOT NULL PRIMARY KEY,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now()
);
```

---

### **Schema Summary Table**

| Table | Primary Key Type | Key Foreign Keys | JSONB Fields |
|-------|-----------------|------------------|--------------|
| user_profiles | TEXT (auth UUID) | self-referencing | education, experience, projects, certifications, achievements, social_links, preferences |
| assignments | TEXT | instructor_id → user_profiles | attachments |
| attendance_records | UUID | student_uid, marked_by → user_profiles | - |
| fee_records | TEXT | student_id → user_profiles | - |
| timetables | TEXT | - | schedule |
| subjects | TEXT | - | - |
| groups | TEXT | - | - |
| group_members | UUID | group_id → groups | - |
| group_messages | UUID | group_id → groups | attachments, reactions |
| notifications | TEXT | user_id → auth.users | - |
| study_materials | UUID | uploaded_by → user_profiles | attachments |
| user_preferences | UUID | user_id → auth.users | notification_settings |
| fundraising_campaigns | UUID | createdByUid → user_profiles | - |
| jobs | UUID | posted_by_id → user_profiles | - |

### **⚠️ Critical Database Notes**

1. **Auth UUID Storage**: `attendance_records.student_uid` and `fee_records.student_id` store **Supabase Auth UUIDs**, NOT USN numbers!
2. **RLS Policies**: All tables have Row Level Security enabled
3. **JSONB Fields**: `timetables.schedule`, `group_messages.attachments`, `study_materials.attachments` use JSONB
4. **Foreign Keys**: Most tables reference `user_profiles(id)` using auth UUIDs

---

## 🔐 Authentication System

### **How It Works**

1. **User Registration**:
   ```
   User fills form → Supabase Auth creates account → Profile created in user_profiles
   → Role set to 'pending' → Admin approval required
   ```

2. **Login Flow**:
   ```
   User enters credentials → Supabase Auth validates
   → JWT token issued → AuthProvider fetches profile
   → Role-based redirect to dashboard
   ```

3. **Role-Based Access**:
   - **Admin**: Full access to all features
   - **Faculty**: Access to assigned branches/semesters
   - **Student**: Access to personal records only
   - **Alumni**: Access to alumni portal, job postings

### **AuthProvider Component** (`src/components/auth-provider.tsx`)

**Key Functions**:
- `signIn(credentials)` - Authenticates user
- `signOut()` - Logs out user
- `updateUserContext(user)` - Updates user state
- Auto-detects alumni status based on graduation year

**User Context Available Everywhere**:
```typescript
const { user, isLoading } = useAuth();

// user object contains:
{
  uid: "auth-uuid-here",
  email: "student@example.com",
  displayName: "John Doe",
  role: "student",
  branch: "CSE",
  semester: "5th Sem",
  usn: "1CR21CS001"
}
```

---

## 🤖 CERA AI Assistant

### **What is CERA?**

**CERA** (Centralized Education Response Assistant) is an AI chatbot powered by Google Gemini that answers student queries about assignments, fees, attendance, and timetables.

### **How CERA Works**

```
1. Student types query: "What are my upcoming assignments?"
   ↓
2. CERAChat.tsx sends to /api/cera/query
   ↓
3. API extracts user context (uid, role, branch, semester)
   ↓
4. Query type detection: "assignments"
   ↓
5. Database query:
   SELECT * FROM assignments 
   WHERE branch = 'CSE' AND semester = '5th Sem'
   ↓
6. Gemini API formats response (optional)
   ↓
7. Response sent back to frontend as HTML table
   ↓
8. Student sees formatted answer
```

### **CERA Query Types**

| Query Type | Keywords | Database Table | Filter |
|-----------|----------|----------------|--------|
| Assignments | "assignment", "homework", "due" | assignments | branch + semester |
| Fees | "fee", "payment", "amount" | fee_records | student_id = auth_uuid |
| Attendance | "attendance", "present", "absent" | attendance_records | student_uid = auth_uuid |
| Timetable | "timetable", "schedule", "class" | timetables | branch + semester |
| Subjects | "subject", "course", "faculty" | subjects | branch + semester |

### **CERA Security**

✅ **No arbitrary SQL execution** - Only predefined query types  
✅ **Auth UUID filtering** - All queries filtered by authenticated user  
✅ **Role-based access** - Students see only their data  
✅ **RLS enforcement** - Database-level security  
✅ **Gemini API** - Used only for natural language formatting  

### **CERA Files**

- `src/components/CERAChat.tsx` - Chat UI (470 lines)
- `src/app/api/cera/query/route.js` - API handler (1812 lines)
- `src/ai/ceraAssistant.js` - AI engine (413 lines)

---

## 🚀 Setup Instructions

### **Prerequisites**

- Node.js 20+ installed
- npm or yarn package manager
- Supabase account (free tier works)
- Google Gemini API key (free tier available)

### **Step 1: Clone and Install**

```bash
cd sip
npm install
```

### **Step 2: Environment Variables**

Create `.env.local` file in root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Google Gemini API
GEMINI_API_KEY=your-gemini-api-key-here
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key-here

# Optional: Firebase (if using Firebase hosting)
FIREBASE_PROJECT_ID=your-project-id
```

### **Step 3: Database Setup**

1. **Create Supabase Project**: Go to https://supabase.com
2. **Run Migrations**: Execute SQL files in `migrations/` folder in order
3. **Create Storage Bucket**: Create `chat-attachments` bucket (public)
4. **Enable Realtime**: Enable realtime for notifications and messages tables

### **Step 4: Run Development Server**

```bash
npm run dev
```

Open http://localhost:3000

### **Step 5: Create Admin Account**

1. Register a new account
2. Go to Supabase dashboard → Authentication → Users
3. Find your user → Copy user ID
4. Go to Table Editor → user_profiles
5. Update your user:
   - Set `role` = 'admin'
   - Set `is_approved` = true

---

## 🔑 Environment Variables

### **Required Variables**

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public API key | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (secret!) | Supabase Dashboard → Settings → API |
| `GEMINI_API_KEY` | Google Gemini API key | https://aistudio.google.com/app/apikey |

### **Optional Variables**

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_GEMINI_API_KEY` | Client-side Gemini key | Same as GEMINI_API_KEY |
| `FIREBASE_PROJECT_ID` | Firebase project ID | Not needed unless deploying to Firebase |

---

## 💻 Development Workflow

### **Development Commands**

```bash
# Start development server (with Turbopack)
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint

# TypeScript type checking
npm run typecheck
```

### **Project Scripts**

- `scripts/check-env.js` - Validates environment variables
- `scripts/populate-groups.js` - Populates group memberships
- `scripts/run-migrations.js` - Runs database migrations

### **Adding New Features**

1. **New Page**: Create in `src/app/your-page/page.tsx`
2. **New Component**: Create in `src/components/your-component.tsx`
3. **New API**: Create in `src/app/api/your-endpoint/route.ts`
4. **New Type**: Add to `src/types/index.ts`
5. **New Util**: Create in `src/lib/your-util.ts`

---

## 🚀 Deployment Guide

### **Option 1: Vercel (Recommended)**

1. Push code to GitHub
2. Go to https://vercel.com
3. Import repository
4. Add environment variables
5. Deploy

### **Option 2: Firebase Hosting**

```bash
npm run build
firebase deploy
```

### **Option 3: Self-Hosted**

```bash
npm run build
npm run start
# Run behind nginx or Apache
```

### **Post-Deployment Checklist**

- ✅ Verify environment variables are set
- ✅ Test Supabase connection
- ✅ Test Gemini API integration
- ✅ Create admin account
- ✅ Upload test data
- ✅ Test all user roles
- ✅ Enable RLS policies
- ✅ Configure storage bucket policies

---

## 👥 Key Features by Role

### **👨‍🎓 Student Features**

- ✅ View class timetable
- ✅ Check attendance records
- ✅ View assignments and due dates
- ✅ Check fee payment status
- ✅ Access study materials
- ✅ Chat with CERA AI assistant
- ✅ Join groups (branch/semester based)
- ✅ View announcements and posts
- ✅ Download calendar (ICS format)

### **👨‍🏫 Faculty Features**

- ✅ Mark student attendance
- ✅ Create and manage assignments
- ✅ Upload study materials
- ✅ View assigned classes
- ✅ Post announcements
- ✅ View student reports
- ✅ Manage groups (official groups only)

### **👨‍💼 Admin Features**

- ✅ User management (approve/reject/delete)
- ✅ Assign roles and permissions
- ✅ Manage timetables (all branches/semesters)
- ✅ Manage subjects and courses
- ✅ Fee management
- ✅ Bulk attendance operations
- ✅ System settings and configuration
- ✅ View analytics and reports
- ✅ Manage branches and semesters
- ✅ Content moderation

### **🎓 Alumni Features**

- ✅ Alumni directory
- ✅ Job postings
- ✅ Networking events
- ✅ Mentorship programs

---

## 🔗 API Endpoints

### **Public Endpoints**

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### **Protected Endpoints**

- `POST /api/cera/query` - CERA AI query
- `GET /api/cera/debug` - CERA debugging
- `POST /api/admin/create-faculty` - Create faculty account (admin only)
- `POST /api/admin/change-password` - Change user password (admin only)
- `POST /api/generate-pdf` - Generate PDF (resume, reports)

### **API Response Format**

```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

---

## 🐛 Troubleshooting

### **Common Issues**

#### 1. **"Supabase client not initialized"**
- ✅ Check `.env.local` file exists
- ✅ Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- ✅ Restart dev server after adding env vars

#### 2. **"CERA not responding"**
- ✅ Check `GEMINI_API_KEY` is set
- ✅ Verify API key is valid at https://aistudio.google.com
- ✅ Check browser console for errors
- ✅ Check user has `branch` and `semester` set in profile

#### 3. **"User cannot login"**
- ✅ Check user's `is_approved` field in `user_profiles` table
- ✅ Verify user's `role` is not 'pending' or 'rejected'
- ✅ Check Supabase Auth dashboard for user status

#### 4. **"File upload fails"**
- ✅ Verify `chat-attachments` bucket exists in Supabase Storage
- ✅ Check bucket is set to **public**
- ✅ Verify RLS policies allow authenticated users to upload
- ✅ Check file size < 10MB

#### 5. **"Notifications not appearing"**
- ✅ Check Supabase Realtime is enabled
- ✅ Verify `notifications` table exists
- ✅ Check user's notification preferences in `user_preferences` table

#### 6. **"Groups not showing"**
- ✅ Run `scripts/populate-groups.js` to create groups
- ✅ Verify user has `branch` and `semester` set
- ✅ Check `group_members` table has entries

### **Debug Mode**

Enable detailed logging:

```typescript
// In browser console
localStorage.setItem('debug', 'true');
```

Check logs:
- Browser DevTools → Console
- Supabase Dashboard → Logs
- Vercel Dashboard → Functions → Logs

---

## 📚 Additional Documentation

- **Database Schema**: See `DATABASE_SCHEMA.md`
- **System Architecture**: See `SYSTEM_ARCHITECTURE.md`
- **API Documentation**: See `docs/api.md` (if exists)
- **Component Library**: See `docs/components.md` (if exists)

---

## 🤝 Support

For issues or questions:
1. Check this documentation first
2. Review error logs in browser console
3. Check Supabase dashboard for database issues
4. Review environment variables

---

## 📄 License

This project is proprietary software for APS (Academy of Professional Studies).

---

**Last Updated**: November 2025  
**Version**: 1.0.2  
**Maintainer**: APS Development Team
