
"use client";

import React from 'react';
import type { Assignment, AssignmentAttachment } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookMarked, Calendar, Download, Eye } from 'lucide-react';
import { downloadFile } from '@/lib/supabase-utils';
import { useToast } from '@/hooks/use-toast';
import { AnimatedDownloadButton } from '@/components/ui/animated-download-button';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface AssignmentItemProps {
  assignment: Assignment;
}

export function AssignmentItem({ assignment }: AssignmentItemProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const handleDownload = async (attachment: AssignmentAttachment) => {
    try {
      toast({ title: "Download Started", description: `Downloading ${attachment.name}...`, duration: 3000 });
      const blob = await downloadFile('chat-attachments', attachment.filePath);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = attachment.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      toast({ title: "Download Complete", description: `${attachment.name} downloaded successfully.`, duration: 2000 });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({ title: "Download Failed", description: `Failed to download ${attachment.name}.`, variant: "destructive" });
    }
  };

  const isPastDue = assignment.due_date && !isNaN(new Date(assignment.due_date).getTime()) && new Date(assignment.due_date) < new Date();

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl overflow-hidden">
      <CardHeader className="pb-3 pt-5 px-5 border-b">
        <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-md">
                 <BookMarked className="h-6 w-6 text-primary" />
            </div>
            <div>
                <CardTitle className="text-lg font-semibold text-primary leading-tight">{assignment.title}</CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Posted by {assignment.instructor_name}
                </CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="px-5 py-4">
        {assignment.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{assignment.description}</p>
        )}
         {assignment.due_date && (
          <div className={`flex items-center text-sm mb-4 ${isPastDue ? 'text-destructive' : 'text-foreground'}`}>
            <Calendar className="h-4 w-4 mr-2" />
            <span>Due: {format(new Date(assignment.due_date), "PPP")}</span>
            {isPastDue && <Badge variant="destructive" className="ml-2">Past Due</Badge>}
          </div>
        )}
        {assignment.attachments.length > 0 && (
          <div className="flex justify-center">
            <div className="flex flex-col items-center space-y-2">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs">
                    <Eye className="h-3 w-3 mr-1" /> View Details
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{assignment.title}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {assignment.description && (
                      <p className="text-sm text-muted-foreground">{assignment.description}</p>
                    )}
                    {assignment.due_date && (
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>Due: {format(new Date(assignment.due_date), "PPP")}</span>
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Attachments:</h4>
                      <div className="space-y-2">
                        {assignment.attachments.map((att, index) => (
                          <div key={att.filePath} className="flex items-center justify-between p-2 border rounded">
                            <span className="text-xs">{att.name}</span>
                            <Button variant="ghost" size="sm" onClick={() => handleDownload(att)}>
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <div className="flex flex-wrap justify-center gap-1">
                {assignment.attachments.map((att) => (
                  <div key={att.filePath} className="scale-75">
                    <AnimatedDownloadButton
                      onClick={() => handleDownload(att)}
                      fileName={att.name}
                      fileSize={att.size}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground px-5 py-3 border-t bg-muted/30">
        Posted {assignment.posted_at && !isNaN(new Date(assignment.posted_at).getTime()) ? formatDistanceToNow(parseISO(assignment.posted_at), { addSuffix: true }) : 'recently'}
      </CardFooter>
    </Card>
  );
}
