"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin } from 'lucide-react';
import { ComingSoonDialog } from '@/components/ui/coming-soon-dialog';

export default function CampusMapPage() {
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
            <MapPin className="mr-3 h-8 w-8" />
            Campus Map
          </h1>
          <p className="text-lg text-muted-foreground">
            Navigate and explore your campus with our interactive map
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={goToDashboard} aria-label="Go back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-center">Interactive Campus Navigation</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <div className="text-muted-foreground">
            <MapPin className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Campus Map feature is coming soon!</p>
            <p className="text-sm mt-2">Navigate buildings, find classrooms, and explore your campus.</p>
          </div>
        </CardContent>
      </Card>

      <ComingSoonDialog
        isOpen={showDialog}
        onClose={closeDialog}
        featureName="Campus Map"
      />
    </div>
  );
}
