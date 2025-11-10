"use client";

import React from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { ArrowRight } from 'lucide-react';

interface ActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
  actionText: string;
  disabled?: boolean;
}

export function ActionCard({ title, description, icon, link, actionText, disabled = false }: ActionCardProps) {
  return (
    <div className="relative">
      <Card className={`shadow-xl hover:shadow-2xl transition-all duration-300 ease-in-out flex flex-col rounded-xl border relative overflow-hidden ${disabled ? 'opacity-60 bg-muted/30 dark:bg-muted/10 pointer-events-none' : 'bg-card border-border/70 hover:border-primary/50'}`}>
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={disabled}
          proximity={80}
          inactiveZone={0.01}
          borderWidth={4}
          movementDuration={1.8}
        />
        <CardHeader className="pb-4 pt-5 px-5 relative z-10">
          <div className="flex items-start space-x-4">
            <div className={`p-3 rounded-full ${disabled ? 'bg-muted dark:bg-muted/30' : 'bg-accent/10 dark:bg-accent/20'}`}>
              {icon}
            </div>
            <div>
              <CardTitle className="text-lg sm:text-xl font-semibold text-foreground">{title}</CardTitle>
              <CardDescription className="text-sm mt-1 text-muted-foreground">{description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col justify-end mt-auto px-5 pb-5 relative z-10">
          <Link href={disabled ? "#" : link} className={`w-full ${disabled ? 'pointer-events-none' : ''}`}>
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm sm:text-base py-3 rounded-lg" disabled={disabled}>
              {actionText} <ArrowRight className="ml-2 h-4 w-4"/>
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
