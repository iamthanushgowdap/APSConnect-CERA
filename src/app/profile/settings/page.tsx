"use client";

import React, { useEffect, useState, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import * as z from 'zod';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth, User } from '@/components/auth-provider';
import type { UserProfile, EducationEntry, ExperienceEntry, ProjectEntry, SkillEntry, CertificationEntry, AchievementEntry, Semester } from '@/types'; 
import { Loader2, ShieldCheck, Camera, Trash2, ArrowLeft, Bell, PlusCircle, FileDown, Shield, KeyRound, Mail, Briefcase } from 'lucide-react'; 
import Link from 'next/link';
import { SimpleRotatingSpinner } from '@/components/ui/loading-spinners';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/components/content/post-item-utils';
import { getUserProfile, updateUserProfile, testDatabaseConnection } from '@/lib/supabase-utils';
import { generateRandomId } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// --- Form Schemas ---

const profileSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters.").optional().or(z.literal('')),
  summary: z.string().max(1000, "Summary too long.").optional().or(z.literal('')),
  phoneNumber: z.string().max(20, "Phone number too long.").optional().or(z.literal('')),
  address: z.string().max(200, "Address too long.").optional().or(z.literal('')),
  linkedinUrl: z.string().url("Invalid LinkedIn URL.").optional().or(z.literal('')),
  githubUrl: z.string().url("Invalid GitHub URL.").optional().or(z.literal('')),
  portfolioUrl: z.string().url("Invalid Portfolio URL.").optional().or(z.literal('')),
  pronouns: z.string().max(50, "Pronouns cannot exceed 50 characters.").optional().or(z.literal('')),
  // Alumni Fields
  placementCompany: z.string().max(100, "Company name too long.").optional().or(z.literal('')),
  placementJobTitle: z.string().max(100, "Job title too long.").optional().or(z.literal('')),
  referralInfo: z.string().max(1000, "Referral information too long.").optional().or(z.literal('')),
  // Resume Sections
  education: z.array(z.object({ id: z.string(), degree: z.string().min(1, "Degree is required.").min(1, "Degree is required."), institution: z.string().min(1, "Institution is required."), graduationYear: z.string().min(4, "Year is required.").max(4), score: z.string().min(1, "Score/GPA is required."), scoreType: z.enum(['score', 'cgpa']).default('score'), })).optional(),
  experience: z.array(z.object({ id: z.string(), title: z.string().min(1, "Job title is required."), company: z.string().min(1, "Company name is required."), duration: z.string().min(1, "Duration is required."), description: z.string().min(1, "Description is required."), })).optional(),
  projects: z.array(z.object({ id: z.string(), title: z.string().min(1, "Project title is required."), description: z.string().min(1, "Description is required."), link: z.string().url("Invalid link.").optional().or(z.literal('')), })).optional(),
  skills: z.array(z.object({ id: z.string(), name: z.string().min(1, "Skill name is required.") })).optional(),
  certifications: z.array(z.object({ id: z.string(), name: z.string().min(1, "Certification name is required."), issuingBody: z.string().min(1, "Issuing body is required."), year: z.string().min(4, "Year is required.").max(4), })).optional(),
  achievements: z.array(z.object({ id: z.string(), description: z.string().min(1, "Achievement is required.") })).optional(),
});

const passwordSchema = z.object({
    oldPassword: z.string().min(1, "Current password is required."),
    newPassword: z.string().min(6, "New password must be at least 6 characters."),
    confirmNewPassword: z.string(),
}).refine(data => data.newPassword === data.confirmNewPassword, {
    message: "New passwords don't match",
    path: ["confirmNewPassword"],
});

const emailSchema = z.object({
    newEmail: z.string().email("Invalid email address."),
    confirmNewEmail: z.string().email("Invalid email address."),
}).refine(data => data.newEmail === data.confirmNewEmail, {
    message: "Email addresses don't match",
    path: ["confirmNewEmail"],
});


type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;
type EmailFormValues = z.infer<typeof emailSchema>;


const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user: authUser, isLoading: authLoading, updateUserContext } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(undefined);

  const goToDashboard = () => {
    if (!authUser) return;

    // Navigate to role-specific dashboard
    switch (authUser.role) {
      case 'admin':
        router.push('/admin');
        break;
      case 'faculty':
        router.push('/faculty');
        break;
      case 'alumni':
        router.push('/alumni');
        break;
      case 'student':
      default:
        router.push('/student');
        break;
    }
  };

  const profileForm = useForm<ProfileFormValues>({ resolver: zodResolver(profileSchema), defaultValues: { displayName: "", summary: "", phoneNumber: "", address: "", linkedinUrl: "", githubUrl: "", portfolioUrl: "", pronouns: "", education: [], experience: [], projects: [], skills: [], certifications: [], achievements: [], placementCompany: "", placementJobTitle: "", referralInfo: "" } });
  const passwordForm = useForm<PasswordFormValues>({ resolver: zodResolver(passwordSchema), defaultValues: { oldPassword: "", newPassword: "", confirmNewPassword: "" }});
  const emailForm = useForm<EmailFormValues>({ resolver: zodResolver(emailSchema), defaultValues: { newEmail: "", confirmNewEmail: "" }});

  // Field arrays for resume sections
  const { fields: educationFields, append: appendEducation, remove: removeEducation } = useFieldArray({ control: profileForm.control, name: "education" });
  const { fields: experienceFields, append: appendExperience, remove: removeExperience } = useFieldArray({ control: profileForm.control, name: "experience" });
  const { fields: projectFields, append: appendProject, remove: removeProject } = useFieldArray({ control: profileForm.control, name: "projects" });
  const { fields: skillFields, append: appendSkill, remove: removeSkill } = useFieldArray({ control: profileForm.control, name: "skills" });
  const { fields: certificationFields, append: appendCertification, remove: removeCertification } = useFieldArray({ control: profileForm.control, name: "certifications" });
  const { fields: achievementFields, append: appendAchievement, remove: removeAchievement } = useFieldArray({ control: profileForm.control, name: "achievements" });


  useEffect(() => {
    if (!authLoading) {
      if (!authUser) {
        router.push('/login');
      } else {
        // Check if user has a valid session before fetching profile
        const checkSessionAndLoadProfile = async () => {
          try {
            const { data: session, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError || !session.session) {
              console.error('No valid session found:', sessionError);
              router.push('/login');
              return;
            }

            console.log('Valid session found, loading profile...');
            
            // Test database connection first
            const dbConnected = await testDatabaseConnection();
            if (!dbConnected) {
              toast({ title: "Database Error", description: "Cannot connect to database. Please check your connection.", variant: "destructive"});
              router.push('/dashboard');
              return;
            }
            
            const profile = await getUserProfile(authUser.uid);
            if (profile) {
              setUserProfile(profile);
              profileForm.reset({
                displayName: profile.full_name || "", summary: profile.bio || "", phoneNumber: profile.phone || "", address: profile.address || "",
                linkedinUrl: profile.linkedin_url || "", githubUrl: profile.github_url || "", portfolioUrl: profile.portfolio_url || "", pronouns: profile.pronouns || "",
                education: profile.education || [], experience: profile.experience || [], projects: profile.projects || [],
                skills: profile.skills?.map((skill: string) => ({ id: generateRandomId(), name: skill })) || [], // Convert string[] to SkillEntry[]
                certifications: profile.certifications || [], achievements: profile.achievements || [],
                placementCompany: profile.placement_company || "", placementJobTitle: profile.placement_job_title || "", referralInfo: profile.referral_info || "",
              });
              setAvatarPreview(profile.avatar_url);
            } else {
              console.warn('No profile found for user, this might be normal for new users');
              // For new users without profiles, we can show empty form
              setUserProfile({
                id: authUser.uid,
                email: authUser.email || '',
                role: authUser.role || 'student',
                is_approved: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              } as UserProfile);
            }
          } catch (error) {
            console.error('Error in session/profile check:', error);
            toast({ title: "Authentication Error", description: "Please log in again.", variant: "destructive"});
            router.push('/login');
          }
          setPageLoading(false);
        };
        
        checkSessionAndLoadProfile();
      }
    }
  }, [authUser, authLoading, router, profileForm, toast]);


  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { toast({ title: "File too large", description: "Avatar image must be less than 2MB.", variant: "destructive" }); return; }
      if (!['image/png', 'image/jpeg', 'image/gif'].includes(file.type)) { toast({ title: "Invalid File Type", description: "Please upload a PNG, JPG, or GIF.", variant: "destructive" }); return; }
      try {
        const dataUrl = await readFileAsDataURL(file);
        setAvatarPreview(dataUrl);
      } catch (error) {
        toast({ title: "Error processing image", variant: "destructive" });
      }
    }
  };
  
  const removeAvatar = () => {
    setAvatarPreview(undefined);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };


  async function onProfileSubmit(data: ProfileFormValues) {
    console.log('🚀 Form submitted with data:', data);
    setIsSaving(true);

    if (!userProfile || !authUser) {
      console.error('❌ Missing userProfile or authUser');
      toast({ title: "Error", description: "User session not found.", variant: "destructive" });
      setIsSaving(false);
      return;
    }

    const updatedProfileData: Partial<UserProfile> = {
        full_name: data.displayName || userProfile.full_name, bio: data.summary, phone: data.phoneNumber, address: data.address,
        linkedin_url: data.linkedinUrl, github_url: data.githubUrl, portfolio_url: data.portfolioUrl, pronouns: data.pronouns,
        // Branch and semester are read-only - only admins can change them in database
        education: data.education, experience: data.experience, projects: data.projects,
        skills: data.skills?.map(skill => skill.name) || [], // Convert SkillEntry[] back to string[]
        certifications: data.certifications, achievements: data.achievements, avatar_url: avatarPreview,
        placement_company: data.placementCompany, placement_job_title: data.placementJobTitle, referral_info: data.referralInfo,
    };

    console.log('📝 Prepared update data:', updatedProfileData);

    try {
      console.log('🔄 Calling updateUserProfile...');
      const updatedProfile = await updateUserProfile(authUser.uid, updatedProfileData);
      console.log('✅ Profile update successful, returned data:', updatedProfile);

      // Verify the update actually worked by fetching the profile
      console.log('🔍 Verifying update by fetching profile...');
      const verificationProfile = await getUserProfile(authUser.uid);
      console.log('📊 Verification result:', {
        requestedUpdate: updatedProfileData.full_name,
        returnedFromUpdate: updatedProfile?.full_name,
        fetchedAfterUpdate: verificationProfile?.full_name,
        matches: verificationProfile?.full_name === updatedProfileData.full_name
      });

      // Update localStorage with the new profile data including avatar
      if (verificationProfile) {
        localStorage.setItem(`apsconnect_user_${authUser.uid}`, JSON.stringify(verificationProfile));
        console.log('💾 Updated localStorage with new profile data');

        // Dispatch a storage event to notify other components (like navbar) of the change
        if (typeof window !== 'undefined') {
          const storageEvent = new StorageEvent('storage', {
            key: `apsconnect_user_${authUser.uid}`,
            newValue: JSON.stringify(verificationProfile),
            oldValue: null,
            storageArea: localStorage
          });
          window.dispatchEvent(storageEvent);
          console.log('📡 Dispatched storage event for avatar update');
        }
      }

      if (authUser.uid === userProfile.id) {
          updateUserContext({
            ...authUser,
            displayName: updatedProfileData.full_name || authUser.displayName,
            branch: updatedProfileData.branch,
            semester: updatedProfileData.semester as Semester,
            usn: updatedProfileData.usn || authUser.usn
          });
      }
      toast({ title: "Profile Updated", description: "Your profile details have been saved.", duration: 3000 });
    } catch (error: any) {
      console.error('❌ Profile update failed:', error);
      toast({ title: "Update Failed", description: error.message || "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }
  
  async function onPasswordSubmit(data: PasswordFormValues) {
    setIsSaving(true);
    if (!userProfile || !userProfile.password) {
        toast({ title: "Error", description: "Cannot verify current password.", variant: "destructive" });
        setIsSaving(false);
        return;
    }
    if (data.oldPassword !== userProfile.password) {
        passwordForm.setError("oldPassword", { type: "manual", message: "Current password does not match." });
        setIsSaving(false);
        return;
    }

    const updatedProfileData = { ...userProfile, password: data.newPassword };
    localStorage.setItem(`apsconnect_user_${userProfile.id}`, JSON.stringify(updatedProfileData));
    toast({ title: "Password Updated", description: "Your password has been changed successfully.", duration: 3000 });
    passwordForm.reset();
    setIsSaving(false);
  }
  
  async function onEmailSubmit(data: EmailFormValues) {
    setIsSaving(true);
     if (!userProfile) { toast({ title: "Error", description: "User session not found.", variant: "destructive" }); setIsSaving(false); return; }
     
    // Check if new email already exists
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('apsconnect_user_') && key !== `apsconnect_user_${userProfile.id}`) {
            const profileStr = localStorage.getItem(key);
            if(profileStr){
                const existingProfile = JSON.parse(profileStr) as UserProfile;
                if(existingProfile.email.toLowerCase() === data.newEmail.toLowerCase()){
                    emailForm.setError("newEmail", { type: "manual", message: "This email is already in use." });
                    setIsSaving(false);
                    return;
                }
            }
        }
    }
    
    const oldKey = `apsconnect_user_${userProfile.id}`;
    const newUid = data.newEmail.toLowerCase();
    const newKey = `apsconnect_user_${newUid}`;

    const updatedProfileData: UserProfile = { ...userProfile, email: data.newEmail.toLowerCase() };
    
    localStorage.setItem(newKey, JSON.stringify(updatedProfileData));
    localStorage.removeItem(oldKey);
    
    // Update auth context
    const updatedAuthUser: User = { ...authUser!, email: newUid, uid: newUid };
    updateUserContext(updatedAuthUser);
    
    toast({ title: "Email Updated", description: "Your email has been changed. Please note your UID for login has also changed.", duration: 5000 });
    emailForm.reset();
    setUserProfile(updatedProfileData); // Update local state to re-render with new email
    setIsSaving(false);
  }

  const handleGenerateResume = async () => {
    if (!userProfile) {
      toast({
        title: "Error",
        description: "Profile data not available.",
        variant: "destructive",
      });
      return;
    }

    // Show loading
    const loadingToast = toast({
      title: "Generating Resume",
      description: "Creating your professional CV...",
    });

    try {
      // Get authentication token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Authentication required');
      }

      // Generate professional resume HTML
      const resumeHTML = generateResumeHTML(userProfile);

      // Call server-side PDF generation API
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          html: resumeHTML,
          fileName: `${userProfile.full_name || 'Resume'}_CV.pdf`
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to generate PDF';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Ignore JSON parse errors
        }
        throw new Error(errorMessage);
      }

      // Get PDF blob and download it
      const pdfBlob = await response.blob();
      const url = URL.createObjectURL(pdfBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${userProfile.full_name || 'Resume'}_CV.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      URL.revokeObjectURL(url);

      loadingToast.dismiss?.();

      toast({
        title: "Resume Downloaded",
        description: "Your professional CV has been saved to your downloads folder.",
        duration: 5000,
      });

    } catch (error) {
      loadingToast.dismiss?.();
      console.error('Error generating resume:', error);
      toast({
        title: "Error",
        description: "Failed to generate resume. Please try again.",
        variant: "destructive",
      });
    }
  };

  const generateResumeHTML = (profile: UserProfile) => {
    const formatDescription = (text: string) => {
      if (!text) return '';
      const items = text.split(/[\n\r]|•/).map(item => item.trim()).filter(item => item.length > 0);
      if (items.length === 0) return '';
      return `<ul style="padding-left: 20px; margin-top: 4px;">${items.map(item => `<li style="margin-bottom: 2px; font-size: 10pt;">${item}</li>`).join('')}</ul>`;
    };

    const isStudent = profile.role === 'student';
    const isAlumni = profile.role === 'alumni';
    const isFaculty = profile.role === 'faculty';

    return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${profile.full_name || 'Resume'} - CV</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@1/css/pico.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Times+New+Roman&family=Arial:wght@400;600&display=swap" rel="stylesheet">
    <style>
      body {
        max-width: 880px;
        margin: 0 auto;
        padding: 32px 80px;
        position: relative;
        box-sizing: border-box;
        font-family: 'Times New Roman', serif;
        font-size: 11pt;
        line-height: 1.4;
        color: #000;
        background: white;
      }

      .header {
        text-align: center;
        margin-bottom: 24px;
        border-bottom: 2px solid #2c3e50;
        padding-bottom: 16px;
      }

      .header h1 {
        font-family: Arial, sans-serif;
        font-size: 20pt;
        font-weight: 600;
        margin: 0 0 8px 0;
        color: #2c3e50;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .contact-info {
        font-size: 10pt;
        margin: 8px 0;
        text-align: center;
      }

      .contact-info a {
        color: #2c3e50;
        text-decoration: none;
      }

      .section {
        margin-bottom: 20px;
      }

      .section h2 {
        font-family: Arial, sans-serif;
        font-size: 13pt;
        font-weight: 600;
        color: #2c3e50;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin: 16px 0 8px 0;
        border-bottom: 1px solid #34495e;
        padding-bottom: 2px;
      }

      .experience-item, .education-item {
        margin-bottom: 12px;
      }

      .position-title, .degree, .project-title {
        font-weight: 900;
        font-size: 11pt;
        margin-bottom: 2px;
        color: #000000;
      }

      .organization, .institution {
        font-style: italic;
        color: #34495e;
        margin-bottom: 4px;
        font-weight: 600;
      }

      .date {
        font-size: 10pt;
        color: #666;
        float: right;
        font-weight: normal;
      }

      .details {
        margin-left: 16px;
        margin-top: 4px;
      }

      .details ul {
        list-style: disc;
        padding-left: 20px;
        margin-top: 4px;
        font-size: 10pt;
      }

      .details li {
        margin-bottom: 2px;
      }

      li {
        margin-bottom: 1px;
      }

      .clearfix::after {
        content: '';
        display: table;
        clear: both;
      }

      .gpa {
        font-weight: 900;
        color: #000000;
      }

      @media print {
        /* Hide all non-print elements */
        .no-print {
          display: none !important;
        }

        /* Reset body for print */
        body {
          margin: 0;
          padding: 20px;
          background: white !important;
          -webkit-print-color-adjust: exact;
          color-adjust: exact;
        }

      /* Page setup for clean PDF */
      @page {
        size: A4 portrait;
        margin: 0;
      }

      html, body {
        margin: 0;
        padding: 0;
        -webkit-print-color-adjust: exact;
        color-adjust: exact;
      }

      body {
        padding: 20mm;
        box-sizing: border-box;
      }

        /* Ensure content doesn't get cut off */
        .header {
          margin-bottom: 20px;
          page-break-after: avoid;
        }

        .section {
          page-break-inside: avoid;
        }

        /* Prevent page breaks in the middle of sections */
        h2 {
          page-break-after: avoid;
        }

        .experience-item, .education-item {
          page-break-inside: avoid;
        }
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>${profile.full_name || 'Name Not Provided'}</h1>
      <div class="contact-info">
        ${profile.email || ''} | ${profile.phone || ''} | ${profile.address || ''}<br>
      </div>
    </div>

    ${(profile.bio || profile.summary) ? `
    <div class="section">
      <h2>Professional Summary</h2>
      <p style="font-size: 10pt; margin-top: 4px;">${profile.bio || profile.summary}</p>
    </div>
    ` : ''}

    ${profile.education && profile.education.length > 0 ? `
    <div class="section">
      <h2>Education</h2>
      ${profile.education.map((edu: any) => `
        <div class="education-item">
          <div class="clearfix">
            <span class="degree">${edu.degree || 'Degree Not Specified'}</span>
            <span class="date">${edu.graduationYear || 'Year Not Specified'}</span>
          </div>
          <div class="institution">${edu.institution || 'Institution Not Specified'}</div>
          <div><span class="gpa">${edu.scoreType === 'cgpa' ? 'CGPA' : 'Score'}: ${edu.score || 'N/A'}</span></div>
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${profile.experience && profile.experience.length > 0 ? `
    <div class="section">
      <h2>Experience</h2>
      ${profile.experience.map((exp: any) => `
        <div class="experience-item">
          <div class="clearfix">
            <span class="position-title">${exp.title || 'Position Not Specified'}</span>
            <span class="date">${exp.duration || 'Duration Not Specified'}</span>
          </div>
          <div class="organization">${exp.company || 'Company Not Specified'}</div>
          ${exp.description ? `<div class="details">${formatDescription(exp.description)}</div>` : ''}
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${profile.projects && profile.projects.length > 0 ? `
    <div class="section">
      <h2>Projects</h2>
      ${profile.projects.map((proj: any) => `
        <div class="experience-item">
          <div class="clearfix">
            <span class="project-title">${proj.title || 'Project Title'}</span>
          </div>
          ${proj.description ? `<div class="details">${formatDescription(proj.description)}</div>` : ''}
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${profile.skills && profile.skills.length > 0 ? `
    <div class="section">
      <h2>Technical Skills</h2>
      <p style="font-size: 10pt; margin-top: 4px;"><strong>Skills:</strong> ${profile.skills.join(', ')}</p>
    </div>
    ` : ''}

    ${profile.certifications && profile.certifications.length > 0 ? `
    <div class="section">
      <h2>Certifications</h2>
      <ul style="font-size: 10pt; padding-left: 20px;">
        ${profile.certifications.map((cert: any) => `
          <li style="margin-bottom: 2px;">
            <strong>${cert.name || 'Certification Name'}</strong>${cert.issuingBody ? `, ${cert.issuingBody}` : ''}${cert.year ? ` (${cert.year})` : ''}
          </li>
        `).join('')}
      </ul>
    </div>
    ` : ''}

    ${profile.achievements && profile.achievements.length > 0 ? `
    <div class="section">
      <h2>Achievements & Honors</h2>
      <ul style="font-size: 10pt; padding-left: 20px;">
        ${profile.achievements.map((achievement: any) => `
          <li style="margin-bottom: 2px;">${achievement.description || achievement}</li>
        `).join('')}
      </ul>
    </div>
    ` : ''}

    ${isFaculty ? `
    <div class="section">
      <h2>Faculty Information</h2>
      ${profile.faculty_title ? `<p style="font-size: 10pt;"><strong>Title:</strong> ${profile.faculty_title}</p>` : ''}
      ${profile.assigned_branches && profile.assigned_branches.length > 0 ? `<p style="font-size: 10pt;"><strong>Assigned Branches:</strong> ${profile.assigned_branches.join(', ')}</p>` : ''}
      ${profile.assigned_semesters && profile.assigned_semesters.length > 0 ? `<p style="font-size: 10pt;"><strong>Assigned Semesters:</strong> ${profile.assigned_semesters.join(', ')}</p>` : ''}
    </div>
    ` : ''}

    ${isAlumni ? `
    <div class="section">
      <h2>Alumni Information</h2>
      ${profile.placement_company ? `<p style="font-size: 10pt;"><strong>Company:</strong> ${profile.placement_company}</p>` : ''}
      ${profile.placement_job_title ? `<p style="font-size: 10pt;"><strong>Position:</strong> ${profile.placement_job_title}</p>` : ''}
      ${profile.referral_info ? `<p style="font-size: 10pt;"><strong>Referral Info:</strong> ${profile.referral_info}</p>` : ''}
    </div>
    ` : ''}

  `;
  };

  if (pageLoading || authLoading) return <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[calc(100vh-10rem)]"><SimpleRotatingSpinner className="h-12 w-12 text-primary" /></div>;
  if (!authUser || !userProfile) return <div className="container mx-auto px-4 py-8 text-center"><Card className="w-full max-w-md mx-auto shadow-xl"><CardHeader><CardTitle className="text-destructive text-xl sm:text-2xl">Access Denied</CardTitle></CardHeader><CardContent><ShieldCheck className="h-12 w-12 sm:h-16 sm:w-16 text-destructive mx-auto mb-4" /><p className="text-md sm:text-lg text-muted-foreground">You must be logged in to view this page.</p><Link href="/login"><Button variant="outline" className="mt-6">Go to Login</Button></Link></CardContent></Card></div>;
  
  const isStudent = userProfile.role === 'student';
  const isAlumni = userProfile.role === 'alumni';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6"><Button variant="outline" size="icon" onClick={goToDashboard} aria-label="Go back"><ArrowLeft className="h-4 w-4" /></Button></div>
      <Card className="w-full max-w-4xl mx-auto shadow-xl">
        <CardHeader><CardTitle className="text-2xl font-bold tracking-tight text-primary">Profile & Resume Settings</CardTitle><CardDescription>Manage your public profile and account security.</CardDescription></CardHeader>
        <CardContent>
            <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
                <AccordionItem value="item-1">
                    <AccordionTrigger className="text-xl font-semibold">General Profile</AccordionTrigger>
                    <AccordionContent>
                        <Form {...profileForm}>
                            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-8 pt-4">
                                <div className="flex flex-col items-center space-y-4">
                                    <Avatar className="h-32 w-32 ring-4 ring-primary/20 shadow-lg"><AvatarImage src={avatarPreview} alt={userProfile.full_name || "User Avatar"} /><AvatarFallback className="text-4xl bg-muted text-muted-foreground">{getInitials(userProfile.full_name)}</AvatarFallback></Avatar>
                                    <div className="flex gap-2"><Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}><Camera className="mr-2 h-4 w-4"/> Change Photo</Button><input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/png, image/jpeg, image/gif" className="hidden" />{avatarPreview && <Button type="button" variant="destructive" size="sm" onClick={removeAvatar}><Trash2 className="mr-2 h-4 w-4"/> Remove</Button>}</div>
                                </div>
                                
                                {isAlumni && (
                                    <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                                        <CardHeader className="p-0 pb-4">
                                            <CardTitle className="text-lg flex items-center gap-2"><Briefcase/> Placement Information</CardTitle>
                                            <CardDescription>Share your career journey with current students.</CardDescription>
                                        </CardHeader>
                                        <div className="space-y-4">
                                            <FormField control={profileForm.control} name="placementCompany" render={({ field }) => (<FormItem><FormLabel>Company</FormLabel><FormControl><Input {...field} placeholder="e.g., Google, Microsoft" /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={profileForm.control} name="placementJobTitle" render={({ field }) => (<FormItem><FormLabel>Job Title</FormLabel><FormControl><Input {...field} placeholder="e.g., Software Engineer, Product Manager" /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={profileForm.control} name="referralInfo" render={({ field }) => (<FormItem><FormLabel>Referral Information</FormLabel><FormControl><Textarea {...field} rows={3} placeholder="How can students reach out for referrals? e.g., 'Connect with me on LinkedIn and send a message with your resume.'"/></FormControl><FormMessage /></FormItem>)} />
                                        </div>
                                    </Card>
                                )}

                                <Card className="p-6"><CardHeader className="p-0 pb-4"><CardTitle className="text-lg">Personal & Contact Information</CardTitle></CardHeader>
                                    <div className="space-y-4">
                                        {(userProfile.usn || userProfile.student_id) && (
                                          <FormItem>
                                            <FormLabel>USN</FormLabel>
                                            <FormControl>
                                              <Input value={userProfile.usn || userProfile.student_id || ''} disabled readOnly placeholder="Assigned by administration" />
                                            </FormControl>
                                            <FormDescription>USN assigned by administration</FormDescription>
                                          </FormItem>
                                        )}
                                        <FormField control={profileForm.control} name="displayName" render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={profileForm.control} name="pronouns" render={({ field }) => (<FormItem><FormLabel>Pronouns (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        {userProfile.role === 'faculty' ? (
                                          <>
                                            <FormItem>
                                              <FormLabel>Assigned Branches</FormLabel>
                                              <FormControl>
                                                <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-muted">
                                                  {(userProfile.assigned_branches || []).map((branch: string, index: number) => (
                                                    <Badge key={index} variant="secondary">{branch}</Badge>
                                                  ))}
                                                </div>
                                              </FormControl>
                                              <FormDescription>Teaching branches assigned by administration</FormDescription>
                                            </FormItem>
                                            <FormItem>
                                              <FormLabel>Assigned Semesters</FormLabel>
                                              <FormControl>
                                                <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-muted">
                                                  {(userProfile.assigned_semesters || []).map((semester: string, index: number) => (
                                                    <Badge key={index} variant="secondary">{semester}</Badge>
                                                  ))}
                                                </div>
                                              </FormControl>
                                              <FormDescription>Teaching semesters assigned by administration</FormDescription>
                                            </FormItem>
                                          </>
                                        ) : (
                                          <>
                                            <FormItem><FormLabel>Branch</FormLabel><FormControl><Input value={userProfile?.branch || ''} disabled readOnly placeholder="Assigned by administration" /></FormControl><FormDescription>Branch assignment managed by administration</FormDescription></FormItem>
                                            <FormItem><FormLabel>Semester</FormLabel><FormControl><Input value={userProfile?.semester || ''} disabled readOnly placeholder="Assigned by administration" /></FormControl><FormDescription>Semester assignment managed by administration</FormDescription></FormItem>
                                          </>
                                        )}
                                        <FormField control={profileForm.control} name="phoneNumber" render={({ field }) => (<FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input {...field} type="tel" /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={profileForm.control} name="address" render={({ field }) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} placeholder="City, State/Country" /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={profileForm.control} name="linkedinUrl" render={({ field }) => (<FormItem><FormLabel>LinkedIn URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={profileForm.control} name="githubUrl" render={({ field }) => (<FormItem><FormLabel>GitHub URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={profileForm.control} name="portfolioUrl" render={({ field }) => (<FormItem><FormLabel>Portfolio/Website URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={profileForm.control} name="summary" render={({ field }) => (<FormItem><FormLabel>Professional Summary</FormLabel><FormControl><Textarea {...field} rows={4} /></FormControl><FormMessage /></FormItem>)} />
                                    </div>
                                </Card>
                                
                                {(isStudent || isAlumni) && (<>
                                    <ResumeSection title="Education" fields={educationFields} onRemove={removeEducation} onAdd={() => appendEducation({ id: generateRandomId(), degree: '', institution: '', graduationYear: '', score: '', scoreType: 'score' })} renderFields={(field, index) => (<> <FormField control={profileForm.control} name={`education.${index}.degree`} render={({ field }) => (<FormItem><FormLabel>Degree</FormLabel><FormControl><Input {...field} placeholder="e.g., B.E. in Computer Science" /></FormControl><FormMessage /></FormItem>)} /> <FormField control={profileForm.control} name={`education.${index}.institution`} render={({ field }) => (<FormItem><FormLabel>Institution</FormLabel><FormControl><Input {...field} placeholder="e.g., APS College of Engineering" /></FormControl><FormMessage /></FormItem>)} /> <FormField control={profileForm.control} name={`education.${index}.graduationYear`} render={({ field }) => (<FormItem><FormLabel>Graduation Year</FormLabel><FormControl><Input {...field} placeholder="e.g., 2025" /></FormControl><FormMessage /></FormItem>)} /> <FormField control={profileForm.control} name={`education.${index}.scoreType`} render={({ field }) => (<FormItem><FormLabel>Score Type</FormLabel><FormControl><div className="flex gap-4"><label className="flex items-center gap-2"><input type="radio" {...field} value="score" checked={field.value === 'score'} /> Score (%)</label><label className="flex items-center gap-2"><input type="radio" {...field} value="cgpa" checked={field.value === 'cgpa'} /> CGPA</label></div></FormControl><FormMessage /></FormItem>)} /> <FormField control={profileForm.control} name={`education.${index}.score`} render={({ field }) => (<FormItem><FormLabel>Score/GPA</FormLabel><FormControl><Input {...field} placeholder="e.g., 85 or 8.5" /></FormControl><FormMessage /></FormItem>)} /> </>)} />
                                    <ResumeSection title="Experience" fields={experienceFields} onRemove={removeExperience} onAdd={() => appendExperience({ id: generateRandomId(), title: '', company: '', duration: '', description: '' })} renderFields={(field, index) => (<> <FormField control={profileForm.control} name={`experience.${index}.title`} render={({ field }) => (<FormItem><FormLabel>Job Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} /> <FormField control={profileForm.control} name={`experience.${index}.company`} render={({ field }) => (<FormItem><FormLabel>Company</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} /> <FormField control={profileForm.control} name={`experience.${index}.duration`} render={({ field }) => (<FormItem><FormLabel>Duration</FormLabel><FormControl><Input {...field} placeholder="e.g., Jun 2023 - Aug 2023" /></FormControl><FormMessage /></FormItem>)} /> <FormField control={profileForm.control} name={`experience.${index}.description`} render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} rows={3} /></FormControl><FormMessage /></FormItem>)} /> </>)} />
                                    <ResumeSection title="Projects" fields={projectFields} onRemove={removeProject} onAdd={() => appendProject({ id: generateRandomId(), title: '', description: '', link: '' })} renderFields={(field, index) => (<> <FormField control={profileForm.control} name={`projects.${index}.title`} render={({ field }) => (<FormItem><FormLabel>Project Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} /> <FormField control={profileForm.control} name={`projects.${index}.description`} render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} rows={3} /></FormControl><FormMessage /></FormItem>)} /> <FormField control={profileForm.control} name={`projects.${index}.link`} render={({ field }) => (<FormItem><FormLabel>Project Link (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} /> </>)} />
                                    <ResumeSection title="Skills" fields={skillFields} onRemove={removeSkill} onAdd={() => appendSkill({ id: generateRandomId(), name: '' })} renderFields={(field, index) => ( <FormField control={profileForm.control} name={`skills.${index}.name`} render={({ field }) => (<FormItem className="col-span-full"><FormLabel>Skill</FormLabel><FormControl><Input {...field} placeholder="e.g., React, Python, UI/UX Design" /></FormControl><FormMessage /></FormItem>)} /> )} />
                                    <ResumeSection title="Certifications" fields={certificationFields} onRemove={removeCertification} onAdd={() => appendCertification({ id: generateRandomId(), name: '', issuingBody: '', year: '' })} renderFields={(field, index) => (<> <FormField control={profileForm.control} name={`certifications.${index}.name`} render={({ field }) => (<FormItem><FormLabel>Certification Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} /> <FormField control={profileForm.control} name={`certifications.${index}.issuingBody`} render={({ field }) => (<FormItem><FormLabel>Issuing Body</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} /> <FormField control={profileForm.control} name={`certifications.${index}.year`} render={({ field }) => (<FormItem><FormLabel>Year</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} /> </>)} />
                                    <ResumeSection title="Achievements" fields={achievementFields} onRemove={removeAchievement} onAdd={() => appendAchievement({ id: generateRandomId(), description: '' })} renderFields={(field, index) => ( <FormField control={profileForm.control} name={`achievements.${index}.description`} render={({ field }) => (<FormItem className="col-span-full"><FormLabel>Achievement</FormLabel><FormControl><Input {...field} placeholder="e.g., Won first place in Hackathon 2023" /></FormControl><FormMessage /></FormItem>)} /> )} />
                                </>)}
                                <div className="flex flex-col sm:flex-row gap-2 justify-end pt-4 border-t">
                                    <Button type="submit" disabled={isSaving}>{isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving Profile...</> : "Save Profile Changes"}</Button>
                                    {(isStudent || isAlumni) && (<Button type="button" variant="outline" onClick={handleGenerateResume} disabled={isSaving}><FileDown className="mr-2 h-4 w-4" /> Generate Resume</Button>)}
                                </div>
                            </form>
                        </Form>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                    <AccordionTrigger className="text-xl font-semibold">Security</AccordionTrigger>
                    <AccordionContent className="pt-4 space-y-8">
                        <Card className="p-6">
                            <CardHeader className="p-0 pb-4"><CardTitle className="text-lg flex items-center gap-2"><KeyRound/>Change Password</CardTitle></CardHeader>
                            <Form {...passwordForm}>
                                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                                    <FormField control={passwordForm.control} name="oldPassword" render={({ field }) => (<FormItem><FormLabel>Current Password</FormLabel><FormControl><PasswordInput {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={passwordForm.control} name="newPassword" render={({ field }) => (<FormItem><FormLabel>New Password</FormLabel><FormControl><PasswordInput {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={passwordForm.control} name="confirmNewPassword" render={({ field }) => (<FormItem><FormLabel>Confirm New Password</FormLabel><FormControl><PasswordInput {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <Button type="submit" disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Change Password"}</Button>
                                </form>
                            </Form>
                        </Card>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

// Reusable component for resume sections
function ResumeSection({ title, fields, onRemove, onAdd, renderFields }: { title: string, fields: any[], onRemove: (index: number) => void, onAdd: () => void, renderFields: (field: any, index: number) => React.ReactNode }) {
    return (
        <Card className="p-6">
            <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
                <CardTitle className="text-lg">{title}</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={onAdd}><PlusCircle className="mr-2 h-4 w-4"/> Add</Button>
            </CardHeader>
            <div className="space-y-6">
                {fields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-md relative space-y-4">
                        {renderFields(field, index)}
                        <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7" onClick={() => onRemove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                ))}
                {fields.length === 0 && <p className="text-sm text-muted-foreground">No {title.toLowerCase()} added yet.</p>}
            </div>
        </Card>
    );
}
