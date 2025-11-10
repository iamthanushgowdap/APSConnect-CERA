
"use client";

import React, { useState, useEffect } from 'react';
import type { UserProfile, Subject } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { RoleBadge } from '@/components/ui/role-badge';
import { Mail, Briefcase, Award, GraduationCap, Users, BookOpen, User as UserIcon } from 'lucide-react';
import { getInitials } from '@/components/content/post-item-utils';
import { SUBJECT_STORAGE_KEY } from '@/types';

interface UserProfileCardProps {
  profile: UserProfile;
}

export function UserProfileCard({ profile }: UserProfileCardProps) {
    const [assignedSubjects, setAssignedSubjects] = useState<Subject[]>([]);

    useEffect(() => {
        if (profile.role === 'faculty' && typeof window !== 'undefined') {
            const allSubjectsStr = localStorage.getItem(SUBJECT_STORAGE_KEY);
            const allSubjects: Subject[] = allSubjectsStr ? JSON.parse(allSubjectsStr) : [];
            const facultySubjects = allSubjects.filter(subject => subject.assignedFacultyUids?.includes(profile.id));
            setAssignedSubjects(facultySubjects);
        }
    }, [profile]);

  const isAlumni = profile.role === 'alumni';

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg h-full">
      <CardHeader className="flex flex-row items-center space-x-4 pb-3">
        <Avatar className="h-16 w-16">
          <AvatarImage src={profile.avatar_url} alt={profile.display_name || profile.email} data-ai-hint="person avatar" />
          <AvatarFallback className="text-xl bg-muted text-muted-foreground">
            {getInitials(profile.display_name || profile.email)}
          </AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-lg font-semibold">{profile.full_name || 'N/A'}</CardTitle>
          <CardDescription className="text-sm">
            <RoleBadge role={profile.role} size="sm" />
            {profile.role === 'student' && !isAlumni && <span className="text-xs text-muted-foreground">USN: {profile.student_id || profile.usn || 'Not provided'}</span>}
             {profile.pronouns && <span className="text-xs text-muted-foreground ml-1">({profile.pronouns})</span>}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="text-sm space-y-2 pt-2">
        <div className="flex items-center text-muted-foreground">
          <Mail className="h-4 w-4 mr-2" />
          <span>{profile.email}</span>
        </div>
        {profile.role === 'student' && profile.branch && (
          <div className="flex items-center text-muted-foreground">
            <GraduationCap className="h-4 w-4 mr-2" />
            <span>{profile.branch} - {profile.semester}</span>
          </div>
        )}
        {isAlumni && (
          <>
            {profile.placement_company && (
                 <div className="flex items-center text-muted-foreground">
                    <Briefcase className="h-4 w-4 mr-2" />
                    <span>{profile.placement_company}</span>
                </div>
            )}
            {profile.placement_job_title && (
                 <div className="flex items-center text-muted-foreground">
                    <UserIcon className="h-4 w-4 mr-2" />
                    <span>{profile.placement_job_title}</span>
                </div>
            )}
          </>
        )}
        {profile.role === 'faculty' && (
          <>
            {profile.faculty_title && (
              <div className="flex items-center text-muted-foreground">
                <Briefcase className="h-4 w-4 mr-2" />
                <span>{profile.faculty_title}</span>
              </div>
            )}
            {profile.assigned_branches && profile.assigned_branches.length > 0 && (
              <div className="flex items-center text-muted-foreground">
                <Users className="h-4 w-4 mr-2" />
                <span>Branches: {profile.assigned_branches.join(', ')}</span>
              </div>
            )}
            {profile.assigned_semesters && profile.assigned_semesters.length > 0 && (
                <div className="flex items-center text-muted-foreground">
                    <BookOpen className="h-4 w-4 mr-2" />
                    <span>Semesters: {profile.assigned_semesters.join(', ')}</span>
                </div>
            )}
            {assignedSubjects.length > 0 && (
                 <div className="flex items-start text-muted-foreground">
                    <BookOpen className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                        <span>Subjects:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {assignedSubjects.map(s => (
                                <Badge key={s.id} variant="outline" className="font-normal bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700">
                                    {s.name} ({s.code}) - {s.branch}/{s.semester}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>
            )}
          </>
        )}
         {profile.role === 'pending' && (
          <div className={`flex items-center ${profile.rejection_reason ? 'text-red-600' : 'text-yellow-600'}`}>
            <Award className="h-4 w-4 mr-2" />
            <span>Status: Pending {profile.rejection_reason ? `(Rejected: ${profile.rejection_reason.substring(0,30)}...)` : '(Awaiting Approval)'}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
