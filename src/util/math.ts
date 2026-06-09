export const TAU = Math.PI * 2;

export const clamp = (v: number, min: number, max: number): number =>
  v < min ? min : v > max ? max : v;

export const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const invLerp = (a: number, b: number, v: number): number =>
  a === b ? 0 : clamp01((v - a) / (b - a));

export const smoothstep = (t: number): number => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};

// Framerate-independent exponential smoothing. `rate` ~ how fast it converges.
export const damp = (current: number, target: number, rate: number, dt: number): number =>
  lerp(current, target, 1 - Math.exp(-rate * dt));

export const moveTowards = (current: number, target: number, maxDelta: number): number => {
  const d = target - current;
  if (Math.abs(d) <= maxDelta) return target;
  return current + Math.sign(d) * maxDelta;
};

// Always-positive modulo, used for looping distance along a closed track.
export const mod = (n: number, m: number): number => ((n % m) + m) % m;

// Shortest signed angular difference (radians).
export const deltaAngle = (a: number, b: number): number => {
  let d = (b - a) % TAU;
  if (d < -Math.PI) d += TAU;
  if (d > Math.PI) d -= TAU;
  return d;
};

export const lerpAngle = (a: number, b: number, t: number): number => a + deltaAngle(a, b) * t;

export const formatTime = (ms: number): string => {
  if (!isFinite(ms) || ms < 0) ms = 0;
  const total = Math.floor(ms);
  const m = Math.floor(total / 60000);
  const s = Math.floor((total % 60000) / 1000);
  const cs = Math.floor((total % 1000) / 10);
  const pad = (n: number, l = 2) => n.toString().padStart(l, '0');
  return `${pad(m)}:${pad(s)}.${pad(cs)}`;
};

export const ordinal = (n: number): string => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};
