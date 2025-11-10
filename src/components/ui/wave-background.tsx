import React, { useEffect, useRef, useState } from "react";

export default function WaveBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const DPR = typeof window !== "undefined" ? Math.max(window.devicePixelRatio || 1, 1) : 1;

  const getEffectiveTheme = () => {
    // Check document class first (most reliable for real-time theme state)
    if (typeof document !== 'undefined') {
      const htmlElement = document.documentElement;
      const classList = htmlElement.classList;

      // Check for dark class first
      if (classList.contains('dark')) {
        return "dark";
      }

      // Check for light class explicitly
      if (classList.contains('light')) {
        return "light";
      }

      // Check for data-theme attribute
      const dataTheme = htmlElement.getAttribute('data-theme');
      if (dataTheme === 'dark') {
        return "dark";
      }

      if (dataTheme === 'light') {
        return "light";
      }

      // If no explicit theme classes/attributes, check if dark class is absent (assume light)
      if (!classList.contains('dark')) {
        return "light";
      }
    }

    // Check localStorage cache as fallback (less reliable for real-time)
    if (typeof window !== 'undefined') {
      const cachedTheme = localStorage.getItem('theme-cache');
      if (cachedTheme) {
        return cachedTheme;
      }
    }

    // System preference as last resort
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }

    return "light";
  };

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    function resize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * DPR);
      canvas.height = Math.floor(h * DPR);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    function drawWaves(theme: string, t: number) {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      // Theme-appropriate backgrounds with better contrast
      if (theme === "dark") {
        ctx.fillStyle = "#02021a"; // Dark background for dark theme
      } else {
        ctx.fillStyle = "#f8fafc"; // Slightly darker light background for better contrast
      }
      ctx.fillRect(0, 0, w, h);

      const bands = 4;
      for (let i = 0; i < bands; i++) {
        const amp = 8 + i * 6;
        const speed = 0.0006 + i * 0.0004;
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 20) {
          const y = h * (0.5 + (i - bands / 2) * 0.06) + Math.sin(x * 0.02 + t * speed) * amp;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.closePath();

        // Theme-appropriate wave colors
        if (theme === "dark") {
          ctx.fillStyle = `rgba(59,130,246,${0.08 + i * 0.03})`; // Blue waves for dark theme
        } else {
          ctx.fillStyle = `rgba(120,150,130,${0.06 + i * 0.025})`; // Grayish light greenish waves for light theme
        }
        ctx.fill();
      }
    }

    let start = performance.now();
    function draw() {
      const theme = getEffectiveTheme();
      const t = performance.now() - start;
      drawWaves(theme, t);
    }

    function tick() {
      draw();
      rafRef.current = requestAnimationFrame(tick);
    }

    resize();
    tick();

    window.addEventListener("resize", resize);

    let mq: MediaQueryList | null = null;
    let observer: MutationObserver | null = null;
    let storageListener: (() => void) | null = null;

    function onThemeChange() {
      // Force immediate redraw with new theme detection
      const currentTheme = getEffectiveTheme();
      resize();
      draw(); // Force immediate redraw
    }

    if (window.matchMedia) {
      mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", onThemeChange);
    }

    observer = new MutationObserver((mutations) => {
      let themeChanged = false;
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes') {
          if (mutation.attributeName === 'class' || mutation.attributeName === 'data-theme') {
            themeChanged = true;
          }
        }
      });
      if (themeChanged) {
        onThemeChange();
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme']
    });

    storageListener = () => {
      const event = new StorageEvent('storage', {
        key: 'theme-cache',
        newValue: localStorage.getItem('theme-cache')
      });
      if (event.key === 'theme-cache') {
        onThemeChange();
      }
    };

    window.addEventListener('storage', storageListener);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      if (mq) mq.removeEventListener("change", onThemeChange);
      if (observer) observer.disconnect();
      if (storageListener) window.removeEventListener('storage', storageListener);
    };
  }, []);

  return (
    <div>
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 -z-10"
        aria-hidden
      />
    </div>
  );
}
