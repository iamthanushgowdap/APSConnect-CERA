"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, Sparkles } from 'lucide-react';

interface ComingSoonDialogProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
}

export function ComingSoonDialog({ isOpen, onClose, featureName }: ComingSoonDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl font-semibold">
            {featureName} - Coming Soon!
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            We're working hard to bring you this amazing feature. Stay tuned for updates!
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4" />
          <span>Feature under development</span>
        </div>
        <div className="flex justify-center mt-4">
          <Button onClick={onClose} className="w-full">
            Got it!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
