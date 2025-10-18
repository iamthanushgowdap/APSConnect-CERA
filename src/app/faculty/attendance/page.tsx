
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import type { UserProfile, Branch, Semester, Subject, AttendanceRecord, AttendanceStatus, DayOfWeek } from '@/types';
import { ATTENDANCE_STORAGE_KEY, SUBJECT_STORAGE_KEY, timeSlotDescriptors } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ShieldCheck, UserCheck, Info, ArrowLeft, Calendar, Save } from 'lucide-react';
import { SimpleRotatingSpinner } from '@/components/ui/loading-spinners';
import { markAttendance, getAttendance, getSubjects, getUserProfiles, getTimetables } from '@/lib/supabase-utils';
import { useToast } from '@/hooks/use-toast';
import { format, isSameDay } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type StudentAttendanceStatus = {
  student: UserProfile;
  status: AttendanceStatus | 'unmarked';
  saved?: boolean; // Whether this attendance has been saved
};

export default function FacultyAttendancePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [pageLoading, setPageLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [facultySubjects, setFacultySubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [scheduledPeriods, setScheduledPeriods] = useState<{period: number, subject: string}[]>([]);
  
  const [classStudents, setClassStudents] = useState<StudentAttendanceStatus[]>([]);
  
  const facultyAssignedBranches = useMemo(() => user?.assignedBranches || [], [user]);

  const fetchFacultySubjects = useCallback(async () => {
    if (user) {
      try {
        console.log('🔍 Faculty Attendance: Fetching subjects from database...');
        const allSubjects = await getSubjects();
        console.log('✅ Subjects fetched:', allSubjects.length, 'subjects');

        // Filter subjects assigned to this faculty
        const assignedSubjects = allSubjects.filter(s =>
          s.assignedFacultyUids && s.assignedFacultyUids.includes(user.uid)
        );
        console.log('✅ Assigned subjects:', assignedSubjects.length, 'subjects');

        setFacultySubjects(assignedSubjects);
      } catch (error) {
        console.error('❌ Error fetching subjects:', error);
        setFacultySubjects([]);
      }
    }
  }, [user]);

  const checkTodaysSchedule = useCallback(async (subjectId: string) => {
    if (!user) return;
    
    try {
      const subject = facultySubjects.find(s => s.id === subjectId);
      if (!subject) return;

      console.log('🔍 Faculty Attendance: Checking timetable for', subject.branch, subject.semester);

      // Get today's day of week
      const today = new Date();
      const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][today.getDay()] as DayOfWeek;
      
      // Fetch timetable for this branch and semester
      const timetables = await getTimetables({ branch: subject.branch, semester: subject.semester });
      const todaysTimetable = timetables.find(t => t.branch === subject.branch && t.semester === subject.semester);
      
      if (!todaysTimetable) {
        console.log('❌ No timetable found for', subject.branch, subject.semester);
        setScheduledPeriods([]);
        return;
      }

      // Find periods where this subject is scheduled today
      const daySchedule = todaysTimetable.schedule.find((s: any) => s.day.toLowerCase() === dayOfWeek);
      if (!daySchedule) {
        console.log('❌ No schedule found for today');
        setScheduledPeriods([]);
        return;
      }

      // Find periods with this subject
      const periodsWithSubject = daySchedule.entries
        .map((entry: any, idx: number) => ({ period: idx, subject: entry.subject }))
        .filter((entry: any) => entry.subject === subject.name && !timeSlotDescriptors[entry.period].isBreak);

      console.log('✅ Found scheduled periods:', periodsWithSubject);
      setScheduledPeriods(periodsWithSubject);
      
    } catch (error) {
      console.error('❌ Error checking schedule:', error);
      setScheduledPeriods([]);
    }
  }, [user, facultySubjects]);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'faculty') {
        router.push(user ? '/dashboard' : '/login');
      } else {
        fetchFacultySubjects();
        setPageLoading(false);
      }
    }
  }, [user, authLoading, router, fetchFacultySubjects]);

  const loadStudentsForClass = useCallback(async () => {
    if (!selectedSubjectId || scheduledPeriods.length === 0) {
      setClassStudents([]);
      return;
    }

    const subject = facultySubjects.find(s => s.id === selectedSubjectId);
    if (!subject) return;

    try {
      console.log('🔍 Faculty Attendance: Fetching students for', subject.branch, subject.semester);

      // Fetch all students from database
      const allStudents = await getUserProfiles({ role: 'student' });
      console.log('✅ Students fetched:', allStudents.length, 'total students');

      // Filter students for this class
      const classStudentsList = allStudents.filter(student =>
        student.branch === subject.branch &&
        student.semester === subject.semester &&
        student.is_approved
      );
      console.log('✅ Class students:', classStudentsList.length, 'students');

      classStudentsList.sort((a, b) => (a.student_id || "").localeCompare(b.student_id || ""));

      // Load existing attendance records for today and all scheduled periods
      const dateStr = format(new Date(), 'yyyy-MM-dd');
      const existingRecords = await getAttendance();
      
      // Create student status for each scheduled period
      const studentStatuses: StudentAttendanceStatus[] = classStudentsList.map(student => {
        // Check if attendance is already saved for any of today's scheduled periods
        const hasSavedAttendance = scheduledPeriods.some(({ period }) => {
          const record = existingRecords.find((rec: AttendanceRecord) => 
            rec.studentUid === student.id &&
            rec.date === dateStr &&
            rec.period === (period + 1).toString() && // Convert to 1-based period number
            rec.branch === subject.branch &&
            rec.semester === subject.semester
          );
          return !!record;
        });

        return { 
          student, 
          status: 'unmarked', // Default status
          saved: hasSavedAttendance
        };
      });
      
      setClassStudents(studentStatuses);
    } catch (error) {
      console.error('❌ Error loading students:', error);
      setClassStudents([]);
    }
  }, [selectedSubjectId, scheduledPeriods, facultySubjects]);

  useEffect(() => {
    loadStudentsForClass();
  }, [loadStudentsForClass]);

  const handleStatusChange = (studentUid: string, newStatus: AttendanceStatus) => {
    setClassStudents(prev => prev.map(s => {
      if (s.student.id === studentUid && !s.saved) {
        return {...s, status: newStatus};
      }
      return s;
    }));
  };
  
  const handleMarkAll = (status: AttendanceStatus) => {
    setClassStudents(prev => prev.map(s => s.saved ? s : {...s, status}));
  }

  const saveAttendance = async () => {
    const subject = facultySubjects.find(s => s.id === selectedSubjectId);
    if (!subject || scheduledPeriods.length === 0 || !user) return;
    setIsSaving(true);
    
    try {
      const dateStr = format(new Date(), 'yyyy-MM-dd');
      
      // Mark all unmarked students as absent by default
      const finalClassStudents = classStudents.map(({ student, status }) => ({
        student,
        status: status === 'unmarked' ? 'absent' : status
      }));
      
      // Save attendance for each scheduled period
      for (const { period } of scheduledPeriods) {
        const periodNumber = (period + 1).toString(); // Convert to 1-based period number
        
        for (const {student, status} of finalClassStudents) {
          const attendanceData = {
            student_uid: student.id,
            subject: subject.name,
            date: dateStr,
            period: periodNumber,
            status: status,
            branch: subject.branch,
            semester: subject.semester,
            marked_by: user.uid,
            marked_by_name: user.displayName || user.email || 'Faculty',
            notes: ''
          };

          await markAttendance(attendanceData);
        }
      }

      toast({ title: 'Attendance Saved', description: `Attendance for ${subject.name} has been saved for all scheduled periods today.`});
      
      // Mark as saved to disable editing
      setClassStudents(finalClassStudents.map(item => ({ ...item, saved: true })));
      
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast({ title: 'Error', description: 'Failed to save attendance. Please try again.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };


  if (pageLoading || authLoading) {
    return <div className="container mx-auto p-4 flex justify-center items-center min-h-screen"><SimpleRotatingSpinner className="h-12 w-12 text-primary" /></div>;
  }
  
  if (!user || user.role !== 'faculty') {
    return <div className="container mx-auto px-4 py-8 text-center"><Card className="max-w-md mx-auto shadow-lg"><CardHeader><CardTitle className="text-destructive">Access Denied</CardTitle></CardHeader><CardContent><ShieldCheck className="h-16 w-16 text-destructive mx-auto mb-4" /><p>You do not have permission to view this page.</p><Link href="/dashboard"><Button variant="outline" className="mt-6">Go to Dashboard</Button></Link></CardContent></Card></div>;
  }

  if (facultyAssignedBranches.length === 0) {
    return <div className="container mx-auto px-4 py-8"><Card className="max-w-lg mx-auto shadow-lg"><CardHeader><CardTitle className="text-primary flex items-center"><Info className="mr-2 h-6 w-6" /> No Assigned Branches</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">You are not assigned to any branches. Please contact an administrator to mark attendance.</p><Link href="/faculty"><Button variant="outline" className="mt-6">Back to Dashboard</Button></Link></CardContent></Card></div>;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary flex items-center"><UserCheck className="mr-3 h-7 w-7" /> Mark Attendance</h1>
        <Button variant="outline" size="icon" onClick={() => router.back()} aria-label="Go back"><ArrowLeft className="h-5 w-5" /></Button>
      </div>
      <p className="text-muted-foreground mb-8">Select a subject to mark student attendance for all scheduled periods today, {format(new Date(), "PPP")}.</p>
      
      <Card className="shadow-lg mb-8">
        <CardHeader>
          <CardTitle>Select Class</CardTitle>
          <div className="grid grid-cols-1 gap-4 mt-2">
            <Select onValueChange={async (value) => {
              setSelectedSubjectId(value);
              if (value) {
                await checkTodaysSchedule(value);
              } else {
                setScheduledPeriods([]);
              }
            }} value={selectedSubjectId}>
                <SelectTrigger><SelectValue placeholder="Select a subject you teach" /></SelectTrigger>
                <SelectContent>
                    {facultySubjects.length > 0 ? facultySubjects.map(s => 
                        <SelectItem key={s.id} value={s.id}>
                            {s.name} ({s.branch} - {s.semester})
                        </SelectItem>)
                    : <SelectItem value="-" disabled>No subjects assigned to you.</SelectItem>}
                </SelectContent>
            </Select>
          </div>
          {selectedSubjectId && scheduledPeriods.length > 0 && (
            <div className="mt-2 p-2 bg-muted/20 rounded text-sm">
              <strong>Scheduled Periods Today:</strong> {scheduledPeriods.map(p => `Period ${p.period + 1}`).join(', ')}
            </div>
          )}
          {selectedSubjectId && scheduledPeriods.length === 0 && (
            <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-sm text-yellow-700 dark:text-yellow-300">
              No periods scheduled for this subject today.
            </div>
          )}
        </CardHeader>
      </Card>

      {selectedSubjectId && scheduledPeriods.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Student List for {facultySubjects.find(s => s.id === selectedSubjectId)?.name}</CardTitle>
            <CardDescription>
              {facultySubjects.find(s => s.id === selectedSubjectId)?.branch} - {facultySubjects.find(s => s.id === selectedSubjectId)?.semester} | 
              Scheduled Periods Today: {scheduledPeriods.map(p => `Period ${p.period + 1}`).join(', ')}
            </CardDescription>
            <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleMarkAll('present')}
                  disabled={classStudents.some(s => s.saved)}
                >
                  Mark All Present
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleMarkAll('absent')}
                  disabled={classStudents.some(s => s.saved)}
                >
                  Mark All Absent
                </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>USN</TableHead><TableHead>Name</TableHead><TableHead className="text-center">Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {classStudents.length > 0 ? classStudents.map(({ student, status, saved }) => (
                  <TableRow key={student.id}>
                    <TableCell>{student.student_id || 'N/A'}</TableCell>
                    <TableCell>{student.full_name}</TableCell>
                    <TableCell className="flex justify-center items-center gap-4">
                        <Button 
                          onClick={() => handleStatusChange(student.id, 'present')} 
                          variant={status === 'present' ? 'default' : 'outline'} 
                          size="sm"
                          disabled={saved}
                        >
                          Present
                        </Button>
                        <Button 
                          onClick={() => handleStatusChange(student.id, 'absent')} 
                          variant={status === 'absent' ? 'destructive' : 'outline'} 
                          size="sm"
                          disabled={saved}
                        >
                          Absent
                        </Button>
                        {saved && <span className="text-xs text-muted-foreground ml-2">✓ Saved</span>}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={3} className="text-center h-24">No approved students found for this class.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
            <div className="mt-6 flex justify-end">
              <Button onClick={saveAttendance} disabled={isSaving || classStudents.length === 0}>
                {isSaving ? <SimpleRotatingSpinner className="mr-2" /> : <Save className="mr-2 h-4 w-4"/>}
                Save Attendance
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

    