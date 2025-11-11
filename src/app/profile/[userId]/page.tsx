
"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import type { UserProfile } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { SimpleRotatingSpinner } from '@/components/ui/loading-spinners';
import { Button } from '@/components/ui/button';
import { getInitials } from '@/components/content/post-item-utils';
import { Mail, Briefcase, GraduationCap, Users, BookOpen, Linkedin, Github, Globe, Phone, User as UserIcon, MessageCircle, ArrowLeft, Twitter, Instagram, Facebook, Youtube } from 'lucide-react';
import { RoleBadge } from '@/components/ui/role-badge';
import { getUserProfiles } from '@/lib/supabase-utils';
import Link from 'next/link';

export default function PublicProfilePage() {
  const params = useParams();
  const { user: authUser, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  const userId = params?.userId as string;

  if (!userId) {
    return (
      <div className="container mx-auto max-w-4xl py-8">
        <div className="text-center py-10">
          <h2 className="text-2xl font-semibold text-muted-foreground mb-2">Invalid Profile URL</h2>
          <p className="text-muted-foreground">The profile URL is missing required information.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (!authLoading) {
      if (!authUser) {
        router.push('/login');
        return;
      }

      const loadProfile = async () => {
        try {
          // First try to get profile from Supabase
          const profiles = await getUserProfiles();
          const foundProfile = profiles.find((p: UserProfile) => p.id === userId);
          
          if (foundProfile) {
            setProfile(foundProfile);
          } else {
            // Fallback to localStorage if not found in Supabase
            const profileKey = `apsconnect_user_${userId}`;
            const profileStr = localStorage.getItem(profileKey);
            if (profileStr) {
              setProfile(JSON.parse(profileStr));
            }
          }
        } catch (error) {
          console.error('Failed to load profile from Supabase:', error);
          // Fallback to localStorage if Supabase fails
          const profileKey = `apsconnect_user_${userId}`;
          const profileStr = localStorage.getItem(profileKey);
          if (profileStr) {
            setProfile(JSON.parse(profileStr));
          }
        }
        
        setPageLoading(false);
      };

      if (userId) {
        loadProfile();
      } else {
        setPageLoading(false);
      }
    }
  }, [userId, authUser, authLoading, router]);

  if (pageLoading || authLoading) {
    return (
      <div className="container mx-auto max-w-4xl py-8">
        <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
          <SimpleRotatingSpinner className="h-12 w-12 text-primary" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto max-w-4xl py-8">
        <div className="text-center py-10">
          <h2 className="text-2xl font-semibold text-muted-foreground mb-2">Profile Not Found</h2>
          <p className="text-muted-foreground">The requested profile could not be found or you don't have permission to view it.</p>
        </div>
      </div>
    );
  }
  
  const isStudent = profile.role === 'student';
  const isAlumni = profile.role === 'alumni';

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <Button variant="outline" size="icon" onClick={() => router.back()} className="mb-6" aria-label="Go back">
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <Card className="w-full shadow-xl">
        <CardHeader className="bg-muted/30 p-6 text-center">
            <Avatar className="h-32 w-32 mx-auto ring-4 ring-primary/20 shadow-lg">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-4xl">{getInitials(profile.full_name)}</AvatarFallback>
            </Avatar>
            <CardTitle className="mt-4 text-3xl font-bold flex items-center justify-center gap-3">
              {profile.full_name}
              <RoleBadge role={profile.role} size="md" />
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
              {isStudent ? `${profile.branch} - ${profile.semester}${profile.graduation_year ? ` (Expected Graduation: ${profile.graduation_year})` : ''}` : (isAlumni ? profile.placement_job_title || 'Alumni' : profile.faculty_title || 'Faculty Member')}
            </CardDescription>
             {profile.pronouns && <p className="text-sm text-muted-foreground">({profile.pronouns})</p>}
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Contact & Placement Info */}
          <div className="md:col-span-1 md:border-r md:pr-6 space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Contact Information</h3>
            <InfoItem icon={Mail} text={profile.email} href={`mailto:${profile.email}`} />
            {profile.phone && <InfoItem icon={Phone} text={profile.phone} href={`tel:${profile.phone}`} />}
            {profile.linkedin_url && <InfoItem icon={Linkedin} text="LinkedIn Profile" href={profile.linkedin_url} isLink />}
            {profile.github_url && <InfoItem icon={Github} text="GitHub Profile" href={profile.github_url} isLink />}
            {profile.portfolio_url && <InfoItem icon={Globe} text="Portfolio/Website" href={profile.portfolio_url} isLink />}
            {profile.social_links && typeof profile.social_links === 'object' && Object.keys(profile.social_links).length > 0 && (
              <>
                {profile.social_links.twitter && <InfoItem icon={Twitter} text="Twitter" href={profile.social_links.twitter} isLink />}
                {profile.social_links.instagram && <InfoItem icon={Instagram} text="Instagram" href={profile.social_links.instagram} isLink />}
                {profile.social_links.facebook && <InfoItem icon={Facebook} text="Facebook" href={profile.social_links.facebook} isLink />}
                {profile.social_links.youtube && <InfoItem icon={Youtube} text="YouTube" href={profile.social_links.youtube} isLink />}
              </>
            )}
             {isAlumni && (
                <div className="pt-4 mt-4 border-t">
                    <h3 className="font-semibold text-lg border-b pb-2 mb-3">Placement Details</h3>
                    {profile.placement_company && <InfoItem icon={Briefcase} text={profile.placement_company} />}
                    {profile.placement_job_title && <InfoItem icon={UserIcon} text={profile.placement_job_title} />}
                    {profile.referral_info && <InfoItem icon={MessageCircle} text={profile.referral_info} />}
                </div>
            )}
          </div>

          {/* Right Column - Resume Details */}
          <div className="md:col-span-2 space-y-6">
            {profile.summary && <ResumeDisplaySection title="Professional Summary" items={[profile.summary]} renderItem={(item) => <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item}</p>} />}
            {profile.education && profile.education.length > 0 && <ResumeDisplaySection title="Education" items={profile.education} renderItem={(item) => <div><p className="font-semibold">{item.degree}</p><p className="text-sm text-muted-foreground">{item.institution}</p><p className="text-xs text-muted-foreground">{item.graduationYear} &bull; Score: {item.score}</p></div>} />}
            {profile.experience && profile.experience.length > 0 && <ResumeDisplaySection title="Experience" items={profile.experience} renderItem={(item) => <div><p className="font-semibold">{item.title} at {item.company}</p><p className="text-xs text-muted-foreground">{item.duration}</p><p className="text-sm mt-1 whitespace-pre-wrap">{item.description}</p></div>} />}
            {profile.projects && profile.projects.length > 0 && <ResumeDisplaySection title="Projects" items={profile.projects} renderItem={(item) => <div><Link href={item.link || '#'} target="_blank" className="font-semibold text-primary hover:underline">{item.title}</Link><p className="text-sm mt-1 whitespace-pre-wrap">{item.description}</p></div>} />}
            {profile.skills && profile.skills.length > 0 && <ResumeDisplaySection title="Skills" items={profile.skills} renderItem={(item) => <Badge variant="secondary">{item}</Badge>} isBadgeList />}
            {profile.interests && profile.interests.length > 0 && <ResumeDisplaySection title="Interests & Hobbies" items={profile.interests} renderItem={(item) => <Badge variant="outline">{item}</Badge>} isBadgeList />}
            {profile.certifications && profile.certifications.length > 0 && <ResumeDisplaySection title="Certifications" items={profile.certifications} renderItem={(item) => <div><p className="font-semibold">{item.name}</p><p className="text-xs text-muted-foreground">{item.issuingBody} - {item.year}</p></div>} />}
            {profile.achievements && profile.achievements.length > 0 && <ResumeDisplaySection title="Achievements" items={profile.achievements} renderItem={(item) => <p className="text-sm text-muted-foreground">&bull; {item.description}</p>} />}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const InfoItem = ({ icon: Icon, text, href, isLink }: { icon: React.ElementType, text: string, href?: string, isLink?: boolean }) => (
  <div className="flex items-start text-sm">
    <Icon className="h-4 w-4 mr-3 text-muted-foreground flex-shrink-0 mt-0.5" />
    {href ? <Link href={href as any} target="_blank" rel="noopener noreferrer" className={isLink ? "text-primary hover:underline break-all" : "break-all"}>{text}</Link> : <span className="break-words">{text}</span>}
  </div>
);

const ResumeDisplaySection = ({ title, items, renderItem, isBadgeList }: { title: string, items: any[], renderItem: (item: any) => React.ReactNode, isBadgeList?: boolean }) => (
  <div>
    <h3 className="font-semibold text-lg border-b pb-2 mb-3">{title}</h3>
    <div className={isBadgeList ? "flex flex-wrap gap-2" : "space-y-3"}>
      {items.map((item, index) => <div key={index}>{renderItem(item)}</div>)}
    </div>
  </div>
);
