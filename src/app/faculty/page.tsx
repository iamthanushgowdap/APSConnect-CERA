
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCircle, ShieldCheck, FileText, FilePlus2, ArrowRight, Newspaper, CalendarClock, Calendar, BookOpen, ListChecks, Wrench, Sparkles, BookMarked, UserCheck, CreditCard, BrainCircuit, Handshake, Briefcase, BarChart, HandCoins, MessageSquareWarning, ArrowLeft, Bot } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState, useMemo } from "react";
import { useAuth, User } from "@/components/auth-provider";
import { DownloadAppSection } from "@/components/layout/download-app-section";
import { SimpleRotatingSpinner } from '@/components/ui/loading-spinners';
import { useToast } from "@/hooks/use-toast";
import WaveBackground from "@/components/ui/wave-background";
import ChatbotButton from "@/components/ui/chatbot-button";
import { EventsPreview } from '@/components/dashboard/EventsPreview';

export default function FacultyDashboardPage() {
  const router = useRouter();
  const { user: authUser, isLoading: authLoading } = useAuth();
  const [facultyUser, setFacultyUser] = useState<User | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading) {
      if (authUser && authUser.role === 'faculty') {
        setFacultyUser(authUser);
      } else if (authUser && authUser.role !== 'faculty') {
        router.push('/dashboard');
      } else if (!authUser) {
        router.push('/login'); // Direct redirect to login when logged out
      }
      setPageLoading(false);
    }
  }, [authUser, authLoading, router]);

  const allTools = [
    { title: "Manage Students", description: "View, approve, and manage student accounts within your assigned branches.", icon: <Users className="h-10 w-10 text-blue-600 dark:text-blue-400" />, link: "/faculty/user-management", actionText: "Manage Students" },
    { title: "Campus Events", description: "Discover and participate in upcoming campus events and activities.", icon: <Calendar className="h-10 w-10 text-rose-600 dark:text-rose-400" />, link: "/events", actionText: "View Events" },
    { title: "View Timetables", description: "View class schedules for your assigned branches.", icon: <CalendarClock className="h-10 w-10 text-green-600 dark:text-green-400" />, link: "/faculty/timetables", actionText: "View Timetables" },
    { title: "Assignments", description: "Create, edit, and manage assignments for your classes.", icon: <BookMarked className="h-10 w-10 text-orange-600 dark:text-orange-400" />, link: "/faculty/assignments", actionText: "Manage Assignments" },
    { title: "Mark Attendance", description: "Take daily attendance for your assigned subjects and classes.", icon: <UserCheck className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />, link: "/faculty/attendance", actionText: "Take Attendance" },
    { title: "View Reports", description: "Review and respond to student reports and concerns addressed to you.", icon: <MessageSquareWarning className="h-10 w-10 text-red-600 dark:text-red-400" />, link: "/faculty/reports", actionText: "View Reports" },
    { title: "Track Fee Status", description: "View fee payment status for students in your assigned branches.", icon: <CreditCard className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />, link: "/faculty/fee-management", actionText: "Track Fees" },
    { title: "Fundraising", description: "Create and manage fundraising campaigns for your students.", icon: <HandCoins className="h-10 w-10 text-amber-600 dark:text-amber-400" />, link: "/faculty/fundraising", actionText: "Manage Campaigns" },
    { title: "Study Materials", description: "Upload and manage study materials for your branches.", icon: <BookOpen className="h-10 w-10 text-purple-600 dark:text-purple-400" />, link: "/faculty/study-materials", actionText: "Manage Materials" },
    { title: "My Profile", description: "View and edit your faculty profile details.", icon: <UserCircle className="h-10 w-10 text-teal-600 dark:text-teal-400" />, link: "/profile/settings", actionText: "View Profile" },
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

  if (!facultyUser) {
    return (
       <div className="container mx-auto px-4 py-8 text-center">
        <Card className="max-w-md mx-auto shadow-2xl border-destructive">
            <CardHeader>
                <CardTitle className="text-destructive text-xl sm:text-2xl">Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
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
  
  const assignedBranchesText = facultyUser.assignedBranches && facultyUser.assignedBranches.length > 0 
    ? facultyUser.assignedBranches.join(', ') 
    : 'Not Assigned';

  return (
    <div className="container mx-auto px-4 py-8 space-y-10 relative overflow-hidden">
      {/* Wave background animation */}
      <WaveBackground />

      <header className="text-center sm:text-left relative z-10 mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-primary mb-2 flex items-center justify-center sm:justify-start">
          Faculty Dashboard
          <span className="inline-flex items-center justify-center w-6 h-6 ms-3 text-sm font-semibold text-blue-800 bg-blue-100 rounded-full dark:bg-gray-700 dark:text-blue-400">
            <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
              <path fill="currentColor" d="m18.774 8.245-.892-.893a1.5 1.5 0 0 1-.437-1.052V5.036a2.484 2.484 0 0 0-2.48-2.48H13.7a1.5 1.5 0 0 1-1.052-.438l-.893-.892a2.484 2.484 0 0 0-3.51 0l-.893.892a1.5 1.5 0 0 1-1.052.437H5.036a2.484 2.484 0 0 0-2.48 2.481V6.3a1.5 1.5 0 0 1-.438 1.052l-.892.893a2.484 2.484 0 0 0 0 3.51l.892.893a1.5 1.5 0 0 1 .437 1.052v1.264a2.484 2.484 0 0 0 2.481 2.481H6.3a1.5 1.5 0 0 1 1.052.437l.893.892a2.484 2.484 0 0 0 3.51 0l.893-.892a1.5 1.5 0 0 1 1.052-.437h1.264a2.484 2.484 0 0 0 2.481-2.48V13.7a1.5 1.5 0 0 1 .437-1.052l.892-.893a2.484 2.484 0 0 0 0-3.51Z"/>
              <path fill="#fff" d="M8 13a1 1 0 0 1-.707-.293l-2-2a1 1 0 1 1 1.414-1.414l1.42 1.42 5.318-3.545a1 1 0 0 1 1.11 1.664l-6 4A1 1 0 0 1 8 13Z"/>
            </svg>
            <span className="sr-only">Verified Faculty</span>
          </span>
        </h1>
        <p className="text-md sm:text-lg text-muted-foreground">
          Welcome, {facultyUser.displayName || facultyUser.email}! Manage your students and resources.
        </p>
        <p className="text-sm text-muted-foreground mt-1">Assigned Branches: <span className="font-semibold">{assignedBranchesText}</span></p>
      </header>

      {/* Events Preview for Faculty */}
      {facultyUser && (
        <EventsPreview user={{
          uid: facultyUser.uid,
          role: facultyUser.role,
          branch: undefined, // Faculty sees events for their assigned branches
          semester: undefined
        }} />
      )}

      <Card className="shadow-2xl border-white/10 bg-white/5 dark:bg-black/5 backdrop-blur-xl rounded-xl relative z-10">
        <CardHeader>
            <CardTitle className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">Key Actions</CardTitle>
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
        <Link href={disabled ? "#" : (link as any)} className={`w-full ${disabled ? 'pointer-events-none' : ''}`}>
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm sm:text-base py-3 rounded-lg" disabled={disabled}>
            {actionText} <ArrowRight className="ml-2 h-4 w-4"/>
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
