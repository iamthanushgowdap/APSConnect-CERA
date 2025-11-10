"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { preloadCriticalResources } from '@/lib/cache-utils';

// Preloader component for critical routes
export function RoutePreloader() {
  const router = useRouter();

  useEffect(() => {
    // Preload critical routes for instant navigation
    const criticalRoutes = ['/student', '/cera', '/profiles', '/clubs'];
    criticalRoutes.forEach(route => {
      router.prefetch(route as any);
    });

    // Preload critical resources
    preloadCriticalResources();
  }, [router]);

  return null;
}
