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
    // Prevent multiple initializations across page navigations
    const authInitializedKey = 'auth_initialized';
    const hasInitialized = sessionStorage.getItem(authInitializedKey);

    if (hasInitialized) {
      console.log('🔄 Auth already initialized for this session, skipping...');
      setIsLoading(false); // Ensure loading is false for already initialized sessions
      return;
    }

    let mounted = true;

    // Safety timeout to prevent infinite loading (30 seconds max)
    const safetyTimeout = setTimeout(() => {
      if (mounted && isLoading) {
        console.error('🚨 SAFETY TIMEOUT: Auth initialization took too long, forcing loading to false');
        setIsLoading(false);
      }
    }, 30000);

    const initializeAuth = async () => {
      try {
        console.log('🔐 Initializing authentication...');

        // Always set loading to false when done, regardless of outcome
        const finishLoading = () => {
          if (mounted) {
            console.log('🏁 Auth initialization complete');
            setIsLoading(false);
            clearTimeout(safetyTimeout); // Clear safety timeout
            sessionStorage.setItem(authInitializedKey, 'true'); // Mark as initialized
          }
        };

        // Add timeout to session check (10 seconds)
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session check timeout')), 10000)
        );

        const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]) as any;

        if (error) {
          console.error('❌ Auth session error:', error);
          finishLoading();
          return;
        }

        if (session?.user && mounted) {
          console.log('✅ Found existing session, checking cache...');

          // First check if we have valid cached data
          const cachedUser = getCachedProfile();
          if (cachedUser && cachedUser.uid === session.user.id) {
            console.log('✅ Using cached user data - instant access!');
            setUser(cachedUser);
            finishLoading();
            return;
          }

          console.log('📥 Loading profile from database...');

          // Add timeout to profile loading (15 seconds)
          const profilePromise = fetchProfile(session.user.id);
          const profileTimeoutPromise = new Promise<User | null>((_, reject) =>
            setTimeout(() => reject(new Error('Profile loading timeout')), 15000)
          );

          const userData = await Promise.race([profilePromise, profileTimeoutPromise]);

          if (userData && mounted) {
            console.log('✅ Profile loaded successfully for existing session');
            setUser(userData);
            // Groups are already assigned in fetchProfile, no need to do it again here
          } else {
            console.log('⚠️ Profile load failed for existing session');
          }
        } else {
          console.log('ℹ️ No existing session found - user needs to login');
        }

        finishLoading();

      } catch (error) {
        console.error('❌ Error initializing auth:', error);
        if (mounted) {
          setIsLoading(false);
          clearTimeout(safetyTimeout);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('🔄 Auth state change:', event, !!session?.user);

      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ User signed in, loading profile...');
        setIsLoading(true); // Start loading for sign-in process

        // Add timeout to profile loading (15 seconds)
        const profilePromise = fetchProfile(session.user.id);
        const profileTimeoutPromise = new Promise<User | null>((_, reject) =>
          setTimeout(() => reject(new Error('Sign-in profile loading timeout')), 15000)
        );

        const userData = await Promise.race([profilePromise, profileTimeoutPromise]);

        if (userData) {
          console.log('✅ Profile loaded for signed-in user');
          setUser(userData);
          // Groups are already assigned in fetchProfile
        } else {
          console.log('⚠️ Profile load failed during sign-in');
        }

        // Always finish loading after sign-in process
        setIsLoading(false);

      } else if (event === 'SIGNED_OUT') {
        console.log('🚪 User signed out');
        setUser(null);
        clearCache();
        sessionStorage.removeItem(authInitializedKey); // Clear initialization flag
        setIsLoading(false);
      }
    });

    // Handle tab visibility changes (tab switching)
    const handleVisibilityChange = () => {
      if (!mounted) return;

      if (document.visibilityState === 'visible') {
        console.log('👁️ Tab became visible, checking auth status...');

        // Only check if we have a cached user and are not currently loading
        const cachedUser = getCachedProfile();
        if (cachedUser && !isLoading) {
          console.log('✅ Cached user found, ensuring data is fresh...');
          // Quick check if groups need refresh (but don't set loading to true)
          const cachedData = localStorage.getItem(CACHE_KEY);
          const parsedCache: CachedProfile | null = cachedData ? JSON.parse(cachedData) : null;
          const needsGroupsRefresh = parsedCache ? shouldRefreshGroups(parsedCache) : false;

          if (needsGroupsRefresh) {
            console.log('📚 Groups need refresh on tab switch...');
            // Refresh groups in background without showing loading
            getMyGroups(cachedUser).then(groups => {
              if (mounted) {
                cachedUser.groups = groups;
                setUser({ ...cachedUser });
                setCachedProfile(cachedUser, true);
                console.log('✅ Groups refreshed on tab switch');
              }
            }).catch(error => {
              console.warn('⚠️ Failed to refresh groups on tab switch:', error);
            });
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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
