// ─────────────────────────────────────────────────────────────
// SDFAKER RIAN — Cel-shading toolkit (anime low-poly look)
// ─────────────────────────────────────────────────────────────
import * as THREE from 'three';

let gradientMap: THREE.DataTexture | null = null;

/** 4-step luminance ramp used by every MeshToonMaterial. */
export function getGradientMap(): THREE.DataTexture {
  if (gradientMap) return gradientMap;
  const data = new Uint8Array([70, 130, 195, 255]);
  gradientMap = new THREE.DataTexture(data, 4, 1, THREE.RedFormat);
  gradientMap.minFilter = THREE.NearestFilter;
  gradientMap.magFilter = THREE.NearestFilter;
  gradientMap.needsUpdate = true;
  return gradientMap;
}

const matCache = new Map<string, THREE.MeshToonMaterial>();

export interface ToonOpts {
  emissive?: number;
  emissiveIntensity?: number;
  flat?: boolean;
  vertexColors?: boolean;
  transparent?: boolean;
  opacity?: number;
}

export function toon(color: number, opts: ToonOpts = {}): THREE.MeshToonMaterial {
  const key = `${color}|${opts.emissive ?? 0}|${opts.emissiveIntensity ?? 0}|${opts.flat ? 1 : 0}|${opts.vertexColors ? 1 : 0}|${opts.transparent ? 1 : 0}|${opts.opacity ?? 1}`;
  const cached = matCache.get(key);
  if (cached) return cached;
  const m = new THREE.MeshToonMaterial({
    color,
    gradientMap: getGradientMap(),
    vertexColors: opts.vertexColors ?? false,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
  });
  (m as any).flatShading = opts.flat ?? true;
  m.needsUpdate = true;
  if (opts.emissive !== undefined) {
    m.emissive = new THREE.Color(opts.emissive);
    m.emissiveIntensity = opts.emissiveIntensity ?? 1;
  }
  matCache.set(key, m);
  return m;
}

const outlineMat = new THREE.MeshBasicMaterial({ color: 0x05060c, side: THREE.BackSide, fog: true });

/** Classic inverted-hull black outline, added as a slightly fatter child. */
export function outline<T extends THREE.Mesh>(mesh: T, scale = 1.06): T {
  const o = new THREE.Mesh(mesh.geometry, outlineMat);
  o.scale.setScalar(scale);
  o.renderOrder = -1;
  mesh.add(o);
  return mesh;
}

/** Apply outline to every mesh of a group (skips beams / additive fx). Safe: collected first, added after. */
export function outlineGroup(g: THREE.Object3D, scale = 1.06) {
  const targets: THREE.Mesh[] = [];
  g.traverse((c) => {
    const m = c as THREE.Mesh;
    if (!(m as any).isMesh) return;
    if ((m as any).userData.noOutline) return;
    if ((m as any).userData.__outlined) return;
    const mat = m.material as THREE.Material | undefined;
    if (mat && mat.transparent) return;
    targets.push(m);
  });
  for (const m of targets) {
    (m as any).userData.__outlined = true;
    const o = new THREE.Mesh(m.geometry, outlineMat);
    o.scale.setScalar(scale);
    o.renderOrder = -1;
    (o as any).userData.noOutline = true;
    m.add(o);
  }
}

/** Cheap circular blob shadow (anime games swear by it). */
const blobGeo = new THREE.CircleGeometry(1, 20);
const blobMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.34, depthWrite: false });
export function blobShadow(radius: number): THREE.Mesh {
  const m = new THREE.Mesh(blobGeo, blobMat);
  m.rotation.x = -Math.PI / 2;
  m.scale.setScalar(radius);
  m.position.y = 0.07;
  m.renderOrder = 1;
  (m as any).userData.noOutline = true;
  return m;
}

/** Smoothstep helper reused across the codebase. */
export const smoothstep = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** Deterministic RNG so the island is always the same. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
