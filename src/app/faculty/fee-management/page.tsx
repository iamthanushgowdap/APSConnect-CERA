
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import type { FeeRecord, UserProfile, Branch, Semester, FeeStatus } from '@/types';
import { feeStatuses } from '@/types';
import { getUserProfiles, getFeeRecords } from '@/lib/supabase-utils';
import ParticleBackground from "@/components/ui/particle-background";
import { Card, CardContent, CardHeader, CardTitle, CardDescription as ShadCnCardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { ShieldCheck, CreditCard, Filter, ArrowLeft, Search as SearchIcon, Info } from 'lucide-react';
import { SimpleRotatingSpinner } from '@/components/ui/loading-spinners';
import { format } from 'date-fns';
import { FeeStatusBadge } from '@/components/fees/fee-status-badge';

export default function FacultyFeeManagementPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [facultyFeeRecords, setFacultyFeeRecords] = useState<FeeRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<FeeRecord[]>([]);
  const [allStudents, setAllStudents] = useState<UserProfile[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  // Filters
  const [filterBranch, setFilterBranch] = useState<string>('all');
  const [filterSemester, setFilterSemester] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const facultyAssignedBranches = useMemo(() => user?.assignedBranches || [], [user]);
  const facultyAssignedSemesters = useMemo(() => user?.assignedSemesters || [], [user]);

  const fetchRecords = useCallback(async () => {
    try {
      // Fetch all students
      const students = await getUserProfiles({ role: 'student' });
      const approvedStudents = students.filter(s => s.is_approved);

      // Filter students by faculty's assigned branches and semesters
      let assignedStudents = approvedStudents;
      if (facultyAssignedBranches.length > 0) {
        assignedStudents = assignedStudents.filter(s => facultyAssignedBranches.includes(s.branch!));
      }
      if (facultyAssignedSemesters.length > 0) {
        assignedStudents = assignedStudents.filter(s => facultyAssignedSemesters.includes(s.semester! as Semester));
      }

      setAllStudents(assignedStudents);

      // Get fee records for these students
      const studentIds = assignedStudents.map(s => s.id);
      const allFeeRecords = await getFeeRecords();
      const facultyRecords = allFeeRecords.filter(r => studentIds.includes(r.student_id));

      setFacultyFeeRecords(facultyRecords.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (error) {
      console.error('Error fetching records:', error);
      setFacultyFeeRecords([]);
      setAllStudents([]);
    }
  }, [facultyAssignedBranches, facultyAssignedSemesters]);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'faculty') {
        router.push(user ? '/dashboard' : '/login');
      } else {
        if(facultyAssignedBranches.length > 0) setFilterBranch(facultyAssignedBranches[0]);
        fetchRecords();
        setPageLoading(false);
      }
    }
  }, [user, authLoading, router, fetchRecords, facultyAssignedBranches]);
  
  useEffect(() => {
    let tempRecords = [...facultyFeeRecords];
    if (filterBranch !== 'all') tempRecords = tempRecords.filter(r => {
      const student = allStudents.find(s => s.id === r.student_id);
      return student?.branch === filterBranch;
    });
    if (filterSemester !== 'all') tempRecords = tempRecords.filter(r => r.semester === filterSemester);
    if (filterStatus !== 'all') tempRecords = tempRecords.filter(r => r.payment_status === filterStatus);
    if (searchTerm) {
        const termLower = searchTerm.toLowerCase();
        tempRecords = tempRecords.filter(r => {
            const student = allStudents.find(s => s.id === r.student_id);
            return (
                (student?.full_name || '').toLowerCase().includes(termLower) ||
                (student?.student_id || '').toLowerCase().includes(termLower)
            );
        });
    }
    setFilteredRecords(tempRecords);
  }, [facultyFeeRecords, filterBranch, filterSemester, filterStatus, searchTerm, allStudents]);

  const totalDue = useMemo(() => {
    return filteredRecords
      .filter(r => r.payment_status !== 'paid')
      .reduce((sum, r) => sum + (r.total_amount - r.paid_amount), 0);
  }, [filteredRecords]);

  if (pageLoading || authLoading) return <div className="container mx-auto p-4 flex justify-center items-center min-h-screen"><SimpleRotatingSpinner className="h-12 w-12 text-primary" /></div>;
  if (!user || user.role !== 'faculty') return <div className="container mx-auto px-4 py-8 text-center"><Card className="max-w-md mx-auto shadow-lg"><CardHeader><CardTitle className="text-destructive">Access Denied</CardTitle></CardHeader><CardContent><ShieldCheck className="h-16 w-16 text-destructive mx-auto mb-4" /><p>You do not have permission to view this page.</p><Link href="/dashboard"><Button variant="outline" className="mt-6">Go to Dashboard</Button></Link></CardContent></Card></div>;

  if (facultyAssignedBranches.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-lg mx-auto shadow-lg"><CardHeader><CardTitle className="text-primary flex items-center"><Info className="mr-2 h-6 w-6" /> No Assigned Branches</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">You are not assigned to any branches to view fee records. Please contact an administrator.</p><Link href="/faculty"><Button variant="outline" className="mt-6">Back to Dashboard</Button></Link></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 relative overflow-hidden">
      {/* Particle background animation */}
      <ParticleBackground />

      <div className="flex justify-between items-center mb-4 relative z-10">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary flex items-center"><CreditCard className="mr-3 h-7 w-7" /> Student Fee Status</h1>
            <Button variant="outline" size="icon" onClick={() => router.back()} aria-label="Go back"><ArrowLeft className="h-5 w-5" /></Button>
        </div>
        <p className="text-sm sm:text-base text-muted-foreground mb-8">Track fee payment status for students in your assigned areas.</p>
        
        <Card className="shadow-lg mb-8 relative z-10">
            <CardHeader><CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" /> Filter Records</CardTitle></CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                    <Select value={filterBranch} onValueChange={setFilterBranch}>
                        <SelectTrigger><SelectValue placeholder="Branch" /></SelectTrigger>
                        <SelectContent>
                            {facultyAssignedBranches.length > 1 && <SelectItem value="all">All My Branches</SelectItem>}
                            {facultyAssignedBranches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={filterSemester} onValueChange={setFilterSemester}>
                        <SelectTrigger><SelectValue placeholder="Semester" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Semesters</SelectItem>
                            {facultyAssignedSemesters.length > 0 ? facultyAssignedSemesters.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>) : user?.assignedSemesters?.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                        <SelectContent><SelectItem value="all">All Statuses</SelectItem>{feeStatuses.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                    </Select>
                    <div className="relative"><SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input type="search" placeholder="Search..." className="pl-8 w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                </div>
            </CardContent>
        </Card>
        
        <Card className="shadow-lg mb-8">
            <CardHeader>
            <CardTitle>Summary</CardTitle>
            <ShadCnCardDescription>Total balance based on current filters.</ShadCnCardDescription>
            </CardHeader>
            <CardContent>
            <p className="text-lg">
                Total Amount Due: <span className="font-bold text-destructive">₹{totalDue.toLocaleString()}</span>
            </p>
            </CardContent>
        </Card>

        <Card className="shadow-lg relative z-10">
            <CardHeader><CardTitle>Fee Records</CardTitle><ShadCnCardDescription>Payment status for {filteredRecords.length} student{filteredRecords.length !== 1 ? 's' : ''} matching your filters.</ShadCnCardDescription></CardHeader>
            <CardContent><div className="overflow-x-auto">
                <Table>
                    <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Student ID</TableHead><TableHead>Fee Breakdown</TableHead><TableHead>Total</TableHead><TableHead>Paid</TableHead><TableHead>Due</TableHead><TableHead>Due Date</TableHead><TableHead>Status</TableHead><TableHead>Paid At</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {filteredRecords.length > 0 ? filteredRecords.map(rec => {
                            const student = allStudents.find(s => s.id === rec.student_id);
                            return (
                            <TableRow key={rec.id}>
                                <TableCell>{student?.full_name || 'N/A'}</TableCell>
                                <TableCell>{student?.student_id || 'N/A'}</TableCell>
                                <TableCell className="text-xs">
                                    T: ₹{rec.tuition_fee}, H: ₹{rec.hostel_fee}, L: ₹{rec.library_fee}, Lab: ₹{rec.lab_fee}, O: ₹{rec.other_fees}
                                </TableCell>
                                <TableCell>₹{rec.total_amount.toLocaleString()}</TableCell>
                                <TableCell>₹{rec.paid_amount.toLocaleString()}</TableCell>
                                <TableCell>₹{(rec.total_amount - rec.paid_amount).toLocaleString()}</TableCell>
                                <TableCell>{format(new Date(rec.due_date), "PP")}</TableCell>
                                <TableCell><FeeStatusBadge status={rec.payment_status} /></TableCell>
                                <TableCell>{rec.paid_at ? format(new Date(rec.paid_at), "PP") : 'N/A'}</TableCell>
                            </TableRow>
                            );
                        }) : <TableRow><TableCell colSpan={9} className="h-24 text-center">No fee records match the current filters.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </div></CardContent>
        </Card>
    </div>
  );
}
