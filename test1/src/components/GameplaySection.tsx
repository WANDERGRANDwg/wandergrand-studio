import { useState } from "react";
import {
  ArrowRight,
  CloudLightning,
  Droplets,
  Heart,
  HeartPulse,
  Keyboard,
  Play,
  RotateCcw,
  Save,
  ShieldCheck,
  Skull,
  SquareMousePointer,
  Swords,
} from "lucide-react";
import { controls, systems } from "../data/game";

type Scheme = "azerty" | "qwerty";

const systemIcons = [Save, ShieldCheck, CloudLightning, Droplets];

export function GameplaySection({ onPlay }: { onPlay: () => void }) {
  const [scheme, setScheme] = useState<Scheme>("azerty");
  const [health, setHealth] = useState(7);
  const [essence, setEssence] = useState(65);
  const [healing, setHealing] = useState(false);
  const [message, setMessage] = useState("La jauge d'essence attend votre premier Slache.");

  const heal = () => {
    if (essence < 40) {
      setMessage("L'essence rouge est trop faible. Il faut tuer pour la remplir.");
      return;
    }
    if (health >= 10) {
      setMessage("Kya est déjà à plein de vie. Gardez l'essence pour plus tard.");
      return;
    }
    const gained = Math.min(2, 10 - health);
    setHealth((value) => Math.min(10, value + gained));
    setEssence((value) => value - 40);
    setHealing(true);
    setMessage(
      `L'éclat rouge referme ${gained} barre${gained > 1 ? "s" : ""}. La pluie n'y verra rien.`,
    );
    window.setTimeout(() => setHealing(false), 1300);
  };

  const slay = () => {
    setEssence((value) => Math.min(100, value + 25));
    setMessage("Slache abattu. L'essence rouge monte de 25 %.");
  };

  const resetDemo = () => {
    setHealth(7);
    setEssence(65);
    setHealing(false);
    setMessage("Simulateur réinitialisé. Les barres n'attendent que vous.");
  };

  return (
    <section id="manuel" className="relative overflow-hidden bg-abyss py-24 md:py-32 lg:py-36">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(236,230,215,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(236,230,215,0.045) 1px, transparent 1px)",
          backgroundSize: "58px 58px",
          maskImage: "radial-gradient(ellipse at 50% 40%, black, transparent 70%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 top-1/4 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(179,52,59,0.13),transparent_65%)] blur-2xl"
      />

      <div className="container-page relative">
        <div className="flex items-baseline justify-between gap-6 border-t border-bone/12 pt-5" data-reveal>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[9px] tracking-[0.2em] text-crimson">05</span>
            <span className="eyebrow">Manuel du Veilleur</span>
          </div>
          <span className="hidden font-mono text-[8.5px] uppercase tracking-[0.24em] text-mist-dim sm:block">
            Systèmes de jeu
          </span>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-12 lg:items-end" data-reveal>
          <h2 className="font-display text-[clamp(2.9rem,6.3vw,5.8rem)] leading-[0.92] text-bone lg:col-span-7">
            Survivre
            <br />
            <span className="italic text-mist">à la tempête.</span>
          </h2>
          <div className="lg:col-span-5">
            <p className="max-w-[480px] text-[14px] leading-[1.9] text-mist sm:text-[15px]">
              Kya ne se bat pas comme un soldat. Elle danse autour des lames, convertit la
              mort en vie et ne s'arrête jamais. Apprenez les gestes ; la pluie fera le reste.
            </p>
            <div className="mt-5 flex items-center gap-2.5">
              <Droplets className="h-3.5 w-3.5 text-cyan" strokeWidth={1.4} />
              <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-mist-dim">
                ZQSD / WASD · clavier & souris
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-12">
          {/* Controls */}
          <div
            className="border border-bone/12 bg-void/45 p-5 sm:p-7 lg:col-span-7"
            data-reveal
            style={{ "--reveal-delay": "80ms" } as React.CSSProperties}
          >
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <Keyboard className="h-4 w-4 text-mist" strokeWidth={1.3} />
                <h3 className="font-display text-[24px] leading-none text-bone">Touches</h3>
              </div>
              <div className="flex items-center gap-1 border border-bone/12 p-0.5">
                {(["azerty", "qwerty"] as Scheme[]).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setScheme(value)}
                    aria-pressed={scheme === value}
                    className={`px-3 py-1.5 font-mono text-[8px] uppercase tracking-[0.16em] transition-colors ${
                      scheme === value ? "bg-bone text-void" : "text-mist-dim hover:text-bone"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-px bg-bone/10 sm:grid-cols-2">
              {controls.map((control) => {
                const keys = scheme === "azerty" ? control.azerty : control.qwerty;
                const showIcons = keys[0] === "SOURIS";
                return (
                  <div
                    key={control.action}
                    className="group flex min-h-[72px] flex-col justify-between gap-3 bg-void/90 px-4 py-3.5 transition-colors hover:bg-tide/25"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-bone/80">
                        {control.action}
                      </p>
                      <div className="flex items-center gap-1">
                        {showIcons ? (
                          <span className="flex items-center gap-1.5 border border-bone/20 bg-bone/[0.04] px-2 py-1">
                            <SquareMousePointer className="h-2.5 w-2.5 text-mist" strokeWidth={1.6} />
                            <span className="font-mono text-[7px] uppercase tracking-[0.12em] text-bone/80">
                              Souris
                            </span>
                          </span>
                        ) : (
                          keys.map((key) => (
                            <kbd
                              key={key}
                              className="flex h-7 min-w-[28px] items-center justify-center border border-bone/20 border-b-bone/35 bg-bone/[0.04] px-1.5 font-mono text-[8.5px] text-bone/90 shadow-[0_2px_0_rgba(236,230,215,0.08)] transition-colors group-hover:border-cyan/35 group-hover:text-cyan"
                            >
                              {key}
                            </kbd>
                          ))
                        )}
                      </div>
                    </div>
                    <p className="font-display text-[13px] italic leading-none text-mist-dim">
                      {control.note}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-bone/10 pt-4">
              <p className="font-mono text-[7.5px] uppercase tracking-[0.18em] text-mist-dim">
                Chaque action peut être réassignée dans les options du jeu.
              </p>
              <Swords className="h-3.5 w-3.5 shrink-0 text-crimson" strokeWidth={1.4} />
            </div>
          </div>

          {/* Health simulator */}
          <div
            className={`relative overflow-hidden border bg-void/55 p-5 transition-all duration-700 sm:p-7 lg:col-span-5 ${
              healing
                ? "animate-heal border-ember/50"
                : "border-bone/12"
            }`}
            data-reveal
            style={{ "--reveal-delay": "160ms" } as React.CSSProperties}
          >
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-0 transition-opacity duration-1000 ${
                healing ? "opacity-100" : "opacity-40"
              } bg-[radial-gradient(ellipse_at_50%_100%,rgba(179,52,59,0.22),transparent_65%)]`}
            />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <HeartPulse className="h-4 w-4 text-ember" strokeWidth={1.4} />
                  <h3 className="font-display text-[24px] leading-none text-bone">Vie & essence</h3>
                </div>
                <span className="border border-bone/15 px-2.5 py-1.5 font-mono text-[7px] uppercase tracking-[0.16em] text-mist-dim">
                  Simulation
                </span>
              </div>

              <div className="mt-6">
                <div className="flex items-end justify-between">
                  <p className="font-mono text-[7.5px] uppercase tracking-[0.2em] text-mist-dim">
                    Barres de vie
                  </p>
                  <p className="font-mono text-[9px] text-bone/70">
                    <span className="text-[20px] font-display text-bone">{String(health).padStart(2, "0")}</span>
                    {" / 10"}
                  </p>
                </div>
                <div className="mt-2.5 grid grid-cols-10 gap-[3px]">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <span
                      key={i}
                      className={`h-8 skew-x-[-8deg] border transition-all duration-500 ${
                        i < health
                          ? "border-ember/50 bg-gradient-to-b from-ember to-crimson shadow-[0_0_10px_rgba(223,90,78,0.25)]"
                          : "border-bone/10 bg-bone/[0.04]"
                      }`}
                    />
                  ))}
                </div>
                <div className="mt-2 flex justify-between font-mono text-[7px] uppercase tracking-[0.14em] text-mist-dim">
                  <span>10 barres · perte de 2 en cas de chute</span>
                  <span>{health} / 10</span>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-end justify-between">
                  <p className="font-mono text-[7.5px] uppercase tracking-[0.2em] text-ember">
                    Essence rouge
                  </p>
                  <p className="font-mono text-[9px] text-bone/70">{essence} %</p>
                </div>
                <div className="relative mt-2.5 h-[9px] overflow-hidden border border-ember/20 bg-abyss">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-crimson via-ember to-[#ff8a70] shadow-[0_0_14px_rgba(223,90,78,0.65)] transition-all duration-700"
                    style={{ width: `${essence}%` }}
                  />
                  <div className="absolute inset-0 flex">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <span key={i} className="h-full flex-1 border-r border-void/50 last:border-r-0" />
                    ))}
                  </div>
                </div>
                <p className="mt-2 font-mono text-[7px] uppercase leading-relaxed tracking-[0.1em] text-mist-dim">
                  Se remplit en tuant des Slaches · 40 % = 2 barres de vie
                </p>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={heal}
                  disabled={essence < 40 || health >= 10}
                  className="group flex flex-col items-start gap-2 border border-ember/35 bg-crimson/[0.1] px-3.5 py-3 text-left transition-all hover:bg-crimson/[0.18] disabled:cursor-not-allowed disabled:border-bone/10 disabled:bg-bone/[0.02] disabled:opacity-45"
                >
                  <span className="flex items-center gap-2">
                    <Heart className="h-3 w-3 text-ember" strokeWidth={1.7} />
                    <kbd className="border border-ember/25 px-1.5 py-0.5 font-mono text-[8px] text-ember">R</kbd>
                  </span>
                  <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-bone">
                    Convertir en vie
                  </span>
                </button>
                <button
                  type="button"
                  onClick={slay}
                  className="group flex flex-col items-start gap-2 border border-bone/15 px-3.5 py-3 text-left transition-colors hover:border-cyan/35 hover:bg-cyan/[0.05]"
                >
                  <span className="flex items-center gap-2">
                    <Skull className="h-3 w-3 text-mist" strokeWidth={1.5} />
                    <span className="font-mono text-[8px] text-cyan">+25 %</span>
                  </span>
                  <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-mist">
                    Abattre un Slache
                  </span>
                </button>
              </div>

              <div className="mt-3 flex min-h-[40px] items-start gap-2 border border-bone/10 bg-void/50 px-3 py-2.5" aria-live="polite">
                <span className={`mt-1.5 h-1 w-1 shrink-0 rotate-45 ${healing ? "bg-ember" : "bg-cyan"}`} />
                <p className={`font-display text-[13.5px] italic leading-snug ${healing ? "text-ember" : "text-mist"}`}>
                  {message}
                </p>
              </div>

              <button
                type="button"
                onClick={resetDemo}
                className="mt-3 inline-flex items-center gap-1.5 font-mono text-[7px] uppercase tracking-[0.16em] text-mist-dim transition-colors hover:text-bone"
              >
                <RotateCcw className="h-2.5 w-2.5" strokeWidth={1.6} />
                Réinitialiser la simulation
              </button>
            </div>
          </div>
        </div>

        {/* Systems */}
        <div className="mt-5 grid grid-cols-2 gap-px border border-bone/12 bg-bone/12 lg:grid-cols-4" data-reveal>
          {systems.map((system, index) => {
            const Icon = systemIcons[index];
            return (
              <div key={system.label} className="group bg-abyss px-4 py-5 transition-colors hover:bg-tide/25 sm:px-5 sm:py-6">
                <div className="flex items-start justify-between gap-2">
                  <Icon className="h-4 w-4 text-mist-dim transition-colors group-hover:text-cyan" strokeWidth={1.3} />
                  <span className="font-mono text-[7px] uppercase tracking-[0.16em] text-mist-dim">
                    {system.label}
                  </span>
                </div>
                <p className="mt-5 font-display text-[22px] leading-none text-bone">{system.value}</p>
                <p className="mt-1.5 font-mono text-[7px] uppercase leading-relaxed tracking-[0.12em] text-mist-dim">
                  {system.detail}
                </p>
              </div>
            );
          })}
        </div>

        <div className="relative mt-14 overflow-hidden border border-bone/12" data-reveal>
          <img
            src="/images/village.jpg"
            alt="Brumepierre sous la pluie, village de l'île de Sfaker"
            className="h-[280px] w-full object-cover object-center sm:h-[320px]"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-void via-void/70 to-void/25" />
          <div className="absolute inset-0 flex flex-col justify-center gap-5 p-6 sm:p-10 lg:p-14">
            <div className="flex items-center gap-2.5">
              <KeyHint />
              <span className="font-mono text-[8px] uppercase tracking-[0.24em] text-cyan">
                Le camp des Veilleurs est ouvert
              </span>
            </div>
            <h3 className="max-w-[540px] font-display text-[clamp(1.9rem,4vw,3rem)] leading-[1.02] text-bone">
              La théorie attendra.
              <br />
              <span className="italic text-mist">La pluie, non.</span>
            </h3>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onPlay}
                className="btn-sweep group flex items-center gap-3 bg-bone px-6 py-3.5 font-mono text-[9px] uppercase tracking-[0.22em] text-void transition-colors hover:bg-white"
              >
                <Play className="h-3 w-3 fill-crimson text-crimson" strokeWidth={1.5} />
                Jouer la démo
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={1.5} />
              </button>
              <span className="font-mono text-[7.5px] uppercase tracking-[0.18em] text-bone/55">
                Kya est prête · environ 5 minutes
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function KeyHint() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan/60" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan" />
    </span>
  );
}
