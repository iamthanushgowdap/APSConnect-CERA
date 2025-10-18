// Cera.Ai Utilities - Database operations and context management

import { createClient } from '@supabase/supabase-js';

// Cera.Ai Supabase client with service role access
const ceraSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Database query functions for Cera.Ai
export class CeraDatabase {
  // Get user timetable
  static async getUserTimetable(userId: string) {
    try {
      // Get user profile first
      const { data: profile } = await ceraSupabase
        .from('user_profiles')
        .select('branch, semester, role, assigned_subjects')
        .eq('id', userId)
        .single();

      if (!profile) return null;

      // Get timetable based on role
      let query = ceraSupabase.from('timetables').select('*');

      if (profile.role === 'student') {
        query = query.eq('branch', profile.branch).eq('semester', profile.semester);
      } else if (profile.role === 'faculty') {
        // Faculty can see timetables for their assigned subjects/branches
        // For now, return all timetables (can be filtered later)
        query = query.limit(50);
      }

      const { data: timetables } = await query;
      return timetables || [];

    } catch (error) {
      console.error('Error getting user timetable:', error);
      return [];
    }
  }

  // Get attendance statistics
  static async getAttendanceStats(filters: {
    branch?: string;
    semester?: string;
    subjectCode?: string;
    date?: string;
    facultyId?: string;
  }) {
    try {
      let query = ceraSupabase.from('attendance_records').select(`
        *,
        user_profiles!inner(full_name, branch, semester)
      `);

      if (filters.branch) query = query.eq('user_profiles.branch', filters.branch);
      if (filters.semester) query = query.eq('user_profiles.semester', filters.semester);
      if (filters.subjectCode) query = query.eq('subject_code', filters.subjectCode);
      if (filters.date) query = query.eq('date', filters.date);

      const { data } = await query.limit(1000);
      return data || [];

    } catch (error) {
      console.error('Error getting attendance stats:', error);
      return [];
    }
  }

  // Get subject information
  static async getSubjects(filters: {
    branch?: string;
    semester?: string;
    facultyId?: string;
  } = {}) {
    try {
      let query = ceraSupabase.from('subjects').select('*');

      if (filters.branch) query = query.eq('branch', filters.branch);
      if (filters.semester) query = query.eq('semester', filters.semester);

      const { data } = await query;
      return data || [];

    } catch (error) {
      console.error('Error getting subjects:', error);
      return [];
    }
  }

  // Get user statistics
  static async getUserStats() {
    try {
      const [users, timetables, attendance, subjects] = await Promise.all([
        ceraSupabase.from('user_profiles').select('role'),
        ceraSupabase.from('timetables').select('id', { count: 'exact' }),
        ceraSupabase.from('attendance_records').select('id', { count: 'exact' }),
        ceraSupabase.from('subjects').select('id', { count: 'exact' })
      ]);

      const userCounts = users.data?.reduce((acc: any, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {}) || {};

      return {
        totalUsers: users.data?.length || 0,
        userBreakdown: userCounts,
        totalTimetables: timetables.count || 0,
        totalAttendance: attendance.count || 0,
        totalSubjects: subjects.count || 0
      };

    } catch (error) {
      console.error('Error getting user stats:', error);
      return null;
    }
  }

  // Search functionality
  static async searchDatabase(query: string, type: 'users' | 'subjects' | 'timetables' | 'all' = 'all') {
    try {
      const results: any = {};

      if (type === 'users' || type === 'all') {
        const { data: users } = await ceraSupabase
          .from('user_profiles')
          .select('*')
          .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
          .limit(10);
        results.users = users || [];
      }

      if (type === 'subjects' || type === 'all') {
        const { data: subjects } = await ceraSupabase
          .from('subjects')
          .select('*')
          .or(`name.ilike.%${query}%,code.ilike.%${query}%`)
          .limit(10);
        results.subjects = subjects || [];
      }

      if (type === 'timetables' || type === 'all') {
        const { data: timetables } = await ceraSupabase
          .from('timetables')
          .select('*')
          .or(`branch.ilike.%${query}%,semester.ilike.%${query}%`)
          .limit(10);
        results.timetables = timetables || [];
      }

      return results;

    } catch (error) {
      console.error('Error searching database:', error);
      return {};
    }
  }

  // Get current day's schedule
  static async getTodaysSchedule(branch: string, semester: string) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

      const { data: timetable } = await ceraSupabase
        .from('timetables')
        .select('*')
        .eq('branch', branch)
        .eq('semester', semester)
        .single();

      if (!timetable?.schedule) return null;

      const todaysSchedule = timetable.schedule.find((s: any) =>
        s.day.toLowerCase() === dayOfWeek
      );

      return todaysSchedule || null;

    } catch (error) {
      console.error('Error getting todays schedule:', error);
      return null;
    }
  }

  // Get next class for a user
  static async getNextClass(userId: string) {
    try {
      const profile = await ceraSupabase
        .from('user_profiles')
        .select('branch, semester')
        .eq('id', userId)
        .single();

      if (!profile.data) return null;

      const todaysSchedule = await this.getTodaysSchedule(
        profile.data.branch,
        profile.data.semester
      );

      if (!todaysSchedule?.entries) return null;

      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();

      // Find next class after current time
      const nextClass = todaysSchedule.entries
        .filter((entry: any) => entry.type === 'class' && entry.subject)
        .find((entry: any) => {
          // Parse time (assuming format like "9:00 AM")
          const [time, period] = entry.time.split(' ');
          const [hours, minutes] = time.split(':').map(Number);
          const classTime = period === 'PM' && hours !== 12 ? hours + 12 : hours;
          const classMinutes = classTime * 60 + minutes;

          return classMinutes > currentTime;
        });

      return nextClass || null;

    } catch (error) {
      console.error('Error getting next class:', error);
      return null;
    }
  }
}

// Context Manager for Cera.Ai sessions
export class CeraContextManager {
  private static instance: CeraContextManager;
  private contextCache: Map<string, any> = new Map();
  private lastUpdated: Map<string, Date> = new Map();

  static getInstance(): CeraContextManager {
    if (!CeraContextManager.instance) {
      CeraContextManager.instance = new CeraContextManager();
    }
    return CeraContextManager.instance;
  }

  // Get or create user context
  async getUserContext(userId: string) {
    const cached = this.contextCache.get(userId);
    const lastUpdate = this.lastUpdated.get(userId);

    // Return cached context if less than 5 minutes old
    if (cached && lastUpdate && (Date.now() - lastUpdate.getTime()) < 300000) {
      return cached;
    }

    // Fetch fresh context
    try {
      const { data: profile } = await ceraSupabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!profile) return null;

      const context = {
        userId: profile.id,
        role: profile.role,
        email: profile.email,
        fullName: profile.full_name || profile.display_name || profile.email.split('@')[0],
        branch: profile.branch,
        semester: profile.semester,
        assignedSubjects: profile.assigned_subjects || [],
        assignedBranches: profile.assigned_branches || [],
        assignedSemesters: profile.assigned_semesters || [],
        lastLogin: profile.last_login,
        createdAt: profile.created_at
      };

      this.contextCache.set(userId, context);
      this.lastUpdated.set(userId, new Date());

      return context;

    } catch (error) {
      console.error('Error getting user context:', error);
      return null;
    }
  }

  // Update user context
  updateUserContext(userId: string, updates: Partial<any>) {
    const existing = this.contextCache.get(userId);
    if (existing) {
      const updated = { ...existing, ...updates };
      this.contextCache.set(userId, updated);
      this.lastUpdated.set(userId, new Date());
    }
  }

  // Clear user context
  clearUserContext(userId: string) {
    this.contextCache.delete(userId);
    this.lastUpdated.delete(userId);
  }

  // Get global statistics
  async getGlobalStats() {
    return await CeraDatabase.getUserStats();
  }
}

// Export singleton instance
export const ceraContextManager = CeraContextManager.getInstance();

// Export the Supabase client for Cera.Ai
export { ceraSupabase };
