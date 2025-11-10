
"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ShieldCheck, Settings, UploadCloud, Mail, Users, Globe, GraduationCap } from 'lucide-react';
import { SimpleRotatingSpinner } from '@/components/ui/loading-spinners';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

// Mock storage key for these new settings
const SITE_SETTINGS_STORAGE_KEY = 'apsconnect_site_settings_v1';

interface SiteSettingsData {
  id?: string;
  collegename?: string;
  collegelogourl?: string;
  contactemail?: string;
  socialfacebook?: string;
  socialtwitter?: string;
  sociallinkedin?: string;
  socialinstagram?: string;
  socialgithub?: string;
  enablealumnitransition?: boolean;
  created_at?: string;
  updated_at?: string;
}

const defaultSiteSettings: Omit<SiteSettingsData, 'id' | 'created_at' | 'updated_at'> = {
  collegename: 'APS College',
  collegelogourl: '',
  contactemail: 'info@apsconnect.example.com',
  socialfacebook: '',
  socialtwitter: '',
  sociallinkedin: '',
  socialinstagram: '',
  socialgithub: '',
  enablealumnitransition: false,
};

export default function AdminSettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [pageLoading, setPageLoading] = useState(true);
  const [settings, setSettings] = useState<Omit<SiteSettingsData, 'id' | 'created_at' | 'updated_at'>>(defaultSiteSettings);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'admin') {
        router.push(user ? '/dashboard' : '/login');
        return;
      }
      loadSettings();
    }
  }, [user, authLoading, router]);

  const loadSettings = async () => {
    try {
      // Try to load from Supabase first
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .single();

      if (error) {
        console.error('Error loading from Supabase:', error);
        // Fall back to localStorage
        if (typeof window !== 'undefined') {
          const storedSettings = localStorage.getItem(SITE_SETTINGS_STORAGE_KEY);
          if (storedSettings) {
            try {
              const localSettings = JSON.parse(storedSettings);
              setSettings({ ...defaultSiteSettings, ...localSettings });
            } catch (e) {
              console.error("Failed to parse localStorage settings:", e);
              setSettings(defaultSiteSettings);
            }
          } else {
            setSettings(defaultSiteSettings);
          }
        }
      } else if (data) {
        // Use Supabase data, merging with defaults for any missing fields
        setSettings({ ...defaultSiteSettings, ...data });
      } else {
        // No data found, use defaults
        setSettings(defaultSiteSettings);
      }
    } catch (error) {
      console.error('Error in loadSettings:', error);
      setSettings(defaultSiteSettings);
    } finally {
      setPageLoading(false);
    }
  };

  const saveToSupabase = async (settingsData: Omit<SiteSettingsData, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const record = {
        ...settingsData,
        updated_at: new Date().toISOString(),
      };

      // Update the single site_settings record (id is fixed UUID)
      const { data, error } = await supabase
        .from('site_settings')
        .update(record)
        .eq('id', '00000000-0000-0000-0000-000000000000')
        .select()
        .single();

      if (error) {
        console.error('Error saving to Supabase:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in saveToSupabase:', error);
      throw error;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: keyof Omit<SiteSettingsData, 'id' | 'created_at' | 'updated_at'>, checked: boolean) => {
    setSettings(prev => ({ ...prev, [name]: checked }));
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({ title: "File too large", description: "Logo image must be less than 2MB.", variant: "destructive" });
        return;
      }
      if (!['image/png', 'image/jpeg', 'image/svg+xml'].includes(file.type)) {
        toast({ title: "Invalid File Type", description: "Please upload a PNG, JPG, or SVG.", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings(prev => ({ ...prev, collegelogourl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      // Extract only the fields we want to save (excluding id, created_at, updated_at)
      const settingsToSave = {
        collegename: settings.collegename,
        collegelogourl: settings.collegelogourl,
        contactemail: settings.contactemail,
        socialfacebook: settings.socialfacebook,
        socialtwitter: settings.socialtwitter,
        sociallinkedin: settings.sociallinkedin,
        socialinstagram: settings.socialinstagram,
        socialgithub: settings.socialgithub,
        enablealumnitransition: settings.enablealumnitransition,
      };

      // Save to Supabase
      await saveToSupabase(settingsToSave);

      // Also save to localStorage as backup
      if (typeof window !== 'undefined') {
        localStorage.setItem(SITE_SETTINGS_STORAGE_KEY, JSON.stringify(settingsToSave));
      }

      toast({
        title: "Settings Saved",
        description: "Site settings have been updated and synced across all users.",
        duration: 3000,
      });

      // Trigger real-time update by calling loadSettings to refresh from Supabase
      await loadSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    const channel = supabase
      .channel('site_settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_settings'
        },
        (payload) => {
          console.log('Real-time settings update:', payload);
          if (payload.new) {
            setSettings(prev => ({ ...defaultSiteSettings, ...payload.new }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (pageLoading || authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <SimpleRotatingSpinner className="h-12 w-12 text-primary" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Card className="max-w-md mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="text-destructive text-xl sm:text-2xl">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <ShieldCheck className="h-12 w-12 sm:h-16 sm:w-16 text-destructive mx-auto mb-4" />
            <p className="text-md sm:text-lg text-muted-foreground">You do not have permission to view this page.</p>
            <Link href="/dashboard"><Button variant="outline" className="mt-6">Go to Dashboard</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">Site Settings</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Configure general application settings and preferences.
            </p>
          </div>
        </div>
         <Link href="/admin">
            <Button variant="outline">Back to Admin Dashboard</Button>
          </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Column 1: General & Appearance */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">General & Appearance</CardTitle>
            <CardDescription>Manage basic site information and visual elements.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="collegename">College Name</Label>
              <Input
                id="collegename"
                name="collegename"
                type="text"
                placeholder="e.g., APS College of Engineering"
                value={settings.collegename || ''}
                onChange={handleInputChange}
              />
              <p className="text-xs text-muted-foreground">Display name for your college in the navbar.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="collegelogourl">College Logo</Label>
              <div className="flex items-center gap-4">
                {settings.collegelogourl && (
                  <img src={settings.collegelogourl} alt="College Logo Preview" className="h-16 w-auto border rounded bg-muted p-1" data-ai-hint="logo building" />
                )}
                <label htmlFor="logo-upload-input" className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-center w-full p-2 border-2 border-dashed rounded-md hover:border-primary transition-colors">
                        <UploadCloud className="h-6 w-6 text-muted-foreground mr-2" />
                        <span className="text-sm text-muted-foreground">
                            {settings.collegelogourl ? 'Change logo' : 'Upload logo'}
                        </span>
                    </div>
                    <Input id="logo-upload-input" name="collegelogourl" type="file" className="sr-only" onChange={handleLogoUpload} accept="image/png, image/jpeg, image/svg+xml" />
                </label>
              </div>
              <p className="text-xs text-muted-foreground">Recommended: SVG or PNG format. Max 2MB.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactemail">Contact Email</Label>
              <Input
                id="contactemail"
                name="contactemail"
                type="email"
                placeholder="e.g., contact@apsconnect.example.com"
                value={settings.contactemail || ''}
                onChange={handleInputChange}
              />
              <p className="text-xs text-muted-foreground">Public contact email for inquiries.</p>
            </div>
          </CardContent>
        </Card>

        {/* Column 2: Functionality & Social */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Functionality & Social</CardTitle>
            <CardDescription>Control site features and link social media profiles.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="flex items-center justify-between space-x-2 p-3 border rounded-md">
              <div className="space-y-0.5">
                <Label htmlFor="enablealumnitransition" className="text-base flex items-center gap-2"><GraduationCap className="h-5 w-5"/>Enable Alumni Transition</Label>
                <p className="text-xs text-muted-foreground">Show "Switch to Alumni" option for 8th sem students on their dashboard.</p>
              </div>
              <Switch
                id="enablealumnitransition"
                checked={settings.enablealumnitransition}
                onCheckedChange={(checked) => handleSwitchChange('enablealumnitransition', checked)}
              />
            </div>

            <div className="space-y-4 pt-4 border-t">
                <h4 className="text-md font-semibold text-foreground flex items-center"><Globe className="mr-2 h-5 w-5"/> Social Media Links</h4>
                <div className="space-y-2">
                    <Label htmlFor="socialfacebook">Facebook URL</Label>
                    <Input id="socialfacebook" name="socialfacebook" placeholder="https://facebook.com/yourcollege" value={settings.socialfacebook || ''} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="socialtwitter">Twitter/X URL</Label>
                    <Input id="socialtwitter" name="socialtwitter" placeholder="https://twitter.com/yourcollege" value={settings.socialtwitter || ''} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="sociallinkedin">LinkedIn URL</Label>
                    <Input id="sociallinkedin" name="sociallinkedin" placeholder="https://linkedin.com/school/yourcollege" value={settings.sociallinkedin || ''} onChange={handleInputChange} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="socialinstagram">Instagram URL</Label>
                    <Input id="socialinstagram" name="socialinstagram" placeholder="https://instagram.com/yourcollege" value={settings.socialinstagram || ''} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="socialgithub">GitHub URL</Label>
                    <Input id="socialgithub" name="socialgithub" placeholder="https://github.com/yourcollege" value={settings.socialgithub || ''} onChange={handleInputChange} />
                </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8 flex justify-end">
        <Button onClick={handleSaveChanges} disabled={isSaving}>
          {isSaving ? <SimpleRotatingSpinner className="mr-2 h-4 w-4" /> : null}
          {isSaving ? 'Saving...' : 'Save All Settings'}
        </Button>
      </div>
    </div>
  );
}

