// ─────────────────────────────────────────────────────────────
// SDFAKER RIAN — Storm: rain streaks + GLSL sky dome + lightning
// ─────────────────────────────────────────────────────────────
import * as THREE from 'three';
import { lerp } from './toon';

const SKY_VERT = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = vec4(p.x, p.y, p.w * 0.99999, p.w);
}
`;

const SKY_FRAG = /* glsl */ `
varying vec3 vDir;
uniform float uTime;
uniform float uClear;   // 0 = eternal rain, 1 = the sun returns
uniform vec3 uSunDir;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1,0)), u.x),
             mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.55;
  for (int i = 0; i < 3; i++){ v += a * noise(p); p *= 2.1; a *= 0.5; }
  return v;
}
void main() {
  vec3 d = normalize(vDir);
  float h = clamp(d.y, -0.08, 1.0);
  // storm palette
  vec3 stormTop = vec3(0.055, 0.075, 0.115);
  vec3 stormHor = vec3(0.16, 0.19, 0.25);
  // liberated palette
  vec3 sunTop = vec3(0.28, 0.5, 0.78);
  vec3 sunHor = vec3(0.96, 0.83, 0.6);
  vec3 top = mix(stormTop, sunTop, uClear);
  vec3 hor = mix(stormHor, sunHor, uClear);
  vec3 col = mix(hor, top, pow(clamp(h * 1.6 + 0.12, 0.0, 1.0), 0.8));
  // crawling clouds
  vec2 uv = d.xz / (abs(d.y) + 0.18);
  float cl = fbm(uv * 1.4 + vec2(uTime * 0.016, uTime * 0.005));
  float cover = mix(0.72, 0.18, uClear);
  float cloud = smoothstep(1.0 - cover, 1.0 - cover + 0.42, cl) * smoothstep(-0.02, 0.25, d.y);
  vec3 cloudCol = mix(vec3(0.05, 0.06, 0.09), vec3(1.0, 0.97, 0.9), uClear);
  col = mix(col, cloudCol, cloud * mix(0.85, 0.5, uClear));
  // sun disc + halo
  float s = max(dot(d, normalize(uSunDir)), 0.0);
  float disc = smoothstep(0.9993, 0.9998, s);
  float halo = pow(s, 24.0) * 0.5 + pow(s, 220.0) * 0.7;
  col += vec3(1.0, 0.9, 0.7) * (disc * 1.4 + halo) * uClear;
  // faint bruised glow near horizon during storm
  col += vec3(0.10, 0.05, 0.13) * (1.0 - uClear) * pow(1.0 - abs(d.y), 5.0);
  gl_FragColor = vec4(col, 1.0);
}
`;

export class Storm {
  group = new THREE.Group();
  sky: THREE.Mesh;
  skyMat: THREE.ShaderMaterial;
  private rain: THREE.LineSegments;
  private rainGeo: THREE.BufferGeometry;
  private rainMat: THREE.LineBasicMaterial;
  private drops: Float32Array; // x,y,z per streak top
  private speeds: Float32Array;
  private count: number;
  private maxCount: number;
  clear = 0; // 0 storm → 1 sunny
  private flash = 0;
  ambient: THREE.AmbientLight;
  hemi: THREE.HemisphereLight;
  sun: THREE.DirectionalLight;

  constructor(scene: THREE.Scene, rainCount: number) {
    this.maxCount = rainCount;
    this.count = rainCount;

    // --- sky dome ---
    this.skyMat = new THREE.ShaderMaterial({
      vertexShader: SKY_VERT,
      fragmentShader: SKY_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uClear: { value: 0 },
        uSunDir: { value: new THREE.Vector3(0.35, 0.5, -0.6) },
      },
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(430, 24, 14), this.skyMat);
    this.sky.frustumCulled = false;
    this.group.add(this.sky);

    // --- rain streaks (line segments around the camera) ---
    this.rainGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(this.maxCount * 6);
    this.drops = new Float32Array(this.maxCount * 3);
    this.speeds = new Float32Array(this.maxCount);
    for (let i = 0; i < this.maxCount; i++) {
      this.drops[i * 3] = (Math.random() - 0.5) * 64;
      this.drops[i * 3 + 1] = Math.random() * 40;
      this.drops[i * 3 + 2] = (Math.random() - 0.5) * 64;
      this.speeds[i] = 24 + Math.random() * 10;
    }
    this.rainGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.rainMat = new THREE.LineBasicMaterial({ color: 0xa9bedd, transparent: true, opacity: 0.30, fog: true });
    this.rain = new THREE.LineSegments(this.rainGeo, this.rainMat);
    this.rain.frustumCulled = false;
    (this.rain as any).userData.noOutline = true;
    this.group.add(this.rain);

    // --- lights ---
    this.hemi = new THREE.HemisphereLight(0x5d6b85, 0x23262e, 0.95);
    this.ambient = new THREE.AmbientLight(0x3a4256, 0.55);
    this.sun = new THREE.DirectionalLight(0xbcc8e2, 1.05);
    this.sun.position.set(60, 110, -40);
    scene.add(this.hemi, this.ambient, this.sun);
    scene.add(this.group);
  }

  setQuality(n: number) {
    this.maxCount = n;
    this.count = Math.min(this.count, n);
  }

  /** Triggered by the AudioManager's thunder. */
  doFlash() { this.flash = 1; }

  setIntensity(f: number) {
    this.count = Math.floor(this.maxCount * f);
    this.rainMat.opacity = 0.30 * f;
  }

  update(dt: number, t: number, camPos: THREE.Vector3, fog: THREE.FogExp2) {
    // sky
    this.skyMat.uniforms.uTime.value = t;
    this.skyMat.uniforms.uClear.value = this.clear;
    this.sky.position.set(camPos.x, 0, camPos.z);
    this.rain.position.set(camPos.x, 0, camPos.z);

    // rain fall + wrap
    const posAttr = this.rainGeo.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < this.count; i++) {
      const ix = i * 3;
      let y = this.drops[ix + 1] - this.speeds[i] * dt;
      if (y < 0) {
        y = 34 + Math.random() * 6;
        this.drops[ix] = (Math.random() - 0.5) * 64;
        this.drops[ix + 2] = (Math.random() - 0.5) * 64;
      }
      this.drops[ix + 1] = y;
      const x = this.drops[ix], z = this.drops[ix + 2];
      const len = 0.7 + this.speeds[i] * 0.016;
      posAttr.setXYZ(i * 2, x, y, z);
      posAttr.setXYZ(i * 2 + 1, x - 0.09, y + len, z);
    }
    this.rainGeo.setDrawRange(0, this.count * 2);
    posAttr.needsUpdate = true;

    // lightning flash decay → ambient spike + fog brightening
    this.flash = Math.max(0, this.flash - dt * 3.2);
    const f = this.flash * this.flash;
    const c = this.clear;
    this.hemi.intensity = lerp(0.95 + f * 2.2, 1.7, c);
    this.ambient.intensity = lerp(0.55 + f * 1.3, 0.75, c);
    this.sun.intensity = lerp(1.05 + f * 2.4, 2.6, c);
    (this.sun.color as THREE.Color).setHex(0xbcc8e2).lerp(new THREE.Color(0xfff1d6), c);
    (this.hemi.color as THREE.Color).setHex(0x5d6b85).lerp(new THREE.Color(0x9ec2ee), c);
    fog.density = lerp(0.0105, 0.0035, c);
    (fog.color as THREE.Color).setHex(0x141a26).lerp(new THREE.Color(0x9fc0e6), c);
  }
}
