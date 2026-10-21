import { useEffect, useRef } from "react";

/**
 * Screen-space rain field. Deliberately restrained: the rain sits above the
 * artwork, never above navigation or interactive overlays.
 */
export function RainCanvas({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let raf = 0;
    let last = performance.now();

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    type Drop = { x: number; y: number; len: number; speed: number; alpha: number };
    let drops: Drop[] = [];

    const makeDrops = () => {
      const count = Math.round(
        Math.min(210, Math.max(70, (width * height) / 15000)),
      );
      drops = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        len: 10 + Math.random() * 24,
        speed: 520 + Math.random() * 820,
        alpha: 0.1 + Math.random() * 0.32,
      }));
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      makeDrops();
    };

    resize();

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 1;
      ctx.lineCap = "round";
      for (const d of drops) {
        d.y += d.speed * dt;
        d.x -= d.speed * 0.07 * dt;
        if (d.y > height + 30) {
          d.y = -30;
          d.x = Math.random() * (width + 120);
        }
        if (d.x < -30) d.x = width + 20;
        ctx.strokeStyle = `rgba(186, 219, 215, ${d.alpha})`;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + d.len * 0.16, d.y + d.len);
        ctx.stroke();
      }
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-30 ${className}`}
    />
  );
}

export function FilmGrain() {
  return (
    <div
      aria-hidden="true"
      className="grain-layer pointer-events-none fixed inset-0 z-[35] opacity-[0.045] mix-blend-overlay"
    />
  );
}

export function FogBank({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <div className="animate-fog absolute -left-1/4 top-1/3 h-[48vh] w-[90vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(113,151,148,0.14),transparent_65%)] blur-2xl" />
      <div
        className="animate-fog absolute -right-1/4 top-2/3 h-[38vh] w-[80vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(73,111,110,0.16),transparent_65%)] blur-2xl"
        style={{ animationDelay: "-14s", animationDuration: "44s" }}
      />
    </div>
  );
}

export function Vignette() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(4,9,10,0.72)_100%)]"
    />
  );
}
