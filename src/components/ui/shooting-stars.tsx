"use client";

import React, { useEffect, useState } from 'react';

interface ShootingStarsProps {
  className?: string;
}

export function ShootingStars({ className = "" }: ShootingStarsProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial theme
    const checkTheme = () => {
      const hasDarkClass = document.documentElement.classList.contains('dark');
      setIsDark(hasDarkClass);
    };

    // Check theme on mount
    checkTheme();

    // Watch for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          checkTheme();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`fixed inset-0 pointer-events-none ${className}`}
      style={{
        zIndex: 0,
        background: 'transparent'
      }}
      aria-hidden="true"
    >
      {/* Shooting stars */}
      <div className="shooting-stars-container">
        <span className={`shooting-star star-1 ${isDark ? 'dark-theme' : 'light-theme'}`}></span>
        <span className={`shooting-star star-2 ${isDark ? 'dark-theme' : 'light-theme'}`}></span>
        <span className={`shooting-star star-3 ${isDark ? 'dark-theme' : 'light-theme'}`}></span>
        <span className={`shooting-star star-4 ${isDark ? 'dark-theme' : 'light-theme'}`}></span>
        <span className={`shooting-star star-5 ${isDark ? 'dark-theme' : 'light-theme'}`}></span>
        <span className={`shooting-star star-6 ${isDark ? 'dark-theme' : 'light-theme'}`}></span>
        <span className={`shooting-star star-7 ${isDark ? 'dark-theme' : 'light-theme'}`}></span>
        <span className={`shooting-star star-8 ${isDark ? 'dark-theme' : 'light-theme'}`}></span>
        <span className={`shooting-star star-9 ${isDark ? 'dark-theme' : 'light-theme'}`}></span>
        <span className={`shooting-star star-10 ${isDark ? 'dark-theme' : 'light-theme'}`}></span>
      </div>

      <style jsx>{`
        .shooting-stars-container {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .shooting-star {
          position: absolute;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #222; /* Dark stars for light theme */
          box-shadow: 0 0 0 4px rgba(34,34,34,0.15), 0 0 0 8px rgba(34,34,34,0.08), 0 0 20px rgba(34,34,34,0.15);
          transform-origin: center left;
          animation: fly linear infinite;
        }

        .shooting-star::before {
          content: "";
          position: absolute;
          left: 6px;
          top: 50%;
          transform: translateY(-50%);
          width: 340px;
          height: 2px;
          background: linear-gradient(90deg, rgba(34,34,34,0.95) 0%, rgba(34,34,34,0) 70%); /* Dark trails for light theme */
          filter: blur(0.2px);
        }

        @keyframes fly {
          0% {
            transform: rotate(-45deg) translateX(0);
            opacity: 1;
          }
          75% {
            opacity: 1;
          }
          100% {
            transform: rotate(-45deg) translateX(-1200px);
            opacity: 0;
          }
        }

        /* Star positions and animations */
        .star-1 { top: 8px; right: 12px; animation-duration: 1s; animation-delay: 0s; }
        .star-2 { top: 18px; right: 140px; animation-duration: 3s; animation-delay: 0.2s; }
        .star-3 { top: 80px; right: 8px; animation-duration: 2s; animation-delay: 0.4s; }
        .star-4 { top: 22px; right: 220px; animation-duration: 1.5s; animation-delay: 0.6s; }
        .star-5 { top: 40px; right: 420px; animation-duration: 2.5s; animation-delay: 0.8s; }
        .star-6 { top: 62px; right: 620px; animation-duration: 3s; animation-delay: 1s; }
        .star-7 { top: 300px; right: 8px; animation-duration: 1.75s; animation-delay: 1.2s; }
        .star-8 { top: 12px; right: 720px; animation-duration: 1.25s; animation-delay: 1.4s; }
        .star-9 { top: 12px; right: 450px; animation-duration: 2.25s; animation-delay: 0.75s; }
        .star-10 { top: 220px; right: 480px; animation-duration: 2.75s; animation-delay: 2.75s; }

        /* Mobile optimizations */
        @media (max-width: 600px) {
          .shooting-star::before {
            width: 240px;
          }
          .shooting-star {
            width: 3px;
            height: 3px;
          }
        }

        /* Light theme (default) */
        .light-theme {
          background: #222 !important;
          box-shadow: 0 0 0 4px rgba(34,34,34,0.15), 0 0 0 8px rgba(34,34,34,0.08), 0 0 20px rgba(34,34,34,0.15) !important;
        }
        .light-theme::before {
          background: linear-gradient(90deg, rgba(34,34,34,0.95) 0%, rgba(34,34,34,0) 70%) !important;
        }

        /* Dark theme override */
        .dark-theme {
          background: #fff !important;
          box-shadow: 0 0 0 4px rgba(255,255,255,0.15), 0 0 0 8px rgba(255,255,255,0.08), 0 0 20px rgba(255,255,255,0.15) !important;
        }
        .dark-theme::before {
          background: linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 70%) !important;
        }
      `}</style>
    </div>
  );
}
