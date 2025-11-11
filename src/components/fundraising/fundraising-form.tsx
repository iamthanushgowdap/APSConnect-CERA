"use client";

import React, { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { semesters } from '@/types';
import type { FundraisingCampaign, Semester } from '@/types';
import { User } from '@/components/auth-provider';
import { Loader2, UploadCloud, Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from '@/lib/supabase';
import type { DateRange } from 'react-day-picker';
import { Checkbox } from '@/components/ui/checkbox';

const MAX_QR_SIZE = 1 * 1024 * 1024; // 1MB
const ALLOWED_QR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const fundraisingFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters.").max(100),
  description: z.string().min(20, "Description must be at least 20 characters.").max(1000),
  contactDetails: z.string().min(10, "Contact details are required.").max(200),
  startDate: z.date({ required_error: "Start date is required." }),
  endDate: z.date({ required_error: "End date is required." }),
  targetBranches: z.array(z.string()).min(1, "At least one branch must be selected."),
  targetSemesters: z.array(z.custom<Semester>(val => semesters.includes(val as Semester))).min(1, "At least one semester must be selected."),
  goalAmount: z.union([
    z.number().min(1, "Goal amount must be at least 1.").max(1000000, "Goal amount cannot exceed 10,00,000."),
    z.string().transform((val) => {
      const num = parseInt(val);
      return isNaN(num) || num < 1 ? 1 : num;
    })
  ]),
  qrCode: z.any().refine(files => files instanceof FileList && files.length > 0, "QR code image is required.")
    .refine(files => files?.[0]?.size <= MAX_QR_SIZE, `QR code image must be less than 1MB.`)
    .refine(files => ALLOWED_QR_TYPES.includes(files?.[0]?.type), "Only .jpg, .png, and .webp formats are supported."),
});

type FundraisingFormValues = z.infer<typeof fundraisingFormSchema>;

interface FundraisingFormProps {
  onSubmitSuccess: () => void;
  initialData?: FundraisingCampaign;
  facultyUser: User;
}

export function FundraisingForm({ onSubmitSuccess, initialData, facultyUser }: FundraisingFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [qrPreview, setQrPreview] = useState<string | undefined>(initialData?.qrCodeDataUrl);
  const [formData, setFormData] = useState<Partial<FundraisingFormValues>>({
    title: '',
    description: '',
    contactDetails: '',
    goalAmount: undefined,
    startDate: undefined,
    endDate: undefined,
    targetBranches: [],
    targetSemesters: [],
  });

  const form = useForm<FundraisingFormValues>({
    resolver: zodResolver(fundraisingFormSchema),
    defaultValues: {
      title: '',
      description: '',
      contactDetails: '',
      goalAmount: undefined,
      startDate: undefined,
      endDate: undefined,
      targetBranches: [],
      targetSemesters: [],
      qrCode: undefined,
    },
  });

  useEffect(() => {
    const loadDraft = async () => {
      // First check Supabase
      const { data } = await supabase
        .from('drafts')
        .select('data')
        .eq('user_id', facultyUser.uid)
        .eq('form_id', 'fundraising-campaign')
        .single();
        
      if (data?.data) {
        setFormData(data.data);
        form.reset(data.data); // Reset form with loaded data
        return;
      }
      
      // Fallback to localStorage during transition
      const localDraft = localStorage.getItem('draft-campaign');
      if (localDraft) {
        const draftData = JSON.parse(localDraft);
        setFormData(draftData);
        form.reset(draftData); // Reset form with loaded data
      }
    };
    
    loadDraft();
  }, [facultyUser, form]);

  // Initialize form with initialData for editing
  useEffect(() => {
    if (initialData) {
      console.log('Initializing form with initial data:', initialData);
      const formValues = {
        title: initialData.title,
        description: initialData.description,
        contactDetails: initialData.contactDetails,
        goalAmount: initialData.goalAmount,
        startDate: new Date(initialData.startDate),
        endDate: new Date(initialData.endDate),
        targetBranches: initialData.targetBranches,
        targetSemesters: initialData.targetSemesters,
        qrCode: undefined, // QR code file can't be pre-filled
      };
      form.reset(formValues);
      setQrPreview(initialData.qrCodeDataUrl);
    }
  }, [initialData, form]);

  const handleQrChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue('qrCode', event.target.files);
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: FundraisingFormValues) => {
    if (!facultyUser) {
      console.error('No faculty user found');
      return;
    }

    if (!facultyUser.uid) {
      console.error('Faculty user has no uid:', facultyUser);
      toast({ title: "Authentication Error", description: "User authentication is incomplete. Please try logging in again.", variant: "destructive" });
      return;
    }

    console.log('Starting campaign submission...', { hasInitialData: !!initialData });
    console.log('Form data received:', data);
    console.log('Faculty user:', facultyUser);
    setIsLoading(true);

    try {
      let qrCodeDataUrl = qrPreview;
      if (data.qrCode && data.qrCode.length > 0) {
        console.log('Processing QR code file...');
        const reader = new FileReader();
        reader.readAsDataURL(data.qrCode[0]);
        qrCodeDataUrl = await new Promise((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read QR code file'));
        });
        console.log('QR code processed successfully');
      }

      if (!qrCodeDataUrl) {
        console.log('No QR code found, showing error');
        toast({ title: "QR Code Missing", description: "Please upload a QR code image.", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      // Validate and ensure goal amount is valid
      const goalAmount = Math.max(1, parseInt(String(data.goalAmount)) || 1);
      console.log('Final goal amount to use:', goalAmount);

      const campaignData = {
        title: data.title,
        description: data.description,
        contact_details: data.contactDetails,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
        target_branches: data.targetBranches,
        target_semesters: data.targetSemesters,
        qr_code_image_url: qrCodeDataUrl,
        created_by_uid: facultyUser.uid,
        goalAmount: goalAmount,
        currentAmount: 0,
        status: 'active',
      };

      console.log('Campaign data prepared:', campaignData);

      let insertedData;
      let error;

      if (initialData) {
        console.log('Updating existing campaign:', initialData.id);
        // Update existing campaign
        const { data: updateData, error: updateError } = await supabase
          .from('fundraising_campaigns')
          .update(campaignData)
          .eq('id', initialData.id)
          .eq('created_by_uid', facultyUser.uid) // Ensure user can only update their own campaigns
          .select()
          .single();

        insertedData = updateData;
        error = updateError;
        console.log('Update result:', { data: updateData, error: updateError });
      } else {
        console.log('Creating new campaign');
        // Create new campaign
        const { data: insertData, error: insertError } = await supabase
          .from('fundraising_campaigns')
          .insert([campaignData])
          .select()
          .single();

        insertedData = insertData;
        error = insertError;
        console.log('Insert result:', { data: insertData, error: insertError });
      }

      if (error) {
        console.error('Database error:', error);
        toast({ title: "Error", description: `Failed to ${initialData ? 'update' : 'create'} campaign: ${error.message}`, variant: "destructive" });
        setIsLoading(false);
        return;
      }

      if (!insertedData) {
        console.error('No data returned from database operation');
        toast({ title: "Error", description: "No data returned from database operation", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      console.log('Campaign saved successfully:', insertedData);

      // Create notifications for all students in the target branches/semesters
      try {
        console.log('🔔 Starting notification creation for fundraising campaign:', insertedData.id);
        console.log('🔔 Campaign targets:', { branches: data.targetBranches, semesters: data.targetSemesters });

        // Find all students in the target branches and semesters
        const { data: students, error: studentsError } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('role', 'student')
          .in('branch', data.targetBranches)
          .in('semester', data.targetSemesters);

        console.log('🔔 Students query result:', { students: students?.length, error: studentsError });

        if (studentsError) {
          console.error('❌ Error querying students for fundraising notifications:', studentsError);
          console.error('Error details:', JSON.stringify(studentsError, null, 2));
        } else if (students && students.length > 0) {
          console.log('🔔 Found students for fundraising:', students.map(s => s.id));

          const notifications = students.map(student => ({
            id: `fundraising-${insertedData.id}-${student.id}-${Date.now()}`,
            user_id: student.id,
            type: 'fundraising_campaign',
            title: 'New Fundraising Campaign',
            message: `A new fundraising campaign "${data.title}" has been launched for your branch and semester. Help contribute to this worthy cause!`,
            href: '/student/fundraising',
            created_at: new Date().toISOString(),
            read: false
          }));

          console.log('🔔 Created fundraising notification objects:', notifications.length);

          // Save to Supabase database
          const { error: notifError } = await supabase
            .from('notifications')
            .insert(notifications.map(n => ({
              id: n.id,
              user_id: n.user_id,
              type: n.type,
              title: n.title,
              message: n.message,
              href: n.href,
              created_at: n.created_at,
              read: n.read
            })));

          if (notifError) {
            console.error('❌ Error creating fundraising notifications:', notifError);
            console.error('❌ Notification error details:', JSON.stringify(notifError, null, 2));
          } else {
            console.log(`✅ Created ${notifications.length} fundraising notifications for new campaign`);
          }
        } else {
          console.log('⚠️ No students found for fundraising campaign targets:', {
            branches: data.targetBranches,
            semesters: data.targetSemesters
          });
        }
      } catch (notifError) {
        console.error('❌ Exception in fundraising notification creation:', notifError);
        console.error('❌ Exception details:', notifError instanceof Error ? notifError.stack : String(notifError));
      }

      const processedCampaign: FundraisingCampaign = {
        id: insertedData.id,
        title: data.title,
        description: data.description,
        qrCodeDataUrl,
        contactDetails: data.contactDetails,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
        targetBranches: data.targetBranches,
        targetSemesters: data.targetSemesters,
        createdByUid: facultyUser.uid,
        createdAt: insertedData.created_at,
        goalAmount: goalAmount,
        currentAmount: initialData?.currentAmount || 0, // Keep existing current amount when updating
      };

      console.log('Updating localStorage...');
      // Update localStorage
      const allCampaignsStr = localStorage.getItem("apsconnect_fundraising_campaigns");
      let allCampaigns = allCampaignsStr ? JSON.parse(allCampaignsStr) : [];

      if (initialData) {
        // Replace existing campaign in localStorage
        const existingIndex = allCampaigns.findIndex((c: FundraisingCampaign) => c.id === initialData.id);
        if (existingIndex !== -1) {
          allCampaigns[existingIndex] = processedCampaign;
          console.log('Replaced campaign in localStorage at index:', existingIndex);
        } else {
          allCampaigns.push(processedCampaign);
          console.log('Added campaign to localStorage (not found for replacement)');
        }
      } else {
        // Add new campaign to localStorage
        allCampaigns.push(processedCampaign);
        console.log('Added new campaign to localStorage');
      }

      localStorage.setItem("apsconnect_fundraising_campaigns", JSON.stringify(allCampaigns));

      console.log('Showing success toast and calling onSubmitSuccess');
      toast({ title: initialData ? "Campaign Updated" : "Campaign Created", description: `"${processedCampaign.title}" has been ${initialData ? 'updated' : 'created'}.` });
      onSubmitSuccess();
      setIsLoading(false);
      console.log('Form submission completed successfully');

    } catch (unexpectedError) {
      console.error('Unexpected error during form submission:', unexpectedError);
      toast({ title: "Unexpected Error", description: "An unexpected error occurred. Please try again.", variant: "destructive" });
      setIsLoading(false);
    }
  };

  const saveDraft = async () => {
    await supabase.from('drafts').upsert({
      user_id: facultyUser.uid,
      form_id: 'fundraising-campaign',
      data: form.getValues(),
      updated_at: new Date().toISOString()
    });
    
    // Remove localStorage usage
    localStorage.removeItem('draft-campaign');
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem><FormLabel>Campaign Title</FormLabel><FormControl><Input placeholder="e.g., Annual Charity Drive" {...field} disabled={isLoading} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Describe the purpose of the fundraiser." {...field} disabled={isLoading} rows={4} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="contactDetails" render={({ field }) => (
            <FormItem><FormLabel>Contact Details</FormLabel><FormControl><Input placeholder="e.g., Prof. John Doe - 9876543210" {...field} disabled={isLoading} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="goalAmount" render={({ field }) => (
          <FormItem><FormLabel>Goal Amount (₹)</FormLabel><FormControl><Input type="number" min="1" placeholder="e.g., 5000" {...field} value={field.value || ''} onChange={(e) => {
            const value = parseInt(e.target.value);
            field.onChange(isNaN(value) || value < 1 ? '' : value);
          }} disabled={isLoading} /></FormControl><FormDescription>Enter the target amount you want to raise for this campaign.</FormDescription><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="startDate" render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Start Date</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                    {field.value ? format(field.value, "PPP") : <span>Pick a start date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date()} initialFocus />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="endDate" render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>End Date</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                    {field.value ? format(field.value, "PPP") : <span>Pick an end date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date()} initialFocus />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="targetBranches" render={() => (
            <FormItem>
              <FormLabel>Target Branches</FormLabel>
              <FormDescription>Select the branches this campaign is for.</FormDescription>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2 border rounded-md">
                {(facultyUser.assignedBranches || []).map((branch) => (
                  <FormField key={branch} control={form.control} name="targetBranches" render={({ field }) => (
                    <FormItem className="flex items-center space-x-2"><FormControl><Checkbox checked={field.value?.includes(branch)} onCheckedChange={(checked) => {
                        return checked ? field.onChange([...(field.value || []), branch]) : field.onChange((field.value || []).filter(v => v !== branch));
                    }} /></FormControl><FormLabel className="font-normal">{branch}</FormLabel></FormItem>
                  )} />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField control={form.control} name="targetSemesters" render={() => (
            <FormItem>
              <FormLabel>Target Semesters</FormLabel>
              <FormDescription>Select the semesters this campaign is for.</FormDescription>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2 border rounded-md">
                {(facultyUser.assignedSemesters || []).map((semester) => (
                  <FormField key={semester} control={form.control} name="targetSemesters" render={({ field }) => (
                    <FormItem className="flex items-center space-x-2"><FormControl><Checkbox checked={field.value?.includes(semester)} onCheckedChange={(checked) => {
                        return checked ? field.onChange([...(field.value || []), semester]) : field.onChange((field.value || []).filter(v => v !== semester));
                    }} /></FormControl><FormLabel className="font-normal">{semester}</FormLabel></FormItem>
                  )} />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField control={form.control} name="qrCode" render={({ field }) => (
          <FormItem><FormLabel>Payment QR Code</FormLabel>
            <FormControl>
                <div className="flex items-center gap-4">
                    {qrPreview && <img src={qrPreview} alt="QR Code Preview" className="h-24 w-24 border rounded-md" />}
                    <div className="flex-1"><Input type="file" onChange={handleQrChange} accept={ALLOWED_QR_TYPES.join(',')} disabled={isLoading} /></div>
                </div>
            </FormControl>
            <FormDescription>Upload a PNG or JPG image of the QR code for payment (Max 1MB).</FormDescription>
            <FormMessage />
          </FormItem>
        )} />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {initialData ? 'Update Campaign' : 'Create Campaign'}
        </Button>
        <Button type="button" onClick={saveDraft}>
          Save Draft
        </Button>
      </form>
    </Form>
  );
}
