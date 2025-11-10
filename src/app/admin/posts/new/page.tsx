
"use client";

import React, { useState, useEffect } from 'react';
import { CreatePostForm } from '@/components/content/create-post-form';
import type { Post, PostAttachment } from '@/types';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { NewPostToast } from '@/components/notifications/new-post-toast';
import { SimpleRotatingSpinner } from '@/components/ui/loading-spinners';
import { supabase } from '@/lib/supabase';

const getInitials = (name?: string | null) => {
  if (!name) return "??";
  const parts = name.split(" ");
  if (parts.length > 1) {
    return (parts[0][0] + (parts[parts.length - 1][0] || '')).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Function to create notifications for new posts
const createNotificationsForNewPost = async (post: Post) => {
  try {
    console.log('🔔 Starting notification creation for post:', post.title);

    // Get all users who should receive this notification
    const { data: users, error } = await supabase
      .from('user_profiles')
      .select('id, role, branch, semester')
      .in('role', ['student', 'faculty', 'alumni']);

    console.log('🔔 Fetched users:', users?.length || 0, 'users');

    if (error) {
      console.error('❌ Error fetching users for notifications:', error);
      return;
    }

    if (!users || users.length === 0) {
      console.log('⚠️ No users found to notify');
      return;
    }

    // Filter users based on post targeting
    let targetUsers = users;

    if (post.targetBranches && post.targetBranches.length > 0) {
      console.log('🎯 Filtering by branches:', post.targetBranches);
      targetUsers = users.filter(user =>
        user.branch && post.targetBranches!.includes(user.branch)
      );
      console.log('🎯 Target users after branch filter:', targetUsers.length);
    }

    if (targetUsers.length === 0) {
      console.log('⚠️ No users match the target criteria');
      return;
    }

    // Create notification data
    const notifications = targetUsers.map(user => ({
      id: `${user.id}-${post.id}-${Date.now()}`, // Generate unique ID
      user_id: user.id, // This should be the UUID from user_profiles.id
      type: 'event',
      title: `New ${post.category}: ${post.title}`,
      message: post.content.length > 100
        ? `${post.content.substring(0, 100)}...`
        : post.content,
      href: '/feed',
      read: false
      // created_at will be set by default
    }));

    console.log('📝 Created notification objects:', notifications.length);

    // Insert notifications into database
    const { error: insertError, data } = await supabase
      .from('notifications')
      .insert(notifications)
      .select();

    if (insertError) {
      console.error('❌ Error creating notifications:', insertError);
      console.error('❌ Insert error details:', JSON.stringify(insertError, null, 2));
    } else {
      console.log('✅ Successfully created notifications:', data?.length || 0);
      console.log('✅ Notification data:', data);
    }
  } catch (error) {
    console.error('❌ Error in createNotificationsForNewPost:', error);
    console.error('❌ Full error:', error);
  }
};

export default function AdminCreatePostPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [pageLoading, setPageLoading] = useState(true);
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'admin') {
        router.push(user ? '/dashboard' : '/login');
      }
      setPageLoading(false);
    }
  }, [user, authLoading, router]);

  const handleFormSubmit = async (postData: Post, attachmentsToUpload: File[]) => {
    setFormSubmitting(true);
    try {
      console.log("Post data to save:", {...postData, likes: postData.likes || []});
      console.log("Files to 'upload':", attachmentsToUpload.map(f => ({ name: f.name, type: f.type, size: f.size })));

      if (typeof window !== 'undefined') {
        const existingPostsStr = localStorage.getItem('apsconnect_posts'); 
        const existingPosts: Post[] = existingPostsStr ? JSON.parse(existingPostsStr) : [];
        
        const finalPostData = {...postData, likes: postData.likes || []};

        const postIndex = existingPosts.findIndex(p => p.id === finalPostData.id);
        if (postIndex > -1) {
            existingPosts[postIndex] = finalPostData; 
        } else {
            existingPosts.push(finalPostData); 
        }
        localStorage.setItem('apsconnect_posts', JSON.stringify(existingPosts)); 

        // Create notifications for users about this new post
        console.log('📢 About to create notifications for post:', postData.title);
        try {
          // First, create a test notification for the current admin user
          if (user) {
            console.log('🧪 Creating test notification for current user');
            const testNotification = {
              id: `test-${user.uid}-${Date.now()}`,
              user_id: user.uid,
              type: 'event',
              title: 'Test: System Working',
              message: 'This confirms notifications are working for admin users.',
              href: '/feed',
              read: false
            };

            const { error: testError } = await supabase
              .from('notifications')
              .insert(testNotification);

            if (testError) {
              console.error('❌ Test notification failed:', testError);
            } else {
              console.log('✅ Test notification created successfully');
            }
          }

          // Then create notifications for all users
          await createNotificationsForNewPost(postData);
          console.log('✅ Notification creation completed');
        } catch (error) {
          console.error('❌ Error creating notifications for new post:', error);
          // Don't fail the post creation if notifications fail
        }

        toast({
          variant: "raw",
          description: (
            <NewPostToast
              authorName={postData.authorName}
              authorInitials={getInitials(postData.authorName)}
              postCategory={postData.category}
              postTitle={postData.title}
              timestamp={postData.createdAt}
            />
          ),
          duration: 3000, 
        });
        router.push('/admin'); 
      }
    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        title: "Error Creating Post",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  if (pageLoading || authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <SimpleRotatingSpinner className="h-12 w-12 text-primary" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Card className="w-full max-w-md mx-auto shadow-xl">
          <CardHeader>
            <CardTitle className="text-destructive text-xl sm:text-2xl">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <ShieldCheck className="h-12 w-12 sm:h-16 sm:w-16 text-destructive mx-auto mb-4" />
            <p className="text-md sm:text-lg text-muted-foreground">You do not have permission to view this page.</p>
            <Link href="/dashboard"><Button variant="outline" className="mt-6">Go to Dashboard</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="outline" size="icon" onClick={() => router.back()} aria-label="Go back">
            <ArrowLeft className="h-4 w-4" />
        </Button>
      </div>
      <CreatePostForm 
        onFormSubmit={handleFormSubmit} 
        isLoading={formSubmitting}
        formTitle="Admin: Create New Post"
        formDescription="Craft announcements, news, events, or share resources for the campus community."
      />
    </div>
  );
}
