
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Users, Search, ShieldCheck, ArrowLeft, GraduationCap, BookOpen } from 'lucide-react';
import { SimpleRotatingSpinner } from '@/components/ui/loading-spinners';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { UserProfileCard } from '@/components/users/user-profile-card';
import { getUserProfiles, getBranches } from '@/lib/supabase-utils';
import { defaultBranches, semesters } from '@/types';

export default function ProfilesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [semesterFilter, setSemesterFilter] = useState<string>('all');
  const [availableBranches, setAvailableBranches] = useState<string[]>([]);
  const [availableSemesters, setAvailableSemesters] = useState<string[]>([]);

  // Role-based access control - prevent alumni from accessing profiles
  const allowedRoles = ['admin', 'faculty', 'student'];
  const hasAccess = user && allowedRoles.includes(user.role);

  const goToDashboard = () => {
    if (!user) return;
    
    // Navigate to role-specific dashboard
    switch (user.role) {
      case 'admin':
        router.push('/admin');
        break;
      case 'faculty':
        router.push('/faculty');
        break;
      case 'alumni':
        router.push('/alumni');
        break;
      case 'student':
      default:
        router.push('/student');
        break;
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }
      if (!hasAccess) {
        // Redirect alumni to their dashboard
        router.push('/alumni');
        return;
      }

      const loadProfiles = async () => {
        try {
          console.log('🔍 Loading profiles from Supabase...');
          // First try to get profiles from Supabase
          const profiles = await getUserProfiles();
          console.log('✅ Loaded profiles from Supabase:', profiles.length);

          // Also get branches from branches table
          const branches = await getBranches();
          console.log('🏫 Loaded branches from database:', branches);

          // Filter for approved students, faculty, and admin
          const filteredProfiles = profiles.filter(p =>
            p.role === 'admin' ||
            (p.role === 'faculty') ||
            (p.role === 'student' && p.is_approved)
          );

          console.log('📊 Filtered profiles:', filteredProfiles.length);
          setAllUsers(filteredProfiles);

          // Use branches from branches table for filter options
          setAvailableBranches(branches);

          // Extract available semesters from user profiles
          const semesters = [...new Set(filteredProfiles.map(p => p.semester).filter((s): s is string => Boolean(s)))].sort();
          setAvailableSemesters(semesters);
          console.log('📚 Available semesters for filters:', semesters);
        } catch (error) {
          console.error('❌ Failed to load from Supabase, falling back to localStorage:', error);

          // Fallback to localStorage if Supabase fails
          if (typeof window !== 'undefined') {
            const profiles: UserProfile[] = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key?.startsWith('apsconnect_user_')) {
                try {
                  const profile = JSON.parse(localStorage.getItem(key)!);
                  // Only show approved students and faculty, and the admin
                  if ((profile.role === 'student' && profile.isApproved) || profile.role === 'faculty' || profile.role === 'admin') {
                    profiles.push(profile);
                  }
                } catch(e) { console.error(`Failed to parse profile ${key}`); }
              }
            }
            console.log('📥 Loaded profiles from localStorage:', profiles.length, profiles.map(p => ({ name: p.full_name, role: p.role, branch: p.branch, semester: p.semester })));
            setAllUsers(profiles);

            // Extract available branches and semesters from localStorage data too
            const branches = [...new Set(profiles.map(p => p.branch).filter((b): b is string => Boolean(b)))].sort();
            const semesters = [...new Set(profiles.map(p => p.semester).filter((s): s is string => Boolean(s)))].sort();
            setAvailableBranches(branches);
            setAvailableSemesters(semesters);
          }
        } finally {
          setPageLoading(false);
        }
      };

      loadProfiles();
    }
  }, [user, authLoading, router, hasAccess]);

  // Reset filters when they become invalid for the user's role
  useEffect(() => {
    if (user?.role === 'faculty') {
      // Reset branch filter if faculty is not assigned to that branch
      if (branchFilter !== 'all' && user.assignedBranches && !user.assignedBranches.includes(branchFilter)) {
        setBranchFilter('all');
      }
      // Reset semester filter if faculty is not assigned to that semester
      if (semesterFilter !== 'all' && user.assignedSemesters && !user.assignedSemesters.includes(semesterFilter as any)) {
        setSemesterFilter('all');
      }
    } else if (user?.role === 'student') {
      // Reset branch filter if it doesn't match student's branch
      if (branchFilter !== 'all' && branchFilter !== user.branch) {
        setBranchFilter('all');
      }
      // Reset semester filter if it doesn't match student's semester
      if (semesterFilter !== 'all' && semesterFilter !== user.semester) {
        setSemesterFilter('all');
      }
    }
  }, [user, branchFilter, semesterFilter]);

  const filteredUsers = useMemo(() => {
    let users = allUsers;
    console.log('🔍 Profiles Debug:', {
      totalUsers: allUsers.length,
      dataSource: 'Supabase (with localStorage fallback)',
      userRole: user?.role,
      userBranch: user?.branch,
      userSemester: user?.semester,
      userAssignedBranches: user?.assignedBranches,
      userAssignedSemesters: user?.assignedSemesters,
      searchTerm,
      roleFilter,
      branchFilter,
      semesterFilter
    });

    // Role-based filtering for profile visibility
    if (user?.role === 'student') {
      // Students can only see faculty from their branch and semester
      const originalCount = users.length;
      console.log('👨‍🎓 Student filtering debug:');
      console.log('  Student branch:', user.branch);
      console.log('  Student semester:', user.semester);

      users = users.filter(p => {
        let matches = false;

        if (p.role === 'faculty') {
          // For faculty: check if student is in faculty's assigned branches/semesters
          const assignedBranches = p.assigned_branches || [];
          const assignedSemesters = p.assigned_semesters || [];

          matches = (!user.branch || assignedBranches.includes(user.branch)) &&
                   (!user.semester || assignedSemesters.includes(user.semester));

          console.log(`  Faculty ${p.full_name}: assigned_branches=${JSON.stringify(assignedBranches)}, assigned_semesters=${JSON.stringify(assignedSemesters)}, matches=${matches}`);
        }

        return matches;
      });
      console.log(`👨‍🎓 Student filter: ${originalCount} -> ${users.length} users (faculty only)`);
    } else if (user?.role === 'faculty') {
      // Faculty can only see students from their assigned branches and semesters
      const originalCount = users.length;
      const assignedBranches = user.assignedBranches || [];
      const assignedSemesters = user.assignedSemesters || [];

      console.log('👨‍🏫 Faculty filtering debug:');
      console.log('  Faculty assigned_branches:', assignedBranches);
      console.log('  Faculty assigned_semesters:', assignedSemesters);

      if (assignedBranches.length === 0 && assignedSemesters.length === 0) {
        // If no assignments, show no students
        users = users.filter(p => false);
        console.log('👨‍🏫 Faculty filter: No assigned branches/semesters, showing 0 students');
      } else {
        users = users.filter(p => {
          const matches = p.role === 'student' &&
            p.branch &&
            p.semester &&
            (assignedBranches.length === 0 || assignedBranches.includes(p.branch)) &&
            (assignedSemesters.length === 0 || assignedSemesters.includes(p.semester as any));

          if (p.role === 'student') {
            console.log(`  Student ${p.full_name}: branch=${p.branch}, semester=${p.semester}, matches=${matches}`);
          }

          return matches;
        });
        console.log(`👨‍🏫 Faculty filter: ${originalCount} -> ${users.length} students`);
      }
    } else if (user?.role === 'admin') {
      // Admin can see ALL users (no filtering)
      console.log(`👑 Admin: showing all ${users.length} users (no filtering)`);
      // No filtering applied - admin sees everything
    }

    // Apply role filter (new frontend filter)
    if (roleFilter !== 'all') {
      const originalCount = users.length;
      users = users.filter(p => p.role === roleFilter);
      console.log(`🏷️ Role filter (${roleFilter}): ${originalCount} -> ${users.length} users`);
    }

    // Apply branch filter
    if (branchFilter !== 'all') {
      const originalCount = users.length;
      users = users.filter(p => p.branch === branchFilter);
      console.log(`🏫 Branch filter (${branchFilter}): ${originalCount} -> ${users.length} users`);
    }

    // Apply semester filter
    if (semesterFilter !== 'all') {
      const originalCount = users.length;
      users = users.filter(p => p.semester === semesterFilter);
      console.log(`📚 Semester filter (${semesterFilter}): ${originalCount} -> ${users.length} users`);
    }

    // Apply search filter
    if (searchTerm) {
      const originalCount = users.length;
      const term = searchTerm.toLowerCase();
      users = users.filter(p =>
        p.full_name?.toLowerCase().includes(term) ||
        p.email.toLowerCase().includes(term) ||
        p.usn?.toLowerCase().includes(term) ||
        p.branch?.toLowerCase().includes(term) ||
        p.semester?.toLowerCase().includes(term) ||
        p.role.toLowerCase().includes(term)
      );
      console.log(`🔍 Search filter: ${originalCount} -> ${users.length} users`);
    }

    console.log('📊 Final filtered users:', users.map(u => ({ name: u.full_name, role: u.role, branch: u.branch, semester: u.semester })));
    return users;
  }, [searchTerm, roleFilter, branchFilter, semesterFilter, allUsers, user]);

  if (pageLoading || authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <SimpleRotatingSpinner className="h-12 w-12 text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Card className="max-w-md mx-auto shadow-lg"><CardHeader><CardTitle className="text-destructive">Access Denied</CardTitle></CardHeader><CardContent><ShieldCheck className="h-16 w-16 text-destructive mx-auto mb-4" /><p>You must be logged in to view profiles.</p><Link href="/login"><Button variant="outline" className="mt-6">Login</Button></Link></CardContent></Card>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Card className="max-w-md mx-auto shadow-lg"><CardHeader><CardTitle className="text-destructive">Access Denied</CardTitle></CardHeader><CardContent><ShieldCheck className="h-16 w-16 text-destructive mx-auto mb-4" /><p>Profiles are only available for students, faculty, and administrators.</p><Link href="/alumni"><Button variant="outline" className="mt-6">Go to Alumni Dashboard</Button></Link></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">User Profiles</h1>
          <p className="text-muted-foreground">
            {user?.role === 'student' && 'View faculty profiles from your branch and semester.'}
            {user?.role === 'faculty' && 'View student profiles from your assigned branches and semesters.'}
            {user?.role === 'admin' && 'Browse all faculty and student profiles.'}
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={goToDashboard} aria-label="Go back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="mb-6 flex flex-col lg:flex-row gap-4 max-w-4xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder={
              user?.role === 'student' ? 'Search faculty by name, email...' :
              user?.role === 'faculty' ? 'Search students by name, USN...' :
              'Search by name, email, USN, branch...'
            }
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-4 lg:flex-1">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="flex-1">
              <Users className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All {user?.role === 'faculty' ? 'Students' : user?.role === 'student' ? 'Faculty' : 'Roles'}</SelectItem>
              {user?.role === 'faculty' ? (
                <SelectItem value="student">Students Only</SelectItem>
              ) : user?.role === 'student' ? (
                <SelectItem value="faculty">Faculty Only</SelectItem>
              ) : (
                <>
                  <SelectItem value="faculty">Faculty Only</SelectItem>
                  <SelectItem value="admin">Admin Only</SelectItem>
                  <SelectItem value="student">Students Only</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="flex-1">
              <GraduationCap className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All {user?.role === 'faculty' ? 'Assigned' : ''} Branches</SelectItem>
              {user?.role === 'faculty' && user.assignedBranches ? (
                user.assignedBranches.map(branch => (
                  <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                ))
              ) : user?.role === 'student' ? (
                user.branch ? (
                  <SelectItem key={user.branch} value={user.branch}>{user.branch}</SelectItem>
                ) : null
              ) : (
                availableBranches.map(branch => (
                  <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <Select value={semesterFilter} onValueChange={setSemesterFilter}>
            <SelectTrigger className="flex-1">
              <BookOpen className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by semester" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All {user?.role === 'faculty' ? 'Assigned' : ''} Semesters</SelectItem>
              {user?.role === 'faculty' && user.assignedSemesters ? (
                user.assignedSemesters.map(semester => (
                  <SelectItem key={semester} value={semester}>{semester}</SelectItem>
                ))
              ) : user?.role === 'student' ? (
                user.semester ? (
                  <SelectItem key={user.semester} value={user.semester}>{user.semester}</SelectItem>
                ) : null
              ) : (
                availableSemesters.map(semester => (
                  <SelectItem key={semester} value={semester}>{semester}</SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Profile count display */}
      <div className="mb-4 text-sm text-muted-foreground">
        Showing {filteredUsers.length} of {allUsers.length} profiles
        {roleFilter !== 'all' && ` (role: ${roleFilter})`}
        {branchFilter !== 'all' && ` (branch: ${branchFilter})`}
        {semesterFilter !== 'all' && ` (semester: ${semesterFilter})`}
        {searchTerm && ` matching "${searchTerm}"`}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map(profile => {
          // Conditionally render the Link wrapper
          if (profile.role === 'student' || profile.role === 'admin') {
            return (
              <Link key={profile.id} href={`/profile/${profile.id}`}>
                <UserProfileCard profile={profile} />
              </Link>
            );
          }
          // For faculty, render the card without the link
          return (
            <div key={profile.id}>
              <UserProfileCard profile={profile} />
            </div>
          );
        })}
      </div>
       {filteredUsers.length === 0 && (
          <p className="text-center text-muted-foreground col-span-full mt-10">No profiles match your search.</p>
        )}
    </div>
  );
}
