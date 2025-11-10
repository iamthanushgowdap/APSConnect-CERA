"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiCache, cleanupUnusedData } from '@/lib/cache-utils';

// Performance monitoring hook
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState({
    fcp: 0,
    lcp: 0,
    cls: 0,
    fid: 0,
    ttfb: 0,
  });

  useEffect(() => {
    // Monitor Core Web Vitals
    const updateMetrics = (metric: any) => {
      setMetrics(prev => ({
        ...prev,
        [metric.name.toLowerCase()]: metric.value,
      }));
    };

    // Load web-vitals dynamically
    import('web-vitals').then((webVitals) => {
      // Use modern web-vitals API (v3+)
      if (webVitals.onCLS) webVitals.onCLS(updateMetrics);
      if (webVitals.onINP) webVitals.onINP(updateMetrics); // FID replaced by INP
      if (webVitals.onFCP) webVitals.onFCP(updateMetrics);
      if (webVitals.onLCP) webVitals.onLCP(updateMetrics);
      if (webVitals.onTTFB) webVitals.onTTFB(updateMetrics);
    }).catch((error) => {
      console.warn('web-vitals not available:', error);
    });

    // Cleanup on unmount
    return () => {
      cleanupUnusedData();
    };
  }, []);

  return metrics;
}

// Route prefetching hook
export function useRoutePrefetch() {
  const router = useRouter();

  const prefetchRoute = useCallback((route: string) => {
    router.prefetch(route as any);
  }, [router]);

  const prefetchMultiple = useCallback((routes: string[]) => {
    routes.forEach(route => router.prefetch(route as any));
  }, [router]);

  return { prefetchRoute, prefetchMultiple };
}

// Optimized image component with lazy loading
interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  quality?: number;
}

export function OptimizedImage({
  src,
  alt,
  width = 400,
  height,
  priority = false,
  quality = 80,
  className = '',
  ...props
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Optimize image URL
    const optimizedSrc = src.includes('supabase')
      ? `${src}${src.includes('?') ? '&' : '?'}width=${width}&quality=${quality}&format=webp`
      : src;

    setImageSrc(optimizedSrc);
  }, [src, width, quality]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  if (hasError) {
    return (
      <div
        className={`bg-muted flex items-center justify-center text-muted-foreground ${className}`}
        style={{ width, height }}
      >
        Failed to load image
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div
          className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center"
          style={{ width, height }}
        >
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <img
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={handleLoad}
        onError={handleError}
        className={`${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300 ${className}`}
        {...props}
      />
    </div>
  );
}

// Loading skeleton components
export function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-muted rounded w-1/3"></div>
      <div className="space-y-3">
        <div className="h-4 bg-muted rounded w-full"></div>
        <div className="h-4 bg-muted rounded w-5/6"></div>
        <div className="h-4 bg-muted rounded w-4/5"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded"></div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-48 bg-muted rounded-lg mb-4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded w-3/4"></div>
        <div className="h-3 bg-muted rounded w-1/2"></div>
      </div>
    </div>
  );
}

// Performance optimization HOC
export function withPerformanceOptimization<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    enablePrefetch?: boolean;
    prefetchRoutes?: string[];
  } = {}
) {
  const OptimizedComponent = (props: P) => {
    const { prefetchMultiple } = useRoutePrefetch();

    useEffect(() => {
      if (options.enablePrefetch && options.prefetchRoutes) {
        prefetchMultiple(options.prefetchRoutes);
      }
    }, [prefetchMultiple]);

    return <Component {...props} />;
  };

  OptimizedComponent.displayName = `withPerformanceOptimization(${Component.displayName || Component.name})`;

  return OptimizedComponent;
}

// Memory usage monitor
export function useMemoryMonitor() {
  const [memoryUsage, setMemoryUsage] = useState({
    used: 0,
    total: 0,
    limit: 0,
  });

  useEffect(() => {
    const updateMemoryUsage = () => {
      if ('memory' in performance) {
        const memInfo = (performance as any).memory;
        setMemoryUsage({
          used: Math.round(memInfo.usedJSHeapSize / 1048576),
          total: Math.round(memInfo.totalJSHeapSize / 1048576),
          limit: Math.round(memInfo.jsHeapSizeLimit / 1048576),
        });
      }
    };

    const interval = setInterval(updateMemoryUsage, 10000); // Update every 10 seconds
    updateMemoryUsage(); // Initial update

    return () => clearInterval(interval);
  }, []);

  return memoryUsage;
}
