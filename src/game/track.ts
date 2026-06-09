import { mod } from '../util/math';

export interface Vec2 {
  x: number;
  z: number;
}

export interface TrackSample {
  x: number;
  z: number;
  tx: number; // unit tangent (forward)
  tz: number;
  nx: number; // unit left-normal
  nz: number;
}

export interface RampZone {
  s: number;
  length: number;
  kind: 'ramp' | 'boost';
}

// Control points for the coastal circuit (x,z in world units). Catmull-Rom is
// run through these as a closed loop to produce a smooth, flowing road.
const WAYPOINTS: Vec2[] = [
  { x: 0, z: 0 },
  { x: 220, z: 40 },
  { x: 380, z: 180 },
  { x: 420, z: 380 },
  { x: 300, z: 520 },
  { x: 120, z: 560 },
  { x: -120, z: 520 },
  { x: -300, z: 560 },
  { x: -460, z: 420 },
  { x: -480, z: 200 },
  { x: -360, z: 40 },
  { x: -160, z: -40 },
];

const SAMPLES_PER_SEGMENT = 26;

const catmull = (p0: number, p1: number, p2: number, p3: number, t: number): number => {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
};

export class TrackModel {
  readonly points: Vec2[] = [];
  readonly tangents: Vec2[] = [];
  readonly normals: Vec2[] = [];
  readonly cum: number[] = [];
  readonly length: number;
  readonly halfWidth = 9;
  readonly checkpoints: number[];
  readonly ramps: RampZone[];

  constructor() {
    const n = WAYPOINTS.length;
    // Build the dense polyline from the closed Catmull-Rom spline.
    for (let i = 0; i < n; i++) {
      const p0 = WAYPOINTS[(i - 1 + n) % n];
      const p1 = WAYPOINTS[i];
      const p2 = WAYPOINTS[(i + 1) % n];
      const p3 = WAYPOINTS[(i + 2) % n];
      for (let j = 0; j < SAMPLES_PER_SEGMENT; j++) {
        const t = j / SAMPLES_PER_SEGMENT;
        this.points.push({
          x: catmull(p0.x, p1.x, p2.x, p3.x, t),
          z: catmull(p0.z, p1.z, p2.z, p3.z, t),
        });
      }
    }

    const count = this.points.length;
    // Tangents via central difference, then left-normals; accumulate arc length.
    let total = 0;
    for (let i = 0; i < count; i++) {
      const prev = this.points[(i - 1 + count) % count];
      const next = this.points[(i + 1) % count];
      let tx = next.x - prev.x;
      let tz = next.z - prev.z;
      const len = Math.hypot(tx, tz) || 1;
      tx /= len;
      tz /= len;
      this.tangents.push({ x: tx, z: tz });
      // Left-normal = tangent rotated +90deg in the XZ plane.
      this.normals.push({ x: -tz, z: tx });

      this.cum.push(total);
      const seg = this.points[(i + 1) % count];
      total += Math.hypot(seg.x - this.points[i].x, seg.z - this.points[i].z);
    }
    this.length = total;

    this.checkpoints = [0, 0.25, 0.5, 0.75].map((f) => f * total);
    this.ramps = [
      { s: total * 0.18, length: 34, kind: 'boost' },
      { s: total * 0.46, length: 40, kind: 'ramp' },
      { s: total * 0.72, length: 34, kind: 'boost' },
    ];
  }

  // Sample the centerline at distance `s` (wraps around the loop).
  sample(s: number): TrackSample {
    const d = mod(s, this.length);
    const count = this.points.length;
    // Binary search the cumulative-length array for the containing segment.
    let lo = 0;
    let hi = count - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (this.cum[mid] <= d) lo = mid;
      else hi = mid - 1;
    }
    const i = lo;
    const j = (i + 1) % count;
    const segLen = (this.cum[j] === 0 ? this.length : this.cum[j]) - this.cum[i];
    const t = segLen > 0 ? (d - this.cum[i]) / segLen : 0;

    const a = this.points[i];
    const b = this.points[j];
    const ta = this.tangents[i];
    const tb = this.tangents[j];
    const na = this.normals[i];
    const nb = this.normals[j];
    const tx = ta.x + (tb.x - ta.x) * t;
    const tz = ta.z + (tb.z - ta.z) * t;
    const tl = Math.hypot(tx, tz) || 1;
    return {
      x: a.x + (b.x - a.x) * t,
      z: a.z + (b.z - a.z) * t,
      tx: tx / tl,
      tz: tz / tl,
      nx: na.x + (nb.x - na.x) * t,
      nz: na.z + (nb.z - na.z) * t,
    };
  }

  rampAt(s: number): RampZone | null {
    const d = mod(s, this.length);
    for (const r of this.ramps) {
      if (d >= r.s && d <= r.s + r.length) return r;
    }
    return null;
  }
}

// Single shared instance — the launch circuit.
export const COASTAL_TRACK = new TrackModel();

// Lateral lanes for the start grid (player gets pole-ish inside line).
export const START_LANES = [-3.5, 3.5, -6.5, 6.5];
export const TOTAL_LAPS = 3;
