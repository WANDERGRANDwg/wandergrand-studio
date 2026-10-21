import { useState } from "react";
import {
  ArrowRight,
  ArrowUp,
  Check,
  CloudRain,
  Code2,
  Droplets,
  KeyRound,
  Play,
  Sun,
} from "lucide-react";
import { navLinks } from "../data/game";
import { BrandMark } from "./Navbar";

export function Footer({
  onPlay,
  rainStopped,
  onToggleRain,
}: {
  onPlay: () => void;
  rainStopped: boolean;
  onToggleRain: () => void;
}) {
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !email.includes("@")) return;
    setJoined(true);
  };

  return (
    <footer id="credits" className="relative overflow-hidden bg-void">
      <div className="pointer-events-none absolute inset-0">
        <div
          className={`absolute inset-0 transition-opacity duration-[2000ms] ${
            rainStopped ? "opacity-100" : "opacity-0"
          }`}
          style={{
            background:
              "radial-gradient(ellipse at 70% 0%, rgba(197,167,120,0.16), transparent 55%), radial-gradient(ellipse at 40% 20%, rgba(88,146,142,0.12), transparent 60%)",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-10 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(134,216,208,0.07),transparent_68%)] blur-2xl"
        />
      </div>

      <div className="container-page relative">
        {/* Epilogue */}
        <div className="grid gap-10 border-b border-bone/12 pb-16 pt-20 md:pt-28 lg:grid-cols-12 lg:gap-16 lg:pb-20">
          <div className="lg:col-span-7" data-reveal>
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-crimson" />
              <span className="eyebrow">Épilogue · Le dernier mot</span>
            </div>
            <h2 className="mt-6 font-display text-[clamp(2.8rem,6vw,5.4rem)] leading-[0.92] text-bone">
              {rainStopped ? (
                <>
                  La pluie
                  <br />
                  <span className="italic text-brass">s'est arrêtée.</span>
                </>
              ) : (
                <>
                  La pluie
                  <br />
                  <span className="italic text-mist">tombe encore.</span>
                </>
              )}
            </h2>
            <p className="mt-6 max-w-[520px] text-[14px] leading-[1.9] text-mist sm:text-[15px]">
              {rainStopped
                ? "Pour la première fois depuis quinze ans, le ciel de Sfaker s'ouvre. Kya respire. La Porte attend le prochain Veilleur — merci d'avoir porté la cape."
                : "Quinze serrures, une lame, et tout un océan au-dessus de la tête. Tant que la pluie tombe, l'Éclicosmique garde un œil ouvert. Le vôtre suffira peut-être."}
            </p>
            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={onPlay}
                className="btn-sweep group flex items-center justify-center gap-3 bg-bone px-6 py-3.5 font-mono text-[10px] uppercase tracking-[0.24em] text-void transition-colors hover:bg-white"
              >
                <Play className="h-3 w-3 fill-crimson text-crimson" strokeWidth={1.5} />
                Jouer la démo
              </button>
              <button
                type="button"
                onClick={onToggleRain}
                className="group flex items-center justify-center gap-3 border border-bone/20 px-6 py-3.5 font-mono text-[9px] uppercase tracking-[0.2em] text-mist transition-colors hover:border-brass/40 hover:text-bone"
              >
                {rainStopped ? (
                  <CloudRain className="h-3.5 w-3.5 text-cyan" strokeWidth={1.5} />
                ) : (
                  <Sun className="h-3.5 w-3.5 text-brass" strokeWidth={1.5} />
                )}
                {rainStopped ? "Ramener la pluie" : "Faire cesser la pluie"}
              </button>
            </div>
            {rainStopped && (
              <p className="mt-4 flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.2em] text-brass">
                <Check className="h-3 w-3" strokeWidth={1.8} />
                Fin du chapitre I — merci d'avoir veillé
              </p>
            )}
          </div>

          <div className="lg:col-span-5" data-reveal style={{ "--reveal-delay": "100ms" } as React.CSSProperties}>
            <div className="relative border border-bone/12 bg-abyss/60 p-6 backdrop-blur-sm sm:p-8">
              <span className="absolute -left-px -top-px h-4 w-4 border-l border-t border-cyan/40" />
              <span className="absolute -bottom-px -right-px h-4 w-4 border-b border-r border-brass/30" />
              <div className="flex items-center justify-between gap-4">
                <p className="font-mono text-[8px] uppercase tracking-[0.24em] text-mist-dim">
                  Les Veilleurs
                </p>
                <KeyRound className="h-4 w-4 -rotate-45 text-brass" strokeWidth={1.3} />
              </div>
              <p className="mt-5 font-display text-[27px] leading-[1.05] text-bone sm:text-[30px]">
                Une lettre, quand
                <br />
                <span className="italic text-mist">l'île change.</span>
              </p>
              <p className="mt-3 text-[12.5px] leading-relaxed text-mist">
                Notes de développement, fragments du monde et prochains chapitres. Rien de
                plus. La tempête suffit.
              </p>

              {joined ? (
                <div className="mt-6 flex items-start gap-3 border border-cyan/25 bg-cyan/[0.05] p-4">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan" strokeWidth={1.6} />
                  <div>
                    <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-bone">
                      Vous veillez avec nous
                    </p>
                    <p className="mt-1 font-display text-[14px] italic leading-snug text-mist">
                      Votre nom est inscrit dans le carnet de Brumepierre.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={submit} className="mt-6">
                  <label
                    htmlFor="veilleur-email"
                    className="font-mono text-[7px] uppercase tracking-[0.2em] text-mist-dim"
                  >
                    Votre adresse
                  </label>
                  <div className="mt-2 flex border-b border-bone/20 transition-colors focus-within:border-cyan/60">
                    <input
                      id="veilleur-email"
                      type="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="veilleur@exemple.fr"
                      className="min-w-0 flex-1 bg-transparent py-3 font-mono text-[11px] text-bone placeholder:text-mist-dim/50 focus:outline-none"
                    />
                    <button
                      type="submit"
                      aria-label="Rejoindre les Veilleurs"
                      className="group grid w-10 place-items-center text-mist transition-colors hover:text-cyan"
                    >
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.4} />
                    </button>
                  </div>
                  <p className="mt-3 font-mono text-[7px] uppercase leading-relaxed tracking-[0.14em] text-mist-dim/70">
                    Aucune tempête dans votre boîte mail. Désinscription à tout moment.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Colophon */}
        <div className="grid gap-10 py-14 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-5">
            <BrandMark />
            <p className="mt-6 max-w-[340px] font-display text-[19px] italic leading-[1.45] text-mist">
              Une île sous la pluie, une cape rouge, et une porte qu'aucune main n'aurait
              dû ouvrir.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["C++17", "SDL2", "OpenGL 4.6", "GLM", "SDL2_mixer"].map((tech) => (
                <span
                  key={tech}
                  className="border border-bone/12 px-2.5 py-1.5 font-mono text-[7px] uppercase tracking-[0.16em] text-mist-dim"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          <div className="md:col-span-3">
            <p className="font-mono text-[8px] uppercase tracking-[0.24em] text-crimson">
              Chapitres
            </p>
            <ul className="mt-4 space-y-2.5">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="group flex items-baseline gap-2.5 text-mist transition-colors hover:text-bone"
                  >
                    <span className="font-mono text-[7px] tracking-[0.12em] text-mist-dim">
                      {link.index}
                    </span>
                    <span className="font-display text-[16px] leading-none">{link.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4">
            <p className="font-mono text-[8px] uppercase tracking-[0.24em] text-crimson">
              Crédits
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <p className="font-mono text-[7px] uppercase tracking-[0.18em] text-mist-dim">
                  Studio
                </p>
                <p className="mt-1 font-display text-[19px] leading-none text-bone">
                  WANDERGRAND
                </p>
              </div>
              <div>
                <p className="font-mono text-[7px] uppercase tracking-[0.18em] text-mist-dim">
                  Créateur · direction artistique
                </p>
                <p className="mt-1 font-display text-[17px] leading-tight text-bone/90">
                  Randriamanantiana Judickael
                </p>
              </div>
              <div className="flex items-start gap-2.5 border-t border-bone/10 pt-4">
                <Code2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mist-dim" strokeWidth={1.3} />
                <p className="font-mono text-[7px] uppercase leading-[1.8] tracking-[0.12em] text-mist-dim">
                  Action-RPG 3D solo · Style anime low-poly
                  <br />
                  Chapitre I — La Porte Interdite
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-4 border-t border-bone/10 py-6 sm:flex-row sm:items-center">
          <p className="font-mono text-[7.5px] uppercase tracking-[0.18em] text-mist-dim">
            © 2026 WANDERGRAND · Tous droits réservés
          </p>
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5 font-mono text-[7.5px] uppercase tracking-[0.16em] text-mist-dim">
              <Droplets className="h-3 w-3 text-cyan-dim" strokeWidth={1.5} />
              {rainStopped ? "Ciel calme · Sfaker" : "Pluie 34 km/h · Sfaker"}
            </span>
            <a
              href="#top"
              aria-label="Retour en haut"
              className="group grid h-8 w-8 place-items-center border border-bone/15 text-mist transition-colors hover:border-bone/35 hover:text-bone"
            >
              <ArrowUp className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5" strokeWidth={1.4} />
            </a>
          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none relative select-none overflow-hidden"
      >
        <p className="whitespace-nowrap text-center font-display text-[clamp(2.6rem,12vw,14rem)] uppercase leading-[0.7] tracking-[0.01em] text-bone/[0.05] sm:tracking-[0.02em]">
          Sdfaker Rian
        </p>
        <div className="absolute inset-0 bg-gradient-to-t from-void via-transparent to-transparent" />
      </div>
    </footer>
  );
}
