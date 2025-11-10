# 🎓 APSConnect - Complete System Architecture Documentation

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Database Schema & Tables](#database-schema--tables)
4. [Authentication & Authorization System](#authentication--authorization-system)
5. [Page-by-Page Functionality](#page-by-page-functionality)
6. [Component Architecture](#component-architecture)
7. [API Endpoints & Data Flow](#api-endpoints--data-flow)
8. [State Management & Context](#state-management--context)
9. [Notification System](#notification-system)
10. [Real-time Features](#real-time-features)
11. [File Structure Map](#file-structure-map)

---

## 🎯 System Overview

**APSConnect** is a comprehensive Student Information Portal (SIP) built for educational institutions, specifically designed for APS (Academy of Professional Studies). The platform serves three main user roles: **Admin**, **Faculty**, and **Student**, each with role-specific permissions and features.

### Key Features:
- 🔐 **Role-based Access Control** (Admin/Faculty/Student)
- 🤖 **AI-Powered Assistant** (Cera.AI with Gemini integration)
- 📊 **Real-time Dashboard** with notifications
- 📚 **Academic Management** (Timetables, Attendance, Subjects)
- 💰 **Fee Management & Fundraising**
- 📝 **Assignment & Study Material Management**
- 👥 **Social Features** (Posts, Clubs, Profiles)
- 📱 **PWA Support** (Progressive Web App)
- 🌙 **Dark/Light Theme** support

---

## 🛠 Technology Stack

### Frontend:
- **Framework**: Next.js 15.3.2 (React 18.2.0)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Radix UI Components
- **State Management**: React Context + useState/useEffect
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts

### Backend & Database:
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **File Storage**: Supabase Storage
- **AI Integration**: Google Gemini AI API
- **Hosting**: Firebase Hosting (optional)

### Development Tools:
- **Build Tool**: Next.js with Turbopack
- **Linting**: ESLint
- **Type Checking**: TypeScript
- **PWA**: next-pwa
- **AI Framework**: Google Genkit

### Key Dependencies:
```json
{
  "@supabase/supabase-js": "^2.75.0",
  "@google/generative-ai": "^0.24.1",
  "@radix-ui/*": "Various UI components",
  "framer-motion": "^11.3.19",
  "react-hook-form": "^7.52.1",
  "zod": "^3.23.8"
}
```

---

## 🗄 Database Schema & Tables

### Core Tables:

#### 1. **user_profiles**
```sql
- id: uuid (Primary Key, FK to auth.users)
- email: text
- full_name: text
- role: enum('admin', 'faculty', 'student')
- branch: text
- semester: text
- usn: text (Unique Student Number)
- student_id: text
- department: text
- year_of_study: integer
- avatar_url: text
- pronouns: text
- created_at: timestamp
- updated_at: timestamp
```

#### 2. **timetables**
```sql
- id: uuid (Primary Key)
- branch: text
- semester: text
- subject: text
- faculty_name: text
- day: text
- start_time: time
- end_time: time
- room: text
- created_by: uuid (FK to user_profiles)
- created_at: timestamp
```

#### 3. **attendance_records**
```sql
- id: uuid (Primary Key)
- student_uid: uuid (FK to user_profiles)
- subject: text
- faculty_uid: uuid (FK to user_profiles)
- date: date
- status: enum('present', 'absent', 'late')
- created_by: uuid (FK to user_profiles)
- created_at: timestamp
```

#### 4. **subjects**
```sql
- id: uuid (Primary Key)
- name: text
- code: text
- branch: text
- semester: text
- faculty_uid: uuid (FK to user_profiles)
- credits: integer
- created_at: timestamp
```

#### 5. **assignments**
```sql
- id: uuid (Primary Key)
- title: text
- description: text
- subject: text
- faculty_uid: uuid (FK to user_profiles)
- due_date: timestamp
- file_url: text
- created_at: timestamp
```

#### 6. **posts**
```sql
- id: uuid (Primary Key)
- title: text
- content: text
- author_uid: uuid (FK to user_profiles)
- category: text
- tags: text[]
- image_url: text
- created_at: timestamp
- updated_at: timestamp
```

#### 7. **fee_records**
```sql
- id: uuid (Primary Key)
- student_uid: uuid (FK to user_profiles)
- amount: decimal
- description: text
- due_date: date
- status: enum('pending', 'paid', 'overdue')
- payment_date: date
- created_at: timestamp
```

#### 8. **notifications**
```sql
- id: uuid (Primary Key)
- user_uid: uuid (FK to user_profiles)
- title: text
- message: text
- type: enum('info', 'warning', 'success', 'error')
- read: boolean
- created_at: timestamp
```

### Database Relationships:
- **user_profiles** ↔ **timetables** (created_by)
- **user_profiles** ↔ **attendance_records** (student_uid, faculty_uid, created_by)
- **user_profiles** ↔ **subjects** (faculty_uid)
- **user_profiles** ↔ **assignments** (faculty_uid)
- **user_profiles** ↔ **posts** (author_uid)
- **user_profiles** ↔ **fee_records** (student_uid)
- **user_profiles** ↔ **notifications** (user_uid)

---

## 🔐 Authentication & Authorization System

### AuthProvider Component (`src/components/auth-provider.tsx`)

#### Key Features:
- **Context-based state management**
- **Session persistence** with Supabase
- **Role-based permissions**
- **Profile synchronization**
- **Notification preferences**

#### User Object Structure:
```typescript
interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'admin' | 'faculty' | 'student';
  branch?: Branch;
  usn?: string;
  assignedBranches?: Branch[];
  assignedSemesters?: Semester[];
  rejectionReason?: string;
  semester?: Semester;
  avatarDataUrl?: string;
  pronouns?: string;
  notificationPreferences?: NotificationPreferences;
}
```

#### Authentication Flow:
1. **Login** → Supabase Auth → Session created
2. **Profile Fetch** → `getUserProfile()` from `supabase-utils.ts`
3. **Context Update** → `AuthProvider` state update
4. **Role-based Routing** → Conditional rendering based on user.role

#### Permission Levels:
- **Admin**: Full access to all features
- **Faculty**: Access to assigned branches/semesters + teaching features
- **Student**: Limited access to personal data + enrolled subjects

---

## 📄 Page-by-Page Functionality

### 1. **Landing Page** (`src/app/page.tsx`)
**Route**: `/`
**Purpose**: Welcome screen with branding and navigation
**Components Used**:
- `SplashScreen`: Animated logo and tagline
- `DiveInScreen`: Call-to-action buttons
- `AuthProvider`: Authentication context

**Flow**:
1. Splash screen animation (3 seconds)
2. User authentication check
3. Redirect to appropriate dashboard based on role

### 2. **Authentication Pages** (`src/app/(auth)/*`)
**Routes**: `/login`, `/register`, `/forgot-password`
**Purpose**: User authentication and account management
**Features**:
- Login with email/password
- Registration with role selection
- Password reset functionality
- Form validation with Zod schemas

### 3. **Dashboard** (`src/app/dashboard/page.tsx`)
**Route**: `/dashboard`
**Purpose**: Main user dashboard with overview
**Components**:
- `ActionCard`: Quick action buttons
- `RecentPostItem`: Latest posts display
- Real-time notifications

**Features**:
- Role-specific content
- Recent activities feed
- Quick access to common functions

### 4. **Admin Panel** (`src/app/admin/*`)

#### Admin Layout (`src/app/admin/layout.tsx`)
- Navigation sidebar with admin-specific menu
- Role verification (admin only)

#### Key Admin Pages:
- **User Management** (`/admin`): User profiles, roles, approvals
- **Timetables** (`/admin/timetables`): Schedule management
- **Attendance** (`/admin/attendance`): Bulk attendance operations
- **Subjects** (`/admin/subjects`): Course management
- **Posts** (`/admin/posts/*`): Content moderation
- **Reports** (`/admin/reports`): Analytics and reports

### 5. **Faculty Panel** (`src/app/faculty/*`)

#### Faculty Layout (`src/app/faculty/layout.tsx`)
- Branch/semester-specific navigation
- Teaching-focused menu items

#### Key Faculty Pages:
- **Dashboard** (`/faculty`): Teaching overview
- **Timetables** (`/faculty/timetables`): Class schedules
- **Attendance** (`/faculty/attendance`): Mark attendance
- **Assignments** (`/faculty/assignments`): Create/manage assignments
- **Study Materials** (`/faculty/study-materials`): Upload resources
- **Content** (`/faculty/content/*`): Blog posts and announcements
- **Reports** (`/faculty/reports`): Student performance analytics

### 6. **Student Panel** (`src/app/student/*`)

#### Student Layout (`src/app/student/layout.tsx`)
- Student-specific navigation
- Academic focus menu

#### Key Student Pages:
- **Dashboard** (`/student`): Academic overview
- **Timetable** (`/student/timetable`): Class schedule
- **Attendance** (`/student/attendance`): Personal attendance records
- **Assignments** (`/student/assignments`): View/submit assignments
- **Fee Details** (`/student/fee-details`): Payment status
- **Study Materials** (`/student/study-materials`): Access resources
- **Report Concern** (`/student/report-concern`): Issue reporting

### 7. **Cera.AI Assistant** (`src/app/cera-assistant/page.tsx`)
**Route**: `/cera-assistant`
**Purpose**: AI-powered educational assistant
**Components**:
- `CeraAssistant`: Main chat interface
- Gemini AI integration
- Keyword-based fallback responses

**Features**:
- Natural language queries about academic data
- Real-time responses
- Context-aware answers
- Fallback to keyword matching

### 8. **Social Features**

#### Posts System (`src/app/post/[postId]/page.tsx`)
- Individual post viewing
- Comments and interactions
- Author verification

#### Clubs (`src/app/clubs/*`)
- Group management
- Member interactions
- Event coordination

#### Profiles (`src/app/profile/[userId]/page.tsx`)
- User profile pages
- Academic information display
- Social connections

### 9. **Utility Pages**
- **Environment Test** (`/env-test`): Development debugging
- **Not Found** (`/not-found`): 404 error handling

---

## 🧩 Component Architecture

### UI Components (`src/components/ui/*`)
**Radix UI + Tailwind CSS based components:**
- `button.tsx`: Reusable button component
- `card.tsx`: Content containers
- `dialog.tsx`: Modal dialogs
- `form.tsx`: Form components
- `input.tsx`: Input fields
- `table.tsx`: Data tables
- `toast.tsx`: Notification toasts

### Feature Components:

#### Layout Components (`src/components/layout/*`)
- `navbar.tsx`: Main navigation with role-based menus
- `footer.tsx`: Site footer with links
- `download-app-section.tsx`: PWA promotion

#### Content Components (`src/components/content/*`)
- `create-post-form.tsx`: Post creation form
- `post-item.tsx`: Post display component
- `post-item-utils.ts`: Post utility functions

#### Academic Components:
- **Timetables** (`src/components/timetables/*`): Schedule display and management
- **Assignments** (`src/components/assignments/*`): Assignment forms and items
- **Fees** (`src/components/fees/*`): Payment tracking components
- **Study Materials** (`src/components/study-materials/*`): Resource management

#### User Management (`src/components/admin/*`)
- `ManageStudentsTab.tsx`: Student administration interface

### Key Component Patterns:
- **Props-based configuration**
- **TypeScript interfaces** for type safety
- **Conditional rendering** based on user roles
- **Reusability** across different pages
- **Consistent styling** with Tailwind classes

---

## 🔗 API Endpoints & Data Flow

### API Routes (`src/app/api/*`)

#### 1. **Cera.AI API** (`/api/cera/route.ts`)
**Endpoints**:
- `GET /api/cera?path=user-profile&userId={id}`: Fetch user profile with academic context
- `POST /api/cera?path=database-context`: Get comprehensive database context for AI

**Data Flow**:
1. CeraAssistant component calls API
2. Server fetches user profile + related academic data
3. Returns structured context for AI processing
4. AI generates contextual responses

#### 2. **Admin API** (`/api/admin/*`)
**Purpose**: Administrative operations with elevated permissions
**Authentication**: Service role key required

### Data Flow Patterns:

#### User Authentication Flow:
```
Login Form → AuthProvider.signIn() → Supabase Auth
    ↓
Profile Fetch → getUserProfile() → Database Query
    ↓
Context Update → AuthProvider State → UI Re-render
```

#### Academic Data Flow:
```
Page Load → useAuth() → Role Check → API Call
    ↓
Database Query → Permission Filter → Data Transform
    ↓
Component State → UI Render → User Interaction
```

#### AI Assistant Flow:
```
User Query → CeraAssistant → processQuery()
    ↓
Gemini API Call → Context Building → AI Response
    ↓ (if fails)
Keyword Matching → Database Search → Text Response
```

---

## 📊 State Management & Context

### AuthContext (`AuthProvider`)
**State**:
```typescript
{
  user: User | null,
  isLoading: boolean,
  signIn: Function,
  signOut: Function,
  updateUserContext: Function
}
```

**Responsibilities**:
- User session management
- Profile synchronization
- Role-based permissions
- Notification preferences

### Local Component State:
- **Messages**: Chat history in CeraAssistant
- **Form Data**: Temporary form inputs
- **UI States**: Loading, modal visibility, etc.

### Data Fetching Patterns:
- **Server Components**: Initial data loading
- **Client Components**: Interactive updates
- **Real-time Subscriptions**: Live data updates

---

## 🔔 Notification System

### NotificationManager (`src/lib/notification-manager.ts`)
**Features**:
- Automated notification generation
- Role-based notification filtering
- Real-time delivery
- Notification preferences

**Types**:
- **News**: General announcements
- **Events**: Calendar events
- **Notes**: Academic updates
- **Assignments**: Due date reminders
- **Fees**: Payment reminders

### Notification Flow:
```
Event Trigger → checkAndGenerateNotifications()
    ↓
User Preferences Check → Filter Recipients
    ↓
Notification Creation → Database Insert
    ↓
Real-time Broadcast → UI Update
```

---

## ⚡ Real-time Features

### Supabase Realtime Integration:
- **Live Notifications**: Instant notification delivery
- **Online Status**: User presence tracking
- **Live Updates**: Real-time data synchronization

### Implementation:
```typescript
// Example: Real-time subscription
const channel = supabase
  .channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications'
  }, (payload) => {
    // Handle new notification
  })
  .subscribe()
```

---

## 📁 File Structure Map

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication pages
│   ├── admin/                    # Admin panel pages
│   ├── api/                      # API routes
│   ├── cera-assistant/          # AI assistant page
│   ├── clubs/                    # Social clubs
│   ├── dashboard/               # Main dashboard
│   ├── faculty/                  # Faculty panel
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Landing page
│   ├── post/                     # Social posts
│   ├── profile/                  # User profiles
│   ├── student/                  # Student panel
│   └── types/                    # TypeScript definitions
├── components/                   # React components
│   ├── admin/                    # Admin-specific components
│   ├── assignments/              # Assignment management
│   ├── auth-provider.tsx         # Authentication context
│   ├── cera-assistant.tsx        # AI assistant component
│   ├── content/                  # Content management
│   ├── dashboard/                # Dashboard widgets
│   ├── fees/                     # Fee management
│   ├── fundraising/              # Fundraising tools
│   ├── icons.tsx                 # Icon components
│   ├── layout/                   # Layout components
│   ├── notifications/            # Notification components
│   ├── resume/                   # Resume templates
│   ├── skill-build/              # Skill development
│   ├── study-materials/          # Learning resources
│   ├── theme-toggle-button.tsx   # Theme switcher
│   ├── timetables/               # Schedule components
│   ├── ui/                       # Reusable UI components
│   └── users/                    # User management
├── lib/                          # Utility libraries
│   ├── calendar-utils.ts         # Calendar helpers
│   ├── cera-utils.ts            # AI assistant utilities
│   ├── groups-utils.ts          # Group management
│   ├── notification-manager.ts   # Notification system
│   ├── placeholder-images.json   # Default images
│   ├── supabase-utils.ts         # Database operations
│   ├── supabase.js              # Supabase client
│   └── utils.ts                 # General utilities
├── hooks/                        # Custom React hooks
│   ├── use-mobile.tsx           # Mobile detection
│   └── use-toast.ts             # Toast notifications
├── config/                       # Configuration files
│   └── site.ts                  # Site configuration
└── types/                        # TypeScript type definitions
    └── index.ts                 # Global type definitions
```

---

## 🔄 Complete Data Flow Architecture

### User Journey Example (Student Login):

1. **Landing Page** → Authentication check → Redirect to login
2. **Login Form** → Supabase auth → Session creation
3. **AuthProvider** → Profile fetch → Context update
4. **Dashboard Load** → Role verification → Student layout
5. **Navigation** → Protected routes → Page-specific data loading
6. **API Calls** → Database queries → Permission filtering
7. **Real-time Updates** → Live notifications → UI updates
8. **AI Assistant** → Context gathering → Gemini API → Response

### Database Connection Flow:
```
Component → API Route → Supabase Client → Database Query
    ↓
Permission Check → Data Filtering → Response Formatting
    ↓
Component State → UI Rendering → User Interaction
```

### Error Handling Flow:
```
Error Occurs → Catch Block → Error Logging → User Notification
    ↓
Fallback UI → Recovery Options → Retry Mechanisms
```

---

## 🚀 Deployment & Production

### Environment Variables Required:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

### Build Process:
```bash
npm run build    # Production build
npm run start    # Production server
```

### PWA Features:
- Service worker registration
- Offline capability
- App installation prompts
- Push notifications

---

## 🔧 Development Workflow

### Local Development:
```bash
npm run dev      # Start development server
npm run lint     # Code linting
npm run typecheck # TypeScript checking
```

### Key Development Patterns:
- **Component Composition**: Reusable UI components
- **Custom Hooks**: Logic extraction and reuse
- **Type Safety**: Full TypeScript coverage
- **Responsive Design**: Mobile-first approach
- **Performance**: Code splitting and lazy loading

---

## 🎯 Conclusion

APSConnect represents a comprehensive, production-ready Student Information Portal with:

- **Scalable Architecture**: Modular design supporting future expansion
- **Security First**: Role-based access control and data protection
- **AI Integration**: Intelligent assistant powered by Google Gemini
- **Real-time Features**: Live updates and notifications
- **Mobile Support**: PWA capabilities for cross-platform access
- **Developer Experience**: TypeScript, modern tooling, and clean code

The system successfully connects all components from database to UI, providing a seamless experience for administrators, faculty, and students while maintaining data integrity and user experience standards.

---

**📞 For technical support or questions about specific implementations, refer to the component documentation or contact the development team.**
