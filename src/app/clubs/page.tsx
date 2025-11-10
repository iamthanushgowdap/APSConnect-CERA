
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, User } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ShieldCheck, Users, Info, Shield, ArrowLeft, ArrowRight, MessageSquare, Building } from 'lucide-react';
import { SimpleRotatingSpinner } from '@/components/ui/loading-spinners';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getMyGroups } from '@/lib/groups-utils';
import type { Group } from '@/types';

export default function ClubsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Role-based access control - only allow admin, faculty, and students
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

  const fetchGroups = useCallback(async () => {
    if (user) {
      const groups = await getMyGroups(user);
      setMyGroups(groups);

      // If no groups found, try to populate them
      if (groups.length === 0) {
        console.log('No groups found, attempting to populate groups...');
        // This would be handled by a migration script or admin function
        // For now, we'll just show the empty state
      }
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (!hasAccess) {
        // Redirect alumni and other unauthorized users
        router.push(user.role === 'alumni' ? '/alumni' : '/dashboard');
      } else {
        fetchGroups();
        setPageLoading(false);
      }
    }
  }, [user, authLoading, router, fetchGroups, hasAccess]);

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
        <Card className="max-w-md mx-auto shadow-lg"><CardHeader><CardTitle className="text-destructive">Access Denied</CardTitle></CardHeader><CardContent><ShieldCheck className="h-16 w-16 text-destructive mx-auto mb-4" /><p>You must be logged in to view this page.</p><Link href="/login"><Button variant="outline" className="mt-6">Go to Login</Button></Link></CardContent></Card>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Card className="max-w-md mx-auto shadow-lg"><CardHeader><CardTitle className="text-destructive">Access Denied</CardTitle></CardHeader><CardContent><ShieldCheck className="h-16 w-16 text-destructive mx-auto mb-4" /><p>Clubs are only available for students, faculty, and administrators.</p><Link href={user.role === 'alumni' ? '/alumni' : '/dashboard'}><Button variant="outline" className="mt-6">Go to Dashboard</Button></Link></CardContent></Card>
      </div>
    );
  }

  const officialGroups = myGroups.filter(g => g.type === 'official');
  const studentGroups = myGroups.filter(g => g.type === 'student');

  // Organize groups for faculty/admin
  const facultyLounge = officialGroups.find(g => g.id === 'faculty_lounge');
  const adminAnnouncements = officialGroups.find(g => g.id === 'admin_announcements');
  const officialAnnouncements = officialGroups.find(g => g.id === 'official_announcements');

  // Group department groups by branch
  const departmentGroups = officialGroups.filter(g =>
    g.id.endsWith('_official') && !g.id.includes('department') &&
    !g.id.includes('lounge') && !g.id.includes('admin') && !g.id.includes('announcements') &&
    g.semester === 'ALL'
  );

  const classGroups = officialGroups.filter(g =>
    g.id.endsWith('_official') && !g.id.includes('department') &&
    !g.id.includes('lounge') && !g.id.includes('admin') && !g.id.includes('announcements') &&
    g.semester !== 'ALL'
  );

  // Group by branch for better organization
  const groupsByBranch = [...departmentGroups, ...classGroups].reduce((acc, group) => {
    if (!acc[group.branch]) {
      acc[group.branch] = { department: null, classes: [] };
    }
    if (group.semester === 'ALL') {
      acc[group.branch].department = group;
    } else {
      acc[group.branch].classes.push(group);
    }
    return acc;
  }, {} as Record<string, { department: Group | null, classes: Group[] }>);

  // Quick access groups (first group from each category) - role-aware
  const quickAccessGroups = [
    officialAnnouncements,
    user.role === 'admin' ? adminAnnouncements : null,
    user.role === 'faculty' || user.role === 'admin' ? facultyLounge : null,
    departmentGroups[0],
    studentGroups[0]
  ].filter(Boolean) as Group[];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-primary flex items-center gap-3">
            <Users className="h-8 w-8" /> Clubs & Groups
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Connect, collaborate, and stay updated with your academic community
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={goToDashboard} aria-label="Go back" className="hidden sm:flex">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* Quick Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{officialGroups.length}</p>
                <p className="text-sm text-muted-foreground">Official Groups</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{studentGroups.length}</p>
                <p className="text-sm text-muted-foreground">Discussion Groups</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{Object.keys(groupsByBranch).length}</p>
                <p className="text-sm text-muted-foreground">Departments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{myGroups.length}</p>
                <p className="text-sm text-muted-foreground">Total Groups</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Section */}
      {quickAccessGroups.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-primary flex items-center gap-2">
            <Shield className="h-5 w-5" /> Quick Access
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {quickAccessGroups.map(group => (
              <Link key={`quick-${group.id}`} href={`/clubs/${group.id}`} className="block">
                <Card className="hover:shadow-md transition-shadow border-2 hover:border-primary/50">
                  <CardContent className="p-4 text-center">
                    <div className="mb-2">
                      {group.type === 'student' ? (
                        <MessageSquare className="h-8 w-8 mx-auto text-green-600" />
                      ) : group.id.includes('admin') ? (
                        <ShieldCheck className="h-8 w-8 mx-auto text-red-600" />
                      ) : group.id.includes('faculty') ? (
                        <Shield className="h-8 w-8 mx-auto text-blue-600" />
                      ) : (
                        <Building className="h-8 w-8 mx-auto text-purple-600" />
                      )}
                    </div>
                    <h3 className="font-semibold text-sm truncate">{group.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{group.type === 'student' ? 'Discussion' : 'Official'}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {myGroups.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            <Info className="mx-auto h-12 w-12 mb-4" />
            <p className="text-lg mb-2">No groups available yet</p>
            <p className="mb-4">Groups are automatically created and assigned based on your branch and semester information.</p>
            <div className="text-sm space-y-1">
              <p><strong>For Students:</strong> You'll see official class announcements and peer discussion groups</p>
              <p><strong>For Faculty:</strong> You'll see official communication groups and faculty discussions</p>
              <p><strong>For Admins:</strong> You'll see administrative announcement groups and all official groups</p>
              <p><strong>Note:</strong> Student discussion groups are private and only visible to students</p>
            </div>
            <p className="text-sm mt-4 text-muted-foreground">
              If you're not seeing groups, please contact your administrator to ensure your profile is complete and groups are populated.
            </p>
          </CardContent>
        </Card>
      ) : user.role === 'student' ? (
        // Student Layout - Shows Official Groups and Student Discussion Groups
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary"/> Official Groups
              </CardTitle>
              <CardDescription>Announcements and official communication from faculty and administration.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {officialGroups.length > 0 ? officialGroups.map(group => (
                <GroupItem key={group.id} group={group} />
              )) : <p className="text-sm text-muted-foreground">No official groups found.</p>}
            </CardContent>
          </Card>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400"/> Student Groups
              </CardTitle>
              <CardDescription>Peer-to-peer discussion groups for your class. <strong>Students Only.</strong></CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
               {studentGroups.length > 0 ? studentGroups.map(group => (
                <GroupItem key={group.id} group={group} />
              )) : <p className="text-sm text-muted-foreground">No student groups found.</p>}
            </CardContent>
          </Card>
        </div>
      ) : (
        // Faculty/Admin Layout - Only Official Groups, No Student Discussion Groups
        <div className="space-y-8">
          {/* Special Groups Section */}
          {(officialAnnouncements || facultyLounge || adminAnnouncements) && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-primary">📢 Special Groups</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {officialAnnouncements && <GroupItem key={officialAnnouncements.id} group={officialAnnouncements} />}
                {facultyLounge && (user.role === 'faculty' || user.role === 'admin') && <GroupItem key={facultyLounge.id} group={facultyLounge} />}
                {adminAnnouncements && user.role === 'admin' && <GroupItem key={adminAnnouncements.id} group={adminAnnouncements} />}
              </div>
            </div>
          )}

          {/* Department & Class Groups - Organized by Branch */}
          {Object.keys(groupsByBranch).length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-primary">
                🏫 {user.role === 'admin' ? 'All Department & Class Groups' : 'My Assigned Groups'}
              </h2>
              <div className="space-y-6">
                {Object.entries(groupsByBranch)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([branch, { department, classes }]) => (
                  <div key={branch} className="border rounded-lg p-6 bg-card">
                    <h3 className="text-lg font-medium mb-4 text-primary flex items-center">
                      <Building className="h-5 w-5 mr-2" />
                      {branch} Department
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {department && <GroupItem key={department.id} group={department} />}
                      {classes.map(group => (
                        <GroupItem key={group.id} group={group} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Note: Student discussion groups are NOT shown to faculty/admin */}
          <Card className="bg-muted/50">
            <CardContent className="p-6 text-center">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Student discussion groups are private and only accessible to students.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function GroupItem({ group }: { group: Group }) {
  const getGroupIcon = (group: Group) => {
    if (group.id.includes('department') || group.semester === 'ALL') {
      return <Building className="h-5 w-5 text-blue-600" />;
    } else if (group.type === 'student') {
      return <MessageSquare className="h-5 w-5 text-green-600" />;
    } else {
      return <Shield className="h-5 w-5 text-purple-600" />;
    }
  };

  const getGroupTypeLabel = (group: Group) => {
    if (group.type === 'student') return 'Discussion';
    if (group.semester === 'ALL') return 'Department';
    return 'Class';
  };

  const getGroupGradient = (group: Group) => {
    // Removed gradient backgrounds, now using theme-based styling
    return '';
  };

  return (
    <Link href={`/clubs/${group.id}`} className="block group">
      <div className={`p-4 border rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-[1.02] bg-card hover:bg-primary/5 border-border`}>
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-muted rounded-lg shadow-sm">
                {getGroupIcon(group)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                  {group.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    {getGroupTypeLabel(group)}
                  </Badge>
                  {group.semester !== 'ALL' && (
                    <span className="text-xs text-muted-foreground">
                      {group.semester}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {group.description}
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-200 flex-shrink-0 ml-3" />
        </div>

        {/* Activity indicator (placeholder for future features) */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Active
          </div>
          <div className="text-xs text-muted-foreground">
            {group.branch}
          </div>
        </div>
      </div>
    </Link>
  );
}
