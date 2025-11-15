"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { UserRole, Branch, UserProfile, Semester, NotificationPreferences, Group } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { checkAndGenerateNotifications } from '@/lib/notification-manager';
import { assignUserToGroups, getMyGroups } from '@/lib/groups-utils';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  branch?: Branch;
  usn?: string;
  assignedBranches?: Branch[];
  assignedSemesters?: Semester[];
  rejectionReason?: string;
  is_approved?: boolean; // Add approval status
  semester?: Semester;
  avatarDataUrl?: string;
  pronouns?: string;
  notificationPreferences?: NotificationPreferences;
  groups?: Group[]; // Add groups to user context
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (credentials: { username: string; password: string }) => Promise<User>;
  signOut: () => Promise<void>;
  updateUserContext: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CACHE_KEY = 'aps_user_profile';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cached profile data structure
interface CachedProfile {
  user: User;
  groupsTimestamp: number; // Separate timestamp for groups
  timestamp: number;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Check if cached profile is still valid
  const getCachedProfile = (): User | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const parsed: CachedProfile = JSON.parse(cached);
      if (Date.now() - parsed.timestamp > CACHE_DURATION) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }

      return parsed.user;
    } catch {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
  };

  // Check if groups need refresh (shorter cache for groups)
  const shouldRefreshGroups = (cached: CachedProfile): boolean => {
    const GROUPS_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for groups
    return Date.now() - (cached.groupsTimestamp || 0) > GROUPS_CACHE_DURATION;
  };

  // Cache profile data
  const setCachedProfile = (userData: User, groupsRefreshed: boolean = false) => {
    try {
      const existing = localStorage.getItem(CACHE_KEY);
      const existingCache: CachedProfile | null = existing ? JSON.parse(existing) : null;

      const cached: CachedProfile = {
        user: userData,
        groupsTimestamp: groupsRefreshed ? Date.now() : (existingCache?.groupsTimestamp || Date.now()),
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
    } catch (error) {
      console.warn('Failed to cache profile:', error);
    }
  };

  // Clear cache
  const clearCache = () => {
    localStorage.removeItem(CACHE_KEY);
  };

  // Optimized profile fetching with better caching
  const fetchProfile = async (userId: string): Promise<User | null> => {
    try {
      // Check cache first with better validation
      const cached = getCachedProfile();
      if (cached && cached.uid === userId && cached.email) {
        console.log('✅ Using cached profile for user:', userId);
        
        // Check if groups need refresh
        const cachedData = localStorage.getItem(CACHE_KEY);
        const parsedCache: CachedProfile | null = cachedData ? JSON.parse(cachedData) : null;
        const needsGroupsRefresh = parsedCache ? shouldRefreshGroups(parsedCache) : true;
        
        if (needsGroupsRefresh) {
          console.log('📚 Cached groups are stale, refreshing...');
          const userGroups = await getMyGroups(cached);
          cached.groups = userGroups;
          console.log('✅ Refreshed', userGroups.length, 'groups for cached user');
          
          setUser(cached);
          setCachedProfile(cached, true); // Mark groups as refreshed
        } else {
          console.log('📚 Using cached groups');
          setUser(cached);
        }

        // Always ensure groups are assigned when using cached profile
        console.log('🔗 Ensuring groups are assigned for cached user...');
        await assignUserToGroups(cached);

        return cached;
      }

      // Single optimized database query with all necessary fields
      console.log('🔍 Fetching fresh profile from database for user:', userId);
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('id, email, full_name, role, branch, semester, department, year_of_study, usn, student_id, assigned_branches, assigned_semesters, rejection_reason, is_approved, avatar_url')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('⚠️ Profile not found, creating basic user for:', userId);
          // Create basic user if profile doesn't exist
          const basicUser: User = {
            uid: userId,
            email: null,
            displayName: null,
            role: 'student',
            is_approved: true,
            groups: [], // Empty groups for basic user
          };
          setUser(basicUser);
          return basicUser;
        }
        console.error('❌ Database error fetching profile:', error);
        return null;
      }

      // Convert to our User format with all fields
      const userData: User = {
        uid: profile.id,
        email: profile.email || null,
        displayName: profile.full_name || profile.email?.split('@')[0] || null,
        role: profile.role || 'student',
        usn: profile.usn || profile.student_id,
        branch: profile.branch || profile.department,
        semester: profile.semester || profile.year_of_study?.toString(),
        assignedBranches: profile.assigned_branches,
        assignedSemesters: profile.assigned_semesters,
        rejectionReason: profile.rejection_reason,
        is_approved: profile.is_approved,
        avatarDataUrl: profile.avatar_url,
      };

      // Load user's groups
      console.log('📚 Loading user groups...');
      const userGroups = await getMyGroups(userData);
      userData.groups = userGroups;
      console.log('✅ Loaded', userGroups.length, 'groups for user');

      // Cache the complete profile
      setCachedProfile(userData, true); // Mark groups as refreshed for fresh profile
      setUser(userData);

      // Always assign groups for fresh profile load too
      console.log('🔗 Assigning groups for freshly loaded user...');
      await assignUserToGroups(userData);

      console.log('✅ Fresh profile and groups loaded for user:', userId);
      return userData;

    } catch (error) {
      console.error('❌ Error fetching profile:', error);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;
    let authInitialized = false;

    const initializeAuth = async () => {
      try {
        console.log('🔐 Initializing authentication...');
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('❌ Auth session error:', error);
          if (mounted) setIsLoading(false);
          return;
        }

        if (session?.user && mounted) {
          console.log('✅ Found existing session, loading profile...');
          // Don't set isLoading to false yet - wait for profile to load
          const userData = await fetchProfile(session.user.id);
          if (userData && mounted) {
            console.log('✅ Profile loaded successfully');

            // Always ensure groups are assigned for existing sessions
            console.log('🔗 Ensuring groups are assigned for existing session...');
            await assignUserToGroups(userData);

            authInitialized = true;
          } else {
            console.log('⚠️ Profile load failed');
          }
        } else {
          console.log('ℹ️ No existing session found');
          authInitialized = true; // No session to load, so we're done
        }

        // Only set loading to false after we've fully initialized
        if (mounted) {
          console.log('🏁 Auth initialization complete');
          setIsLoading(false);
        }

      } catch (error) {
        console.error('❌ Error initializing auth:', error);
        if (mounted) setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('🔄 Auth state change:', event, !!session?.user);

      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ User signed in, loading profile...');
        // Don't set isLoading to false yet - wait for profile to load
        const userData = await fetchProfile(session.user.id);
        if (userData) {
          console.log('✅ Profile loaded for signed-in user');

          // Automatically assign user to appropriate groups
          console.log('🔗 Assigning user to groups...');
          await assignUserToGroups(userData);

          authInitialized = true;
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('🚪 User signed out');
        setUser(null);
        clearCache();
        authInitialized = true;
      }

      // For SIGNED_IN events, we wait for profile to load before setting loading to false
      // For SIGNED_OUT, we can set it immediately
      if (event === 'SIGNED_OUT' || (event === 'SIGNED_IN' && authInitialized)) {
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (credentials: { username: string; password: string }): Promise<User> => {
    setIsLoading(true);

    try {
      let authEmail = credentials.username;

      // Handle USN login
      if (!credentials.username.includes('@')) {
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('email, usn, student_id, role')
          .or(`usn.eq.${credentials.username},student_id.eq.${credentials.username}`)
          .in('role', ['student', 'alumni'])
          .single();

        if (!userProfile?.email) {
          throw new Error('User not found. Please check your USN or use your email to login.');
        }

        authEmail = userProfile.email;
      }

      // Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: credentials.password,
      });

      if (error) throw new Error(error.message);
      if (!data.user) throw new Error('Login failed');

      // Check approval status
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, is_approved, rejection_reason')
        .eq('id', data.user.id)
        .single();

      if (profile?.role === 'student' && !profile?.is_approved) {
        const reason = profile?.rejection_reason || 'Your account is pending approval.';
        throw new Error(`Account not approved: ${reason}`);
      }

      // Fetch and cache complete profile
      const userData = await fetchProfile(data.user.id);
      if (!userData) throw new Error('Failed to load profile');

      // Groups are already loaded in fetchProfile, no need to load again
      console.log('✅ User signed in with', userData.groups?.length || 0, 'groups');

      // Cache with groups marked as refreshed
      setCachedProfile(userData, true);

      // Automatically assign user to appropriate groups
      console.log('🔗 Assigning groups to newly signed-in user...');
      await assignUserToGroups(userData);

      // Generate notifications for the newly signed-in user
      setTimeout(() => checkAndGenerateNotifications(userData), 2000);

      setIsLoading(false);
      return userData;

    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    // Instant logout - clear state immediately
    setUser(null);
    clearCache();

    // Handle Supabase signOut in background
    try {
      await supabase.auth.signOut();
    } catch (error: any) {
      console.warn('Background signOut error:', error?.message);
    }
  };

  const updateUserContext = (updatedUser: User) => {
    setUser(updatedUser);
    setCachedProfile(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut, updateUserContext }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
