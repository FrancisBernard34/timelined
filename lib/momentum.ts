// Inertia model for the timeline drag: a decaying velocity (px per ms) that
// keeps the scroller gliding after the pointer is released.
export const MOMENTUM_FRICTION = 0.95; // per 16ms frame
export const MIN_VELOCITY = 0.05; // px per ms — below this the glide stops
export const MAX_VELOCITY = 3; // px per ms — cap so a hard flick doesn't fly

export function decayVelocity(
  velocity: number,
  dt: number,
  friction = MOMENTUM_FRICTION,
): number {
  return velocity * Math.pow(friction, dt / 16);
}

export function clampVelocity(
  velocity: number,
  max = MAX_VELOCITY,
): number {
  return Math.max(-max, Math.min(max, velocity));
}
