
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useRouter, useParams } from 'next/navigation';
import type { FundraisingCampaign, StudentFundraisingStatus, UserProfile } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Users, Percent, Search, RefreshCw } from 'lucide-react';
import { SimpleRotatingSpinner } from '@/components/ui/loading-spinners';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';

interface StudentStatus extends StudentFundraisingStatus {
    studentName: string;
    studentUsn: string;
    branch: string;
    semester: string;
}

export default function FundraisingStatusPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const campaignId = params?.campaignId as string;

  const [campaign, setCampaign] = useState<FundraisingCampaign | null>(null);
  const [studentStatuses, setStudentStatuses] = useState<StudentStatus[]>([]);
  const [filteredStatuses, setFilteredStatuses] = useState<StudentStatus[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCampaignData = useCallback(async () => {
    if (!user || !campaignId) return;

    try {
      // Fetch campaign details from Supabase
      const { data: campaignData, error: campaignError } = await supabase
        .from('fundraising_campaigns')
        .select('*')
        .eq('id', campaignId)
        .eq('created_by_uid', user.uid)
        .single();

      if (campaignError || !campaignData) {
        console.error('Error fetching campaign:', campaignError);
        router.push('/faculty/fundraising');
        return;
      }

      const campaign: FundraisingCampaign = {
        id: campaignData.id,
        title: campaignData.title,
        description: campaignData.description,
        qrCodeDataUrl: campaignData.qr_code_image_url,
        contactDetails: campaignData.contact_details,
        startDate: campaignData.start_date,
        endDate: campaignData.end_date,
        targetBranches: campaignData.target_branches,
        targetSemesters: campaignData.target_semesters,
        createdByUid: campaignData.created_by_uid,
        createdAt: campaignData.created_at,
        goalAmount: campaignData.goalAmount,
        currentAmount: campaignData.currentAmount,
      };

      console.log('✅ Campaign fetched successfully:', {
        id: campaign.id,
        title: campaign.title,
        createdByUid: campaign.createdByUid,
        currentUserUid: user.uid,
        uidsMatch: campaign.createdByUid === user.uid
      });

      setCampaign(campaign);

      // Fetch student statuses from Supabase
      console.log('🔍 About to fetch student statuses for campaign:', campaignId);
      console.log('👤 Current faculty user UID:', user.uid);

      const { data: statusData, error: statusError } = await supabase
        .from('student_fundraising_status')
        .select('*')
        .eq('campaign_id', campaignId);

      if (statusError) {
        console.error('❌ Error fetching statuses:', statusError);
        return;
      }

      console.log('✅ Query completed - Fetched status data:', statusData);
      console.log('📊 Status data length:', statusData?.length || 0);

      // Get unique student UIDs from statuses
      const studentUids = [...new Set((statusData || []).map(s => s.student_uid))];

      // Fetch student profiles
      const { data: studentProfiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')  // Get all fields to see what's available
        .in('id', studentUids);

      // Create a map of student profiles for easy lookup
      const profileMap = new Map();
      (studentProfiles || []).forEach(profile => {
        profileMap.set(profile.id, profile);
      });

      // Enrich statuses with student information
      const enrichedStatuses: StudentStatus[] = (statusData || []).map(status => {
        const profile = profileMap.get(status.student_uid);
        return {
          campaignId: status.campaign_id,
          studentUid: status.student_uid,
          studentName: profile?.full_name || 'Unknown',
          studentUsn: profile?.student_id || 'N/A',
          branch: profile?.branch || 'N/A',
          semester: profile?.semester || 'N/A',
          status: status.status,
          remarks: status.remarks,
          updatedAt: status.updated_at,
        };
      }).sort((a, b) => a.studentUsn.localeCompare(b.studentUsn));

      setStudentStatuses(enrichedStatuses);
      setLastUpdated(new Date()); // Update timestamp when data is refreshed

    } catch (error) {
      console.error('Error in fetchCampaignData:', error);
      router.push('/faculty/fundraising');
    }
  }, [campaignId, user, router]);

  const handleStatusUpdate = useCallback(() => {
    fetchCampaignData();
  }, [fetchCampaignData]);

  useEffect(() => {
    if (!authLoading && user && user.role === 'faculty' && campaignId) {
      fetchCampaignData();

      // Set up real-time subscription for student status updates
      const statusChannel = supabase
        .channel(`fundraising_status_${campaignId}`)
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'student_fundraising_status',
            filter: `campaign_id=eq.${campaignId}`,
          },
          (payload) => {
            // Real-time status update received
            handleStatusUpdate();
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            // Successfully subscribed to fundraising status updates
          }
        });

      setPageLoading(false);

      // Cleanup subscription on unmount
      return () => {
        supabase.removeChannel(statusChannel);
      };
    }
  }, [authLoading, user, campaignId, handleStatusUpdate]);

  useEffect(() => {
      if(!searchTerm) {
          setFilteredStatuses(studentStatuses);
          return;
      }
      const lowerTerm = searchTerm.toLowerCase();
      setFilteredStatuses(studentStatuses.filter(s => 
        s.studentName.toLowerCase().includes(lowerTerm) ||
        s.studentUsn.toLowerCase().includes(lowerTerm) ||
        s.branch.toLowerCase().includes(lowerTerm) ||
        s.semester.toLowerCase().includes(lowerTerm) ||
        s.remarks?.toLowerCase().includes(lowerTerm)
      ));

  }, [searchTerm, studentStatuses]);

  const stats = useMemo(() => {
      const totalStudents = studentStatuses.length;
      if (totalStudents === 0) return { paid: 0, notPaid: 0, pending: 0, paidPercentage: 0 };

      const paid = studentStatuses.filter(s => s.status === 'paid').length;
      const notPaid = studentStatuses.filter(s => s.status === 'not_paid').length;
      const pending = totalStudents - paid - notPaid;
      const paidPercentage = Math.round((paid / totalStudents) * 100);
      return { paid, notPaid, pending, paidPercentage };

  }, [studentStatuses]);

  if (pageLoading || authLoading) {
    return <div className="container mx-auto p-4 flex justify-center items-center min-h-screen"><SimpleRotatingSpinner className="h-12 w-12 text-primary" /></div>;
  }

  if (!campaign) {
    return <div className="container mx-auto p-4 text-center">Campaign not found or you do not have permission to view it.</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">{campaign.title}</h1>
          <CardDescription>Contribution Status</CardDescription>
          <p className="text-xs text-muted-foreground mt-1">
            Last updated: {lastUpdated.toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchCampaignData()} 
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="icon" onClick={() => router.back()} aria-label="Go back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader><CardTitle className="flex items-center gap-2"><Percent /> Campaign Progress</CardTitle></CardHeader>
        <CardContent className="space-y-4">
            <div>
                <div className="flex justify-between items-center mb-1">
                    <p className="font-medium">Paid Contributions</p>
                    <p className="text-lg font-bold">{stats.paidPercentage}%</p>
                </div>
                <Progress value={stats.paidPercentage} />
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
                <div><p className="text-2xl font-bold">{stats.paid}</p><p className="text-sm text-muted-foreground">Paid</p></div>
                <div><p className="text-2xl font-bold">{stats.notPaid}</p><p className="text-sm text-muted-foreground">Not Paid</p></div>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users /> Student Statuses</CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search students or remarks..." className="pl-8 w-full sm:w-1/2 lg:w-1/3" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>USN</TableHead><TableHead>Name</TableHead><TableHead>Branch</TableHead><TableHead>Semester</TableHead><TableHead>Status</TableHead><TableHead>Remarks</TableHead></TableRow></TableHeader>
            <TableBody>
              {filteredStatuses.length > 0 ? filteredStatuses.map(s => (
                <TableRow key={s.studentUid}>
                  <TableCell>{s.studentUsn}</TableCell>
                  <TableCell>{s.studentName}</TableCell>
                  <TableCell>{s.branch}</TableCell>
                  <TableCell>{s.semester}</TableCell>
                  <TableCell><Badge variant={s.status === 'paid' ? 'default' : s.status === 'not_paid' ? 'destructive' : 'secondary'} className={`capitalize ${s.status==='paid' ? 'bg-green-500' : ''}`}>{s.status.replace('_', ' ')}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{s.remarks || '-'}</TableCell>
                </TableRow>
              )) : <TableRow><TableCell colSpan={6} className="h-24 text-center">No students have updated their status for this campaign yet.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
