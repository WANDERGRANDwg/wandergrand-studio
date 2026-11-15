'use strict';

const worldData = require('./world-colliders.json');

const WORLD_SIZE = Number(worldData.worldSize) || 1000;
const HALF_WORLD = WORLD_SIZE / 2;
const CELL_SIZE = 16;
const GRID_SIZE = Math.ceil(WORLD_SIZE / CELL_SIZE);
const COLLIDERS = Array.isArray(worldData.colliders) ? worldData.colliders : [];
const GRID = Array.from({ length: GRID_SIZE * GRID_SIZE }, () => []);

function cellCoord(value) {
  return Math.max(0, Math.min(GRID_SIZE - 1, Math.floor((value + HALF_WORLD) / CELL_SIZE)));
}
function cellKey(x, z) { return z * GRID_SIZE + x; }

// Build the same 16 m broad-phase grid used by the browser's static map collider system.
for (let index = 0; index < COLLIDERS.length; index++) {
  const c = COLLIDERS[index];
  const minX = cellCoord(c.x0), maxX = cellCoord(c.x1);
  const minZ = cellCoord(c.z0), maxZ = cellCoord(c.z1);
  for (let z = minZ; z <= maxZ; z++) {
    for (let x = minX; x <= maxX; x++) GRID[cellKey(x, z)].push(index);
  }
}

function candidatesForAabb(minX, maxX, minZ, maxZ) {
  const found = new Set();
  const x0 = cellCoord(minX), x1 = cellCoord(maxX);
  const z0 = cellCoord(minZ), z1 = cellCoord(maxZ);
  for (let z = z0; z <= z1; z++) {
    for (let x = x0; x <= x1; x++) {
      for (const index of GRID[cellKey(x, z)]) found.add(index);
    }
  }
  return found;
}

/** True when a standing/capsule player body overlaps one of the map's solid colliders. */
function collidesAt(x, y, z, radius = 0.38, height = 1.8) {
  const ids = candidatesForAabb(x - radius, x + radius, z - radius, z + radius);
  const bodyTop = y + height;
  // Match the browser's Pl() vertical tolerance: objects below the feet are not blockers.
  const bodyBottom = y + 0.55;
  for (const index of ids) {
    const c = COLLIDERS[index];
    if (c.y1 <= bodyBottom || c.y0 >= bodyTop) continue;
    if (c.cyl) {
      const dx = x - c.cx, dz = z - c.cz;
      if (dx * dx + dz * dz < (radius + c.r) ** 2) return true;
    } else {
      const px = Math.max(c.x0, Math.min(x, c.x1));
      const pz = Math.max(c.z0, Math.min(z, c.z1));
      const dx = x - px, dz = z - pz;
      if (dx * dx + dz * dz < radius * radius) return true;
    }
  }
  return false;
}

/** Prevent tunnelling: sample the complete player capsule path between two server updates. */
function sweptCollides(fromX, fromY, fromZ, toX, toY, toZ, radius = 0.38, height = 1.8) {
  const dx = toX - fromX, dy = toY - fromY, dz = toZ - fromZ;
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy, dz) / 0.25));
  for (let step = 1; step <= steps; step++) {
    const t = step / steps;
    if (collidesAt(fromX + dx * t, fromY + dy * t, fromZ + dz * t, radius, height)) return true;
  }
  return false;
}

function rayAabb(origin, dir, box, maxDistance) {
  let lo = 0, hi = maxDistance;
  const mins = [box.x0, box.y0, box.z0];
  const maxs = [box.x1, box.y1, box.z1];
  for (let axis = 0; axis < 3; axis++) {
    if (Math.abs(dir[axis]) < 1e-9) {
      if (origin[axis] < mins[axis] || origin[axis] > maxs[axis]) return -1;
      continue;
    }
    let a = (mins[axis] - origin[axis]) / dir[axis];
    let b = (maxs[axis] - origin[axis]) / dir[axis];
    if (a > b) [a, b] = [b, a];
    lo = Math.max(lo, a);
    hi = Math.min(hi, b);
    if (lo > hi) return -1;
  }
  return lo;
}

function rayCylinder(origin, dir, c) {
  const ox = origin[0] - c.cx;
  const oz = origin[2] - c.cz;
  const a = dir[0] * dir[0] + dir[2] * dir[2];
  let best = Infinity;
  if (a > 1e-9) {
    const b = 2 * (ox * dir[0] + oz * dir[2]);
    const cc = ox * ox + oz * oz - c.r * c.r;
    const disc = b * b - 4 * a * cc;
    if (disc >= 0) {
      const root = Math.sqrt(disc);
      for (const t of [(-b - root) / (2 * a), (-b + root) / (2 * a)]) {
        if (t >= 0 && t < best) {
          const y = origin[1] + dir[1] * t;
          if (y >= c.y0 && y <= c.y1) best = t;
        }
      }
    }
  }
  if (Math.abs(dir[1]) > 1e-9) {
    for (const y of [c.y0, c.y1]) {
      const t = (y - origin[1]) / dir[1];
      if (t >= 0 && t < best) {
        const x = origin[0] + dir[0] * t - c.cx;
        const z = origin[2] + dir[2] * t - c.cz;
        if (x * x + z * z <= c.r * c.r) best = t;
      }
    }
  }
  return Number.isFinite(best) ? best : -1;
}

// 2D grid DDA: visit every world cell crossed by the shot, then ray-test its exact colliders.
function candidatesAlongRay(origin, dir, maxDistance) {
  const found = new Set();
  let x = origin[0], z = origin[2];
  let ix = cellCoord(x), iz = cellCoord(z);
  const dx = dir[0], dz = dir[2];
  const stepX = Math.sign(dx), stepZ = Math.sign(dz);
  const deltaX = Math.abs(dx) < 1e-9 ? Infinity : CELL_SIZE / Math.abs(dx);
  const deltaZ = Math.abs(dz) < 1e-9 ? Infinity : CELL_SIZE / Math.abs(dz);
  const boundaryX = -HALF_WORLD + (ix + (stepX > 0 ? 1 : 0)) * CELL_SIZE;
  const boundaryZ = -HALF_WORLD + (iz + (stepZ > 0 ? 1 : 0)) * CELL_SIZE;
  let maxX = Math.abs(dx) < 1e-9 ? Infinity : (boundaryX - x) / dx;
  let maxZ = Math.abs(dz) < 1e-9 ? Infinity : (boundaryZ - z) / dz;
  let travelled = 0;
  const maxSteps = GRID_SIZE * 3 + 16;
  for (let steps = 0; steps < maxSteps && travelled <= maxDistance; steps++) {
    if (ix < 0 || iz < 0 || ix >= GRID_SIZE || iz >= GRID_SIZE) break;
    for (const index of GRID[cellKey(ix, iz)]) found.add(index);
    if (maxX < maxZ) {
      travelled = maxX;
      maxX += deltaX;
      ix += stepX;
    } else {
      travelled = maxZ;
      maxZ += deltaZ;
      iz += stepZ;
    }
    if (!stepX && !stepZ) break;
  }
  return found;
}

/** Return the nearest static map blocker along a normalized ray, including terrain. */
function raycastWorld(origin, dir, maxDistance, terrainHeight) {
  let nearest = maxDistance;
  let kind = 'none';
  const ids = candidatesAlongRay(origin, dir, maxDistance);
  for (const index of ids) {
    const c = COLLIDERS[index];
    const distance = c.cyl
      ? rayCylinder(origin, dir, c)
      : rayAabb(origin, dir, c, nearest);
    if (distance >= 0 && distance < nearest) {
      nearest = distance;
      kind = c.surf === 'metal' ? 'metal' : 'wall';
    }
  }

  // The terrain height field is continuous; sample and binary-search its first intersection.
  for (let d = 1.5; d < nearest; d += 2) {
    const x = origin[0] + dir[0] * d;
    const y = origin[1] + dir[1] * d;
    const z = origin[2] + dir[2] * d;
    if (y < Math.max(terrainHeight(x, z), 0)) {
      let lo = Math.max(0, d - 2), hi = d;
      for (let n = 0; n < 10; n++) {
        const mid = (lo + hi) * 0.5;
        const mx = origin[0] + dir[0] * mid;
        const my = origin[1] + dir[1] * mid;
        const mz = origin[2] + dir[2] * mid;
        if (my < Math.max(terrainHeight(mx, mz), 0)) hi = mid;
        else lo = mid;
      }
      nearest = hi;
      kind = 'ground';
      break;
    }
  }
  return { distance: nearest, kind };
}

module.exports = {
  WORLD_SIZE,
  COLLIDER_COUNT: COLLIDERS.length,
  collidesAt,
  sweptCollides,
  raycastWorld
};
