import { useEffect, useState } from "react";
import { Menu, Play, Volume2, VolumeX, X } from "lucide-react";
import { navLinks } from "../data/game";
import { useActiveSection, useAmbience } from "../hooks/useExperience";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <a href="#top" className="group flex items-center gap-3" aria-label="SDFAKER RIAN — accueil">
      <span className="relative grid h-9 w-9 shrink-0 place-items-center">
        <svg viewBox="0 0 40 40" className="h-full w-full" aria-hidden="true">
          <path
            d="M20 2.5 37.5 20 20 37.5 2.5 20Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.9"
            className="text-bone/35 transition-colors group-hover:text-cyan/70"
          />
          <path d="M20 9.5 30.5 20 20 30.5 9.5 20Z" fill="none" stroke="#b3343b" strokeWidth="1.1" />
          <path d="M20 13.5v13M16.5 17l7 6M23.5 17l-7 6" stroke="currentColor" strokeWidth="0.8" className="text-bone/80" />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-mono text-[9px] uppercase tracking-[0.36em] text-mist-dim transition-colors group-hover:text-mist">
          Wandergrand
        </span>
        {!compact && (
          <span className="mt-1.5 font-display text-[17px] uppercase leading-none tracking-[0.16em] text-bone">
            Sdfaker Rian
          </span>
        )}
      </span>
    </a>
  );
}

export function Navbar({ onPlay }: { onPlay: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { enabled, toggle } = useAmbience();
  useActiveSection(["monde", "kya", "cles", "eclicosmique", "manuel"]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled
            ? "border-b border-bone/10 bg-void/80 backdrop-blur-xl"
            : "border-b border-transparent bg-gradient-to-b from-void/55 to-transparent"
        }`}
      >
        <div className="container-page flex h-[74px] items-center justify-between gap-6">
          <BrandMark />

          <nav className="hidden items-center gap-4 lg:flex xl:gap-6" aria-label="Chapitres">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                data-nav-item
                data-section={link.href.slice(1)}
                data-active="false"
                className="group flex items-baseline gap-1.5 whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.14em] text-mist/80 transition-colors duration-300 hover:text-bone data-[active=true]:text-bone xl:text-[10px] xl:tracking-[0.18em]"
              >
                <span className="text-[7.5px] text-crimson/80 transition-colors group-data-[active=true]:text-crimson">
                  {link.index}
                </span>
                {link.label}
                <span className="ml-0.5 hidden h-[3px] w-[3px] rounded-full bg-cyan opacity-0 transition-opacity group-data-[active=true]:opacity-100 xl:block" />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2.5 sm:gap-4">
            <button
              type="button"
              onClick={toggle}
              aria-pressed={enabled}
              aria-label={enabled ? "Couper l'ambiance sonore" : "Activer l'ambiance sonore"}
              className="group hidden items-center gap-2 text-mist/75 transition-colors hover:text-bone xl:flex"
              title={enabled ? "Couper la pluie" : "Écouter la pluie"}
            >
              {enabled ? (
                <Volume2 className="h-[17px] w-[17px] text-cyan" strokeWidth={1.4} />
              ) : (
                <VolumeX className="h-[17px] w-[17px]" strokeWidth={1.4} />
              )}
              <span className="hidden font-mono text-[9px] uppercase tracking-[0.22em] xl:inline">
                {enabled ? "Pluie active" : "Ambiance"}
              </span>
            </button>

            <span className="hidden h-4 w-px bg-bone/15 sm:block" />

            <button
              type="button"
              onClick={onPlay}
              className="btn-sweep group relative hidden items-center gap-2.5 border border-bone/20 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.24em] text-bone transition-colors hover:border-bone/50 hover:bg-bone/[0.04] sm:flex"
            >
              <Play className="h-3 w-3 fill-crimson text-crimson transition-transform group-hover:scale-110" strokeWidth={1.5} />
              Jouer
            </button>

            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Ouvrir le menu"
              className="grid h-10 w-10 place-items-center border border-bone/15 text-bone transition-colors hover:border-bone/40 lg:hidden"
            >
              <Menu className="h-5 w-5" strokeWidth={1.3} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-[70] lg:hidden ${open ? "visible" : "invisible"}`}
        aria-hidden={!open}
      >
        <button
          type="button"
          tabIndex={open ? 0 : -1}
          aria-label="Fermer le menu"
          onClick={() => setOpen(false)}
          className={`absolute inset-0 h-full w-full bg-void/75 backdrop-blur-md transition-opacity duration-500 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          className={`absolute inset-y-0 right-0 flex w-full max-w-[440px] flex-col border-l border-bone/10 bg-abyss transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex h-[74px] items-center justify-between border-b border-bone/10 px-6">
            <span className="eyebrow">Chapitres</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer"
              className="grid h-10 w-10 place-items-center border border-bone/15 text-bone"
            >
              <X className="h-4 w-4" strokeWidth={1.3} />
            </button>
          </div>

          <nav className="flex flex-1 flex-col justify-center gap-1 px-6" aria-label="Menu mobile">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="group flex items-baseline gap-4 border-b border-bone/[0.07] py-4"
              >
                <span className="font-mono text-[10px] tracking-[0.2em] text-crimson">
                  {link.index}
                </span>
                <span className="font-display text-[30px] leading-none text-bone transition-colors group-hover:text-cyan">
                  {link.label}
                </span>
              </a>
            ))}
          </nav>

          <div className="space-y-5 px-6 pb-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="eyebrow">Le monde</p>
                <p className="mt-1 font-display text-lg italic text-bone/80">
                  Une île sous la pluie.
                </p>
              </div>
              <button
                type="button"
                onClick={toggle}
                className="flex items-center gap-2 border border-bone/15 px-3 py-2.5 text-mist"
                aria-label="Basculer l'ambiance"
              >
                {enabled ? (
                  <Volume2 className="h-4 w-4 text-cyan" strokeWidth={1.4} />
                ) : (
                  <VolumeX className="h-4 w-4" strokeWidth={1.4} />
                )}
                <span className="font-mono text-[9px] uppercase tracking-[0.2em]">
                  {enabled ? "On" : "Off"}
                </span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onPlay();
              }}
              className="flex w-full items-center justify-center gap-3 bg-bone px-6 py-4 font-mono text-[11px] uppercase tracking-[0.25em] text-void"
            >
              <Play className="h-3.5 w-3.5 fill-crimson text-crimson" strokeWidth={1.5} />
              Jouer la démo
            </button>
            <p className="text-center font-mono text-[8px] uppercase tracking-[0.24em] text-mist-dim">
              WANDERGRAND · Randriamanantiana Judickael
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
