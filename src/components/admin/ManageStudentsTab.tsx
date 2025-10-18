
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, Branch, Semester, defaultBranches, semesters } from '@/types'; // Make sure Semester is imported
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription as ShadCnCardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, XCircle, Edit3, Trash2, ShieldAlert, Search, VenetianMask } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getUserProfiles, updateUserProfile } from '@/lib/supabase-utils';
import { User } from '@/components/auth-provider';
import { SimpleRotatingSpinner } from '@/components/ui/loading-spinners';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';


const passwordChangeSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters."),
  confirmNewPassword: z.string(),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: "Passwords don't match",
  path: ["confirmNewPassword"],
});
type PasswordChangeFormValues = z.infer<typeof passwordChangeSchema>;


interface ManageStudentsTabProps {
  actor: User; 
}

export default function ManageStudentsTab({ actor }: ManageStudentsTabProps) {
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<UserProfile | null>(null);
  const [dialogAction, setDialogAction] = useState<'approve' | 'reject' | 'revoke' | 'changePassword' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBranch, setFilterBranch] = useState<string>('all');
  const [filterSemester, setFilterSemester] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all'); // 'all', 'approved', 'pending', 'rejected'
  const { toast } = useToast();

  const passwordForm = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { newPassword: "", confirmNewPassword: "" },
  });


  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load students from database
      const allUsers = await getUserProfiles();
      const studentUsers = allUsers.filter(user => user.role === 'student' || user.role === 'pending');
      
      if (actor.role === 'admin') {
        setStudents(studentUsers);
      } else if (actor.role === 'faculty' && actor.assignedBranches && actor.assignedSemesters) {
        // Faculty can access students from their assigned branches and semesters
        const filteredStudents = studentUsers.filter(user => {
          if (!user.branch || !user.semester) return false;
          
          const facultyCanAccessBranch = actor.assignedBranches!.includes(user.branch);
          const facultyCanAccessSemester = actor.assignedSemesters!.length === 0 || actor.assignedSemesters!.includes(user.semester as Semester);
          
          return facultyCanAccessBranch && facultyCanAccessSemester;
        });
        setStudents(filteredStudents);
      } else {
        setStudents([]);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    }
    setIsLoading(false);
  }, [actor]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleAction = async () => {
    if (!selectedStudent || !dialogAction) return;

    if ((dialogAction === 'reject' || dialogAction === 'revoke') && !rejectionReason.trim()) {
      toast({ title: "Reason Required", description: "Please provide a reason for this action.", variant: "destructive", duration: 3000 });
      return;
    }
    
    try {
      let updatedProfileData: Partial<UserProfile> = {};
      let toastMessage = "";

      switch (dialogAction) {
        case 'approve':
          updatedProfileData = { 
            is_approved: true, 
            role: 'student', 
            rejection_reason: undefined, // Clear rejection reason on approval
            approved_by_uid: actor.uid,
            approved_by_display_name: actor.displayName || actor.email || 'System',
            approval_date: new Date().toISOString(),
            rejected_by_uid: undefined, // Clear rejection details
            rejected_by_display_name: undefined,
            rejected_date: undefined,
          };
          toastMessage = `${selectedStudent.full_name || selectedStudent.student_id}'s registration approved.`;
          break;
        case 'reject': // This case applies when rejecting a PENDING student
          updatedProfileData = { 
            is_approved: false, 
            role: 'pending', 
            rejection_reason: rejectionReason,
            rejected_by_uid: actor.uid,
            rejected_by_display_name: actor.displayName || actor.email || 'System',
            rejected_date: new Date().toISOString(),
            approved_by_uid: undefined, // Clear approval details if any existed
            approved_by_display_name: undefined,
            approval_date: undefined,
          };
          toastMessage = `${selectedStudent.full_name || selectedStudent.student_id}'s registration rejected. Reason: ${rejectionReason}`;
          break;
        case 'revoke': // This case applies when an APPROVED student's access is revoked (effectively rejecting them)
          updatedProfileData = {
            is_approved: false,
            role: 'pending',
            rejection_reason: rejectionReason || "Access Revoked by " + (actor.displayName || actor.role), 
            rejected_by_uid: actor.uid,
            rejected_by_display_name: actor.displayName || actor.email || 'System',
            rejected_date: new Date().toISOString(),
            approved_by_uid: undefined, 
            approved_by_display_name: undefined,
            approval_date: undefined,
          };
          toastMessage = `Access revoked for ${selectedStudent.full_name || selectedStudent.student_id}. Reason: ${rejectionReason}`;
          break;
      }

      // Update the profile in the database
      await updateUserProfile(selectedStudent.id, updatedProfileData);

      toast({ title: "Action Successful", description: toastMessage, duration: 3000 });
      fetchStudents(); // Refresh the student list
    } catch (error) {
      console.error('Error updating student:', error);
      toast({ title: "Error", description: "Failed to update student. Please try again.", variant: "destructive" });
    }

    setDialogAction(null);
    setSelectedStudent(null);
    setRejectionReason('');
  };

  const handleChangePassword = async (values: PasswordChangeFormValues) => {
    if (!selectedStudent) return;

    console.log('🔄 Starting password change for student:', selectedStudent.full_name);

    try {
      console.log('📡 Making API call to change password...');

      // Update password in Supabase auth and database via API
      const response = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedStudent.id,
          newPassword: values.newPassword,
        }),
      });

      console.log('📊 API response status:', response.status);
      console.log('📊 API response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API error response:', errorData);
        throw new Error(errorData.error || 'Failed to change password');
      }

      const successData = await response.json();
      console.log('✅ Password change successful:', successData);

      toast({ title: "Password Changed", description: `Password for ${selectedStudent.full_name || selectedStudent.student_id} has been updated.`, duration: 3000 });
      fetchStudents();
    } catch (error) {
      console.error('❌ Password change error:', error);
      toast({ title: "Error", description: "Failed to change password. Please try again.", variant: "destructive" });
    }

    setDialogAction(null);
    setSelectedStudent(null);
    passwordForm.reset();
  };
  

  const filteredStudents = students.filter(student => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      student.full_name?.toLowerCase().includes(searchLower) ||
      student.email.toLowerCase().includes(searchLower) ||
      student.student_id?.toLowerCase().includes(searchLower) ||
      student.branch?.toLowerCase().includes(searchLower) ||
      student.semester?.toLowerCase().includes(searchLower) ||
      student.rejection_reason?.toLowerCase().includes(searchLower)
    );
    const matchesBranch = filterBranch === 'all' || student.branch === filterBranch;
    const matchesSemester = filterSemester === 'all' || student.semester === filterSemester;
    const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'approved' && student.is_approved && student.role === 'student') ||
        (filterStatus === 'pending' && !student.is_approved && student.role === 'pending' && !student.rejection_reason) ||
        (filterStatus === 'rejected' && !student.is_approved && student.role === 'pending' && !!student.rejection_reason);

    return matchesSearch && matchesBranch && matchesSemester && matchesStatus;
  });

  const uniqueBranches = actor.role === 'faculty' && actor.assignedBranches && actor.assignedBranches.length > 0
    ? actor.assignedBranches
    : defaultBranches;

  const uniqueSemesters = actor.role === 'faculty' && actor.assignedSemesters && actor.assignedSemesters.length > 0
    ? actor.assignedSemesters
    : semesters;

  if (isLoading) {
    return <div className="flex justify-center items-center py-10"><SimpleRotatingSpinner className="h-8 w-8 text-primary" /> <span className="ml-2">Loading students...</span></div>;
  }

  return (
    <TooltipProvider>
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filter Students</CardTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-2">
            <Input
              type="search"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
             <Select value={filterBranch} onValueChange={setFilterBranch}>
              <SelectTrigger><SelectValue placeholder="Filter by Branch" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {uniqueBranches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterSemester} onValueChange={setFilterSemester}>
              <SelectTrigger><SelectValue placeholder="Filter by Semester" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Semesters</SelectItem>
                {uniqueSemesters.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger><SelectValue placeholder="Filter by Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending Approval</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Student List</CardTitle>
          <ShadCnCardDescription>Total students matching filters: {filteredStudents.length}</ShadCnCardDescription>
        </CardHeader>
        <CardContent>
          {filteredStudents.length === 0 ? (
            <p className="text-muted-foreground">No students match the current filters.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>USN</TableHead>
                  <TableHead>Registered At</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map(student => (
                  <TableRow key={student.id}>
                    <TableCell>{student.full_name || 'N/A'}</TableCell>
                    <TableCell>{student.student_id || 'N/A'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {student.created_at ? format(new Date(student.created_at), "PPpp") : 'N/A'}
                    </TableCell>
                    <TableCell><Badge variant="outline">{student.branch || 'N/A'}</Badge></TableCell>
                    <TableCell><Badge variant="secondary">{student.semester || 'N/A'}</Badge></TableCell>
                    <TableCell>
                      {student.is_approved ? <Badge variant="default" className="bg-black text-white hover:bg-black/80">Approved</Badge> : 
                       student.rejection_reason ? <Badge variant="destructive">Rejected</Badge> :
                       <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      {!student.is_approved && !student.rejection_reason && ( // PENDING approval
                         <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-foreground hover:text-foreground/80" onClick={() => { setSelectedStudent(student); setDialogAction('approve'); }}>
                                    <CheckCircle2 className="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Approve Student</p></TooltipContent>
                        </Tooltip>
                      )}
                       {!student.is_approved && !student.rejection_reason && ( // PENDING approval
                         <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700" onClick={() => { setSelectedStudent(student); setDialogAction('reject'); setRejectionReason(''); }}>
                                    <XCircle className="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Reject Student</p></TooltipContent>
                        </Tooltip>
                       )}
                      {student.is_approved && ( // APPROVED student
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-orange-600 hover:text-orange-700" onClick={() => { setSelectedStudent(student); setDialogAction('revoke'); setRejectionReason(''); }}>
                                    <ShieldAlert className="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Revoke Approval / Reject</p></TooltipContent>
                        </Tooltip>
                      )}
                       {student.rejection_reason && ( // REJECTED student
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-foreground hover:text-foreground/80" onClick={() => { setSelectedStudent(student); setDialogAction('approve'); }}>
                                    <CheckCircle2 className="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Re-Approve (Clear Rejection)</p></TooltipContent>
                        </Tooltip>
                       )}
                       <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-700" onClick={() => { setSelectedStudent(student); setDialogAction('changePassword'); passwordForm.reset(); }}>
                                <VenetianMask className="h-5 w-5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Change Password</p></TooltipContent>
                       </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!selectedStudent && (dialogAction === 'approve' || dialogAction === 'reject' || dialogAction === 'revoke')} onOpenChange={(isOpen) => {
        if (!isOpen) { 
            setDialogAction(null);
            setSelectedStudent(null);
            setRejectionReason('');
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialogAction ? `Confirm Action: ${dialogAction.charAt(0).toUpperCase()}${dialogAction.substring(1)} Student` : 'Confirm Action'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialogAction === 'approve' && `Are you sure you want to approve ${selectedStudent?.full_name || selectedStudent?.student_id}?`}
              {dialogAction === 'reject' && `Please provide a reason for rejecting ${selectedStudent?.full_name || selectedStudent?.student_id}.`}
              {dialogAction === 'revoke' && `Are you sure you want to revoke access for ${selectedStudent?.full_name || selectedStudent?.student_id}? You must provide a reason.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {(dialogAction === 'reject' || dialogAction === 'revoke') && (
            <div className="py-2">
              <Label htmlFor="rejectionReason" className="text-sm font-medium">Reason {dialogAction === 'reject' || dialogAction === 'revoke' ? '(Required)' : '(Optional)'}</Label>
              <Textarea 
                id="rejectionReason" 
                value={rejectionReason} 
                onChange={(e) => setRejectionReason(e.target.value)} 
                placeholder={dialogAction === 'reject' ? "Enter reason for rejection..." : "Enter reason for revoking..."} 
                className="mt-1"
                rows={3}
              />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {setDialogAction(null); setSelectedStudent(null); setRejectionReason('');}}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
                onClick={handleAction} 
                className={dialogAction === 'reject' || dialogAction === 'revoke' ? "bg-destructive hover:bg-destructive/90" : ""}
                disabled={(dialogAction === 'reject' || dialogAction === 'revoke') && !rejectionReason.trim()}
            >
              Confirm {dialogAction ? `${dialogAction.charAt(0).toUpperCase()}${dialogAction.substring(1)}` : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

        <AlertDialog open={!!selectedStudent && dialogAction === 'changePassword'} onOpenChange={(isOpen) => {
            if (!isOpen && dialogAction === 'changePassword') {
                setDialogAction(null);
                setSelectedStudent(null);
                passwordForm.reset();
            }
        }}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Change Password for {selectedStudent?.full_name || selectedStudent?.student_id}</AlertDialogTitle>
                    <AlertDialogDescription>Enter and confirm the new password for the student.</AlertDialogDescription>
                </AlertDialogHeader>
                <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(handleChangePassword)} className="space-y-4 py-2">
                        <FormField
                            control={passwordForm.control}
                            name="newPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={passwordForm.control}
                            name="confirmNewPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirm New Password</FormLabel>
                                    <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => {setDialogAction(null); setSelectedStudent(null); passwordForm.reset();}}>Cancel</AlertDialogCancel>
                            <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
                                {passwordForm.formState.isSubmitting && <SimpleRotatingSpinner className="mr-2 h-4 w-4"/>}
                                Change Password
                            </Button>
                        </AlertDialogFooter>
                    </form>
                </Form>
            </AlertDialogContent>
        </AlertDialog>
    </div>
    </TooltipProvider>
  );
}


