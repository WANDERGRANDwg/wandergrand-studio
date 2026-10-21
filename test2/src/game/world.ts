// ─────────────────────────────────────────────────────────────
// SDFAKER RIAN — The Island (500×500 m, fully procedural)
// Village d'Amboroa · Forêt des Murmures · Porte Rouge · Cratère
// ─────────────────────────────────────────────────────────────
import * as THREE from 'three';
import { toon, outlineGroup, smoothstep, lerp, mulberry32 } from './toon';

export interface Collider { x: number; z: number; r: number; }
export interface ItemSpot { id: number; x: number; z: number; }
export interface NpcSpot { id: string; name: string; x: number; z: number; rot: number; kind: 'elder' | 'mira' | 'tovo' | 'anja'; }
export interface InteractSpot { id: string; x: number; z: number; label: 'read' | 'entity'; dialogue: string; }

export interface WorldRefs {
  group: THREE.Group;
  colliders: Collider[];
  holes: Collider[];
  gateLight: THREE.PointLight;
  gateBarrier: THREE.Mesh;
  gateBlockers: Collider[];
  arena: { x: number; z: number; r: number };
  spawn: { x: number; z: number };
  keySpots: ItemSpot[];
  heartSpots: ItemSpot[];
  stoneSpots: { x: number; z: number }[];
  slacheSpawns: { x: number; z: number }[];
  npcs: NpcSpot[];
  interactables: InteractSpot[];
  gate: { x: number; z: number };
  lanternLights: THREE.PointLight[];
}

// ── Analytic ground height (shared physics + placement) ──
export const ARENA = { x: 0, z: 196, r: 40 };
const G1 = { x: -34, z: 158, amp: 15, s: 22 };
const G2 = { x: 34, z: 158, amp: 15, s: 22 };

function hill(x: number, z: number, hx: number, hz: number, amp: number, s: number) {
  const dx = x - hx, dz = z - hz;
  return amp * Math.exp(-(dx * dx + dz * dz) / (2 * s * s));
}

export function groundHeight(x: number, z: number): number {
  const r = Math.sqrt(x * x + z * z);
  let h = 1 + 7 * (1 - smoothstep(150, 232, r));
  // rolling hills
  h += hill(x, z, 118, 55, 8.5, 46);      // forest east
  h += hill(x, z, 152, -28, 6.5, 40);     // forest north-east
  h += hill(x, z, -128, 42, 6, 52);       // west hill
  h += hill(x, z, -20, -128, 5, 55);      // south rise
  h += hill(x, z, 88, -95, 4.5, 42);
  h += hill(x, z, -95, 105, 5, 38);
  h += hill(x, z, 30, 90, 4, 34);
  h += hill(x, z, -60, -30, 3, 45);       // gentle mid
  // gate cliffs (they frame the Red Gate)
  h += hill(x, z, G1.x, G1.z, G1.amp, G1.s);
  h += hill(x, z, G2.x, G2.z, G2.amp, G2.s);
  // arena crater: flatten inside, raised rim all around except the south pass
  const da = Math.hypot(x - ARENA.x, z - ARENA.z);
  const flat = 1 - smoothstep(18, 42, da);
  h = lerp(h, 6.4, flat);
  const rim = Math.exp(-((da - 42) * (da - 42)) / (2 * 13 * 13));
  const ang = Math.atan2(z - ARENA.z, x - ARENA.x); // south gap near -90° (z- side)
  const angToSouth = Math.abs(((ang + Math.PI / 2 + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
  const gap = smoothstep(0.30, 0.75, angToSouth); // 0 inside the gap
  h += rim * 12 * gap;
  // gate pass corridor stays low
  const pass = (1 - smoothstep(6, 16, Math.abs(x))) * smoothstep(140, 152, z) * (1 - smoothstep(168, 180, z));
  h = lerp(h, 7.2, pass * 0.9);
  // village plateau
  const dv = Math.hypot(x + 152, z + 92);
  h = lerp(h, 6.2, 1 - smoothstep(24, 48, dv));
  // beach falloff into the sea
  if (r > 224) h = Math.min(h, 6 - (r - 224) * 0.30);
  return h;
}

// ── Palette (anime low poly) ──
const C = {
  sand: new THREE.Color(0xb9a26b),
  grassA: new THREE.Color(0x3f6b46),
  grassB: new THREE.Color(0x2c5240),
  forest: new THREE.Color(0x24473a),
  rock: new THREE.Color(0x6d6f78),
  dirt: new THREE.Color(0x6b5638),
  ash: new THREE.Color(0x3a3a46),
  wood: 0x5a4230,
  thatch: 0x8a4a2f,
  wall: 0xc7b193,
  stoneDark: 0x2c2e38,
};

function distToSeg(px: number, pz: number, ax: number, az: number, bx: number, bz: number) {
  const abx = bx - ax, abz = bz - az;
  const t = Math.min(1, Math.max(0, ((px - ax) * abx + (pz - az) * abz) / (abx * abx + abz * abz)));
  return Math.hypot(px - (ax + abx * t), pz - (az + abz * t));
}

export function buildWorld(scene: THREE.Scene, seed = 1337): WorldRefs {
  const group = new THREE.Group();
  const rand = mulberry32(seed);
  const colliders: Collider[] = [];
  const holes: Collider[] = [];
  const gateBlockers: Collider[] = [];
  const lanternLights: THREE.PointLight[] = [];

  // ── Terrain ──
  const SIZE = 560, SEG = 150;
  const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.getAttribute('position') as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  const col = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const h = groundHeight(x, z);
    pos.setY(i, h);
  }
  geo.computeVertexNormals();
  const nor = geo.getAttribute('normal') as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), y = pos.getY(i);
    const ny = nor.getY(i);
    const r = Math.sqrt(x * x + z * z);
    const da = Math.hypot(x - ARENA.x, z - ARENA.z);
    if (da < 34) col.copy(C.ash);
    else if (y < 2.1) col.copy(C.sand);
    else {
      const f = smoothstep(0.25, 0.7, Math.sin(x * 0.021 + 1.3) * Math.cos(z * 0.017 - 0.6) * 0.5 + 0.5);
      col.copy(C.grassA).lerp(C.grassB, f);
      if (x > 55 && z > -70) col.lerp(C.forest, 0.7); // forest tint
      if (r > 170) col.lerp(C.sand, 0.25);
    }
    // dirt paths: village → centre → gate
    const dPath = Math.min(
      distToSeg(x, z, -152, -92, -40, -20),
      distToSeg(x, z, -40, -20, 0, 150),
      distToSeg(x, z, -152, -92, -120, -30)
    );
    if (dPath < 3.4 && y > 2.1) col.lerp(C.dirt, 0.75 * (1 - dPath / 3.4));
    if (ny < 0.72) col.copy(C.rock); // steep = rock
    const jitter = 0.94 + rand() * 0.12;
    colors[i * 3] = col.r * jitter; colors[i * 3 + 1] = col.g * jitter; colors[i * 3 + 2] = col.b * jitter;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const terrain = new THREE.Mesh(geo, toon(0xffffff, { vertexColors: true, flat: true }));
  terrain.name = 'terrain';
  group.add(terrain);

  // ── Ocean ──
  const ocean = new THREE.Mesh(
    new THREE.CircleGeometry(700, 48),
    toon(0x14283e, { emissive: 0x0a2438, emissiveIntensity: 0.55, transparent: true, opacity: 0.96, flat: false })
  );
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.y = 0.35;
  (ocean as any).userData.noOutline = true;
  group.add(ocean);

  // ── Forest + flora (instanced) ──
  const occupied: Collider[] = [];
  const tryPlace = (x: number, z: number, minH: number, maxSlope = 0.14): boolean => {
    const h = groundHeight(x, z);
    if (h < minH) return false;
    const s = Math.abs(groundHeight(x + 1.5, z) - h) + Math.abs(groundHeight(x, z + 1.5) - h);
    if (s / 3 > maxSlope) return false;
    return true;
  };
  const trunkGeo = new THREE.CylinderGeometry(0.28, 0.45, 2.6, 5);
  trunkGeo.translate(0, 1.3, 0);
  const pines: THREE.Matrix4[] = [];
  const leafSpots: { x: number; z: number; y: number; s: number }[] = [];
  const dummy = new THREE.Object3D();
  const addTree = (x: number, z: number) => {
    const y = groundHeight(x, z);
    const s = 0.8 + rand() * 0.9;
    dummy.position.set(x, y - 0.15, z);
    dummy.scale.setScalar(s);
    dummy.rotation.y = rand() * Math.PI * 2;
    dummy.updateMatrix();
    pines.push(dummy.matrix.clone());
    leafSpots.push({ x, z, y: y - 0.15, s });
    colliders.push({ x, z, r: 0.85 * s });
  };
  // dense forest east
  for (let i = 0; i < 260 && leafSpots.length < 120; i++) {
    const x = 55 + rand() * 150, z = -70 + rand() * 175;
    if (Math.hypot(x - ARENA.x, z - ARENA.z) < 52) continue;
    if (distToSeg(x, z, -40, -20, 0, 150) < 5) continue;
    if (!tryPlace(x, z, 3.2)) continue;
    if (occupied.some((o) => Math.hypot(o.x - x, o.z - z) < 3.4)) continue;
    occupied.push({ x, z, r: 1 });
    addTree(x, z);
  }
  // sparse trees elsewhere
  for (let i = 0; i < 160 && leafSpots.length < 165; i++) {
    const a = rand() * Math.PI * 2, rr = 60 + rand() * 140;
    const x = Math.cos(a) * rr, z = Math.sin(a) * rr;
    if (x > 40 && z > -80) continue;
    if (Math.hypot(x + 152, z + 92) < 42) continue;
    if (Math.hypot(x - ARENA.x, z - ARENA.z) < 58) continue;
    if (Math.abs(x) < 18 && z > 135) continue;
    if (!tryPlace(x, z, 3.2)) continue;
    if (occupied.some((o) => Math.hypot(o.x - x, o.z - z) < 4)) continue;
    occupied.push({ x, z, r: 1 });
    addTree(x, z);
  }
  const trunkMesh = new THREE.InstancedMesh(trunkGeo, toon(0x4a3226), pines.length);
  const foliageGeo = new THREE.ConeGeometry(1.9, 4.4, 6);
  foliageGeo.translate(0, 4.6, 0);
  const foliageMesh = new THREE.InstancedMesh(foliageGeo, toon(0x1e4436), pines.length);
  pines.forEach((m, i) => { trunkMesh.setMatrixAt(i, m); foliageMesh.setMatrixAt(i, m); });
  group.add(trunkMesh, foliageMesh);

  // grass tufts
  const grassGeo = new THREE.ConeGeometry(0.16, 0.85, 3);
  grassGeo.translate(0, 0.4, 0);
  const grass = new THREE.InstancedMesh(grassGeo, toon(0x497a4e), 380);
  let gi = 0;
  for (let i = 0; i < 1400 && gi < 380; i++) {
    const a = rand() * Math.PI * 2, rr = rand() * 195;
    const x = Math.cos(a) * rr, z = Math.sin(a) * rr;
    const h = groundHeight(x, z);
    if (h < 2.6 || Math.hypot(x - ARENA.x, z - ARENA.z) < 34) continue;
    dummy.position.set(x, h, z);
    dummy.scale.setScalar(0.7 + rand() * 1.1);
    dummy.rotation.y = rand() * Math.PI;
    dummy.updateMatrix();
    grass.setMatrixAt(gi++, dummy.matrix);
  }
  grass.count = gi;
  group.add(grass);

  // rocks
  const rockGeo = new THREE.DodecahedronGeometry(1, 0);
  const rocks = new THREE.InstancedMesh(rockGeo, toon(0x5b5d68), 60);
  let ri = 0;
  for (let i = 0; i < 400 && ri < 60; i++) {
    const a = rand() * Math.PI * 2, rr = 30 + rand() * 190;
    const x = Math.cos(a) * rr, z = Math.sin(a) * rr;
    if (!tryPlace(x, z, 2.2, 0.4)) continue;
    if (Math.hypot(x + 152, z + 92) < 30) continue;
    if (distToSeg(x, z, -40, -20, 0, 150) < 4) continue;
    const s = 0.5 + rand() * 1.6;
    dummy.position.set(x, groundHeight(x, z) + s * 0.2, z);
    dummy.scale.set(s, s * (0.6 + rand() * 0.5), s);
    dummy.rotation.set(rand() * 0.4, rand() * Math.PI, rand() * 0.4);
    dummy.updateMatrix();
    rocks.setMatrixAt(ri++, dummy.matrix);
    if (s > 1.1) colliders.push({ x, z, r: s * 0.9 });
  }
  rocks.count = ri;
  group.add(rocks);

  // ── Village d'Amboroa ──
  const vil = new THREE.Group();
  const hutAt = (x: number, z: number, rot: number, big = false) => {
    const y = groundHeight(x, z);
    const hut = new THREE.Group();
    const s = big ? 1.35 : 1;
    const base = new THREE.Mesh(new THREE.BoxGeometry(4.4 * s, 2.6 * s, 3.6 * s), toon(C.wall));
    base.position.y = 1.3 * s;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(3.6 * s, 2.2 * s, 4), toon(C.thatch));
    roof.position.y = 2.6 * s + 1.1 * s;
    roof.rotation.y = Math.PI / 4;
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.9 * s, 1.5 * s, 0.1), toon(0x3a2a20));
    door.position.set(0, 0.75 * s, 1.82 * s);
    hut.add(base, roof, door);
    hut.position.set(x, y - 0.1, z);
    hut.rotation.y = rot;
    vil.add(hut);
    colliders.push({ x, z, r: 3.2 * s });
  };
  hutAt(-160, -104, 0.4); hutAt(-143, -108, -0.5); hutAt(-136, -92, -1.4, true);
  hutAt(-160, -84, 1.2); hutAt(-148, -72, 2.6); hutAt(-168, -70, 1.9); hutAt(-126, -74, -2.2);
  // elder's grande hutte
  hutAt(-170, -95, 0.9, true);
  // well
  const wellY = groundHeight(-152, -92);
  const well = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.3, 1, 8), toon(C.stoneDark));
  well.position.set(-152, wellY + 0.5, -92);
  const wellRoof = new THREE.Mesh(new THREE.ConeGeometry(1.7, 1.1, 4), toon(C.thatch));
  wellRoof.position.set(-152, wellY + 2.6, -92);
  const wellPosts = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.8, 0.18), toon(C.wood));
  wellPosts.position.set(-153, wellY + 1.6, -92);
  const wellPosts2 = wellPosts.clone(); wellPosts2.position.x = -151;
  vil.add(well, wellRoof, wellPosts, wellPosts2);
  colliders.push({ x: -152, z: -92, r: 1.7 });
  // lantern poles
  const lantern = (x: number, z: number) => {
    const y = groundHeight(x, z);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 3, 5), toon(C.wood));
    pole.position.set(x, y + 1.5, z);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.5, 0.42), toon(0xffc46b, { emissive: 0xff9d3c, emissiveIntensity: 1.6 }));
    lamp.position.set(x, y + 3.05, z);
    const pl = new THREE.PointLight(0xff9d4a, 14, 16, 2);
    pl.position.set(x, y + 3.1, z);
    vil.add(pole, lamp, pl);
    lanternLights.push(pl);
  };
  lantern(-146, -97); lantern(-158, -78); lantern(-139, -83);
  // fence
  for (let i = 0; i < 14; i++) {
    const x = -172 + i * 3.4, z = -116 + Math.sin(i * 0.8) * 1.2;
    const f = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.1, 0.22), toon(C.wood));
    f.position.set(x, groundHeight(x, z) + 0.55, z);
    vil.add(f);
  }
  outlineGroup(vil, 1.045);
  group.add(vil);

  // ── Signs ──
  const signAt = (x: number, z: number, rot: number) => {
    const s = new THREE.Group();
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.7, 5), toon(C.wood));
    post.position.y = 0.85;
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.7, 0.08), toon(0x7a5c3e));
    board.position.y = 1.55;
    s.add(post, board);
    outlineGroup(s, 1.07);
    s.position.set(x, groundHeight(x, z), z);
    s.rotation.y = rot;
    group.add(s);
  };
  signAt(-140, -98, 2.1); signAt(58, -34, -1.1); signAt(0, 138, 0.2);

  // ── The Red Gate (Forbidden Zone) ──
  const gateGroup = new THREE.Group();
  const gy = groundHeight(0, 152);
  const pilGeo = new THREE.BoxGeometry(2.6, 13, 2.6);
  const pilL = new THREE.Mesh(pilGeo, toon(C.stoneDark));
  pilL.position.set(-7, gy + 6.5, 152);
  const pilR = pilL.clone(); pilR.position.x = 7;
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(17.5, 2, 3), toon(C.stoneDark));
  lintel.position.set(0, gy + 13.4, 152);
  const runeL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 9, 0.3), toon(0xff2438, { emissive: 0xff2438, emissiveIntensity: 2.2 }));
  runeL.position.set(-7, gy + 6.5, 150.6);
  const runeR = runeL.clone(); runeR.position.x = 7;
  const barrier = new THREE.Mesh(
    new THREE.PlaneGeometry(11.4, 12),
    new THREE.MeshBasicMaterial({ color: 0xff2038, transparent: true, opacity: 0.34, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  (barrier as any).userData.noOutline = true;
  barrier.position.set(0, gy + 6.4, 152);
  const gateLight = new THREE.PointLight(0xff2038, 40, 34, 2);
  gateLight.position.set(0, gy + 6, 148);
  gateGroup.add(pilL, pilR, lintel, runeL, runeR, barrier, gateLight);
  outlineGroup(pilL, 1.05); outlineGroup(pilR, 1.05); outlineGroup(lintel, 1.04);
  group.add(gateGroup);
  gateBlockers.push({ x: -4.5, z: 152, r: 4.6 }, { x: 0, z: 152, r: 4.6 }, { x: 4.5, z: 152, r: 4.6 });

  // ── Arena: the Six Cosmic Entities (monoliths) ──
  const interactables: InteractSpot[] = [
    { id: 'sign_village', x: -140, z: -98, label: 'read', dialogue: 'sign_village' },
    { id: 'sign_forest', x: 58, z: -34, label: 'read', dialogue: 'sign_forest' },
    { id: 'sign_gate', x: 0, z: 138, label: 'read', dialogue: 'sign_gate' },
  ];
  const monoGeo = new THREE.BoxGeometry(2.2, 11, 1.4);
  const entityTints = [0xff5252, 0xffc14a, 0x53ff9e, 0x53c8ff, 0xa06bff, 0xff6bd8];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const x = ARENA.x + Math.cos(a) * 28, z = ARENA.z + Math.sin(a) * 28;
    if (Math.abs(((a + Math.PI / 2 + Math.PI * 3) % (Math.PI * 2)) - Math.PI) < 0.5) continue;
    const y = groundHeight(x, z);
    const m = new THREE.Mesh(monoGeo, toon(0x191b26));
    m.position.set(x, y + 5.2, z);
    m.rotation.y = -a + Math.PI / 2;
    const rune = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 8, 0.2),
      toon(entityTints[i], { emissive: entityTints[i], emissiveIntensity: 1.8 })
    );
    rune.position.set(x + Math.sin(a) * -1.3 * 0 + Math.cos(a + Math.PI / 2) * 0, y + 5.2, z);
    // place the rune on the inward face
    rune.position.set(x - Math.cos(a) * 0.78, y + 5.2, z - Math.sin(a) * 0.78);
    rune.rotation.y = -a + Math.PI / 2;
    const pl = new THREE.PointLight(entityTints[i], 8, 15, 2);
    pl.position.set(x, y + 6, z);
    outlineGroup(m, 1.05);
    group.add(m, rune, pl);
    colliders.push({ x, z, r: 1.9 });
    if (i === 4) interactables.push({ id: 'monolith', x, z, label: 'entity', dialogue: 'monolith' });
  }
  // arena floor glyph ring
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(16, 0.22, 6, 48),
    toon(0x8a4bff, { emissive: 0x6a2bff, emissiveIntensity: 1.4 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.set(ARENA.x, groundHeight(ARENA.x, ARENA.z) + 0.12, ARENA.z);
  (ring as any).userData.noOutline = true;
  group.add(ring);

  // ── Death pits (forest cracks) ──
  const pitDefs = [{ x: 88, z: 30 }, { x: -58, z: 74 }, { x: 36, z: -108 }];
  for (const p of pitDefs) {
    const y = groundHeight(p.x, p.z);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(2.4, 12), new THREE.MeshBasicMaterial({ color: 0x04050a }));
    disc.rotation.x = -Math.PI / 2;
    disc.position.set(p.x, y + 0.06, p.z);
    (disc as any).userData.noOutline = true;
    const rim2 = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.14, 5, 14), toon(0x2a2c38));
    rim2.rotation.x = Math.PI / 2;
    rim2.position.set(p.x, y + 0.08, p.z);
    group.add(disc, rim2);
    holes.push({ x: p.x, z: p.z, r: 2.0 });
  }

  // ── Item + spawn data ──
  const keySpots: ItemSpot[] = [
    { id: 0, x: 118, z: 55 },     // forest hill summit
    { id: 1, x: 152, z: -28 },    // NE hill
    { id: 2, x: -128, z: 42 },    // west hill
    { id: 3, x: 96, z: 90 },      // forest clearing
    { id: 4, x: 66, z: -52 },     // forest edge
    { id: 5, x: 168, z: 42 },     // deep forest
    { id: 6, x: -196, z: -30 },   // west beach
    { id: 7, x: 84, z: -168 },    // south-east beach
    { id: 8, x: -34, z: 158 },    // atop gate cliff L (reachable sides)
    { id: 9, x: -20, z: -128 },   // south rise
    { id: 10, x: -176, z: -108 }, // behind elder hut
    { id: 11, x: 30, z: 90 },     // mid ruins
    { id: 12, x: 96, z: 24 },     // near a death pit (risk!)
  ];
  const heartSpots: ItemSpot[] = [
    { id: 100, x: 182, z: 80 },
    { id: 101, x: -208, z: 12 },
    { id: 102, x: 40, z: 148 },
    { id: 103, x: -8, z: -176 },
    { id: 104, x: -152, z: -88.6 }, // on the well… risky jump, tiny offset
  ];
  const stoneSpots: { x: number; z: number }[] = [];
  for (let i = 0; i < 28; i++) {
    const x = 55 + rand() * 150, z = -70 + rand() * 175;
    if (Math.hypot(x - ARENA.x, z - ARENA.z) < 48) { i--; continue; }
    if (groundHeight(x, z) < 3) { i--; continue; }
    stoneSpots.push({ x, z });
  }
  for (let i = 0; i < 14; i++) {
    const a = rand() * Math.PI * 2, rr = 150 + rand() * 65;
    const x = Math.cos(a) * rr, z = Math.sin(a) * rr;
    if (groundHeight(x, z) < 2) { i--; continue; }
    stoneSpots.push({ x, z });
  }
  const slacheSpawns: { x: number; z: number }[] = [];
  for (let i = 0; i < 14; i++) {
    const x = 60 + rand() * 130, z = -60 + rand() * 150;
    if (Math.hypot(x - ARENA.x, z - ARENA.z) < 50) { i--; continue; }
    if (groundHeight(x, z) < 3) { i--; continue; }
    slacheSpawns.push({ x, z });
  }
  slacheSpawns.push({ x: 40, z: -40 }, { x: -40, z: 60 });

  const npcs: NpcSpot[] = [
    { id: 'elder', name: 'Voahangy', x: -166, z: -91, rot: 2.2, kind: 'elder' },
    { id: 'mira', name: 'Mira', x: -149, z: -85, rot: -0.6, kind: 'mira' },
    { id: 'tovo', name: 'Tovo', x: -142, z: -104, rot: 0.8, kind: 'tovo' },
    { id: 'anja', name: 'Anja', x: -157, z: -79, rot: 0.2, kind: 'anja' },
  ];

  scene.add(group);

  return {
    group, colliders, holes, gateLight, gateBarrier: barrier, gateBlockers,
    arena: { ...ARENA },
    spawn: { x: -152, z: -96 },
    keySpots, heartSpots, stoneSpots, slacheSpawns, npcs, interactables,
    gate: { x: 0, z: 152 },
    lanternLights,
  };
}
