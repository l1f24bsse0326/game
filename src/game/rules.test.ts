import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateScore,
  updateCombo,
  isFeverActive,
  getLaneX,
  checkAABBCollision,
  getRunSpeed,
  formatRunTime,
  LANES_COUNT,
} from './rules';

test('calculateScore scales with distance, orbs, and combo', () => {
  const score1 = calculateScore(10, 50, 1);
  assert.equal(score1, 150); // 100 + 50 * 1

  const scoreWithCombo = calculateScore(10, 50, 4);
  assert.equal(scoreWithCombo, 400); // 100 + 50 * 6
});

test('updateCombo increments on orb and resets on hit', () => {
  assert.equal(updateCombo(1, 'orb'), 2);
  assert.equal(updateCombo(5, 'orb'), 6);
  assert.equal(updateCombo(12, 'hit'), 1);
  assert.equal(updateCombo(8, 'miss'), 1);
});

test('isFeverActive triggers only at or above threshold', () => {
  assert.equal(isFeverActive(4), false);
  assert.equal(isFeverActive(5), true);
  assert.equal(isFeverActive(10), true);
});

test('getLaneX computes center coordinates evenly', () => {
  const lane0 = getLaneX(0, 3, 300);
  const lane1 = getLaneX(1, 3, 300);
  const lane2 = getLaneX(2, 3, 300);

  assert.equal(lane0, 50);
  assert.equal(lane1, 150);
  assert.equal(lane2, 250);

  // Clamping test
  assert.equal(getLaneX(-1, 3, 300), 50);
  assert.equal(getLaneX(10, 3, 300), 250);
});

test('checkAABBCollision detects overlapping hitboxes', () => {
  const player = { x: 100, y: 500, width: 40, height: 40 };
  const obstacleHit = { x: 110, y: 510, width: 40, height: 40 };
  const obstacleMiss = { x: 200, y: 500, width: 40, height: 40 };

  assert.equal(checkAABBCollision(player, obstacleHit), true);
  assert.equal(checkAABBCollision(player, obstacleMiss), false);
});

test('getRunSpeed ramps up with distance', () => {
  const startSpeed = getRunSpeed(0);
  const midSpeed = getRunSpeed(100);
  const highSpeed = getRunSpeed(500);

  assert.equal(startSpeed, 260);
  assert.ok(midSpeed > startSpeed);
  assert.ok(highSpeed > midSpeed);
});

test('formatRunTime formats seconds as mm:ss', () => {
  assert.equal(formatRunTime(0), '00:00');
  assert.equal(formatRunTime(65), '01:05');
  assert.equal(formatRunTime(130), '02:10');
});
