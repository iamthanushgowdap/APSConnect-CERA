
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Briefcase } from 'lucide-react';
import { ComingSoonDialog } from '@/components/ui/coming-soon-dialog';

export default function StudentSkillBuildCoursesPage() {
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(true);

  const closeDialog = () => {
    setShowDialog(false);
    router.back();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-primary mb-2 flex items-center">
            <Briefcase className="mr-3 h-8 w-8" />
            Skill Build Courses
          </h1>
          <p className="text-lg text-muted-foreground">
            Enhance your skills with online courses and certifications
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={() => router.back()} aria-label="Go back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-center">Online Learning Platform</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <div className="text-muted-foreground">
            <Briefcase className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Skill Build Courses feature is coming soon!</p>
            <p className="text-sm mt-2">Access online courses, certifications, and skill development resources.</p>
          </div>
        </CardContent>
      </Card>

      <ComingSoonDialog
        isOpen={showDialog}
        onClose={closeDialog}
        featureName="Skill Build Courses"
      />
    </div>
  );
}
