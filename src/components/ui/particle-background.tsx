import React, { useEffect, useRef, useState } from "react";

// AnimatedBackground.tsx
// A single-file React component (TSX) that draws a lightweight particle animation
// onto a fullscreen canvas. It adapts to light/dark theme automatically (prefers-color-scheme)
// and provides a small preview/control UI so you can toggle between themes.

// Tailwind is used for quick styling — no external libraries are required.
// Drop this component into your app (e.g. <AnimatedBackground />) and
// place your app content above it (z-index > 0). The component is exported
// as default for easy imports.

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  hue: number;
};

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const DPR = typeof window !== "undefined" ? Math.max(window.devicePixelRatio || 1, 1) : 1;

  const getEffectiveTheme = () => {
    const hasDarkClass = document.documentElement.classList.contains('dark');
    const theme = hasDarkClass ? "dark" : "light";
    return theme;
  };

  useEffect(() => {
    setIsMounted(true);
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    if (!canvas) {
      return;
    }

    if (!ctx) {
      return;
    }

    let particles: Particle[] = [];
    let blobs: { x: number; y: number; r: number; vx: number; vy: number }[] = [];
    let matrixCols: { x: number; y: number; speed: number }[] = [];

    function resize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * DPR);
      canvas.height = Math.floor(h * DPR);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      // particles
      const pCount = Math.round((w * h) / 50000);
      particles = Array.from({ length: Math.max(20, pCount) }).map(() => createParticle(w, h));

      // blobs
      blobs = Array.from({ length: Math.max(3, Math.round(w / 400)) }).map(() => createBlob(w, h));

      // matrix
      const colWidth = 14;
      const cols = Math.ceil(w / colWidth);
      matrixCols = Array.from({ length: cols }).map((_, i) => ({ x: i * colWidth, y: Math.random() * h, speed: 2 + Math.random() * 4 }));
    }

    function createParticle(w: number, h: number): Particle {
      const speed = 0.2 + Math.random() * 0.8;
      const angle = Math.random() * Math.PI * 2;
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 0.8 + Math.random() * 2.4,
        hue: Math.random() * 50,
      };
    }

    function createBlob(w: number, h: number) {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        r: 60 + Math.random() * 140,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
      };
    }

    function drawWaves(theme: string, t: number) {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      // Create gradient background
      const g = ctx.createLinearGradient(0, 0, 0, h);
      if (theme === "dark") {
        g.addColorStop(0, "#02021a");
        g.addColorStop(1, "#000000");
      } else {
        g.addColorStop(0, "#fbfdff");
        g.addColorStop(1, "#ffffff");
      }
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      const bands = 5;
      for (let i = 0; i < bands; i++) {
        const amp = 12 + i * 8;
        const speed = 0.0004 + i * 0.0003;
        const offset = (i * Math.PI) / bands;

        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 15) {
          const y = h * (0.4 + (i - bands / 2) * 0.08) + Math.sin(x * 0.015 + t * speed + offset) * amp;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.closePath();

        // Theme-appropriate wave colors - good balance of visibility and subtlety
        if (theme === "dark") {
          ctx.fillStyle = `rgba(100,130,220,${0.15 + i * 0.05})`; // 15-35% opacity for dark
        } else {
          ctx.fillStyle = `rgba(60,100,180,${0.12 + i * 0.04})`; // 12-28% opacity for light
        }
        ctx.fill();
      }
    }

    function drawNebula(theme: string, t: number) {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      // base gradient
      const g = ctx.createLinearGradient(0, 0, w, h);
      if (theme === "dark") {
        g.addColorStop(0, "#020317");
        g.addColorStop(1, "#05010a");
      } else {
        g.addColorStop(0, "#f8fbff");
        g.addColorStop(1, "#eef6ff");
      }
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // layered soft blobs with noise-driven offsets
      for (let layer = 0; layer < 6; layer++) {
        ctx.save();
        ctx.globalAlpha = 0.06 + layer * 0.02;
        const cx = (w / 2) + Math.sin(t * 0.0002 * (layer + 1)) * (100 + layer * 40);
        const cy = (h / 2) + Math.cos(t * 0.00015 * (layer + 1)) * (80 + layer * 30);
        if (theme === "dark") {
          ctx.fillStyle = `rgba(100,130,220,${0.08 + layer * 0.02})`;
        } else {
          ctx.fillStyle = `rgba(60,100,180,${0.06 + layer * 0.015})`;
        }
        ctx.fill();
      }
    }

    function drawParticles(theme: string) {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      // background - transparent for particles to float over content
      if (theme === "dark") {
        ctx.fillStyle = "rgba(2, 3, 10, 0.95)"; // Semi-transparent dark background
        ctx.fillRect(0, 0, w, h);
      } else {
        ctx.clearRect(0, 0, w, h); // Fully transparent for light theme
        // Don't fill - keep transparent
      }

      const linkDist = Math.min(w, h) * 0.12;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        if (theme === "dark") {
          ctx.fillStyle = `hsla(${200 + p.hue}, 85%, ${60}%, 0.8)`; // Bright blue for dark
        } else {
          ctx.fillStyle = `#dc2626`; // Bright red for light theme contrast
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < linkDist) {
            const alpha = 1 - dist / linkDist;
            if (theme === "dark") {
              ctx.strokeStyle = `rgba(140,180,255,${0.06 * alpha})`; // Light blue links for dark
            } else {
              ctx.strokeStyle = `rgba(220,38,38,${0.08 * alpha})`; // Red links for light
            }
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
    }

    let start = performance.now();
    function draw() {
      const theme = getEffectiveTheme();
      const t = performance.now() - start;
      drawParticles(theme);
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

    function onThemeChange() {
      // Trigger redraw when theme changes
      resize();
    }

    // Listen to theme changes when mode is auto
    if (window.matchMedia) {
      mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", onThemeChange);
    }

    // Watch for dark class changes on document element
    observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          onThemeChange();
        }
      });
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      if (mq) mq.removeEventListener("change", onThemeChange);
      if (observer) observer.disconnect();
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
