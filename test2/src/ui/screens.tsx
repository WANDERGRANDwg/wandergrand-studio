// ─────────────────────────────────────────────────────────────
// SDFAKER RIAN — Screens: title, slots, options, pause,
// game over, intro, credits, farewell
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import { Play, Settings, Power, ArrowLeft, Heart, Key, Skull, Trash2, RotateCcw, Home, Volume2, Gamepad2, Keyboard, Languages, Monitor } from 'lucide-react';
import { Lang, t } from '@/game/i18n';
import { Opts, Slots, writeSlot } from '@/game/store';
import { audio } from '@/game/audio';
import type { Quality } from '@/game/Game';

const hoverBlip = () => audio.uiMove();
const clickBlip = () => { audio.unlock(); audio.uiMove(); };

function MenuButton({ label, icon, onClick, danger }: { label: string; icon?: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onMouseEnter={hoverBlip}
      onClick={() => { clickBlip(); onClick(); }}
      className={`menu-btn flex items-center gap-3 font-title text-lg md:text-xl tracking-[0.25em] text-left ${danger ? 'text-[#ff8a94]' : 'text-[#aab6cc]'}`}
    >
      {icon}
      {label}
    </button>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 overflow-hidden storm-sky">
      <div className="css-rain" />
      <div className="css-flash" />
      <div className="vignette" />
      {children}
    </div>
  );
}

// ── TITLE ────────────────────────────────────────────────────
export function TitleScreen({ lang, onPlay, onOptions, onQuit, onLang }: {
  lang: Lang; onPlay: () => void; onOptions: () => void; onQuit: () => void; onLang: (l: Lang) => void;
}) {
  return (
    <Frame>
      <div className="relative z-10 h-full flex flex-col items-center justify-center">
        <div className="absolute top-6 right-8 flex gap-1 border border-white/10 rounded-md overflow-hidden">
          {(['fr', 'en'] as Lang[]).map((l) => (
            <button key={l} onClick={() => onLang(l)}
              className={`px-3 py-1 text-xs font-title tracking-[0.3em] transition-colors ${lang === l ? 'bg-[#e8b34b]/20 text-[#e8b34b]' : 'text-[#5a6577] hover:text-[#aab6cc]'}`}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="font-title text-xs md:text-sm tracking-[0.6em] text-[#8a97ad] mb-6 fade-swap">
          {t(lang, 'studio')} · {t(lang, 'presents')}
        </div>
        <h1 className="font-title font-black text-center leading-none select-none">
          <span className="block text-5xl md:text-7xl tracking-[0.22em] text-[#dfe6f5] title-glow">{t(lang, 'title1')}</span>
          <span className="block text-6xl md:text-8xl tracking-[0.3em] mt-1 bg-gradient-to-b from-[#ff5c6e] via-[#e0394b] to-[#7a1020] bg-clip-text text-transparent rune-glow">{t(lang, 'title2')}</span>
        </h1>
        <div className="mt-4 h-px w-56 bg-gradient-to-r from-transparent via-[#e8b34b]/60 to-transparent" />
        <p className="mt-3 text-sm md:text-base italic text-[#8a97ad] tracking-wider">{t(lang, 'subtitle')}</p>

        <nav className="mt-12 flex flex-col gap-5">
          <MenuButton label={t(lang, 'play')} icon={<Play className="w-5 h-5" />} onClick={onPlay} />
          <MenuButton label={t(lang, 'options')} icon={<Settings className="w-5 h-5" />} onClick={onOptions} />
          <MenuButton label={t(lang, 'quit')} icon={<Power className="w-5 h-5" />} onClick={onQuit} />
        </nav>

        <div className="absolute bottom-5 inset-x-0 text-center text-[11px] tracking-[0.25em] text-[#4a5468]">
          © 2202 {t(lang, 'studio')} — Randriamanantiana Judickael
        </div>
      </div>
    </Frame>
  );
}

// ── SAVE SLOTS ───────────────────────────────────────────────
export function SlotsScreen({ lang, slots, onPick, onBack, onChange }: {
  lang: Lang; slots: Slots; onPick: (i: number, fresh: boolean) => void; onBack: () => void; onChange: (s: Slots) => void;
}) {
  const [confirmDel, setConfirmDel] = useState<number | null>(null);
  return (
    <Frame>
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-4">
        <h2 className="font-title text-2xl md:text-3xl tracking-[0.35em] text-[#dfe6f5] mb-10 title-glow">{t(lang, 'slot_title')}</h2>
        <div className="flex flex-col md:flex-row gap-5">
          {slots.map((s, i) => (
            <div key={i} className="slot-card relative w-64 md:w-60 rounded-xl border border-white/10 bg-[#0a0e1a]/85 backdrop-blur-md p-5 flex flex-col min-h-[190px]">
              <div className="font-title text-xs tracking-[0.4em] text-[#5a6577] mb-3">— {['I', 'II', 'III'][i]} —</div>
              {s ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-[#dfe6f5]"><Heart className="w-4 h-4" fill="#e0394b" color="#ff5c6e" /> <span className="font-title">{s.save.hp}/{s.save.maxHp}</span></div>
                  <div className="flex items-center gap-2 text-sm text-[#dfe6f5] mt-2"><Key className="w-4 h-4 text-[#e8b34b]" /> <span className="font-title text-[#e8b34b]">{s.save.keyIds.length}/15</span> <span className="text-[#5a6577] text-xs ml-1">{t(lang, 'keys_of')}</span></div>
                  <div className="flex items-center gap-2 text-xs mt-2 text-[#8a97ad]">
                    <Skull className={`w-4 h-4 ${s.save.bossDead ? 'text-[#53ff9e]' : 'text-[#b040ff]'}`} />
                    {s.save.bossDead ? t(lang, 'boss_slain') : t(lang, 'boss_alive')}
                  </div>
                  <div className="text-[11px] text-[#4a5468] mt-1">{Math.floor(s.save.playSec / 60)} {t(lang, 'minutes')}</div>
                  <div className="flex-1" />
                  <div className="flex items-center justify-between mt-3">
                    <button onClick={() => { clickBlip(); onPick(i, false); }}
                      className="font-title text-sm tracking-[0.25em] text-[#e8b34b] hover:text-white transition-colors">
                      {t(lang, 'play')}
                    </button>
                    {confirmDel === i ? (
                      <button onClick={() => { onChange(writeSlot(i, null)); setConfirmDel(null); }}
                        className="text-xs text-[#ff5c6e] hover:text-white">{t(lang, 'slot_erase')}</button>
                    ) : (
                      <button onClick={() => setConfirmDel(i)} className="text-[#5a6577] hover:text-[#ff5c6e] transition-colors"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-3">
                  <span className="text-[#4a5468] text-sm italic">{t(lang, 'slot_empty')}</span>
                  <button onClick={() => { clickBlip(); onPick(i, true); }}
                    className="font-title text-sm tracking-[0.25em] text-[#dfe6f5] border border-[#e8b34b]/40 px-4 py-2 rounded-md hover:bg-[#e8b34b]/10 hover:text-white transition-all">
                    + {t(lang, 'slot_new')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        <button onClick={onBack} className="menu-btn font-title mt-12 flex items-center gap-2 text-[#aab6cc] tracking-[0.25em]"><ArrowLeft className="w-4 h-4" /> {t(lang, 'back')}</button>
      </div>
    </Frame>
  );
}

// ── OPTIONS ──────────────────────────────────────────────────
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-8 py-2.5 border-b border-white/5">
      <span className="text-sm text-[#aab6cc] tracking-wider">{label}</span>
      {children}
    </div>
  );
}
function Seg<T extends string>({ value, options, onChange }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex border border-white/10 rounded-md overflow-hidden">
      {options.map((o) => (
        <button key={o.v} onClick={() => onChange(o.v)}
          className={`px-3 py-1 text-xs font-title tracking-[0.15em] transition-colors ${value === o.v ? 'bg-[#e8b34b]/20 text-[#e8b34b]' : 'text-[#5a6577] hover:text-[#aab6cc]'}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
function Slider({ value, onChange, min = 0, max = 1, step = 0.05 }: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number }) {
  return (
    <input type="range" className="range-thin w-40" min={min} max={max} step={step} value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))} />
  );
}

export function OptionsScreen({ lang, opts, onChange, onBack }: {
  lang: Lang; opts: Opts; onChange: (o: Opts) => void; onBack: () => void;
}) {
  const set = <K extends keyof Opts>(k: K, v: Opts[K]) => onChange({ ...opts, [k]: v });
  const ctl = (l: string, kb: string, pad: string) => (
    <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-white/5 text-sm items-center">
      <span className="text-[#aab6cc]">{l}</span>
      <span className="text-[#e8b34b] font-title text-xs tracking-wider text-center">{kb}</span>
      <span className="text-[#53c8ff] font-title text-xs tracking-wider text-center">{pad}</span>
    </div>
  );
  return (
    <Frame>
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 py-10">
        <h2 className="font-title text-2xl md:text-3xl tracking-[0.35em] text-[#dfe6f5] mb-6 title-glow">{t(lang, 'options')}</h2>
        <div className="w-full max-w-3xl max-h-[70vh] overflow-y-auto rounded-xl border border-white/10 bg-[#0a0e1a]/85 backdrop-blur-md p-6 grid md:grid-cols-2 gap-x-10">
          <div>
            <div className="flex items-center gap-2 mb-2 text-[#e8b34b]"><Languages className="w-4 h-4" /><span className="font-title text-xs tracking-[0.3em]">{t(lang, 'opt_language').toUpperCase()}</span></div>
            <Row label={t(lang, 'opt_language')}><Seg<Lang> value={opts.lang} onChange={(v) => set('lang', v)} options={[{ v: 'fr', label: 'FR' }, { v: 'en', label: 'EN' }]} /></Row>
            <div className="flex items-center gap-2 mt-5 mb-2 text-[#e8b34b]"><Monitor className="w-4 h-4" /><span className="font-title text-xs tracking-[0.3em]">{t(lang, 'opt_quality').toUpperCase()}</span></div>
            <Row label={t(lang, 'opt_quality')}>
              <Seg<Quality> value={opts.quality} onChange={(v) => set('quality', v)} options={[{ v: 'low', label: t(lang, 'q_low') }, { v: 'med', label: t(lang, 'q_med') }, { v: 'high', label: t(lang, 'q_high') }]} />
            </Row>
            <div className="flex items-center gap-2 mt-5 mb-2 text-[#e8b34b]"><Volume2 className="w-4 h-4" /><span className="font-title text-xs tracking-[0.3em]">AUDIO</span></div>
            <Row label={t(lang, 'opt_master')}><Slider value={opts.master} onChange={(v) => set('master', v)} /></Row>
            <Row label={t(lang, 'opt_amb')}><Slider value={opts.amb} onChange={(v) => set('amb', v)} /></Row>
            <Row label={t(lang, 'opt_sfx')}><Slider value={opts.sfx} onChange={(v) => set('sfx', v)} /></Row>
            <Row label={t(lang, 'opt_sens')}><Slider value={opts.sens} onChange={(v) => set('sens', v)} min={0.3} max={2.5} step={0.1} /></Row>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-2 text-[#e8b34b]"><Keyboard className="w-4 h-4" /><span className="font-title text-xs tracking-[0.3em]">{t(lang, 'keyboard')}</span></span>
              <span className="flex items-center gap-2 text-[#53c8ff]"><Gamepad2 className="w-4 h-4" /><span className="font-title text-xs tracking-[0.3em]">{t(lang, 'gamepad')}</span></span>
            </div>
            {ctl(t(lang, 'ctl_move'), t(lang, 'ctl_kb1'), t(lang, 'ctl_pad1'))}
            {ctl(t(lang, 'ctl_cam'), t(lang, 'ctl_kb2'), t(lang, 'ctl_pad2'))}
            {ctl(t(lang, 'ctl_jump'), t(lang, 'ctl_kb3'), t(lang, 'ctl_pad3'))}
            {ctl(t(lang, 'ctl_sprint'), t(lang, 'ctl_kb4'), t(lang, 'ctl_pad4'))}
            {ctl(t(lang, 'ctl_attack'), t(lang, 'ctl_kb5'), t(lang, 'ctl_pad5'))}
            {ctl(t(lang, 'ctl_interact'), t(lang, 'ctl_kb6'), t(lang, 'ctl_pad6'))}
            {ctl(t(lang, 'ctl_heal'), t(lang, 'ctl_kb7'), t(lang, 'ctl_pad7'))}
            {ctl(t(lang, 'ctl_pause'), t(lang, 'ctl_kb8'), t(lang, 'ctl_pad8'))}
          </div>
        </div>
        <button onClick={onBack} className="menu-btn font-title mt-8 flex items-center gap-2 text-[#aab6cc] tracking-[0.25em]"><ArrowLeft className="w-4 h-4" /> {t(lang, 'back')}</button>
      </div>
    </Frame>
  );
}

// ── PAUSE ────────────────────────────────────────────────────
export function PauseScreen({ lang, onResume, onOptions, onMenu }: {
  lang: Lang; onResume: () => void; onOptions: () => void; onMenu: () => void;
}) {
  return (
    <div className="absolute inset-0 z-40 bg-[#05070d]/75 backdrop-blur-sm flex flex-col items-center justify-center">
      <h2 className="font-title text-4xl tracking-[0.5em] text-[#dfe6f5] title-glow mb-2">{t(lang, 'paused')}</h2>
      <div className="text-[10px] tracking-[0.3em] text-[#4a5468] mb-10">{t(lang, 'saved')}</div>
      <nav className="flex flex-col gap-5">
        <MenuButton label={t(lang, 'resume')} icon={<RotateCcw className="w-5 h-5" />} onClick={onResume} />
        <MenuButton label={t(lang, 'options')} icon={<Settings className="w-5 h-5" />} onClick={onOptions} />
        <MenuButton label={t(lang, 'to_menu')} icon={<Home className="w-5 h-5" />} onClick={onMenu} danger />
      </nav>
    </div>
  );
}

// ── GAME OVER ────────────────────────────────────────────────
export function GameOverScreen({ lang, cause, onRespawn }: { lang: Lang; cause: 'fall' | 'combat'; onRespawn: () => void }) {
  useEffect(() => {
    const to = window.setTimeout(onRespawn, 6000);
    return () => window.clearTimeout(to);
  }, [onRespawn]);
  return (
    <div className="absolute inset-0 z-40 bg-black/85 flex flex-col items-center justify-center fade-swap">
      <div className="w-16 h-px bg-[#e0394b]/60 mb-8" />
      <h2 className="font-title text-4xl md:text-5xl tracking-[0.3em] text-[#e0394b] rune-glow text-center px-4">
        {cause === 'fall' ? t(lang, 'dead_fall') : t(lang, 'dead_combat')}
      </h2>
      <p className="mt-4 text-sm text-[#8a97ad] tracking-widest">{t(lang, 'death_penalty')}</p>
      <div className="w-16 h-px bg-[#e0394b]/60 mt-8" />
      <button onClick={onRespawn}
        className="menu-btn mt-10 font-title text-lg tracking-[0.3em] text-[#dfe6f5]">
        {t(lang, 'respawn_hint')}
      </button>
    </div>
  );
}

// ── INTRO (story crawl) ──────────────────────────────────────
export function IntroScreen({ lang, onDone }: { lang: Lang; onDone: () => void }) {
  const [step, setStep] = useState(0);
  const lines = [t(lang, 'intro1'), t(lang, 'intro2'), t(lang, 'intro3')];
  useEffect(() => {
    if (step >= lines.length) { onDone(); return; }
    const to = window.setTimeout(() => setStep((s) => s + 1), 3400);
    return () => window.clearTimeout(to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);
  return (
    <div className="absolute inset-0 z-50 bg-[#04060b] flex flex-col items-center justify-center px-6" onClick={onDone}>
      {step < lines.length && (
        <p key={step} className="fade-swap max-w-2xl text-center text-xl md:text-2xl italic leading-relaxed text-[#c6d0e4]">
          {lines[step]}
        </p>
      )}
      <button className="absolute bottom-8 right-10 text-xs tracking-[0.3em] text-[#4a5468] hover:text-[#aab6cc] font-title">
        {t(lang, 'skip')} ▸
      </button>
      <div className="absolute bottom-8 left-10 flex gap-1.5">
        {lines.map((_, i) => <div key={i} className={`w-6 h-0.5 ${i <= step ? 'bg-[#e8b34b]' : 'bg-[#2a3450]'}`} />)}
      </div>
    </div>
  );
}

// ── CREDITS ──────────────────────────────────────────────────
export function CreditsScreen({ lang, onMenu }: { lang: Lang; onMenu: () => void }) {
  const Item = ({ k, v, gold }: { k: string; v: string; gold?: boolean }) => (
    <div className="mb-10">
      <div className="font-title text-[11px] tracking-[0.45em] text-[#5a6577] mb-2">{k}</div>
      <div className={`font-title text-xl md:text-2xl tracking-[0.2em] ${gold ? 'text-[#e8b34b] gold-glow' : 'text-[#dfe6f5]'}`}>{v}</div>
    </div>
  );
  return (
    <div className="absolute inset-0 z-40 overflow-hidden bg-gradient-to-b from-[#04060bcc] via-transparent to-[#04060b]">
      <div className="absolute inset-0 overflow-hidden">
        <div className="credits-roll absolute inset-x-0 top-0 text-center px-6">
          <div className="pt-[100vh]" />
          <div className="font-title text-4xl md:text-6xl tracking-[0.3em] text-[#eef2fb] title-glow mb-16">{t(lang, 'cr_title')}</div>
          <Item k={t(lang, 'cr_studio')} v={t(lang, 'studio')} gold />
          <Item k={t(lang, 'cr_creator')} v={t(lang, 'cr_name')} gold />
          <Item k={t(lang, 'cr_engine')} v="Three.js · WebGL2 · GLSL" />
          <Item k={t(lang, 'cr_audio')} v="Web Audio API" />
          <div className="font-title text-[11px] tracking-[0.45em] text-[#5a6577] mb-2">{t(lang, 'cr_cast')}</div>
          <div className="text-lg md:text-xl text-[#c6d0e4] mb-2 tracking-wider">{t(lang, 'cr_kya')}</div>
          <div className="text-lg md:text-xl text-[#c6d0e4] mb-2 tracking-wider">{t(lang, 'cr_entities')}</div>
          <div className="text-lg md:text-xl text-[#c6d0e4] mb-16 tracking-wider">{t(lang, 'cr_boss')}</div>
          <div className="italic text-[#8a97ad] text-lg mb-4">{t(lang, 'cr_end')}</div>
          <div className="font-title text-3xl md:text-4xl tracking-[0.3em] text-[#e8b34b] gold-glow mb-24">{t(lang, 'cr_thanks')}</div>
        </div>
      </div>
      <button onClick={onMenu}
        className="menu-btn absolute bottom-8 inset-x-0 mx-auto w-fit font-title text-sm tracking-[0.35em] text-[#aab6cc] bg-[#0a0e1a]/70 border border-white/10 px-6 py-2.5 rounded-lg z-10">
        <Home className="w-4 h-4" /> {t(lang, 'to_menu')}
      </button>
    </div>
  );
}

// ── FAREWELL (Quit) ──────────────────────────────────────────
export function FarewellScreen({ lang, onBack }: { lang: Lang; onBack: () => void }) {
  return (
    <Frame>
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 text-center">
        <div className="font-title text-2xl md:text-4xl tracking-[0.2em] text-[#c6d0e4] leading-relaxed max-w-xl">{t(lang, 'farewell')}</div>
        <button onClick={onBack} className="menu-btn font-title mt-12 flex items-center gap-2 text-[#aab6cc] tracking-[0.25em]"><ArrowLeft className="w-4 h-4" /> {t(lang, 'back')}</button>
      </div>
    </Frame>
  );
}
