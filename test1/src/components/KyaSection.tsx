import { useState } from "react";
import { ArrowUpRight, HeartPulse, Quote, Shield, Swords, Wind } from "lucide-react";
import { characterModes } from "../data/game";

const modeIcons = {
  sword: Swords,
  wind: Wind,
  heal: HeartPulse,
};

export function KyaSection() {
  const [modeId, setModeId] = useState(characterModes[0].id);
  const mode = characterModes.find((item) => item.id === modeId) ?? characterModes[0];
  const ModeIcon = modeIcons[mode.icon];

  return (
    <section id="kya" className="relative overflow-hidden bg-abyss py-24 md:py-32 lg:py-36">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 top-0 select-none font-display text-[34vw] italic leading-none text-bone/[0.022]"
      >
        Kya
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 bottom-0 h-[540px] w-[540px] rounded-full bg-[radial-gradient(circle,rgba(179,52,59,0.14),transparent_68%)] blur-2xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[12%] top-[18%] hidden h-[520px] w-[2px] -rotate-[24deg] bg-gradient-to-b from-transparent via-crimson/40 to-transparent lg:block"
      />

      <div className="container-page relative">
        <div className="flex items-baseline justify-between gap-6 border-t border-bone/12 pt-5" data-reveal>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[9px] tracking-[0.2em] text-crimson">02</span>
            <span className="eyebrow">Fiche personnage · La porteuse</span>
          </div>
          <span className="hidden font-mono text-[8.5px] uppercase tracking-[0.24em] text-mist-dim sm:block">
            Dossier WND-01 · Kya
          </span>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:gap-14 xl:gap-20">
          <div className="lg:col-span-5" data-reveal>
            <div className="group relative">
              <div className="frame-corner relative aspect-[3/4] overflow-hidden border border-bone/15 bg-deep">
                <img
                  src="/images/kya-portrait.jpg"
                  alt="Portrait de Kya, jeune guerrière à la cape rouge, tenant son épée"
                  className="h-full w-full object-cover object-[center_18%] transition-transform duration-[1600ms] ease-out group-hover:scale-[1.025]"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-void via-void/10 to-void/25" />
                <div className="absolute inset-0 bg-gradient-to-r from-void/45 via-transparent to-transparent" />

                <div className="absolute left-4 top-4 flex items-center gap-2 border border-bone/20 bg-void/45 px-3 py-2 backdrop-blur-md sm:left-5 sm:top-5">
                  <span className="h-1.5 w-1.5 rotate-45 bg-crimson" />
                  <span className="font-mono text-[7.5px] uppercase tracking-[0.24em] text-bone/85">
                    La dernière veilleuse
                  </span>
                </div>

                <div className="absolute right-4 top-4 hidden flex-col items-center gap-2 sm:flex">
                  <span className="h-10 w-px bg-bone/30" />
                  <span className="vertical-rl font-mono text-[7.5px] uppercase tracking-[0.3em] text-bone/50">
                    Portrait officiel
                  </span>
                </div>

                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
                  <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-mist">
                    Porteuse de la lame
                  </p>
                  <div className="mt-2 flex items-end justify-between gap-4">
                    <p className="font-display text-[54px] uppercase leading-[0.8] tracking-[0.06em] text-bone sm:text-[66px]">
                      Kya
                    </p>
                    <div className="mb-1 text-right">
                      <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-bone/70">
                        Brumepierre
                      </p>
                      <p className="mt-1 font-mono text-[7.5px] tracking-[0.14em] text-mist-dim">
                        Cape écarlate · n° 01
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 flex items-center gap-2 border-t border-bone/20 pt-3">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ember" />
                    <span className="font-mono text-[7.5px] uppercase tracking-[0.22em] text-bone/65">
                      En vie · En chasse · Sous la pluie
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.2em] text-mist-dim">
                <span>Concept art — WANDERGRAND</span>
                <span>Anime low-poly</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center lg:col-span-7" data-reveal style={{ "--reveal-delay": "120ms" } as React.CSSProperties}>
            <div className="flex items-center gap-3">
              <span className="eyebrow text-cyan-dim">Humaine · 22 ans</span>
              <span className="h-px w-10 bg-cyan/30" />
              <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-mist-dim">
                Taille 1,72 m
              </span>
            </div>

            <h2 className="mt-5 font-display text-[clamp(2.8rem,5.6vw,5.3rem)] leading-[0.92] text-bone">
              Kya,
              <br />
              <span className="italic text-mist">porteuse de la lame.</span>
            </h2>

            <p className="mt-7 max-w-[560px] text-[14.5px] leading-[1.95] text-mist">
              Née la nuit où la première clé fut forgée. Elle a appris à tenir une lame
              avant de savoir écrire son nom. Ce que l'île lui a pris, elle le reprendra
              serrure par serrure — même si le chemin traverse dix orages et un dieu.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-px border border-bone/12 bg-bone/12 sm:grid-cols-4">
              {[
                { icon: HeartPulse, label: "Vie", value: "10 barres" },
                { icon: Swords, label: "Lame", value: "Serment" },
                { icon: Shield, label: "Cape", value: "Écarlate" },
                { icon: Wind, label: "Voie", value: "La brume" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-abyss px-3.5 py-4">
                  <Icon className="h-3.5 w-3.5 text-mist-dim" strokeWidth={1.4} />
                  <p className="mt-3 font-mono text-[7px] uppercase tracking-[0.2em] text-mist-dim">
                    {label}
                  </p>
                  <p className="mt-1 font-display text-[16px] leading-tight text-bone">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 border-l-2 border-crimson/70 pl-5">
              <Quote className="h-4 w-4 fill-crimson/20 text-crimson/70" strokeWidth={1.2} />
              <p className="mt-2 max-w-[520px] font-display text-[clamp(1.2rem,2.3vw,1.7rem)] italic leading-[1.4] text-bone/90">
                « Je ne cherche pas la porte. Je cherche ce qu'on m'a pris derrière. »
              </p>
              <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.22em] text-mist-dim">
                — Kya, avant de franchir la Porte
              </p>
            </div>

            <div className="mt-9">
              <div className="flex items-center justify-between">
                <p className="eyebrow text-[8px]">Postures de combat</p>
                <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-mist-dim">
                  Sélection interactive
                </p>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-px bg-bone/12 p-px">
                {characterModes.map((item) => {
                  const Icon = modeIcons[item.icon];
                  const active = item.id === modeId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setModeId(item.id)}
                      aria-pressed={active}
                      className={`group flex items-center justify-center gap-2 px-2 py-3.5 transition-colors ${
                        active ? "bg-bone text-void" : "bg-abyss text-mist hover:bg-tide/40 hover:text-bone"
                      }`}
                    >
                      <Icon
                        className={`h-3.5 w-3.5 ${active ? "text-crimson" : "text-mist-dim group-hover:text-cyan"}`}
                        strokeWidth={1.5}
                      />
                      <span className="font-mono text-[8px] uppercase tracking-[0.14em] sm:text-[9px] sm:tracking-[0.18em]">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="relative mt-4 border border-bone/12 bg-void/40 p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center border border-crimson/30 bg-crimson/[0.08]">
                      <ModeIcon className="h-4 w-4 text-ember" strokeWidth={1.4} />
                    </span>
                    <div>
                      <h3 className="font-display text-[22px] leading-none text-bone sm:text-[25px]">
                        {mode.title}
                      </h3>
                      <p className="mt-1 font-mono text-[7.5px] uppercase tracking-[0.2em] text-mist-dim">
                        {mode.statLabel}
                      </p>
                    </div>
                  </div>
                  <span className="border border-bone/15 px-2.5 py-1.5 font-mono text-[8px] uppercase tracking-[0.14em] text-mist">
                    {mode.hint}
                  </span>
                </div>
                <p className="mt-4 text-[13px] leading-[1.8] text-mist">{mode.description}</p>
                <div className="mt-5 grid gap-2.5">
                  {mode.stats.map((stat) => (
                    <div key={stat.label} className="grid grid-cols-[88px_1fr_30px] items-center gap-3">
                      <span className="font-mono text-[7.5px] uppercase tracking-[0.16em] text-mist-dim">
                        {stat.label}
                      </span>
                      <span className="h-[3px] w-full overflow-hidden bg-bone/10">
                        <span
                          className={`block h-full transition-all duration-700 ease-out ${
                            mode.icon === "heal" ? "bg-ember/80" : "bg-cyan/70"
                          }`}
                          style={{ width: `${stat.value}%` }}
                        />
                      </span>
                      <span className="text-right font-mono text-[8px] text-bone/60">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <a
              href="#cles"
              className="group mt-8 inline-flex w-fit items-center gap-3 font-mono text-[9px] uppercase tracking-[0.24em] text-bone/80 transition-colors hover:text-cyan"
            >
              Suivre sa route jusqu'à la Porte
              <span className="grid h-8 w-8 place-items-center border border-bone/20 transition-all group-hover:border-cyan/50 group-hover:bg-cyan/[0.06]">
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={1.4} />
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
