export interface Particle {
  id: number;
  edgeId: string;
  progress: number; // 0.0 to 1.0
  x: number;
  y: number;
  radius: number;
  color: string;
  opacity: number;
}

export interface BezierCurve {
  p0: { x: number; y: number };
  p1: { x: number; y: number };
  p2: { x: number; y: number };
  p3: { x: number; y: number };
}

export function evaluateCubicBezier(curve: BezierCurve, t: number): { x: number; y: number } {
  const clampedT = Math.max(0, Math.min(1, t));
  const u = 1 - clampedT;
  const tt = clampedT * clampedT;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * clampedT;

  const x = uuu * curve.p0.x + 3 * uu * clampedT * curve.p1.x + 3 * u * tt * curve.p2.x + ttt * curve.p3.x;
  const y = uuu * curve.p0.y + 3 * uu * clampedT * curve.p1.y + 3 * u * tt * curve.p2.y + ttt * curve.p3.y;

  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
}

export class ParticleStreamSimulator {
  private particles: Particle[] = [];
  private nextParticleId = 1;

  public computeParticlesForEdge(
    edgeId: string,
    curve: BezierCurve,
    currentFrame: number,
    startFrame: number,
    ratePps = 60,
    color = "#38BDF8"
  ): Particle[] {
    if (currentFrame < startFrame) return [];

    const activeFrame = currentFrame - startFrame;
    const speed = 0.015; // Progress increment per frame (reaches target in ~66 frames = 1.1s)
    const emissionInterval = Math.max(4, Math.round(60 / (ratePps / 10))); // Spacing between particles

    const edgeParticles: Particle[] = [];

    // Calculate how many particles are currently in flight
    const maxParticlesInFlight = Math.min(25, Math.floor(1.0 / (speed * emissionInterval)));

    for (let i = 0; i < maxParticlesInFlight; i++) {
      const birthFrame = i * emissionInterval;
      if (activeFrame >= birthFrame) {
        const ageInFrames = (activeFrame - birthFrame);
        const progress = (ageInFrames * speed) % 1.0;
        const pos = evaluateCubicBezier(curve, progress);

        // Opacity eases in at start and out at target
        let opacity = 1.0;
        if (progress < 0.1) opacity = progress / 0.1;
        else if (progress > 0.85) opacity = (1.0 - progress) / 0.15;

        edgeParticles.push({
          id: i,
          edgeId,
          progress,
          x: pos.x,
          y: pos.y,
          radius: 3.5,
          color,
          opacity: Math.round(opacity * 100) / 100
        });
      }
    }

    return edgeParticles;
  }
}
