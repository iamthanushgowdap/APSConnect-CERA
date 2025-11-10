import type { LucideIcon } from 'lucide-react';
import { Newspaper, LayoutDashboard, Settings, UserCircle, BarChart3, FilePlus2, Users, Home, CalendarClock, Search, BookOpen, CreditCard, MessageSquareWarning, ListChecks, Sparkles, Crown, Bot } from 'lucide-react';
import React from 'react'; 

// Redefine NavItem here if it's specific to SiteConfig or ensure it's imported correctly
export type NavItem = {
  title: string;
  href: string;
  disabled?: boolean;
  external?: boolean;
  protected?: boolean; 
  adminOnly?: boolean; 
  facultyOnly?: boolean; 
  studentOnly?: boolean; 
  alumniOnly?: boolean;
  hideWhenLoggedIn?: boolean; 
  icon?: LucideIcon;
};

export type SiteConfig = {
  name: string;
  description: string;
  url: string;
  ogImage: string;
  mainNav: NavItem[];
  footerNav: NavItem[]; 
  LATEST_APP_VERSION: string;
};

export const SiteConfigData: SiteConfig = {
  name: "APSConnect",
  description: "A modern platform for college communication and engagement for APS.",
  url: "https://apsconnect.example.com", 
  ogImage: "https://apsconnect.example.com/og.jpg", 
  LATEST_APP_VERSION: "1.0.2", 
  mainNav: [
     {
      title: "Student Dashboard",
      href: "/student",
      protected: true,
      studentOnly: true, 
      icon: LayoutDashboard,
      hideWhenLoggedIn: false, 
    },
    {
      title: "Faculty Dashboard",
      href: "/faculty",
      protected: true,
      facultyOnly: true,
      icon: LayoutDashboard,
      hideWhenLoggedIn: false, 
    },
    {
      title: "Admin Dashboard",
      href: "/admin",
      protected: true,
      adminOnly: true,
      icon: LayoutDashboard,
      hideWhenLoggedIn: false, 
    },
    {
      title: "Alumni Portal",
      href: "/alumni",
      protected: true,
      alumniOnly: true,
      icon: Crown,
      hideWhenLoggedIn: false, 
    },
    {
      title: "CERA AI",
      href: "/cera",
      protected: true,
      studentOnly: true,
      icon: Bot,
      hideWhenLoggedIn: false,
    },
    {
      title: "Profiles",
      href: "/profiles",
      protected: true,
      icon: Users,
      hideWhenLoggedIn: false,
    },
    {
      title: "Clubs",
      href: "/clubs",
      protected: true,
      icon: Newspaper,
      hideWhenLoggedIn: false,
    },
  ],
  footerNav: [ 
    {
      title: "Privacy Policy",
      href: "/privacy", 
    },
    {
      title: "Terms of Service",
      href: "/terms", 
    },
  ],
};

export { SiteConfigData as SiteConfig };


export const PrivacyPolicyPage = (): React.ReactElement => {
  return React.createElement(
    'div',
    { className: "container mx-auto px-4 py-8" },
    React.createElement('h1', { className: "text-3xl font-bold mb-4" }, 'Privacy Policy'),
    React.createElement(
      'p',
      null,
      'Details about how user data is handled will go here. This is a placeholder for APSConnect.'
    )
  );
};

export const TermsOfServicePage = (): React.ReactElement => {
  return React.createElement(
    'div',
    { className: "container mx-auto px-4 py-8" },
    React.createElement('h1', { className: "text-3xl font-bold mb-4" }, 'Terms of Service'),
    React.createElement(
      'p',
      null,
      'The terms and conditions for using APSConnect will be detailed here. This is a placeholder.'
    )
  );
};
