
"use client";

import Link from "next/link";
import { SiteConfig } from "@/config/site";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth, User } from "@/components/auth-provider";
import React, { useEffect, useState, useCallback } from 'react';
import type { Post, UserProfile, NotificationPreferences, Notification } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, LayoutDashboard, Settings, Newspaper, Home, UserCircle, Sun, Moon, BookOpen, CalendarClock, BarChart3, FilePlus2, Users, Users as UsersIcon, Bell } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { getInitials } from "@/components/content/post-item-utils";
import { SimpleRotatingSpinner } from "@/components/ui/loading-spinners";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { NOTIFICATION_STORAGE_KEY } from "@/types";
import { ProfileService } from '@/lib/profile-service';

interface SiteSettingsLogo {
  collegelogourl?: string;
}

const SITE_SETTINGS_STORAGE_KEY = 'apsconnect_site_settings_v1';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, signOut } = useAuth();
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | undefined>(undefined);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [collegeLogoUrl, setCollegeLogoUrl] = useState<string | undefined>(undefined);

  const calculateUnreadNotifications = useCallback(async () => {
    if (!user) {
      setUnreadNotifications(0);
      return;
    }
    
    try {
      // Read unread notification count from database
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.uid)
        .eq('read', false);

      if (error) {
        console.error('❌ Error fetching notification count:', error);
        setUnreadNotifications(0);
      } else {
        setUnreadNotifications(count || 0);
      }
    } catch (error) {
      console.error('❌ Error in calculateUnreadNotifications:', error);
      setUnreadNotifications(0);
    }
  }, [user]);

  const markNotificationsAsRead = useCallback(async () => {
    if (!user || unreadNotifications === 0) return;
    
    try {
      // Mark all notifications as read in database
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.uid)
        .eq('read', false);

      if (error) {
        console.error('Error marking notifications as read:', error);
      } else {
        setUnreadNotifications(0);
      }
    } catch (error) {
      console.error('Error in markNotificationsAsRead:', error);
    }
  }, [user, unreadNotifications]);

  useEffect(() => {
    const loadCollegeLogo = async () => {
      try {
        // Try to load from Supabase first (silently fail if table doesn't exist)
        let data, error;
        try {
          const result = await supabase
            .from('site_settings')
            .select('collegelogourl')
            .single();
          data = result.data;
          error = result.error;
        } catch (e) {
          // Silently ignore if site_settings table doesn't exist
          console.warn('Site settings table not available, using fallback');
          data = null;
          error = null;
        }

        if (!error && data?.collegelogourl) {
          setCollegeLogoUrl(data.collegelogourl);
        } else {
          // Fall back to localStorage
          if (typeof window !== 'undefined') {
            const settingsStr = localStorage.getItem(SITE_SETTINGS_STORAGE_KEY);
            if (settingsStr) {
              try {
                const settings = JSON.parse(settingsStr);
                setCollegeLogoUrl(settings.collegelogourl);
              } catch (e) {
                console.error("Failed to parse logo settings:", e);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading college logo:', error);
        // Silent fallback - don't crash the navbar
        if (typeof window !== 'undefined') {
          const settingsStr = localStorage.getItem(SITE_SETTINGS_STORAGE_KEY);
          if (settingsStr) {
            try {
              const settings = JSON.parse(settingsStr);
              setCollegeLogoUrl(settings.collegelogourl);
            } catch (e) {
              console.error("Failed to parse logo settings:", e);
            }
          }
        }
      }
    };

    loadCollegeLogo();

    // Set up real-time subscription for logo updates
    const logoChannel = supabase
      .channel('navbar_logo_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_settings'
        },
        (payload) => {
          if (payload.new && typeof payload.new === 'object') {
            const newData = payload.new as Record<string, any>;
            if (newData.collegelogourl !== undefined) {
              setCollegeLogoUrl(newData.collegelogourl || undefined);
            }
          }
        }
      )
      .subscribe();

    let notificationChannel: any = null;
    if (user) {
      notificationChannel = supabase
        .channel(`notifications_${user.uid}`)
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
              // Refresh notification count from database
              calculateUnreadNotifications();
            }
          }
        )
        .subscribe();
    }

    calculateUnreadNotifications();

    const handlePostsSeenEvent = () => {
        calculateUnreadNotifications();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('postsSeen', handlePostsSeenEvent);
    }

    return () => {
      supabase.removeChannel(logoChannel);
      if (notificationChannel) {
        supabase.removeChannel(notificationChannel);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('postsSeen', handlePostsSeenEvent);
      }
    };
  }, [user, pathname]);

  useEffect(() => {
    const loadAvatar = async () => {
      if (user && typeof window !== 'undefined') {
        // Use ProfileService as primary source
        const userProfile = await ProfileService.getProfile(user.uid);
        if (userProfile?.avatar_url) {
          setUserAvatarUrl(userProfile.avatar_url);
          return;
        }

        // Fallback to localStorage during transition period (remove after 30 days)
        const localProfileStr = localStorage.getItem(`apsconnect_user_${user.uid}`);
        if (localProfileStr) {
          const localProfile = JSON.parse(localProfileStr) as UserProfile;
          if (localProfile.avatar_url) {
            setUserAvatarUrl(localProfile.avatar_url);
            // Migrate to Supabase
            await ProfileService.cacheProfile(localProfile);
            return;
          }
        }

        setUserAvatarUrl(undefined);
      } else {
        setUserAvatarUrl(undefined);
      }
    };

    loadAvatar();
  }, [user]);

  const getDashboardLink = () => {
    if (!user) return "/";

    switch (user.role) {
      case "admin":
        return "/admin";
      case "faculty":
        return "/faculty";
      case "alumni":
        return "/alumni";
      case "student":
      case "pending":
        return "/student";
      default:
        return "/dashboard";
    }
  };

  const handleLogout = async () => {
    // Immediately redirect to login for instant logout experience
    router.push('/login');

    try {
      await signOut();
    } catch (error) {
      console.error('Logout failed:', error);
      // Already redirected, so no need for fallback redirect
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <Link href="/" className="mr-4 md:mr-6 flex items-center space-x-2" aria-label="Go to APSConnect Homepage">
          {collegeLogoUrl ? (
            <img
              src={collegeLogoUrl}
              alt="College Logo"
              className="h-8 w-auto max-w-[120px] object-contain ml-[5%]"
            />
          ) : (
            <Icons.AppLogo className="h-6 w-6 text-primary ml-[5%]" />
          )}
          <span className="font-bold sm:inline-block">{SiteConfig.name}</span>
        </Link>
        <nav className="hidden md:flex flex-1 items-center space-x-2 sm:space-x-4 md:space-x-6 text-sm font-medium">
          {SiteConfig.mainNav.map((item) => {
            if (isLoading) {
              if (item.title === "Home") { /* Always render Home */ } else { return null; }
            } else {
              if (item.hideWhenLoggedIn && user) return null;
              if (item.protected && !user) return null;
              if (item.adminOnly && (!user || user.role !== 'admin')) return null;
              if (item.facultyOnly && (!user || user.role !== 'faculty')) return null;
              if (item.alumniOnly && (!user || user.role !== 'alumni')) return null;
              if (item.studentOnly && (!user || user.role !== 'student')) return null;
            }
            return (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                    "transition-colors hover:text-primary relative flex items-center",
                    pathname === item.href ? "text-primary" : "text-foreground/60",
                    "text-xs sm:text-sm"
                    )}
                    suppressHydrationWarning
                >
                    {item.icon && <item.icon className="mr-1.5 h-4 w-4" />}
                    {item.title}
                </Link>
            );
          })}
        </nav>

        <div className="flex items-center space-x-1 sm:space-x-2 ml-auto">
          {isLoading ? (
             <SimpleRotatingSpinner className="h-8 w-8 text-primary" />
          ) : user ? (
            <>
            <ThemeToggleButton />
            
            <Sheet open={isNotificationCenterOpen} onOpenChange={(open) => {
              setIsNotificationCenterOpen(open);
              if (open) {
                  markNotificationsAsRead();
              }
            }}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-destructive text-xs text-white items-center justify-center">
                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                      </span>
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <NotificationCenter user={user} onClose={() => setIsNotificationCenterOpen(false)} />
            </Sheet>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full" suppressHydrationWarning aria-label="User menu">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={userAvatarUrl || undefined} alt={user.displayName || "User Avatar"} data-ai-hint="person avatar" />
                    <AvatarFallback className="bg-muted text-muted-foreground">
                      {getInitials(user.displayName || user.email || user.usn)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName || "User"}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email || user.usn} ({user.role})
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                    <Link href={getDashboardLink()} className="flex items-center">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                    </Link>
                    </DropdownMenuItem>
                     {user.role !== 'alumni' && (
                       <DropdownMenuItem asChild>
                        <Link href="/profiles" className="flex items-center">
                          <UsersIcon className="mr-2 h-4 w-4" />
                          <span>Profiles</span>
                        </Link>
                      </DropdownMenuItem>
                     )}
                     {(user.role === 'admin' || user.role === 'faculty' || user.role === 'student') && (
                      <DropdownMenuItem asChild>
                        <Link href="/clubs" className="flex items-center">
                          <UsersIcon className="mr-2 h-4 w-4" />
                          <span>Clubs</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                    <Link href="/profile/settings" className="flex items-center">
                        <UserCircle className="mr-2 h-4 w-4" />
                        <span>Profile Settings</span>
                    </Link>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="flex items-center cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>End Session</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </>
          ) : (
            <>
              <Button asChild variant="outline" size="sm" suppressHydrationWarning>
                <Link href="/login" suppressHydrationWarning>Login</Link>
              </Button>
              <Button asChild size="sm" suppressHydrationWarning>
                <Link href="/register" suppressHydrationWarning>Register</Link>
              </Button>
              <ThemeToggleButton />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
