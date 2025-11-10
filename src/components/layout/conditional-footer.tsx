"use client";

import { Footer } from '@/components/layout/footer';
import { Footerdemo } from '@/components/ui/footer-section';
import { useAuth } from '@/components/auth-provider';
import { usePathname } from 'next/navigation';

export function ConditionalFooter() {
  const { user } = useAuth();
  const pathname = usePathname();

  // Show Footerdemo for pages before login (when no user) and for dashboards after login
  // Show regular Footer only for non-dashboard pages when user is logged in
  const isDashboard = pathname?.includes('/student') || pathname?.includes('/faculty') || pathname?.includes('/admin') || pathname?.includes('/alumni');

  if (!user) {
    // Before login - show Footerdemo
    return <Footerdemo />;
  } else if (isDashboard) {
    // Dashboard pages after login - show Footerdemo
    return <Footerdemo />;
  } else {
    // Other pages after login - show regular Footer
    return <Footer />;
  }
}
