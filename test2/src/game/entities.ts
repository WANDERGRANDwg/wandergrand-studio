// ─────────────────────────────────────────────────────────────
// SDFAKER RIAN — Procedural characters & items (anime low-poly)
// ─────────────────────────────────────────────────────────────
import * as THREE from 'three';
import { toon, outline, outlineGroup, blobShadow, clamp } from './toon';

// ── Palette Kya ──
const SKIN = 0x8a5a3b;
const OUTFIT = 0x232a3a;
const TRIM = 0x3fa8a0;
const HAIR = 0xe8ecf6;
const CAPE = 0xc21725;

export interface KyaRefs {
  group: THREE.Group;
  hips: THREE.Group;
  legL: THREE.Mesh;
  legR: THREE.Mesh;
  armL: THREE.Group;
  armR: THREE.Group;      // sword arm pivot
  cape: THREE.Mesh;
  capeBase: Float32Array;
  head: THREE.Mesh;
  sword: THREE.Group;
}

export function buildKya(): KyaRefs {
  const group = new THREE.Group();
  const hips = new THREE.Group();
  hips.position.y = 0.92;
  group.add(hips);

  const pelvis = outline(new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.2, 0.22), toon(OUTFIT)));
  pelvis.position.y = 0;
  hips.add(pelvis);

  // legs
  const legGeo = new THREE.BoxGeometry(0.11, 0.5, 0.13);
  legGeo.translate(0, -0.25, 0);
  const legL = outline(new THREE.Mesh(legGeo, toon(0x1a2030)));
  legL.position.set(-0.1, -0.06, 0);
  const legR = outline(new THREE.Mesh(legGeo.clone(), toon(0x1a2030)));
  legR.position.set(0.1, -0.06, 0);
  hips.add(legL, legR);
  const bootGeo = new THREE.BoxGeometry(0.12, 0.14, 0.2);
  bootGeo.translate(0, -0.52, 0.03);
  const bootL = outline(new THREE.Mesh(bootGeo, toon(0x141824)));
  bootL.position.set(-0.1, -0.06, 0);
  const bootR = outline(new THREE.Mesh(bootGeo.clone(), toon(0x141824)));
  bootR.position.set(0.1, -0.06, 0);
  hips.add(bootL, bootR);

  // torso
  const torso = outline(new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.42, 0.24), toon(OUTFIT)));
  torso.position.y = 0.34;
  hips.add(torso);
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.07, 0.26), toon(TRIM, { emissive: TRIM, emissiveIntensity: 0.25 }));
  belt.position.y = 0.12;
  hips.add(belt);
  const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.055, 6, 10), toon(CAPE));
  scarf.position.y = 0.56;
  scarf.rotation.x = Math.PI / 2;
  hips.add(scarf);

  // head + hair
  const headGroup = new THREE.Group();
  headGroup.position.y = 0.72;
  const head = outline(new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), toon(SKIN)));
  head.position.y = 0.08;
  headGroup.add(head);
  const hair = outline(new THREE.Mesh(new THREE.SphereGeometry(0.185, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.62), toon(HAIR)));
  hair.position.set(0, 0.1, -0.015);
  hair.rotation.x = -0.35;
  headGroup.add(hair);
  // side-swept anime fringe
  const fringe = outline(new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.22, 5), toon(HAIR)));
  fringe.position.set(0.09, 0.045, 0.13);
  fringe.rotation.set(0.5, 0, -0.4);
  headGroup.add(fringe);
  const tail = outline(new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.34, 5), toon(HAIR)));
  tail.position.set(-0.05, -0.12, -0.14);
  tail.rotation.x = 2.7;
  headGroup.add(tail);
  // eyes
  const eyeGeo = new THREE.PlaneGeometry(0.035, 0.05);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0c0e14 });
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat); (eyeL as any).userData.noOutline = true;
  eyeL.position.set(-0.062, 0.075, 0.163);
  const eyeR = eyeL.clone(); eyeR.position.x = 0.062;
  headGroup.add(eyeL, eyeR);
  hips.add(headGroup);

  // arms
  const armGeo = new THREE.BoxGeometry(0.09, 0.42, 0.1);
  armGeo.translate(0, -0.18, 0);
  const armL = new THREE.Group();
  armL.position.set(-0.24, 0.5, 0);
  const armLMesh = outline(new THREE.Mesh(armGeo, toon(SKIN)));
  armL.add(armLMesh);
  hips.add(armL);

  const armR = new THREE.Group();
  armR.position.set(0.24, 0.5, 0);
  const armRMesh = outline(new THREE.Mesh(armGeo.clone(), toon(SKIN)));
  armR.add(armRMesh);
  hips.add(armR);

  // ── The sword (Elder guardian blade) ──
  const sword = new THREE.Group();
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.92, 0.016), toon(0xd7dde8, { emissive: 0x8a97ad, emissiveIntensity: 0.35 }));
  (blade as any).userData.noOutline = true;
  blade.position.y = -0.62;
  const bladeO = new THREE.Mesh(blade.geometry, new THREE.MeshBasicMaterial({ color: 0x05060c, side: THREE.BackSide }));
  (bladeO as any).userData.noOutline = true;
  bladeO.scale.set(1.7, 1.02, 1.7);
  blade.add(bladeO);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.038, 0.12, 4), toon(0xd7dde8));
  tip.position.y = -1.14;
  tip.rotation.x = Math.PI;
  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.035, 0.05), toon(0xc9a24a, { emissive: 0x8a6a20, emissiveIntensity: 0.4 }));
  guard.position.y = -0.15;
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.023, 0.026, 0.17, 5), toon(0x3a2a20));
  grip.position.y = -0.05;
  sword.add(blade, tip, guard, grip);
  sword.position.set(0, -0.38, 0.02);
  sword.rotation.x = Math.PI; // blade up when idle
  armR.add(sword);

  // ── The red cape (vertex-animated in updateKya) ──
  const capeGeo = new THREE.PlaneGeometry(0.52, 0.86, 5, 7);
  const cape = new THREE.Mesh(capeGeo, toon(CAPE, { flat: false }));
  (cape.material as THREE.MeshToonMaterial).side = THREE.DoubleSide;
  cape.position.set(0, 0.34, -0.16);
  const capeBase = (capeGeo.getAttribute('position') as THREE.BufferAttribute).array.slice() as Float32Array;
  hips.add(cape);

  group.add(blobShadow(0.55));
  return { group, hips, legL, legR, armL, armR, cape, capeBase, head, sword };
}

export interface KyaAnim {
  t: number;
  speed: number;        // 0 idle … 1 run
  attackT: number;      // -1 idle, else 0..1 swing progress
  grounded: boolean;
  vy: number;
}

export function animateKya(k: KyaRefs, a: KyaAnim) {
  const run = Math.sin(a.t * 11) * a.speed;
  k.legL.rotation.x = run * 0.85;
  k.legR.rotation.x = -run * 0.85;
  k.armL.rotation.x = -run * 0.7;
  k.hips.position.y = 0.92 + Math.abs(Math.cos(a.t * 11)) * 0.05 * a.speed + Math.sin(a.t * 2.2) * 0.012;
  k.hips.rotation.x = a.speed * 0.12 + (a.grounded ? 0 : clamp(-a.vy * 0.02, -0.3, 0.35));

  // sword arm: idle / run sway / attack arc
  if (a.attackT >= 0) {
    const p = a.attackT;
    const wind = p < 0.35 ? p / 0.35 : 1;
    const strike = p < 0.35 ? 0 : (p - 0.35) / 0.65;
    k.armR.rotation.x = -2.4 * wind + 3.4 * strike;
    k.armR.rotation.z = 0.5 * wind - 0.9 * strike;
    k.sword.rotation.x = Math.PI / 2;
    k.hips.rotation.y = -0.55 * wind + 0.95 * strike;
  } else {
    k.armR.rotation.x = run * 0.7 + Math.sin(a.t * 2.2) * 0.06;
    k.armR.rotation.z = 0.12;
    k.sword.rotation.x = Math.PI + Math.sin(a.t * 2.2) * 0.04;
    k.hips.rotation.y = 0;
  }

  // cape wave (CPU vertex anim, cheap at 48 verts)
  const pos = k.cape.geometry.getAttribute('position') as THREE.BufferAttribute;
  const n = pos.count;
  for (let i = 0; i < n; i++) {
    const bx = k.capeBase[i * 3], by = k.capeBase[i * 3 + 1];
    const fall = (0.43 - (by + 0.43)) / 0.86; // 0 top → 1 bottom
    const sway = Math.sin(a.t * 3.1 + bx * 4 + fall * 5) * 0.06 * fall;
    const billow = (Math.sin(a.t * 2.3 + fall * 3.2) * 0.08 + a.speed * 0.22) * fall;
    pos.setXYZ(i, bx + sway, by, -billow - fall * 0.06);
  }
  pos.needsUpdate = true;
  k.cape.geometry.computeVertexNormals();
  k.cape.rotation.x = 0.18 + a.speed * 0.28 + (a.grounded ? 0 : 0.5);
}

// ── Slache (forest fiend) ──
export interface SlacheRefs {
  group: THREE.Group;
  body: THREE.Mesh;
  eyeL: THREE.Mesh;
  eyeR: THREE.Mesh;
  spikes: THREE.Mesh[];
}
export function buildSlache(): SlacheRefs {
  const group = new THREE.Group();
  const body = outline(new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 0), toon(0x35224a)), 1.09);
  body.position.y = 0.52;
  group.add(body);
  const spikes: THREE.Mesh[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const sp = outline(new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.42, 4), toon(0x1d1130)), 1.12);
    sp.position.set(Math.cos(a) * 0.42, 0.72, Math.sin(a) * 0.42);
    sp.rotation.set(Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9);
    body.add(sp);
    sp.position.y = 0.2;
    spikes.push(sp);
  }
  const eyeGeo = new THREE.CircleGeometry(0.07, 8);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffe9f2 });
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat); (eyeL as any).userData.noOutline = true;
  eyeL.position.set(-0.16, 0.58, 0.44);
  const eyeR = eyeL.clone(); eyeR.position.x = 0.16;
  const pupilGeo = new THREE.CircleGeometry(0.03, 6);
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0xd61f3c });
  const pL = new THREE.Mesh(pupilGeo, pupilMat); pL.position.z = 0.005; (pL as any).userData.noOutline = true;
  const pR = pL.clone();
  eyeL.add(pL); eyeR.add(pR);
  group.add(eyeL, eyeR);
  group.add(blobShadow(0.55));
  return { group, body, eyeL, eyeR, spikes };
}

// ── Villagers ──
export function buildVillager(kind: 'elder' | 'mira' | 'tovo' | 'anja'): THREE.Group {
  const g = new THREE.Group();
  const robes = { elder: 0xdad3c2, mira: 0xd8732e, tovo: 0x4a7a4e, anja: 0xd8b23a }[kind];
  const skin = { elder: 0x6e4630, mira: 0x8a5a3b, tovo: 0x5a3423, anja: 0x8a5a3b }[kind];
  const scale = kind === 'anja' ? 0.66 : kind === 'elder' ? 1.02 : 0.95;
  const robe = outline(new THREE.Mesh(new THREE.ConeGeometry(0.34, 1.06, 7), toon(robes)));
  robe.position.y = 0.53;
  const head = outline(new THREE.Mesh(new THREE.SphereGeometry(0.16, 9, 7), toon(skin)));
  head.position.y = 1.18;
  g.add(robe, head);
  // eyes
  const eyeGeo = new THREE.PlaneGeometry(0.03, 0.045);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0c0e14 });
  const eL = new THREE.Mesh(eyeGeo, eyeMat); eL.position.set(-0.055, 1.18, 0.152); (eL as any).userData.noOutline = true;
  const eR = eL.clone(); eR.position.x = 0.055;
  g.add(eL, eR);
  if (kind === 'elder') {
    const hood = outline(new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.4, 7), toon(0xbab2a0)));
    hood.position.y = 1.34;
    const staff = outline(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 1.6, 5), toon(0x5a4230)));
    staff.position.set(0.32, 0.8, 0.1);
    const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.09), toon(0x53c8ff, { emissive: 0x53c8ff, emissiveIntensity: 1.6 }));
    orb.position.set(0.32, 1.66, 0.1);
    g.add(hood, staff, orb);
  }
  if (kind === 'mira') {
    const satchel = outline(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.12), toon(0x6b5638)));
    satchel.position.set(-0.26, 0.62, 0.14);
    g.add(satchel);
  }
  g.scale.setScalar(scale);
  g.add(blobShadow(0.42));
  return g;
}

// ── L'ÉCLICOSMIQUE (final boss, 4× Kya) ──
export interface BossRefs {
  group: THREE.Group;
  core: THREE.Mesh;
  eye: THREE.Group;
  iris: THREE.Mesh;
  ringA: THREE.Mesh;
  ringB: THREE.Mesh;
  shards: THREE.Mesh[];
  glow: THREE.PointLight;
  cracks: THREE.LineSegments;
}
export function buildBoss(): BossRefs {
  const group = new THREE.Group();
  const core = outline(new THREE.Mesh(new THREE.IcosahedronGeometry(2.1, 1), toon(0x1a1030)), 1.045);
  group.add(core);
  // glowing crack cage
  const edges = new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(2.16, 1));
  const cracks = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xb040ff, transparent: true, opacity: 0.85 }));
  (cracks as any).userData.noOutline = true;
  group.add(cracks);
  // the Eye
  const eye = new THREE.Group();
  const white = new THREE.Mesh(new THREE.SphereGeometry(0.85, 14, 10), toon(0xf2ecff, { emissive: 0xcabfff, emissiveIntensity: 0.7, flat: false }));
  const iris = new THREE.Mesh(new THREE.CircleGeometry(0.42, 16), new THREE.MeshBasicMaterial({ color: 0xd61f3c }));
  (iris as any).userData.noOutline = true;
  iris.position.z = 0.74;
  const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.18, 12), new THREE.MeshBasicMaterial({ color: 0x0a0010 }));
  (pupil as any).userData.noOutline = true;
  pupil.position.z = 0.75;
  eye.add(white, iris, pupil);
  eye.position.z = 1.55;
  group.add(eye);
  // orbiting rings + shards
  const ringA = new THREE.Mesh(new THREE.TorusGeometry(3.3, 0.12, 6, 40), toon(0x6a2bff, { emissive: 0x6a2bff, emissiveIntensity: 1.2 }));
  (ringA as any).userData.noOutline = true;
  const ringB = new THREE.Mesh(new THREE.TorusGeometry(4.1, 0.08, 5, 40), toon(0xd61f3c, { emissive: 0xd61f3c, emissiveIntensity: 1.0 }));
  (ringB as any).userData.noOutline = true;
  group.add(ringA, ringB);
  const shards: THREE.Mesh[] = [];
  for (let i = 0; i < 8; i++) {
    const s = outline(new THREE.Mesh(new THREE.TetrahedronGeometry(0.55), toon(0x2a1650)), 1.1);
    shards.push(s);
    group.add(s);
  }
  const glow = new THREE.PointLight(0x8a2bff, 60, 40, 1.8);
  glow.position.y = 1;
  group.add(glow);
  return { group, core, eye, iris, ringA, ringB, shards, glow, cracks };
}

// ── Items ──
export function buildKeyItem(): THREE.Group {
  const g = new THREE.Group();
  const bow = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.045, 6, 12), toon(0xffc14a, { emissive: 0xd89a20, emissiveIntensity: 1.2 }));
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.34, 5), toon(0xffc14a, { emissive: 0xd89a20, emissiveIntensity: 1.2 }));
  shaft.position.y = -0.28;
  const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.04), toon(0xffc14a, { emissive: 0xd89a20, emissiveIntensity: 1.2 }));
  tooth.position.set(0.06, -0.4, 0);
  g.add(bow, shaft, tooth);
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.34, 7, 8, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffc14a, transparent: true, opacity: 0.14, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
  );
  (beam as any).userData.noOutline = true;
  beam.position.y = 3.2;
  g.add(beam);
  return g;
}
export function buildStoneItem(): THREE.Group {
  const g = new THREE.Group();
  const c = outline(new THREE.Mesh(new THREE.OctahedronGeometry(0.22), toon(0x53c8ff, { emissive: 0x2a9adf, emissiveIntensity: 1.5 })), 1.12);
  g.add(c);
  return g;
}
export function buildHeartItem(): THREE.Group {
  const g = new THREE.Group();
  const c = outline(new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 0), toon(0xe0394b, { emissive: 0xb01030, emissiveIntensity: 1.4 })), 1.1);
  g.add(c);
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.4, 6, 8, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xe0394b, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
  );
  (beam as any).userData.noOutline = true;
  beam.position.y = 2.8;
  g.add(beam);
  return g;
}
