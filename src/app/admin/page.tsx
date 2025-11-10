
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, FilePlus2, Users, Settings, ShieldCheck, UserCircle, ArrowRight, Newspaper, CalendarClock, BookOpen, ListChecks, Wrench, Sparkles, UserCheck, CreditCard, Clock, BookMarked, ArrowLeft, Calendar } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/components/auth-provider";
import type { UserProfile, Post, FeeRecord } from "@/types";
import { FEE_STORAGE_KEY } from "@/types";
import { getUserProfiles, getFeeRecords } from '@/lib/supabase-utils';
import { DownloadAppSection } from "@/components/layout/download-app-section";
import { SimpleRotatingSpinner } from "@/components/ui/loading-spinners";
import WaveBackground from "@/components/ui/wave-background";
import { EventsPreview } from '@/components/dashboard/EventsPreview';


interface MockUserFromAuth { 
  displayName: string | null;
  email: string | null; 
  role: 'admin' | 'student' | 'pending' | 'faculty';
  usn?: string; 
}

interface AdminStat {
  title: string;
  value: string;
  icon: React.ReactElement; 
  breakdown?: string; 
  bgColorClass: string; 
  iconColorClass: string; 
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user: authUser, isLoading: authLoading } = useAuth();
  const [user, setUser] = useState<MockUserFromAuth | null>(null); 
  const [isLoading, setIsLoading] = useState(true);
  const [studentCount, setStudentCount] = useState(0);
  const [facultyCount, setFacultyCount] = useState(0);
  const [totalFeesDue, setTotalFeesDue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');


  useEffect(() => {
    if (!authLoading) {
      if (authUser && authUser.role === 'admin') {
        setUser(authUser as MockUserFromAuth); 
        
        if (typeof window !== 'undefined') {
          // Fetch real user counts from database
          const fetchCounts = async () => {
            try {
              const facultyProfiles = await getUserProfiles({ role: 'faculty' });
              const studentProfiles = await getUserProfiles({ role: 'student' });
              const approvedStudents = studentProfiles.filter(s => s.is_approved);

              setFacultyCount(facultyProfiles.length);
              setStudentCount(approvedStudents.length);

              // Fetch fee records from database
              try {
                const feeRecords = await getFeeRecords();
                const dueAmount = feeRecords
                  .filter(record => record.payment_status !== 'paid')
                  .reduce((sum, record) => sum + record.total_amount, 0);
                setTotalFeesDue(dueAmount);
              } catch (feeError) {
                console.error('Error fetching fee records:', feeError);
                // Fallback to localStorage if database fails
                const feeRecordsStr = localStorage.getItem(FEE_STORAGE_KEY);
                if (feeRecordsStr) {
                  const feeRecords = JSON.parse(feeRecordsStr) as FeeRecord[];
                  const dueAmount = feeRecords
                    .filter(record => record.payment_status !== 'paid')
                    .reduce((sum, record) => sum + record.total_amount, 0);
                  setTotalFeesDue(dueAmount);
                }
              }
            } catch (error) {
              console.error('Error fetching user counts:', error);
              setFacultyCount(0);
              setStudentCount(0);
              setTotalFeesDue(0);
            }
          };
          
          fetchCounts();
        }

      } else if (authUser && authUser.role !== 'admin'){
        setUser(null); 
        router.push('/dashboard'); 
      } else if (!authUser) {
        setUser(null);
        router.push('/login'); // Direct redirect to login when logged out
      }
      setIsLoading(false);
    }
  }, [authUser, authLoading, router]);

  const allTools = [
    { title: "User Management", description: "View, approve, and manage student and faculty accounts.", icon: <Users className="h-10 w-10 text-blue-600 dark:text-blue-400" />, link: "/admin/users", actionText: "Manage Users" },
    { title: "Fee Management", description: "Create and track student fee payments and statuses.", icon: <CreditCard className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />, link: "/admin/fee-management", actionText: "Manage Fees" },
    { title: "Events Management", description: "Create and manage campus events for students and faculty.", icon: <Calendar className="h-10 w-10 text-rose-600 dark:text-rose-400" />, link: "/admin/events", actionText: "Manage Events" },
    { title: "Manage Timetables", description: "Create and update class and lab timetables for branches.", icon: <CalendarClock className="h-10 w-10 text-green-600 dark:text-green-400" />, link: "/admin/timetables", actionText: "Manage Timetables" },
    { title: "Attendance Analytics", description: "View student attendance data with graphs and filters.", icon: <UserCheck className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />, link: "/admin/attendance", actionText: "View Analytics" },
    { title: "View Student Reports", description: "Review and manage reports submitted by students.", icon: <ListChecks className="h-10 w-10 text-red-600 dark:text-red-400" />, link: "/admin/reports", actionText: "View Reports" },
    { title: "Subject Management", description: "Create subjects and assign faculty for each branch and semester.", icon: <BookMarked className="h-10 w-10 text-orange-600 dark:text-orange-400" />, link: "/admin/subjects", actionText: "Manage Subjects" },
    { title: "Branch Management", description: "Define and manage college branches (CSE, ISE, etc.).", icon: <BarChart3 className="h-10 w-10 text-purple-600 dark:text-purple-400" />, link: "/admin/branches", actionText: "Manage Branches" },
    { title: "Site Settings", description: "Configure general application settings and preferences.", icon: <Settings className="h-10 w-10 text-teal-600 dark:text-teal-400" />, link: "/admin/settings", actionText: "Configure Settings" },
    { title: "My Profile", description: "View and edit your admin profile details.", icon: <UserCircle className="h-10 w-10 text-cyan-600 dark:text-cyan-400" />, link: "/profile/settings", actionText: "View Profile" },
    { title: "Coming Soon", description: "Explore upcoming features like campus map, skill building, and more.", icon: <Sparkles className="h-10 w-10 text-pink-600 dark:text-pink-400" />, link: "/coming-soon", actionText: "Explore Features" },
  ];

  const filteredTools = useMemo(() => {
    if (!searchQuery) return allTools;
    const lowercasedQuery = searchQuery.toLowerCase();
    return allTools.filter(tool =>
      tool.title.toLowerCase().includes(lowercasedQuery)
    );
  }, [searchQuery, allTools]);


  if (isLoading || authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
         <SimpleRotatingSpinner className="h-12 w-12 text-primary" />
        </div>
      </div>
    );
  }

  if (!user) { 
    return (
       <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto shadow-2xl border-destructive">
            <CardHeader>
                <CardTitle className="text-destructive text-xl sm:text-2xl">Access Denied</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
                <ShieldCheck className="h-16 w-16 text-destructive mx-auto mb-4" />
                <p className="text-md sm:text-lg text-muted-foreground">You do not have permission to view this page.</p>
                <Link href="/dashboard">
                    <Button variant="outline" className="mt-6 border-primary text-primary hover:bg-primary/10">Go to Dashboard</Button>
                </Link>
            </CardContent>
        </Card>
      </div>
    );
  }

  const adminStats: AdminStat[] = [
    { 
      title: "Total Users", 
      value: (studentCount + facultyCount).toString(), 
      breakdown: `Students: ${studentCount}, Faculty: ${facultyCount}`,
      icon: <Users className="h-6 w-6" />,
      bgColorClass: "bg-accent/10 dark:bg-accent/20",
      iconColorClass: "text-accent",
    },
    { 
      title: "Total Fees Due", 
      value: `₹${totalFeesDue.toLocaleString()}`, 
      icon: <CreditCard className="h-6 w-6" />,
      bgColorClass: "bg-accent/10 dark:bg-accent/20",
      iconColorClass: "text-accent",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 space-y-10 relative overflow-hidden">
      {/* Wave background animation */}
      <WaveBackground />

      <header className="text-center sm:text-left relative z-10 mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-2 flex items-center justify-center sm:justify-start">
          Admin Dashboard
          <span className="inline-flex items-center justify-center w-6 h-6 ms-3 text-sm font-semibold text-blue-800 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-300">
            <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
              <path fill="currentColor" d="m18.774 8.245-.892-.893a1.5 1.5 0 0 1-.437-1.052V5.036a2.484 2.484 0 0 0-2.48-2.48H13.7a1.5 1.5 0 0 1-1.052-.438l-.893-.892a2.484 2.484 0 0 0-3.51 0l-.893.892a1.5 1.5 0 0 1-1.052.437H5.036a2.484 2.484 0 0 0-2.48 2.481V6.3a1.5 1.5 0 0 1-.438 1.052l-.892.893a2.484 2.484 0 0 0 0 3.51l.892.893a1.5 1.5 0 0 1 .437 1.052v1.264a2.484 2.484 0 0 0 2.481 2.481H6.3a1.5 1.5 0 0 1 1.052.437l.893.892a2.484 2.484 0 0 0 3.51 0l.893-.892a1.5 1.5 0 0 1 1.052-.437h1.264a2.484 2.484 0 0 0 2.481-2.48V13.7a1.5 1.5 0 0 1 .437-1.052l.892-.893a2.484 2.484 0 0 0 0-3.51Z"/>
              <path fill="#fff" d="M8 13a1 1 0 0 1-.707-.293l-2-2a1 1 0 1 1 1.414-1.414l1.42 1.42 5.318-3.545a1 1 0 0 1 1.11 1.664l-6 4A1 1 0 0 1 8 13Z"/>
            </svg>
            <span className="sr-only">Admin Verified</span>
          </span>
        </h1>
        <p className="text-md sm:text-lg text-gray-700 dark:text-gray-300">Manage APSConnect content, users, and settings.</p>
      </header>

      {/* Events Preview for Admin */}
      {user && authUser && (
        <EventsPreview user={{
          uid: authUser.uid,
          role: user.role,
          branch: undefined, // Admin sees all events
          semester: undefined
        }} />
      )}

      <Card className="shadow-2xl border-white/10 bg-white/5 dark:bg-black/5 backdrop-blur-xl rounded-xl relative z-10">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Platform Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {adminStats.map(stat => (
              <Card key={stat.title} className="shadow-2xl border border-white/10 bg-white/5 dark:bg-black/5 backdrop-blur-xl hover:shadow-3xl hover:bg-white/10 dark:hover:bg-black/10 transition-all duration-300 ease-in-out rounded-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 pt-5 px-5">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColorClass}`}>
                    {React.cloneElement(stat.icon, { className: `${stat.iconColorClass} h-6 w-6`})}
                  </div>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                  {stat.breakdown && <p className="text-xs text-muted-foreground pt-1">{stat.breakdown}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>


      <Card className="shadow-2xl border-white/10 bg-white/5 dark:bg-black/5 backdrop-blur-xl rounded-xl relative z-10">
        <CardHeader>
            <CardTitle className="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Management Tools</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTools.map(tool => (
              <StyledActionCard
                key={tool.title}
                title={tool.title}
                description={tool.description}
                icon={tool.icon}
                link={tool.link}
                actionText={tool.actionText}
                isCeraCard={tool.title === "CERA AI Assistant"}
              />
            ))}
            </div>
        </CardContent>
      </Card>
      <DownloadAppSection />
    </div>
  );
}

interface StyledActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode; 
  link: string;
  actionText: string;
  disabled?: boolean;
  isCeraCard?: boolean;
}

function StyledActionCard({ title, description, icon, link, actionText, disabled = false, isCeraCard = false }: StyledActionCardProps) {
  return (
    <Card className={`${isCeraCard ? 'shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out flex flex-col rounded-xl border bg-card border-border/70 hover:border-primary/50' : 'shadow-2xl border border-white/10 bg-white/5 dark:bg-black/5 backdrop-blur-xl transition-all duration-300 ease-in-out flex flex-col rounded-xl hover:shadow-3xl hover:bg-white/10 dark:hover:bg-black/10'} ${disabled ? 'opacity-60 bg-muted/30 dark:bg-muted/10 pointer-events-none' : ''}`}>
      <CardHeader className="pb-4 pt-5 px-5">
        <div className="flex items-start space-x-4">
          <div className={`p-3 rounded-full ${disabled ? 'bg-muted dark:bg-muted/30' : 'bg-accent/10 dark:bg-accent/20'}`}>
            {icon}
          </div>
          <div>
            <CardTitle className="text-lg sm:text-xl font-semibold text-foreground">{title}</CardTitle>
            <CardDescription className="text-sm mt-1 text-muted-foreground">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-end mt-auto px-5 pb-5">
        <Link href={disabled ? "#" : link} className={`w-full ${disabled ? 'pointer-events-none' : ''}`}>
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm sm:text-base py-3 rounded-lg" disabled={disabled}>
            {actionText} <ArrowRight className="ml-2 h-4 w-4"/>
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
