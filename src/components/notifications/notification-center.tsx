"use client";

// Utility function for clean error logging
const logError = (message: string, error: any) => {
  if (error?.message || error?.code) {
    console.warn(`${message}:`, error.code || error.message);
  } else if (Object.keys(error || {}).length > 0) {
    console.warn(`${message}:`, error);
  }
  // Don't log completely empty error objects
};

import React, { useState, useEffect, useCallback } from 'react';
import type { Notification } from '@/types';
import { NOTIFICATION_STORAGE_KEY } from '@/types';
import type { User } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import {
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { BellRing, Trash2, BookCheck, AlertCircle, FileWarning } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

interface NotificationCenterProps {
  user: User;
  onClose: () => void;
}

const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
        case 'approval': return <BookCheck className="h-5 w-5 text-green-500" />;
        case 'assignment_deadline': return <FileWarning className="h-5 w-5 text-orange-500" />;
        case 'fee_due': return <AlertCircle className="h-5 w-5 text-red-500" />;
        case 'low_attendance': return <AlertCircle className="h-5 w-5 text-yellow-500" />;
        default: return <BellRing className="h-5 w-5 text-blue-500" />;
    }
};

export function NotificationCenter({ user, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const router = useRouter();

  const loadNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      return;
    }

    try {
      // Read all notifications from database for display
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.uid)
        .order('created_at', { ascending: false })
        .limit(50); // Limit for performance

      if (error) {
        // Only log meaningful errors, not empty objects
        logError('❌ Notification fetch failed', error);

        // Try to load from localStorage as fallback
        try {
          const localNotifications = JSON.parse(localStorage.getItem('apsconnect_notifications') || '[]');
          const userLocalNotifications = localNotifications.filter((n: any) => n.user_id === user.uid);

          // Convert localStorage format to component format
          const formattedLocalNotifications = userLocalNotifications.map((notif: any) => ({
            id: notif.id,
            userId: notif.user_id,
            type: notif.type,
            title: notif.title,
            message: notif.message,
            href: notif.href,
            createdAt: notif.created_at,
            isRead: notif.isRead || notif.read || false
          }));

          setNotifications(formattedLocalNotifications);
        } catch (localStorageError) {
          console.error('❌ localStorage fallback also failed:', localStorageError);
          setNotifications([]);
        }
      } else {
        // Convert database format to component format
        const formattedNotifications = (data || []).map(dbNotif => ({
          id: dbNotif.id,
          userId: dbNotif.user_id,
          type: dbNotif.type,
          title: dbNotif.title,
          message: dbNotif.message,
          href: dbNotif.href,
          createdAt: dbNotif.created_at,
          isRead: dbNotif.read || false
        }));

        // Merge with localStorage notifications if any
        try {
          const localNotifications = JSON.parse(localStorage.getItem('apsconnect_notifications') || '[]');
          const userLocalNotifications = localNotifications.filter((n: any) => n.user_id === user.uid);

          if (userLocalNotifications.length > 0) {
            const formattedLocalNotifications = userLocalNotifications.map((notif: any) => ({
              id: notif.id,
              userId: notif.user_id,
              type: notif.type,
              title: notif.title,
              message: notif.message,
              href: notif.href,
              createdAt: notif.created_at,
              isRead: notif.isRead || notif.read || false
            }));

            // Combine database and localStorage notifications, avoiding duplicates
            const combinedNotifications = [...formattedNotifications];
            formattedLocalNotifications.forEach((localNotif: any) => {
              if (!combinedNotifications.find(dbNotif => dbNotif.id === localNotif.id)) {
                combinedNotifications.push(localNotif);
              }
            });

            setNotifications(combinedNotifications);
          } else {
            setNotifications(formattedNotifications);
          }
        } catch (mergeError) {
          console.error('❌ Error merging localStorage notifications:', mergeError);
          setNotifications(formattedNotifications);
        }
      }
    } catch (error) {
      logError('❌ Notification center exception', error);
      setNotifications([]);
    }
  }, [user]);

  useEffect(() => {
    loadNotifications();

    // Listen for notification updates
    const handleNotificationsUpdate = () => {
      loadNotifications();
    };

    // Set up real-time subscription for new notifications
    let notificationChannel: any = null;
    if (user) {
      notificationChannel = supabase
        .channel(`notification_center_${user.uid}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.uid}`
          },
          (payload) => {
            if (payload.new) {
              // Refresh notifications from database
              loadNotifications();
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.uid}`
          },
          (payload) => {
            if (payload.new) {
              // Refresh notifications when they're marked as read
              loadNotifications();
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            // Subscription successful - no need to log
          }
        });
    }

    window.addEventListener('notificationsUpdated', handleNotificationsUpdate);

    return () => {
      window.removeEventListener('notificationsUpdated', handleNotificationsUpdate);
      if (notificationChannel) {
        supabase.removeChannel(notificationChannel);
      }
    };
  }, [user, loadNotifications]);

  const clearAllNotifications = async () => {
    if (!user) return;

    try {
      // Permanently delete all notifications for this user
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.uid);

      if (error) {
        logError('Error clearing notifications', error);
      } else {
        // Clear the local state
        setNotifications([]);
        // Dispatch event to update navbar badge count
        window.dispatchEvent(new CustomEvent('notificationsUpdated'));
      }
    } catch (error) {
      logError('Error in clearAllNotifications', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.href) {
      // Mark as read in database first
      supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notification.id)
        .then(({ error: dbError }) => {
          if (dbError) {
            console.error('Error marking notification as read in database:', dbError);
          }

          // Also mark as read in localStorage
          try {
            const localNotifications = JSON.parse(localStorage.getItem('apsconnect_notifications') || '[]');
            const updatedLocalNotifications = localNotifications.map((n: any) => {
              if (n.id === notification.id) {
                return { ...n, isRead: true, read: true };
              }
              return n;
            });
            localStorage.setItem('apsconnect_notifications', JSON.stringify(updatedLocalNotifications));
          } catch (localStorageError) {
            console.error('Error updating localStorage notification:', localStorageError);
          }

          // Navigate regardless of errors
          router.push(notification.href as any);
          onClose();

          // Dispatch event to update navbar badge count
          window.dispatchEvent(new CustomEvent('notificationsUpdated'));
        });
    }
  };

  return (
    <SheetContent className="flex flex-col">
      <SheetHeader>
        <SheetTitle>Notifications</SheetTitle>
        <SheetDescription>
          Recent alerts and updates.
        </SheetDescription>
      </SheetHeader>
      <ScrollArea className="flex-1 my-4 -mx-6 px-6">
        <div className="space-y-3">
          {notifications.length > 0 ? (
            notifications.map(notification => (
              <div
                key={notification.id}
                className={`flex items-start gap-4 p-3 rounded-lg transition-colors ${notification.href ? 'cursor-pointer hover:bg-muted/50' : 'cursor-default'}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{notification.title}</p>
                  <p className="text-xs text-muted-foreground">{notification.message}</p>
                  <p className="text-xs text-muted-foreground/80 mt-1">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-10">
              <BellRing className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2">No new notifications.</p>
            </div>
          )}
        </div>
      </ScrollArea>
      <SheetFooter>
        <Button 
            variant="destructive" 
            className="w-full"
            onClick={clearAllNotifications}
            disabled={notifications.length === 0}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Clear All Notifications
        </Button>
      </SheetFooter>
    </SheetContent>
  );
}
