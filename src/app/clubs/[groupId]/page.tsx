"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth, User } from '@/components/auth-provider';
import type { Group, GroupMessage, UserProfile } from '@/types';
import { supabase } from '@/lib/supabase';
import { getGroupById, getGroupMembers, canUserPostInGroup } from '@/lib/groups-utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ShieldCheck, ArrowLeft, Send, Users, Info, Shield, MessageSquare, RefreshCw } from 'lucide-react';
import { SimpleRotatingSpinner } from '@/components/ui/loading-spinners';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { SupabaseStorage, UploadedFile } from '@/lib/supabase-storage';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getInitials } from '@/components/content/post-item-utils';
import { useToast } from '@/hooks/use-toast';

export default function GroupChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const groupId = (params as any)?.groupId as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<GroupMessage[]>([]);

  const chatMessages = useMemo(() => {
    console.log('🔄 Processing messages for ChatInterface:', messages.length);

    const processed = messages.map(msg => {
      console.log('🔄 Processing message:', msg.id, msg.content?.substring(0, 50));

      // Parse attachments if it's a string
      let parsedAttachments = msg.attachments;
      if (typeof msg.attachments === 'string') {
        try {
          parsedAttachments = JSON.parse(msg.attachments);
        } catch (e) {
          parsedAttachments = [];
        }
      }

      // Log file information for debugging
      if (parsedAttachments && Array.isArray(parsedAttachments) && parsedAttachments.length > 0) {
        console.log('📎 Message attachments:', parsedAttachments.map(att => ({
          name: att.name,
          url: att.url.substring(0, 50) + '...',
          uploaded: att.uploaded,
          isSupabaseUrl: att.url.includes('supabase')
        })));
      }

      // Parse timestamp properly
      let parsedTimestamp = msg.timestamp;
      if (typeof msg.timestamp === 'string') {
        try {
          // Convert database timestamp to ISO format if needed
          const date = new Date(msg.timestamp);
          parsedTimestamp = date.toISOString();
        } catch (e) {
          console.error('Failed to parse timestamp for message:', msg.id, e);
        }
      }

      const processedMessage = {
        id: msg.id,
        avatarUrl: msg.author_avatar_url,
        nickName: msg.author_name,
        content: msg.content,
        type: (msg.author_uid === user?.uid ? 'me' : 'other') as 'me' | 'other',
        timestamp: parsedTimestamp,
        messageType: (msg.message_type || 'text') as 'text' | 'image' | 'audio' | 'document' | 'gallery' | 'url',
        mediaUrl: msg.file_url,
        fileName: msg.file_name,
        fileSize: msg.file_size,
        fileType: msg.file_type,
        author_uid: msg.author_uid, // Add author_uid for avatar fetching
        attachments: parsedAttachments,
        status: 'delivered' as const,
        reactions: msg.reactions || [] // Use database reactions or empty array
      };

      console.log('✅ Processed message:', processedMessage.id, processedMessage.content?.substring(0, 30));
      return processedMessage;
    });

    console.log('📊 Total messages processed:', processed.length);
    console.log('📋 Chat messages sample:', processed.slice(0, 2).map((m: any) => ({ id: m.id, content: m.content?.substring(0, 20) })));

    return processed as any;
  }, [messages, user?.uid]);

  const handleEmojiClick = (messageId: string) => {
    // Placeholder for emoji reactions
    console.log('Emoji clicked for message:', messageId);
  };

  const handleCopyMessage = (messageId: string) => {
    const message = messages.find(msg => msg.id === messageId);
    if (message) {
      navigator.clipboard.writeText(message.content);
      toast({ title: "Copied", description: "Message copied to clipboard." });
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    console.log('🗑️ [DELETE START] Attempting to delete message:', messageId);

    try {
      // Find the message to check ownership
      const message = messages.find(msg => msg.id === messageId);
      console.log('🔍 [DELETE CHECK] Message found in local state:', !!message);

      if (!message) {
        console.error('❌ [DELETE FAILED] Message not found in local state');
        toast({
          title: "Not Found",
          description: "Message not found.",
          variant: "destructive"
        });
        return;
      }

      console.log('👤 [DELETE CHECK] Message author:', message.author_uid, 'Current user:', user?.uid);

      // Check if user is the message author
      if (message.author_uid !== user?.uid) {
        console.error('🚫 [DELETE DENIED] User is not the message author');
        toast({
          title: "Permission Denied",
          description: "You can only delete your own messages.",
          variant: "destructive"
        });
        return;
      }

      console.log('✅ [DELETE PERMISSION] Permission check passed');

      // First, let's verify the message exists in the database before deleting
      console.log('🔍 [DELETE VERIFY] Checking if message exists in database...');
      const { data: existingMessage, error: checkError } = await supabase
        .from('group_messages')
        .select('id, author_uid, content')
        .eq('id', messageId)
        .single();

      if (checkError) {
        console.error('❌ [DELETE CHECK FAILED] Error checking message existence:', checkError);
        toast({
          title: "Database Error",
          description: "Could not verify message exists.",
          variant: "destructive"
        });
        return;
      }

      if (!existingMessage) {
        console.error('❌ [DELETE NOT FOUND] Message does not exist in database');
        toast({
          title: "Not Found",
          description: "Message no longer exists in database.",
          variant: "destructive"
        });
        return;
      }

      console.log('✅ [DELETE VERIFY] Message exists in database:', existingMessage.id);

      // Delete from database immediately
      console.log('💥 [DELETE EXECUTE] Executing delete query...');
      const { error } = await supabase
        .from('group_messages')
        .delete()
        .eq('id', messageId);

      if (error) {
        console.error('❌ [DELETE DATABASE FAILED] Database delete error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        toast({
          title: "Delete Failed",
          description: `Database error: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      console.log('✅ [DELETE DATABASE SUCCESS] Message deleted from database');

      // Verify deletion by checking if message still exists
      console.log('🔍 [DELETE VERIFY DELETION] Verifying message was deleted...');
      const { data: verifyDeleted, error: verifyError } = await supabase
        .from('group_messages')
        .select('id')
        .eq('id', messageId)
        .single();

      if (verifyDeleted) {
        console.error('❌ [DELETE VERIFICATION FAILED] Message still exists after delete!');
        toast({
          title: "Delete Verification Failed",
          description: "Message may not have been properly deleted.",
          variant: "destructive"
        });
      } else {
        console.log('✅ [DELETE VERIFICATION SUCCESS] Message confirmed deleted');
      }

      // Immediately remove from local state to update UI instantly
      console.log('🎨 [DELETE UI UPDATE] Updating local state...');
      const beforeCount = messages.length;
      setMessages(prevMessages => {
        const updatedMessages = prevMessages.filter(msg => msg.id !== messageId);
        console.log('📊 [DELETE UI UPDATE] Messages before:', beforeCount, 'after:', updatedMessages.length);
        return updatedMessages;
      });

      console.log('🎉 [DELETE COMPLETE] Message deletion process finished successfully');

      toast({
        title: "Deleted",
        description: "Message deleted successfully."
      });

    } catch (error) {
      console.error('❌ [DELETE EXCEPTION] Unexpected error during delete:', error);
      toast({
        title: "Error",
        description: "Failed to delete message.",
        variant: "destructive"
      });
    }
  };

  const handleShareMessage = (messageId: string) => {
    const message = messages.find(msg => msg.id === messageId);
    if (message && navigator.share) {
      navigator.share({
        title: 'Shared Message',
        text: message.content,
      });
    } else {
      handleCopyMessage(messageId);
    }
  };

  const handleAddReaction = async (messageId: string, emoji: string) => {
    try {
      console.log('😊 Adding reaction:', emoji, 'to message:', messageId);

      // Get current message
      const currentMessage = messages.find(msg => msg.id === messageId);
      if (!currentMessage) {
        console.error('❌ Message not found:', messageId);
        return;
      }

      const currentUser = user?.uid || "user1";
      const existingReactions = currentMessage.reactions || [];
      const existingReaction = existingReactions.find(r => r.emoji === emoji);

      let updatedReactions;

      if (existingReaction) {
        // Toggle reaction
        const userHasReacted = existingReaction.users.includes(currentUser);
        const updatedUsers = userHasReacted
          ? existingReaction.users.filter(id => id !== currentUser)
          : [...existingReaction.users, currentUser];

        updatedReactions = updatedUsers.length > 0
          ? existingReactions.map(r =>
              r.emoji === emoji
                ? { ...r, count: updatedUsers.length, users: updatedUsers }
                : r
            )
          : existingReactions.filter(r => r.emoji !== emoji);

        console.log('🔄 Toggled reaction:', userHasReacted ? 'removed' : 'added', emoji);
      } else {
        // Add new reaction
        updatedReactions = [
          ...existingReactions,
          { emoji, count: 1, users: [currentUser] }
        ];
        console.log('➕ Added new reaction:', emoji);
      }

      console.log('💾 Saving reactions to database:', updatedReactions);

      // Update in database
      const { error } = await supabase
        .from('group_messages')
        .update({ reactions: updatedReactions })
        .eq('id', messageId);

      if (error) {
        console.error('❌ Error updating reaction in database:', error);
        return;
      }

      console.log('✅ Reaction saved to database successfully');

      // Update local state
      setMessages(prevMessages =>
        prevMessages.map(msg => {
          if (msg.id === messageId) {
            return {
              ...msg,
              reactions: updatedReactions
            };
          }
          return msg;
        })
      );

      toast({ title: "Reaction updated", description: `Updated ${emoji} reaction.` });
    } catch (error) {
      console.error('❌ Error handling reaction:', error);
      toast({
        title: "Error",
        description: "Failed to update reaction.",
        variant: "destructive"
      });
    }
  };

  const [canPost, setCanPost] = useState(false);

  // Debug function to check Supabase storage status
  const debugStorageStatus = async () => {
    console.log('🔍 === SUPABASE STORAGE DEBUG ===');

    try {
      // Check if we can list buckets
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();

      if (listError) {
        console.error('❌ Cannot list buckets:', listError);
        return;
      }

      console.log('📦 Available buckets:', buckets.map(b => b.name));

      const chatBucket = buckets.find(b => b.name === 'chat-attachments');
      if (!chatBucket) {
        console.error('❌ chat-attachments bucket does NOT exist!');
        console.log('🚨 MANUAL ACTION REQUIRED: Create chat-attachments bucket in Supabase dashboard');
        return;
      }

      console.log('✅ chat-attachments bucket exists:', chatBucket);

      // Try to list files in the bucket
      const { data: files, error: filesError } = await supabase.storage
        .from('chat-attachments')
        .list();

      if (filesError) {
        console.error('❌ Cannot list files in bucket:', filesError);
        console.log('🚨 This suggests RLS policies are blocking access');
      } else {
        console.log('📄 Files in bucket:', files.length);
        if (files.length > 0) {
          console.log('📋 Sample files:', files.slice(0, 3).map(f => f.name));
        } else {
          console.log('📭 Bucket is empty - no files uploaded yet');
        }
      }

    } catch (error) {
      console.error('❌ Storage debug failed:', error);
    }

    console.log('🔍 === END STORAGE DEBUG ===');
  };

  // Test Supabase URL accessibility
  const testSupabaseUrl = async (url: string) => {
    try {
      console.log('🧪 Testing Supabase URL:', url);
      const response = await fetch(url, { method: 'HEAD' });
      console.log('📡 Response status:', response.status);
      console.log('📡 Content-Type:', response.headers.get('content-type'));
      console.log('📡 Content-Length:', response.headers.get('content-length'));
      return response.ok;
    } catch (error) {
      console.error('❌ URL test failed:', error);
      return false;
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFileClick = () => {
    // Placeholder for file attachment
    console.log('File attachment clicked');
  };

  const loadMessages = useCallback(async () => {
    try {
      console.log('📥 Loading messages for group:', groupId);

      // First check if there are any messages at all
      const { count, error: countError } = await supabase
        .from('group_messages')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId);

      console.log('📊 Total messages in database for this group:', count);

      if (countError) {
        console.error('❌ Count error:', countError);
      }

      const { data: groupMessages, error } = await supabase
        .from('group_messages')
        .select('*')
        .eq('group_id', groupId)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('❌ Error loading messages:', error);
        return;
      }

      console.log('📦 Raw messages from database:', groupMessages?.length || 0);
      if (groupMessages && groupMessages.length > 0) {
        console.log('📋 Sample raw messages:', groupMessages.slice(0, 2).map(m => ({
          id: m.id,
          content: m.content?.substring(0, 30),
          author: m.author_name
        })));
      }

      setMessages(groupMessages || []);
      console.log('✅ Messages set in state:', groupMessages?.length || 0);
    } catch (error) {
      console.error('❌ Error in loadMessages:', error);
    }
  }, [groupId]);

  useEffect(() => {
    if (!authLoading) {
      // Add a small delay to allow auth state to fully initialize
      const timer = setTimeout(() => {
        if (!user) {
          console.log('🔐 No authenticated user found, redirecting to login');
          router.push('/login');
          return;
        }

        // Rest of the logic...
        const loadGroupData = async () => {
          const foundGroup = await getGroupById(groupId);
          if (foundGroup) {
            const groupMembers = await getGroupMembers(groupId);
            const isMember = groupMembers.some(m => m.id === user.uid);

            // Admins can access any group, especially official ones.
            const isAdmin = user.role === 'admin';

            if (isMember || isAdmin) {
              setGroup(foundGroup);
              setMembers(groupMembers);

              // Check if user can post in this group
              const canPostInGroup = await canUserPostInGroup(user.uid, groupId);
              setCanPost(canPostInGroup);
            } else {
              // Not a member, redirect
              toast({ title: "Access Denied", description: "You are not a member of this group.", variant: "destructive" });
              router.push('/clubs');
            }
          } else {
            toast({ title: "Group Not Found", variant: "destructive" });
            router.push('/clubs');
          }
          setPageLoading(false);
        };

        loadGroupData();
      }, 500); // Small delay to allow auth to initialize

      return () => clearTimeout(timer);
    }
  }, [groupId, user, authLoading, router, toast]);
  
  useEffect(() => {
    if (!authLoading && user && groupId) {
      // Load messages initially
      const loadInitialMessages = async () => {
        const { data: groupMessages, error } = await supabase
          .from('group_messages')
          .select('*')
          .eq('group_id', groupId)
          .order('timestamp', { ascending: true });

        if (error) {
          console.error('Error loading messages:', error);
        } else {
          setMessages(groupMessages || []);
        }
      };

      // Initialize storage bucket and load messages
      const initializeAndLoad = async () => {
        try {
          console.log('🔧 Initializing Supabase storage...');
          await SupabaseStorage.initializeBucket();
          console.log('✅ Storage initialization complete');
        } catch (error) {
          console.error('❌ Storage initialization failed:', error);
        }

        await loadInitialMessages();
      };

      initializeAndLoad();

      // Set up real-time subscription
      const channel = supabase
        .channel(`group_messages_${groupId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'group_messages',
            filter: `group_id=eq.${groupId}`,
          },
          (payload) => {
            console.log('Real-time message received:', payload.new.id, payload.new.content?.substring(0, 50));
            setMessages(prev => {
              // Check if message already exists to avoid duplicates
              const messageExists = prev.some(msg => msg.id === payload.new.id);
              if (messageExists) {
                console.log('📋 Message already exists, skipping duplicate:', payload.new.id);
                return prev;
              }

              console.log('➕ Adding new message to state:', payload.new.id);
              return [...prev, payload.new as GroupMessage];
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'group_messages',
            filter: `group_id=eq.${groupId}`,
          },
          (payload) => {
            console.log('Real-time message update received:', payload);
            setMessages(prev => prev.map(msg =>
              msg.id === payload.new.id ? payload.new as GroupMessage : msg
            ));
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'group_messages',
            filter: `group_id=eq.${groupId}`,
          },
          (payload) => {
            console.log('Real-time message delete received:', payload.old.id);
            setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
          }
        )
        .subscribe((status) => {
          console.log('Subscription status:', status);
        });

      // Cleanup subscription on unmount
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [authLoading, user, groupId]);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || !user || !group) return;

    try {
      // Fetch the current user's avatar from Supabase
      const { data: userProfile, error: avatarError } = await supabase
        .from('user_profiles')
        .select('avatar_url')
        .eq('id', user.uid)
        .single();

      let avatarUrl = null;
      if (!avatarError && userProfile?.avatar_url) {
        avatarUrl = userProfile.avatar_url;
        console.log('✅ Found avatar for message author:', user.uid, 'avatar exists:', !!avatarUrl);
      } else {
        console.log('⚠️ No avatar found for message author:', user.uid, 'using null');
      }

      const messageData: Omit<GroupMessage, 'id'> = {
        group_id: group.id,
        author_uid: user.uid,
        author_name: user.displayName || 'Unknown User',
        author_avatar_url: avatarUrl,
        content: message.trim(),
        timestamp: new Date().toISOString(),
      };

      const { data: savedMessage, error } = await supabase
        .from('group_messages')
        .insert(messageData)
        .select()
        .single();

      if (error) throw error;

      // Optimistically add message to local state for immediate UI update
      const optimisticMessage: GroupMessage = {
        ...savedMessage,
        reactions: [] // Initialize empty reactions array
      };
      setMessages(prev => [...prev, optimisticMessage]);

      // Create notifications for official group messages
      if (group.type === 'official') {
        try {
          console.log('🔔 Creating notifications for official group message');

          // Get all group members except the sender
          const otherMembers = members.filter(m => m.id !== user.uid);

          console.log('👥 Group members:', members.length, 'Other members:', otherMembers.length);

          if (otherMembers.length > 0) {
            // Check if notifications already exist for this message to avoid duplicates
            const existingNotifications = await supabase
              .from('notifications')
              .select('id')
              .like('id', `group-${group.id}-${savedMessage.id}-%`)
              .limit(1);

            if (existingNotifications.data && existingNotifications.data.length > 0) {
              console.log('⚠️ Notifications already exist for this message, skipping');
            } else {
              const notifications = otherMembers.map(member => ({
                id: `group-${group.id}-${savedMessage.id}-${member.id}-${Date.now()}`,
                user_id: member.id,
                type: 'group_message',
                title: `New message in ${group.name}`,
                message: `${user.displayName || 'Someone'} posted a message in ${group.name}`,
                href: `/clubs/${group.id}`,
                read: false
              }));

              console.log('📝 Creating notifications for members:', otherMembers.map(m => m.id));

              // Save notifications to database
              const { error: notifError } = await supabase
                .from('notifications')
                .insert(notifications);

              if (notifError) {
                console.error('❌ Error creating group message notifications:', notifError);
              } else {
                console.log(`✅ Created ${notifications.length} notifications for group message`);
              }
            }
          } else {
            console.log('⚠️ No other members to notify');
          }
        } catch (notifError) {
          console.error('❌ Exception in group message notification creation:', notifError);
        }
      }

      // Don't add message to state here - let real-time subscription handle it (but we already did optimistic update above)
      // setMessages(prev => [...prev, savedMessage]);
      setNewMessage('');
      setTimeout(scrollToBottom, 100);

      toast({ title: "Message sent", description: "Your message has been sent." });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleSendMessageWithFiles = async (message: string, files: File[]) => {
    if (!user || !group) return;

    try {
      setIsSending(true);

      console.log('📤 Starting file upload process for', files.length, 'files');

      // Upload files to Supabase storage
      const uploadedFiles = await SupabaseStorage.uploadFiles(files, user.uid);

      console.log('📦 Upload results:', uploadedFiles.map(f => ({
        name: f.name,
        uploaded: f.uploaded,
        url: f.url.substring(0, 50) + '...'
      })));

      // Check if any files failed to upload
      const failedUploads = uploadedFiles.filter(f => !f.uploaded);
      if (failedUploads.length > 0) {
        console.warn('⚠️  Some files failed to upload to Supabase:', failedUploads);
        toast({
          title: "Partial upload warning",
          description: `${failedUploads.length} files uploaded locally, ${uploadedFiles.length - failedUploads.length} to cloud storage.`,
          variant: "destructive"
        });
      }

      // Create message with file references
      const fileAttachments = uploadedFiles.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        url: file.url,
        uploaded: file.uploaded
      }));

      // Determine message type based on first file
      const firstFile = files[0];
      let messageType: 'text' | 'image' | 'video' | 'audio' | 'document' | 'file' = 'file';
      if (firstFile.type.startsWith('image/')) {
        messageType = 'image';
      } else if (firstFile.type.startsWith('video/')) {
        messageType = 'video';
      } else if (firstFile.type.startsWith('audio/')) {
        messageType = 'audio';
      } else if (firstFile.type.includes('pdf') || firstFile.type.includes('document') || firstFile.type.includes('text')) {
        messageType = 'document';
      }

      const messageContent = message.trim() || `${files.length === 1 ? firstFile.name : `Sent ${files.length} files`}`;

      const messageData: Omit<GroupMessage, 'id'> = {
        group_id: group.id,
        author_uid: user.uid,
        author_name: user.displayName || 'Unknown User',
        author_avatar_url: user.avatarDataUrl,
        content: messageContent,
        timestamp: new Date().toISOString(),
        message_type: messageType,
        file_name: files.length === 1 ? firstFile.name : undefined,
        file_size: files.length === 1 ? firstFile.size : undefined,
        file_type: files.length === 1 ? firstFile.type : undefined,
        file_url: files.length === 1 ? uploadedFiles[0].url : undefined,
        attachments: fileAttachments
      };

      const { data: savedMessage, error } = await supabase
        .from('group_messages')
        .insert(messageData)
        .select()
        .single();

      if (error) throw error;

      // Optimistically add message to local state for immediate UI update
      const optimisticMessage: GroupMessage = {
        ...savedMessage,
        reactions: [] // Initialize empty reactions array
      };
      setMessages(prev => [...prev, optimisticMessage]);

      // Create notifications for official group messages with files
      if (group.type === 'official') {
        try {
          console.log('🔔 Creating notifications for official group message with files');

          // Get all group members except the sender
          const otherMembers = members.filter(m => m.id !== user.uid);

          console.log('👥 Group members:', members.length, 'Other members:', otherMembers.length);

          if (otherMembers.length > 0) {
            // Check if notifications already exist for this message to avoid duplicates
            const existingNotifications = await supabase
              .from('notifications')
              .select('id')
              .like('id', `group-${group.id}-${savedMessage.id}-%`)
              .limit(1);

            if (existingNotifications.data && existingNotifications.data.length > 0) {
              console.log('⚠️ Notifications already exist for this message, skipping');
            } else {
              const notifications = otherMembers.map(member => ({
                id: `group-${group.id}-${savedMessage.id}-${member.id}-${Date.now()}`,
                user_id: member.id,
                type: 'group_message',
                title: `New message in ${group.name}`,
                message: `${user.displayName || 'Someone'} posted a message with ${files.length} file${files.length > 1 ? 's' : ''} in ${group.name}`,
                href: `/clubs/${group.id}`,
                read: false
              }));

              console.log('📝 Creating notifications for members:', otherMembers.map(m => m.id));

              // Save notifications to database
              const { error: notifError } = await supabase
                .from('notifications')
                .insert(notifications);

              if (notifError) {
                console.error('❌ Error creating group file message notifications:', notifError);
              } else {
                console.log(`✅ Created ${notifications.length} notifications for group file message`);
              }
            }
          } else {
            console.log('⚠️ No other members to notify');
          }
        } catch (notifError) {
          console.error('❌ Exception in group file message notification creation:', notifError);
        }
      }

      // Don't add message to state here - let real-time subscription handle it (but we already did optimistic update above)
      // setMessages(prev => [...prev, savedMessage]);
      setNewMessage('');
      setTimeout(scrollToBottom, 100);

      toast({ title: "Files uploaded and sent", description: `Sent ${files.length} file${files.length > 1 ? 's' : ''}` });
    } catch (error) {
      console.error('Error sending message with files:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload files. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  if (pageLoading || authLoading) {
    return <div className="container mx-auto p-4 flex justify-center items-center min-h-[calc(100vh-10rem)]"><SimpleRotatingSpinner className="h-12 w-12 text-primary" /></div>;
  }
  
  if (!group) {
    return <div className="container mx-auto p-4 text-center text-muted-foreground">Group not found or you don't have access.</div>;
  }

  return (
    <div className="container mx-auto h-[calc(100vh-8rem)] flex flex-col p-0 sm:p-4 relative overflow-hidden">
      {/* Enhanced background with glass effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30 dark:from-blue-950/10 dark:via-purple-950/5 dark:to-pink-950/10 backdrop-blur-sm -z-10" />

      <Card className="flex-1 flex flex-col shadow-2xl border border-white/10 bg-white/5 dark:bg-black/5 backdrop-blur-xl w-full h-full">
        <CardHeader className="flex flex-row items-center justify-between border-b border-white/20 bg-white/10 dark:bg-black/10 backdrop-blur-sm p-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-white/20 bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 backdrop-blur-sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                {group.name}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {group.description} • {members.length} members
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="border-white/20 bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 backdrop-blur-sm"
              onClick={async () => {
                console.log('Manual refresh clicked');
                const { data: groupMessages, error } = await supabase
                  .from('group_messages')
                  .select('*')
                  .eq('group_id', groupId)
                  .order('timestamp', { ascending: true });

                if (error) {
                  console.error('Error refreshing messages:', error);
                } else {
                  console.log('Refreshed messages:', groupMessages);
                  setMessages(groupMessages || []);
                }
              }}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 text-gray-700 dark:text-muted-foreground border-white/20 bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 backdrop-blur-sm"
                >
                  <Users className="h-4 w-4"/> {members.length} Member{members.length > 1 ? 's' : ''}
                </Button>
              </SheetTrigger>
              <SheetContent className="border-white/10 bg-white/5 dark:bg-black/5 backdrop-blur-xl">
                <SheetHeader>
                  <SheetTitle className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                    Group Members
                  </SheetTitle>
                  <SheetDescription>{group.name}</SheetDescription>
                </SheetHeader>
                <div className="py-4 space-y-4 max-h-[80vh] overflow-y-auto">
                  {/* Group members by role */}
                  {['admin', 'faculty', 'student'].map(role => {
                    const roleMembers = members.filter(m => m.role === role);
                    if (roleMembers.length === 0) return null;

                    return (
                      <div key={role} className="space-y-2">
                        <h4 className="text-sm font-semibold text-primary capitalize flex items-center gap-2">
                          {role === 'admin' && <ShieldCheck className="h-4 w-4" />}
                          {role === 'faculty' && <Shield className="h-4 w-4" />}
                          {role === 'student' && <Users className="h-4 w-4" />}
                          {role === 'admin' ? 'Admins' : role === 'faculty' ? 'Faculty' : 'Students'} ({roleMembers.length})
                        </h4>
                        <div className="space-y-2 ml-2">
                          {roleMembers.sort((a,b) => {
                            // Sort by full_name with email fallback (base name for faculty)
                            const nameA = a.full_name || a.email;
                            const nameB = b.full_name || b.email;
                            return nameA.localeCompare(nameB);
                          }).map(member => {
                            // Display name: use full_name field (stored in full_name column)
                            const baseName = member.full_name || member.email;
                            const displayName = member.role === 'faculty' && member.faculty_title
                              ? `${baseName} (${member.faculty_title})`
                              : baseName;

                            // Subtitle: only for students (USN), empty for admin/faculty
                            const subtitle = member.role === 'student'
                              ? (member.student_id || member.usn || '')
                              : '';

                            return (
                              <div key={member.id} className="flex items-center gap-3 p-2 rounded hover:bg-white/20 dark:hover:bg-black/20 backdrop-blur-sm transition-colors">
                                <Avatar className="h-8 w-8 ring-2 ring-white/20">
                                  <AvatarImage src={member.avatar_url} />
                                  <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-xs">
                                    {getInitials(baseName)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  {member.role === 'faculty' || member.role === 'student' ? (
                                    <button
                                      className="text-left w-full text-sm font-medium hover:text-primary transition-colors"
                                      onClick={() => {/* Add profile view logic */}}
                                    >
                                      {displayName}
                                    </button>
                                  ) : (
                                    <span className="text-sm font-medium">{displayName}</span>
                                  )}
                                  {subtitle && (
                                    <p className="text-xs text-muted-foreground">{subtitle}</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0 min-h-0 bg-gradient-to-b from-white/5 to-transparent dark:from-black/5 dark:to-transparent">
          <div className="flex-1 min-h-0 relative">
            {/* Beautiful chat background */}
            <div className="absolute inset-0 bg-gradient-to-b from-blue-50/10 via-transparent to-purple-50/10 dark:from-blue-950/5 dark:via-transparent dark:to-purple-950/5 pointer-events-none" />

            <ChatInterface
              messages={chatMessages}
              onEmojiClick={handleEmojiClick}
              onCopyMessage={handleCopyMessage}
              onDeleteMessage={handleDeleteMessage}
              onShareMessage={handleShareMessage}
              onAddReaction={handleAddReaction}
              currentUserId={user?.uid}
              className="h-full relative z-10"
              cardMode={true}
            />
          </div>

          {/* Enhanced chat panel with glass effect */}
          <div className="border-t border-white/20 bg-white/10 dark:bg-black/10 backdrop-blur-sm">
            <ChatPanel
              onSendMessage={handleSendMessage}
              onSendMessageWithFiles={handleSendMessageWithFiles}
              onEmojiClick={() => {}} // Placeholder for emoji picker
              onFileClick={handleFileClick}
              disabled={!canPost}
              value={newMessage}
              onChange={setNewMessage}
              className="bg-transparent border-none shadow-none"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
