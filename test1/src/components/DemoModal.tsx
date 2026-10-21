import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ChevronDown,
  Gem,
  Heart,
  HeartPulse,
  KeyRound,
  Pause,
  Play,
  RotateCcw,
  Skull,
  Swords,
  Wind,
  X,
} from "lucide-react";
import { DemoEngine, type HudSnapshot } from "../game/DemoEngine";

type Phase = "briefing" | "playing" | "paused" | "dead" | "victory";

const initialHud: HudSnapshot = {
  health: 10,
  essence: 35,
  keys: 0,
  keysGoal: 3,
  kills: 0,
  stones: 0,
};

export function DemoModal({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<DemoEngine | null>(null);
  const toastTimer = useRef<number | null>(null);
  const [phase, setPhase] = useState<Phase>("briefing");
  const [hud, setHud] = useState<HudSnapshot>(initialHud);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let engine: DemoEngine | null = null;
    try {
      engine = new DemoEngine(canvas, {
        onHud: setHud,
        onToast: (message) => {
          setToast(message);
          if (toastTimer.current) window.clearTimeout(toastTimer.current);
          toastTimer.current = window.setTimeout(() => setToast(null), 3200);
        },
        onEnd: (result) => setPhase(result),
      });
      engineRef.current = engine;
    } catch {
      setError(
        "Le canvas n'a pas pu démarrer. Essayez un navigateur récent avec l'accélération matérielle.",
      );
    }

    return () => {
      engine?.destroy();
      engineRef.current = null;
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      if (phase === "playing") {
        engineRef.current?.pause();
        setPhase("paused");
      } else if (phase === "paused") {
        engineRef.current?.resume();
        setPhase("playing");
      } else {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [phase, onClose]);

  const start = () => {
    engineRef.current?.reset();
    setPhase("playing");
  };
  const resume = () => {
    engineRef.current?.resume();
    setPhase("playing");
  };
  const pause = () => {
    engineRef.current?.pause();
    setPhase("paused");
  };
  const respawn = () => {
    engineRef.current?.respawn();
    setPhase("playing");
  };
  const replay = () => {
    engineRef.current?.reset();
    setPhase("playing");
  };

  const touch = (dir: "up" | "down" | "left" | "right", active: boolean) => {
    engineRef.current?.setTouchDir(dir, active);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Démo jouable de SDFAKER RIAN"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#030809]/95 p-0 backdrop-blur-sm sm:p-4 lg:p-6"
    >
      <div className="relative flex h-[100svh] w-full max-w-[1500px] flex-col overflow-hidden border border-bone/15 bg-abyss shadow-[0_30px_120px_rgba(0,0,0,0.65)] sm:h-[min(92vh,980px)]">
        {/* Client bar */}
        <div className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-bone/10 bg-void/80 px-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-1.5 w-1.5 shrink-0 rounded-full bg-crimson shadow-[0_0_8px_rgba(179,52,59,0.9)]" />
            <p className="truncate font-mono text-[8px] uppercase tracking-[0.22em] text-mist sm:text-[9px]">
              <span className="text-bone/80">Démo de terrain</span>
              <span className="mx-2 text-mist-dim/50">/</span>
              Le camp des Veilleurs
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden border border-bone/12 px-2.5 py-1 font-mono text-[7px] uppercase tracking-[0.16em] text-mist-dim sm:block">
              Prototype jouable
            </span>
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-2 border border-bone/15 px-2.5 py-1.5 text-mist transition-colors hover:border-bone/35 hover:text-bone"
            >
              <span className="hidden font-mono text-[7.5px] uppercase tracking-[0.16em] sm:inline">
                Fermer
              </span>
              <X className="h-3.5 w-3.5" strokeWidth={1.4} />
            </button>
          </div>
        </div>

        {/* Game viewport */}
        <div className="relative flex-1 overflow-hidden bg-[#0b191a]">
          <canvas
            ref={canvasRef}
            tabIndex={0}
            className="absolute inset-0 h-full w-full touch-none outline-none"
            aria-label="Scène jouable : déplacez Kya avec ZQSD ou WASD, attaquez avec F, soignez avec R"
          />

          {error && (
            <div className="absolute inset-0 grid place-items-center p-8 text-center">
              <div className="max-w-md border border-crimson/30 bg-void/90 p-8">
                <p className="font-display text-2xl italic text-bone">La brume est trop dense.</p>
                <p className="mt-3 text-sm leading-relaxed text-mist">{error}</p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-5 border border-bone/25 px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.2em] text-bone"
                >
                  Retour à l'île
                </button>
              </div>
            </div>
          )}

          {/* HUD */}
          {!error && (
            <div
              className={`pointer-events-none absolute inset-0 z-10 transition-opacity duration-500 ${
                phase === "playing" || phase === "paused" ? "opacity-100" : "opacity-0"
              }`}
            >
              <div className="flex items-start justify-between gap-3 p-3 sm:p-4">
                <div className="border border-bone/15 bg-void/65 px-3 py-2.5 backdrop-blur-md sm:px-4">
                  <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                      <Heart className="h-3 w-3 fill-ember text-ember" strokeWidth={1.5} />
                      <span className="font-mono text-[7px] uppercase tracking-[0.2em] text-bone/80">
                        Kya
                      </span>
                    </div>
                    <span className="font-mono text-[7.5px] text-mist">
                      {hud.health} / 10
                    </span>
                  </div>
                  <div className="mt-2 grid w-[132px] grid-cols-10 gap-[2px] sm:w-[176px]">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <span
                        key={i}
                        className={`h-2.5 skew-x-[-12deg] transition-colors duration-300 ${
                          i < hud.health
                            ? "bg-gradient-to-b from-ember to-crimson"
                            : "bg-bone/15"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="hidden flex-col items-center gap-1.5 border border-bone/15 bg-void/65 px-4 py-2.5 backdrop-blur-md sm:flex">
                  <span className="font-mono text-[6.5px] uppercase tracking-[0.22em] text-mist-dim">
                    Ouvrir la Porte
                  </span>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: hud.keysGoal }).map((_, i) => (
                      <KeyRound
                        key={i}
                        className={`h-3.5 w-3.5 ${
                          i < hud.keys ? "text-brass drop-shadow-[0_0_6px_rgba(197,167,120,0.7)]" : "text-bone/25"
                        }`}
                        strokeWidth={1.5}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className="border border-bone/15 bg-void/65 px-3 py-2.5 backdrop-blur-md">
                    <div className="flex items-center justify-between gap-5">
                      <span className="font-mono text-[7px] uppercase tracking-[0.18em] text-mist-dim">
                        Clés
                      </span>
                      <span className="font-mono text-[9px] text-brass">
                        {hud.keys} / {hud.keysGoal}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between gap-5">
                      <span className="font-mono text-[7px] uppercase tracking-[0.18em] text-mist-dim">
                        Slaches
                      </span>
                      <span className="font-mono text-[9px] text-bone/80">{hud.kills}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-5">
                      <span className="font-mono text-[7px] uppercase tracking-[0.18em] text-mist-dim">
                        Pierres
                      </span>
                      <span className="font-mono text-[9px] text-cyan">{hud.stones}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={pause}
                    aria-label="Mettre en pause"
                    className="pointer-events-auto grid h-8 w-8 place-items-center border border-bone/15 bg-void/65 text-mist backdrop-blur-md transition-colors hover:text-bone"
                  >
                    <Pause className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              <div className="absolute left-3 top-[74px] w-[160px] border border-bone/15 bg-void/65 px-3 py-2 backdrop-blur-md sm:bottom-4 sm:left-4 sm:top-auto sm:w-[210px]">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-mono text-[6.5px] uppercase tracking-[0.18em] text-ember">
                    <HeartPulse className="h-2.5 w-2.5" strokeWidth={1.7} />
                    Essence rouge
                  </span>
                  <span className="font-mono text-[7px] text-bone/70">{hud.essence}%</span>
                </div>
                <div className="mt-1.5 h-[5px] overflow-hidden border border-ember/20 bg-void">
                  <div
                    className="h-full bg-gradient-to-r from-crimson via-ember to-[#ff9d85] shadow-[0_0_8px_rgba(223,90,78,0.6)] transition-all duration-500"
                    style={{ width: `${hud.essence}%` }}
                  />
                </div>
              </div>

              <div className="absolute bottom-4 right-4 hidden items-center gap-3 border border-bone/12 bg-void/55 px-3 py-2 backdrop-blur-md md:flex">
                {[
                  ["ZQSD", "Bouger"],
                  ["CLIC / F", "Attaquer"],
                  ["R", "Soigner"],
                  ["ESPACE", "Esquive"],
                ].map(([key, label]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <kbd className="border border-bone/20 px-1.5 py-0.5 font-mono text-[6.5px] text-bone/80">
                      {key}
                    </kbd>
                    <span className="font-mono text-[6.5px] uppercase tracking-[0.12em] text-mist-dim">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Toast */}
          <div
            className={`pointer-events-none absolute inset-x-0 z-20 flex justify-center px-4 transition-all duration-300 ${
              toast ? "bottom-24 opacity-100 md:bottom-16" : "bottom-20 opacity-0"
            }`}
            aria-live="polite"
          >
            <div className="flex max-w-[520px] items-start gap-2.5 border border-cyan/25 bg-void/85 px-4 py-2.5 backdrop-blur-md">
              <span className="mt-1 h-1 w-1 shrink-0 rotate-45 bg-cyan" />
              <p className="font-display text-[13.5px] italic leading-snug text-bone sm:text-[15px]">
                {toast}
              </p>
            </div>
          </div>

          {/* Touch controls */}
          {phase === "playing" && !error && (
            <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-4 p-3 md:hidden">
              <div className="grid grid-cols-3 grid-rows-3 gap-1">
                <TouchButton className="col-start-2 row-start-1" label="Haut" onPress={(a) => touch("up", a)}>
                  <ArrowUp className="h-4 w-4" strokeWidth={1.6} />
                </TouchButton>
                <TouchButton className="col-start-1 row-start-2" label="Gauche" onPress={(a) => touch("left", a)}>
                  <ArrowLeft className="h-4 w-4" strokeWidth={1.6} />
                </TouchButton>
                <span className="col-start-2 row-start-2 grid place-items-center">
                  <span className="h-1.5 w-1.5 rotate-45 border border-bone/25" />
                </span>
                <TouchButton className="col-start-3 row-start-2" label="Droite" onPress={(a) => touch("right", a)}>
                  <ArrowRight className="h-4 w-4" strokeWidth={1.6} />
                </TouchButton>
                <TouchButton className="col-start-2 row-start-3" label="Bas" onPress={(a) => touch("down", a)}>
                  <ChevronDown className="h-4 w-4" strokeWidth={1.6} />
                </TouchButton>
              </div>
              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onPointerDown={(event) => {
                    event.preventDefault();
                    engineRef.current?.heal();
                  }}
                  className="grid h-11 w-11 place-items-center rounded-full border border-ember/40 bg-void/70 text-ember backdrop-blur-md active:bg-ember/20"
                  aria-label="Se soigner"
                >
                  <HeartPulse className="h-4 w-4" strokeWidth={1.6} />
                </button>
                <button
                  type="button"
                  onPointerDown={(event) => {
                    event.preventDefault();
                    engineRef.current?.dash();
                  }}
                  className="grid h-12 w-12 place-items-center rounded-full border border-cyan/30 bg-void/70 text-cyan backdrop-blur-md active:bg-cyan/20"
                  aria-label="Esquive"
                >
                  <Wind className="h-4 w-4" strokeWidth={1.6} />
                </button>
                <button
                  type="button"
                  onPointerDown={(event) => {
                    event.preventDefault();
                    engineRef.current?.attack();
                  }}
                  className="grid h-16 w-16 place-items-center rounded-full border border-crimson/40 bg-crimson/20 text-bone backdrop-blur-md active:bg-crimson/40"
                  aria-label="Attaquer"
                >
                  <Swords className="h-6 w-6" strokeWidth={1.4} />
                </button>
              </div>
            </div>
          )}

          {/* Briefing */}
          {phase === "briefing" && !error && (
            <div className="absolute inset-0 z-30 overflow-y-auto bg-[linear-gradient(90deg,rgba(4,11,12,0.97)_0%,rgba(4,11,12,0.88)_52%,rgba(4,11,12,0.5)_100%)]">
              <div className="flex min-h-full max-w-[760px] flex-col justify-center px-6 py-10 sm:px-12 lg:px-16">
                <div className="flex items-center gap-3">
                  <span className="h-px w-8 bg-crimson" />
                  <span className="font-mono text-[8px] uppercase tracking-[0.28em] text-mist">
                    Fragment jouable · Acte I
                  </span>
                </div>
                <h2 className="mt-5 font-display text-[clamp(2.6rem,5vw,4.6rem)] leading-[0.95] text-bone">
                  Le camp des
                  <br />
                  <span className="italic text-mist">Veilleurs.</span>
                </h2>
                <p className="mt-5 max-w-[500px] text-[13.5px] leading-[1.85] text-mist sm:text-[14.5px]">
                  La nuit tombe sur Brumepierre. Trois clés suffisent pour entrebâiller la
                  Porte. Kya n'a pas besoin de plus pour prouver que l'île se trompe.
                </p>

                <div className="mt-7 grid gap-2.5">
                  {[
                    {
                      icon: Skull,
                      title: "Abattez les Slaches",
                      detail: "Chaque troisième masque fendu libère une clé.",
                    },
                    {
                      icon: Gem,
                      title: "Ramassez les pierres bleues",
                      detail: "Cinq éclats suffisent à en forger une autre.",
                    },
                    {
                      icon: HeartPulse,
                      title: "Convertissez l'essence rouge",
                      detail: "R ou clic droit referme deux barres de vie.",
                    },
                  ].map(({ icon: Icon, title, detail }, index) => (
                    <div
                      key={title}
                      className="flex items-start gap-3.5 border border-bone/10 bg-void/35 px-4 py-3 backdrop-blur-sm"
                    >
                      <span className="mt-0.5 font-mono text-[7px] tracking-[0.1em] text-crimson">
                        0{index + 1}
                      </span>
                      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan" strokeWidth={1.5} />
                      <div>
                        <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-bone/85">
                          {title}
                        </p>
                        <p className="mt-1 font-display text-[13.5px] italic leading-snug text-mist">
                          {detail}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={start}
                    className="btn-sweep flex items-center gap-3 bg-bone px-7 py-4 font-mono text-[10px] uppercase tracking-[0.24em] text-void transition-colors hover:bg-white"
                  >
                    <Play className="h-3.5 w-3.5 fill-crimson text-crimson" strokeWidth={1.5} />
                    Commencer la veille
                  </button>
                  <div className="font-mono text-[7.5px] uppercase leading-relaxed tracking-[0.16em] text-mist-dim">
                    ZQSD / WASD · clavier & souris
                    <br />
                    Commandes tactiles disponibles
                  </div>
                </div>
                <p className="mt-6 max-w-[460px] font-mono text-[7px] uppercase leading-relaxed tracking-[0.14em] text-mist-dim/75">
                  Prototype de démonstration. La progression complète — quinze clés, boss
                  et sauvegarde — est conçue pour la version native.
                </p>
              </div>
            </div>
          )}

          {/* Paused */}
          {phase === "paused" && (
            <Overlay>
              <div className="w-full max-w-[430px] border border-bone/15 bg-abyss/95 p-7 text-center shadow-[0_30px_90px_rgba(0,0,0,0.6)] sm:p-9">
                <p className="eyebrow">Pause · La pluie attend</p>
                <h3 className="mt-4 font-display text-[38px] leading-none text-bone">
                  Reprendre
                  <br />
                  <span className="italic text-mist">son souffle.</span>
                </h3>
                <div className="mt-6 grid grid-cols-3 gap-2 border-y border-bone/10 py-4">
                  {[
                    ["Clés", `${hud.keys}/${hud.keysGoal}`],
                    ["Slaches", hud.kills],
                    ["Pierres", hud.stones],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="font-display text-[22px] leading-none text-bone">{value}</p>
                      <p className="mt-1 font-mono text-[7px] uppercase tracking-[0.16em] text-mist-dim">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={resume}
                    className="flex items-center justify-center gap-2.5 bg-bone py-3.5 font-mono text-[9px] uppercase tracking-[0.22em] text-void transition-colors hover:bg-white"
                  >
                    <Play className="h-3 w-3 fill-crimson text-crimson" strokeWidth={1.5} />
                    Reprendre la veille
                  </button>
                  <button
                    type="button"
                    onClick={replay}
                    className="flex items-center justify-center gap-2 border border-bone/20 py-3 font-mono text-[8.5px] uppercase tracking-[0.18em] text-mist transition-colors hover:text-bone"
                  >
                    <RotateCcw className="h-3 w-3" strokeWidth={1.5} />
                    Recommencer
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-1 font-mono text-[7.5px] uppercase tracking-[0.18em] text-mist-dim transition-colors hover:text-bone"
                  >
                    Quitter la démo
                  </button>
                </div>
              </div>
            </Overlay>
          )}

          {/* Dead */}
          {phase === "dead" && (
            <Overlay>
              <div className="w-full max-w-[460px] border border-crimson/25 bg-abyss/95 p-7 text-center shadow-[0_30px_90px_rgba(0,0,0,0.7)] sm:p-9">
                <span className="mx-auto grid h-11 w-11 place-items-center border border-crimson/30 bg-crimson/[0.08]">
                  <Skull className="h-5 w-5 text-ember" strokeWidth={1.3} />
                </span>
                <p className="mt-5 eyebrow">Brumepierre vous rappelle</p>
                <h3 className="mt-3 font-display text-[38px] leading-none text-bone">
                  Vous êtes
                  <br />
                  <span className="italic text-mist">tombé.</span>
                </h3>
                <p className="mt-4 text-[13px] leading-relaxed text-mist">
                  Kya se réveille au village. <span className="text-ember">Deux barres</span>{" "}
                  sont perdues, mais aucune clé n'est rendue à l'île.
                </p>
                <div className="mt-6 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={respawn}
                    className="flex items-center justify-center gap-2.5 bg-bone py-3.5 font-mono text-[9px] uppercase tracking-[0.22em] text-void transition-colors hover:bg-white"
                  >
                    <HeartPulse className="h-3.5 w-3.5 text-crimson" strokeWidth={1.5} />
                    Se relever
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="border border-bone/20 py-3 font-mono text-[8.5px] uppercase tracking-[0.18em] text-mist transition-colors hover:text-bone"
                  >
                    Retour à l'île
                  </button>
                </div>
              </div>
            </Overlay>
          )}

          {/* Victory */}
          {phase === "victory" && (
            <Overlay>
              <div className="w-full max-w-[500px] border border-cyan/25 bg-abyss/95 p-7 text-center shadow-[0_0_100px_rgba(134,216,208,0.14)] sm:p-9">
                <span className="mx-auto grid h-12 w-12 place-items-center border border-cyan/30 bg-cyan/[0.07]">
                  <KeyRound className="h-5 w-5 -rotate-45 text-cyan" strokeWidth={1.3} />
                </span>
                <p className="mt-5 eyebrow text-cyan-dim">La Porte vous a entendu</p>
                <h3 className="mt-3 font-display text-[clamp(2.1rem,6vw,2.8rem)] leading-[0.98] text-bone">
                  Trois clés.
                  <br />
                  <span className="italic text-mist">Une porte entrouverte.</span>
                </h3>
                <div className="mt-6 grid grid-cols-3 gap-2 border-y border-bone/10 py-4">
                  {[
                    ["Clés", `${hud.keys}/3`],
                    ["Slaches", hud.kills],
                    ["Pierres", hud.stones],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="font-display text-[24px] leading-none text-bone">{value}</p>
                      <p className="mt-1 font-mono text-[7px] uppercase tracking-[0.16em] text-mist-dim">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="mt-5 font-display text-[15px] italic leading-relaxed text-mist">
                  « La pluie ne s'arrête pas encore. Mais pour la première fois, elle
                  hésite. »
                </p>
                <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={replay}
                    className="flex flex-1 items-center justify-center gap-2.5 bg-bone py-3.5 font-mono text-[8.5px] uppercase tracking-[0.2em] text-void transition-colors hover:bg-white"
                  >
                    <RotateCcw className="h-3 w-3 text-crimson" strokeWidth={1.6} />
                    Rejouer
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex flex-1 items-center justify-center gap-2.5 border border-bone/20 py-3.5 font-mono text-[8.5px] uppercase tracking-[0.18em] text-mist transition-colors hover:text-bone"
                  >
                    Retour à l'île
                    <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
                  </button>
                </div>
                <p className="mt-5 font-mono text-[7px] uppercase tracking-[0.2em] text-mist-dim">
                  Fin du fragment · La Porte, elle, ne fait que commencer
                </p>
              </div>
            </Overlay>
          )}
        </div>
      </div>
    </div>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-30 grid place-items-center overflow-y-auto bg-void/70 px-4 py-6 backdrop-blur-md">
      {children}
    </div>
  );
}

function TouchButton({
  children,
  label,
  onPress,
  className = "",
}: {
  children: React.ReactNode;
  label: string;
  onPress: (active: boolean) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        onPress(true);
      }}
      onPointerUp={(event) => {
        event.preventDefault();
        onPress(false);
      }}
      onPointerCancel={() => onPress(false)}
      onPointerLeave={() => onPress(false)}
      className={`grid h-10 w-10 place-items-center border border-bone/20 bg-void/65 text-bone/85 backdrop-blur-md active:border-cyan/50 active:bg-cyan/15 ${className}`}
    >
      {children}
    </button>
  );
}
