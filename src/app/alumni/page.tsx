"use client";

import React, { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, MessageSquare, Sparkles, Crown, Award, Calendar, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";

export default function AlumniPortal() {
  const router = useRouter();
  const { user: authUser } = useAuth();

  useEffect(() => {
    if (!authUser) return;

    // Check if user is alumni
    const checkAlumniStatus = async () => {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', authUser.uid)
        .single();

      if (profile?.role !== 'alumni') {
        router.push('/dashboard');
        return;
      }
    };

    checkAlumniStatus();
  }, [authUser, router]);

  return (
    <div className="container mx-auto px-4 py-8 relative overflow-hidden">

      <header className="text-center sm:text-left relative z-10 mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-primary dark:text-white mb-2 flex items-center justify-center sm:justify-start">
          <Crown className="mr-3 h-8 w-8 text-yellow-500" />
          Alumni Portal
        </h1>
        <p className="text-md sm:text-lg text-muted-foreground dark:text-gray-300">
          Connect with fellow alumni, explore career opportunities, and stay engaged with the community
        </p>
      </header>

      {/* Main Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 relative z-10">
        <Card className="cursor-pointer shadow-2xl border border-white/10 bg-white/5 dark:bg-black/5 backdrop-blur-xl transition-all duration-300 ease-in-out hover:shadow-3xl hover:bg-white/10 dark:hover:bg-black/10" onClick={() => router.push('/alumni/browse')}>
          <CardHeader className="text-center">
            <Users className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
            <CardTitle className="text-xl">Browse Alumni</CardTitle>
            <CardDescription>Connect with graduates from your batch and beyond</CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer shadow-2xl border border-white/10 bg-white/5 dark:bg-black/5 backdrop-blur-xl transition-all duration-300 ease-in-out hover:shadow-3xl hover:bg-white/10 dark:hover:bg-black/10" onClick={() => router.push('/alumni/jobs')}>
          <CardHeader className="text-center">
            <Briefcase className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
            <CardTitle className="text-xl">Job Board</CardTitle>
            <CardDescription>Exclusive job opportunities and career resources</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Coming Soon Features */}
      <Card className="mt-8 shadow-2xl border border-white/10 bg-white/5 dark:bg-black/5 backdrop-blur-xl relative z-10">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold flex items-center gap-2">
            <Sparkles className="h-6 w-6" />
            Coming Soon
          </CardTitle>
          <CardDescription>
            Exciting new features we're working on for the alumni community
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-6 border rounded-lg opacity-60">
              <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Alumni Achievements</h3>
              <p className="text-sm text-muted-foreground">Showcase accomplishments and awards</p>
            </div>

            <div className="text-center p-6 border rounded-lg opacity-60">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Events & Reunions</h3>
              <p className="text-sm text-muted-foreground">Virtual and in-person gatherings</p>
            </div>

            <div className="text-center p-6 border rounded-lg opacity-60">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Success Stories</h3>
              <p className="text-sm text-muted-foreground">Inspiring journeys and testimonials</p>
            </div>

            <div className="text-center p-6 border rounded-lg opacity-60">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Mentorship Hub</h3>
              <p className="text-sm text-muted-foreground">Advanced mentorship platform with AI matching</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
