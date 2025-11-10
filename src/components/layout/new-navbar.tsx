"use client";

import Link from "next/link";
import { SiteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, User } from "@/components/auth-provider";
import React, { useEffect, useState, useCallback, Suspense, lazy } from 'react';
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
import { getInitials } from "@/components/content/post-item-utils";
import { SimpleRotatingSpinner } from "@/components/ui/loading-spinners";
import { NOTIFICATION_STORAGE_KEY } from "@/types";
import { ProfileService } from '@/lib/profile-service';
import GlassSurface from '@/components/ui/GlassSurface';

// Lazy load heavy components
const ThemeToggleButton = lazy(() => import("@/components/theme-toggle-button").then(mod => ({ default: mod.ThemeToggleButton })));
const NotificationCenter = lazy(() => import("@/components/notifications/notification-center").then(mod => ({ default: mod.NotificationCenter })));

interface SiteSettingsLogo {
  collegelogourl?: string;
}

const SITE_SETTINGS_STORAGE_KEY = 'apsconnect_site_settings_v1';

export function NewNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, signOut } = useAuth();
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | undefined>(undefined);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notificationsDisabled, setNotificationsDisabled] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [collegeLogoUrl, setCollegeLogoUrl] = useState<string | undefined>(undefined);
  const [collegeName, setCollegeName] = useState<string>('APSConnect');

  const calculateUnreadNotifications = useCallback(async () => {
    if (!user) {
      setUnreadNotifications(0);
      return;
    }
    try {
      // Validate user before making database query
      if (!user?.uid) {
        console.warn('calculateUnreadNotifications: User or user.uid is not available');
        setUnreadNotifications(0);
        return;
      }

      // Count unread notifications from database
      let dbCount = 0;
      let error = null;

      try {
        const result = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.uid)
          .eq('read', false);

        dbCount = result.count || 0;
        error = result.error;
      } catch (dbError) {
        console.warn('Database query failed for notifications:', dbError);
        error = { message: 'Database connection failed', code: 'CONNECTION_ERROR' };
      }

      let totalUnread = dbCount || 0;

      // Also count unread notifications from localStorage
      try {
        const localNotifications = JSON.parse(localStorage.getItem('apsconnect_notifications') || '[]');
        const userLocalNotifications = localNotifications.filter((n: any) => n.user_id === user.uid);
        const unreadLocalCount = userLocalNotifications.filter((n: any) => !n.isRead && !n.read).length;
        totalUnread += unreadLocalCount;
      } catch (localStorageError) {
        console.error('Error counting localStorage notifications:', localStorageError);
      }

      if (error) {
        console.error('Error calculating unread notifications:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          userId: user.uid,
          table: 'notifications'
        });
        // Still set the count from localStorage if database fails
        setUnreadNotifications(totalUnread);
      } else {
        setUnreadNotifications(totalUnread);
        // Reset failure count on successful query
        localStorage.removeItem('notifications_failure_count');
        setNotificationsDisabled(false);
      }
    } catch (error) {
      console.error('Error in calculateUnreadNotifications:', error);
      // If notifications keep failing, disable the feature to prevent spam
      const failureCount = parseInt(localStorage.getItem('notifications_failure_count') || '0') + 1;
      localStorage.setItem('notifications_failure_count', failureCount.toString());

      if (failureCount >= 3) {
        console.warn('Notifications disabled due to persistent failures');
        setNotificationsDisabled(true);
        setUnreadNotifications(0);
      } else {
        setUnreadNotifications(0);
      }
    }
  }, [user]);

  useEffect(() => {
    const loadCollegeLogo = async () => {
      try {
        const result = await supabase
          .from('site_settings')
          .select('collegelogourl, collegename')
          .single();
        const data = result.data;
        const error = result.error;

        if (!error && data) {
          if (data.collegelogourl) {
            setCollegeLogoUrl(data.collegelogourl);
          }
          if (data.collegename) {
            setCollegeName(data.collegename);
          } else {
            setCollegeName('APSConnect');
          }
        }
      } catch (error) {
        console.error('Error loading college logo:', error);
      }
    };

    loadCollegeLogo();
  }, []);

  useEffect(() => {
    const loadAvatar = async () => {
      if (user && typeof window !== 'undefined') {
        const userProfile = await ProfileService.getProfile(user.uid);
        if (userProfile?.avatar_url) {
          setUserAvatarUrl(userProfile.avatar_url);
          return;
        }

        const localProfileStr = localStorage.getItem(`apsconnect_user_${user.uid}`);
        if (localProfileStr) {
          const localProfile = JSON.parse(localProfileStr) as UserProfile;
          if (localProfile.avatar_url) {
            setUserAvatarUrl(localProfile.avatar_url);
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

  useEffect(() => {
    const handleNotificationsUpdate = () => {
      calculateUnreadNotifications();
    };

    // Calculate initial count
    calculateUnreadNotifications();

    // Listen for notification updates from other components
    window.addEventListener('notificationsUpdated', handleNotificationsUpdate);

    return () => {
      window.removeEventListener('notificationsUpdated', handleNotificationsUpdate);
    };
  }, [calculateUnreadNotifications]);

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
    router.push('/login');

    try {
      await signOut();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="sticky top-4 z-50 w-[92%] mx-[4%] rounded-3xl overflow-hidden backdrop-blur-xl bg-white/20 border border-white/30 shadow-2xl">
      <div className="container flex h-16 max-w-screen-2xl items-center px-4">
          <div className="flex items-center space-x-4 ml-[4%]">
            <Link href={getDashboardLink()} className="flex items-center space-x-3" aria-label="Go to APSConnect Homepage">
              {collegeLogoUrl && (
                <img
                  src={collegeLogoUrl}
                  alt="College Logo"
                  className="h-10 w-auto max-w-[120px] object-contain"
                />
              )}
              <span className="font-bold text-lg text-foreground dark:text-white">
                {collegeName || 'APSConnect'}
              </span>
            </Link>
            {user && user.role === 'admin' && (
              <Link
                href="/admin"
                className={`transition-colors hover:text-primary relative flex items-center ${
                  pathname === '/admin' ? "text-primary" : "text-foreground/60"
                } text-xs sm:text-sm`}
                suppressHydrationWarning
              >
                <LayoutDashboard className="mr-1.5 h-4 w-4" />
                Admin Dashboard
              </Link>
            )}
          </div>

          <nav className="hidden md:flex flex-1 items-center justify-center space-x-2 sm:space-x-4 md:space-x-6 text-sm font-medium">
            {SiteConfig.mainNav
              .filter(item => !(user && user.role === 'admin' && item.title === 'Admin Dashboard'))
              .map((item) => {
              if (isLoading) {
                if (item.title === "Student Dashboard") { /* Always render Student Dashboard when loading */ } else { return null; }
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
                      className={`transition-colors hover:text-primary relative flex items-center ${
                        pathname === item.href ? "text-primary" : "text-foreground/60"
                      } text-xs sm:text-sm`}
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
              <Suspense fallback={<SimpleRotatingSpinner className="h-5 w-5" />}>
                <ThemeToggleButton />
              </Suspense>

              {!notificationsDisabled && (
                <Sheet open={isNotificationCenterOpen} onOpenChange={(open: boolean) => {
                  setIsNotificationCenterOpen(open);
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
                  <Suspense fallback={<div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>}>
                    <NotificationCenter user={user} onClose={() => setIsNotificationCenterOpen(false)} />
                  </Suspense>
                </Sheet>
              )}

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
                <Suspense fallback={<SimpleRotatingSpinner className="h-5 w-5" />}>
                  <ThemeToggleButton />
                </Suspense>
              </>
            )}
          </div>
        </div>
    </header>
  );
}
