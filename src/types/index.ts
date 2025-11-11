
// src/types/index.ts
import { z } from "zod";

export type UserRole = "student" | "admin" | "pending" | "faculty" | "alumni";

// Branch type is now string to allow admins to define custom branch names.
export type Branch = string | "ALL";

// defaultBranches provides a list of common/suggested branches for forms.
export const defaultBranches: Branch[] = [
  "CSE",
  "ISE",
  "ECE",
  "ME",
  "CIVIL",
  "AI & ML",
  "OTHER",
];

export type Semester =
  | "1st Sem"
  | "2nd Sem"
  | "3rd Sem"
  | "4th Sem"
  | "5th Sem"
  | "6th Sem"
  | "7th Sem"
  | "8th Sem"
  | "ALL"; // Special value for groups that apply to all semesters
export const semesters: Semester[] = [
  "1st Sem",
  "2nd Sem",
  "3rd Sem",
  "4th Sem",
  "5th Sem",
  "6th Sem",
  "7th Sem",
  "8th Sem",
];

export type PostCategory = "event" | "news" | "link" | "note" | "schedule";
export const postCategories: PostCategory[] = [
  "event",
  "news",
  "link",
  "note",
  "schedule",
];

// Notification Preferences
export interface NotificationPreferences {
  news: boolean;
  events: boolean;
  notes: boolean;
  schedules: boolean;
  general: boolean;
  // New system-level notifications
  approval: boolean;
  assignment_deadline: boolean;
  fee_due: boolean;
  low_attendance: boolean;
}

// Resume-related types
export interface EducationEntry {
  id: string;
  degree: string;
  institution: string;
  graduationYear: string;
  score: string;
}

export interface ExperienceEntry {
  id: string;
  title: string;
  company: string;
  duration: string;
  description: string;
}

export interface ProjectEntry {
  id: string;
  title: string;
  description: string;
  link?: string;
}

export interface SkillEntry {
  id: string;
  name: string;
}

export interface CertificationEntry {
  id: string;
  name: string;
  issuingBody: string;
  year: string;
}

export interface AchievementEntry {
  id: string;
  description: string;
}

// This interface represents the user profile stored in Supabase user_profiles table
export interface UserProfile {
  id: string; // Primary key, matches auth.users.id
  email: string;
  full_name?: string; // Maps to displayName
  avatar_url?: string; // Maps to avatarDataUrl
  role: UserRole;
  department?: string; // Maps to branch
  year_of_study?: string; // Maps to semester
  student_id?: string; // Maps to usn
  phone?: string;
  address?: string;
  bio?: string; // Maps to summary
  skills?: string[]; // Different from SkillEntry[]
  interests?: string[];
  social_links?: any; // JSON object
  preferences?: any; // JSON object
  created_at: string;
  updated_at: string;
  assigned_branches?: string[];
  assigned_semesters?: string[];
  is_approved: boolean;
  rejection_reason?: string;
  approved_by_uid?: string;
  approved_by_display_name?: string;
  approval_date?: string;
  rejected_by_uid?: string;
  rejected_by_display_name?: string;
  rejected_date?: string;
  pronouns?: string;
  usn?: string;
  status?: string;
  branch?: string;
  semester?: string;
  graduation_year?: string;
  education?: any; // JSON array
  experience?: any; // JSON array
  projects?: any; // JSON array
  certifications?: any; // JSON array
  achievements?: any; // JSON array
  placement_company?: string;
  placement_job_title?: string;
  referral_info?: string;
  summary?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  faculty_title?: string;
  password?: string; // Should not be stored in plain text!
}

// Site settings managed by admin
export interface SiteSettingsData {
  collegeLogoUrl?: string;
  contactEmail?: string;
  socialFacebook?: string;
  socialTwitter?: string;
  socialLinkedIn?: string;
  socialInstagram?: string;
  socialGithub?: string;
  enableAlumniTransition?: boolean; // NEW
}

export interface PostAttachment {
  name: string;
  type: string;
  size: number;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  authorAvatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
  category: PostCategory;
  targetBranches: Branch[];
  attachments: PostAttachment[];
  likes?: string[];

  // Fields for calendar events
  eventDate?: string;
  eventStartTime?: string;
  eventEndTime?: string;
  eventLocation?: string;
}

// Timetable related types
export type DayOfWeek =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday";
export const daysOfWeek: DayOfWeek[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export interface TimeSlotDescriptor {
  time: string;
  label: string;
  isBreak: boolean;
  canBeLab: boolean; // NEW: Whether this period can start a lab session
}

export const timeSlotDescriptors: TimeSlotDescriptor[] = [
  { time: "9:00 AM - 9:50 AM", label: "Period 1", isBreak: false, canBeLab: true },
  { time: "9:50 AM - 10:40 AM", label: "Period 2", isBreak: false, canBeLab: true },
  { time: "10:40 AM - 11:00 AM", label: "Short Break", isBreak: true, canBeLab: false },
  { time: "11:00 AM - 11:50 AM", label: "Period 3", isBreak: false, canBeLab: true },
  { time: "11:50 AM - 12:40 PM", label: "Period 4", isBreak: false, canBeLab: true },
  { time: "12:40 PM - 1:20 PM", label: "Lunch Break", isBreak: true, canBeLab: false },
  { time: "1:20 PM - 2:10 PM", label: "Period 5", isBreak: false, canBeLab: true },
  { time: "2:10 PM - 3:00 PM", label: "Period 6", isBreak: false, canBeLab: false }, // Cannot be lab (last period)
  { time: "3:00 PM - 3:50 PM", label: "Period 7", isBreak: false, canBeLab: false }, // Cannot be lab (last period)
];

export const defaultTimeSlots = timeSlotDescriptors.map((d) => d.time);
export const defaultPeriods = timeSlotDescriptors.length;
export const saturdayLastSlotIndex = timeSlotDescriptors.findIndex(
  (d) => d.label === "Period 4"
);

export interface TimeTableEntry {
  period: number;
  type: 'class' | 'lab' | 'break'; // NEW: Period type
  subject?: string; // For class/lab periods
  subject_code?: string; // NEW: Subject code for quick reference
  room_number?: string; // NEW: Room number
  batch?: string; // NEW: Batch for lab periods (mandatory for labs)
  faculty_name?: string; // NEW: Faculty name for display
  is_lab_period?: boolean; // NEW: For 2-period lab blocks
}

export interface TimeTableDaySchedule {
  day: DayOfWeek;
  entries: TimeTableEntry[];
}

export interface TimeTable {
  id: string;
  branch: Branch;
  semester: Semester;
  schedule: TimeTableDaySchedule[];
  lastUpdatedBy: string;
  lastUpdatedAt: string;
}

// Attendance related types
export type AttendanceStatus = 'present' | 'absent';

export interface AttendanceRecord {
    id: string; // unique ID for the record, e.g., `${studentUid}-${date}-${period}`
    studentUid: string;
    studentName?: string; // Optional since database may not have it
    studentUsn?: string; // Optional since database may not have it
    date: string; // YYYY-MM-DD
    period: string; // Changed from number to string to match database
    subject: string;
    status: AttendanceStatus;
    markedByUid?: string; // Optional since database uses marked_by
    branch: Branch;
    semester: Semester;
    marked_by?: string; // Database field
    marked_by_name?: string; // Database field
    notes?: string; // Database field
    created_at?: string; // Database field
    updated_at?: string; // Database field
}

export const ATTENDANCE_STORAGE_KEY = "apsconnect_attendance_records";


// Study Material related types
export interface StudyMaterialAttachment {
  name: string;
  type: string;
  size: number;
  mockFileId: string;
  base64Content?: string; // Optional base64 content for file storage
}

export interface StudyMaterial {
  id: string;
  branch: Branch;
  semester: Semester;
  title: string;
  description?: string;
  attachments: StudyMaterialAttachment[];
  uploaded_by: string; // Changed from uploadedByUid to match database
  uploaded_by_display_name: string; // Changed to match database
  created_at: string; // Changed to match database
  updated_at?: string; // Added for database
}

export const STUDY_MATERIAL_STORAGE_KEY = "apsconnect_study_materials";


// Assignment related types
export interface AssignmentAttachment {
  name: string;
  type: string;
  size: number;
  filePath: string;
}

export interface Assignment {
  id: string;
  branch: Branch;
  semester: Semester;
  title: string;
  description?: string;
  attachments: AssignmentAttachment[];
  due_date?: string; // Stored as ISO string date (YYYY-MM-DD)
  instructor_id: string;
  instructor_name: string;
  posted_at: string;
}

export const ASSIGNMENT_STORAGE_KEY = "apsconnect_assignments";


// Fee Management related types
export type FeeStatus = 'paid' | 'pending' | 'partial' | 'overdue';
export const feeStatuses: FeeStatus[] = ['paid', 'pending', 'partial', 'overdue'];

export interface FeeRecord {
  id: string;
  student_id: string;
  semester: string;
  year: number;
  tuition_fee: number;
  hostel_fee: number;
  library_fee: number;
  lab_fee: number;
  other_fees: number;
  total_amount: number;
  paid_amount: number;
  due_date: string; // YYYY-MM-DD
  payment_status: FeeStatus;
  payment_method?: string;
  transaction_id?: string;
  paid_at?: string; // ISO timestamp
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export const FEE_STORAGE_KEY = "apsconnect_fee_records";

// Subject Management related types
export interface Subject {
  id: string; // Composite key: `${branch}_${semester}_${code}`
  name: string;
  code: string;
  branch: Branch;
  semester: Semester;
  type: 'class' | 'lab'; // NEW: Class or Lab type
  room_number?: string; // NEW: Optional room number
  assignedFacultyUids?: string[]; // Changed back to camelCase to match database
  created_at?: string;
  updated_at?: string;
}

export const SUBJECT_STORAGE_KEY = "apsconnect_subjects";


// Search related types
export type SearchResultItem =
  | ({ type: "post" } & Post)
  | ({ type: "user" } & UserProfile)
  | ({ type: "timetable" } & TimeTable)
  | ({ type: "studymaterial" } & StudyMaterial);

export interface SearchResults {
  posts: Post[];
  users: UserProfile[];
  timetables: TimeTable[];
  studyMaterials: StudyMaterial[];
}

// Anonymous Reporting System Types
export type ReportRecipientType = "faculty" | "admin";
export type ReportStatus = "new" | "viewed" | "resolved" | "archived";

export interface Report {
  id: string;
  recipientType: ReportRecipientType;
  recipient_uid?: string; // Specific faculty/admin member (optional)
  recipient_name?: string; // Display name of recipient
  reportContent: string;
  submittedAt: string;
  status: ReportStatus;

  contextBranch?: Branch;
  contextSemester?: Semester;

  submittedByUid: string;
  submittedByName?: string;
  submittedByUsn?: string;

  viewedAt?: string;
  resolvedAt?: string;
  resolvedByUid?: string;
  resolutionNotes?: string;
}

export const REPORT_STORAGE_KEY = "apsconnect_reports";

// Clubs (Groups) related types
export type GroupType = 'official' | 'student';

export interface Group {
    id: string; // e.g., 'CSE_3rd-Sem_official' or 'ISE_5th-Sem_student'
    name: string;
    type: GroupType;
    branch: Branch;
    semester: Semester;
    description: string;
}

export interface GroupMessage {
  id: string; // UUID
  group_id: string;
  author_uid: string;
  author_name: string;
  author_avatar_url?: string;
  content: string;
  timestamp: string; // ISO String
  created_at?: string;
  reactions?: { emoji: string; count: number; users: string[] }[];
  // New file attachment fields
  message_type?: 'text' | 'image' | 'video' | 'audio' | 'document' | 'file';
  file_name?: string;
  file_size?: number;
  file_type?: string;
  file_url?: string;
  attachments?: any[];
}

export const GROUP_MESSAGES_STORAGE_KEY = 'apsconnect_group_messages';

// Skill Build Courses
export interface SkillBuildCourse {
  id: string;
  title: string;
  description: string;
  websiteUrl?: string;
  facultyId: string;
  facultyName: string;
  createdAt: string;
  enrolledStudentUids: string[];
}
export const SKILL_BUILD_STORAGE_KEY = 'apsconnect_skill_build_courses';

// Fundraising types
export interface FundraisingCampaign {
  id: string;
  title: string;
  description: string;
  qrCodeDataUrl: string; // Store QR code as a data URL
  contactDetails: string; // Simple text field for contact info
  startDate: string; // ISO Date string
  endDate: string; // ISO Date string
  targetBranches: Branch[];
  targetSemesters: Semester[];
  createdByUid: string; // Faculty who created it
  createdAt: string;
  goalAmount: number; // Target amount for the campaign
  currentAmount: number; // Current raised amount
}

export type StudentPaymentStatus = 'paid' | 'not_paid' | 'pending';

export interface StudentFundraisingStatus {
  campaignId: string;
  studentUid: string;
  status: StudentPaymentStatus;
  remarks?: string;
  updatedAt: string;
}

export const FUNDRAISING_CAMPAIGN_STORAGE_KEY = "apsconnect_fundraising_campaigns";
export const STUDENT_FUNDRAISING_STATUS_STORAGE_KEY = "apsconnect_student_fundraising_status";


// Events Management
export interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string; // YYYY-MM-DD
  event_time?: string; // HH:MM format
  location?: string;
  event_type: 'academic' | 'cultural' | 'sports' | 'workshop' | 'seminar' | 'other';
  target_audience: ('student' | 'faculty' | 'alumni')[];
  target_branches?: Branch[];
  target_semesters?: Semester[];
  image_url?: string;
  registration_link?: string;
  registration_deadline?: string; // YYYY-MM-DD
  created_by_uid: string;
  created_by_name: string;
  created_at: string;
  updated_at?: string;
  is_active: boolean;
}

export const EVENT_STORAGE_KEY = 'apsconnect_events';

// In-App Notifications
export type NotificationType =
  | 'approval'
  | 'assignment_deadline'
  | 'fee_due'
  | 'low_attendance'
  | 'group_message'
  | 'event';

export interface Notification {
  id: string; // Unique ID, e.g., `${userId}-${type}-${relatedId}`
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  href: string; // Link to the relevant page
  createdAt: string; // ISO String
  isRead: boolean;
}

export const NOTIFICATION_STORAGE_KEY = 'apsconnect_notifications';
