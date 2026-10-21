// ─────────────────────────────────────────────────────────────
// SDFAKER RIAN — Game orchestrator (the engine room)
// Third-person action RPG · cel-shaded anime island
// ─────────────────────────────────────────────────────────────
import * as THREE from 'three';
import { Storm } from './storm';
import { buildWorld, groundHeight, WorldRefs } from './world';
import { buildKya, animateKya, buildSlache, buildBoss, buildVillager, buildKeyItem, buildStoneItem, buildHeartItem, KyaRefs, SlacheRefs, BossRefs } from './entities';
import { audio } from './audio';
import { clamp, lerp, blobShadow } from './toon';
import { DIALOGUES, DialogueLine, Lang, t } from './i18n';

export type Quality = 'low' | 'med' | 'high';

export interface SaveData {
  v: number;
  hp: number; maxHp: number; stones: number; kills: number;
  keyIds: number[]; heartIds: number[];
  slachKey: boolean; stoneKey: boolean; elderMet: boolean; elder15: boolean;
  gateOpen: boolean; bossDead: boolean;
  x: number; z: number; playSec: number;
}

export function freshSave(): SaveData {
  return { v: 1, hp: 10, maxHp: 10, stones: 0, kills: 0, keyIds: [], heartIds: [], slachKey: false, stoneKey: false, elderMet: false, elder15: false, gateOpen: false, bossDead: false, x: -152, z: -96, playSec: 0 };
}

export interface HudState {
  hp: number; maxHp: number; gauge: number; gaugeCap: number;
  keys: number; stones: number; kills: number;
  slachKey: boolean; stoneKey: boolean; elderMet: boolean;
  objective: 'obj_elder' | 'obj_keys' | 'obj_gate' | 'obj_boss' | 'obj_free';
  bossFrac: number | null;
  zone: string | null;
}

export interface GameHooks {
  onHud(h: HudState): void;
  onDialogue(line: DialogueLine | null): void;
  onPrompt(text: string | null): void;
  onBanner(text: string, sub?: string): void;
  onToast(text: string): void;
  onFlash(kind: 'hurt' | 'heal' | 'white'): void;
  onEscape(): void;
  onGameOver(cause: 'fall' | 'combat'): void;
  onVictory(): void;
  onSave(data: SaveData): void;
}

interface SlacheState {
  refs: SlacheRefs;
  home: { x: number; z: number };
  x: number; z: number; hp: number;
  state: 'idle' | 'chase' | 'windup' | 'dead';
  t: number; cd: number; kx: number; kz: number;
  wanderX: number; wanderZ: number; respawn: number;
  summoned: boolean;
}
interface KeyItem { id: number; g: THREE.Group; taken: boolean; }
interface StoneItem { g: THREE.Group; taken: boolean; timer: number; x: number; z: number; }
interface HeartItem { id: number; g: THREE.Group; taken: boolean; }

const GAUGE_CAP = 4;
const SWORD_DMG = 25;
const BOSS_MAX = 350;

export class Game {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private storm: Storm;
  private world: WorldRefs;
  private kya: KyaRefs;
  private boss: BossRefs;
  private hooks: GameHooks;
  private getLang: () => Lang;
  private getSens: () => number;

  // state
  private save: SaveData;
  private paused = false;
  private dead = false;
  private gauge = 0;
  private keys = 0;
  private raf = 0;
  private last = 0;
  private clock = 0;
  private hudTimer = 0;
  private saveTimer = 0;

  // player kinematics
  private px = 0; private pz = 0; private py = 0;
  private vy = 0; private grounded = true;
  private facing = 0; private speedVis = 0;
  private attackT = -1; private attackCd = 0; private hitDone = true;
  private iframes = 0; private healGlow = 0;
  private healLight: THREE.PointLight;

  // camera
  private camYaw = 2.4; private camPitch = 0.42;
  private camPos = new THREE.Vector3();
  private shake = 0;

  // dialogue
  private dlgId: string | null = null;
  private dlgLines: DialogueLine[] = [];
  private dlgIdx = 0;
  private openGatePending = false;

  // entities
  private slaches: SlacheState[] = [];
  private keyItems: KeyItem[] = [];
  private stoneItems: StoneItem[] = [];
  private heartItems: HeartItem[] = [];
  private npcGroups: { id: string; g: THREE.Group; x: number; z: number }[] = [];

  // boss
  private bossShadow!: THREE.Mesh;
  private bossState: 'dormant' | 'waiting' | 'intro' | 'fighting' | 'dying' | 'dead' = 'dormant';
  private bossHp = BOSS_MAX;
  private bossAtk = 0; private bossKind: 'slam' | 'bolt' | null = null;
  private bossAtkT = 0; private addsDone = false;
  private shockwave: THREE.Mesh;
  private telegraphs: { x: number; z: number; t: number; mesh: THREE.Mesh }[] = [];
  private beams: { mesh: THREE.Mesh; t: number }[] = [];
  private bossY = 0;
  private victoryT = -1;
  private victoryStage = 0;

  // fx
  private fxCount = 320;
  private fxPos: Float32Array; private fxVel: Float32Array; private fxLife: Float32Array;
  private fxGeo = new THREE.BufferGeometry();
  private fxPoints: THREE.Points;

  // input
  private keysDown = new Set<string>();
  private padPrev: boolean[] = [];
  private boundHandlers: { type: string; fn: any }[] = [];

  constructor(private canvas: HTMLCanvasElement, hooks: GameHooks, opts: { getLang: () => Lang; getSens: () => number; quality: Quality; save: SaveData }) {
    this.hooks = hooks;
    this.getLang = opts.getLang;
    this.getSens = opts.getSens;
    this.save = { ...opts.save };
    this.keys = this.save.keyIds.length;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.camera = new THREE.PerspectiveCamera(58, 1, 0.1, 900);
    this.scene.fog = new THREE.FogExp2(0x141a26, 0.0105);

    this.storm = new Storm(this.scene, opts.quality === 'low' ? 380 : opts.quality === 'med' ? 700 : 1000);
    this.applyQuality(opts.quality);
    this.resize();

    this.world = buildWorld(this.scene);
    if (this.save.gateOpen) this.setGateOpen(true);

    // Kya
    this.kya = buildKya();
    this.scene.add(this.kya.group);
    this.px = this.save.x; this.pz = this.save.z;
    this.py = groundHeight(this.px, this.pz);
    this.healLight = new THREE.PointLight(0xff2038, 0, 12, 2);
    this.scene.add(this.healLight);

    // NPCs
    for (const n of this.world.npcs) {
      const g = buildVillager(n.kind);
      g.position.set(n.x, groundHeight(n.x, n.z), n.z);
      g.rotation.y = n.rot;
      this.scene.add(g);
      this.npcGroups.push({ id: n.id, g, x: n.x, z: n.z });
    }

    // items
    for (const ks of this.world.keySpots) {
      if (this.save.keyIds.includes(ks.id)) continue;
      const g = buildKeyItem();
      g.position.set(ks.x, groundHeight(ks.x, ks.z) + 1.1, ks.z);
      this.scene.add(g);
      this.keyItems.push({ id: ks.id, g, taken: false });
    }
    for (const hs of this.world.heartSpots) {
      if (this.save.heartIds.includes(hs.id)) continue;
      const g = buildHeartItem();
      g.position.set(hs.x, groundHeight(hs.x, hs.z) + 1.0, hs.z);
      this.scene.add(g);
      this.heartItems.push({ id: hs.id, g, taken: false });
    }
    for (const ss of this.world.stoneSpots) {
      const g = buildStoneItem();
      g.position.set(ss.x, groundHeight(ss.x, ss.z) + 0.7, ss.z);
      this.scene.add(g);
      this.stoneItems.push({ g, taken: false, timer: 0, x: ss.x, z: ss.z });
    }

    // slaches
    for (const sp of this.world.slacheSpawns) this.spawnSlache(sp.x, sp.z, false);

    // boss
    this.boss = buildBoss();
    this.boss.group.position.set(this.world.arena.x, groundHeight(this.world.arena.x, this.world.arena.z) + 4.6, this.world.arena.z - 8);
    this.scene.add(this.boss.group);
    this.bossShadow = blobShadow(3.2);
    this.scene.add(this.bossShadow);
    this.bossY = this.boss.group.position.y;
    if (this.save.bossDead) { this.bossState = 'dead'; this.boss.group.visible = false; }
    else if (this.save.gateOpen) this.bossState = 'waiting';
    this.boss.group.visible = !this.save.bossDead;
    this.bossShadow.visible = !this.save.bossDead;
    if (this.save.hp <= 0) this.save.hp = Math.max(3, this.save.maxHp - 2);

    // shockwave ring (boss slam)
    this.shockwave = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.3, 6, 40),
      new THREE.MeshBasicMaterial({ color: 0xff8030, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    this.shockwave.rotation.x = Math.PI / 2;
    (this.shockwave as any).userData.noOutline = true;
    this.scene.add(this.shockwave);

    // particle pool
    this.fxPos = new Float32Array(this.fxCount * 3);
    this.fxVel = new Float32Array(this.fxCount * 3);
    this.fxLife = new Float32Array(this.fxCount);
    const fxCol = new Float32Array(this.fxCount * 3);
    this.fxGeo.setAttribute('position', new THREE.BufferAttribute(this.fxPos, 3));
    this.fxGeo.setAttribute('color', new THREE.BufferAttribute(fxCol, 3));
    const fxMat = new THREE.PointsMaterial({ size: 0.22, vertexColors: true, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
    this.fxPoints = new THREE.Points(this.fxGeo, fxMat);
    this.fxPoints.frustumCulled = false;
    (this.fxPoints as any).userData.noOutline = true;
    this.scene.add(this.fxPoints);

    audio.onThunderFlash = () => this.storm.doFlash();
    audio.ambience('village');

    this.bindInput();
    this.pushHud(true);
    this.last = performance.now();
    const loop = (now: number) => {
      this.raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      this.clock += dt;
      if (!this.paused) this.update(dt);
      this.renderer.render(this.scene, this.camera);
    };
    this.raf = requestAnimationFrame(loop);
  }

  // ── public API ──────────────────────────────────────────
  setPaused(b: boolean) { this.paused = b; if (!b) { this.last = performance.now(); audio.unlock(); } }
  setSensitivity() { /* read live via getSens */ }
  applyQuality(q: Quality) {
    const dpr = window.devicePixelRatio || 1;
    this.renderer.setPixelRatio(q === 'low' ? 0.66 : q === 'med' ? 1 : Math.min(dpr, 1.8));
    this.storm.setQuality(q === 'low' ? 380 : q === 'med' ? 700 : 1000);
  }
  getSave(): SaveData {
    this.save.hp = Math.round(this.hp()); this.save.maxHp = this.save.maxHp;
    this.save.x = Math.round(this.px * 10) / 10; this.save.z = Math.round(this.pz * 10) / 10;
    this.save.playSec = Math.round(this.save.playSec);
    return { ...this.save, keyIds: [...this.save.keyIds], heartIds: [...this.save.heartIds] };
  }
  private hp() { return this.save.hp as unknown as number; } // hp stored on save.hp (float)

  nextDialogue() {
    if (!this.dlgId) return;
    this.dlgIdx++;
    if (this.dlgIdx >= this.dlgLines.length) this.endDialogue();
    else this.hooks.onDialogue(this.dlgLines[this.dlgIdx]);
  }

  respawn() {
    this.dead = false;
    this.px = this.world.spawn.x; this.pz = this.world.spawn.z;
    this.py = groundHeight(this.px, this.pz);
    this.vy = 0;
    this.save.hp = Math.max(3, this.save.maxHp - 2);
    this.gauge = 0;
    for (const s of this.slaches) { if (s.state !== 'dead') { s.x = s.home.x; s.z = s.home.z; s.state = 'idle'; } }
    if (this.bossState === 'fighting' || this.bossState === 'intro') {
      this.bossState = 'waiting';
      this.bossHp = BOSS_MAX;
      this.boss.group.position.set(this.world.arena.x, this.bossY, this.world.arena.z - 8);
      for (const tg of this.telegraphs) this.scene.remove(tg.mesh);
      this.telegraphs = [];
      this.slaches = this.slaches.filter((s) => !s.summoned ? true : (this.scene.remove(s.refs.group), false));
      audio.ambience('wild');
    }
    this.camYaw = 2.4;
    this.pushHud(true);
    this.emitSave();
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    for (const h of this.boundHandlers) window.removeEventListener(h.type as any, h.fn);
    document.removeEventListener('pointerlockchange', this.onLockChange);
    audio.ambience('off');
    this.renderer.dispose();
  }

  // ── input ───────────────────────────────────────────────
  private onLockChange = () => { if (!document.pointerLockElement && !this.paused && !this.dlgId && !this.dead) { /* released */ } };
  private bindInput() {
    const kd = (e: KeyboardEvent) => {
      audio.unlock();
      if (e.code === 'Escape') { this.hooks.onEscape(); return; }
      this.keysDown.add(e.code);
      if (this.dlgId || this.dead || this.paused) return;
      if (e.code === 'Space') { e.preventDefault(); this.tryJump(); }
      if (e.code === 'KeyF') this.tryAttack();
      if (e.code === 'KeyR') this.tryHeal();
      if (e.code === 'KeyE') this.tryInteract();
    };
    const ku = (e: KeyboardEvent) => this.keysDown.delete(e.code);
    const md = (e: MouseEvent) => {
      audio.unlock();
      if (this.paused || this.dead || this.dlgId) return;
      if (e.target === this.canvas && !document.pointerLockElement) this.canvas.requestPointerLock();
      if (e.button === 0 && document.pointerLockElement) this.tryAttack();
      if (e.button === 2) this.tryHeal();
    };
    const mm = (e: MouseEvent) => {
      if (!document.pointerLockElement || this.paused || this.dlgId || this.dead) return;
      const s = 0.0021 * this.getSens();
      this.camYaw -= e.movementX * s;
      this.camPitch = clamp(this.camPitch + e.movementY * s, -0.15, 1.15);
    };
    const cm = (e: Event) => e.preventDefault();
    const rs = () => this.resize();
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    window.addEventListener('mousedown', md);
    window.addEventListener('mousemove', mm);
    window.addEventListener('contextmenu', cm);
    window.addEventListener('resize', rs);
    document.addEventListener('pointerlockchange', this.onLockChange);
    this.boundHandlers = [
      { type: 'keydown', fn: kd }, { type: 'keyup', fn: ku }, { type: 'mousedown', fn: md },
      { type: 'mousemove', fn: mm }, { type: 'contextmenu', fn: cm }, { type: 'resize', fn: rs },
    ];
  }

  private resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  // ── actions ─────────────────────────────────────────────
  private tryJump() { if (this.grounded && this.attackT < 0) { this.vy = 8.8; this.grounded = false; audio.jump(); } }
  private tryAttack() {
    if (this.attackT >= 0 || this.attackCd > 0 || !this.grounded) return;
    this.attackT = 0; this.attackCd = 0.5; this.hitDone = false;
    audio.swing();
  }
  private tryHeal() {
    if (this.gauge <= 0 || this.save.hp >= this.save.maxHp) return;
    this.save.hp = Math.min(this.save.maxHp, this.save.hp + this.gauge);
    this.burst(this.px, this.py + 1.2, this.pz, 0xff2038, 26, 3.2);
    this.gauge = 0;
    this.healGlow = 1;
    audio.heal();
    this.hooks.onFlash('heal');
    this.pushHud(true);
  }
  private tryInteract() {
    const it = this.nearestInteract();
    if (!it) return;
    if (it.type === 'npc') { this.openDialogue(this.npcDialogueId(it.id)); return; }
    if (it.type === 'spot') { this.openDialogue(it.dialogue); return; }
    if (it.type === 'gate') {
      if (this.keys >= 15) this.openGateSequence();
      else this.hooks.onToast(t(this.getLang(), 'gate_locked') + ` · ${this.keys}/15`);
    }
  }

  private npcDialogueId(id: string): string {
    if (id === 'elder') {
      if (!this.save.elderMet) return 'elder_first';
      if (this.keys >= 15 && !this.save.elder15) return 'elder_fifteen';
      return 'elder_repeat';
    }
    if (id === 'mira') {
      if (this.save.stoneKey) return 'mira_after';
      if (this.save.stones >= 30) return 'mira_done';
      return this._miraMet ? 'mira_progress' : 'mira';
    }
    return id;
  }
  private _miraMet = false;

  private openDialogue(id: string) {
    if (id === 'mira') this._miraMet = true;
    this.dlgId = id;
    this.dlgLines = DIALOGUES[this.getLang()][id] ?? [];
    this.dlgIdx = 0;
    document.exitPointerLock?.();
    this.hooks.onDialogue(this.dlgLines[0] ?? null);
  }
  private endDialogue() {
    const id = this.dlgId;
    this.dlgId = null;
    this.hooks.onDialogue(null);
    audio.blip();
    const lang = this.getLang();
    if (id === 'elder_first') { this.save.elderMet = true; this.pushHud(true); this.emitSave(); }
    if (id === 'elder_fifteen') { this.save.elder15 = true; this.emitSave(); }
    if (id === 'mira_done') {
      this.save.stones -= 30;
      this.save.stoneKey = true;
      this.grantKey(-1, t(lang, 'got_stone_quest'));
    }
    if (id === 'boss_intro') {
      this.bossState = 'fighting';
      this.bossAtk = 2.2;
      audio.ambience('boss');
      audio.roar();
    }
    if (id === 'victory') {
      this.hooks.onVictory();
    }
    this.pushHud(true);
  }

  private grantKey(id: number, toast?: string) {
    this.keys++;
    if (id >= 0) this.save.keyIds.push(id);
    else this.save.keyIds.push(500 + this.keys); // synthetic ids for quest keys
    audio.pickupKey();
    this.hooks.onBanner(t(this.getLang(), 'got_key'), `${this.keys} / 15`);
    if (toast) this.hooks.onToast(toast);
    this.burst(this.px, this.py + 1.4, this.pz, 0xffc14a, 30, 4);
    this.emitSave();
    this.pushHud(true);
  }

  private setGateOpen(silent = false) {
    this.world.gateBarrier.visible = false;
    this.world.gateLight.intensity = 4;
    this.save.gateOpen = true;
    if (!silent && this.bossState === 'dormant') this.bossState = 'waiting';
  }
  private openGateSequence() {
    this.setGateOpen();
    this.bossState = 'waiting';
    audio.gateRumble();
    this.hooks.onBanner(t(this.getLang(), 'gate_open'));
    const b = this.world.gateBarrier;
    this.burst(this.world.gate.x, groundHeight(this.world.gate.x, this.world.gate.z) + 5, this.world.gate.z, 0xff2038, 60, 8);
    b.visible = false;
    this.shake = Math.max(this.shake, 0.7);
    this.emitSave();
    this.pushHud(true);
  }

  // ── combat ──────────────────────────────────────────────
  private hurt(dmg: number, sx: number, sz: number) {
    if (this.iframes > 0 || this.dead || this.victoryT >= 0 || this.dlgId) return;
    this.save.hp = Math.max(0, this.save.hp - dmg);
    this.iframes = 0.9;
    this.shake = Math.max(this.shake, 0.45);
    audio.hurt();
    this.hooks.onFlash('hurt');
    this.burst(this.px, this.py + 1, this.pz, 0xe0394b, 14, 3);
    const dx = this.px - sx, dz = this.pz - sz;
    const d = Math.hypot(dx, dz) || 1;
    this.px += (dx / d) * 1.1; this.pz += (dz / d) * 1.1;
    this.pushHud(true);
    if (this.save.hp <= 0) { this.dead = true; this.hooks.onGameOver('combat'); audio.ambience('wild'); }
  }

  private applySwordHit() {
    const fx = Math.sin(this.facing), fz = Math.cos(this.facing);
    let hitAny = false;
    for (const s of this.slaches) {
      if (s.state === 'dead') continue;
      const dx = s.x - this.px, dz = s.z - this.pz;
      const d = Math.hypot(dx, dz);
      if (d > 2.7) continue;
      const dot = (dx * fx + dz * fz) / (d || 1);
      if (dot < 0.35) continue;
      s.hp--;
      s.kx = (dx / (d || 1)) * 7; s.kz = (dz / (d || 1)) * 7;
      this.burst(s.x, groundHeight(s.x, s.z) + 0.7, s.z, 0xb040ff, 12, 3);
      audio.hitEnemy();
      hitAny = true;
      if (s.hp <= 0) this.killSlache(s);
    }
    // boss
    if (this.bossState === 'fighting') {
      const bp = this.boss.group.position;
      const dx = bp.x - this.px, dz = bp.z - this.pz;
      const d = Math.hypot(dx, dz);
      if (d < 5.6) {
        const dot = (dx * fx + dz * fz) / (d || 1);
        if (dot > 0.15) {
          this.bossHp = Math.max(0, this.bossHp - SWORD_DMG);
          hitAny = true;
          audio.hitEnemy();
          this.burst(bp.x, this.py + 2, bp.z, 0xb040ff, 18, 5);
          this.boss.group.scale.setScalar(1.06);
          this.pushHud(true);
          if (!this.addsDone && this.bossHp < BOSS_MAX * 0.5) {
            this.addsDone = true;
            this.spawnSlache(this.world.arena.x + 12, this.world.arena.z, true);
            this.spawnSlache(this.world.arena.x - 12, this.world.arena.z, true);
            audio.roar();
          }
          if (this.bossHp <= 0) this.startBossDeath();
        }
      }
    }
    if (hitAny) this.shake = Math.max(this.shake, 0.18);
  }

  private killSlache(s: SlacheState) {
    s.state = 'dead';
    s.respawn = s.summoned ? Infinity : 24;
    this.scene.remove(s.refs.group);
    this.burst(s.x, groundHeight(s.x, s.z) + 0.6, s.z, 0xb040ff, 26, 5);
    this.save.kills++;
    this.gauge = Math.min(GAUGE_CAP, this.gauge + 1);
    // sometimes drops a blue stone
    if (Math.random() < 0.4) {
      const g = buildStoneItem();
      g.position.set(s.x, groundHeight(s.x, s.z) + 0.7, s.z);
      this.scene.add(g);
      this.stoneItems.push({ g, taken: false, timer: 0, x: s.x, z: s.z });
    }
    audio.hitEnemy();
    if (this.save.kills >= 10 && !this.save.slachKey) {
      this.save.slachKey = true;
      this.hooks.onToast(t(this.getLang(), 'slach_quest_done'));
      this.grantKey(-2, undefined);
    }
    this.pushHud(true);
  }

  private spawnSlache(x: number, z: number, summoned: boolean) {
    const refs = buildSlache();
    refs.group.position.set(x, groundHeight(x, z), z);
    this.scene.add(refs.group);
    const s: SlacheState = {
      refs, home: { x, z }, x, z, hp: 3, state: 'idle', t: Math.random() * 9, cd: 0,
      kx: 0, kz: 0, wanderX: x, wanderZ: z, respawn: 0, summoned,
    };
    this.slaches.push(s);
    return s;
  }

  // ── boss ────────────────────────────────────────────────
  private startBossDeath() {
    this.bossState = 'dying';
    this.bossAtkT = 0;
    audio.explosion();
    this.hooks.onFlash('white');
    this.shake = 1.2;
    const bp = this.boss.group.position;
    this.burst(bp.x, bp.y, bp.z, 0xb040ff, 90, 12);
    this.burst(bp.x, bp.y, bp.z, 0xffffff, 60, 9);
    for (const tg of this.telegraphs) this.scene.remove(tg.mesh);
    this.telegraphs = [];
    this.save.bossDead = true;
    this.emitSave();
  }

  private updateBoss(dt: number) {
    const bp = this.boss.group.position;
    const time = this.clock;
    // ground shadow tracks the hovering god
    this.bossShadow.visible = this.boss.group.visible;
    if (this.boss.group.visible) {
      this.bossShadow.position.set(bp.x, groundHeight(bp.x, bp.z) + 0.08, bp.z);
      const h = clamp(1 - (bp.y - groundHeight(bp.x, bp.z)) / 18, 0.3, 1);
      this.bossShadow.scale.setScalar(3.2 * h);
    }
    // idle cosmic motion (always)
    this.boss.ringA.rotation.x = time * 0.7; this.boss.ringA.rotation.y = time * 0.4;
    this.boss.ringB.rotation.y = -time * 0.5; this.boss.ringB.rotation.z = time * 0.3;
    for (let i = 0; i < this.boss.shards.length; i++) {
      const a = time * 0.9 + (i / 8) * Math.PI * 2;
      const sh = this.boss.shards[i];
      sh.position.set(Math.cos(a) * 4.1, Math.sin(time * 1.3 + i) * 1.2, Math.sin(a) * 4.1);
      sh.rotation.x = time * 2 + i; sh.rotation.y = time * 1.4;
    }
    this.boss.cracks.rotation.y = time * 0.22;
    this.boss.group.scale.lerp(new THREE.Vector3(1, 1, 1), dt * 6);
    // eye tracks Kya
    const look = new THREE.Vector3(this.px, this.py + 1.2, this.pz);
    this.boss.eye.lookAt(look);

    if (this.bossState === 'dormant' || this.bossState === 'dead') return;
    if (this.bossState === 'waiting') {
      bp.y = this.bossY + Math.sin(time * 1.4) * 0.4;
      if (this.save.gateOpen && Math.hypot(this.px - this.world.arena.x, this.pz - this.world.arena.z) < 30) {
        this.bossState = 'intro';
        this.hooks.onBanner(t(this.getLang(), 'boss_name'), t(this.getLang(), 'boss_sub'));
        audio.roar();
        this.shake = 0.8;
        window.setTimeout(() => { if (this.bossState === 'intro') this.openDialogue('boss_intro'); }, 1400);
      }
      return;
    }
    if (this.bossState === 'intro') return;
    if (this.bossState === 'dying') {
      this.bossAtkT += dt;
      const p = this.bossAtkT / 2.6;
      this.boss.group.scale.setScalar(Math.max(0.001, 1 - p));
      this.boss.group.rotation.y += dt * (4 + p * 22);
      bp.y = this.bossY + p * 6;
      if (Math.random() < 0.3) this.burst(bp.x + (Math.random() - 0.5) * 4, bp.y + (Math.random() - 0.5) * 4, bp.z + (Math.random() - 0.5) * 4, Math.random() < 0.5 ? 0xb040ff : 0xffffff, 6, 6);
      if (p >= 1) {
        this.bossState = 'dead';
        this.boss.group.visible = false;
        this.startVictory();
      }
      return;
    }
    // fighting
    const arena = this.world.arena;
    // drift toward player, keep distance
    const dx = this.px - bp.x, dz = this.pz - bp.z;
    const d = Math.hypot(dx, dz);
    const want = 6.5;
    if (d > want) { bp.x += (dx / d) * 1.6 * dt; bp.z += (dz / d) * 1.6 * dt; }
    bp.y = groundHeight(bp.x, bp.z) + 4.6 + Math.sin(time * 1.6) * 0.5;
    // lock player inside the arena
    const pd = Math.hypot(this.px - arena.x, this.pz - arena.z);
    if (pd > 36) { const k = 36 / pd; this.px = arena.x + (this.px - arena.x) * k; this.pz = arena.z + (this.pz - arena.z) * k; }

    this.bossAtk -= dt;
    if (this.bossAtk <= 0 && !this.bossKind) {
      this.bossKind = d < 8.5 ? 'slam' : 'bolt';
      this.bossAtkT = 0;
      if (this.bossKind === 'bolt') {
        const n = this.bossHp < BOSS_MAX * 0.5 ? 4 : 3;
        for (let i = 0; i < n; i++) {
          const tx = i === 0 ? this.px : this.px + (Math.random() - 0.5) * 12;
          const tz = i === 0 ? this.pz : this.pz + (Math.random() - 0.5) * 12;
          const mesh = new THREE.Mesh(
            new THREE.RingGeometry(0.4, 2.1, 20),
            new THREE.MeshBasicMaterial({ color: 0xff2038, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false })
          );
          (mesh as any).userData.noOutline = true;
          mesh.rotation.x = -Math.PI / 2;
          mesh.position.set(tx, groundHeight(tx, tz) + 0.1, tz);
          this.scene.add(mesh);
          this.telegraphs.push({ x: tx, z: tz, t: 0, mesh });
        }
      }
    }
    if (this.bossKind) {
      this.bossAtkT += dt;
      if (this.bossKind === 'slam') {
        // telegraph: rise + glow
        const rage = Math.min(1, this.bossAtkT / 0.7);
        this.boss.glow.intensity = 60 + rage * 90;
        bp.y += rage * dt * 6;
        if (this.bossAtkT >= 0.7) {
          // impact
          this.boss.glow.intensity = 60;
          this.shake = Math.max(this.shake, 0.8);
          audio.land(); audio.thunder(0.8);
          (this.shockwave.material as THREE.MeshBasicMaterial).opacity = 0.85;
          this.shockwave.position.set(bp.x, groundHeight(bp.x, bp.z) + 0.4, bp.z);
          this.shockwave.scale.setScalar(1);
          (this.shockwave as any).userData.active = true;
          if (d < 7.2 && this.grounded) this.hurt(2, bp.x, bp.z);
          this.bossKind = null;
          this.bossAtk = 2.4 + Math.random() * 1.2;
        }
      } else {
        // bolt phase: telegraphs tick, strike at 0.95s
        let allDone = true;
        for (const tg of this.telegraphs) {
          tg.t += dt;
          (tg.mesh.material as THREE.MeshBasicMaterial).opacity = 0.3 + Math.abs(Math.sin(tg.t * 12)) * 0.45;
          if (tg.t < 0.95) allDone = false;
          else if ((tg as any).struck !== true) {
            (tg as any).struck = true;
            this.strikeBolt(tg.x, tg.z);
          }
        }
        if (allDone) {
          for (const tg of this.telegraphs) this.scene.remove(tg.mesh);
          this.telegraphs = [];
          this.bossKind = null;
          this.bossAtk = 2.6 + Math.random() * 1.4;
        }
      }
    }
  }

  private strikeBolt(x: number, z: number) {
    const y = groundHeight(x, z);
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 1.1, 60, 6, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xd8e6ff, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    );
    (beam as any).userData.noOutline = true;
    beam.position.set(x, y + 28, z);
    this.scene.add(beam);
    this.beams.push({ mesh: beam, t: 0 });
    this.burst(x, y + 0.5, z, 0xcfe0ff, 22, 7);
    audio.lightningStrike();
    this.storm.doFlash();
    this.shake = Math.max(this.shake, 0.4);
    if (Math.hypot(this.px - x, this.pz - z) < 2.3) this.hurt(4, x, z);
  }

  private startVictory() {
    this.victoryT = 0;
    audio.victoryMotif();
    this.pushHud(true);
    this.emitSave();
  }

  // ── particles ───────────────────────────────────────────
  private burst(x: number, y: number, z: number, color: number, n: number, speed: number) {
    const colAttr = this.fxGeo.getAttribute('color') as THREE.BufferAttribute;
    const c = new THREE.Color(color);
    let placed = 0;
    for (let i = 0; i < this.fxCount && placed < n; i++) {
      if (this.fxLife[i] > 0) continue;
      this.fxLife[i] = 0.5 + Math.random() * 0.6;
      this.fxPos[i * 3] = x; this.fxPos[i * 3 + 1] = y; this.fxPos[i * 3 + 2] = z;
      const a = Math.random() * Math.PI * 2, up = Math.random() * speed * 0.9;
      this.fxVel[i * 3] = Math.cos(a) * speed * (0.3 + Math.random() * 0.7);
      this.fxVel[i * 3 + 1] = up;
      this.fxVel[i * 3 + 2] = Math.sin(a) * speed * (0.3 + Math.random() * 0.7);
      colAttr.setXYZ(i, c.r, c.g, c.b);
      placed++;
    }
    colAttr.needsUpdate = true;
  }
  private updateFx(dt: number) {
    const posAttr = this.fxGeo.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < this.fxCount; i++) {
      if (this.fxLife[i] <= 0) { continue; }
      this.fxLife[i] -= dt;
      this.fxVel[i * 3 + 1] -= 9 * dt;
      this.fxPos[i * 3] += this.fxVel[i * 3] * dt;
      this.fxPos[i * 3 + 1] = Math.max(-50, this.fxPos[i * 3 + 1] + this.fxVel[i * 3 + 1] * dt);
      this.fxPos[i * 3 + 2] += this.fxVel[i * 3 + 2] * dt;
      if (this.fxLife[i] <= 0) this.fxPos[i * 3 + 1] = -100;
    }
    posAttr.needsUpdate = true;
  }

  // ── interaction scan ────────────────────────────────────
  private nearestInteract():
    | { type: 'npc'; id: string }
    | { type: 'spot'; dialogue: string }
    | { type: 'gate' }
    | null {
    let best: any = null; let bestD = 1e9;
    for (const n of this.npcGroups) {
      const d = Math.hypot(n.x - this.px, n.z - this.pz);
      if (d < 3.4 && d < bestD) { bestD = d; best = { type: 'npc', id: n.id }; }
    }
    for (const it of this.world.interactables) {
      const d = Math.hypot(it.x - this.px, it.z - this.pz);
      if (d < 3.2 && d < bestD) { bestD = d; best = { type: 'spot', dialogue: it.dialogue }; }
    }
    if (!this.save.gateOpen) {
      const d = Math.hypot(this.world.gate.x - this.px, this.world.gate.z - this.pz);
      if (d < 6.5 && d < bestD) { bestD = d; best = { type: 'gate' }; }
    }
    return best;
  }

  // ── per-frame ───────────────────────────────────────────
  private update(dt: number) {
    const lang = this.getLang();
    this.save.playSec += dt;
    const time = this.clock;

    // victory sequence timing
    if (this.victoryT >= 0) {
      this.victoryT += dt;
      this.storm.clear = Math.min(1, this.victoryT / 7);
      this.storm.setIntensity(Math.max(0, 1 - this.victoryT / 4.5));
      if (this.victoryT > 1.2 && this.victoryStage < 1) { this.victoryStage = 1; this.hooks.onBanner(t(lang, 'rain_stop')); }
      if (this.victoryT > 4.5 && this.victoryStage < 2) { this.victoryStage = 2; this.hooks.onBanner(t(lang, 'sun_rise')); audio.ambience('sun'); }
      if (this.victoryT > 6.5 && this.victoryStage < 3 && !this.dlgId) { this.victoryStage = 3; this.openDialogue('victory'); }
    }

    // ── movement ──
    let mx = 0, mz = 0;
    if (!this.dlgId && !this.dead) {
      if (this.keysDown.has('KeyW') || this.keysDown.has('ArrowUp')) mz += 1;
      if (this.keysDown.has('KeyS') || this.keysDown.has('ArrowDown')) mz -= 1;
      if (this.keysDown.has('KeyA') || this.keysDown.has('ArrowLeft')) mx -= 1;
      if (this.keysDown.has('KeyD') || this.keysDown.has('ArrowRight')) mx += 1;
    }
    // gamepad
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    let pad = null as Gamepad | null;
    for (const p of pads) if (p && p.connected) { pad = p; break; }
    let sprint = this.keysDown.has('ShiftLeft') || this.keysDown.has('ShiftRight');
    if (pad) {
      const dz0 = (v: number) => Math.abs(v) > 0.18 ? v : 0;
      mx += dz0(pad.axes[0] ?? 0);
      mz -= dz0(pad.axes[1] ?? 0);
      this.camYaw -= dz0(pad.axes[2] ?? 0) * dt * 2.4 * this.getSens();
      this.camPitch = clamp(this.camPitch + dz0(pad.axes[3] ?? 0) * dt * 1.8 * this.getSens(), -0.15, 1.15);
      const btn = (i: number) => pad!.buttons[i]?.pressed ?? false;
      const edge = (i: number) => { const b = btn(i); const e = b && !this.padPrev[i]; this.padPrev[i] = b; return e; };
      if (!this.dlgId && !this.dead && !this.paused) {
        if (edge(0)) this.tryJump();
        if (edge(2)) this.tryAttack();
        if (edge(1)) this.tryHeal();
        if (edge(3)) this.tryInteract();
      }
      if (edge(9)) this.hooks.onEscape();
      if (btn(7)) sprint = true;
    }
    const mLen = Math.hypot(mx, mz);
    if (mLen > 1) { mx /= mLen; mz /= mLen; }
    const attacking = this.attackT >= 0;
    const speed = (attacking ? 1.6 : sprint ? 8.4 : 5.2);
    // camera-relative
    const sy = Math.sin(this.camYaw), cy = Math.cos(this.camYaw);
    const wx = (mx * cy - mz * sy) * speed;
    const wz = (-mx * sy - mz * cy) * speed;
    this.px += wx * dt; this.pz += wz * dt;
    this.speedVis = lerp(this.speedVis, mLen > 0.05 ? (sprint ? 1 : 0.6) : 0, dt * 8);
    if (mLen > 0.05) {
      const targetFacing = Math.atan2(wx, wz);
      let df = targetFacing - this.facing;
      while (df > Math.PI) df -= Math.PI * 2;
      while (df < -Math.PI) df += Math.PI * 2;
      this.facing += df * Math.min(1, dt * 12);
    }

    // gravity + ground
    const gh = groundHeight(this.px, this.pz);
    if (!this.grounded) {
      this.vy -= 24 * dt;
      this.py += this.vy * dt;
      if (this.py <= gh) { this.py = gh; this.grounded = true; if (this.vy < -9) audio.land(); this.vy = 0; }
    } else {
      this.py = lerp(this.py, gh, Math.min(1, dt * 18));
      if (gh - this.py > 0.9) { this.grounded = false; this.vy = 0; }
    }
    // island bounds
    const rr = Math.hypot(this.px, this.pz);
    if (rr > 214) { const k = 214 / rr; this.px *= k; this.pz *= k; }
    // colliders
    const pushOut = (c: { x: number; z: number; r: number }) => {
      const dx = this.px - c.x, dz = this.pz - c.z;
      const d = Math.hypot(dx, dz);
      const min = c.r + 0.4;
      if (d < min && d > 0.0001) { this.px = c.x + (dx / d) * min; this.pz = c.z + (dz / d) * min; }
    };
    for (const c of this.world.colliders) {
      if (Math.abs(c.x - this.px) > 6 || Math.abs(c.z - this.pz) > 6) continue;
      pushOut(c);
    }
    if (!this.save.gateOpen) for (const c of this.world.gateBlockers) pushOut(c);
    // death pits
    if (this.grounded && !this.dead) {
      for (const h of this.world.holes) {
        if (Math.hypot(h.x - this.px, h.z - this.pz) < h.r * 0.8) {
          this.dead = true;
          audio.hurt();
          this.hooks.onGameOver('fall');
          break;
        }
      }
    }

    // attack timing
    this.attackCd = Math.max(0, this.attackCd - dt);
    if (this.attackT >= 0) {
      this.attackT += dt / 0.44;
      if (this.attackT >= 0.5 && !this.hitDone) { this.hitDone = true; this.applySwordHit(); }
      if (this.attackT >= 1) this.attackT = -1;
    }
    this.iframes = Math.max(0, this.iframes - dt);
    this.healGlow = Math.max(0, this.healGlow - dt * 1.4);

    // Kya visuals
    this.kya.group.position.set(this.px, this.py, this.pz);
    this.kya.group.rotation.y = this.facing;
    animateKya(this.kya, { t: time, speed: this.speedVis, attackT: this.attackT, grounded: this.grounded, vy: this.vy });
    const blink = this.iframes > 0 && Math.floor(time * 14) % 2 === 0;
    this.kya.group.visible = !blink;
    this.healLight.position.set(this.px, this.py + 1.4, this.pz);
    this.healLight.intensity = this.healGlow * 60;

    // ── slaches ──
    for (const s of this.slaches) {
      if (s.state === 'dead') {
        if (s.respawn !== Infinity) {
          s.respawn -= dt;
          if (s.respawn <= 0 && Math.hypot(s.home.x - this.px, s.home.z - this.pz) > 40) {
            s.state = 'idle'; s.hp = 3; s.x = s.home.x; s.z = s.home.z;
            this.scene.add(s.refs.group);
          }
        }
        continue;
      }
      s.t += dt; s.cd = Math.max(0, s.cd - dt);
      const dx = this.px - s.x, dz = this.pz - s.z;
      const d = Math.hypot(dx, dz);
      const villa = Math.hypot(this.px + 152, this.pz + 92) < 46;
      let mvx = 0, mvz = 0;
      if ((s.state === 'idle' && d < 12 && !villa && !this.dead && !this.dlgId) || (s.summoned && !this.dead && !this.dlgId)) s.state = 'chase';
      if (s.state === 'chase') {
        if (d > 26 || this.dead) s.state = 'idle';
        else if (d > 1.9) { mvx = (dx / d) * 3.5; mvz = (dz / d) * 3.5; }
        else if (s.cd <= 0) { s.state = 'windup'; s.t = 0; }
      } else if (s.state === 'windup') {
        if (s.t > 0.5) {
          s.state = 'chase'; s.cd = 1.7;
          if (d < 2.5) this.hurt(1, s.x, s.z);
        }
      } else {
        // wander
        if (Math.hypot(s.wanderX - s.x, s.wanderZ - s.z) < 1.2) {
          s.wanderX = s.home.x + (Math.random() - 0.5) * 14;
          s.wanderZ = s.home.z + (Math.random() - 0.5) * 14;
        }
        const wdx = s.wanderX - s.x, wdz = s.wanderZ - s.z;
        const wd = Math.hypot(wdx, wdz) || 1;
        mvx = (wdx / wd) * 1.2; mvz = (wdz / wd) * 1.2;
      }
      // knockback decay
      mvx += s.kx; mvz += s.kz;
      s.kx = lerp(s.kx, 0, Math.min(1, dt * 7)); s.kz = lerp(s.kz, 0, Math.min(1, dt * 7));
      s.x += mvx * dt; s.z += mvz * dt;
      // enemy vs colliders (light)
      for (const c of this.world.colliders) {
        if (Math.abs(c.x - s.x) > 4 || Math.abs(c.z - s.z) > 4) continue;
        const cdx = s.x - c.x, cdz = s.z - c.z;
        const cd = Math.hypot(cdx, cdz), min = c.r + 0.5;
        if (cd < min && cd > 0.001) { s.x = c.x + (cdx / cd) * min; s.z = c.z + (cdz / cd) * min; }
      }
      const gy = groundHeight(s.x, s.z);
      s.refs.group.position.set(s.x, gy + Math.sin(s.t * 6) * 0.08 + 0.05, s.z);
      s.refs.group.rotation.y = Math.atan2(dx, dz);
      const pulse = s.state === 'windup' ? 1.25 + Math.sin(s.t * 30) * 0.08 : 1 + Math.sin(s.t * 5) * 0.04;
      s.refs.body.scale.setScalar(pulse);
      s.refs.group.rotation.z = s.state === 'chase' ? Math.sin(s.t * 10) * 0.12 : 0;
    }
    // separation (cheap)
    for (let i = 0; i < this.slaches.length; i++) {
      const a = this.slaches[i];
      if (a.state === 'dead') continue;
      for (let j = i + 1; j < this.slaches.length; j++) {
        const b = this.slaches[j];
        if (b.state === 'dead') continue;
        const dx = b.x - a.x, dz = b.z - a.z;
        const d = Math.hypot(dx, dz);
        if (d < 1.3 && d > 0.001) {
          const push = (1.3 - d) * 0.5;
          a.x -= (dx / d) * push; a.z -= (dz / d) * push;
          b.x += (dx / d) * push; b.z += (dz / d) * push;
        }
      }
    }

    // ── items ──
    for (const k of this.keyItems) {
      if (k.taken) continue;
      k.g.rotation.y = time * 1.6;
      k.g.position.y = groundHeight(k.g.position.x, k.g.position.z) + 1.15 + Math.sin(time * 2.2 + k.id) * 0.15;
      if (!this.dlgId && Math.hypot(k.g.position.x - this.px, k.g.position.z - this.pz) < 1.7) {
        k.taken = true;
        this.scene.remove(k.g);
        this.grantKey(k.id);
      }
    }
    for (const h of this.heartItems) {
      if (h.taken) continue;
      h.g.rotation.y = -time * 1.4;
      h.g.position.y = groundHeight(h.g.position.x, h.g.position.z) + 1.05 + Math.sin(time * 2.6 + h.id) * 0.18;
      if (!this.dlgId && Math.hypot(h.g.position.x - this.px, h.g.position.z - this.pz) < 1.7) {
        h.taken = true;
        this.scene.remove(h.g);
        this.save.heartIds.push(h.id);
        this.save.maxHp = Math.min(15, this.save.maxHp + 1);
        this.save.hp = Math.min(this.save.maxHp, this.save.hp + 2);
        audio.pickupHeart();
        this.hooks.onBanner(t(lang, 'got_heart'), `${this.save.maxHp}`);
        this.emitSave();
        this.pushHud(true);
      }
    }
    for (const st of this.stoneItems) {
      if (st.taken) {
        st.timer -= dt;
        if (st.timer <= 0) {
          st.taken = false;
          st.g.visible = true;
        }
        continue;
      }
      st.g.rotation.y = time * 2.2;
      st.g.position.y = groundHeight(st.x, st.z) + 0.7 + Math.sin(time * 3 + st.x) * 0.1;
      if (!this.dlgId && !this.save.stoneKey && Math.hypot(st.x - this.px, st.z - this.pz) < 1.5) {
        st.taken = true; st.timer = 40;
        st.g.visible = false;
        this.save.stones++;
        audio.pickupStone();
        this.burst(st.x, groundHeight(st.x, st.z) + 0.7, st.z, 0x53c8ff, 8, 2);
        this.pushHud(true);
        this.emitSave();
      }
    }

    // ── boss & fx ──
    this.updateBoss(dt);
    this.updateFx(dt);
    // shockwave expand
    if ((this.shockwave as any).userData.active) {
      this.shockwave.scale.multiplyScalar(1 + dt * 12);
      const m = this.shockwave.material as THREE.MeshBasicMaterial;
      m.opacity -= dt * 2.2;
      if (m.opacity <= 0) (this.shockwave as any).userData.active = false;
    }
    // bolt beams fade
    for (let i = this.beams.length - 1; i >= 0; i--) {
      const b = this.beams[i];
      b.t += dt;
      (b.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.95 - b.t * 3);
      if (b.t > 0.4) { this.scene.remove(b.mesh); this.beams.splice(i, 1); }
    }

    // ── zones + ambience ──
    this.zoneTimer -= dt;
    if (this.zoneTimer <= 0) {
      this.zoneTimer = 0.5;
      this.detectZone();
    }

    // gate pulse
    if (!this.save.gateOpen) {
      (this.world.gateBarrier.material as THREE.MeshBasicMaterial).opacity = 0.26 + Math.abs(Math.sin(time * 1.8)) * 0.16;
      this.world.gateLight.intensity = 34 + Math.sin(time * 2.4) * 10;
    }

    // interaction prompt
    const it = (!this.dlgId && !this.dead) ? this.nearestInteract() : null;
    let prompt: string | null = null;
    if (it) {
      if (it.type === 'npc') prompt = `[E] ${t(lang, 'talk')}`;
      else if (it.type === 'gate') prompt = this.keys >= 15 ? `[E] ${t(lang, 'open_gate')}` : `[E] ${t(lang, 'gate_locked')} · ${this.keys}/15`;
      else prompt = `[E] ${t(lang, it.type === 'spot' && it.dialogue === 'monolith' ? 'entity_touch' : 'read')}`;
    }
    if (prompt !== this.lastPrompt) { this.lastPrompt = prompt; this.hooks.onPrompt(prompt); }

    // ── camera ──
    const cd = 6.8;
    const cy2 = Math.cos(this.camPitch), sy2 = Math.sin(this.camPitch);
    const cx = this.px - Math.sin(this.camYaw) * cd * cy2;
    const cz = this.pz - Math.cos(this.camYaw) * cd * cy2;
    let cyy = this.py + 1.7 + sy2 * cd;
    const cgh = groundHeight(cx, cz) + 0.7;
    if (cyy < cgh) cyy = cgh;
    this.shake = Math.max(0, this.shake - dt * 1.8);
    const shx = (Math.random() - 0.5) * this.shake * 0.5;
    const shy = (Math.random() - 0.5) * this.shake * 0.5;
    this.camPos.lerp(new THREE.Vector3(cx + shx, cyy + shy, cz), Math.min(1, dt * 9));
    if (this.paused === false && this.camPos.lengthSq() < 1) this.camPos.set(cx, cyy, cz);
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.px + shx * 0.4, this.py + 1.55 + shy * 0.4, this.pz);

    // storm
    if (this.victoryT < 0) this.storm.setIntensity(1);
    this.storm.update(dt, time, this.camera.position, this.scene.fog as THREE.FogExp2);

    // hud + autosave
    this.hudTimer -= dt;
    if (this.hudTimer <= 0) { this.hudTimer = 0.12; this.pushHud(); }
    this.saveTimer -= dt;
    if (this.saveTimer <= 0) { this.saveTimer = 12; this.emitSave(); }
  }

  private lastPrompt: string | null = null;
  private zoneTimer = 0;
  private lastZone = '';

  private detectZone() {
    if (this.victoryT >= 0) return;
    const lang = this.getLang();
    let zone = 'wild';
    if (Math.hypot(this.px + 152, this.pz + 92) < 48) zone = 'village';
    else if (Math.hypot(this.px - this.world.arena.x, this.pz - this.world.arena.z) < 46) zone = 'arena';
    else if (Math.abs(this.px) < 46 && this.pz > 130 && this.pz < 178) zone = 'gate';
    else if (this.px > 50 && this.pz > -75 && this.pz < 110) zone = 'forest';
    if (zone !== this.lastZone) {
      this.lastZone = zone;
      if (zone !== 'wild') {
        const key = zone === 'village' ? 'zone_village' : zone === 'forest' ? 'zone_forest' : zone === 'gate' ? 'zone_gate' : 'zone_arena';
        this.hooks.onBanner(t(lang, key as any));
        if (zone === 'gate') audio.thunder(0.7);
      }
      if (this.bossState !== 'fighting') {
        audio.ambience(zone === 'village' ? 'village' : zone === 'forest' ? 'forest' : 'wild');
      }
      this.pushHud(true);
    }
  }

  private pushHud(force = false) {
    const lang = this.getLang();
    let objective: HudState['objective'] = 'obj_elder';
    if (this.save.bossDead) objective = 'obj_free';
    else if (this.bossState === 'fighting' || (this.save.gateOpen && Math.hypot(this.px - this.world.arena.x, this.pz - this.world.arena.z) < 60)) objective = 'obj_boss';
    else if (this.save.gateOpen) objective = 'obj_boss';
    else if (this.keys >= 15) objective = 'obj_gate';
    else if (this.save.elderMet) objective = 'obj_keys';
    this.hooks.onHud({
      hp: this.save.hp, maxHp: this.save.maxHp,
      gauge: this.gauge, gaugeCap: GAUGE_CAP,
      keys: this.keys, stones: this.save.stones, kills: this.save.kills,
      slachKey: this.save.slachKey, stoneKey: this.save.stoneKey, elderMet: this.save.elderMet,
      objective,
      bossFrac: this.bossState === 'fighting' || this.bossState === 'dying' ? this.bossHp / BOSS_MAX : null,
      zone: this.lastZone,
    });
  }

  private emitSave() { this.hooks.onSave(this.getSave()); }
}
