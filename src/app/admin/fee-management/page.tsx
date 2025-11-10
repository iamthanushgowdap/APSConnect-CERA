"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { FeeRecordForm } from '@/components/fees/fee-record-form';
import type { FeeRecord, UserProfile, Branch, Semester, FeeStatus } from '@/types';
import { semesters, feeStatuses } from '@/types';
import ParticleBackground from "@/components/ui/particle-background";
import { Card, CardContent, CardHeader, CardTitle, CardDescription as ShadCnCardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { ShieldCheck, CreditCard, PlusCircle, Edit, Trash2, Filter, ArrowLeft, Search as SearchIcon, CheckCircle, Clock } from 'lucide-react';
import { SimpleRotatingSpinner } from '@/components/ui/loading-spinners';
import { getUserProfiles, getFeeRecords, createFeeRecord, updateFeeRecord, deleteFeeRecord } from '@/lib/supabase-utils';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { FeeStatusBadge } from '@/components/fees/fee-status-badge';

export default function AdminFeeManagementPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [allFeeRecords, setAllFeeRecords] = useState<FeeRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<FeeRecord[]>([]);
  const [allStudents, setAllStudents] = useState<UserProfile[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FeeRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<FeeRecord | null>(null);

  // Filters
  const [filterBranch, setFilterBranch] = useState<string>('all');
  const [filterSemester, setFilterSemester] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchRecords = useCallback(async () => {
    try {
      const records = await getFeeRecords();
      setAllFeeRecords(records.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));

      const studentProfiles = await getUserProfiles({ role: 'student' });
      const approvedStudents = studentProfiles.filter(s => s.is_approved);
      setAllStudents(approvedStudents);
    } catch (error) {
      console.error('Error fetching records:', error);
      toast({ title: "Error", description: "Failed to load fee records.", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'admin') {
        router.push(user ? '/dashboard' : '/login');
      } else {
        fetchRecords();
        setPageLoading(false);
      }
    }
  }, [user, authLoading, router, fetchRecords]);
  
  useEffect(() => {
    let tempRecords = [...allFeeRecords];
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
  }, [allFeeRecords, filterBranch, filterSemester, filterStatus, searchTerm, allStudents]);
  
  const handleFormSubmitSuccess = (record: FeeRecord) => {
    const existingIndex = allFeeRecords.findIndex(r => r.id === record.id);
    if (existingIndex > -1) {
      allFeeRecords[existingIndex] = record;
      setAllFeeRecords([...allFeeRecords]);
    } else {
      setAllFeeRecords(prev => [record, ...prev]);
    }
    setIsFormDialogOpen(false);
    setEditingRecord(null);
  };
  
  const confirmDelete = (record: FeeRecord) => setRecordToDelete(record);
  
  const handleDelete = async () => {
    if (!recordToDelete) return;
    try {
      await deleteFeeRecord(recordToDelete.id);
      const student = allStudents.find(s => s.id === recordToDelete.student_id);
      const updatedRecords = allFeeRecords.filter(r => r.id !== recordToDelete.id);
      setAllFeeRecords(updatedRecords);
      toast({ title: "Record Deleted", description: `Fee record for ${student?.full_name || 'student'} has been deleted.` });
      setRecordToDelete(null);
    } catch (error) {
      console.error('Error deleting record:', error);
      toast({ title: "Error", description: "Failed to delete record.", variant: "destructive" });
    }
  };
  
  const markAsPaid = async (record: FeeRecord) => {
    try {
      const updatedRecord = await updateFeeRecord(record.id, {
        paid_amount: record.total_amount,
        payment_status: 'paid',
        paid_at: new Date().toISOString(),
      });
      const updatedRecords = allFeeRecords.map(r => r.id === record.id ? updatedRecord : r);
      setAllFeeRecords(updatedRecords);
      toast({ title: "Fee Marked as Paid", description: `Payment recorded for student.` });
    } catch (error) {
      console.error('Error marking as paid:', error);
      toast({ title: "Error", description: "Failed to mark as paid.", variant: "destructive" });
    }
  };
  

  if (pageLoading || authLoading) return <div className="container mx-auto p-4 flex justify-center items-center min-h-screen"><SimpleRotatingSpinner className="h-12 w-12 text-primary" /></div>;
  if (!user || user.role !== 'admin') return <div className="container mx-auto px-4 py-8 text-center"><Card className="max-w-md mx-auto shadow-lg"><CardHeader><CardTitle className="text-destructive">Access Denied</CardTitle></CardHeader><CardContent><ShieldCheck className="h-16 w-16 text-destructive mx-auto mb-4" /><p>You do not have permission to view this page.</p><Link href="/dashboard"><Button variant="outline" className="mt-6">Go to Dashboard</Button></Link></CardContent></Card></div>;

  return (
    <div className="container mx-auto px-4 py-8 relative overflow-hidden">
      {/* Particle background animation */}
      <ParticleBackground />

      <div className="flex justify-between items-center mb-4 relative z-10">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary flex items-center"><CreditCard className="mr-3 h-7 w-7" /> Fee Management</h1>
            <div className="flex items-center gap-2">
                <Button onClick={() => { setEditingRecord(null); setIsFormDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> New Fee Record</Button>
                <Button variant="outline" size="icon" onClick={() => router.back()} aria-label="Go back"><ArrowLeft className="h-5 w-5" /></Button>
            </div>
        </div>
        <p className="text-sm sm:text-base text-muted-foreground mb-8">Create, view, and manage student fee records.</p>
        
        <Card className="shadow-lg mb-8">
            <CardHeader><CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" /> Filter Records</CardTitle></CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                    <Select value={filterSemester} onValueChange={setFilterSemester}><SelectTrigger><SelectValue placeholder="Semester" /></SelectTrigger><SelectContent><SelectItem value="all">All Semesters</SelectItem>{semesters.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
                    <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All Statuses</SelectItem>{feeStatuses.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent></Select>
                    <div className="relative"><SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input type="search" placeholder="Search by student name or student ID..." className="pl-8 w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                </div>
            </CardContent>
        </Card>

        <Card className="shadow-lg">
            <CardHeader><CardTitle>Fee Records</CardTitle><ShadCnCardDescription>Total records: {filteredRecords.length}</ShadCnCardDescription></CardHeader>
            <CardContent><div className="overflow-x-auto">
                <Table>
                    <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Student ID</TableHead><TableHead>Fee Breakdown</TableHead><TableHead>Total</TableHead><TableHead>Paid</TableHead><TableHead>Due</TableHead><TableHead>Due Date</TableHead><TableHead>Status</TableHead><TableHead>Paid At</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
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
                                <TableCell className="text-right space-x-1">
                                    {rec.payment_status !== 'paid' && (
                                        <Button variant="default" size="icon" onClick={() => markAsPaid(rec)} aria-label="Mark as paid">
                                            <CheckCircle className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <Button variant="outline" size="icon" onClick={() => { setEditingRecord(rec); setIsFormDialogOpen(true); }} aria-label="Edit fee record">
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="destructive" size="icon" onClick={() => confirmDelete(rec)} aria-label="Delete fee record">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                            );
                        }) : <TableRow><TableCell colSpan={10} className="h-24 text-center">No fee records match the current filters.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </div></CardContent>
        </Card>

        {isFormDialogOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                <CardHeader className="border-b"><CardTitle>{editingRecord ? "Edit Fee Record" : "Create New Fee Record"}</CardTitle></CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-6">
                    <FeeRecordForm onSubmitSuccess={handleFormSubmitSuccess} initialData={editingRecord || undefined} students={allStudents} />
                </CardContent>
                <div className="border-t p-4 flex justify-end sticky bottom-0 bg-background">
                    <Button variant="outline" onClick={() => { setIsFormDialogOpen(false); setEditingRecord(null); }}>Cancel</Button>
                </div>
            </Card>
          </div>
        )}
        
        <AlertDialog open={!!recordToDelete} onOpenChange={() => setRecordToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Confirm Deletion</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete this fee record for "{allStudents.find(s => s.id === recordToDelete?.student_id)?.full_name || 'student'}"? This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Confirm Delete</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
