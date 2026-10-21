// SDFAKER RIAN — smoke test (no WebGL: world gen, entities, i18n, saves)
import * as THREE from 'three';
import { STR, DIALOGUES } from '../src/game/i18n';
import { buildWorld, groundHeight } from '../src/game/world';
import { buildKya, buildSlache, buildBoss, buildKeyItem, buildStoneItem, buildHeartItem, buildVillager, animateKya } from '../src/game/entities';

// minimal browser stubs for store/audio imports
(globalThis as any).localStorage = (() => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
})();
(globalThis as any).window = { AudioContext: undefined, setInterval, setTimeout, clearInterval, clearTimeout, innerWidth: 800, innerHeight: 600, devicePixelRatio: 1, addEventListener: () => {}, removeEventListener: () => {} };

let failures = 0;
const check = (name: string, cond: boolean) => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}`);
  if (!cond) failures++;
};

// 1. i18n parity
const frKeys = Object.keys(STR.fr).sort();
const enKeys = Object.keys(STR.en).sort();
check('i18n FR/EN key parity', JSON.stringify(frKeys) === JSON.stringify(enKeys));
const dlgFr = Object.keys(DIALOGUES.fr).sort();
const dlgEn = Object.keys(DIALOGUES.en).sort();
check('dialogue FR/EN id parity', JSON.stringify(dlgFr) === JSON.stringify(dlgEn));
check('dialogues non-empty', dlgFr.every((k) => DIALOGUES.fr[k].length > 0));

// 2. terrain sanity
const samples = [
  ['village', -152, -92, 6.2],
  ['gate pass', 0, 152, 7.2],
  ['arena center', 0, 196, 6.4],
  ['beach far', 230, 0, NaN],
];
for (const [name, x, z, expect] of samples as any[]) {
  const h = groundHeight(x, z);
  const ok = Number.isFinite(h) && (Number.isNaN(expect) ? h < 3.5 : Math.abs(h - expect) < 2.5);
  check(`groundHeight ${name} = ${h.toFixed(2)}`, ok);
}
check('forest hill is a climbable summit', groundHeight(118, 55) > 12 && groundHeight(118, 55) < 26);
// arena rim should be higher than center except gap
const rimH = groundHeight(42, 196);
const cenH = groundHeight(0, 196);
check(`arena rim (${rimH.toFixed(1)}) > centre (${cenH.toFixed(1)})`, rimH > cenH + 4);
const gapH = groundHeight(0, 160);
check('arena south gap stays passable', gapH < 12);

// 3. world build (uses real three objects, no renderer)
const scene = new THREE.Scene();
const w = buildWorld(scene);
check('world children > 10', w.group.children.length > 10);
check('13 hidden key spots', w.keySpots.length === 13);
check('5 heart spots', w.heartSpots.length === 5);
check('stone spots >= 36', w.stoneSpots.length >= 36);
check('slache spawns >= 15', w.slacheSpawns.length >= 15);
check('3 death pits', w.holes.length === 3);
check('4 npcs', w.npcs.length === 4);
check('gate blockers armed', w.gateBlockers.length === 3);

// key spots reachable & above water
check('key spots on land', w.keySpots.every((k) => groundHeight(k.x, k.z) > 2.2));
check('heart spots on land', w.heartSpots.every((k) => groundHeight(k.x, k.z) > 2.0));
check('npc spots dry', w.npcs.every((n) => groundHeight(n.x, n.z) > 2.0));

// 4. entity builders + animation frame
const kya = buildKya();
for (let i = 0; i < 5; i++) animateKya(kya, { t: i * 0.33, speed: 1, attackT: i / 5, grounded: i % 2 === 0, vy: 2 });
let kyaParts = 0;
kya.group.traverse(() => kyaParts++);
check('kya builds + animates', kyaParts > 15);
check('slache builds', buildSlache().group.children.length > 3);
check('boss builds (4x Kya presence)', buildBoss().shards.length === 8);
check('items build', buildKeyItem().children.length > 0 && buildStoneItem().children.length > 0 && buildHeartItem().children.length > 0);
check('villagers build', (['elder', 'mira', 'tovo', 'anja'] as const).every((k) => buildVillager(k).children.length > 2));

scene.updateMatrixWorld(true);
check('scene graph updates', true);

console.log(failures === 0 ? '\nALL SMOKE TESTS PASSED' : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
