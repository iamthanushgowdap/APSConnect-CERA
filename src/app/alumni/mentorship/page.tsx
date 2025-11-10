"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessageSquare, Users, UserCheck, Calendar, Star, Send, Heart, BookOpen, Lightbulb, Target } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import WaveBackground from "@/components/ui/wave-background";

interface MentorshipRequest {
  id: string;
  mentee_id: string;
  mentor_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  message: string;
  created_at: string;
  updated_at: string;
  mentee?: {
    full_name: string;
    branch: string;
    semester: string;
    avatar_url?: string;
  };
  mentor?: {
    full_name: string;
    current_position: string;
    current_company: string;
    avatar_url?: string;
  };
}

interface StudentProfile {
  id: string;
  full_name: string;
  branch: string;
  semester: string;
  avatar_url?: string;
  email: string;
}

export default function MentorshipNetwork() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const [mentorshipRequests, setMentorshipRequests] = useState<MentorshipRequest[]>([]);
  const [availableStudents, setAvailableStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [mentorshipMessage, setMentorshipMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      fetchMentorshipData();
    };

    checkAlumniStatus();
  }, [authUser, router]);

  const fetchMentorshipData = async () => {
    try {
      setLoading(true);

      // Fetch mentorship requests for this alumni
      const { data: requests, error: requestsError } = await supabase
        .from('mentorship_requests')
        .select(`
          *,
          mentee:user_profiles!mentee_id(full_name, branch, semester, avatar_url, email),
          mentor:user_profiles!mentor_id(full_name, current_position, current_company, avatar_url)
        `)
        .eq('mentor_id', authUser!.uid)
        .order('created_at', { ascending: false });

      if (requestsError) {
        console.error('Error fetching mentorship requests:', requestsError);
      } else {
        setMentorshipRequests(requests || []);
      }

      // Fetch available students for mentorship
      const { data: students, error: studentsError } = await supabase
        .from('user_profiles')
        .select('id, full_name, branch, semester, avatar_url, email')
        .eq('role', 'student')
        .order('full_name', { ascending: true });

      if (studentsError) {
        console.error('Error fetching students:', studentsError);
      } else {
        setAvailableStudents(students || []);
      }
    } catch (error) {
      console.error('Error fetching mentorship data:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitMentorshipRequest = async () => {
    if (!selectedStudent || !mentorshipMessage.trim()) return;

    try {
      setIsSubmitting(true);

      const { error } = await supabase
        .from('mentorship_requests')
        .insert({
          mentee_id: selectedStudent,
          mentor_id: authUser!.uid,
          message: mentorshipMessage.trim(),
          status: 'pending'
        });

      if (error) {
        console.error('Error submitting mentorship request:', error);
        return;
      }

      // Reset form
      setSelectedStudent("");
      setMentorshipMessage("");

      // Refresh data
      fetchMentorshipData();
    } catch (error) {
      console.error('Error submitting mentorship request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateMentorshipStatus = async (requestId: string, status: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('mentorship_requests')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (error) {
        console.error('Error updating mentorship status:', error);
        return;
      }

      // Refresh data
      fetchMentorshipData();
    } catch (error) {
      console.error('Error updating mentorship status:', error);
    }
  };

  const pendingRequests = mentorshipRequests.filter(req => req.status === 'pending');
  const activeMentees = mentorshipRequests.filter(req => req.status === 'accepted');

  return (
    <div className="container mx-auto px-4 py-8 relative overflow-hidden">
      <WaveBackground />

      <header className="text-center sm:text-left relative z-10 mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-primary dark:text-white mb-2 flex items-center justify-center sm:justify-start">
          <MessageSquare className="mr-3 h-8 w-8 text-purple-500" />
          Mentorship Network
        </h1>
        <p className="text-md sm:text-lg text-muted-foreground dark:text-gray-300">
          Connect with current students and share your knowledge and experience
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{pendingRequests.length}</div>
                <p className="text-xs text-muted-foreground">Awaiting response</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Mentees</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{activeMentees.length}</div>
                <p className="text-xs text-muted-foreground">Current mentorship</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Impact Score</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {mentorshipRequests.filter(req => req.status === 'completed').length * 10}
                </div>
                <p className="text-xs text-muted-foreground">Knowledge shared</p>
              </CardContent>
            </Card>
          </div>

          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Mentorship Requests
                </CardTitle>
                <CardDescription>Students seeking your guidance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={request.mentee?.avatar_url} />
                        <AvatarFallback>
                          {request.mentee?.full_name?.split(' ').map(n => n[0]).join('') || 'S'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{request.mentee?.full_name}</h4>
                          <Badge variant="outline">{request.mentee?.branch} • {request.mentee?.semester}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{request.message}</p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => updateMentorshipStatus(request.id, 'accepted')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateMentorshipStatus(request.id, 'rejected')}
                          >
                            Decline
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Active Mentees */}
          {activeMentees.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Your Mentees
                </CardTitle>
                <CardDescription>Students you're currently mentoring</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeMentees.map((mentee) => (
                    <div key={mentee.id} className="border rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={mentee.mentee?.avatar_url} />
                          <AvatarFallback>
                            {mentee.mentee?.full_name?.split(' ').map(n => n[0]).join('') || 'S'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{mentee.mentee?.full_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {mentee.mentee?.branch} • {mentee.mentee?.semester}
                          </p>
                        </div>
                      </div>
                      <Button className="w-full mt-3" size="sm" variant="outline">
                        Schedule Session
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Request History */}
          <Card>
            <CardHeader>
              <CardTitle>Mentorship History</CardTitle>
              <CardDescription>Your mentorship journey</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mentorshipRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No mentorship activity yet</h3>
                    <p className="text-muted-foreground">Start mentoring by reaching out to students!</p>
                  </div>
                ) : (
                  mentorshipRequests.slice(0, 5).map((request) => (
                    <div key={request.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        request.status === 'accepted' ? 'bg-green-500' :
                        request.status === 'rejected' ? 'bg-red-500' :
                        request.status === 'completed' ? 'bg-blue-500' : 'bg-orange-500'
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{request.mentee?.full_name}</span>
                          {request.status === 'pending' && " requested mentorship"}
                          {request.status === 'accepted' && " - mentorship accepted"}
                          {request.status === 'rejected' && " - mentorship declined"}
                          {request.status === 'completed' && " - mentorship completed"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Reach Out to Students */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Reach Out to Students
              </CardTitle>
              <CardDescription>Offer mentorship to current students</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {availableStudents.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.full_name} - {student.branch} ({student.semester})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Textarea
                placeholder="Write a personalized message introducing yourself and your expertise..."
                value={mentorshipMessage}
                onChange={(e) => setMentorshipMessage(e.target.value)}
                rows={4}
              />

              <Button
                className="w-full"
                onClick={submitMentorshipRequest}
                disabled={!selectedStudent || !mentorshipMessage.trim() || isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send Mentorship Offer"}
                <Send className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Mentorship Benefits */}
          <Card>
            <CardHeader>
              <CardTitle>Why Mentor?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Heart className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">Give Back</h4>
                  <p className="text-xs text-muted-foreground">Help shape the next generation</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <BookOpen className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">Stay Connected</h4>
                  <p className="text-xs text-muted-foreground">Maintain ties with your alma mater</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">Learn & Grow</h4>
                  <p className="text-xs text-muted-foreground">Gain fresh perspectives and insights</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Target className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">Build Legacy</h4>
                  <p className="text-xs text-muted-foreground">Create lasting impact on students' lives</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
