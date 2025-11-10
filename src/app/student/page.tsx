"use client";

import React, { Suspense, useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from '@/lib/supabase';
import { useAuth, User } from "@/components/auth-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  UserCircle,
  Bell,
  AlertTriangle,
  Newspaper,
  BookOpen,
  CalendarClock,
  Calendar,
  MessageSquareWarning,
  Wrench,
  FileText,
  ArrowRight,
  Sparkles,
  BookMarked,
  UserCheck,
  CreditCard,
  Users as UsersIcon,
  Briefcase,
  GraduationCap,
  HandCoins,
  ArrowLeft,
  Crown,
  Bot,
  Search,
  Settings,
  Zap,
  Menu,
  Filter,
  Plus,
  Check,
  Home,
  PieChart,
  MessageCircle,
  X,
  Star,
  MoreVertical,
} from "lucide-react";
import type { Post, UserProfile, UserRole, Semester } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { SimpleRotatingSpinner } from "@/components/ui/loading-spinners";
import { RecentPostItem } from '@/components/dashboard/RecentPostItem';
import { ActionCard } from '@/components/dashboard/ActionCard';
import { DownloadAppSection } from "@/components/layout/download-app-section";
import ChatbotButton from "@/components/ui/chatbot-button";
import { EventsPreview } from '@/components/dashboard/EventsPreview';
import WaveBackground from "@/components/ui/wave-background";
import { TextRotate } from "@/components/ui/text-rotate";

// StudentDashboardPage Component
export default function StudentDashboardPage() {
  const router = useRouter();
  const { user: authUser, isLoading: authLoading, updateUserContext } = useAuth();
  const [studentUser, setStudentUser] = useState<User | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const { toast } = useToast();

  const fetchStudentData = useCallback(async () => {
    if (!authUser) return;

    const userProfileKey = `apsconnect_user_${authUser.uid}`;
    const profileStr = typeof window !== 'undefined' ? localStorage.getItem(userProfileKey) : null;
    let latestUser: User | null = null;

    // Try to get fresh data from database first, especially for pending users
    try {
      console.log('🔄 Fetching fresh profile data from database...');
      const { data: dbProfile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.uid)
        .single();

      if (!error && dbProfile) {
        console.log('✅ Got fresh profile from database:', dbProfile);
        // Cache the fresh data
        const freshProfileData = {
          ...dbProfile,
          created_at: dbProfile.created_at,
          updated_at: dbProfile.updated_at,
        };
        if (typeof window !== 'undefined') {
          localStorage.setItem(userProfileKey, JSON.stringify(freshProfileData));
        }

        latestUser = {
          ...authUser,
          displayName: dbProfile.display_name || dbProfile.full_name || null,
          role: dbProfile.role,
          branch: dbProfile.branch || dbProfile.department,
          semester: dbProfile.semester || dbProfile.year_of_study?.toString(),
          usn: dbProfile.usn || dbProfile.student_id,
          rejectionReason: dbProfile.rejection_reason,
          is_approved: dbProfile.is_approved,
        };
      }
    } catch (dbError) {
      console.error('❌ Failed to fetch fresh profile from database:', dbError);
    }

    // Fallback to localStorage if database fetch failed
    if (!latestUser && profileStr) {
      const fullProfile = JSON.parse(profileStr) as UserProfile;
      console.log('💾 Using localStorage profile as fallback');
      latestUser = {
        ...authUser,
        displayName: fullProfile.display_name || fullProfile.full_name || null,
        role: fullProfile.role,
        branch: fullProfile.branch,
        semester: fullProfile.semester as Semester,
        usn: fullProfile.usn || fullProfile.student_id,
        rejectionReason: fullProfile.rejection_reason,
        is_approved: fullProfile.is_approved,
      };
    }

    // Final fallback to basic auth user
    if (!latestUser) {
      console.log('⚠️ No profile data available, using basic auth user');
      latestUser = authUser;
    }

    setStudentUser(latestUser);
    console.log('✅ Final student user data:', latestUser);

    // Set loading to false after data is loaded
    setPageLoading(false);

  }, [authUser]);

  // Call fetchStudentData when component mounts and when authUser changes
  useEffect(() => {
    fetchStudentData();
  }, [authUser, fetchStudentData]);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === `apsconnect_user_${authUser?.uid}` || event.key === 'apsconnect_posts') {
            fetchStudentData();
        }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };
  }, [authUser, fetchStudentData]);

  // Load site settings
  useEffect(() => {
    const loadSiteSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('enablealumnitransition')
          .single();

        if (!error && data) {
          setSiteSettings(data);
        }
      } catch (error) {
        console.error('Error loading site settings:', error);
      }
    };

    loadSiteSettings();
  }, []);

  const handleAlumniTransition = async () => {
    if (!authUser?.uid) return;

    try {
      // Update user role in Supabase
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: 'alumni' })
        .eq('id', authUser.uid);

      if (error) {
        console.error('Error updating user role:', error);
        toast({
          title: "Transition Failed",
          description: "Failed to switch to alumni status. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Update localStorage cache to reflect new role
      const userProfileKey = `apsconnect_user_${authUser.uid}`;
      const profileStr = localStorage.getItem(userProfileKey);
      if (profileStr) {
        try {
          const profileData = JSON.parse(profileStr);
          profileData.role = 'alumni'; // Update role in cache
          localStorage.setItem(userProfileKey, JSON.stringify(profileData));
          console.log('✅ Updated localStorage cache with alumni role');
        } catch (e) {
          console.error('Failed to update localStorage cache:', e);
        }
      }

      toast({
        title: "Welcome to Alumni Network!",
        description: "Your account has been successfully transitioned to alumni status.",
      });

      // Refresh the page to show new role
      window.location.reload();
    } catch (error) {
      console.error('Error during alumni transition:', error);
      toast({
        title: "Transition Failed",
        description: "An unexpected error occurred. Please contact support.",
        variant: "destructive",
      });
    }
  };

  const allTools = [
      { title: "CERA AI Assistant", description: "Get instant answers to your academic queries, attendance, fees, and more with our AI assistant.", icon: <Bot className="h-10 w-10 text-violet-600 dark:text-violet-400" />, link: "/cera", actionText: "Chat with CERA" },
      { title: "Campus Events", description: "Discover and participate in upcoming campus events and activities.", icon: <Calendar className="h-10 w-10 text-rose-600 dark:text-rose-400" />, link: "/events", actionText: "View Events" },
      { title: "My Attendance", description: "View your subject-wise and overall attendance percentage.", icon: <UserCheck className="h-10 w-10 text-blue-600 dark:text-blue-400" />, link: "/student/attendance", actionText: "View Attendance" },
      { title: "View Timetable", description: "Check your class and lab schedules for the current semester.", icon: <CalendarClock className="h-10 w-10 text-green-600 dark:text-green-400" />, link: "/student/timetable", actionText: "View Timetable" },
      { title: "Clubs & Groups", description: "Access official and student groups for your class.", icon: <UsersIcon className="h-10 w-10 text-purple-600 dark:text-purple-400" />, link: "/clubs", actionText: "View Groups" },
      { title: "Assignments", description: "View and download assignments posted by your faculty.", icon: <BookMarked className="h-10 w-10 text-orange-600 dark:text-orange-400" />, link: "/student/assignments", actionText: "View Assignments" },
      { title: "My Fee Details", description: "Check your fee payment status and due dates.", icon: <CreditCard className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />, link: "/student/fee-details", actionText: "View Fees" },
      { title: "Study Materials", description: "Access notes, presentations, and other materials shared by faculty.", icon: <BookOpen className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />, link: "/student/study-materials", actionText: "View Materials" },
      { title: "Fundraising", description: "View and contribute to active fundraising campaigns.", icon: <HandCoins className="h-10 w-10 text-amber-600 dark:text-amber-400" />, link: "/student/fundraising", actionText: "View Campaigns" },
      { title: "Report a Concern", description: "Submit anonymous feedback or report issues to faculty/admin.", icon: <MessageSquareWarning className="h-10 w-10 text-red-600 dark:text-red-400" />, link: "/student/report-concern", actionText: "Submit Report" },
      { title: "Alumni & Placements", description: "Connect with alumni and explore career opportunities.", icon: <Briefcase className="h-10 w-10 text-teal-600 dark:text-teal-400" />, link: "/student/jobs", actionText: "Browse Jobs" },
      { title: "Coming Soon", description: "Explore upcoming features like campus map, skill building, and more.", icon: <Sparkles className="h-10 w-10 text-pink-600 dark:text-pink-400" />, link: "/coming-soon", actionText: "Explore Features" },
  ];

  const filteredTools = useMemo(() => {
      if (!searchQuery) return allTools;
      const lowercasedQuery = searchQuery.toLowerCase();
      return allTools.filter(tool =>
          tool.title.toLowerCase().includes(lowercasedQuery)
      );
  }, [searchQuery, allTools]);

  if (pageLoading || authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <SimpleRotatingSpinner className="h-12 w-12 text-primary" />
      </div>
    );
  }

  if (!authUser || !studentUser) return (
    <div className="container mx-auto px-4 py-8 text-center">
      <Card className="w-full max-w-md mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-destructive text-xl sm:text-2xl">Access Denied</CardTitle>
        </CardHeader>
        <CardContent>
          <ShieldCheck className="h-12 w-12 sm:h-16 sm:w-16 text-destructive mx-auto mb-4" />
          <p className="text-md sm:text-lg text-muted-foreground">You must be logged in to view this page.</p>
          <Link href="/login">
            <Button variant="outline" className="mt-6">Go to Login</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );

  const isPendingApproval = !studentUser.is_approved && studentUser.role === 'pending' && !studentUser.rejectionReason;
  const isRejected = !!studentUser.rejectionReason;
  const isApprovedStudent = studentUser.role === 'student';
  const isFinalSemesterStudent = studentUser.role === 'student' && studentUser.semester === '8th Sem';
  const showAlumniTransition = isFinalSemesterStudent && siteSettings?.enablealumnitransition;

  return (
    <div className="container mx-auto px-4 py-8 space-y-10 relative overflow-hidden">
      {/* Wave background animation */}
      <WaveBackground />

      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10 mb-8">
        <div className="flex-1">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-primary mb-2 flex items-center justify-start">
            Student Dashboard
            <span className="inline-flex items-center justify-center w-6 h-6 ms-3 text-sm font-semibold text-green-800 bg-green-100 rounded-full dark:bg-gray-700 dark:text-green-400">
              <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path fill="currentColor" d="m18.774 8.245-.892-.893a1.5 1.5 0 0 1-.437-1.052V5.036a2.484 2.484 0 0 0-2.48-2.48H13.7a1.5 1.5 0 0 1-1.052-.438l-.893-.892a2.484 2.484 0 0 0-3.51 0l-.893.892a1.5 1.5 0 0 1-1.052.437H5.036a2.484 2.484 0 0 0-2.48 2.481V6.3a1.5 1.5 0 0 1-.438 1.052l-.892.893a2.484 2.484 0 0 0 0 3.51l.892.893a1.5 1.5 0 0 1 .437 1.052v1.264a2.484 2.484 0 0 0 2.481 2.481H6.3a1.5 1.5 0 0 1 1.052.437l.893.892a2.484 2.484 0 0 0 3.51 0l.893-.892a1.5 1.5 0 0 1 1.052-.437h1.264a2.484 2.484 0 0 0 2.481-2.48V13.7a1.5 1.5 0 0 1 .437-1.052l.892-.893a2.484 2.484 0 0 0 0-3.51Z"/>
                <path fill="#fff" d="M8 13a1 1 0 0 1-.707-.293l-2-2a1 1 0 1 1 1.414-1.414l1.42 1.42 5.318-3.545a1 1 0 0 1 1.11 1.664l-6 4A1 1 0 0 1 8 13Z"/>
              </svg>
              <span className="sr-only">Verified Student</span>
            </span>
          </h1>
          <p className="text-md sm:text-lg text-muted-foreground">
            Welcome, {studentUser.displayName || studentUser.email}! Access your academic resources and tools.
          </p>
          <p className="text-sm text-muted-foreground mt-1">Branch: <span className="font-semibold">{studentUser.branch || 'Not Assigned'}</span> | Semester: <span className="font-semibold">{studentUser.semester || 'Not Specified'}</span></p>
        </div>

        <div className="flex-shrink-0">
          <TextRotate
            texts={[
              "🚀 Explore Features",
              "📚 Study Smart",
              "🎯 Achieve Goals",
              "💡 Learn Daily",
              "🌟 Stay Focused"
            ]}
            mainClassName="px-3 py-1 bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 rounded-lg overflow-hidden justify-center shadow-md"
            staggerFrom={"last"}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-120%" }}
            staggerDuration={0.025}
            splitLevelClassName="overflow-hidden pb-0.5"
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            rotationInterval={3000}
          />
        </div>
      </header>

      {/* Events Preview for Student */}
      {studentUser && (
        <EventsPreview user={{
          uid: studentUser.uid,
          role: studentUser.role,
          branch: studentUser.branch,
          semester: studentUser.semester
        }} />
      )}

      <Card className="shadow-xl rounded-xl border border-border/70 relative z-10">
        <CardHeader>
            <CardTitle className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">Academic Tools</CardTitle>
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
                  disabled={!isApprovedStudent && !isPendingApproval}
                />
              ))}
            </div>
        </CardContent>
      </Card>

      <DownloadAppSection />
      <ChatbotButton />
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
}

function StyledActionCard({ title, description, icon, link, actionText, disabled = false }: StyledActionCardProps) {
  return (
    <Card className={`shadow-2xl border border-white/10 bg-white/5 dark:bg-black/5 backdrop-blur-xl transition-all duration-300 ease-in-out flex flex-col rounded-xl hover:shadow-3xl hover:bg-white/10 dark:hover:bg-black/10 ${disabled ? 'opacity-60 bg-muted/30 dark:bg-muted/10 pointer-events-none' : ''}`}>
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
        <Link href={disabled ? "#" : (link as any)} className={`w-full ${disabled ? 'pointer-events-none' : ''}`}>
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm sm:text-base py-3 rounded-lg" disabled={disabled}>
            {actionText} <ArrowRight className="ml-2 h-4 w-4"/>
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
