import { ArrowDown, ArrowUpRight, CloudRain, Play, Sword, Wind } from "lucide-react";
import { tickerItems } from "../data/game";
import { useClock } from "../hooks/useExperience";
import { FogBank } from "./Atmosphere";

function Ticker() {
  const row = [...tickerItems, ...tickerItems, ...tickerItems];
  return (
    <div className="relative z-20 overflow-hidden border-y border-bone/10 bg-abyss/90 py-3.5">
      <div className="animate-marquee flex w-max items-center whitespace-nowrap">
        {[0, 1].map((duplicate) => (
          <div key={duplicate} className="flex items-center" aria-hidden={duplicate === 1}>
            {row.map((item, i) => (
              <span
                key={`${duplicate}-${item}-${i}`}
                className="flex items-center font-mono text-[9px] uppercase tracking-[0.32em] text-mist-dim"
              >
                <span className="px-7">{item}</span>
                <span className="h-[3px] w-[3px] rotate-45 bg-crimson/80" />
              </span>
            ))}
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-abyss to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-abyss to-transparent" />
    </div>
  );
}

export function Hero({ onPlay }: { onPlay: () => void }) {
  const now = useClock(30_000);
  const time = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  return (
    <>
      <section
        id="top"
        className="relative flex min-h-[100svh] flex-col overflow-hidden bg-void"
      >
        <div className="absolute inset-0">
          <img
            src="/images/sdfaker-hero.jpg"
            alt="Kya, cape rouge au vent, face à la Porte Interdite sur l'île de Sfaker"
            className="h-full w-full object-cover object-[68%_center] opacity-90 sm:object-center"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,10,11,0.97)_0%,rgba(4,10,11,0.86)_34%,rgba(4,10,11,0.35)_66%,rgba(4,10,11,0.42)_100%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-void via-void/10 to-void/55" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_78%_58%,rgba(134,216,208,0.08),transparent_46%)]" />
          <FogBank />
        </div>

        <div className="container-page relative z-10 flex flex-1 flex-col justify-end pb-0 pt-[130px] sm:pt-[150px]">
          <div className="grid flex-1 items-end gap-12 pb-12 lg:grid-cols-12 lg:gap-6 lg:pb-16">
            <div className="lg:col-span-8 xl:col-span-7">
              <div
                className="animate-rise flex flex-wrap items-center gap-3"
                style={{ animationDelay: "80ms" }}
              >
                <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-bone/70">
                  Wandergrand présente
                </span>
                <span className="h-px w-8 bg-crimson" />
                <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-mist-dim">
                  Acte I — La porte interdite
                </span>
              </div>

              <h1
                className="animate-rise mt-8 select-none"
                style={{ animationDelay: "180ms" }}
                aria-label="SDFAKER RIAN"
              >
                <span className="block font-display text-[clamp(4.4rem,12vw,10.5rem)] font-light uppercase leading-[0.78] tracking-[0.07em] text-bone">
                  Sdfaker
                </span>
                <span className="mt-2 flex items-end gap-5 sm:mt-3">
                  <span className="block font-display text-[clamp(4.2rem,11.5vw,10rem)] font-normal italic leading-[0.78] tracking-[0.015em] text-bone/95">
                    Rian
                  </span>
                  <span className="mb-2 h-2.5 w-2.5 rotate-45 bg-crimson shadow-[0_0_24px_rgba(179,52,59,0.9)] sm:mb-4 sm:h-3 sm:w-3" />
                </span>
              </h1>

              <div
                className="animate-rise mt-9 flex items-center gap-4"
                style={{ animationDelay: "300ms" }}
              >
                <span className="h-px w-12 bg-bone/25" />
                <p className="font-display text-[20px] italic leading-snug text-bone/85 sm:text-[24px]">
                  La pluie n'oublie rien.
                </p>
              </div>

              <p
                className="animate-rise mt-6 max-w-[520px] text-[14.5px] font-light leading-[1.85] text-mist sm:text-[15.5px]"
                style={{ animationDelay: "380ms" }}
              >
                Incarnez <span className="text-bone">Kya</span>, dernière porteuse de la
                lame. Traversez Brumepierre, survivez aux Slaches et rassemblez les{" "}
                <span className="text-bone">quinze clés</span> de la Porte Interdite. Au-delà,
                quelque chose vous attend — et il ne dort pas.
              </p>

              <div
                className="animate-rise mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center"
                style={{ animationDelay: "460ms" }}
              >
                <button
                  type="button"
                  onClick={onPlay}
                  className="btn-sweep group flex items-center justify-center gap-3 bg-bone px-7 py-[17px] font-mono text-[10px] uppercase tracking-[0.25em] text-void transition-colors hover:bg-white"
                >
                  <Play className="h-3.5 w-3.5 fill-crimson text-crimson" strokeWidth={1.5} />
                  Entrer dans la tempête
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={1.5} />
                </button>
                <a
                  href="#monde"
                  className="group flex items-center justify-center gap-3 border border-bone/20 bg-void/20 px-7 py-[17px] font-mono text-[10px] uppercase tracking-[0.25em] text-bone backdrop-blur-sm transition-colors hover:border-bone/45 hover:bg-bone/[0.05]"
                >
                  Explorer le monde
                  <ArrowDown className="h-3.5 w-3.5 text-mist transition-transform group-hover:translate-y-0.5" strokeWidth={1.5} />
                </a>
              </div>

              <div
                className="animate-rise mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[8.5px] uppercase tracking-[0.22em] text-mist-dim"
                style={{ animationDelay: "540ms" }}
              >
                <span className="flex items-center gap-2">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan" />
                  </span>
                  Démo jouable
                </span>
                <span className="hidden h-3 w-px bg-bone/15 sm:block" />
                <span>Action-RPG 3D · Solo</span>
                <span className="hidden h-3 w-px bg-bone/15 sm:block" />
                <span>Kya · Chapitre I</span>
              </div>
            </div>

            <div className="lg:col-span-4 xl:col-span-5 xl:flex xl:justify-end">
              <div
                className="animate-rise relative w-full max-w-[330px] border border-bone/15 bg-abyss/55 p-5 backdrop-blur-xl sm:p-6"
                style={{ animationDelay: "620ms" }}
              >
                <span className="absolute -left-px -top-px h-4 w-4 border-l border-t border-cyan/50" />
                <span className="absolute -bottom-px -right-px h-4 w-4 border-b border-r border-bone/30" />
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="eyebrow text-[8px]">Signal de l'île</p>
                    <p className="mt-2 font-display text-[23px] italic leading-none text-bone">
                      Sfaker
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[22px] font-light leading-none tracking-tight text-bone/90">
                      {time}
                    </p>
                    <p className="mt-1 font-mono text-[7.5px] uppercase tracking-[0.24em] text-mist-dim">
                      Heure locale
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 divide-x divide-bone/10 border-y border-bone/10 py-3.5">
                  <div className="flex items-center gap-2.5 pr-3">
                    <CloudRain className="h-4 w-4 text-cyan" strokeWidth={1.3} />
                    <div>
                      <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-bone/85">
                        Pluie battante
                      </p>
                      <p className="mt-0.5 font-mono text-[7.5px] tracking-[0.12em] text-mist-dim">
                        34 km/h · 12 °C
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 pl-3">
                    <Wind className="h-4 w-4 text-mist" strokeWidth={1.3} />
                    <div>
                      <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-bone/85">
                        Brume dense
                      </p>
                      <p className="mt-0.5 font-mono text-[7.5px] tracking-[0.12em] text-mist-dim">
                        Visibilité 40 m
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sword className="h-3.5 w-3.5 text-crimson" strokeWidth={1.4} />
                      <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-bone/80">
                        Les quinze clés
                      </p>
                    </div>
                    <p className="font-mono text-[9px] text-mist-dim">00 / 15</p>
                  </div>
                  <div className="mt-3 grid grid-cols-15 gap-[3px]">
                    {Array.from({ length: 15 }).map((_, i) => (
                      <span
                        key={i}
                        className="h-[13px] border border-bone/15 bg-bone/[0.025]"
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                  <p className="mt-3 font-display text-[13px] italic leading-snug text-mist">
                    « Une serrure se souvient toujours de celui qui l'a fermée. »
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden border-t border-bone/10 py-4 sm:block">
            <div className="flex items-center justify-between gap-6">
              <div className="grid flex-1 grid-cols-4">
                {[
                  ["01", "L'île de Sfaker"],
                  ["02", "Kya de Brumepierre"],
                  ["03", "La grande porte"],
                  ["04", "L'Éclicosmique"],
                ].map(([index, label]) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="font-mono text-[8px] tracking-[0.16em] text-crimson/80">
                      {index}
                    </span>
                    <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-mist-dim">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 text-mist-dim">
                <span className="font-mono text-[8px] uppercase tracking-[0.24em]">
                  Défiler
                </span>
                <span className="relative block h-9 w-px overflow-hidden bg-bone/15">
                  <span className="absolute left-0 top-0 block h-3 w-px animate-[float-slow_2.6s_ease-in-out_infinite] bg-cyan" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Ticker />
    </>
  );
}
