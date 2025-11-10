"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { UserRole, Branch, UserProfile, Semester, NotificationPreferences } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { checkAndGenerateNotifications } from '@/lib/notification-manager';

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

  // Cache profile data
  const setCachedProfile = (userData: User) => {
    const cached: CachedProfile = {
      user: userData,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
  };

  // Clear cache
  const clearCache = () => {
    localStorage.removeItem(CACHE_KEY);
  };

  // Optimized profile fetching with caching
  const fetchProfile = async (userId: string): Promise<User | null> => {
    try {
      // Check cache first
      const cached = getCachedProfile();
      if (cached && cached.uid === userId) {
        setUser(cached);
        return cached;
      }

      // Single optimized database query
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist - create basic user
          const basicUser: User = {
            uid: userId,
            email: null,
            displayName: null,
            role: 'student',
          };
          setUser(basicUser);
          return basicUser;
        }
        throw error;
      }

      // Convert to our User format
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
      };

      // Cache the profile
      setCachedProfile(userData);
      setUser(userData);

      // Generate notifications for the user
      setTimeout(() => checkAndGenerateNotifications(userData), 1000);

      return userData;

    } catch (error) {
      console.error('Error fetching profile:', error);
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
