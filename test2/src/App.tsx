// ─────────────────────────────────────────────────────────────
// SDFAKER RIAN — App shell (WANDERGRAND)
// ─────────────────────────────────────────────────────────────
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Game, SaveData, HudState, freshSave } from '@/game/Game';
import { Lang, t, DialogueLine } from '@/game/i18n';
import { Opts, Slots, loadOpts, saveOpts, loadSlots, writeSlot } from '@/game/store';
import { audio } from '@/game/audio';
import { TitleScreen, SlotsScreen, OptionsScreen, PauseScreen, GameOverScreen, IntroScreen, CreditsScreen, FarewellScreen } from '@/ui/screens';
import { HUD, DialogueBox, Banner, Toasts, Flash } from '@/ui/hud';

type Screen = 'title' | 'slots' | 'game' | 'farewell';

const DEFAULT_HUD: HudState = {
  hp: 10, maxHp: 10, gauge: 0, gaugeCap: 4, keys: 0, stones: 0, kills: 0,
  slachKey: false, stoneKey: false, elderMet: false, objective: 'obj_elder', bossFrac: null, zone: null,
};

export default function App() {
  const [opts, setOpts] = useState<Opts>(loadOpts);
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const [slots, setSlots] = useState<Slots>(loadSlots);
  const [screen, setScreen] = useState<Screen>('title');
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [optionsFrom, setOptionsFrom] = useState<'title' | 'pause'>('title');

  // game session
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const slotRef = useRef(0);
  const [session, setSession] = useState(0);
  const [showIntro, setShowIntro] = useState(false);

  // overlays
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState<'fall' | 'combat' | null>(null);
  const [credits, setCredits] = useState(false);
  const [hud, setHud] = useState<HudState>(DEFAULT_HUD);
  const [dialogue, setDialogue] = useState<DialogueLine | null>(null);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ text: string; sub?: string; id: number } | null>(null);
  const [toasts, setToasts] = useState<{ id: number; text: string }[]>([]);
  const [flash, setFlash] = useState<{ kind: 'hurt' | 'heal' | 'white'; tick: number } | null>(null);
  const idRef = useRef(1);

  // refs mirroring overlay state (engine hooks need fresh reads)
  const dialogueRef = useRef<DialogueLine | null>(null); dialogueRef.current = dialogue;
  const creditsRef = useRef(credits); creditsRef.current = credits;
  const gameOverRef = useRef(gameOver); gameOverRef.current = gameOver;
  const pausedRef = useRef(paused); pausedRef.current = paused;
  const introRef = useRef(showIntro); introRef.current = showIntro;
  const screenRef = useRef(screen); screenRef.current = screen;

  const lang = opts.lang;

  // volume wiring
  useEffect(() => { audio.setVolumes(opts.master, opts.amb, opts.sfx); }, [opts.master, opts.amb, opts.sfx]);
  useEffect(() => { saveOpts(opts); }, [opts]);
  useEffect(() => { gameRef.current?.applyQuality(opts.quality); }, [opts.quality]);

  // menu ambience
  useEffect(() => {
    if (screen === 'title' || screen === 'slots' || screen === 'farewell') audio.ambience('menu');
  }, [screen]);

  const pushToast = useCallback((text: string) => {
    const id = idRef.current++;
    setToasts((ts) => [...ts.slice(-3), { id, text }]);
    window.setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 3000);
  }, []);
  const pushBanner = useCallback((text: string, sub?: string) => {
    const id = idRef.current++;
    setBanner({ text, sub, id });
    window.setTimeout(() => setBanner((b) => (b && b.id === id ? null : b)), 3500);
  }, []);
  const pushFlash = useCallback((kind: 'hurt' | 'heal' | 'white') => {
    const id = idRef.current++;
    setFlash({ kind, tick: id });
    window.setTimeout(() => setFlash((f) => (f && f.tick === id ? null : f)), 620);
  }, []);

  const hooks = useMemo(() => ({
    onHud: (h: HudState) => setHud(h),
    onDialogue: (l: DialogueLine | null) => setDialogue(l),
    onPrompt: (p: string | null) => setPrompt(p),
    onBanner: pushBanner,
    onToast: pushToast,
    onFlash: pushFlash,
    onEscape: () => {
      if (creditsRef.current || gameOverRef.current || dialogueRef.current) return;
      setPaused((p) => {
        const np = !p;
        gameRef.current?.setPaused(np);
        if (np) document.exitPointerLock?.();
        return np;
      });
    },
    onGameOver: (cause: 'fall' | 'combat') => { setGameOver(cause); document.exitPointerLock?.(); },
    onVictory: () => { setCredits(true); gameRef.current?.setPaused(true); document.exitPointerLock?.(); },
    onSave: (data: SaveData) => { setSlots(writeSlot(slotRef.current, { save: data, updatedAt: Date.now() })); },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);

  // losing pointer lock during active play → open pause (Esc under lock)
  useEffect(() => {
    const onLock = () => {
      if (document.pointerLockElement) return;
      if (screenRef.current !== 'game') return;
      if (pausedRef.current || dialogueRef.current || gameOverRef.current || creditsRef.current || introRef.current) return;
      setPaused(true);
      gameRef.current?.setPaused(true);
    };
    document.addEventListener('pointerlockchange', onLock);
    return () => document.removeEventListener('pointerlockchange', onLock);
  }, []);

  // create / destroy game per session
  useEffect(() => {
    if (screen !== 'game' || session === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const slotsNow = loadSlots();
    const slotSave = slotsNow[slotRef.current]?.save ?? freshSave();
    const g = new Game(canvas, hooks, {
      getLang: () => optsRef.current.lang,
      getSens: () => optsRef.current.sens,
      quality: optsRef.current.quality,
      save: slotSave,
    });
    gameRef.current = g;
    g.setPaused(showIntro);
    return () => {
      g.dispose();
      gameRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, session]);

  const startSlot = (i: number, fresh: boolean) => {
    slotRef.current = i;
    if (fresh) setSlots(writeSlot(i, { save: freshSave(), updatedAt: Date.now() }));
    setShowIntro(fresh);
    setPaused(false); setGameOver(null); setCredits(false);
    setHud(DEFAULT_HUD); setDialogue(null); setPrompt(null); setToasts([]);
    setSession((s) => s + 1);
    setScreen('game');
  };

  const backToMenu = () => {
    // force one last save
    const g = gameRef.current;
    if (g) setSlots(writeSlot(slotRef.current, { save: g.getSave(), updatedAt: Date.now() }));
    setScreen('title');
    setPaused(false); setCredits(false); setGameOver(null); setDialogue(null);
    setSession(0);
    setSlots(loadSlots());
  };

  const resume = () => { setPaused(false); gameRef.current?.setPaused(false); };
  const respawn = () => { setGameOver(null); gameRef.current?.respawn(); };

  // global unlock
  useEffect(() => {
    const unlock = () => audio.unlock();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => { window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock); };
  }, []);

  return (
    <div className="relative h-full w-full bg-[#070a12] overflow-hidden">
      {screen === 'title' && !optionsOpen && (
        <TitleScreen
          lang={lang}
          onPlay={() => { audio.unlock(); setScreen('slots'); }}
          onOptions={() => { setOptionsFrom('title'); setOptionsOpen(true); }}
          onQuit={() => setScreen('farewell')}
          onLang={(l) => setOpts((o) => ({ ...o, lang: l }))}
        />
      )}
      {screen === 'slots' && (
        <SlotsScreen
          lang={lang}
          slots={slots}
          onPick={startSlot}
          onBack={() => setScreen('title')}
          onChange={setSlots}
        />
      )}
      {screen === 'farewell' && <FarewellScreen lang={lang} onBack={() => setScreen('title')} />}
      {optionsOpen && (
        <div className="absolute inset-0 z-50">
          <OptionsScreen
            lang={lang}
            opts={{ ...opts, lang }}
            onChange={setOpts}
            onBack={() => setOptionsOpen(false)}
          />
        </div>
      )}

      {/* ── GAME SCREEN ── */}
      {screen === 'game' && (
        <div className="absolute inset-0">
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
          <div className="vignette" />
          {hud.hp <= 3 && hud.hp > 0 && !gameOver && <div className="lowhp" />}
          <HUD hud={hud} lang={lang} prompt={paused || dialogue ? null : prompt} />
          <Banner banner={banner} />
          <Toasts toasts={toasts} />
          {flash && <Flash kind={flash.kind} tick={flash.tick} />}
          {dialogue && !paused && (
            <DialogueBox line={dialogue} lang={lang} onNext={() => gameRef.current?.nextDialogue()} />
          )}
          {paused && !optionsOpen && (
            <PauseScreen
              lang={lang}
              onResume={resume}
              onOptions={() => { setOptionsFrom('pause'); setOptionsOpen(true); }}
              onMenu={backToMenu}
            />
          )}
          {gameOver && <GameOverScreen lang={lang} cause={gameOver} onRespawn={respawn} />}
          {showIntro && <IntroScreen lang={lang} onDone={() => { setShowIntro(false); gameRef.current?.setPaused(false); }} />}
          {credits && <CreditsScreen lang={lang} onMenu={backToMenu} />}
        </div>
      )}
    </div>
  );
}
