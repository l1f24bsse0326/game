import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getLane3DX,
  checkSphereBoxCollision,
  dampExp,
  calculate3DScore,
  get3DRunSpeed,
  THREE_LANES,
} from './threeRules';

test('getLane3DX accurately clamps and resolves 3D lane coordinates', () => {
  assert.equal(getLane3DX(0), -5.5);
  assert.equal(getLane3DX(1), 0);
  assert.equal(getLane3DX(2), 5.5);

  // Clamping
  assert.equal(getLane3DX(-1), -5.5);
  assert.equal(getLane3DX(99), 5.5);
});

test('checkSphereBoxCollision identifies 3D intersections correctly', () => {
  const sphere = { x: 0, y: 1, z: 0 };
  const radius = 1.2;

  // Box overlapping sphere
  const boxHit = {
    min: { x: -1, y: 0, z: -1 },
    max: { x: 1, y: 2, z: 1 },
  };
  assert.equal(checkSphereBoxCollision(sphere, radius, boxHit.min, boxHit.max), true);

  // Box far away
  const boxMiss = {
    min: { x: 10, y: 0, z: 10 },
    max: { x: 12, y: 2, z: 12 },
  };
  assert.equal(checkSphereBoxCollision(sphere, radius, boxMiss.min, boxMiss.max), false);
});

test('dampExp smoothly converges toward target', () => {
  const current = 0;
  const target = 10;
  const stepped = dampExp(current, target, 5, 0.05);

  assert.ok(stepped > 0, 'Should move forward toward target');
  assert.ok(stepped < target, 'Should not overshoot target in smooth step');
});

test('calculate3DScore computes total score with combo multipliers', () => {
  const baseScore = calculate3DScore(100, 50, 1);
  assert.equal(baseScore, 1200 + 50 * 1);

  const comboScore = calculate3DScore(100, 50, 4);
  assert.equal(comboScore, 1200 + 50 * 6);
});

test('get3DRunSpeed ramps up with distance', () => {
  const initial = get3DRunSpeed(0);
  const mid = get3DRunSpeed(200);
  const fast = get3DRunSpeed(800);

  assert.equal(initial, 45);
  assert.ok(mid > initial);
  assert.ok(fast > mid);
});
