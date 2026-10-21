// ─────────────────────────────────────────────────────────────
// SDFAKER RIAN — HUD, dialogue box (typewriter), banners, toasts
// ─────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react';
import { Heart, Key, Gem, Skull, ScrollText, ChevronDown, Droplets } from 'lucide-react';
import type { HudState } from '@/game/Game';
import { Lang, t, DialogueLine } from '@/game/i18n';
import { audio } from '@/game/audio';

// ── Dialogue box (Hollow Knight flavour) ─────────────────────
export function DialogueBox({ line, lang, onNext }: { line: DialogueLine; lang: Lang; onNext: () => void }) {
  const [shown, setShown] = useState(0);
  const text = line.text;
  const done = shown >= text.length;
  const doneRef = useRef(done);
  doneRef.current = done;

  useEffect(() => {
    setShown(0);
    let n = 0;
    const iv = window.setInterval(() => {
      n += 1;
      setShown(n);
      if (n % 3 === 0 && n < text.length) audio.blip();
      if (n >= text.length) window.clearInterval(iv);
    }, 26);
    return () => window.clearInterval(iv);
  }, [text]);

  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === 'KeyE' || e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener('keydown', kd);
    return () => window.removeEventListener('keydown', kd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, done]);

  const advance = () => {
    if (!doneRef.current) { setShown(text.length); return; }
    onNext();
  };

  const initial = line.speaker.charAt(0);
  return (
    <div className="absolute inset-x-0 bottom-0 z-40 flex justify-center pb-8 px-6 dlg-in" onClick={advance}>
      <div className="relative w-full max-w-3xl cursor-pointer">
        {/* name tag */}
        <div className="absolute -top-5 left-6 flex items-center gap-2">
          <div className="w-10 h-10 rounded-md border border-[#e8b34b]/50 bg-[#0b0e18] flex items-center justify-center font-title text-xl text-[#e8b34b] gold-glow">
            {initial}
          </div>
          <div className="px-4 py-1 rounded-md border border-[#e8b34b]/40 bg-[#0b0e18]/95 font-title tracking-[0.2em] text-sm text-[#e8b34b]">
            {line.speaker}
          </div>
        </div>
        {/* body */}
        <div className="rounded-xl border border-white/10 bg-[#070a12]/92 backdrop-blur-md px-7 pt-7 pb-6 shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
          <p className="text-lg md:text-xl leading-relaxed text-[#dfe6f5] min-h-[3.4rem]">
            {text.slice(0, shown)}
            {!done && <span className="inline-block w-2 h-5 ml-1 align-middle bg-[#e8b34b]/80 blink" />}
          </p>
          <div className="flex justify-end mt-1">
            <ChevronDown className={`w-5 h-5 text-[#e8b34b] ${done ? 'blink' : 'opacity-20'}`} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Hearts + heal gauge ──────────────────────────────────────
function Hearts({ hp, maxHp }: { hp: number; maxHp: number }) {
  const rows: number[][] = [];
  const perRow = 10;
  for (let r = 0; r * perRow < maxHp; r++) {
    const row: number[] = [];
    for (let i = r * perRow; i < Math.min(maxHp, (r + 1) * perRow); i++) row.push(i);
    rows.push(row);
  }
  return (
    <div className="flex flex-col gap-1">
      {rows.map((row, ri) => (
        <div key={ri} className="flex gap-1">
          {row.map((i) => (
            <Heart
              key={i}
              className="w-5 h-5 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]"
              fill={i < hp ? '#e0394b' : 'rgba(20,24,38,0.85)'}
              color={i < hp ? '#ff5c6e' : '#3a4358'}
              strokeWidth={1.6}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── HUD ──────────────────────────────────────────────────────
export function HUD({ hud, lang, prompt }: { hud: HudState; lang: Lang; prompt: string | null }) {
  const hurting = hud.hp < hud.maxHp;
  return (
    <>
      {/* top-left : hearts + red heal gauge */}
      <div className="absolute top-5 left-5 z-30">
        <Hearts hp={hud.hp} maxHp={hud.maxHp} />
        {hurting && (
          <div className="mt-2 fade-swap">
            <div className="flex items-center gap-1.5 mb-1">
              <Droplets className="w-3.5 h-3.5 text-[#ff4d5e]" />
              <span className="text-[10px] tracking-[0.25em] text-[#ff8a94] font-title">R · {t(lang, 'heal_hint').toUpperCase()}</span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: hud.gaugeCap }).map((_, i) => (
                <div
                  key={i}
                  className="h-2 w-8 rounded-sm border border-[#ff4d5e]/40 transition-all duration-300"
                  style={{
                    background: i < hud.gauge ? 'linear-gradient(90deg,#ff2038,#ff7a4d)' : 'rgba(224,57,75,0.08)',
                    boxShadow: i < hud.gauge ? '0 0 10px rgba(255,32,56,0.7)' : 'none',
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* top-right : objective + counters */}
      <div className="absolute top-5 right-5 z-30 flex flex-col items-end gap-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-[#070a12]/70 backdrop-blur-sm">
          <ScrollText className="w-4 h-4 text-[#e8b34b]" />
          <span className="text-[10px] tracking-[0.3em] text-[#8a97ad] font-title">{t(lang, 'objective')}</span>
          <span className="text-sm text-[#dfe6f5]">{t(lang, hud.objective)}</span>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#e8b34b]/25 bg-[#070a12]/70 backdrop-blur-sm">
            <Key className="w-4 h-4 text-[#e8b34b]" />
            <span className="text-sm font-title text-[#e8b34b]">{hud.keys}/15</span>
          </div>
          {!hud.stoneKey && hud.elderMet && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#53c8ff]/25 bg-[#070a12]/70 backdrop-blur-sm">
              <Gem className="w-4 h-4 text-[#53c8ff]" />
              <span className="text-sm font-title text-[#53c8ff]">{Math.min(hud.stones, 30)}/30</span>
            </div>
          )}
          {!hud.slachKey && hud.elderMet && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#b040ff]/25 bg-[#070a12]/70 backdrop-blur-sm">
              <Skull className="w-4 h-4 text-[#b040ff]" />
              <span className="text-sm font-title text-[#b040ff]">{Math.min(hud.kills, 10)}/10</span>
            </div>
          )}
        </div>
      </div>

      {/* boss bar */}
      {hud.bossFrac !== null && (
        <div className="absolute bottom-24 inset-x-0 z-30 flex flex-col items-center fade-swap">
          <span className="font-title tracking-[0.45em] text-sm text-[#f0d8ff] mb-2" style={{ textShadow: '0 0 16px rgba(176,64,255,0.8)' }}>
            {t(lang, 'boss_name')}
          </span>
          <div className="w-[min(620px,70vw)] h-2.5 rounded-full border border-[#b040ff]/40 bg-black/60 overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{ width: `${hud.bossFrac * 100}%`, background: 'linear-gradient(90deg,#5a1a8a,#b040ff,#ff2038)', boxShadow: '0 0 14px rgba(176,64,255,0.9)' }}
            />
          </div>
        </div>
      )}

      {/* interaction prompt */}
      {prompt && (
        <div className="absolute bottom-40 inset-x-0 z-30 flex justify-center fade-swap">
          <div className="px-4 py-2 rounded-lg border border-white/15 bg-[#070a12]/80 backdrop-blur-sm text-sm tracking-wider text-[#dfe6f5]">
            {prompt}
          </div>
        </div>
      )}
    </>
  );
}

// ── Zone banner ──────────────────────────────────────────────
export function Banner({ banner }: { banner: { text: string; sub?: string; id: number } | null }) {
  if (!banner) return null;
  return (
    <div key={banner.id} className="absolute inset-x-0 top-[26%] z-30 flex flex-col items-center pointer-events-none banner-wrap">
      <div className="font-title text-3xl md:text-5xl tracking-[0.3em] text-[#eef2fb] text-center" style={{ textShadow: '0 0 30px rgba(150,180,240,0.5), 0 2px 0 rgba(0,0,0,0.7)' }}>
        {banner.text}
      </div>
      {banner.sub && (
        <div className="mt-2 font-title text-sm tracking-[0.4em] text-[#e8b34b] gold-glow">{banner.sub}</div>
      )}
      <div className="mt-3 h-px w-40 bg-gradient-to-r from-transparent via-[#e8b34b]/70 to-transparent" />
    </div>
  );
}

// ── Toasts ───────────────────────────────────────────────────
export function Toasts({ toasts }: { toasts: { id: number; text: string }[] }) {
  return (
    <div className="absolute bottom-6 left-6 z-30 flex flex-col gap-2 pointer-events-none">
      {toasts.map((ts) => (
        <div key={ts.id} className="toast-in px-3 py-1.5 rounded-md border border-white/10 bg-[#070a12]/80 text-xs tracking-wider text-[#aab6cc]">
          {ts.text}
        </div>
      ))}
    </div>
  );
}

// ── Screen flashes (hurt / heal / white) ─────────────────────
export function Flash({ kind, tick }: { kind: 'hurt' | 'heal' | 'white' | null; tick: number }) {
  if (!kind) return null;
  const bg =
    kind === 'hurt' ? 'radial-gradient(ellipse at center, rgba(190,10,30,0.28) 0%, rgba(190,10,30,0.5) 100%)'
    : kind === 'heal' ? 'radial-gradient(ellipse at center, transparent 30%, rgba(255,32,56,0.35) 100%)'
    : 'rgba(255,255,255,0.85)';
  return <div key={tick} className="absolute inset-0 z-50 pointer-events-none screen-flash" style={{ background: bg, animation: 'flashOut 0.6s ease-out both' }} />;
}
