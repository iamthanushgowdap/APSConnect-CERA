"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ParticleBackground from "@/components/ui/particle-background";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  MapPin,
  Briefcase,
  Video,
  BookOpen,
  GraduationCap,
  Building,
  MessageSquare,
  ArrowLeft,
  Sparkles,
  Clock
} from 'lucide-react';
import { ComingSoonDialog } from '@/components/ui/coming-soon-dialog';

const features = [
  {
    id: 'campus-map',
    title: 'Campus Map',
    description: 'Interactive campus navigation and location finder',
    icon: <MapPin className="h-8 w-8" />,
    link: '/campus-map',
    color: 'text-blue-500'
  },
  {
    id: 'skill-build',
    title: 'Skill Build Courses',
    description: 'Enhance your skills with online courses and certifications',
    icon: <Briefcase className="h-8 w-8" />,
    link: '/skill-build-courses',
    color: 'text-green-500'
  },
  {
    id: 'zoom-meetings',
    title: 'Zoom Meeting Integration',
    description: 'Join virtual classes and meetings seamlessly',
    icon: <Video className="h-8 w-8" />,
    link: '/zoom-meetings',
    color: 'text-purple-500'
  },
  {
    id: 'library',
    title: 'Library Management',
    description: 'Access digital library resources and manage book loans',
    icon: <BookOpen className="h-8 w-8" />,
    link: '/library',
    color: 'text-orange-500'
  },
  {
    id: 'results-grades',
    title: 'Results & Grades',
    description: 'View your academic performance and grade reports',
    icon: <GraduationCap className="h-8 w-8" />,
    link: '/results-grades',
    color: 'text-red-500'
  },
  {
    id: 'placement-portal',
    title: 'Placement Portal',
    description: 'Find job opportunities and career guidance',
    icon: <Building className="h-8 w-8" />,
    link: '/placement-portal',
    color: 'text-indigo-500'
  },
  {
    id: 'polls-feedback',
    title: 'Polls & Feedback',
    description: 'Share your opinions and provide feedback',
    icon: <MessageSquare className="h-8 w-8" />,
    link: '/polls-feedback',
    color: 'text-pink-500'
  }
];

export default function ComingSoonPage() {
  const router = useRouter();
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  const handleFeatureClick = (featureId: string) => {
    setSelectedFeature(featureId);
  };

  const closeDialog = () => {
    setSelectedFeature(null);
  };

  const selectedFeatureData = features.find(f => f.id === selectedFeature);

  return (
    <div className="container mx-auto px-4 py-8 relative overflow-hidden">
      {/* Particle background animation */}
      <ParticleBackground />

      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center relative z-10">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-primary mb-2">
            Coming Soon Features
          </h1>
          <p className="text-lg text-muted-foreground">
            Exciting new features we're developing for your campus experience
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={() => router.back()} aria-label="Go back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {features.map((feature) => (
          <Card key={feature.id} className="shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out cursor-pointer hover:border-primary/50" onClick={() => handleFeatureClick(feature.id)}>
            <CardHeader className="pb-4 pt-5 px-5">
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-full bg-accent/10 dark:bg-accent/20`}>
                  <div className={feature.color}>
                    {feature.icon}
                  </div>
                </div>
                <div>
                  <CardTitle className="text-lg sm:text-xl font-semibold text-foreground">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-sm mt-1 text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm sm:text-base py-3 rounded-lg">
                <Sparkles className="mr-2 h-4 w-4" />
                Explore Feature
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <div className="inline-flex items-center space-x-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
          <Clock className="h-4 w-4" />
          <span>These features are currently under development</span>
        </div>
      </div>

      <ComingSoonDialog
        isOpen={!!selectedFeature}
        onClose={closeDialog}
        featureName={selectedFeatureData?.title || 'Feature'}
      />
    </div>
  );
}
