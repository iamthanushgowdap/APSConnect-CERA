"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, User } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import type { FundraisingCampaign, StudentFundraisingStatus, Branch } from '@/types';
import { supabase } from '@/lib/supabase';
import { STUDENT_FUNDRAISING_STATUS_STORAGE_KEY } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription as ShadCnCardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { ShieldCheck, HandCoins, Info, AlertTriangle, ArrowLeft, QrCode } from 'lucide-react';
import { SimpleRotatingSpinner } from '@/components/ui/loading-spinners';
import { useToast } from '@/hooks/use-toast';
import { format, isBefore, isAfter } from 'date-fns';
import ParticleBackground from "@/components/ui/particle-background";

export default function StudentFundraisingPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [campaigns, setCampaigns] = useState<FundraisingCampaign[]>([]);
  const [studentStatuses, setStudentStatuses] = useState<Record<string, StudentFundraisingStatus>>({});
  const [pageLoading, setPageLoading] = useState(true);
  
  const [selectedCampaign, setSelectedCampaign] = useState<FundraisingCampaign | null>(null);
  const [currentStatus, setCurrentStatus] = useState<'paid' | 'not_paid' | 'pending'>('pending');
  const [currentRemarks, setCurrentRemarks] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchCampaignsAndStatus = useCallback(async () => {
    if (!user || !user.branch || !user.semester) return;
    
    // Fetch campaigns from Supabase
    const { data: campaignsData, error: campaignsError } = await supabase
      .from('fundraising_campaigns')
      .select('*')
      .contains('target_branches', [user.branch])
      .contains('target_semesters', [user.semester]);

    if (campaignsError) {
      console.error('Error fetching campaigns:', campaignsError);
      return;
    }

    const relevantCampaigns: FundraisingCampaign[] = (campaignsData || []).map((c: any) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      qrCodeDataUrl: c.qr_code_image_url,
      contactDetails: c.contact_details,
      startDate: c.startDate,
      endDate: c.endDate,
      targetBranches: c.target_branches,
      targetSemesters: c.target_semesters,
      createdByUid: c.created_by_uid,
      createdAt: c.created_at,
      goalAmount: c.goalAmount,
      currentAmount: c.currentAmount,
    }));

    setCampaigns(relevantCampaigns.sort((a,b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime()));

    // Fetch student statuses from Supabase
    const { data: statusData, error: statusError } = await supabase
      .from('student_fundraising_status')
      .select('*')
      .eq('student_uid', user.uid);

    if (statusError) {
      console.error('Error fetching statuses:', statusError);
      return;
    }

    const statusesMap = (statusData || []).reduce((acc, status) => {
      acc[status.campaign_id] = {
        campaignId: status.campaign_id,
        studentUid: status.student_uid,
        status: status.status,
        remarks: status.remarks,
        updatedAt: status.updated_at,
      };
      return acc;
    }, {} as Record<string, StudentFundraisingStatus>);
    setStudentStatuses(statusesMap);

  }, [user]);

  useEffect(() => {
    const loadData = async () => {
      if (!authLoading) {
        if (!user || (user.role !== 'student' && user.role !== 'pending')) {
          router.push(user ? '/dashboard' : '/login');
        } else if (user.role === 'pending' && user.rejectionReason) {
          router.push('/student');
        } else {
          await fetchCampaignsAndStatus();
          setPageLoading(false);
        }
      }
    };

    loadData();
  }, [user, authLoading, router, fetchCampaignsAndStatus]);

  const openStatusModal = (campaign: FundraisingCampaign) => {
    setSelectedCampaign(campaign);
    const myStatus = studentStatuses[campaign.id];
    setCurrentStatus(myStatus?.status || 'pending');
    setCurrentRemarks(myStatus?.remarks || '');
  };

  const handleStatusUpdate = async () => {
    if (!selectedCampaign || !user) return;
    setIsSaving(true);

    const statusData = {
      campaign_id: selectedCampaign.id,
      student_uid: user.uid,
      status: currentStatus,
      remarks: currentRemarks,
    };

    // First check if a record already exists
    const { data: existingRecord } = await supabase
      .from('student_fundraising_status')
      .select('id')
      .eq('campaign_id', selectedCampaign.id)
      .eq('student_uid', user.uid)
      .single();

    let error;

    if (existingRecord) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('student_fundraising_status')
        .update({
          status: currentStatus,
          remarks: currentRemarks,
          updated_at: new Date().toISOString()
        })
        .eq('campaign_id', selectedCampaign.id)
        .eq('student_uid', user.uid);

      error = updateError;
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from('student_fundraising_status')
        .insert([statusData]);

      error = insertError;
    }

    if (error) {
      console.error('Error updating status:', error);
      toast({ title: "Error", description: `Failed to update status: ${error.message}`, variant: "destructive" });
      setIsSaving(false);
      return;
    }

    // Update state
    const newStatus: StudentFundraisingStatus = {
      campaignId: selectedCampaign.id,
      studentUid: user.uid,
      status: currentStatus,
      remarks: currentRemarks,
      updatedAt: new Date().toISOString(),
    };
    setStudentStatuses(prev => ({ ...prev, [selectedCampaign.id]: newStatus }));

    toast({ title: "Status Updated", description: `Your payment status for "${selectedCampaign.title}" has been updated.` });
    setIsSaving(false);
    setSelectedCampaign(null);
  };
  
  const getCampaignStatus = (campaign: FundraisingCampaign): 'active' | 'upcoming' | 'ended' => {
      const now = new Date();
      if(isBefore(now, new Date(campaign.startDate))) return 'upcoming';
      if(isBefore(now, new Date(campaign.endDate))) return 'active';
      return 'ended';
  }

  if (pageLoading || authLoading) {
    return <div className="container mx-auto p-4 flex justify-center items-center min-h-screen"><SimpleRotatingSpinner className="h-12 w-12 text-primary" /></div>;
  }
  
  if (!user || (user.role !== 'student' && user.role !== 'pending')) {
    return <div className="container mx-auto px-4 py-8 text-center"><Card className="max-w-md mx-auto shadow-lg"><CardHeader><CardTitle className="text-destructive">Access Denied</CardTitle></CardHeader><CardContent><ShieldCheck className="h-16 w-16 text-destructive mx-auto mb-4" /><p>You do not have permission to view this page.</p><Link href="/dashboard"><Button variant="outline" className="mt-6">Go to Dashboard</Button></Link></CardContent></Card></div>;
  }

  if (user.role === 'pending' && user.rejectionReason) {
    return (
        <div className="container mx-auto px-4 py-8 text-center">
            <Card className="max-w-md mx-auto shadow-lg border-yellow-400">
                <CardHeader><CardTitle className="text-yellow-600 flex items-center justify-center"><AlertTriangle className="mr-2 h-6 w-6" />Account Rejected</CardTitle></CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Your account registration was rejected. You cannot access this feature.</p>
                    <Link href="/student"><Button variant="outline" className="mt-6">Back to Dashboard</Button></Link>
                </CardContent>
            </Card>
        </div>
    );
  }

  if (user.role === 'pending' && !user.rejectionReason) {
    return (
        <div className="container mx-auto px-4 py-8 text-center">
            <Card className="max-w-md mx-auto shadow-lg border-yellow-400">
                <CardHeader><CardTitle className="text-yellow-600 flex items-center justify-center"><AlertTriangle className="mr-2 h-6 w-6" />Account Pending</CardTitle></CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Your account is pending approval. Fundraising campaigns will be available once approved.</p>
                    <Link href="/student"><Button variant="outline" className="mt-6">Back to Dashboard</Button></Link>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 relative overflow-hidden">
      {/* Particle background animation */}
      <ParticleBackground />

      <div className="flex justify-between items-center mb-8 relative z-10">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary flex items-center"><HandCoins className="mr-3 h-7 w-7" /> Fundraising Campaigns</h1>
        <Button variant="outline" size="icon" onClick={() => router.back()} aria-label="Go back"><ArrowLeft className="h-5 w-5" /></Button>
      </div>
      
      {campaigns.length === 0 ? (
        <Card className="relative z-10">
          <CardContent className="p-10 text-center text-muted-foreground">
            <Info className="mx-auto h-12 w-12 mb-4" />
            <p>There are no active fundraising campaigns for your branch right now.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {campaigns.map(campaign => {
            const status = getCampaignStatus(campaign);
            const myStatus = studentStatuses[campaign.id]?.status || 'pending';
            return (
              <Card key={campaign.id} className="shadow-lg flex flex-col relative z-10">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle>{campaign.title}</CardTitle>
                    <Badge variant={status === 'active' ? 'default' : status === 'upcoming' ? 'secondary' : 'destructive'} className="capitalize">{status}</Badge>
                  </div>
                  <ShadCnCardDescription>{campaign.description}</ShadCnCardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-3">
                  <div className="text-sm"><span className='font-semibold'>Duration:</span> {format(new Date(campaign.startDate), 'PP')} - {format(new Date(campaign.endDate), 'PP')}</div>
                  <div className="text-sm"><span className='font-semibold'>Contact:</span> {campaign.contactDetails}</div>
                  <div className="text-sm"><span className='font-semibold'>Goal:</span> ₹{campaign.goalAmount.toLocaleString()}</div>
                   <div className="text-sm"><span className='font-semibold'>Your Status:</span> 
                     <Badge variant={myStatus === 'paid' ? 'default' : 'outline'} className={`ml-2 capitalize ${myStatus==='paid' ? 'bg-green-500 hover:bg-green-600' : ''}`}>{myStatus.replace('_', ' ')}</Badge>
                   </div>
                </CardContent>
                <CardFooter className="flex justify-end border-t pt-4 gap-2">
                    <Dialog><DialogTrigger asChild><Button variant="secondary"><QrCode className="mr-2 h-4 w-4" />View QR Code</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Payment QR Code</DialogTitle><DialogDescription>Scan the code below to make your contribution for "{campaign.title}".</DialogDescription></DialogHeader><img src={campaign.qrCodeDataUrl} alt="QR Code" className="rounded-lg mx-auto" /></DialogContent></Dialog>
                    <Button onClick={() => openStatusModal(campaign)} disabled={status === 'ended'}>Update My Status</Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {selectedCampaign && (
        <Dialog open={!!selectedCampaign} onOpenChange={(open) => !open && setSelectedCampaign(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Contribution Status</DialogTitle>
              <DialogDescription>For campaign: "{selectedCampaign.title}"</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label>My Payment Status</Label>
                <RadioGroup value={currentStatus} onValueChange={(value: 'paid' | 'not_paid' | 'pending') => setCurrentStatus(value)}>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="paid" id="paid" /><Label htmlFor="paid">Paid</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="not_paid" id="not_paid" /><Label htmlFor="not_paid">Not Paid</Label></div>
                </RadioGroup>
              </div>
              <div className="space-y-2">
                  <Label htmlFor="remarks">Remarks (Optional)</Label>
                  <Textarea id="remarks" value={currentRemarks} onChange={e => setCurrentRemarks(e.target.value)} placeholder="e.g., Paid via cash to coordinator." />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={handleStatusUpdate} disabled={isSaving}>{isSaving ? <SimpleRotatingSpinner /> : "Save Status"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}
