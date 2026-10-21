import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  Compass,
  Gem,
  KeyRound,
  Lock,
  RotateCcw,
  Skull,
  Sparkles,
  Unlock,
} from "lucide-react";
import { keySources } from "../data/game";

const STORAGE_KEY = "sdfaker-rian-forged-keys";
const total = 15;

const sourceIcons = {
  slache: Skull,
  stone: Gem,
  compass: Compass,
};

function loadKeys(): number[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (value): value is number =>
        typeof value === "number" && Number.isInteger(value) && value >= 0 && value < total,
    );
  } catch {
    return [];
  }
}

export function KeysSection() {
  const [forged, setForged] = useState<number[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setForged(loadKeys());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(forged));
    } catch {
      // Storage may be unavailable in private browsing.
    }
  }, [forged, hydrated]);

  const toggle = (index: number) => {
    setForged((current) =>
      current.includes(index)
        ? current.filter((value) => value !== index)
        : [...current, index],
    );
  };

  const count = forged.length;
  const complete = count === total;
  const progress = (count / total) * 100;
  const status = complete
    ? "La Porte cède. Au-delà, l'Éclicosmique ouvre un œil."
    : count >= 10
      ? "Trois serrures encore. L'île retient son souffle."
      : count >= 5
        ? "La Porte vous a entendu. Elle attend le reste."
        : "La Porte dort encore. Chaque clé réveille une serrure.";

  return (
    <section id="cles" className="relative overflow-hidden bg-void py-24 md:py-32 lg:py-36">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[600px] bg-[radial-gradient(ellipse_at_72%_20%,rgba(52,103,102,0.24),transparent_62%)]"
      />
      <div className="container-page relative">
        <div className="flex items-baseline justify-between gap-6 border-t border-bone/12 pt-5" data-reveal>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[9px] tracking-[0.2em] text-crimson">03</span>
            <span className="eyebrow">L'objectif · Les quinze clés</span>
          </div>
          <span className="hidden font-mono text-[8.5px] uppercase tracking-[0.24em] text-mist-dim sm:block">
            Journal de progression
          </span>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-12 lg:items-end" data-reveal>
          <h2 className="font-display text-[clamp(2.9rem,6.3vw,5.8rem)] leading-[0.92] text-bone lg:col-span-7">
            Quinze clés.
            <br />
            <span className="italic text-mist">Une seule porte.</span>
          </h2>
          <div className="lg:col-span-5">
            <p className="max-w-[470px] text-[14px] leading-[1.9] text-mist sm:text-[15px]">
              Aucune serrure n'est identique. Certaines se gagnent dans le sang des
              Slaches, d'autres dans les pierres bleues, et six attendent simplement que
              quelqu'un ose quitter le chemin.
            </p>
            <div className="mt-5 flex items-center gap-3 font-mono text-[8.5px] uppercase tracking-[0.2em] text-mist-dim">
              <Sparkles className="h-3.5 w-3.5 text-brass" strokeWidth={1.4} />
              Carnet du pèlerin — cliquez pour consigner
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-12" data-reveal style={{ "--reveal-delay": "100ms" } as React.CSSProperties}>
          {/* Key collector */}
          <div
            className={`relative border bg-abyss/60 p-5 transition-shadow duration-700 sm:p-7 lg:col-span-7 ${
              complete
                ? "border-cyan/40 shadow-[0_0_60px_rgba(134,216,208,0.12)]"
                : "border-bone/12"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <KeyRound className="h-3.5 w-3.5 text-brass" strokeWidth={1.4} />
                  <p className="font-mono text-[8.5px] uppercase tracking-[0.24em] text-bone/85">
                    Le carnet des clés
                  </p>
                </div>
                <p className="mt-2 font-display text-[20px] italic text-mist sm:text-[23px]">
                  Chaque clé se souvient d'une main.
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-[36px] leading-none text-bone sm:text-[44px]">
                  {String(count).padStart(2, "0")}
                  <span className="text-[20px] text-mist-dim"> / 15</span>
                </p>
                <button
                  type="button"
                  onClick={() => setForged([])}
                  disabled={count === 0}
                  className="mt-2 inline-flex items-center gap-1.5 font-mono text-[7.5px] uppercase tracking-[0.18em] text-mist-dim transition-colors hover:text-bone disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <RotateCcw className="h-2.5 w-2.5" strokeWidth={1.6} />
                  Réinitialiser
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-5 gap-2 sm:gap-2.5" role="group" aria-label="Les quinze clés">
              {Array.from({ length: total }).map((_, index) => {
                const isForged = forged.includes(index);
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => toggle(index)}
                    aria-pressed={isForged}
                    aria-label={`Clé ${index + 1}${isForged ? " — forgée" : " — manquante"}`}
                    className={`group relative flex aspect-square flex-col items-center justify-center gap-1.5 border transition-all duration-300 ${
                      isForged
                        ? "border-brass/55 bg-brass/[0.09] shadow-[inset_0_0_22px_rgba(197,167,120,0.09)]"
                        : "border-bone/12 bg-void/40 hover:border-cyan/35 hover:bg-tide/30"
                    }`}
                  >
                    <span
                      className={`font-mono text-[7px] tracking-[0.1em] ${
                        isForged ? "text-brass/70" : "text-mist-dim/70"
                      }`}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <KeyRound
                      className={`h-4 w-4 transition-all duration-300 sm:h-[19px] sm:w-[19px] ${
                        isForged
                          ? "-rotate-45 text-brass drop-shadow-[0_0_8px_rgba(197,167,120,0.55)]"
                          : "rotate-12 text-mist-dim/45 group-hover:rotate-0 group-hover:text-cyan/70"
                      }`}
                      strokeWidth={1.4}
                    />
                    <span
                      className={`absolute right-1 top-1 h-1 w-1 rounded-full transition-colors ${
                        isForged ? "bg-brass" : "bg-bone/15"
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between font-mono text-[7.5px] uppercase tracking-[0.18em] text-mist-dim">
                <span>Progression du pèlerin</span>
                <span className={complete ? "text-cyan" : "text-bone/65"}>
                  {complete ? "Porte ouverte" : `${total - count} manquante${total - count > 1 ? "s" : ""}`}
                </span>
              </div>
              <div className="relative mt-2.5 h-[4px] overflow-hidden bg-bone/10">
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out ${
                    complete
                      ? "bg-gradient-to-r from-brass via-cyan to-cyan shadow-[0_0_14px_rgba(134,216,208,0.7)]"
                      : "bg-gradient-to-r from-crimson to-brass"
                  }`}
                  style={{ width: `${progress}%` }}
                />
                <div className="absolute inset-0 flex justify-between px-[1px]">
                  {Array.from({ length: total - 1 }).map((_, i) => (
                    <span key={i} className="h-full w-px bg-void/55" />
                  ))}
                </div>
              </div>
              <div className="mt-4 flex items-start gap-2.5">
                {complete ? (
                  <Unlock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan" strokeWidth={1.5} />
                ) : (
                  <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mist-dim" strokeWidth={1.5} />
                )}
                <p
                  className={`font-display text-[15px] italic leading-snug ${
                    complete ? "text-cyan/90" : "text-mist"
                  }`}
                  aria-live="polite"
                >
                  {status}
                </p>
              </div>
            </div>

            {complete && (
              <a
                href="#eclicosmique"
                className="group mt-5 flex items-center justify-between gap-4 border border-cyan/30 bg-cyan/[0.06] px-4 py-3.5 transition-colors hover:bg-cyan/[0.1]"
              >
                <span className="font-mono text-[8.5px] uppercase tracking-[0.2em] text-cyan">
                  La Porte est ouverte · descendre
                </span>
                <ArrowDown className="h-4 w-4 text-cyan transition-transform group-hover:translate-y-0.5" strokeWidth={1.4} />
              </a>
            )}
          </div>

          {/* Gate */}
          <div className="relative overflow-hidden border border-bone/12 lg:col-span-5">
            <img
              src="/images/forbidden-gate.jpg"
              alt="La grande Porte Interdite aux quinze serrures, sous une pluie battante"
              className="h-full min-h-[300px] w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-void via-void/30 to-void/30" />
            <div
              className={`absolute inset-0 transition-opacity duration-1000 ${
                complete
                  ? "opacity-100 bg-[radial-gradient(circle_at_50%_55%,rgba(134,216,208,0.18),transparent_55%)]"
                  : "opacity-0"
              }`}
            />
            <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 sm:p-5">
              <span className="border border-bone/20 bg-void/45 px-3 py-1.5 font-mono text-[7.5px] uppercase tracking-[0.22em] text-bone/80 backdrop-blur-md">
                Zone interdite
              </span>
              <span className="flex items-center gap-2 border border-bone/15 bg-void/45 px-2.5 py-1.5 backdrop-blur-md">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    complete ? "bg-cyan shadow-[0_0_8px_rgba(134,216,208,0.9)]" : "animate-pulse bg-crimson"
                  }`}
                />
                <span className="font-mono text-[7.5px] uppercase tracking-[0.16em] text-bone/80">
                  {complete ? "Ouverte" : "Scellée"}
                </span>
              </span>
            </div>
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
              <p className="font-mono text-[8px] uppercase tracking-[0.26em] text-mist">
                Quinze serrures · une promesse
              </p>
              <p className="mt-2 font-display text-[30px] leading-none text-bone sm:text-[36px]">
                La Porte Interdite
              </p>
              <div className="mt-4 flex items-center gap-3">
                <span className="h-1 w-1 rotate-45 bg-crimson" />
                <p className="font-display text-[14px] italic leading-snug text-mist">
                  {complete
                    ? "La pierre se fend. Un souffle chaud monte des profondeurs."
                    : "Derrière elle, quelque chose compte les battements de votre cœur."}
                </p>
              </div>
              <div className="mt-5 flex gap-[3px]">
                {Array.from({ length: total }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-[3px] flex-1 transition-colors duration-500 ${
                      i < count ? "bg-cyan/80" : "bg-bone/20"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sources */}
        <div className="mt-16" data-reveal>
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-bone/12 pb-4">
            <h3 className="font-display text-[26px] leading-none text-bone sm:text-[30px]">
              Trois façons de forger une clé
            </h3>
            <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-mist-dim">
              Aucune n'est indolore
            </p>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {keySources.map((source) => {
              const Icon = sourceIcons[source.icon];
              return (
                <article
                  key={source.id}
                  className="group relative flex flex-col overflow-hidden border border-bone/12 bg-abyss/50 transition-colors hover:border-bone/25"
                >
                  <div className="relative h-[150px] overflow-hidden">
                    <img
                      src={
                        source.id === "slaches"
                          ? "/images/slache.jpg"
                          : source.id === "pierres"
                            ? "/images/blue-stone.jpg"
                            : "/images/village.jpg"
                      }
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-abyss via-abyss/30 to-void/25" />
                    <div className="absolute left-4 top-4 flex items-center gap-2 border border-bone/20 bg-void/50 px-2.5 py-1.5 backdrop-blur-md">
                      <Icon className="h-3 w-3 text-cyan" strokeWidth={1.5} />
                      <span className="font-mono text-[7px] uppercase tracking-[0.2em] text-bone/80">
                        Voie {source.index}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-4 flex items-baseline gap-2">
                      <span className="font-display text-[38px] leading-none text-bone">
                        {source.amount}
                      </span>
                      <span className="font-mono text-[7.5px] uppercase tracking-[0.16em] text-mist">
                        {source.unit}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col justify-between gap-5 p-5">
                    <div>
                      <h4 className="font-display text-[23px] leading-tight text-bone">
                        {source.title}
                      </h4>
                      <p className="mt-2.5 text-[12.5px] leading-[1.8] text-mist">
                        {source.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between border-t border-bone/10 pt-3">
                      <span className="font-mono text-[7.5px] uppercase tracking-[0.18em] text-mist-dim">
                        {source.id === "pierres" ? "Troc · Brumepierre" : source.id === "slaches" ? "Combat · Partout" : "Exploration · 06 sites"}
                      </span>
                      <ArrowRight className="h-3 w-3 text-mist-dim transition-all group-hover:translate-x-0.5 group-hover:text-cyan" strokeWidth={1.5} />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="mt-5 flex flex-col items-start justify-between gap-6 border border-brass/20 bg-[linear-gradient(100deg,rgba(197,167,120,0.06),rgba(11,24,25,0.4))] p-5 sm:flex-row sm:items-center sm:p-6" data-reveal>
          <div className="flex items-center gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center border border-brass/30 bg-brass/[0.06]">
              <Gem className="h-5 w-5 text-cyan" strokeWidth={1.3} />
            </span>
            <div>
              <p className="font-mono text-[8px] uppercase tracking-[0.22em] text-brass">
                Le troc des Veilleurs
              </p>
              <p className="mt-1.5 font-display text-[21px] leading-snug text-bone">
                30 pierres bleues <span className="italic text-mist">pour une clé.</span>
              </p>
            </div>
          </div>
          <p className="max-w-[360px] text-[12.5px] leading-relaxed text-mist">
            La gardienne de Brumepierre ne demande aucune explication. Seulement trente
            éclats, et un peu de patience sous l'averse.
          </p>
        </div>
      </div>
    </section>
  );
}
