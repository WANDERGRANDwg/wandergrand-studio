import { useEffect, useRef, useState } from "react";

/** Reveals every element flagged with [data-reveal] as it enters the viewport. */
export function useScrollReveal() {
  useEffect(() => {
    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]"),
    );

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      nodes.forEach((node) => node.classList.add("is-revealed"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);
}

/** Tracks which chapter is in view and marks matching nav items. */
export function useActiveSection(ids: string[]) {
  useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        document.querySelectorAll<HTMLElement>("[data-nav-item]").forEach((link) => {
          link.dataset.active =
            link.dataset.section === visible.target.id ? "true" : "false";
        });
      },
      { threshold: [0.15, 0.4, 0.65], rootMargin: "-20% 0px -50% 0px" },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ids]);
}

const createRainBuffer = (ctx: AudioContext) => {
  const seconds = 7;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i += 1) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.1 + white * 0.15;
  }
  return buffer;
};

/** A restrained, synthesized rain bed. Created only after a user gesture. */
export function useAmbience() {
  const [enabled, setEnabled] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const startedRef = useRef(false);

  const toggle = () => {
    try {
      if (!ctxRef.current) {
        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (!Ctx) return;
        const ctx = new Ctx();
        const source = ctx.createBufferSource();
        source.buffer = createRainBuffer(ctx);
        source.loop = true;

        const low = ctx.createBiquadFilter();
        low.type = "lowpass";
        low.frequency.value = 1500;
        const high = ctx.createBiquadFilter();
        high.type = "highpass";
        high.frequency.value = 280;
        const gain = ctx.createGain();
        gain.gain.value = 0;

        source.connect(high).connect(low).connect(gain).connect(ctx.destination);
        source.start();

        ctxRef.current = ctx;
        gainRef.current = gain;
        startedRef.current = true;
      }

      const ctx = ctxRef.current;
      const gain = gainRef.current;
      if (!ctx || !gain) return;

      if (!enabled) {
        void ctx.resume();
        gain.gain.cancelScheduledValues(ctx.currentTime);
        gain.gain.setTargetAtTime(0.075, ctx.currentTime, 1.1);
        setEnabled(true);
      } else {
        gain.gain.cancelScheduledValues(ctx.currentTime);
        gain.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
        setEnabled(false);
      }
    } catch {
      // Audio is a bonus; the experience works silently.
    }
  };

  useEffect(() => {
    return () => {
      if (startedRef.current) {
        void ctxRef.current?.close().catch(() => undefined);
      }
    };
  }, []);

  return { enabled, toggle };
}

/** A tiny ticking clock used for the island telemetry. */
export function useClock(interval = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), interval);
    return () => window.clearInterval(id);
  }, [interval]);
  return now;
}
