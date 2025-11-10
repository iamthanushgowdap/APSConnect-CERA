
"use client";

import React from 'react';
import type { StudyMaterial, StudyMaterialAttachment } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Download, Paperclip } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { AnimatedDownloadButton } from '@/components/ui/animated-download-button';

interface StudyMaterialItemProps {
  material: StudyMaterial;
}

export function StudyMaterialItem({ material }: StudyMaterialItemProps) {
  const { toast } = useToast();

  const handleDownload = (attachment: StudyMaterialAttachment) => {
    try {
      if (attachment.base64Content) {
        // Convert base64 data URL to blob
        const base64Data = attachment.base64Content.split(',')[1]; // Remove data URL prefix
        const binaryData = atob(base64Data); // Decode base64
        const bytes = new Uint8Array(binaryData.length);
        for (let i = 0; i < binaryData.length; i++) {
          bytes[i] = binaryData.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: attachment.type });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = attachment.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        toast({ title: "Download Started", description: `Downloading ${attachment.name}...`, duration: 3000 });
      } else {
        // Fallback to mock content if no base64 content available
        toast({ title: "Download Error", description: `File content not available for ${attachment.name}`, variant: "destructive", duration: 3000 });
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({ title: "Download Error", description: `Failed to download ${attachment.name}`, variant: "destructive", duration: 3000 });
    }
  };

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl overflow-hidden">
      <CardHeader className="pb-3 pt-5 px-5 border-b">
        <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-md">
                 <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
                <CardTitle className="text-lg font-semibold text-primary leading-tight">{material.title}</CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Branch: <Badge variant="outline" className="mr-1">{material.branch}</Badge>
                    Semester: <Badge variant="secondary">{material.semester}</Badge>
                </CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="px-5 py-4">
        {material.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{material.description}</p>
        )}
        {material.attachments.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-foreground mb-1.5">Files:</h4>
            <div className="space-y-1.5">
              {material.attachments.map((att) => (
                <AnimatedDownloadButton
                  key={att.mockFileId}
                  onClick={() => handleDownload(att)}
                  fileName={att.name}
                  fileSize={att.size}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground px-5 py-3 border-t bg-muted/30">
        Uploaded by {material.uploaded_by_display_name} &bull; {material.created_at ? formatDistanceToNow(parseISO(material.created_at), { addSuffix: true }) : 'Unknown date'}
      </CardFooter>
    </Card>
  );
}
