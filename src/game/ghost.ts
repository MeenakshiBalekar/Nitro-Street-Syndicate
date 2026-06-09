import { lerp } from '../util/math';

// Ghost racing: record the player's run as a compact stream of frames, persist
// the personal best, and replay it as a translucent ghost next time. Purely
// visual — the ghost never affects placement.
//
// Each frame is 7 packed numbers: [t(ms), progress, lateral, y, lean, pitch, spin].
const STRIDE = 7;

export interface GhostState {
  active: boolean;
  worldX: number;
  worldY: number;
  worldZ: number;
  heading: number;
  lean: number;
  pitch: number;
  spin: number;
}

export interface GhostSample {
  progress: number;
  lateral: number;
  y: number;
  lean: number;
  pitch: number;
  spin: number;
}

export interface RecordableRacer {
  progress: number;
  lateral: number;
  worldY: number;
  lean: number;
  pitch: number;
  wheelSpin: number;
}

export class GhostRecorder {
  private frames: number[] = [];
  private acc = 0;
  private interval = 1 / 15;

  record(dt: number, tMs: number, r: RecordableRacer): void {
    this.acc += dt;
    if (this.frames.length > 0 && this.acc < this.interval) return;
    this.acc = 0;
    this.frames.push(tMs, r.progress, r.lateral, r.worldY, r.lean, r.pitch, r.wheelSpin);
  }

  data(): number[] {
    return this.frames;
  }
}

export class GhostPlayer {
  readonly count: number;

  constructor(private readonly d: number[]) {
    this.count = Math.floor(d.length / STRIDE);
  }

  private frameAt(i: number): GhostSample {
    const o = i * STRIDE;
    return {
      progress: this.d[o + 1],
      lateral: this.d[o + 2],
      y: this.d[o + 3],
      lean: this.d[o + 4],
      pitch: this.d[o + 5],
      spin: this.d[o + 6],
    };
  }

  sample(tMs: number): GhostSample | null {
    if (this.count === 0) return null;
    const last = this.count - 1;
    if (tMs <= this.d[0]) return this.frameAt(0);
    if (tMs >= this.d[last * STRIDE]) return this.frameAt(last);

    let lo = 0;
    let hi = last;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (this.d[mid * STRIDE] <= tMs) lo = mid;
      else hi = mid - 1;
    }
    const j = Math.min(lo + 1, last);
    const t0 = this.d[lo * STRIDE];
    const t1 = this.d[j * STRIDE];
    const f = t1 > t0 ? (tMs - t0) / (t1 - t0) : 0;
    const a = this.frameAt(lo);
    const b = this.frameAt(j);
    return {
      progress: lerp(a.progress, b.progress, f),
      lateral: lerp(a.lateral, b.lateral, f),
      y: lerp(a.y, b.y, f),
      lean: lerp(a.lean, b.lean, f),
      pitch: lerp(a.pitch, b.pitch, f),
      spin: lerp(a.spin, b.spin, f),
    };
  }
}
