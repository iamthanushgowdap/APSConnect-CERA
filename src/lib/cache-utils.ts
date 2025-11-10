// Cache utilities for optimizing API calls and page loads

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class APICache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  invalidate(pattern: string): void {
    for (const [key] of this.cache) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instance
export const apiCache = new APICache();

// Optimized fetch with caching
export async function cachedFetch<T>(
  url: string,
  options?: RequestInit,
  ttl: number = 5 * 60 * 1000 // 5 minutes default
): Promise<T> {
  const cacheKey = `${url}-${JSON.stringify(options)}`;
  const cached = apiCache.get<T>(cacheKey);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    apiCache.set(cacheKey, data, ttl);
    return data;
  } catch (error) {
    console.error('Cached fetch failed:', error);
    throw error;
  }
}

// Preload critical resources
export function preloadCriticalResources() {
  // Preload critical fonts
  if (typeof document !== 'undefined') {
    const fontLink = document.createElement('link');
    fontLink.rel = 'preload';
    fontLink.href = '/fonts/geist-sans.woff2';
    fontLink.as = 'font';
    fontLink.type = 'font/woff2';
    fontLink.crossOrigin = 'anonymous';
    document.head.appendChild(fontLink);
  }
}

// Image optimization utilities
export function optimizeImageUrl(url: string, width: number = 400, quality: number = 80): string {
  if (!url || !url.includes('supabase')) return url;

  // Add Supabase image transformation parameters
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}width=${width}&quality=${quality}&format=webp`;
}

// Debounce utility for search inputs
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Intersection Observer for lazy loading
export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
) {
  if (typeof window === 'undefined') return null;

  return new IntersectionObserver(callback, {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  });
}

// Memory usage optimization
export function cleanupUnusedData() {
  // Clear old cache entries
  apiCache.clear();

  // Force garbage collection hint (not guaranteed to work)
  if (typeof window !== 'undefined' && 'gc' in window) {
    (window as any).gc?.();
  }
}
