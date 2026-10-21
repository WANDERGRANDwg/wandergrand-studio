// ─────────────────────────────────────────────────────────────
// SDFAKER RIAN — AudioManager (fully generative WebAudio)
// Rain / thunder / birds / leaves / boss drone / all SFX
// ─────────────────────────────────────────────────────────────

export type Ambience = 'menu' | 'village' | 'forest' | 'wild' | 'boss' | 'sun' | 'off';

export class AudioManager {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private amb!: GainNode;
  private sfx!: GainNode;
  private noiseBuf!: AudioBuffer;
  private vol = { master: 0.8, amb: 0.9, sfx: 1.0 };
  private zone: Ambience = 'off';
  private rainGain: GainNode | null = null;
  private rainFilter: BiquadFilterNode | null = null;
  private leafGain: GainNode | null = null;
  private droneGain: GainNode | null = null;
  private birdTimer: number | null = null;
  private thunderTimer: number | null = null;
  onThunderFlash: (() => void) | null = null;

  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    const comp = this.ctx.createDynamicsCompressor();
    this.master.connect(comp); comp.connect(this.ctx.destination);
    this.amb = this.ctx.createGain(); this.amb.connect(this.master);
    this.sfx = this.ctx.createGain(); this.sfx.connect(this.master);
    // 2s white noise buffer
    const len = this.ctx.sampleRate * 2;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.buildRain(); this.buildLeaves(); this.buildDrone();
    this.applyVolumes();
    if (this.zone !== 'off') this.ambience(this.zone, true);
  }

  setVolumes(master: number, amb: number, sfx: number) {
    this.vol = { master, amb, sfx };
    this.applyVolumes();
  }
  private applyVolumes() {
    if (!this.ctx) return;
    this.master.gain.value = this.vol.master;
    this.amb.gain.value = this.vol.amb;
    this.sfx.gain.value = this.vol.sfx;
  }

  private noiseSrc(): AudioBufferSourceNode {
    const s = this.ctx!.createBufferSource();
    s.buffer = this.noiseBuf; s.loop = true;
    return s;
  }

  private buildRain() {
    const ctx = this.ctx!;
    const src = this.noiseSrc();
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 0.55;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5200;
    const g = ctx.createGain(); g.gain.value = 0;
    src.connect(bp); bp.connect(lp); lp.connect(g); g.connect(this.amb);
    src.start();
    this.rainGain = g; this.rainFilter = bp;
  }

  private buildLeaves() {
    const ctx = this.ctx!;
    const src = this.noiseSrc();
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3800;
    const g = ctx.createGain(); g.gain.value = 0;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.23;
    const lfoG = ctx.createGain(); lfoG.gain.value = 0.02;
    lfo.connect(lfoG); lfoG.connect(g.gain);
    src.connect(hp); hp.connect(g); g.connect(this.amb);
    src.start(); lfo.start();
    this.leafGain = g;
  }

  private buildDrone() {
    const ctx = this.ctx!;
    const o1 = ctx.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = 41.2;
    const o2 = ctx.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = 41.8;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 160; lp.Q.value = 8;
    const g = ctx.createGain(); g.gain.value = 0;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.11;
    const lfoG = ctx.createGain(); lfoG.gain.value = 60;
    lfo.connect(lfoG); lfoG.connect(lp.frequency);
    o1.connect(lp); o2.connect(lp); lp.connect(g); g.connect(this.amb);
    o1.start(); o2.start(); lfo.start();
    this.droneGain = g;
  }

  ambience(zone: Ambience, force = false) {
    if (!this.ctx) { this.zone = zone; return; }
    if (zone === this.zone && !force) return;
    this.zone = zone;
    const t = this.ctx.currentTime;
    const set = (g: GainNode | null, v: number, tc = 1.6) => {
      if (!g) return;
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(g.gain.value, t);
      g.gain.linearRampToValueAtTime(v, t + tc);
    };
    const rain = zone === 'sun' ? 0.0 : zone === 'boss' ? 0.10 : zone === 'off' ? 0 : 0.12;
    set(this.rainGain, rain);
    set(this.leafGain, zone === 'forest' ? 0.075 : 0);
    set(this.droneGain, zone === 'boss' ? 0.30 : 0);
    if (this.birdTimer) { window.clearInterval(this.birdTimer); this.birdTimer = null; }
    if (this.thunderTimer) { window.clearTimeout(this.thunderTimer); this.thunderTimer = null; }
    if (zone === 'menu' || zone === 'sun') this.scheduleBirds();
    if (zone === 'village' || zone === 'forest' || zone === 'wild' || zone === 'menu' || zone === 'boss') this.scheduleThunder(zone === 'boss' ? 5200 : 11000);
  }

  private scheduleBirds() {
    this.birdTimer = window.setInterval(() => {
      if (!this.ctx || Math.random() < 0.35) return;
      const n = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) this.chirp(i * (0.12 + Math.random() * 0.1));
    }, 2600);
  }
  private chirp(delay: number) {
    const ctx = this.ctx!; const t = ctx.currentTime + delay;
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = 'sine';
    const f = 2400 + Math.random() * 1600;
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(f * 1.6, t + 0.06);
    o.frequency.exponentialRampToValueAtTime(f * 0.9, t + 0.14);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.05, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    o.connect(g); g.connect(this.amb); o.start(t); o.stop(t + 0.2);
  }

  private scheduleThunder(baseMs: number) {
    const loop = () => {
      this.thunder();
      this.thunderTimer = window.setTimeout(loop, baseMs * (0.7 + Math.random()));
    };
    this.thunderTimer = window.setTimeout(loop, baseMs * (0.5 + Math.random() * 0.8));
  }
  thunder(intensity = 1) {
    if (!this.ctx) return;
    this.onThunderFlash?.();
    const ctx = this.ctx; const t = ctx.currentTime + 0.12;
    const src = this.noiseSrc();
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(420, t);
    lp.frequency.exponentialRampToValueAtTime(60, t + 1.8);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.5 * intensity * this.vol.amb, t + 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
    src.connect(lp); lp.connect(g); g.connect(this.amb);
    src.start(t); src.stop(t + 2.6);
  }

  // ── SFX ──────────────────────────────────────────────
  private env(g: GainNode, t: number, a: number, peak: number, dur: number) {
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  swing() {
    if (!this.ctx) return; const ctx = this.ctx, t = ctx.currentTime;
    const src = this.noiseSrc();
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 2.2;
    bp.frequency.setValueAtTime(600, t);
    bp.frequency.exponentialRampToValueAtTime(3200, t + 0.16);
    const g = ctx.createGain(); this.env(g, t, 0.02, 0.20, 0.22);
    src.connect(bp); bp.connect(g); g.connect(this.sfx); src.start(t); src.stop(t + 0.25);
  }
  hitEnemy() {
    if (!this.ctx) return; const ctx = this.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'square';
    o.frequency.setValueAtTime(210, t); o.frequency.exponentialRampToValueAtTime(60, t + 0.12);
    const g = ctx.createGain(); this.env(g, t, 0.005, 0.22, 0.16);
    o.connect(g); g.connect(this.sfx); o.start(t); o.stop(t + 0.18);
    this.noiseBurst(0.09, 0.16, 900);
  }
  hurt() {
    if (!this.ctx) return; const ctx = this.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.25);
    const g = ctx.createGain(); this.env(g, t, 0.01, 0.3, 0.32);
    o.connect(g); g.connect(this.sfx); o.start(t); o.stop(t + 0.35);
  }
  private noiseBurst(dur: number, vol: number, freq: number, type: BiquadFilterType = 'lowpass') {
    if (!this.ctx) return; const ctx = this.ctx, t = ctx.currentTime;
    const src = this.noiseSrc();
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq;
    const g = ctx.createGain(); this.env(g, t, 0.008, vol, dur);
    src.connect(f); f.connect(g); g.connect(this.sfx); src.start(t); src.stop(t + dur + 0.05);
  }
  jump() { this.noiseBurst(0.14, 0.08, 1200, 'bandpass'); }
  land() { this.noiseBurst(0.1, 0.12, 300); }
  blip() {
    if (!this.ctx) return; const ctx = this.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'triangle';
    o.frequency.setValueAtTime(880 + Math.random() * 220, t);
    const g = ctx.createGain(); this.env(g, t, 0.004, 0.045, 0.05);
    o.connect(g); g.connect(this.sfx); o.start(t); o.stop(t + 0.06);
  }
  uiMove() {
    if (!this.ctx) return; const ctx = this.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 620;
    const g = ctx.createGain(); this.env(g, t, 0.004, 0.05, 0.07);
    o.connect(g); g.connect(this.sfx); o.start(t); o.stop(t + 0.08);
  }
  pickupStone() {
    if (!this.ctx) return; const ctx = this.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(980, t); o.frequency.exponentialRampToValueAtTime(1470, t + 0.09);
    const g = ctx.createGain(); this.env(g, t, 0.005, 0.09, 0.16);
    o.connect(g); g.connect(this.sfx); o.start(t); o.stop(t + 0.18);
  }
  pickupKey() {
    if (!this.ctx) return; const ctx = this.ctx, t = ctx.currentTime;
    [523, 659, 784, 1046].forEach((f, i) => {
      const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f * 1.5;
      const g = ctx.createGain(); const tt = t + i * 0.09;
      this.env(g, tt, 0.01, 0.12, 0.5);
      o.connect(g); g.connect(this.sfx); o.start(tt); o.stop(tt + 0.55);
    });
  }
  pickupHeart() {
    if (!this.ctx) return; const ctx = this.ctx, t = ctx.currentTime;
    [392, 523, 659].forEach((f, i) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const g = ctx.createGain(); const tt = t + i * 0.12;
      this.env(g, tt, 0.02, 0.14, 0.7);
      o.connect(g); g.connect(this.sfx); o.start(tt); o.stop(tt + 0.8);
    });
  }
  heal() {
    if (!this.ctx) return; const ctx = this.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(320, t); o.frequency.exponentialRampToValueAtTime(980, t + 0.5);
    const g = ctx.createGain(); this.env(g, t, 0.06, 0.16, 0.8);
    o.connect(g); g.connect(this.sfx); o.start(t); o.stop(t + 0.9);
    this.noiseBurst(0.5, 0.06, 2400, 'highpass');
  }
  roar() {
    if (!this.ctx) return; const ctx = this.ctx, t = ctx.currentTime;
    const car = ctx.createOscillator(); car.frequency.setValueAtTime(72, t);
    car.frequency.exponentialRampToValueAtTime(38, t + 1.3);
    const mod = ctx.createOscillator(); mod.frequency.setValueAtTime(31, t);
    const mg = ctx.createGain(); mg.gain.value = 40;
    mod.connect(mg); mg.connect(car.frequency);
    const g = ctx.createGain(); this.env(g, t, 0.08, 0.5, 1.6);
    car.connect(g); g.connect(this.sfx);
    car.start(t); car.stop(t + 1.7); mod.start(t); mod.stop(t + 1.7);
    this.noiseBurst(1.2, 0.2, 240);
  }
  lightningStrike() {
    if (!this.ctx) return;
    this.noiseBurst(0.35, 0.5, 2600, 'highpass');
    this.thunder(1.4);
  }
  gateRumble() {
    if (!this.ctx) return; const ctx = this.ctx, t = ctx.currentTime;
    const src = this.noiseSrc();
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 120;
    const g = ctx.createGain(); this.env(g, t, 0.4, 0.5, 2.6);
    src.connect(lp); lp.connect(g); g.connect(this.sfx); src.start(t); src.stop(t + 3);
  }
  explosion() {
    if (!this.ctx) return;
    this.noiseBurst(1.8, 0.6, 900);
    this.noiseBurst(2.4, 0.4, 140);
  }
  victoryMotif() {
    if (!this.ctx) return; const ctx = this.ctx, t = ctx.currentTime;
    const notes = [261.6, 329.6, 392, 523.3, 659.3, 784];
    notes.forEach((f, i) => {
      const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
      const g = ctx.createGain(); const tt = t + i * 0.16;
      this.env(g, tt, 0.04, 0.11, 2.2);
      o.connect(g); g.connect(this.amb); o.start(tt); o.stop(tt + 2.4);
    });
  }
}

export const audio = new AudioManager();
