/**
 * Minimum-Jerk Spline & Human Cursor Kinetics
 * 
 * Mathematically models natural human hand movement:
 * Minimizes the integral of the square of the jerk (third derivative of position):
 * s(tau) = 10 * tau^3 - 15 * tau^4 + 6 * tau^5, where tau = t / D in [0, 1]
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface CursorWaypoint {
  frame: number;
  timeMs: number;
  x: number;
  y: number;
  state: "moving" | "overshoot" | "dwell" | "clicking" | "idle";
}

export interface TrajectoryOptions {
  fps?: number;
  durationMs?: number;
  overshootPercent?: number; // 0.02 to 0.05 (2% - 5%)
  dwellTimeMs?: number;      // 150ms default
}

export function minimumJerkPolynomial(tau: number): number {
  const t = Math.max(0, Math.min(1, tau));
  return 10 * Math.pow(t, 3) - 15 * Math.pow(t, 4) + 6 * Math.pow(t, 5);
}

export function computeMinimumJerkTrajectory(
  start: Point2D,
  target: Point2D,
  options: TrajectoryOptions = {}
): CursorWaypoint[] {
  const fps = options.fps ?? 60;
  const dwellTimeMs = options.dwellTimeMs ?? 150;
  const overshootFactor = options.overshootPercent ?? 0.035;

  const dx = target.x - start.x;
  const dy = target.y - start.y;
  const distance = Math.hypot(dx, dy);

  // Dynamic duration based on Fitts' Law: larger distances take proportionally more time
  const defaultDurationMs = Math.max(300, Math.min(1000, 200 + Math.log2(distance + 1) * 80));
  const moveDurationMs = options.durationMs ?? defaultDurationMs;

  const moveFrames = Math.max(8, Math.round((moveDurationMs / 1000) * fps));
  const dwellFrames = Math.max(3, Math.round((dwellTimeMs / 1000) * fps));

  const waypoints: CursorWaypoint[] = [];

  // 1. Minimum-Jerk path with human micro-overshoot during final 20%
  for (let f = 0; f <= moveFrames; f++) {
    const tau = f / moveFrames;
    let s = minimumJerkPolynomial(tau);

    // Subtle overshoot curve peak at tau = 0.85
    let overshoot = 0;
    if (tau > 0.65 && tau < 1.0) {
      const peakTau = (tau - 0.65) / 0.35;
      overshoot = Math.sin(peakTau * Math.PI) * overshootFactor;
    }

    const currentFactor = s + overshoot;
    const x = Math.round((start.x + dx * currentFactor) * 10) / 10;
    const y = Math.round((start.y + dy * currentFactor) * 10) / 10;
    const timeMs = Math.round((f / fps) * 1000);

    waypoints.push({
      frame: f,
      timeMs,
      x,
      y,
      state: overshoot > 0.01 ? "overshoot" : "moving"
    });
  }

  // 2. Exact Dwell phase over target before click
  const lastTimeMs = waypoints[waypoints.length - 1].timeMs;
  for (let d = 1; d <= dwellFrames; d++) {
    const timeMs = lastTimeMs + Math.round((d / fps) * 1000);
    waypoints.push({
      frame: moveFrames + d,
      timeMs,
      x: target.x,
      y: target.y,
      state: d === dwellFrames ? "clicking" : "dwell"
    });
  }

  return waypoints;
}
