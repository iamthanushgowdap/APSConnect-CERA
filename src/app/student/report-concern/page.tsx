"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useAuth, User } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Report, REPORT_STORAGE_KEY, ReportRecipientType, Branch, Semester, UserProfile } from '@/types';
import { ShieldCheck, AlertTriangle, ArrowLeft, Send, MessageSquareWarning } from 'lucide-react';
import { SimpleRotatingSpinner } from '@/components/ui/loading-spinners';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import ParticleBackground from "@/components/ui/particle-background";

const reportSchema = z.object({
  recipientType: z.enum(['faculty', 'admin'], { required_error: "Please select a recipient." }) as z.ZodSchema<ReportRecipientType>,
  recipient_uid: z.string().optional(),
  reportContent: z.string().min(20, "Report must be at least 20 characters.").max(2000, "Report cannot exceed 2000 characters."),
});

type ReportFormValues = z.infer<typeof reportSchema>;

export default function ReportConcernPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [pageLoading, setPageLoading] = useState(true);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [studentContext, setStudentContext] = useState<{branch?: Branch, semester?: Semester}>({});
  const [recipientOptions, setRecipientOptions] = useState<UserProfile[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      recipientType: undefined,
      reportContent: "",
    },
  });

  const fetchRecipients = useCallback(async (type: ReportRecipientType) => {
    if (!studentContext.branch || !studentContext.semester) return;

    setLoadingRecipients(true);
    try {
      let query = supabase
        .from('user_profiles')
        .select('id, full_name, email, role, branch, semester, assigned_branches, assigned_semesters')
        .eq('is_approved', true);

      if (type === 'faculty') {
        // Get all faculty first, then filter in JavaScript to avoid complex array queries
        query = query.eq('role', 'faculty');
      } else if (type === 'admin') {
        // Get all admins
        query = query.eq('role', 'admin');
      }

      const { data, error } = await query;
      if (error) throw error;

      let filteredData = data || [];

      // Filter faculty in JavaScript to avoid complex PostgreSQL array operations
      if (type === 'faculty') {
        filteredData = filteredData.filter(faculty => {
          const hasBranch = !faculty.assigned_branches ||
            faculty.assigned_branches.length === 0 ||
            faculty.assigned_branches.includes(studentContext.branch);

          const hasSemester = !faculty.assigned_semesters ||
            faculty.assigned_semesters.length === 0 ||
            faculty.assigned_semesters.includes(studentContext.semester);

          return hasBranch && hasSemester;
        });
      }

      setRecipientOptions(filteredData?.map(profile => ({
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        branch: profile.branch,
        semester: profile.semester,
        assigned_branches: profile.assigned_branches,
        assigned_semesters: profile.assigned_semesters,
        // Add required fields with defaults
        created_at: '',
        updated_at: '',
        is_approved: true,
        display_name: profile.full_name,
      })) || []);
    } catch (error) {
      console.error('Error fetching recipients:', error);
      setRecipientOptions([]);
    } finally {
      setLoadingRecipients(false);
    }
  }, [studentContext]);

  const [recipientType, setRecipientType] = useState<ReportRecipientType | undefined>();

  // Update local state when form changes
  const handleRecipientTypeChange = (value: ReportRecipientType) => {
    setRecipientType(value);
    form.setValue('recipientType', value);
    form.setValue('recipient_uid', undefined); // Reset selection
    if (value) {
      fetchRecipients(value);
    } else {
      setRecipientOptions([]);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'student' && user.role !== 'pending') {
        router.push('/dashboard');
      } else {
        setStudentContext({branch: user.branch, semester: user.semester});
        setPageLoading(false);
      }
    }
  }, [user, authLoading, router]);

  async function onSubmit(data: ReportFormValues) {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to submit a report.", variant: "destructive" });
      return;
    }
    setFormSubmitting(true);
    try {
      // Find recipient details
      const recipient = recipientOptions.find(r => r.id === data.recipient_uid);

      const newReport: Report = {
        id: crypto.randomUUID(),
        recipientType: data.recipientType,
        recipient_uid: data.recipient_uid,
        recipient_name: recipient?.full_name || recipient?.email,
        reportContent: data.reportContent,
        submittedAt: new Date().toISOString(),
        status: 'new',
        contextBranch: studentContext.branch,
        contextSemester: studentContext.semester,
        submittedByUid: user.uid,
        submittedByName: user.displayName || undefined,
        submittedByUsn: user.usn || undefined,
      };

      // Insert into Supabase
      const { error } = await supabase
        .from('reports')
        .insert({
          id: newReport.id,
          recipientType: newReport.recipientType,
          recipient_uid: newReport.recipient_uid,
          recipient_name: newReport.recipient_name,
          reportContent: newReport.reportContent,
          submittedAt: newReport.submittedAt,
          status: newReport.status,
          contextBranch: newReport.contextBranch,
          contextSemester: newReport.contextSemester,
          submittedByUid: newReport.submittedByUid,
          submittedByName: newReport.submittedByName,
          submittedByUsn: newReport.submittedByUsn,
        });

      if (error) throw error;

      toast({
        title: "Report Submitted Successfully",
        description: "Your concern has been submitted. Thank you.",
        duration: 3000,
      });
      form.reset();
      router.push('/student');
    } catch (error) {
      console.error("Error submitting report:", error);
      toast({
        title: "Submission Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setFormSubmitting(false);
    }
  }

  if (pageLoading || authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <SimpleRotatingSpinner className="h-12 w-12 text-primary" />
      </div>
    );
  }

  if (!user || (user.role !== 'student' && user.role !== 'pending')) {
     return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Card className="max-w-md mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="text-destructive text-xl sm:text-2xl">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <ShieldCheck className="h-12 w-12 sm:h-16 sm:w-16 text-destructive mx-auto mb-4" />
            <p className="text-md sm:text-lg text-muted-foreground">
                You do not have permission to access this page.
            </p>
            <Link href={user ? "/student" : "/login"}><Button variant="outline" className="mt-6">Go Back</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 relative overflow-hidden">
      {/* Particle background animation */}
      <ParticleBackground />

        <div className="mb-6 relative z-10">
            <Button variant="outline" size="icon" onClick={() => router.back()} aria-label="Go back">
                <ArrowLeft className="h-4 w-4" />
            </Button>
        </div>
      <Card className="w-full max-w-xl mx-auto shadow-xl relative z-10">
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight text-primary flex items-center">
            <MessageSquareWarning className="mr-2 h-7 w-7" /> Report a Concern
          </CardTitle>
          <CardDescription>
            Submit your concerns. Your identity (Name &amp; USN) will be visible to the recipient (Faculty/Admin).
            Reports are intended to help improve our college environment. Please be respectful and constructive.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="recipientType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report To</FormLabel>
                    <Select onValueChange={handleRecipientTypeChange} defaultValue={recipientType}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select recipient (Faculty or Admin)" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="faculty">Faculty (General - for your branch concerns)</SelectItem>
                        <SelectItem value="admin">Administration (General college-wide concerns)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Faculty reports are generally for branch-specific issues. Admin reports are for broader college matters.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {recipientOptions.length > 0 && (
                <FormField
                  control={form.control}
                  name="recipient_uid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Specific Recipient</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loadingRecipients}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={loadingRecipients ? "Loading recipients..." : "Choose recipient"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {recipientOptions.map(recipient => (
                            <SelectItem key={recipient.id} value={recipient.id}>
                              {recipient.full_name || recipient.email} ({recipient.role})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the specific {form.watch('recipientType')} member you want to contact.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="reportContent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Concern / Issue</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Clearly describe your concern. Provide specific details where possible."
                        rows={8}
                        {...field}
                      />
                    </FormControl>
                     <FormDescription>
                      Min 20 characters, Max 2000 characters.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="p-3 bg-yellow-50 border border-yellow-300 rounded-md text-xs text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-300">
                <AlertTriangle className="inline h-4 w-4 mr-1 align-text-bottom"/>
                <strong>Please Note:</strong> Your name and USN will be shared with the selected recipient. This system is for constructive feedback. Misuse may lead to disciplinary action.
              </div>
              <Button type="submit" className="w-full" disabled={formSubmitting}>
                {formSubmitting ? <SimpleRotatingSpinner className="mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />}
                {formSubmitting ? 'Submitting...' : 'Submit Report'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}