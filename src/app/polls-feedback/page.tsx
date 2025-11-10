"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { ComingSoonDialog } from '@/components/ui/coming-soon-dialog';

export default function PollsFeedbackPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [showDialog, setShowDialog] = useState(true);

  const goToDashboard = () => {
    if (!user) return;
    
    // Navigate to role-specific dashboard
    switch (user.role) {
      case 'admin':
        router.push('/admin');
        break;
      case 'faculty':
        router.push('/faculty');
        break;
      case 'student':
      case 'alumni':
      default:
        router.push('/student');
        break;
    }
  };

  const closeDialog = () => {
    setShowDialog(false);
    router.back();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-primary mb-2 flex items-center">
            <MessageSquare className="mr-3 h-8 w-8" />
            Polls & Feedback
          </h1>
          <p className="text-lg text-muted-foreground">
            Share your opinions and provide feedback
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={goToDashboard} aria-label="Go back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-center">Community Engagement Platform</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <div className="text-muted-foreground">
            <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Polls & Feedback feature is coming soon!</p>
            <p className="text-sm mt-2">Participate in polls, share feedback, and engage with the community.</p>
          </div>
        </CardContent>
      </Card>

      <ComingSoonDialog
        isOpen={showDialog}
        onClose={closeDialog}
        featureName="Polls & Feedback"
      />
    </div>
  );
}
