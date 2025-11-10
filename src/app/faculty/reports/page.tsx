"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, User } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import type { Report, ReportStatus, Branch } from '@/types';
import { REPORT_STORAGE_KEY } from '@/types';
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
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ShieldCheck, ListChecks, Filter, ArrowLeft, Info, Search as SearchIcon, Trash2 } from 'lucide-react';
import { SimpleRotatingSpinner } from '@/components/ui/loading-spinners';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';

const reportStatuses: ReportStatus[] = ['new', 'viewed', 'resolved', 'archived'];

export default function FacultyReportsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [facultyReports, setFacultyReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [dialogAction, setDialogAction] = useState<'delete' | null>(null);
  
  const [filterStatus, setFilterStatus] = useState<ReportStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const facultyAssignedBranches = user?.assignedBranches || [];
  const facultyAssignedSemesters = user?.assignedSemesters || [];


  const fetchReports = useCallback(async () => {
    if (!user || facultyAssignedBranches.length === 0) {
      setFacultyReports([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('recipientType', 'faculty')
        .order('submittedAt', { ascending: false });

      if (error) {
        console.error('Error fetching reports:', error);
        setFacultyReports([]);
        return;
      }

      // Filter reports that this faculty member should see
      const relevantReports = (data || []).filter(report => {
        // Reports addressed specifically to this faculty member
        if (report.recipient_uid === user.uid) {
          return true;
        }

        // General faculty reports for their assigned branches/semesters
        const branchMatch = !report.contextBranch || facultyAssignedBranches.includes(report.contextBranch);
        const semesterMatch = facultyAssignedSemesters.length === 0 ||
          !report.contextSemester ||
          facultyAssignedSemesters.includes(report.contextSemester);

        return branchMatch && semesterMatch;
      });

      setFacultyReports(relevantReports);
    } catch (error) {
      console.error('Error in fetchReports:', error);
      setFacultyReports([]);
    }
  }, [user, facultyAssignedBranches, facultyAssignedSemesters]);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'faculty') {
        router.push(user ? '/dashboard' : '/login');
      } else {
        fetchReports();
        setPageLoading(false);
      }
    }
  }, [user, authLoading, router, fetchReports]);
  
  useEffect(() => {
    let currentReports = [...facultyReports];
    if (filterStatus !== 'all') {
      currentReports = currentReports.filter(r => r.status === filterStatus);
    }
    if (searchTerm) {
      const termLower = searchTerm.toLowerCase();
      currentReports = currentReports.filter(r => 
        r.reportContent.toLowerCase().includes(termLower) ||
        r.id.toLowerCase().includes(termLower) ||
        r.submittedByName?.toLowerCase().includes(termLower) ||
        r.submittedByUsn?.toLowerCase().includes(termLower) ||
        r.contextBranch?.toLowerCase().includes(termLower) ||
        r.contextSemester?.toLowerCase().includes(termLower) ||
        r.resolutionNotes?.toLowerCase().includes(termLower)
      );
    }
    setFilteredReports(currentReports);
  }, [facultyReports, filterStatus, searchTerm]);

  const handleDeleteReport = async (reportId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      // Refresh reports
      await fetchReports();
      toast({
        title: "Report Deleted",
        description: `Report ${reportId.substring(0,8)} has been deleted.`,
        duration: 3000
      });
    } catch (error) {
      console.error('Error deleting report:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete report. Please try again.",
        variant: "destructive",
        duration: 3000
      });
    }
  };

  const handleDialogAction = () => {
    if (!selectedReport || !dialogAction) return;
    if (dialogAction === 'delete') {
        handleDeleteReport(selectedReport.id);
    }
    setSelectedReport(null);
    setDialogAction(null);
  };

  const openActionDialog = (report: Report, action: 'delete') => {
    setSelectedReport(report);
    setDialogAction(action);
  };


  if (pageLoading || authLoading) {
    return <div className="container mx-auto p-4 flex justify-center items-center min-h-screen"><SimpleRotatingSpinner className="h-12 w-12 text-primary" /></div>;
  }
  
  if (!user || user.role !== 'faculty') {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Card className="max-w-md mx-auto shadow-lg"><CardHeader><CardTitle className="text-destructive">Access Denied</CardTitle></CardHeader><CardContent><ShieldCheck className="h-16 w-16 text-destructive mx-auto mb-4" /><p>You do not have permission to view this page.</p><Link href="/dashboard"><Button variant="outline" className="mt-6">Go to Dashboard</Button></Link></CardContent></Card>
      </div>
    );
  }

  if (facultyAssignedBranches.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-lg mx-auto shadow-lg"><CardHeader><CardTitle className="text-primary flex items-center"><Info className="mr-2 h-6 w-6" /> No Assigned Branches</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">You are not assigned to any branches. Please contact an administrator to view student reports.</p><Link href="/faculty"><Button variant="outline" className="mt-6">Back to Dashboard</Button></Link></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 relative overflow-hidden">
      {/* Particle background animation */}
      <ParticleBackground />

      <div className="flex justify-between items-center mb-4 relative z-10">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary flex items-center"><ListChecks className="mr-3 h-7 w-7" /> Student Concerns for Your Branches</h1>
        <Button variant="outline" size="icon" onClick={() => router.back()} aria-label="Go back"><ArrowLeft className="h-5 w-5" /></Button>
      </div>
       <p className="text-sm sm:text-base text-muted-foreground mb-8">Review and manage student-submitted concerns relevant to your assigned branches: {facultyAssignedBranches.join(', ')}
       {facultyAssignedSemesters.length > 0 && ` (Semesters: ${facultyAssignedSemesters.join(', ')})`}.
       </p>

      <Card className="shadow-lg mb-8 relative z-10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5"/> Filter Reports</CardTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as ReportStatus | 'all')}>
              <SelectTrigger><SelectValue placeholder="Filter by Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {reportStatuses.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
              </SelectContent>
            </Select>
             <div className="relative">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Search reports..." className="pl-8 w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="shadow-lg relative z-10">
        <CardHeader>
          <CardTitle>Report List</CardTitle>
          <ShadCnCardDescription>
            Total reports matching filters: {filteredReports.length}
          </ShadCnCardDescription>
        </CardHeader>
        <CardContent>
          {filteredReports.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">No reports match the current filters, or no relevant reports submitted yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Submitted At</TableHead>
                        <TableHead>Submitted By</TableHead>
                        <TableHead>USN</TableHead>
                        <TableHead>Context</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="min-w-[300px] w-[40%]">Content</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map(report => (
                    <TableRow key={report.id} className={report.status === 'new' ? 'bg-primary/5 dark:bg-primary/10' : ''}>
                      <TableCell className="font-mono text-xs">{report.id.substring(0,8)}...</TableCell>
                      <TableCell>{format(new Date(report.submittedAt), "PPp")}</TableCell>
                      <TableCell>{report.submittedByName || <span className="italic text-muted-foreground">N/A</span>}</TableCell>
                      <TableCell>{report.submittedByUsn || <span className="italic text-muted-foreground">N/A</span>}</TableCell>
                       <TableCell className="text-xs">
                        {report.contextBranch && <div>Branch: {report.contextBranch}</div>}
                        {report.contextSemester && <div>Sem: {report.contextSemester}</div>}
                        {!report.contextBranch && !report.contextSemester && <span className="text-muted-foreground italic">N/A</span>}
                      </TableCell>
                      <TableCell><Badge variant={report.status === 'new' ? 'default' : report.status === 'resolved' ? 'outline' : report.status === 'archived' ? 'secondary': 'destructive'} className={`capitalize ${report.status === 'new' ? 'bg-accent text-accent-foreground' : report.status === 'viewed' ? 'bg-blue-500 text-white' : ''}`}>{report.status}</Badge></TableCell>
                      <TableCell className="text-xs max-w-md whitespace-pre-wrap break-words">{report.reportContent}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="destructive" size="sm" onClick={() => openActionDialog(report, 'delete')}>
                          <Trash2 className="mr-1 h-3 w-3"/>Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!selectedReport && dialogAction === 'delete'} onOpenChange={() => {setSelectedReport(null); setDialogAction(null);}}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm: Delete Report</AlertDialogTitle>
            <AlertDialogDescription>
              For report ID: {selectedReport?.id.substring(0,8)}...
              Are you sure you want to delete this report? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
                onClick={handleDialogAction}
                className="bg-destructive hover:bg-destructive/90">
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}