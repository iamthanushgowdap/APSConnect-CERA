
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { UserRole, Branch, UserProfile, Semester, NotificationPreferences } from '@/types'; 
import { useToast } from '@/hooks/use-toast';
import { SiteConfig } from '@/config/site'; 
// import { UpdateNotificationToast } from '@/components/notifications/update-notification-toast';
import { useRouter } from 'next/navigation';
import { checkAndGenerateNotifications } from '@/lib/notification-manager';
import { getUserProfile, updateUserProfile, testDatabaseConnection, migrateProfileByUsn } from '@/lib/supabase-utils';
import { supabase } from '@/lib/supabase';


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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  const defaultNotificationPreferences: NotificationPreferences = {
    news: true,
    events: true,
    notes: true,
    schedules: true,
    general: true,
    approval: true,
    assignment_deadline: true,
    fee_due: true,
    low_attendance: true,
  };

  const checkForAlumniStatus = (profile: UserProfile): UserRole => {
    if (profile.role === 'alumni') return 'alumni'; // Already an alumni, no change
    if (profile.role === 'student' && profile.education && profile.education.length > 0) {
      const latestEducation = profile.education.sort((a: any, b: any) => parseInt(b.graduationYear) - parseInt(a.graduationYear))[0];
      const gradYear = parseInt(latestEducation.graduationYear);
      const currentYear = new Date().getFullYear();
      if (!isNaN(gradYear) && currentYear > gradYear) {
        return 'alumni';
      }
    }
    return profile.role;
  };

  useEffect(() => {
    setIsLoading(true);
    
    // Check for existing Supabase session
    const getSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
      }
      
      if (session?.user) {
        console.log('🔄 Initial session found, fetching profile...');
        
        // Fetch profile data for the authenticated user (same as sign-in flow)
        let profileData = null;
        const { data: fetchedProfileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        profileData = fetchedProfileData;
        
        console.log('🔄 getSession profile fetch result:', {
          hasProfileData: !!profileData,
          profileError,
          profileErrorCode: profileError?.code,
          userId: session.user.id,
          profileDataSnippet: profileData ? {
            id: profileData.id,
            email: profileData.email,
            branch: profileData.branch,
            semester: profileData.semester,
            usn: profileData.usn
          } : null
        });

        if (profileError) {
          console.error('❌ Error fetching profile in getSession:', profileError);
          
          // Try to migrate profile by email if profile fetch failed (including PGRST116)
          console.log('🔄 Attempting profile migration in getSession for user:', session.user.id, 'email:', session.user.email);
          const migratedProfile = await migrateProfileByUsn(session.user.id, session.user.email || '');
          
          if (migratedProfile) {
            console.log('✅ Profile migration successful in getSession, retrying profile fetch');
            // Retry profile fetch with migrated profile
            const { data: retryProfileData, error: retryError } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
              
            if (!retryError && retryProfileData) {
              console.log('✅ Profile fetch successful after migration in getSession');
              profileData = retryProfileData;
            }
          } else {
            console.log('⚠️ Profile migration failed in getSession');
            // For PGRST116 (no profile exists), we can still create a basic user object
            if (profileError.code === 'PGRST116') {
              console.log('📝 No profile exists in getSession, creating user object with basic info');
              const basicUser: User = {
                uid: session.user.id,
                email: session.user.email || null,
                displayName: session.user.user_metadata?.displayName || session.user.user_metadata?.name || session.user.email?.split('@')[0] || null,
                role: session.user.user_metadata?.role || 'student',
                // No branch/semester/usn yet - profile needs to be created
              };
              setUser(basicUser);
              checkAndGenerateNotifications(basicUser);
              setIsLoading(false);
              return;
            }
          }
        }  
        
        // Convert Supabase user to our User format (same as sign-in flow)
        const user: User = {
          uid: session.user.id,
          email: session.user.email || null,
          displayName: profileData?.full_name || session.user.user_metadata?.displayName || session.user.user_metadata?.name || session.user.email?.split('@')[0] || null,
          role: profileData?.role || session.user.user_metadata?.role || 'student',
          usn: profileData?.usn || profileData?.student_id,
          branch: profileData?.branch || profileData?.department,
          semester: profileData?.semester || profileData?.year_of_study?.toString(),
          assignedBranches: profileData?.assigned_branches,
          assignedSemesters: profileData?.assigned_semesters,
        };
        
        console.log('🔄 User object from getSession:', {
          uid: user.uid,
          branch: user.branch,
          semester: user.semester,
          hasBranch: !!user.branch,
          hasSemester: !!user.semester
        });
        
        setUser(user);
        console.log('✅ User object SET in context from getSession');
        checkAndGenerateNotifications(user);
      } else {
        setUser(null);
      }
      
      setIsLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state change:', event, !!session);

      if (session?.user) {
        console.log('🔍 Fetching profile for auth state change, userId:', session.user.id);

        // Fetch profile data for the authenticated user
        let profileData = null;
        const { data: fetchedProfileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        profileData = fetchedProfileData;

        console.log('📊 Profile fetch result:', {
          hasProfileData: !!profileData,
          profileError,
          profileErrorCode: profileError?.code,
          profileErrorMessage: profileError?.message,
          profileErrorDetails: profileError?.details,
          profileErrorHint: profileError?.hint,
          profileDataKeys: profileData ? Object.keys(profileData) : null,
          profileDataSnippet: profileData ? {
            id: profileData.id,
            email: profileData.email,
            branch: profileData.branch,
            semester: profileData.semester,
            usn: profileData.usn
          } : null
        });

        if (profileError) {
          console.error('❌ Error fetching profile on auth change:', profileError);
          
          // Try to migrate profile by email if profile fetch failed (including PGRST116)
          console.log('🔄 Attempting profile migration for user:', session.user.id, 'email:', session.user.email);
          const migratedProfile = await migrateProfileByUsn(session.user.id, session.user.email || '');
          
          if (migratedProfile) {
            console.log('✅ Profile migration successful, retrying profile fetch');
            // Retry profile fetch with migrated profile
            const { data: retryProfileData, error: retryError } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
              
            if (!retryError && retryProfileData) {
              console.log('✅ Profile fetch successful after migration');
              profileData = retryProfileData;
            }
          } else {
            console.log('⚠️ Profile migration failed or no profile to migrate');
            // For PGRST116 (no profile exists), create a basic user object but try to get profile data another way
            if (profileError.code === 'PGRST116') {
              console.log('📝 Trying alternative profile fetch...');
              
              // Try to get profile by email instead of ID
              const { data: emailProfile, error: emailError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('email', session.user.email)
                .single();
                
              if (!emailError && emailProfile) {
                console.log('✅ Found profile by email, updating ID and using data');
                // Update the profile ID to match
                await supabase
                  .from('user_profiles')
                  .update({ id: session.user.id })
                  .eq('email', session.user.email);
                  
                profileData = emailProfile;
                profileData.id = session.user.id; // Override ID for user object
              } else {
                console.log('📝 No profile found, creating basic user object');
                const basicUser: User = {
                  uid: session.user.id,
                  email: session.user.email || null,
                  displayName: session.user.user_metadata?.displayName || session.user.user_metadata?.name || session.user.email?.split('@')[0] || null,
                  role: session.user.user_metadata?.role || 'student',
                  // No branch/semester/usn yet - profile needs to be created
                };
                setUser(basicUser);
                checkAndGenerateNotifications(basicUser);
                setIsLoading(false);
                return;
              }
            } else {
              // For other errors, don't update user object
              setIsLoading(false);
              return;
            }
          }
        }

        // Only create and set user object if we have profile data or it's a new profile
        const user: User = {
          uid: session.user.id,
          email: session.user.email || null,
          displayName: profileData?.full_name || session.user.user_metadata?.displayName || session.user.user_metadata?.name || session.user.email?.split('@')[0] || null,
          role: profileData?.role || session.user.user_metadata?.role || 'student',
          usn: profileData?.usn || profileData?.student_id,
          branch: profileData?.branch || profileData?.department,
          semester: profileData?.semester || profileData?.year_of_study?.toString(),
          assignedBranches: profileData?.assigned_branches,
          assignedSemesters: profileData?.assigned_semesters,
        };

        console.log('🔄 FINAL User object being set:', {
          uid: user.uid,
          usn: user.usn,
          branch: user.branch,
          semester: user.semester,
          hasUsn: !!user.usn,
          profileDataUsn: profileData?.usn,
          profileDataStudentId: profileData?.student_id
        });

        setUser(user);
        console.log('✅ User object SET in context from auth state change');
        checkAndGenerateNotifications(user);
      } else {
        console.log('🔄 User logged out');
        setUser(null);
      }
      setIsLoading(false);
    });

    // Remove the old update notification logic since it's commented out

    return () => {
      subscription.unsubscribe();
    };
  }, []); 

  const signIn = async (credentials: { username: string; password: string }): Promise<User> => {
    setIsLoading(true);
    
    try {
      let authEmail = credentials.username;
      
      // Check if username looks like a USN (contains numbers or is not an email format)
      const isEmail = credentials.username.includes('@');
      
      if (!isEmail) {
        // Assume it's a USN - look up the student in the database
        const { data: studentProfile, error: lookupError } = await supabase
          .from('user_profiles')
          .select('email, usn, student_id')
          .or(`usn.eq.${credentials.username},student_id.eq.${credentials.username}`)
          .eq('role', 'student')
          .single();
        
        if (lookupError || !studentProfile) {
          throw new Error('Student not found. Please check your USN.');
        }
        
        if (!studentProfile.email) {
          throw new Error('Student account not properly configured. Please contact admin.');
        }
        
        authEmail = studentProfile.email;
      }
      
      // Now authenticate with Supabase using the email
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: credentials.password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.user) {
        // Migrate profile ID if it doesn't match auth user ID
        if (!isEmail) {
          console.log('🔄 Checking profile ID migration for user:', data.user.id, 'with email:', data.user.email);
          await migrateProfileByUsn(data.user.id, data.user.email || '');
        }

        // Get the full profile from our database
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        if (profileError) {
          throw new Error('Profile not found. Please contact administration.');
        }

        // Check if student is approved (only for student role)
        if (profileData.role === 'student' && !profileData.is_approved) {
          const reason = profileData.rejection_reason || 'Your account is pending approval.';
          throw new Error(`Account not approved: ${reason}`);
        }

        if (profileData.role === 'pending' && !profileData.is_approved) {
          const reason = profileData.rejection_reason || 'Your account is pending approval.';
          throw new Error(`Account not approved: ${reason}`);
        }

        const user: User = {
          uid: data.user.id,
          email: data.user.email || null,
          displayName: profileData?.full_name || data.user.user_metadata?.displayName || data.user.user_metadata?.name || data.user.email?.split('@')[0] || null,
          role: profileData?.role || data.user.user_metadata?.role || 'student',
          usn: profileData?.usn || profileData?.student_id,
          branch: profileData?.branch || profileData?.department,
          semester: profileData?.semester || profileData?.year_of_study?.toString(),
          assignedBranches: profileData?.assigned_branches,
          assignedSemesters: profileData?.assigned_semesters,
        };

        console.log('✅ Profile fetched successfully:', {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          usn: user.usn,
          branch: user.branch,
          semester: user.semester
        });

        setUser(user);
        console.log('✅ User object SET in context from sign-in');
        console.log('🔍 Current user context after sign-in:', user);
        checkAndGenerateNotifications(user);
        setIsLoading(false);
        return user;
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new Error(error.message);
      }
      setUser(null);
      router.push('/login'); // Navigate to login page after sign out
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserContext = (updatedUser: User) => {
    setUser(updatedUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mockUser', JSON.stringify(updatedUser));
    }
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
