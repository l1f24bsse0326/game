export interface PlayerState {
  lane: number;
  y: number;
  width: number;
  height: number;
  lives: number;
  isInvulnerable: boolean;
  invulnerableTime: number;
}

export interface Obstacle {
  id: string;
  lane: number;
  y: number;
  width: number;
  height: number;
  type: 'barrier' | 'glitch' | 'laser';
  speed: number;
}

export interface Collectible {
  id: string;
  lane: number;
  y: number;
  radius: number;
  type: 'neon' | 'stardust' | 'gold';
  points: number;
}

export const LANES_COUNT = 3;
export const MAX_LIVES = 3;
export const FEVER_THRESHOLD = 5;

/**
 * Calculates score based on distance, collected items, and combo.
 */
export function calculateScore(distance: number, orbsPoints: number, combo: number): number {
  const distanceScore = Math.floor(distance * 10);
  const comboBonus = Math.floor(combo * 1.5);
  return Math.max(0, distanceScore + orbsPoints * comboBonus);
}

/**
 * Updates combo count when picking up orbs or hitting hazards.
 */
export function updateCombo(currentCombo: number, event: 'orb' | 'hit' | 'miss'): number {
  if (event === 'orb') {
    return Math.min(50, currentCombo + 1);
  }
  return 1; // reset on hit or combo drop
}

/**
 * Checks if fever mode is unlocked by consecutive orbs streak.
 */
export function isFeverActive(streak: number, threshold = FEVER_THRESHOLD): boolean {
  return streak >= threshold;
}

/**
 * Calculates lane X coordinate given lane index and track width.
 */
export function getLaneX(laneIndex: number, totalLanes = LANES_COUNT, trackWidth = 360): number {
  const clampedLane = Math.max(0, Math.min(totalLanes - 1, laneIndex));
  const laneWidth = trackWidth / totalLanes;
  return laneWidth * clampedLane + laneWidth / 2;
}

/**
 * AABB Collision detection between player and obstacle.
 */
export function checkAABBCollision(
  p: { x: number; y: number; width: number; height: number },
  o: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    p.x - p.width / 2 < o.x + o.width / 2 &&
    p.x + p.width / 2 > o.x - o.width / 2 &&
    p.y - p.height / 2 < o.y + o.height / 2 &&
    p.y + p.height / 2 > o.y - o.height / 2
  );
}

/**
 * Calculates speed scaling as player progresses deeper into the run.
 */
export function getRunSpeed(distance: number, baseSpeed = 260): number {
  const speedBonus = Math.min(220, Math.floor(distance / 50) * 15);
  return baseSpeed + speedBonus;
}

/**
 * Formats time in mm:ss for display.
 */
export function formatRunTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
