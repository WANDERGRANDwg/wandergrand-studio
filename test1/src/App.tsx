import { useCallback, useEffect, useState } from "react";
import { RainCanvas, FilmGrain } from "./components/Atmosphere";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { WorldSection } from "./components/WorldSection";
import { KyaSection } from "./components/KyaSection";
import { KeysSection } from "./components/KeysSection";
import { BossSection } from "./components/BossSection";
import { GameplaySection } from "./components/GameplaySection";
import { Footer } from "./components/Footer";
import { DemoModal } from "./components/DemoModal";
import { useScrollReveal } from "./hooks/useExperience";

function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-[55] h-[2px] bg-transparent"
    >
      <div
        className="h-full bg-gradient-to-r from-crimson via-brass to-cyan transition-[width] duration-150 ease-out"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  );
}

export default function App() {
  const [demoOpen, setDemoOpen] = useState(false);
  const [rainStopped, setRainStopped] = useState(false);
  useScrollReveal();

  const openDemo = useCallback(() => setDemoOpen(true), []);
  const closeDemo = useCallback(() => setDemoOpen(false), []);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-void">
      <a
        href="#monde"
        className="sr-only z-[200] bg-bone px-4 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-void focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Aller au contenu
      </a>

      <ScrollProgress />

      <div
        className={`transition-opacity duration-[1800ms] ease-out ${
          rainStopped ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <RainCanvas />
      </div>
      <FilmGrain />

      <Navbar onPlay={openDemo} />

      <main>
        <Hero onPlay={openDemo} />
        <WorldSection />
        <KyaSection />
        <KeysSection />
        <BossSection onPlay={openDemo} />
        <GameplaySection onPlay={openDemo} />
      </main>

      <Footer
        onPlay={openDemo}
        rainStopped={rainStopped}
        onToggleRain={() => setRainStopped((value) => !value)}
      />

      {demoOpen && <DemoModal onClose={closeDemo} />}
    </div>
  );
}
