'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { WebSocketServer, WebSocket } = require('ws');

// Small .env loader so local development does not need an extra dotenv dependency.
function loadDotEnv(file = path.resolve('.env')) {
  try {
    if (!fs.existsSync(file)) return;
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const entry = trimmed.replace(/^export\s+/, '');
      const equals = entry.indexOf('=');
      if (equals < 1) continue;
      const key = entry.slice(0, equals).trim();
      let value = entry.slice(equals + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
      if (key && process.env[key] === undefined) process.env[key] = value;
    }
  } catch (err) {
    console.warn('[env] could not read .env:', err.message);
  }
}
loadDotEnv();

const PORT_VALUE = Number(process.env.PORT || 8080);
const PORT = Number.isInteger(PORT_VALUE) && PORT_VALUE > 0 && PORT_VALUE <= 65535 ? PORT_VALUE : 8080;
const MAX_PLAYERS_VALUE = Number.parseInt(process.env.MAX_PLAYERS || '32', 10);
const MAX_PLAYERS = Number.isFinite(MAX_PLAYERS_VALUE) ? Math.max(2, Math.min(64, MAX_PLAYERS_VALUE)) : 32;
const ADMIN_NAME_CODE = process.env.ADMIN_NAME_CODE || '';
const DATA_FILE = path.resolve(process.env.DATA_FILE || './data/server-data.json');
const ALLOWED_ORIGINS = String(process.env.ALLOWED_ORIGINS || 'https://wandergrandwg.github.io').split(',').map(s => s.trim()).filter(Boolean);
const DEFAULT_APP = Object.freeze({ gender: 'm', size: 'normal', body: '#2fbf4f' });
const NAME_RE = /^[A-Za-z0-9_-]{2,16}$/;
const DAY_CYCLE_MS = 20 * 60 * 1000;
const PREP_MS = 30_000;
const RELOAD_MS = 10_000;
const FIRE_COOLDOWN_MS = 280;

function loadRecord() {
  try {
    const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    return {
      score: Number.isSafeInteger(raw.score) && raw.score > 0 ? raw.score : 0,
      name: typeof raw.name === 'string' ? raw.name.slice(0, 16) : '',
      holderId: null
    };
  } catch {
    return { score: 0, name: '', holderId: null };
  }
}

let record = loadRecord();
let session = null;
let nextWeatherAt = 0;

function persistRecord() {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    const tmp = `${DATA_FILE}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify({ score: record.score, name: record.name }, null, 2));
    fs.renameSync(tmp, DATA_FILE);
  } catch (err) {
    console.error('[record] write failed:', err.message);
  }
}

// This is the same deterministic terrain function used by the browser build.
function hashGrid(x, z) {
  let n = (Math.imul(x, 374761393) ^ Math.imul(z, 668265263)) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
function smooth(a, b, x) {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
function noise(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = x - ix, fz = z - iz;
  const sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz);
  const a = hashGrid(ix, iz), b = hashGrid(ix + 1, iz);
  const c = hashGrid(ix, iz + 1), d = hashGrid(ix + 1, iz + 1);
  return a + (b - a) * sx + (c - a) * sz + (a - b - c + d) * sx * sz;
}
function octaveNoise(x, z, octaves = 3) {
  let sum = 0, amp = 0.5, freq = 1, total = 0;
  for (let i = 0; i < octaves; i++) {
    sum += noise(x * freq, z * freq) * amp;
    total += amp;
    amp *= 0.5;
    freq *= 2.03;
  }
  return sum / total;
}
function terrainHeight(x, z) {
  const ax = Math.abs(x), az = Math.abs(z);
  const radial = Math.sqrt(Math.sqrt(x*x*x*x + z*z*z*z)) + (octaveNoise(x * .006 + 11, z * .006 + 7, 2) - .5) * 60;
  const coast = 1 - smooth(205, 255, Math.max(ax, az));
  const hills = 9 * smooth(215, 275, radial) * (1 - smooth(325, 372, radial));
  let height = 2.6 + octaveNoise(x * .012, z * .012, 3) * hills + (octaveNoise(x * .07, z * .07, 2) - .5) * .35;
  height = height * (1 - coast) + 3 * coast;
  const rockyAreas = [
    [320, -60, 58], [-330, 90, 58], [40, 330, 58], [-60, -320, 58], [270, 250, 58], [-260, -250, 58]
  ];
  for (const [cx, cz, radius] of rockyAreas) {
    const d = Math.hypot(x - cx, z - cz);
    if (d < radius) {
      const blend = 1 - smooth(radius * .55, radius, d);
      height = height * (1 - blend) + 2.6 * blend;
    }
  }
  const shore = (455 - radial) * .035 - Math.max(0, radial - 480) * .15;
  return height * (1 - smooth(350, 385, radial)) + shore * smooth(350, 385, radial) - smooth(440, 485, Math.max(ax, az)) * 5;
}

function makeSession() {
  const now = Date.now();
  return {
    players: new Map(),
    names: new Map(),
    events: [],
    eventId: 0,
    createdAt: now,
    epoch: now,
    lastTick: now,
    weather: { kind: 'clear', rain: 0, cloud: .1, wind: .12, storm: 0, next: now + 90_000 },
    topKey: ''
  };
}
function emit(s, event) {
  s.events.push({ ...event, i: ++s.eventId });
  if (s.events.length > 400) s.events.splice(0, s.events.length - 300);
}
function safeApp(value) {
  const app = value && typeof value === 'object' ? value : {};
  const parts = {};
  for (const key of ['head','hair','torso','arms','hands','legs','feet','weapon','accessory']) {
    const color = app.parts && app.parts[key];
    if (typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color)) parts[key] = color;
  }
  return {
    gender: app.gender === 'f' ? 'f' : 'm',
    size: ['small','normal','large'].includes(app.size) ? app.size : 'normal',
    body: typeof app.body === 'string' && /^#[0-9a-f]{6}$/i.test(app.body) ? app.body : DEFAULT_APP.body,
    ...(Object.keys(parts).length ? { parts } : {})
  };
}
function releaseName(s, player) {
  if (player.name && s.names.get(player.name.toLowerCase()) === player.id) s.names.delete(player.name.toLowerCase());
  player.name = '';
  player.reserved = false;
}
function validName(name) {
  return typeof name === 'string' && NAME_RE.test(name.trim());
}
function safeEqual(a, b) {
  const aa = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}
function claimName(s, p, rawName, code) {
  const name = typeof rawName === 'string' ? rawName.trim() : '';
  if (!name) return { ok: false, err: 'empty' };
  if (name.length < 2) return { ok: false, err: 'short' };
  if (name.length > 16) return { ok: false, err: 'long' };
  if (!validName(name)) return { ok: false, err: 'chars' };
  const key = name.toLowerCase();
  if (key === 'jika' && !p.jikaOk) {
    if (!ADMIN_NAME_CODE || !safeEqual(code || '', ADMIN_NAME_CODE)) return { ok: false, err: 'code' };
    p.jikaOk = true;
  }
  const owner = s.names.get(key);
  if (owner && owner !== p.id) return { ok: false, err: 'taken' };
  if (p.reserved && p.name.toLowerCase() !== key) releaseName(s, p);
  p.name = name;
  p.reserved = true;
  s.names.set(key, p.id);
  p.lastSeen = Date.now();
  return { ok: true, name };
}
function randomDefaultName(s) {
  for (let i = 0; i < 100; i++) {
    const name = `Player${crypto.randomInt(100, 9999)}`;
    if (!s.names.has(name.toLowerCase())) return name;
  }
  return `P${Date.now().toString().slice(-8)}`;
}
function scaleOf(p) {
  return p.app.size === 'small' ? .85 : p.app.size === 'large' ? 1.18 : 1;
}
function nearCityWall(x, z) {
  const gateHalf = 9;
  const onXWall = Math.abs(Math.abs(x) - 201) < 2.5 && Math.abs(z) > gateHalf;
  const onZWall = Math.abs(Math.abs(z) - 201) < 2.5 && Math.abs(x) > gateHalf;
  return onXWall || onZWall;
}
function chooseSpawn(s, exceptId) {
  const candidates = [];
  const others = [...s.players.values()].filter(p => p.id !== exceptId && p.phase === 'playing');
  for (let i = 0; i < 80; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 245 + Math.random() * 165;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = terrainHeight(x, z);
    if (Math.abs(x) > 465 || Math.abs(z) > 465 || y < .55 || nearCityWall(x, z)) continue;
    if ([[320,-60,64],[-330,90,64],[40,330,64],[-60,-320,64],[270,250,64],[-260,-250,64]].some(([cx,cz,r]) => Math.hypot(x-cx,z-cz)<r)) continue;
    const nearest = others.reduce((d,p) => Math.min(d, Math.hypot(p.x-x,p.z-z)), 1e9);
    candidates.push({ x, y: y + .06, z, nearest });
  }
  candidates.sort((a,b) => b.nearest - a.nearest);
  const chosen = candidates.slice(0, Math.min(8, candidates.length));
  if (chosen.length) return chosen[crypto.randomInt(chosen.length)];
  const x = 360, z = 80;
  return { x, y: terrainHeight(x,z)+.06, z };
}
function spawnPlayer(s, p, reason) {
  const pos = chooseSpawn(s, p.id);
  p.x = pos.x; p.y = pos.y; p.z = pos.z;
  p.v = (p.v || 0) + 1;
  p.corrId = (p.corrId || 0) + 1;
  p.corr = { x:p.x, y:p.y, z:p.z, n:p.corrId, why:reason };
  emit(s, { t:'respawn', id:p.id, x:p.x, y:p.y, z:p.z });
}
function createPlayer(s) {
  const now = Date.now();
  const p = {
    id: crypto.randomUUID(), name:'', phase:'preparing', app:{...DEFAULT_APP}, v:0,
    x:330, y:terrainHeight(330,0)+.06, z:0, yaw:0, pitch:0, anim:'idle', aim:false, move:0,
    hp:10, ammo:10, heals:0, pending:0, reloadEnd:0, lastFire:0,
    score:0, scoreAt:now, joinedAt:now, lastSeen:now, prepEnd:now+PREP_MS,
    deadAt:0, reserved:false, jikaOk:false, corrId:0, corr:null, lastStateT:now
  };
  s.players.set(p.id,p);
  return p;
}
function startPlayer(s, p, name, app, code = '') {
  const claimed = claimName(s,p,name,code);
  if (!claimed.ok) return claimed;
  p.app = safeApp(app);
  p.v++;
  p.phase = 'playing'; p.hp = 10; p.ammo = 10; p.heals = 0; p.pending = 0;
  p.reloadEnd = 0; p.score = 0; p.scoreAt = Date.now(); p.killedBy = '';
  p.lastStateT = Date.now(); p.aim = false; p.move = 0; p.deadAt = 0;
  spawnPlayer(s,p,'spawn');
  emit(s,{t:'join',name:p.name});
  return { ok:true, name:p.name };
}
function killPlayer(s, victim, killer, head) {
  if (victim.phase !== 'playing') return;
  const victimName = victim.name;
  const killerName = killer ? killer.name : '';
  victim.phase = 'dead'; victim.deadAt = Date.now(); victim.hp = 0;
  victim.anim = 'dead'; victim.reloadEnd = 0; victim.score = 0;
  victim.killedBy = killerName;
  victim.aim = false; victim.move = 0;
  if (record.holderId === victim.id) record.holderId = null;
  releaseName(s,victim);
  if (killer && killer.phase === 'playing') {
    killer.score++;
    killer.scoreAt = Date.now();
    killer.pending = Math.min(2,killer.pending+1);
    if (killer.score > record.score) {
      record = { score:killer.score, name:killer.name, holderId:killer.id };
      persistRecord();
      emit(s,{t:'record',name:killer.name,score:killer.score});
    }
  }
  emit(s,{t:'kill',killer:killerName,victim:victimName,killerName,victimName,head:!!head,victimId:victim.id,killerId:killer ? killer.id : ''});
}
function raySphere(origin, dir, center, radius) {
  const ox=origin[0]-center[0], oy=origin[1]-center[1], oz=origin[2]-center[2];
  const b=ox*dir[0]+oy*dir[1]+oz*dir[2];
  const c=ox*ox+oy*oy+oz*oz-radius*radius;
  const h=b*b-c;
  if (h<0) return -1;
  const t=-b-Math.sqrt(h);
  return t>=0 ? t : (c<=0 ? 0 : -1);
}
function rayBody(origin,dir,p) {
  const r=.38*scaleOf(p), low=p.y+.12, high=p.y+1.42*scaleOf(p);
  const dx=dir[0], dz=dir[2], ox=origin[0]-p.x, oz=origin[2]-p.z;
  const a=dx*dx+dz*dz;
  let best=-1;
  if (a>1e-9) {
    const b=2*(ox*dx+oz*dz), c=ox*ox+oz*oz-r*r, disc=b*b-4*a*c;
    if (disc>=0) {
      const t=(-b-Math.sqrt(disc))/(2*a);
      const y=origin[1]+dir[1]*t;
      if (t>=0 && y>=low && y<=high) best=t;
    }
  }
  for (const y of [low,high]) {
    if (Math.abs(dir[1])<1e-9) continue;
    const t=(y-origin[1])/dir[1];
    if (t>=0) {
      const x=origin[0]+dx*t-p.x, z=origin[2]+dz*t-p.z;
      if (x*x+z*z<=r*r && (best<0 || t<best)) best=t;
    }
  }
  return best;
}
function rayAabb(origin,dir,box,maxDistance) {
  let lo=0, hi=maxDistance;
  const mins=[box.x0,box.y0,box.z0], maxs=[box.x1,box.y1,box.z1];
  for (let k=0;k<3;k++) {
    if (Math.abs(dir[k])<1e-9) { if (origin[k]<mins[k] || origin[k]>maxs[k]) return -1; continue; }
    let a=(mins[k]-origin[k])/dir[k], b=(maxs[k]-origin[k])/dir[k];
    if (a>b) [a,b]=[b,a];
    lo=Math.max(lo,a); hi=Math.min(hi,b);
    if (lo>hi) return -1;
  }
  return lo;
}
function cityWallBoxes() {
  const y0=-1, y1=18, half=201, thick=2;
  return [
    {x0:-half-thick,y0,z0:-half-thick,x1:-half,y1,z1:-9},
    {x0:-half-thick,y0,z0:9,x1:-half,y1,z1:half+thick},
    {x0:half,y0,z0:-half-thick,x1:half+thick,y1,z1:-9},
    {x0:half,y0,z0:9,x1:half+thick,y1,z1:half+thick},
    {x0:-half-thick,y0,z0:-half-thick,x1:-9,y1,z1:-half},
    {x0:9,y0,z0:-half-thick,x1:half+thick,y1,z1:-half},
    {x0:-half-thick,y0,z0:half,y1,z1:half+thick},
    {x0:9,y0,z0:half,x1:half+thick,y1,z1:half+thick}
  ];
}
const WALL_BOXES = cityWallBoxes();
function fireShot(s, shooter, act) {
  const now=Date.now();
  if (shooter.phase!=='playing' || shooter.reloadEnd || shooter.ammo<=0 || now-shooter.lastFire<FIRE_COOLDOWN_MS) return;
  if (!Array.isArray(act.o) || !Array.isArray(act.d) || act.o.length!==3 || act.d.length!==3) return;
  if ([...act.o,...act.d].some(v=>typeof v!=='number'||!Number.isFinite(v))) return;
  const length=Math.hypot(...act.d);
  if (length<.5 || length>2) return;
  const dir=act.d.map(v=>v/length);
  const eye=[shooter.x, shooter.y+1.62*scaleOf(shooter), shooter.z];
  const origin=Math.hypot(act.o[0]-eye[0],act.o[1]-eye[1],act.o[2]-eye[2])<6 ? act.o : eye;
  shooter.lastFire=now; shooter.ammo--;
  if (shooter.ammo===0) shooter.reloadEnd=now+RELOAD_MS;
  let nearest=400, kind='none', target=null, head=false;
  for (const box of WALL_BOXES) {
    const t=rayAabb(origin,dir,box,nearest);
    if (t>=0 && t<nearest) { nearest=t; kind='wall'; target=null; }
  }
  // Terrain blocks shots even where no building collider is present.
  for (let d=1.5; d<nearest; d+=2) {
    const x=origin[0]+dir[0]*d, y=origin[1]+dir[1]*d, z=origin[2]+dir[2]*d;
    if (y < Math.max(terrainHeight(x,z),0)) { nearest=d; kind='ground'; target=null; break; }
  }
  for (const p of s.players.values()) {
    if (p.id===shooter.id || p.phase!=='playing') continue;
    const scale=scaleOf(p);
    const headT=raySphere(origin,dir,[p.x,p.y+1.6*scale,p.z],.23*scale);
    const bodyT=rayBody(origin,dir,p);
    const isHead=headT>=0 && (bodyT<0 || headT<=bodyT+.05);
    const hitT=isHead?headT:bodyT;
    if (hitT>=0 && hitT<nearest) { nearest=hitT; target=p; head=isHead; kind=isHead?'head':'player'; }
  }
  const end=origin.map((v,k)=>v+dir[k]*nearest);
  emit(s,{t:'shot',by:shooter.id,o:eye,e:end,k:kind});
  if (target) {
    emit(s,{t:'hit',id:target.id,by:shooter.id,head});
    if (head) killPlayer(s,target,shooter,true);
    else { target.hp--; if (target.hp<=0) killPlayer(s,target,shooter,false); }
  }
}
function processAction(s,p,act) {
  if (!act || typeof act!=='object' || p.phase!=='playing') return;
  switch (act.a) {
    case 'fire': fireShot(s,p,act); break;
    case 'reload': if (!p.reloadEnd && p.ammo<10) p.reloadEnd=Date.now()+RELOAD_MS; break;
    case 'heal': if (p.heals>0 && p.hp<10) { p.heals--; p.hp=Math.min(10,p.hp+5); emit(s,{t:'heal',id:p.id}); } break;
    case 'pickup': if (p.pending>0 && p.heals<2) { p.heals++; p.pending--; } break;
  }
}
function validateState(s,p,st) {
  const now=Date.now();
  if (!st || typeof st!=='object') return;
  const vals=[st.x,st.y,st.z,st.yaw,st.pitch];
  if (vals.some(v=>typeof v!=='number'||!Number.isFinite(v))) return;
  const dt=Math.min(1.5,Math.max(.016,(now-p.lastStateT)/1000));
  const distance=Math.hypot(st.x-p.x,st.z-p.z);
  const ground=terrainHeight(st.x,st.z);
  const blocked=Math.abs(st.x)>497 || Math.abs(st.z)>497 || nearCityWall(st.x,st.z) || ground < -1.8 && st.y < ground+.6;
  if (distance>8.5*dt+1.8 || st.y-p.y>3+12*dt || p.y-st.y>45*dt+3 || blocked || st.y<ground-.8 || st.y>ground+22) {
    p.corrId++; p.corr={x:p.x,y:p.y,z:p.z,n:p.corrId,why:'snap'};
    return;
  }
  p.lastStateT=now;
  p.x=st.x; p.y=st.y; p.z=st.z;
  p.yaw=st.yaw; p.pitch=Math.max(-1.5,Math.min(1.5,st.pitch));
  p.aim=!!st.aim; p.move=Math.max(0,Math.min(1,Number(st.move)||0));
  p.anim=['idle','walk','run','jump','fall','land'].includes(st.anim)?st.anim:'idle';
  if (p.y < ground-.8) p.y=ground;
  if (ground < -1.8 && p.y < ground+.7) {
    emit(s,{t:'splash',id:p.id,x:p.x,y:0,z:p.z});
    if (p.hp<=2) killPlayer(s,p,null,false);
    else { p.hp-=2; emit(s,{t:'hit',id:p.id,by:'',head:false}); spawnPlayer(s,p,'water'); }
  }
}
function currentTop(s) {
  const holder=record.holderId ? s.players.get(record.holderId) : null;
  const holderPlaying=!!holder && holder.phase==='playing';
  const top=[{name:holderPlaying?holder.name:'',score:record.score,none:!holderPlaying}];
  const players=[...s.players.values()].filter(p=>p.phase==='playing' && !(holderPlaying && p.id===holder.id));
  players.sort((a,b)=>b.score-a.score || (a.score>0 ? a.scoreAt-b.scoreAt : a.joinedAt-b.joinedAt));
  for (let i=0;i<2;i++) top.push(players[i]?{name:players[i].name,score:players[i].score}:{name:'',score:0,none:true});
  return top;
}
function currentEnvironment(s) {
  const w=s.weather;
  return {
    tod: ((Date.now()-s.epoch)/DAY_CYCLE_MS)%1,
    weather:w.kind, wi:w.rain, cloud:w.cloud, wind:w.wind, storm:w.storm
  };
}
function changeWeather(s,now) {
  const w=s.weather;
  if (now>=w.next) {
    const choices={clear:['clouds','rain'],clouds:['clear','rain','thunder','storm'],rain:['clouds','thunder','storm'],thunder:['rain','storm','clouds'],storm:['rain','clouds']};
    const list=choices[w.kind]||choices.clear;
    w.kind=list[crypto.randomInt(list.length)];
    const wet=['rain','thunder','storm'].includes(w.kind);
    w.next=now+(wet?crypto.randomInt(5,31):crypto.randomInt(5,13))*60_000;
  }
  const target={clear:[0,.1,.12,0],clouds:[0,.7,.3,0],rain:[.6,.88,.35,0],thunder:[.8,1,.5,.6],storm:[1,1,1,1]}[w.kind];
  const f=.025;
  w.rain+=(target[0]-w.rain)*f; w.cloud+=(target[1]-w.cloud)*f;
  w.wind+=(target[2]-w.wind)*f; w.storm+=(target[3]-w.storm)*f;
  if (w.storm>.25 && Math.random()<.006) {
    const angle=Math.random()*Math.PI*2, distance=30+Math.random()*390;
    emit(s,{t:'lightning',x:Math.cos(angle)*distance,z:Math.sin(angle)*distance});
  }
}
function tick() {
  const s=session;
  if (!s) return;
  const now=Date.now();
  for (const p of [...s.players.values()]) {
    if (now-p.lastSeen>12_000) { removePlayer(s,p); continue; }
    if (p.phase==='preparing' && now>=p.prepEnd) {
      // Keep a name already claimed in the preparation room; only generate one if none was entered.
      const chosenName=p.reserved && p.name ? p.name : randomDefaultName(s);
      const chosenApp=p.app && p.app.gender ? p.app : {...DEFAULT_APP,gender:Math.random()<.5?'f':'m'};
      startPlayer(s,p,chosenName,chosenApp);
    }
    if (p.phase==='dead' && now-p.deadAt>=2_500) {
      p.phase='preparing'; p.prepEnd=now+PREP_MS; p.hp=10; p.ammo=10; p.heals=0; p.pending=0; p.reloadEnd=0; p.killedBy=''; p.corr=null;
    }
    if (p.phase==='playing' && p.reloadEnd && now>=p.reloadEnd) {
      p.reloadEnd=0; p.ammo=10; emit(s,{t:'reloaded',id:p.id});
    }
  }
  if (session!==s) return;
  changeWeather(s,now);
  const key=JSON.stringify(currentTop(s));
  if (s.topKey && key!==s.topKey) emit(s,{t:'top'});
  s.topKey=key;
  s.lastTick=now;
}
function removePlayer(s,p) {
  if (!s.players.has(p.id)) return;
  if (p.phase==='playing' || p.phase==='dead') emit(s,{t:'leave',name:p.name});
  releaseName(s,p);
  s.players.delete(p.id);
  if (record.holderId===p.id) record.holderId=null;
  if (s.players.size===0 && session===s) {
    session=null;
    persistRecord();
    console.log('[session] empty; session closed');
  }
}
function syncPlayer(s,p,data) {
  const now=Date.now();
  p.lastSeen=now;
  if (p.phase==='playing' && data.st) validateState(s,p,data.st);
  if (p.phase==='playing' && Array.isArray(data.acts)) for (const act of data.acts.slice(0,8)) processAction(s,p,act);
  const players=[];
  for (const q of s.players.values()) {
    if (q.phase!=='playing' && q.phase!=='dead') continue;
    players.push({id:q.id,name:q.name,x:+q.x.toFixed(2),y:+q.y.toFixed(2),z:+q.z.toFixed(2),yaw:+q.yaw.toFixed(3),pitch:+q.pitch.toFixed(3),anim:q.anim,aim:q.aim,move:+q.move.toFixed(2),hp:q.hp,score:q.score,v:q.v,dead:q.phase==='dead',reloading:!!q.reloadEnd});
  }
  const meta={};
  if (Array.isArray(data.need)) for (const id of data.need.slice(0,40)) { const q=s.players.get(id); if(q) meta[id]=q.app; }
  const ev=Number.isFinite(data.ev)?data.ev:-1;
  const events=ev<0?[]:s.events.filter(e=>e.i>ev);
  const you={hp:p.hp,ammo:p.ammo,heals:p.heals,pending:p.pending,reloadLeft:p.reloadEnd?Math.max(0,p.reloadEnd-now):0,score:p.score,name:p.name,best:0,killedBy:p.killedBy||'',corr:p.corr,prepLeft:p.phase==='preparing'?Math.max(0,p.prepEnd-now):0};
  const result={ok:true,phase:p.phase,you,players,events,env:currentEnvironment(s),top:currentTop(s),online:s.players.size,meta,maxPlayers:MAX_PLAYERS,last:s.eventId};
  p.corr=null;
  return result;
}
function status() {
  return { ok:true, online:session?session.players.size:0, sessionActive:!!session, maxPlayers:MAX_PLAYERS, record:record.score, uptime:session?Math.floor((Date.now()-session.createdAt)/1000):0, local:false };
}
function respond(ws,rid,data) {
  if (ws.readyState===WebSocket.OPEN) ws.send(JSON.stringify({rid,data}));
}
function handleRequest(ws, req) {
  const { rid, action, payload={} } = req || {};
  if (!Number.isInteger(rid) || typeof action!=='string' || !payload || typeof payload!=='object' || Array.isArray(payload)) return;
  let result;
  try {
    if (action==='status') {
      result=status();
    } else if (action==='join') {
      // One WebSocket may own only one player. Repeated joins are idempotent.
      if (ws.playerId) {
        const current=session && session.players.get(ws.playerId);
        if (current) result={ok:true,id:current.id,prepMs:Math.max(0,current.prepEnd-Date.now()),created:false};
        else ws.playerId='';
      }
      if (!result) {
        if (!session) { session=makeSession(); console.log('[session] created automatically'); }
        if (session.players.size>=MAX_PLAYERS) result={ok:false,err:'full'};
        else {
          const p=createPlayer(session);
          ws.playerId=p.id;
          result={ok:true,id:p.id,prepMs:PREP_MS,created:session.players.size===1};
        }
      }
    } else {
      // A client cannot read or control another player's state by guessing an id.
      if (!ws.playerId || String(payload.id||'')!==ws.playerId) {
        result={ok:false,err:'unauthorized'};
      } else {
        const s=session;
        const p=s && s.players.get(ws.playerId);
        if (!s || !p) result={ok:false,err:'nosession'};
        else if (action==='claim') result=p.phase==='preparing'?claimName(s,p,payload.name,payload.code):{ok:true,name:p.name};
        else if (action==='start') result=p.phase==='preparing'?startPlayer(s,p,payload.name,payload.app,payload.code):{ok:true,name:p.name};
        else if (action==='prep') {
          if (p.phase==='dead') { releaseName(s,p); p.phase='preparing'; p.prepEnd=Date.now()+PREP_MS; p.score=0; p.hp=10; p.ammo=10; p.heals=0; p.pending=0; p.reloadEnd=0; p.corr=null; }
          result={ok:true};
        } else if (action==='leave') {
          removePlayer(s,p); ws.playerId=''; result={ok:true};
        } else if (action==='sync') result=syncPlayer(s,p,payload);
        else result={ok:false,err:'unknown'};
      }
    }
  } catch (err) {
    console.error('[request]',action,err);
    result={ok:false,err:'server'};
  }
  respond(ws,rid,result);
}

const server=http.createServer((req,res)=>{
  if (req.url==='/health' || req.url==='/') {
    res.writeHead(200,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
    res.end(JSON.stringify({service:'SDFaker Last Standing server',status:'ok',transport:'websocket',online:session?session.players.size:0,maxPlayers:MAX_PLAYERS}));
    return;
  }
  res.writeHead(404,{'content-type':'application/json'}); res.end(JSON.stringify({error:'not found'}));
});
const wss=new WebSocketServer({server,path:'/ws',maxPayload:64*1024,perMessageDeflate:false,verifyClient:(info,done)=>{
  const origin=info.origin||'';
  if (origin && ALLOWED_ORIGINS.length && !ALLOWED_ORIGINS.includes(origin)) return done(false,403,'Origin not allowed');
  done(true);
}});
wss.on('connection',(ws)=>{
  ws.isAlive=true; ws.playerId=''; ws.rateWindow=Date.now(); ws.rateCount=0;
  ws.on('pong',()=>{ws.isAlive=true;});
  ws.on('message',(raw)=>{
    if (raw.length>64*1024) { ws.close(1009,'Message too large'); return; }
    const now=Date.now();
    if (now-ws.rateWindow>=1000) { ws.rateWindow=now; ws.rateCount=0; }
    if (++ws.rateCount>60) { ws.close(1008,'Rate limit'); return; }
    let req; try { req=JSON.parse(raw.toString()); } catch { return; }
    handleRequest(ws,req);
  });
  ws.on('close',()=>{
    if (ws.playerId && session) { const p=session.players.get(ws.playerId); if(p) removePlayer(session,p); }
  });
  ws.on('error',(err)=>console.warn('[ws] socket error:',err.message));
});
const tickTimer=setInterval(tick,100);
const heartbeat=setInterval(()=>{
  for (const ws of wss.clients) {
    if (!ws.isAlive) { ws.terminate(); continue; }
    ws.isAlive=false;
    if (ws.readyState===WebSocket.OPEN) ws.ping();
  }
},15_000);
server.listen(PORT,'0.0.0.0',()=>console.log(`[SDFaker] WebSocket server listening on :${PORT}/ws (max ${MAX_PLAYERS})`));
function shutdown(){
  clearInterval(tickTimer); clearInterval(heartbeat);
  if(session){ for(const p of [...session.players.values()]) removePlayer(session,p); }
  persistRecord();
  wss.close(()=>server.close(()=>process.exit(0)));
  setTimeout(()=>process.exit(0),2500).unref();
}
process.on('SIGINT',shutdown); process.on('SIGTERM',shutdown);
