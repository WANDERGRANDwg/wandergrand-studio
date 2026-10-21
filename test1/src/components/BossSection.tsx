import { useState } from "react";
import { AlertTriangle, ArrowUpRight, Crown, Play, ScanEye, Skull, Zap } from "lucide-react";
import { bossAttacks, bossPhases } from "../data/game";

export function BossSection({ onPlay }: { onPlay: () => void }) {
  const [phase, setPhase] = useState(2);

  return (
    <section id="eclicosmique" className="relative overflow-hidden bg-void">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <img
          src="/images/eclipsemonic.jpg"
          alt=""
          className="absolute left-1/2 top-0 h-[1080px] w-[760px] -translate-x-[18%] scale-110 object-cover object-top opacity-[0.16] blur-2xl"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_72%_12%,rgba(179,52,59,0.16),transparent_55%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-void/60 via-void/85 to-void" />
      </div>

      <div className="container-page relative pb-20 pt-24 md:pb-28 md:pt-32 lg:pt-36">
        <div className="flex items-baseline justify-between gap-6 border-t border-bone/15 pt-5" data-reveal>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[9px] tracking-[0.2em] text-crimson">04</span>
            <span className="eyebrow text-mist">Rencontre finale · Zone interdite</span>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-crimson shadow-[0_0_10px_rgba(179,52,59,0.9)]" />
            <span className="font-mono text-[8px] uppercase tracking-[0.24em] text-ember">
              Menace active
            </span>
          </div>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="flex flex-col justify-center lg:col-span-7 xl:col-span-6" data-reveal>
            <div className="flex w-fit items-center gap-2.5 border border-crimson/35 bg-crimson/[0.08] px-3 py-2 backdrop-blur-sm">
              <AlertTriangle className="h-3.5 w-3.5 text-ember" strokeWidth={1.5} />
              <span className="font-mono text-[8px] uppercase tracking-[0.22em] text-ember">
                Classe Éclipse · Niveau 15
              </span>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <Crown className="h-4 w-4 text-brass" strokeWidth={1.2} />
              <span className="font-mono text-[8px] uppercase tracking-[0.28em] text-mist">
                Le gardien de la Porte
              </span>
            </div>

            <h2 className="mt-4 font-display text-[clamp(2.4rem,5.4vw,4.9rem)] leading-[0.9] text-bone text-glow-red">
              L'Éclicosmique
            </h2>
            <p className="mt-3 font-display text-[clamp(1.3rem,2.4vw,1.8rem)] italic leading-tight text-mist">
              Le dieu qui a oublié de mourir.
            </p>

            <p className="mt-6 max-w-[520px] text-[14px] leading-[1.95] text-mist sm:text-[15px]">
              Quatre fois la taille de Kya. Une armure de nuit fendue de lumière rouge. Il
              ne parle pas — il attire. Son éclair arrache quatre barres de vie d'un coup ;
              sa frappe en prend deux. Derrière lui, l'éclipse ne se lève jamais.
            </p>

            <div className="mt-8 grid max-w-[540px] grid-cols-2 gap-px border border-bone/15 bg-bone/15 sm:grid-cols-4">
              {[
                { icon: Skull, value: "4×", label: "Sa taille" },
                { icon: Zap, value: "4", label: "Éclair / barres" },
                { icon: AlertTriangle, value: "2", label: "Frappe / barres" },
                { icon: Crown, value: "01", label: "Dernier gardien" },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label} className="bg-void px-3 py-4">
                  <Icon className="h-3.5 w-3.5 text-crimson" strokeWidth={1.4} />
                  <p className="mt-2.5 font-display text-[30px] leading-none text-bone">{value}</p>
                  <p className="mt-1.5 font-mono text-[7px] uppercase leading-relaxed tracking-[0.14em] text-mist-dim">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 border-l border-crimson/60 pl-5">
              <p className="font-display text-[clamp(1.1rem,2vw,1.45rem)] italic leading-[1.5] text-bone/85">
                « Vous n'êtes pas seul. C'est bien le problème. »
              </p>
              <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.22em] text-mist-dim">
                — Inscription sur la Porte
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onPlay}
                className="btn-sweep group flex items-center gap-2.5 border border-bone/30 bg-void/40 px-5 py-3.5 font-mono text-[9px] uppercase tracking-[0.22em] text-bone transition-colors hover:border-bone/60 hover:bg-bone/[0.06]"
              >
                <Play className="h-3 w-3 fill-crimson text-crimson" strokeWidth={1.5} />
                S'entraîner sous la pluie
                <ArrowUpRight className="h-3 w-3 text-mist transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={1.5} />
              </button>
              <span className="font-mono text-[7.5px] uppercase tracking-[0.18em] text-mist-dim">
                Démo · Camp des Veilleurs
              </span>
            </div>
          </div>

          {/* Portrait presentation */}
          <div className="lg:col-span-5 xl:col-span-6" data-reveal style={{ "--reveal-delay": "120ms" } as React.CSSProperties}>
            <figure className="frame-corner relative mx-auto max-w-[440px] border border-bone/15 bg-abyss lg:ml-auto lg:mr-0">
              <div className="relative aspect-[2/3] overflow-hidden">
                <img
                  src="/images/eclipsemonic.jpg"
                  alt="L'Éclicosmique, titan aux fissures écarlates, dominant Kya minuscule sur une falaise"
                  className="h-full w-full object-cover object-center transition-transform duration-[2200ms] ease-out hover:scale-[1.03]"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-void/95 via-transparent to-void/45" />
                <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
                  <span className="border border-crimson/35 bg-void/60 px-2.5 py-1.5 font-mono text-[7px] uppercase tracking-[0.2em] text-ember backdrop-blur-md">
                    Spécimen · 001
                  </span>
                  <span className="grid h-7 w-7 place-items-center border border-bone/20 bg-void/50 backdrop-blur-md">
                    <ScanEye className="h-3.5 w-3.5 text-bone/70" strokeWidth={1.4} />
                  </span>
                </div>
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="font-mono text-[7.5px] uppercase tracking-[0.26em] text-mist">
                    Hauteur estimée · 6,90 m
                  </p>
                  <p className="mt-1.5 font-display text-[26px] leading-none text-bone">
                    Le dernier dieu
                  </p>
                  <div className="mt-4 flex items-end justify-between gap-4 border-t border-bone/20 pt-3">
                    <p className="max-w-[220px] font-display text-[12.5px] italic leading-snug text-mist">
                      Kya, seule face à l'éclipse. L'échelle est le premier avertissement.
                    </p>
                    <span className="font-mono text-[7px] uppercase tracking-[0.18em] text-mist-dim">
                      Art · WG
                    </span>
                  </div>
                </div>
              </div>
            </figure>
            <div className="mx-auto mt-3 flex max-w-[440px] items-center justify-between gap-4 border-t border-bone/10 pt-3 lg:ml-auto lg:mr-0">
              <span className="font-mono text-[7.5px] uppercase tracking-[0.16em] text-mist-dim">
                Éclair · Frappe · Onde
              </span>
              <span className="flex items-center gap-2 font-mono text-[7.5px] uppercase tracking-[0.16em] text-ember">
                <span className="h-1 w-1 rotate-45 bg-crimson" />
                Ne pas sous-estimer
              </span>
            </div>
          </div>
        </div>

        {/* Patterns */}
        <div className="mt-16 grid gap-5 lg:mt-20 lg:grid-cols-12" data-reveal>
          <div className="lg:col-span-8">
            <div className="flex items-end justify-between gap-4 border-b border-bone/15 pb-3.5">
              <h3 className="font-display text-[24px] leading-none text-bone sm:text-[28px]">
                Répertoire des attaques
              </h3>
              <p className="font-mono text-[7.5px] uppercase tracking-[0.2em] text-mist-dim">
                Dégâts en barres de vie
              </p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {bossAttacks.map((attack) => (
                <article
                  key={attack.id}
                  className="group relative flex flex-col justify-between border border-bone/12 bg-abyss/70 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-crimson/35 hover:bg-abyss"
                >
                  <span className="absolute inset-x-0 top-0 h-px scale-x-0 bg-gradient-to-r from-transparent via-crimson/70 to-transparent transition-transform duration-500 group-hover:scale-x-100" />
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-[9px] tracking-[0.16em] text-crimson">{attack.index}</span>
                      <span className="border border-bone/15 px-2 py-1 font-mono text-[6.5px] uppercase tracking-[0.16em] text-mist-dim">
                        {attack.tag}
                      </span>
                    </div>
                    <h4 className="mt-4 font-display text-[23px] leading-tight text-bone">{attack.name}</h4>
                    <div className="mt-2 flex items-end gap-1.5">
                      <span className="font-display text-[27px] leading-none text-ember">{attack.damage}</span>
                      <span className="mb-0.5 font-mono text-[7px] uppercase tracking-[0.14em] text-mist-dim">
                        barres
                      </span>
                    </div>
                    <p className="mt-3.5 text-[12px] leading-[1.8] text-mist">{attack.description}</p>
                  </div>
                  <div className="mt-5 flex items-start gap-2 border-t border-bone/10 pt-3.5">
                    <Zap className="mt-0.5 h-3 w-3 shrink-0 text-ember" strokeWidth={1.6} />
                    <p className="font-mono text-[7.5px] uppercase leading-[1.7] tracking-[0.08em] text-bone/60">
                      {attack.telegraph}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="border border-bone/12 bg-abyss/70 p-5 sm:p-6 lg:col-span-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-[23px] leading-none text-bone">Les trois phases</h3>
              <span className="font-mono text-[7.5px] uppercase tracking-[0.18em] text-mist-dim">
                Sélection
              </span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-px bg-bone/12">
              {bossPhases.map((item, index) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setPhase(index)}
                  aria-pressed={phase === index}
                  className={`px-2 py-3 transition-colors ${
                    phase === index
                      ? "bg-crimson/90 text-bone"
                      : "bg-abyss text-mist-dim hover:bg-tide/50 hover:text-bone"
                  }`}
                >
                  <span className="block font-mono text-[7px] tracking-[0.1em] opacity-70">
                    0{index + 1}
                  </span>
                  <span className="mt-1 block font-mono text-[7.5px] uppercase leading-tight tracking-[0.08em]">
                    {item.name}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-4 min-h-[130px]">
              <div className="flex items-center justify-between gap-3">
                <p className="font-display text-[22px] italic leading-none text-bone">
                  {bossPhases[phase].name}
                </p>
                <span className="shrink-0 font-mono text-[8px] tracking-[0.12em] text-ember">
                  {bossPhases[phase].threshold}
                </span>
              </div>
              <p className="mt-3 text-[12.5px] leading-[1.85] text-mist" aria-live="polite">
                {bossPhases[phase].note}
              </p>
            </div>
            <div className="mt-4 border-t border-bone/10 pt-4">
              <div className="flex items-center justify-between font-mono text-[7px] uppercase tracking-[0.16em] text-mist-dim">
                <span>Vitalité estimée</span>
                <span>{phase === 0 ? "Active" : phase === 1 ? "Renforcée" : "Instable"}</span>
              </div>
              <div className="mt-2 flex gap-[3px]">
                {Array.from({ length: 24 }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-4 flex-1 transition-all duration-500 ${
                      i < (phase + 1) * 8
                        ? phase === 2
                          ? "bg-crimson/75"
                          : "bg-bone/35"
                        : "bg-bone/10"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
