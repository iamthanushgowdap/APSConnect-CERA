"use client";

import { useEffect } from 'react';

// Performance monitoring component
export function PerformanceMonitor() {
  useEffect(() => {
    // Monitor Core Web Vitals
    if (typeof window !== 'undefined') {
      import('web-vitals').then((webVitals) => {
        // Use modern web-vitals API (v3+)
        if (webVitals.onCLS) webVitals.onCLS(console.log);
        if (webVitals.onINP) webVitals.onINP(console.log); // FID replaced by INP
        if (webVitals.onFCP) webVitals.onFCP(console.log);
        if (webVitals.onLCP) webVitals.onLCP(console.log);
        if (webVitals.onTTFB) webVitals.onTTFB(console.log);
      }).catch((error) => {
        console.warn('web-vitals not available:', error);
      });
    }

    // Monitor memory usage
    const logMemoryUsage = () => {
      if ('memory' in performance) {
        const memInfo = (performance as any).memory;
        console.log('Memory usage:', {
          used: Math.round(memInfo.usedJSHeapSize / 1048576) + ' MB',
          total: Math.round(memInfo.totalJSHeapSize / 1048576) + ' MB',
          limit: Math.round(memInfo.jsHeapSizeLimit / 1048576) + ' MB'
        });
      }
    };

    // Log memory every 30 seconds in development
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(logMemoryUsage, 30000);
      return () => clearInterval(interval);
    }
  }, []);

  return null;
}
