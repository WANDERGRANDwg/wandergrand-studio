import { useState } from "react";
import {
  ArrowUpRight,
  CloudRain,
  Compass,
  Crosshair,
  MapPin,
  ShieldAlert,
} from "lucide-react";
import { regions } from "../data/game";

export function WorldSection() {
  const [activeId, setActiveId] = useState("village");
  const active = regions.find((region) => region.id === activeId) ?? regions[0];

  return (
    <section id="monde" className="relative overflow-hidden bg-void py-24 md:py-32 lg:py-36">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 15% 20%, rgba(31,67,68,0.32), transparent 55%), radial-gradient(ellipse at 85% 75%, rgba(34,46,48,0.4), transparent 55%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.09]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(236,230,215,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(236,230,215,0.5) 1px, transparent 1px)",
          backgroundSize: "92px 92px",
          maskImage: "radial-gradient(ellipse at center, black, transparent 72%)",
        }}
      />

      <div className="container-page relative">
        <div className="flex items-baseline justify-between gap-6 border-t border-bone/12 pt-5" data-reveal>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[9px] tracking-[0.2em] text-crimson">01</span>
            <span className="eyebrow">Le monde · Sfaker</span>
          </div>
          <span className="hidden font-mono text-[8.5px] uppercase tracking-[0.24em] text-mist-dim sm:block">
            61° 12′ N — 07° 44′ O
          </span>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-10" data-reveal>
          <div className="lg:col-span-7">
            <h2 className="font-display text-[clamp(2.9rem,6.3vw,5.8rem)] leading-[0.92] text-bone">
              Une île
              <br />
              <span className="italic text-mist">qui se souvient.</span>
            </h2>
          </div>
          <div className="lg:col-span-5 lg:pb-1">
            <p className="max-w-[470px] text-[14px] leading-[1.9] text-mist sm:text-[15px]">
              Cinq cents mètres de falaises, de pins noirs et de chemins noyés. Sfaker
              n'apparaît sur aucune carte récente : les marins l'appellent « la terre qui
              respire ». Chaque nuit, la pluie redessine ses frontières.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <span className="h-px w-8 bg-cyan/60" />
              <p className="font-display text-[18px] italic text-bone/75">
                « Restez sur les chemins. Ils se souviennent de vous. »
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-12" data-reveal style={{ "--reveal-delay": "120ms" } as React.CSSProperties}>
          {/* Interactive map */}
          <div className="relative lg:col-span-8">
            <div className="frame-corner relative aspect-[4/3] overflow-hidden border border-bone/15 bg-deep sm:aspect-[16/11] lg:aspect-[16/10]">
              <img
                src="/images/village.jpg"
                alt="Brumepierre, village de pêcheurs éclairé de lanternes sous la pluie"
                className="h-full w-full object-cover transition-transform duration-[1400ms] ease-out hover:scale-[1.03]"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-void/95 via-void/25 to-void/45" />
              <div className="absolute inset-0 bg-gradient-to-r from-void/35 to-transparent" />

              <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-4 sm:left-6 sm:right-6 sm:top-5">
                <div className="flex items-center gap-2.5 border border-bone/20 bg-void/45 px-3 py-2 backdrop-blur-md">
                  <Compass className="h-3.5 w-3.5 text-cyan" strokeWidth={1.4} />
                  <span className="font-mono text-[8px] uppercase tracking-[0.25em] text-bone/80">
                    Carte vivante
                  </span>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[8px] uppercase tracking-[0.22em] text-mist-dim">
                    Île de Sfaker
                  </p>
                  <p className="mt-1 font-mono text-[9px] tracking-[0.12em] text-bone/70">
                    500 × 500 m
                  </p>
                </div>
              </div>

              {regions.map((region, index) => {
                const active = region.id === activeId;
                const labelLeft = region.x > 66;
                return (
                  <button
                    key={region.id}
                    type="button"
                    onClick={() => setActiveId(region.id)}
                    aria-pressed={active}
                    aria-label={`Découvrir ${region.name}`}
                    className="group absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${region.x}%`, top: `${region.y}%` }}
                  >
                    <span className="relative flex items-center gap-2.5">
                      <span className="relative grid place-items-center">
                        <span
                          className={`absolute h-8 w-8 rounded-full border transition-all duration-500 ${
                            active
                              ? "animate-marker border-cyan/70 bg-cyan/10"
                              : "border-bone/25 bg-void/40 group-hover:border-cyan/60"
                          }`}
                        />
                        <span
                          className={`h-1.5 w-1.5 rotate-45 transition-colors ${
                            active ? "bg-cyan shadow-[0_0_12px_rgba(134,216,208,0.9)]" : "bg-bone/70"
                          }`}
                        />
                      </span>
                      <span
                        className={`hidden items-center gap-2 whitespace-nowrap border py-1.5 pl-2 pr-2.5 backdrop-blur-md transition-all duration-300 sm:flex ${
                          labelLeft ? "order-first" : ""
                        } ${
                          active
                            ? "border-cyan/40 bg-void/80"
                            : "border-bone/15 bg-void/45 group-hover:border-bone/30 group-hover:bg-void/70"
                        }`}
                      >
                        <span className="font-mono text-[7px] tracking-[0.12em] text-crimson">
                          0{index + 1}
                        </span>
                        <span
                          className={`font-mono text-[8px] uppercase tracking-[0.16em] ${
                            active ? "text-bone" : "text-mist"
                          }`}
                        >
                          {region.name}
                        </span>
                      </span>
                    </span>
                  </button>
                );
              })}

              <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-end justify-between gap-4 sm:bottom-6 sm:left-6 sm:right-6">
                <div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-crimson" strokeWidth={1.5} />
                    <p className="font-mono text-[8px] uppercase tracking-[0.24em] text-mist">
                      Position active
                    </p>
                  </div>
                  <p className="mt-2 font-display text-[26px] leading-none text-bone sm:text-[32px]">
                    {active.name}
                  </p>
                  <p className="mt-1.5 font-display text-[15px] italic text-mist">
                    {active.subtitle}
                  </p>
                </div>
                <div className="flex items-center gap-2 border border-bone/15 bg-void/55 px-3 py-2 backdrop-blur-md">
                  <CloudRain className="h-3.5 w-3.5 text-cyan" strokeWidth={1.4} />
                  <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-bone/75">
                    {active.weather}
                  </span>
                </div>
              </div>
            </div>
            <p className="mt-3 flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.22em] text-mist-dim">
              <span>Sélectionnez un repère pour lire le dossier</span>
              <span className="hidden sm:inline">Archive cartographique — 01/07</span>
            </p>
          </div>

          {/* Region dossier */}
          <div className="flex flex-col border border-bone/12 bg-abyss/65 backdrop-blur-sm lg:col-span-4">
            <div className="flex items-center justify-between border-b border-bone/10 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <Crosshair className="h-3.5 w-3.5 text-crimson" strokeWidth={1.4} />
                <span className="font-mono text-[8.5px] uppercase tracking-[0.24em] text-bone/80">
                  Régions · 04
                </span>
              </div>
              <span className="font-mono text-[8px] tracking-[0.18em] text-mist-dim">
                SFAKER
              </span>
            </div>

            <div className="flex flex-col divide-y divide-bone/[0.08]">
              {regions.map((region, index) => {
                const isActive = region.id === activeId;
                return (
                  <button
                    key={region.id}
                    type="button"
                    onClick={() => setActiveId(region.id)}
                    aria-pressed={isActive}
                    className={`group relative flex items-center justify-between gap-4 px-5 py-4 text-left transition-colors ${
                      isActive ? "bg-tide/45" : "hover:bg-tide/25"
                    }`}
                  >
                    <span
                      className={`absolute inset-y-0 left-0 w-[2px] bg-crimson transition-opacity ${
                        isActive ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    <span className="flex min-w-0 items-center gap-3">
                      <span
                        className={`font-mono text-[9px] tracking-[0.12em] ${
                          isActive ? "text-crimson" : "text-mist-dim"
                        }`}
                      >
                        0{index + 1}
                      </span>
                      <span className="min-w-0">
                        <span
                          className={`block truncate font-display text-[19px] leading-tight transition-colors ${
                            isActive ? "text-bone" : "text-bone/65 group-hover:text-bone"
                          }`}
                        >
                          {region.name}
                        </span>
                        <span className="mt-0.5 block truncate font-mono text-[7.5px] uppercase tracking-[0.16em] text-mist-dim">
                          {region.subtitle}
                        </span>
                      </span>
                    </span>
                    <ArrowUpRight
                      className={`h-3.5 w-3.5 shrink-0 transition-all ${
                        isActive ? "text-cyan" : "text-mist-dim opacity-0 group-hover:opacity-100"
                      }`}
                      strokeWidth={1.3}
                    />
                  </button>
                );
              })}
            </div>

            <div className="flex flex-1 flex-col justify-between gap-5 border-t border-bone/10 p-5">
              <p className="text-[13px] leading-[1.85] text-mist">{active.description}</p>
              <div className="flex flex-wrap gap-2">
                <span className="flex items-center gap-1.5 border border-bone/12 px-2.5 py-1.5 font-mono text-[7.5px] uppercase tracking-[0.16em] text-bone/70">
                  <CloudRain className="h-3 w-3 text-cyan-dim" strokeWidth={1.5} />
                  {active.weather}
                </span>
                <span className="flex items-center gap-1.5 border border-crimson/25 bg-crimson/[0.06] px-2.5 py-1.5 font-mono text-[7.5px] uppercase tracking-[0.16em] text-ember">
                  <ShieldAlert className="h-3 w-3" strokeWidth={1.5} />
                  Risque {active.risk}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-px border border-bone/12 bg-bone/12 sm:grid-cols-4" data-reveal>
          {[
            ["500 × 500", "mètres d'île", "Un seul horizon"],
            ["04", "régions", "Chacune a sa loi"],
            ["15", "clés scellées", "Une porte sans retour"],
            ["10", "barres de vie", "Et une lueur rouge"],
          ].map(([value, label, detail]) => (
            <div key={label} className="group bg-void px-5 py-6 transition-colors hover:bg-abyss">
              <p className="font-display text-[30px] leading-none text-bone sm:text-[34px]">{value}</p>
              <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.22em] text-crimson/80">{label}</p>
              <p className="mt-2 font-display text-[14px] italic text-mist-dim transition-colors group-hover:text-mist">
                {detail}
              </p>
            </div>
          ))}
        </div>

        {/* Bestiary */}
        <div className="mt-20 grid gap-0 border border-bone/12 bg-abyss/50 md:grid-cols-12" data-reveal>
          <div className="relative min-h-[300px] overflow-hidden md:col-span-5 lg:min-h-[360px]">
            <img
              src="/images/slache.jpg"
              alt="Un Slache, créature masquée aux yeux cyan tapie dans la forêt"
              className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-[1800ms] hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-abyss/80" />
            <div className="absolute bottom-4 left-4 flex items-center gap-2 border border-crimson/30 bg-void/70 px-3 py-2 backdrop-blur-md">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-crimson" />
              <span className="font-mono text-[8px] uppercase tracking-[0.24em] text-bone/85">
                Bestiaire · 01
              </span>
            </div>
          </div>
          <div className="flex flex-col justify-center p-6 sm:p-9 md:col-span-7 lg:p-12">
            <div className="flex items-center gap-3">
              <span className="eyebrow">Les Slaches</span>
              <span className="h-px w-8 bg-bone/20" />
              <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-ember">
                Hostile
              </span>
            </div>
            <h3 className="mt-4 font-display text-[clamp(2rem,4vw,3rem)] leading-none text-bone">
              Ce qui reste
              <br />
              <span className="italic text-mist">des Veilleurs.</span>
            </h3>
            <p className="mt-5 max-w-[540px] text-[13.5px] leading-[1.9] text-mist">
              Ils patrouillent. Ils observent. Puis ils attaquent, une lame de brume à
              chaque bras. Chaque dixième Slache abattu libère une clé de son masque :
              l'île rend toujours ce qu'elle a pris.
            </p>
            <div className="mt-7 flex flex-wrap gap-6 border-t border-bone/10 pt-6">
              {[
                ["03", "Coups avant de tomber"],
                ["1 / 10", "Clé au dixième tué"],
                ["∞", "Ils reviennent toujours"],
              ].map(([value, label]) => (
                <div key={label}>
                  <p className="font-display text-[22px] leading-none text-bone">{value}</p>
                  <p className="mt-1.5 font-mono text-[7.5px] uppercase tracking-[0.18em] text-mist-dim">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
