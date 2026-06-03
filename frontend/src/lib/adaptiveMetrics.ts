/** FPS sampling + hysteresis for runtime tier changes. */

export const FPS_DEGRADE_EFFECTS = 55;
export const FPS_DEGRADE_GEOMETRY = 45;
export const FPS_DEGRADE_ULTRA_LOW = 35;

export const FPS_IMPROVE_HOLD = 58;
export const TIER_CHANGE_COOLDOWN_MS = 4000;
export const SAMPLE_WINDOW = 90;

export interface FpsSnapshot {
  avg: number;
  min: number;
  p95FrameMs: number;
  dropsBelow45: number;
  samples: number;
}

export class FpsTracker {
  private frameMs: number[] = [];
  private lastWall = 0;

  pushFrame(deltaSec: number, renderMs?: number): void {
    const ms = (renderMs ?? deltaSec * 1000) || 16.67;
    this.frameMs.push(ms);
    if (this.frameMs.length > SAMPLE_WINDOW) this.frameMs.shift();
    this.lastWall = performance.now();
  }

  snapshot(): FpsSnapshot {
    if (!this.frameMs.length) {
      return { avg: 60, min: 60, p95FrameMs: 16.67, dropsBelow45: 0, samples: 0 };
    }
    const sorted = [...this.frameMs].sort((a, b) => a - b);
    const avgMs =
      this.frameMs.reduce((a, b) => a + b, 0) / this.frameMs.length;
    const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? avgMs;
    const fps = (ms: number) => 1000 / ms;
    const avg = fps(avgMs);
    const min = fps(sorted[sorted.length - 1] ?? avgMs);
    const dropsBelow45 = this.frameMs.filter((ms) => ms > 1000 / 45).length;
    return {
      avg,
      min,
      p95FrameMs: p95,
      dropsBelow45,
      samples: this.frameMs.length,
    };
  }

  idleMs(): number {
    return this.lastWall ? performance.now() - this.lastWall : 0;
  }
}

export type DegradeAction =
  | "none"
  | "scale_effects"
  | "scale_geometry"
  | "tier_down"
  | "force_ultra_low";

export function evaluateDegrade(
  snap: FpsSnapshot,
  minSamples = 45
): DegradeAction {
  if (snap.samples < minSamples) return "none";
  if (snap.avg < FPS_DEGRADE_ULTRA_LOW || snap.min < FPS_DEGRADE_ULTRA_LOW - 5)
    return "force_ultra_low";
  if (snap.avg < FPS_DEGRADE_GEOMETRY) return "scale_geometry";
  if (snap.avg < FPS_DEGRADE_EFFECTS) return "scale_effects";
  return "none";
}

export function canImproveTier(
  snap: FpsSnapshot,
  lastChangeMs: number,
  minSamples = 60
): boolean {
  if (snap.samples < minSamples) return false;
  if (performance.now() - lastChangeMs < TIER_CHANGE_COOLDOWN_MS) return false;
  return snap.avg >= FPS_IMPROVE_HOLD && snap.dropsBelow45 < snap.samples * 0.05;
}
