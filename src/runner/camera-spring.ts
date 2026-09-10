/**
 * Camera Spring Physics Controller
 * 
 * Implements critically damped harmonic spring:
 * F = -k * (x - target_x) - c * v
 * Default parameters: k = 180 (spring stiffness), c = 18 (damping coefficient)
 * Damping ratio zeta = c / (2 * sqrt(m * k)) = 18 / (2 * sqrt(1 * 180)) ≈ 0.67 (near critical)
 */

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
  vx: number;
  vy: number;
  vZoom: number;
}

export interface SpringConfig {
  k?: number;      // 180
  c?: number;      // 18
  fps?: number;    // 60
  safeMargin?: number; // 30px
}

export class CameraSpringController {
  private current: CameraState;
  private target: { x: number; y: number; zoom: number };
  private k: number;
  private c: number;
  private fps: number;
  private holdFramesCount = 0;

  constructor(initial: { x: number; y: number; zoom: number }, config: SpringConfig = {}) {
    this.current = {
      x: initial.x,
      y: initial.y,
      zoom: initial.zoom,
      vx: 0,
      vy: 0,
      vZoom: 0
    };
    this.target = { ...initial };
    this.k = config.k ?? 180;
    this.c = config.c ?? 18;
    this.fps = config.fps ?? 60;
  }

  public setTarget(target: { x: number; y: number; zoom?: number }): void {
    if (Math.abs(this.target.x - target.x) > 1 || Math.abs(this.target.y - target.y) > 1) {
      this.holdFramesCount = 0;
    }
    this.target.x = target.x;
    this.target.y = target.y;
    if (target.zoom !== undefined) {
      this.target.zoom = target.zoom;
    }
  }

  public step(): CameraState {
    const dt = 1 / this.fps;

    // Check for dead-air (>800ms = 48 frames at 60fps)
    this.holdFramesCount++;
    if (this.holdFramesCount > 48) {
      // Apply subtle ambient focal drift (12px/s)
      const driftAngle = (this.holdFramesCount / 60) * 0.5;
      this.target.x += Math.cos(driftAngle) * 0.2;
      this.target.y += Math.sin(driftAngle) * 0.2;
    }

    // Spring equations for X
    const ax = this.k * (this.target.x - this.current.x) - this.c * this.current.vx;
    this.current.vx += ax * dt;
    this.current.x += this.current.vx * dt;

    // Spring equations for Y
    const ay = this.k * (this.target.y - this.current.y) - this.c * this.current.vy;
    this.current.vy += ay * dt;
    this.current.y += this.current.vy * dt;

    // Spring equations for Zoom
    const aZoom = this.k * (this.target.zoom - this.current.zoom) - this.c * this.current.vZoom;
    this.current.vZoom += aZoom * dt;
    this.current.zoom += this.current.vZoom * dt;

    return {
      x: Math.round(this.current.x * 100) / 100,
      y: Math.round(this.current.y * 100) / 100,
      zoom: Math.round(this.current.zoom * 1000) / 1000,
      vx: this.current.vx,
      vy: this.current.vy,
      vZoom: this.current.vZoom
    };
  }

  public getState(): CameraState {
    return { ...this.current };
  }
}
