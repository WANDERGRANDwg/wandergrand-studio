'use strict';

const assert = require('node:assert/strict');
const WORLD = require('../world');
const map = require('../world-colliders.json');

assert.equal(WORLD.COLLIDER_COUNT, map.colliders.length, 'server must load the generated map collider file');
assert.ok(WORLD.COLLIDER_COUNT >= 3000, 'the generated island should include the detailed static collision set');

// The generated center-city west wall is a known solid section, while a nearby
// point outside it is open terrain.
assert.equal(WORLD.collidesAt(-201, 3, -100, 0.38, 1.8), true, 'player capsule must collide with city wall');
assert.equal(WORLD.collidesAt(-230, 3, -100, 0.38, 1.8), false, 'open terrain must remain traversable');
assert.equal(WORLD.sweptCollides(-207, 3, -100, -195, 3, -100, .38, 1.8), true, 'a fast update must not tunnel through a thin solid wall');
assert.equal(WORLD.sweptCollides(-230, 3, -100, -225, 3, -100, .38, 1.8), false, 'clear movement path must remain open');

// Validate at least one generated cylindrical object (tree / post / rock trunk).
const cylinder = map.colliders.find(c => c.cyl);
assert.ok(cylinder, 'map must include cylindrical colliders');
assert.equal(
  WORLD.collidesAt(cylinder.cx, cylinder.y0 + 0.2, cylinder.cz, 0.38, 1.8),
  true,
  'player capsule must collide with cylindrical map objects'
);

// Shots must stop at the exact front face of a city wall, but pass through a clear ray.
const wallRay = WORLD.raycastWorld([-207, 3, -100], [1, 0, 0], 100, () => 0);
assert.equal(wallRay.kind, 'wall');
assert.ok(Math.abs(wallRay.distance - 5) < 0.01, `expected wall distance 5, received ${wallRay.distance}`);

const openRay = WORLD.raycastWorld([-230, 3, -100], [1, 0, 0], 10, () => 0);
assert.equal(openRay.kind, 'none');
assert.equal(openRay.distance, 10);

// A cylinder must also block a hitscan ray at its near edge.
const cylinderRay = WORLD.raycastWorld(
  [cylinder.cx - 5, cylinder.y0 + 0.5, cylinder.cz],
  [1, 0, 0],
  20,
  () => 0
);
assert.equal(cylinderRay.kind, 'metal');
assert.ok(Math.abs(cylinderRay.distance - (5 - cylinder.r)) < 0.05);

console.log(`PASS: ${WORLD.COLLIDER_COUNT} map colliders, player collision, city-wall raycast, cylinder raycast.`);
