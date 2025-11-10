import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { NewNavbar } from '@/components/layout/new-navbar';
import { Footer } from '@/components/layout/footer';
import { AuthProvider } from '@/components/auth-provider';
import { SiteConfig } from '@/config/site';
import { StorageInitializer } from '@/components/storage-initializer';
import { ConditionalFooter } from '@/components/layout/conditional-footer';
import { AppErrorBoundary } from '@/components/error-boundary';
import { PerformanceMonitor } from '@/components/performance/performance-monitor';
import { RoutePreloader } from '@/components/performance/route-preloader';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// Simplified metadata to address potential SSR issues
export const metadata: Metadata = {
  title: "APSConnect", // Using a plain string
  description: "A modern platform for college communication and engagement for APS.", // Using a plain string
  manifest: '/manifest.json',
  // ogImage and other specific metadata can be added back once the root SSR issue is resolved.
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function setTheme(theme) {
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                  localStorage.setItem('color-theme', theme);
                }
                var preferredTheme = localStorage.getItem('color-theme');
                if (preferredTheme) {
                  setTheme(preferredTheme);
                } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                  setTheme('dark');
                } else {
                  setTheme('light');
                }
              })();
            `,
          }}
          suppressHydrationWarning={true}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen bg-background text-foreground`}>
        <AppErrorBoundary>
          <AuthProvider>
            <StorageInitializer />
            <RoutePreloader />
            <PerformanceMonitor />
            <NewNavbar />
            <main className="flex-grow">
              {children}
            </main>
            <ConditionalFooter />
          </AuthProvider>
        </AppErrorBoundary>
        <Toaster />
      </body>
    </html>
  );
}
