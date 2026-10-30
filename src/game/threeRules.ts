export const THREE_LANES = [-5.5, 0, 5.5]; // World X coordinates for Left, Center, Right lanes
export const TRACK_LENGTH = 180;
export const MAX_SHIELDS = 3;

/**
 * Returns world X coordinate for lane index (0 = Left, 1 = Center, 2 = Right).
 */
export function getLane3DX(laneIndex: number): number {
  const clamped = Math.max(0, Math.min(THREE_LANES.length - 1, laneIndex));
  return THREE_LANES[clamped];
}

/**
 * Checks sphere-to-box collision in 3D world space.
 */
export function checkSphereBoxCollision(
  sphereCenter: { x: number; y: number; z: number },
  sphereRadius: number,
  boxMin: { x: number; y: number; z: number },
  boxMax: { x: number; y: number; z: number }
): boolean {
  // Find the closest point on the box to the sphere center
  const closestX = Math.max(boxMin.x, Math.min(sphereCenter.x, boxMax.x));
  const closestY = Math.max(boxMin.y, Math.min(sphereCenter.y, boxMax.y));
  const closestZ = Math.max(boxMin.z, Math.min(sphereCenter.z, boxMax.z));

  const dx = sphereCenter.x - closestX;
  const dy = sphereCenter.y - closestY;
  const dz = sphereCenter.z - closestZ;

  const distanceSquared = dx * dx + dy * dy + dz * dz;
  return distanceSquared < sphereRadius * sphereRadius;
}

/**
 * Frame-rate independent exponential damping helper.
 * target - (target - current) * exp(-lambda * dt)
 */
export function dampExp(current: number, target: number, lambda: number, dt: number): number {
  return target - (target - current) * Math.exp(-lambda * dt);
}

/**
 * Calculates score based on distance run, collected crystals, and active combo.
 */
export function calculate3DScore(distance: number, crystalPoints: number, combo: number): number {
  const distPts = Math.floor(distance * 12);
  const bonus = Math.max(1, Math.floor(combo * 1.5));
  return distPts + crystalPoints * bonus;
}

/**
 * Progressive speed calculation scaling with run distance.
 */
export function get3DRunSpeed(distance: number, baseSpeed = 45): number {
  const speedBonus = Math.min(40, Math.floor(distance / 80) * 4);
  return baseSpeed + speedBonus;
}
