
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth, User } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { FundraisingForm } from '@/components/fundraising/fundraising-form';
import type { FundraisingCampaign, UserProfile, Branch } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription as ShadCnCardDescription, CardFooter } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ShieldCheck, HandCoins, PlusCircle, Edit, Trash2, Users, ArrowLeft, Eye } from 'lucide-react';
import { SimpleRotatingSpinner } from '@/components/ui/loading-spinners';
import { useToast } from '@/hooks/use-toast';
import { format, isBefore } from 'date-fns';
import { supabase } from '@/lib/supabase';

export default function FacultyFundraisingPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [myCampaigns, setMyCampaigns] = useState<FundraisingCampaign[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<FundraisingCampaign | null>(null);
  const [campaignToDelete, setCampaignToDelete] = useState<FundraisingCampaign | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    if (!user) return;

    console.log('Faculty page: Fetching campaigns for user:', user);
    console.log('Faculty page: User UID:', user.uid);

    const { data, error } = await supabase
      .from('fundraising_campaigns')
      .select('*')
      .eq('created_by_uid', user.uid);

    if (error) {
      console.error('Error fetching campaigns:', error);
      return;
    }

    console.log('Faculty page: Fetched campaigns data:', data);
    console.log('Faculty page: Number of campaigns:', data?.length || 0);

    // Log the first campaign to see its structure
    if (data && data.length > 0) {
      console.log('Faculty page: First campaign data:', data[0]);
    }

    const campaigns: FundraisingCampaign[] = (data || []).map(campaignData => ({
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
    }));

    console.log('Faculty page: Processed campaigns:', campaigns);
    setMyCampaigns(campaigns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'faculty') {
        router.push(user ? '/dashboard' : '/login');
      } else {
        fetchCampaigns();
        setPageLoading(false);
      }
    }
  }, [user, authLoading, router, fetchCampaigns]);

  const handleFormSubmitSuccess = () => {
    console.log('Faculty page: handleFormSubmitSuccess called, calling fetchCampaigns');
    // Clear any cached data and force fresh fetch
    setMyCampaigns([]);
    fetchCampaigns();
    setIsFormOpen(false);
    setEditingCampaign(null);
  };

  const openCreateDialog = () => {
    setEditingCampaign(null);
    setIsFormOpen(true);
  };
  
  const openEditDialog = (campaign: FundraisingCampaign) => {
    setEditingCampaign(campaign);
    setIsFormOpen(true);
  };
  
  const confirmDelete = (campaign: FundraisingCampaign) => {
    setCampaignToDelete(campaign);
  };

  const handleDelete = async () => {
    if (!campaignToDelete) return;
    setIsDeleting(true);

    // Delete from Supabase
    const { error: deleteError } = await supabase
      .from('fundraising_campaigns')
      .delete()
      .eq('id', campaignToDelete.id);

    if (deleteError) {
      console.error('Error deleting campaign:', deleteError);
      toast({ title: "Error", description: `Failed to delete campaign: ${deleteError.message}`, variant: "destructive" });
      setIsDeleting(false);
      return;
    }

    // Also delete related student statuses
    const { error: statusError } = await supabase
      .from('student_fundraising_status')
      .delete()
      .eq('campaign_id', campaignToDelete.id);

    if (statusError) {
      console.error('Error deleting statuses:', statusError);
      // Don't fail the whole operation for this
    }

    fetchCampaigns();
    toast({ title: "Campaign Deleted", description: `"${campaignToDelete.title}" and all related student data have been deleted.` });
    setCampaignToDelete(null);
    setIsDeleting(false);
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
  
  if (!user || user.role !== 'faculty') {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Card className="max-w-md mx-auto shadow-lg"><CardHeader><CardTitle className="text-destructive">Access Denied</CardTitle></CardHeader><CardContent><ShieldCheck className="h-16 w-16 text-destructive mx-auto mb-4" /><p>You do not have permission to view this page.</p><Link href="/dashboard"><Button variant="outline" className="mt-6">Go to Dashboard</Button></Link></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary flex items-center">
          <HandCoins className="mr-3 h-7 w-7" /> Fundraising Management
        </h1>
        <div className="flex items-center gap-2">
          <Button onClick={openCreateDialog}><PlusCircle className="mr-2 h-4 w-4" /> New Campaign</Button>
          <Button variant="outline" size="icon" onClick={() => router.back()} aria-label="Go back"><ArrowLeft className="h-5 w-5" /></Button>
        </div>
      </div>
      
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                <CardHeader className="border-b"><CardTitle>{editingCampaign ? "Edit Campaign" : "Create New Campaign"}</CardTitle></CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-6">
                    <FundraisingForm onSubmitSuccess={handleFormSubmitSuccess} initialData={editingCampaign || undefined} facultyUser={user} />
                </CardContent>
                <div className="border-t p-4 flex justify-end sticky bottom-0 bg-background">
                    <Button variant="outline" onClick={() => { setIsFormOpen(false); setEditingCampaign(null); }}>Cancel</Button>
                </div>
            </Card>
        </div>
      )}

      {myCampaigns.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            <p>You haven't created any fundraising campaigns yet.</p>
            <Button className="mt-4" onClick={openCreateDialog}>Create Your First Campaign</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {myCampaigns.map(campaign => {
            const status = getCampaignStatus(campaign);
            return (
              <Card key={campaign.id} className="shadow-lg flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle>{campaign.title}</CardTitle>
                    <Badge variant={status === 'active' ? 'default' : status === 'upcoming' ? 'secondary' : 'destructive'} className="capitalize">{status}</Badge>
                  </div>
                  <ShadCnCardDescription>{campaign.description}</ShadCnCardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-3">
                  <div className="text-sm"><span className='font-semibold'>Duration:</span> {format(new Date(campaign.startDate), 'PP')} - {format(new Date(campaign.endDate), 'PP')}</div>
                  <div className="text-sm"><span className='font-semibold'>For Branches:</span> {campaign.targetBranches.join(', ')}</div>
                  <div className="text-sm"><span className='font-semibold'>Goal:</span> ₹{campaign.goalAmount.toLocaleString()}</div>
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-4">
                  <span className="text-xs text-muted-foreground">Created: {format(new Date(campaign.createdAt), "PP")}</span>
                  <div className="space-x-2">
                      <Button variant="outline" size="sm" onClick={() => router.push(`/faculty/fundraising/${campaign.id}`)}><Eye className="mr-1 h-3 w-3" />View Status</Button>
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(campaign)}><Edit className="mr-1 h-3 w-3" />Edit</Button>
                      <Button variant="destructive" size="sm" onClick={() => confirmDelete(campaign)} disabled={isDeleting}><Trash2 className="mr-1 h-3 w-3" />Delete</Button>
                  </div>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
      
      <AlertDialog open={!!campaignToDelete} onOpenChange={() => setCampaignToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Confirm Deletion</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete the campaign "{campaignToDelete?.title}"? This action cannot be undone and will remove all student contribution statuses.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">Confirm Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
