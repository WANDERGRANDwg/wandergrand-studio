export type HudSnapshot = {
  health: number;
  essence: number;
  keys: number;
  keysGoal: number;
  kills: number;
  stones: number;
};

export type DemoCallbacks = {
  onHud: (hud: HudSnapshot) => void;
  onToast: (message: string) => void;
  onEnd: (result: "victory" | "dead") => void;
};

type Vec = { x: number; y: number };
type Enemy = {
  id: number;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  hp: number;
  maxHp: number;
  cd: number;
  flash: number;
  phase: number;
  speed: number;
};
type Stone = { x: number; y: number; phase: number };
type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  gravity: number;
};
type Tree = { x: number; y: number; s: number; kind: number };
type Rock = { x: number; y: number; s: number };
type Tuft = { x: number; y: number; s: number; tilt: number };
type Lantern = { x: number; y: number; hue: "warm" | "cyan" };

const WORLD = { w: 2000, h: 1420 };
const START = { x: 1000, y: 1140 };
const TAU = Math.PI * 2;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const angleDiff = (a: number, b: number) => {
  let d = a - b;
  while (d > Math.PI) d -= TAU;
  while (d < -Math.PI) d += TAU;
  return Math.abs(d);
};
const pathX = (y: number) => 1000 + Math.sin(y / 190) * 74 + Math.sin(y / 64) * 15;

function seeded(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class DemoEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private callbacks: DemoCallbacks;

  running = false;
  private raf = 0;
  private last = 0;
  private time = 0;
  private hudClock = 0;

  private width = 1;
  private height = 1;
  private dpr = 1;
  private scale = 1;
  private cam: Vec = { x: START.x, y: START.y };
  private shake = 0;
  private lightning = 0;
  private nextLightning = 6;

  private player = {
    x: START.x,
    y: START.y,
    face: -Math.PI / 2,
    hp: 10,
    essence: 35,
    keys: 0,
    kills: 0,
    stones: 0,
    attack: 0,
    attackCd: 0,
    dash: 0,
    dashCd: 0,
    dashX: 0,
    dashY: 0,
    invuln: 0,
    flash: 0,
    healFx: 0,
    moveX: 0,
    moveY: 0,
    walking: 0,
  };

  private enemies: Enemy[] = [];
  private particles: Particle[] = [];
  private stones: Stone[] = [];
  private trees: Tree[] = [];
  private rocks: Rock[] = [];
  private tufts: Tuft[] = [];
  private lanterns: Lantern[] = [];
  private puddles: { x: number; y: number; rx: number; ry: number }[] = [];
  private grassPatches: { x: number; y: number; r: number }[] = [];
  private rain: { x: number; y: number; len: number; speed: number; a: number }[] = [];

  private keysDown = new Set<string>();
  private touch = { up: false, down: false, left: false, right: false };
  private pointer = { x: 0, y: 0, active: false };
  private spawnTimer = 1.2;
  private enemyId = 0;
  private toastClock = 0;

  constructor(canvas: HTMLCanvasElement, callbacks: DemoCallbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D unavailable");
    this.ctx = ctx;
    this.buildWorld();
    this.resetPlayer();
    this.bind();
    this.resize();
    this.emitHud();
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  /* ---------------- lifecycle ---------------- */

  private bind() {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);
    this.canvas.addEventListener("pointerdown", this.onPointerDown);
    this.canvas.addEventListener("pointermove", this.onPointerMove);
    this.canvas.addEventListener("contextmenu", this.onContextMenu);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.onBlur);
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.canvas.removeEventListener("pointermove", this.onPointerMove);
    this.canvas.removeEventListener("contextmenu", this.onContextMenu);
  }

  reset() {
    this.buildWorld();
    this.resetPlayer();
    this.enemies = [];
    this.particles = [];
    this.stones = [];
    this.spawnTimer = 1;
    this.seedStones();
    this.running = true;
    this.last = performance.now();
    this.emitHud();
    this.toast("Trois clés suffisent. La pluie fera le reste.");
  }

  pause() {
    this.running = false;
    this.keysDown.clear();
  }

  resume() {
    this.running = true;
    this.last = performance.now();
  }

  respawn() {
    this.player.x = START.x;
    this.player.y = START.y;
    this.player.hp = 8;
    this.player.invuln = 2;
    this.player.attack = 0;
    this.player.dash = 0;
    this.player.healFx = 0;
    this.enemies = [];
    this.spawnTimer = 2.4;
    this.running = true;
    this.last = performance.now();
    this.emitHud();
    this.toast("Vous vous réveillez à Brumepierre. Deux barres perdues, aucune clé rendue.");
  }

  setTouchDir(dir: "up" | "down" | "left" | "right", active: boolean) {
    this.touch[dir] = active;
  }

  attack() {
    const p = this.player;
    if (!this.running || p.attackCd > 0) return;
    p.attack = 0.23;
    p.attackCd = 0.4;
    this.shake = Math.max(this.shake, 3);
    let hits = 0;
    for (const enemy of this.enemies) {
      const d = Math.hypot(enemy.x - p.x, enemy.y - p.y);
      const angle = Math.atan2(enemy.y - p.y, enemy.x - p.x);
      if (d < 92 && angleDiff(angle, p.face) < 1.25) {
        enemy.hp -= 2;
        enemy.flash = 0.18;
        enemy.x += Math.cos(angle) * 18;
        enemy.y += Math.sin(angle) * 18;
        hits += 1;
        this.burst(enemy.x, enemy.y - 8, "#ffd7c6", 7, 120);
      }
    }
    const swordX = p.x + Math.cos(p.face) * 52;
    const swordY = p.y + Math.sin(p.face) * 52 - 8;
    this.burst(swordX, swordY, hits ? "#ffd7c6" : "#9fd8d3", hits ? 10 : 4, 80);
    if (hits) this.shake = 6;
  }

  heal() {
    const p = this.player;
    if (!this.running) return;
    if (p.essence < 40) {
      this.guardToast("L'essence rouge est trop faible.");
      return;
    }
    if (p.hp >= 10) {
      this.guardToast("Kya est déjà à plein de vie.");
      return;
    }
    p.hp = Math.min(10, p.hp + 2);
    p.essence -= 40;
    p.healFx = 1.2;
    for (let i = 0; i < 26; i += 1) {
      const a = (i / 26) * TAU;
      this.particles.push({
        x: p.x + Math.cos(a) * (12 + Math.random() * 18),
        y: p.y + Math.sin(a) * 10,
        vx: Math.cos(a) * 24,
        vy: -30 - Math.random() * 40,
        life: 0.9,
        max: 0.9,
        size: 1.5 + Math.random() * 2,
        color: i % 3 === 0 ? "#ffd1a8" : "#e0554d",
        gravity: -12,
      });
    }
    this.emitHud();
    this.toast("L'éclat rouge referme deux barres.");
  }

  dash() {
    const p = this.player;
    if (!this.running || p.dashCd > 0) return;
    const input = this.readInput();
    const len = Math.hypot(input.x, input.y) || 1;
    p.dashX = len > 1 ? input.x / len : Math.cos(p.face);
    p.dashY = len > 1 ? input.y / len : Math.sin(p.face);
    p.dash = 0.17;
    p.dashCd = 1.05;
    p.invuln = Math.max(p.invuln, 0.3);
    for (let i = 0; i < 12; i += 1) {
      this.particles.push({
        x: p.x + (Math.random() - 0.5) * 18,
        y: p.y - Math.random() * 18,
        vx: -p.dashX * 60 + (Math.random() - 0.5) * 40,
        vy: -p.dashY * 60 + (Math.random() - 0.5) * 40,
        life: 0.4,
        max: 0.4,
        size: 1 + Math.random() * 2,
        color: "#86d8d0",
        gravity: 0,
      });
    }
  }

  /* ---------------- world ---------------- */

  private buildWorld() {
    const rnd = seeded(411);
    this.trees = [];
    this.rocks = [];
    this.tufts = [];
    this.lanterns = [];
    this.puddles = [];
    this.grassPatches = [];

    for (let i = 0; i < 76; i += 1) {
      const x = 80 + rnd() * (WORLD.w - 160);
      const y = 80 + rnd() * (WORLD.h - 160);
      if (Math.abs(x - pathX(y)) < 190) continue;
      this.trees.push({ x, y, s: 0.7 + rnd() * 0.75, kind: Math.floor(rnd() * 3) });
    }
    for (let i = 0; i < 48; i += 1) {
      const y = 100 + rnd() * (WORLD.h - 200);
      const x = pathX(y) + (rnd() > 0.5 ? 1 : -1) * (120 + rnd() * 90);
      this.rocks.push({ x, y, s: 0.5 + rnd() * 0.9 });
    }
    for (let i = 0; i < 240; i += 1) {
      const y = 80 + rnd() * (WORLD.h - 160);
      const x = pathX(y) + (rnd() > 0.5 ? 1 : -1) * (60 + rnd() * 700);
      this.tufts.push({ x, y, s: 0.5 + rnd() * 0.9, tilt: (rnd() - 0.5) * 0.7 });
    }
    for (let i = 0; i < 9; i += 1) {
      const y = 300 + i * 125;
      this.lanterns.push({ x: pathX(y) + (i % 2 === 0 ? 130 : -130), y, hue: i > 6 ? "cyan" : "warm" });
    }
    for (let i = 0; i < 20; i += 1) {
      const y = 160 + rnd() * (WORLD.h - 300);
      const x = pathX(y) + (rnd() - 0.5) * 110;
      this.puddles.push({ x, y, rx: 18 + rnd() * 54, ry: 5 + rnd() * 12 });
    }
    for (let i = 0; i < 46; i += 1) {
      this.grassPatches.push({
        x: rnd() * WORLD.w,
        y: rnd() * WORLD.h,
        r: 50 + rnd() * 160,
      });
    }
    this.seedStones();
  }

  private seedStones() {
    const points: Vec[] = [
      { x: 720, y: 940 },
      { x: 1290, y: 860 },
      { x: 620, y: 640 },
      { x: 1320, y: 590 },
      { x: 860, y: 430 },
      { x: 1140, y: 340 },
      { x: 400, y: 1080 },
      { x: 1540, y: 1040 },
    ];
    this.stones = points.map((point) => ({ ...point, phase: Math.random() * TAU }));
  }

  private resetPlayer() {
    const p = this.player;
    p.x = START.x;
    p.y = START.y;
    p.face = -Math.PI / 2;
    p.hp = 10;
    p.essence = 35;
    p.keys = 0;
    p.kills = 0;
    p.stones = 0;
    p.attack = 0;
    p.attackCd = 0;
    p.dash = 0;
    p.dashCd = 0;
    p.invuln = 0;
    p.flash = 0;
    p.healFx = 0;
    p.moveX = 0;
    p.moveY = 0;
    this.cam = { x: START.x, y: START.y };
    this.enemies = [];
    this.particles = [];
    this.pointer.active = false;
    this.touch = { up: false, down: false, left: false, right: false };
  }

  private spawnEnemy() {
    const p = this.player;
    const angle = Math.random() * TAU;
    const radius = 270 + Math.random() * 230;
    const x = clamp(p.x + Math.cos(angle) * radius, 70, WORLD.w - 70);
    const y = clamp(p.y + Math.sin(angle) * radius, 200, WORLD.h - 70);
    const tier = 3 + Math.min(2, Math.floor(this.player.kills / 6));
    this.enemies.push({
      id: (this.enemyId += 1),
      x,
      y,
      homeX: x,
      homeY: y,
      hp: tier,
      maxHp: tier,
      cd: 1 + Math.random(),
      flash: 0,
      phase: Math.random() * TAU,
      speed: 48 + Math.random() * 28 + Math.min(28, this.player.kills * 2),
    });
  }

  /* ---------------- input ---------------- */

  private onKeyDown = (event: KeyboardEvent) => {
    if (!this.running) return;
    const code = event.code;
    if (
      [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "Space",
        "KeyW",
        "KeyA",
        "KeyS",
        "KeyD",
        "KeyZ",
        "KeyQ",
        "KeyF",
        "KeyR",
      ].includes(code)
    ) {
      event.preventDefault();
    }
    this.keysDown.add(code);
    if (event.repeat) return;
    if (code === "KeyF") this.attack();
    if (code === "Space") this.dash();
    if (code === "KeyR") this.heal();
  };

  private onKeyUp = (event: KeyboardEvent) => {
    this.keysDown.delete(event.code);
  };

  private onBlur = () => {
    this.keysDown.clear();
    this.touch = { up: false, down: false, left: false, right: false };
  };

  private onContextMenu = (event: Event) => {
    event.preventDefault();
  };

  private onPointerDown = (event: PointerEvent) => {
    if (!this.running) return;
    event.preventDefault();
    this.canvas.focus();
    this.updatePointer(event);
    if (event.button === 2) this.heal();
    else this.attack();
  };

  private onPointerMove = (event: PointerEvent) => {
    if (!this.running) return;
    this.updatePointer(event);
  };

  private updatePointer(event: PointerEvent) {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.x =
      (event.clientX - rect.left - this.width / 2) / this.scale + this.cam.x;
    this.pointer.y =
      (event.clientY - rect.top - this.height / 2) / this.scale + this.cam.y;
    this.pointer.active = true;
  }

  private readInput() {
    const down = (key: string) => (this.keysDown.has(key) ? 1 : 0);
    let x = down("KeyD") + down("ArrowRight") - down("KeyA") - down("KeyQ") - down("ArrowLeft");
    let y = down("KeyS") + down("ArrowDown") - down("KeyW") - down("KeyZ") - down("ArrowUp");
    x += (this.touch.right ? 1 : 0) - (this.touch.left ? 1 : 0);
    y += (this.touch.down ? 1 : 0) - (this.touch.up ? 1 : 0);
    return { x: clamp(x, -1, 1), y: clamp(y, -1, 1) };
  }

  /* ---------------- simulation ---------------- */

  private update(dt: number) {
    this.time += dt;
    const p = this.player;
    p.attack = Math.max(0, p.attack - dt);
    p.attackCd = Math.max(0, p.attackCd - dt);
    p.dashCd = Math.max(0, p.dashCd - dt);
    p.dash = Math.max(0, p.dash - dt);
    p.invuln = Math.max(0, p.invuln - dt);
    p.flash = Math.max(0, p.flash - dt);
    p.healFx = Math.max(0, p.healFx - dt);
    this.shake = Math.max(0, this.shake - dt * 22);
    this.toastClock = Math.max(0, this.toastClock - dt);

    const input = this.readInput();
    const len = Math.hypot(input.x, input.y);
    const nx = len > 0 ? input.x / len : 0;
    const ny = len > 0 ? input.y / len : 0;
    p.moveX = lerp(p.moveX, nx, 1 - Math.pow(0.001, dt));
    p.moveY = lerp(p.moveY, ny, 1 - Math.pow(0.001, dt));

    if (p.dash > 0) {
      p.x += p.dashX * 620 * dt;
      p.y += p.dashY * 620 * dt;
    } else if (len > 0) {
      p.x += nx * 205 * dt;
      p.y += ny * 205 * dt;
      p.walking += dt;
    }

    p.x = clamp(p.x, 45, WORLD.w - 45);
    p.y = clamp(p.y, 120, WORLD.h - 45);

    if (this.pointer.active && len > 0) {
      p.face = Math.atan2(ny, nx);
    } else if (this.pointer.active) {
      p.face = Math.atan2(this.pointer.y - p.y, this.pointer.x - p.x);
    } else if (len > 0) {
      p.face = Math.atan2(ny, nx);
    }

    this.spawnTimer -= dt;
    const maxEnemies = Math.min(10, 5 + Math.floor(p.kills / 4));
    if (this.spawnTimer <= 0 && this.enemies.length < maxEnemies) {
      this.spawnEnemy();
      this.spawnTimer = Math.max(0.9, 2.1 - p.kills * 0.06);
    }

    for (const enemy of this.enemies) {
      enemy.flash = Math.max(0, enemy.flash - dt);
      enemy.phase += dt;
      enemy.cd = Math.max(0, enemy.cd - dt);
      const dx = p.x - enemy.x;
      const dy = p.y - enemy.y;
      const distance = Math.hypot(dx, dy) || 1;
      if (distance < 360) {
        enemy.x += (dx / distance) * enemy.speed * dt;
        enemy.y += (dy / distance) * enemy.speed * dt;
      } else {
        enemy.x += Math.cos(enemy.phase * 0.6) * 18 * dt;
        enemy.y += Math.sin(enemy.phase * 0.5) * 18 * dt;
      }
      for (const other of this.enemies) {
        if (other === enemy) continue;
        const ox = enemy.x - other.x;
        const oy = enemy.y - other.y;
        const od = Math.hypot(ox, oy);
        if (od > 0 && od < 28) {
          enemy.x += (ox / od) * 20 * dt;
          enemy.y += (oy / od) * 20 * dt;
        }
      }
      if (distance < 42 && enemy.cd <= 0) {
        enemy.cd = 1.45;
        this.hurtPlayer(1);
      }
    }

    this.enemies = this.enemies.filter((enemy) => {
      if (enemy.hp > 0) return true;
      p.kills += 1;
      p.essence = Math.min(100, p.essence + 25);
      this.burst(enemy.x, enemy.y, "#86d8d0", 16, 160);
      this.burst(enemy.x, enemy.y, "#3d6f72", 10, 90);
      if (Math.random() < 0.22) this.stones.push({ x: enemy.x, y: enemy.y, phase: 0 });
      if (p.kills % 3 === 0) {
        p.keys += 1;
        this.burst(enemy.x, enemy.y - 14, "#c5a778", 22, 190);
        if (p.keys >= 3) this.win();
        else this.toast(`Un masque se fend — clé ${p.keys} / 3.`);
      }
      this.emitHud();
      return false;
    });

    for (const stone of this.stones) {
      stone.phase += dt;
      if (Math.hypot(stone.x - p.x, stone.y - p.y) < 34) {
        stone.x = -999;
        p.stones += 1;
        this.burst(p.x, p.y - 8, "#86d8d0", 10, 110);
        if (p.stones % 5 === 0) {
          p.keys += 1;
          if (p.keys >= 3) this.win();
          else this.toast("Cinq pierres bleues — une clé forgée.");
        } else {
          this.toast(`${p.stones} pierres bleues. Trente suffisent pour une clé.`);
        }
        this.emitHud();
      }
    }
    this.stones = this.stones.filter((stone) => stone.x > 0);
    if (this.stones.length < 6) {
      this.stones.push({
        x: 160 + Math.random() * (WORLD.w - 320),
        y: 220 + Math.random() * (WORLD.h - 400),
        phase: 0,
      });
    }

    for (const particle of this.particles) {
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += particle.gravity * dt;
      particle.vx *= 0.98;
      particle.vy *= 0.98;
    }
    this.particles = this.particles.filter((particle) => particle.life > 0);

    if (p.hp <= 0) {
      this.running = false;
      this.callbacks.onEnd("dead");
      this.callbacks.onToast("Kya tombe. La pluie continue.");
    }

    this.hudClock += dt;
    if (this.hudClock > 0.12) {
      this.hudClock = 0;
      this.emitHud();
    }
  }

  private hurtPlayer(amount: number) {
    const p = this.player;
    if (p.invuln > 0) return;
    p.hp = Math.max(0, p.hp - amount);
    p.invuln = 0.85;
    p.flash = 0.45;
    this.shake = 9;
    this.burst(p.x, p.y - 8, "#df5a4e", 10, 130);
    this.emitHud();
  }

  private win() {
    if (!this.running) return;
    this.running = false;
    this.player.keys = 3;
    this.emitHud();
    this.callbacks.onEnd("victory");
  }

  private burst(x: number, y: number, color: string, amount: number, speed: number) {
    for (let i = 0; i < amount; i += 1) {
      const angle = Math.random() * TAU;
      const velocity = speed * (0.3 + Math.random() * 0.7);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - 30,
        life: 0.35 + Math.random() * 0.45,
        max: 0.8,
        size: 0.8 + Math.random() * 2.4,
        color,
        gravity: 140,
      });
    }
  }

  private toast(message: string) {
    if (this.toastClock > 0) return;
    this.toastClock = 0.6;
    this.callbacks.onToast(message);
  }

  private guardToast(message: string) {
    if (this.player.hp <= 0) return;
    this.callbacks.onToast(message);
  }

  private emitHud() {
    const p = this.player;
    this.callbacks.onHud({
      health: p.hp,
      essence: p.essence,
      keys: p.keys,
      keysGoal: 3,
      kills: p.kills,
      stones: p.stones,
    });
  }

  /* ---------------- rendering ---------------- */

  private resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.width = Math.max(1, rect.width);
    this.height = Math.max(1, rect.height);
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.scale = clamp(this.width / 960, 0.7, 1.34);
    if (!this.rain.length) this.seedRain();
  }

  private seedRain() {
    const count = 170;
    this.rain = Array.from({ length: count }, () => ({
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      len: 8 + Math.random() * 20,
      speed: 480 + Math.random() * 720,
      a: 0.08 + Math.random() * 0.25,
    }));
  }

  private loop = (now: number) => {
    const dt = Math.min(0.05, Math.max(0, (now - this.last) / 1000));
    this.last = now;
    if (this.width < 2) this.resize();
    if (this.running) this.update(dt);
    else this.time += dt;
    this.render(dt);
    this.raf = requestAnimationFrame(this.loop);
  };

  private updateCamera() {
    const viewW = this.width / this.scale;
    const viewH = this.height / this.scale;
    const targetX = clamp(this.player.x, viewW / 2, WORLD.w - viewW / 2);
    const targetY = clamp(this.player.y, viewH / 2, WORLD.h - viewH / 2);
    this.cam.x = lerp(this.cam.x, targetX, 0.09);
    this.cam.y = lerp(this.cam.y, targetY, 0.09);
  }

  private render(dt: number) {
    const ctx = this.ctx;
    this.resizeIfNeeded();
    this.updateCamera();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);

    const base = ctx.createLinearGradient(0, 0, 0, this.height);
    base.addColorStop(0, "#0a191a");
    base.addColorStop(0.55, "#0c1d1d");
    base.addColorStop(1, "#122423");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, this.width, this.height);

    const shakeX = (Math.random() - 0.5) * this.shake;
    const shakeY = (Math.random() - 0.5) * this.shake;

    ctx.save();
    ctx.translate(this.width / 2 + shakeX, this.height / 2 + shakeY);
    ctx.scale(this.scale, this.scale);
    ctx.translate(-this.cam.x, -this.cam.y);

    this.drawGround(ctx);
    this.drawGate(ctx);
    this.drawVillage(ctx);
    for (const rock of this.rocks) this.drawRock(ctx, rock);
    for (const tuft of this.tufts) this.drawTuft(ctx, tuft);
    for (const lantern of this.lanterns) this.drawLantern(ctx, lantern);
    for (const tree of this.trees) this.drawTree(ctx, tree);
    for (const stone of this.stones) this.drawStone(ctx, stone);
    for (const enemy of this.enemies) this.drawEnemy(ctx, enemy);
    this.drawPlayer(ctx);
    for (const particle of this.particles) {
      ctx.globalAlpha = Math.max(0, particle.life / particle.max);
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    this.drawWeather(ctx, dt);
    this.drawVignette(ctx);
  }

  private resizeIfNeeded() {
    const rect = this.canvas.getBoundingClientRect();
    if (
      Math.abs(rect.width - this.width) > 1 ||
      Math.abs(rect.height - this.height) > 1
    ) {
      this.resize();
    }
  }

  private drawGround(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "#142322";
    ctx.fillRect(0, 0, WORLD.w, WORLD.h);

    for (const patch of this.grassPatches) {
      ctx.fillStyle = patch.r > 130 ? "rgba(31,56,50,0.4)" : "rgba(24,45,42,0.5)";
      ctx.beginPath();
      ctx.ellipse(patch.x, patch.y, patch.r, patch.r * 0.55, 0, 0, TAU);
      ctx.fill();
    }

    // The old pilgrim road
    ctx.lineWidth = 220;
    ctx.strokeStyle = "rgba(12,24,24,0.9)";
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(pathX(1420), 1440);
    ctx.bezierCurveTo(pathX(1120) + 20, 1120, pathX(860) - 30, 900, pathX(700), 700);
    ctx.bezierCurveTo(pathX(540) + 20, 520, pathX(300), 300, 1000, 110);
    ctx.stroke();

    ctx.lineWidth = 168;
    ctx.strokeStyle = "#2b312a";
    ctx.beginPath();
    ctx.moveTo(pathX(1420), 1440);
    ctx.bezierCurveTo(pathX(1120) + 20, 1120, pathX(860) - 30, 900, pathX(700), 700);
    ctx.bezierCurveTo(pathX(540) + 20, 520, pathX(300), 300, 1000, 110);
    ctx.stroke();

    ctx.lineWidth = 128;
    ctx.strokeStyle = "#333831";
    ctx.beginPath();
    ctx.moveTo(pathX(1420), 1440);
    ctx.bezierCurveTo(pathX(1120) + 20, 1120, pathX(860) - 30, 900, pathX(700), 700);
    ctx.bezierCurveTo(pathX(540) + 20, 520, pathX(300), 300, 1000, 110);
    ctx.stroke();

    for (const puddle of this.puddles) {
      ctx.fillStyle = "rgba(68,117,116,0.2)";
      ctx.beginPath();
      ctx.ellipse(puddle.x, puddle.y, puddle.rx, puddle.ry, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "rgba(134,216,208,0.16)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.ellipse(
        puddle.x,
        puddle.y,
        puddle.rx * 0.7 + Math.sin(this.time + puddle.x) * 2,
        puddle.ry * 0.6,
        0,
        0,
        TAU,
      );
      ctx.stroke();
    }

    // The void beyond the cliff
    ctx.fillStyle = "rgba(5,13,14,0.75)";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(WORLD.w, 0);
    ctx.lineTo(WORLD.w, 40);
    ctx.lineTo(0, 55);
    ctx.closePath();
    ctx.fill();
  }

  private drawGate(ctx: CanvasRenderingContext2D) {
    const x = 1000;
    const y = 130;
    ctx.save();
    const glow = ctx.createRadialGradient(x, y + 20, 0, x, y + 20, 180);
    glow.addColorStop(0, "rgba(90,48,58,0.35)");
    glow.addColorStop(1, "rgba(20,25,25,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(x - 210, y - 140, 420, 320);

    ctx.fillStyle = "#1c2928";
    ctx.fillRect(x - 174, y - 26, 72, 170);
    ctx.fillRect(x + 102, y - 26, 72, 170);
    ctx.fillStyle = "#283735";
    ctx.beginPath();
    ctx.moveTo(x - 190, y - 20);
    ctx.lineTo(x - 190, y - 72);
    ctx.quadraticCurveTo(x, y - 190, x + 190, y - 72);
    ctx.lineTo(x + 190, y - 20);
    ctx.quadraticCurveTo(x, y - 132, x - 190, y - 20);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#0d1818";
    ctx.beginPath();
    ctx.moveTo(x - 104, y + 144);
    ctx.lineTo(x - 104, y - 12);
    ctx.quadraticCurveTo(x, y - 102, x + 104, y - 12);
    ctx.lineTo(x + 104, y + 144);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#3b4a45";
    for (let i = 0; i < 15; i += 1) {
      const a = Math.PI + (i / 14) * Math.PI;
      const kx = x + Math.cos(a) * 142;
      const ky = y - 66 + Math.sin(a) * 92;
      ctx.beginPath();
      ctx.arc(kx, ky, 2.4, 0, TAU);
      ctx.fillStyle = i < this.player.keys * 5 ? "#a9f0e8" : "#4e6a67";
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(197,167,120,0.3)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 174, y - 26, 72, 170);
    ctx.strokeRect(x + 102, y - 26, 72, 170);
    ctx.restore();
  }

  private drawVillage(ctx: CanvasRenderingContext2D) {
    const houses = [
      { x: 740, y: 1250, w: 132, h: 82, flip: false },
      { x: 1230, y: 1300, w: 154, h: 96, flip: true },
      { x: 620, y: 1360, w: 112, h: 70, flip: true },
      { x: 1430, y: 1200, w: 116, h: 74, flip: false },
    ];
    for (const house of houses) {
      const { x, y, w, h } = house;
      const glow = ctx.createRadialGradient(x, y - 10, 0, x, y - 10, 120);
      glow.addColorStop(0, "rgba(214,157,89,0.18)");
      glow.addColorStop(1, "rgba(214,157,89,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(x - 130, y - 150, 260, 260);

      ctx.fillStyle = "#253332";
      ctx.fillRect(x - w / 2, y - h, w, h);
      ctx.fillStyle = "#182424";
      ctx.beginPath();
      ctx.moveTo(x - w / 2 - 15, y - h + 2);
      ctx.lineTo(x, y - h - 56);
      ctx.lineTo(x + w / 2 + 15, y - h + 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(197,167,120,0.18)";
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.fillStyle = "rgba(235,175,106,0.92)";
      const wx = x + (house.flip ? -w * 0.22 : w * 0.22);
      ctx.fillRect(wx - 7, y - h + 22, 14, 18);
      ctx.fillStyle = "rgba(255,214,153,0.24)";
      ctx.fillRect(wx - 13, y - h + 16, 26, 30);
      ctx.fillStyle = "#1a2827";
      ctx.fillRect(x - 10, y - 30, 20, 30);
    }
  }

  private drawTree(ctx: CanvasRenderingContext2D, tree: Tree) {
    const { x, y, s, kind } = tree;
    const sway = Math.sin(this.time * 0.8 + x) * 2.5;
    ctx.strokeStyle = "#1b2825";
    ctx.lineWidth = 6 * s;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + sway * 0.4, y - 50 * s);
    ctx.stroke();
    const colors =
      kind === 0
        ? ["#102827", "#163331", "#1c403c"]
        : kind === 1
          ? ["#132322", "#19302c", "#204039"]
          : ["#0f2424", "#15312f", "#1b3b38"];
    for (let i = 0; i < 3; i += 1) {
      const w = (62 - i * 15) * s;
      const h = (72 - i * 10) * s;
      const yy = y - 54 * s - i * 34 * s;
      ctx.fillStyle = colors[i];
      ctx.beginPath();
      ctx.moveTo(x - w / 2 + sway, yy);
      ctx.lineTo(x + sway, yy - h);
      ctx.lineTo(x + w / 2 + sway, yy);
      ctx.closePath();
      ctx.fill();
    }
  }

  private drawRock(ctx: CanvasRenderingContext2D, rock: Rock) {
    const { x, y, s } = rock;
    ctx.fillStyle = "#263531";
    ctx.beginPath();
    ctx.moveTo(x - 18 * s, y);
    ctx.lineTo(x - 10 * s, y - 17 * s);
    ctx.lineTo(x + 5 * s, y - 22 * s);
    ctx.lineTo(x + 19 * s, y - 8 * s);
    ctx.lineTo(x + 14 * s, y + 3 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#34453f";
    ctx.beginPath();
    ctx.moveTo(x - 10 * s, y - 17 * s);
    ctx.lineTo(x + 5 * s, y - 22 * s);
    ctx.lineTo(x + 1 * s, y - 10 * s);
    ctx.closePath();
    ctx.fill();
  }

  private drawTuft(ctx: CanvasRenderingContext2D, tuft: Tuft) {
    const { x, y, s, tilt } = tuft;
    ctx.strokeStyle = "rgba(84,117,99,0.6)";
    ctx.lineWidth = 1.1;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(
        x + (i * 4 + tilt * 10) * s,
        y - 7 * s,
        x + (i * 7 + tilt * 16) * s,
        y - 13 * s,
      );
      ctx.stroke();
    }
  }

  private drawLantern(ctx: CanvasRenderingContext2D, lantern: Lantern) {
    const color = lantern.hue === "warm" ? "rgba(226,165,96," : "rgba(134,216,208,";
    const flicker = 0.78 + Math.sin(this.time * 7 + lantern.x) * 0.12;
    const glow = ctx.createRadialGradient(lantern.x, lantern.y - 34, 2, lantern.x, lantern.y - 34, 76);
    glow.addColorStop(0, `${color}${0.3 * flicker})`);
    glow.addColorStop(1, `${color}0)`);
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(lantern.x, lantern.y - 34, 76, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#26322f";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(lantern.x, lantern.y);
    ctx.lineTo(lantern.x, lantern.y - 28);
    ctx.stroke();
    ctx.fillStyle = lantern.hue === "warm" ? "#efb878" : "#a7ded8";
    ctx.fillRect(lantern.x - 3, lantern.y - 38, 6, 9);
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 1;
    ctx.strokeRect(lantern.x - 3, lantern.y - 38, 6, 9);
  }

  private drawStone(ctx: CanvasRenderingContext2D, stone: Stone) {
    const bob = Math.sin(this.time * 2 + stone.phase) * 4;
    const x = stone.x;
    const y = stone.y;
    const glow = ctx.createRadialGradient(x, y - 12 + bob, 0, x, y - 12 + bob, 36);
    glow.addColorStop(0, "rgba(134,216,208,0.36)");
    glow.addColorStop(1, "rgba(134,216,208,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y - 12 + bob, 36, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#7fd6cf";
    ctx.beginPath();
    ctx.moveTo(x, y - 26 + bob);
    ctx.lineTo(x + 8, y - 13 + bob);
    ctx.lineTo(x, y + bob);
    ctx.lineTo(x - 7, y - 13 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.beginPath();
    ctx.moveTo(x - 1, y - 24 + bob);
    ctx.lineTo(x + 2, y - 14 + bob);
    ctx.lineTo(x - 1, y - 8 + bob);
    ctx.closePath();
    ctx.fill();
  }

  private drawEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy) {
    const { x, y } = enemy;
    const bob = Math.sin(enemy.phase * 3) * 2;
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = "#03090a";
    ctx.beginPath();
    ctx.ellipse(x, y + 12, 19, 7, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(x, y + bob);
    const flash = enemy.flash > 0;
    ctx.fillStyle = flash ? "#c8a09a" : "#172122";
    ctx.beginPath();
    ctx.moveTo(-14, 10);
    ctx.lineTo(-11, -18);
    ctx.lineTo(0, -27);
    ctx.lineTo(12, -17);
    ctx.lineTo(15, 8);
    ctx.lineTo(5, 16);
    ctx.lineTo(-6, 16);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = flash ? "#f0d6ce" : "#2b4242";
    ctx.lineWidth = 1.1;
    ctx.stroke();

    ctx.strokeStyle = flash ? "#f0d6ce" : "#263a39";
    ctx.lineWidth = 3.4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-11, -13);
    ctx.lineTo(-26, 2);
    ctx.lineTo(-20, 18);
    ctx.moveTo(11, -13);
    ctx.lineTo(26, 1);
    ctx.lineTo(20, 18);
    ctx.stroke();
    ctx.strokeStyle = "#89d4ce";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-26, 2);
    ctx.lineTo(-22, 14);
    ctx.moveTo(26, 1);
    ctx.lineTo(22, 13);
    ctx.stroke();

    ctx.fillStyle = flash ? "#fff0ea" : "#c2c4ac";
    ctx.beginPath();
    ctx.moveTo(-9, -28);
    ctx.lineTo(0, -36);
    ctx.lineTo(9, -28);
    ctx.lineTo(7, -13);
    ctx.lineTo(-7, -13);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#102020";
    ctx.beginPath();
    ctx.moveTo(-7, -27);
    ctx.lineTo(-1, -23);
    ctx.lineTo(-5, -19);
    ctx.closePath();
    ctx.moveTo(7, -27);
    ctx.lineTo(1, -23);
    ctx.lineTo(5, -19);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#94efe6";
    ctx.fillRect(-5, -25, 2, 2);
    ctx.fillRect(3, -25, 2, 2);
    ctx.restore();

    if (enemy.hp < enemy.maxHp) {
      ctx.fillStyle = "rgba(4,12,13,0.8)";
      ctx.fillRect(x - 16, y - 48, 32, 3);
      ctx.fillStyle = "#8fbfb8";
      ctx.fillRect(x - 16, y - 48, 32 * (enemy.hp / enemy.maxHp), 3);
    }
  }

  private drawPlayer(ctx: CanvasRenderingContext2D) {
    const p = this.player;
    const speed = Math.hypot(p.moveX, p.moveY);
    const bob = Math.sin(this.time * 8) * (speed > 0.1 ? 1.8 : 0.5);
    const faceX = Math.cos(p.face);
    const faceY = Math.sin(p.face);

    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = "#020808";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 13, 21, 7, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    if (p.healFx > 0) {
      const glow = ctx.createRadialGradient(p.x, p.y - 8, 2, p.x, p.y - 8, 94);
      glow.addColorStop(0, `rgba(223,90,78,${0.4 * Math.min(1, p.healFx)})`);
      glow.addColorStop(1, "rgba(223,90,78,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y - 8, 94, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = `rgba(255,170,150,${0.4 * Math.min(1, p.healFx)})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(p.x, p.y - 8, 34 + (1 - p.healFx) * 26, 0, TAU);
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(p.x, p.y + bob);
    ctx.scale(1.16, 1.16);

    // tattered crimson cape, trailing opposite movement
    const trailX = -p.moveX * 22 - faceX * 6;
    const trailY = -p.moveY * 16 + 14;
    const flutter = Math.sin(this.time * 5.2) * 5;
    ctx.fillStyle = "#8f2c35";
    ctx.beginPath();
    ctx.moveTo(-13, -10);
    ctx.lineTo(11, -10);
    ctx.quadraticCurveTo(
      20 + trailX + flutter,
      8 + trailY * 0.4,
      12 + trailX - flutter,
      32 + trailY,
    );
    ctx.lineTo(4 + trailX * 0.5 + flutter, 22 + trailY * 0.7);
    ctx.lineTo(-5 + trailX - flutter, 35 + trailY);
    ctx.quadraticCurveTo(-19 + trailX + flutter, 12 + trailY * 0.4, -13, -10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(60,16,22,0.55)";
    ctx.beginPath();
    ctx.moveTo(-2, 2);
    ctx.lineTo(9, 1);
    ctx.lineTo(6 + trailX, 26 + trailY * 0.8);
    ctx.lineTo(1 + trailX, 16 + trailY * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(223,90,78,0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-13, -10);
    ctx.quadraticCurveTo(-5, 4, -5 + trailX, 30 + trailY);
    ctx.stroke();

    // boots & body
    ctx.strokeStyle = "#132020";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-5, 12);
    ctx.lineTo(-7, 22);
    ctx.moveTo(5, 12);
    ctx.lineTo(7, 22);
    ctx.stroke();
    ctx.fillStyle = p.flash > 0 ? "#f4d2c8" : "#123536";
    ctx.beginPath();
    ctx.moveTo(-12, -8);
    ctx.lineTo(-8, 10);
    ctx.lineTo(0, 14);
    ctx.lineTo(9, 10);
    ctx.lineTo(12, -8);
    ctx.lineTo(5, -13);
    ctx.lineTo(-6, -13);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(134,216,208,0.35)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "#b08a58";
    ctx.fillRect(-11, 0, 23, 2.4);
    ctx.fillStyle = "#9e3038";
    ctx.beginPath();
    ctx.moveTo(-10, -9);
    ctx.lineTo(0, -5);
    ctx.lineTo(10, -9);
    ctx.lineTo(6, -13);
    ctx.lineTo(-6, -13);
    ctx.closePath();
    ctx.fill();

    // head and silver hair
    ctx.fillStyle = "#0d1c1c";
    ctx.beginPath();
    ctx.arc(0, -22, 9.4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#e7cbb2";
    ctx.beginPath();
    ctx.arc(0, -20.5, 7.6, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#d9ded4";
    ctx.beginPath();
    ctx.arc(0, -22.5, 8.6, Math.PI, TAU);
    ctx.lineTo(8.6, -16.5);
    ctx.quadraticCurveTo(5.5, -13.5, 2, -16.2);
    ctx.quadraticCurveTo(-2.5, -14.5, -5.6, -16.8);
    ctx.lineTo(-8.6, -20.5);
    ctx.closePath();
    ctx.fill();
    // side locks and a fine fringe
    ctx.fillStyle = "#c8d1c7";
    ctx.beginPath();
    ctx.moveTo(-8.4, -20.5);
    ctx.lineTo(-10.4, -10.5);
    ctx.lineTo(-6.4, -14);
    ctx.lineTo(-4.8, -18.5);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(8.2, -20.5);
    ctx.lineTo(10.2, -12);
    ctx.lineTo(6.2, -14.8);
    ctx.lineTo(4.6, -18.5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillRect(-4.2, -25.5, 6.5, 0.9);
    // eyes, brow, mouth
    ctx.fillStyle = "#273a38";
    ctx.fillRect(-4.4, -21.4, 2.4, 1.9);
    ctx.fillRect(2.0, -21.4, 2.4, 1.9);
    ctx.fillStyle = "#a8efe6";
    ctx.fillRect(-3.7, -21, 1.1, 1.1);
    ctx.fillRect(2.7, -21, 1.1, 1.1);
    ctx.strokeStyle = "rgba(80,60,48,0.55)";
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(-2.2, -19.6);
    ctx.lineTo(1.4, -19.6);
    ctx.moveTo(-0.4, -18.2);
    ctx.lineTo(1.4, -18.2);
    ctx.stroke();
    // collar gem
    ctx.fillStyle = "#86d8d0";
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(1.6, -12.2);
    ctx.lineTo(0, -10.4);
    ctx.lineTo(-1.6, -12.2);
    ctx.closePath();
    ctx.fill();

    // sword
    const sweep = p.attack > 0 ? Math.sin((1 - p.attack / 0.23) * Math.PI) : 0;
    const swordAngle = -Math.PI / 2 + 0.35 + sweep * 1.9;
    ctx.save();
    ctx.translate(11, -2);
    ctx.rotate(swordAngle);
    ctx.fillStyle = "#c7d3ce";
    ctx.beginPath();
    ctx.moveTo(-1.7, 0);
    ctx.lineTo(1.7, 0);
    ctx.lineTo(1.2, -38);
    ctx.lineTo(0, -45);
    ctx.lineTo(-1.2, -38);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.fillRect(-0.7, -35, 0.9, 30);
    ctx.fillStyle = "#b08a58";
    ctx.fillRect(-6, -1, 12, 2.4);
    ctx.fillStyle = "#5a3f2c";
    ctx.fillRect(-1.4, -1, 2.8, 7);
    ctx.restore();

    if (p.attack > 0) {
      ctx.save();
      ctx.rotate(p.face);
      ctx.strokeStyle = `rgba(210,247,241,${p.attack / 0.23})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, 52, -1.05 + sweep * 0.7, 0.65 + sweep * 0.7);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, 60, -0.9 + sweep * 0.7, 0.5 + sweep * 0.7);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    if (p.invuln > 0 && Math.floor(this.time * 12) % 2 === 0) {
      ctx.strokeStyle = "rgba(223,90,78,0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y - 8, 24, 0, TAU);
      ctx.stroke();
    }
    if (faceX || faceY) {
      ctx.fillStyle = "rgba(134,216,208,0.45)";
      ctx.beginPath();
      ctx.arc(p.x + faceX * 28, p.y + faceY * 28 - 8, 1.5, 0, TAU);
      ctx.fill();
    }
  }

  private drawWeather(ctx: CanvasRenderingContext2D, dt: number) {
    this.nextLightning -= dt;
    if (this.nextLightning <= 0) {
      this.lightning = 1;
      this.nextLightning = 7 + Math.random() * 11;
    }
    this.lightning = Math.max(0, this.lightning - dt * 2.4);

    for (const drop of this.rain) {
      drop.y += drop.speed * dt;
      drop.x -= drop.speed * 0.18 * dt;
      if (drop.y > this.height + 20) {
        drop.y = -20;
        drop.x = Math.random() * (this.width + 160);
      }
      if (drop.x < -20) drop.x = this.width + 20;
      ctx.strokeStyle = `rgba(188,222,217,${drop.a})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x + drop.len * 0.22, drop.y + drop.len);
      ctx.stroke();
    }

    const mist = ctx.createLinearGradient(0, 0, 0, this.height);
    mist.addColorStop(0, "rgba(140,180,176,0.1)");
    mist.addColorStop(0.35, "rgba(100,150,148,0.03)");
    mist.addColorStop(0.75, "rgba(6,15,16,0.04)");
    mist.addColorStop(1, "rgba(5,13,14,0.35)");
    ctx.fillStyle = mist;
    ctx.fillRect(0, 0, this.width, this.height);

    if (this.lightning > 0) {
      ctx.fillStyle = `rgba(195,230,226,${this.lightning * 0.16})`;
      ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  private drawVignette(ctx: CanvasRenderingContext2D) {
    const p = this.player;
    const vignette = ctx.createRadialGradient(
      this.width / 2,
      this.height / 2,
      Math.min(this.width, this.height) * 0.25,
      this.width / 2,
      this.height / 2,
      Math.max(this.width, this.height) * 0.78,
    );
    vignette.addColorStop(0, "rgba(3,9,10,0)");
    vignette.addColorStop(1, "rgba(3,9,10,0.82)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, this.width, this.height);

    if (p.flash > 0) {
      ctx.fillStyle = `rgba(179,52,59,${p.flash * 0.18})`;
      ctx.fillRect(0, 0, this.width, this.height);
    }
  }
}
