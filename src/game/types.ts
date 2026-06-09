// Shared, engine-agnostic game types. No three.js / react-native imports here so
// this stays a pure simulation contract that any renderer can consume.

export interface BikeConfig {
  id: string;
  name: string;
  tagline: string;
  color: string;
  accent: string;
  price: number;
  /** Top speed in game units/sec (~ km/h when shown on the HUD). */
  topSpeed: number;
  /** How quickly throttle builds speed (units/sec^2). */
  accel: number;
  /** Braking strength (units/sec^2). */
  brake: number;
  /** Lateral responsiveness when steering (lane units/sec at full lock). */
  handling: number;
  /** 0..1 how strongly the bike resists sliding and recenters. */
  grip: number;
  /** Multiplier applied to speed while nitro is active. */
  nitroPower: number;
  /** Visual lean at full steer (radians). */
  lean: number;
}

export type RacePhase = 'countdown' | 'racing' | 'finished';

export interface InputState {
  steer: number; // -1 (left) .. 1 (right)
  throttle: number; // 0..1
  brake: number; // 0..1
  nitro: boolean;
  stunt: boolean; // hold for wheelie
}

export interface RacerState {
  id: number;
  isPlayer: boolean;
  name: string;
  bikeId: string;
  color: string;

  // Track-relative state (the simulation's source of truth).
  s: number; // distance along centerline [0..trackLength)
  lateral: number; // signed offset from centerline (lane units)
  speed: number; // current forward speed
  lap: number; // completed laps
  progress: number; // lap * length + s, for placement
  nextCheckpoint: number;

  // Derived world transform (filled each tick for the renderer).
  worldX: number;
  worldZ: number;
  worldY: number; // height for jumps
  vy: number; // vertical velocity (jump integration)
  heading: number; // yaw (radians)
  lean: number; // roll (radians)
  pitch: number; // wheelie pitch (radians)
  wheelSpin: number; // accumulated wheel rotation

  // Nitro & stunts.
  nitro: number; // 0..1 meter
  nitroActive: boolean;
  airtime: number;
  wheelieTime: number;
  stuntScore: number;

  // Standings.
  placement: number;
  finished: boolean;
  finishTimeMs: number;
}

export interface TrafficVehicle {
  active: boolean;
  s: number;
  lane: number;
  speed: number;
  kind: 'sedan' | 'truck' | 'bus';
  width: number;
  length: number;
  color: string;
}

export interface HudSnapshot {
  phase: RacePhase;
  countdown: number; // seconds remaining (ceil) during countdown
  timeMs: number;
  speed: number; // km/h-ish
  rpm: number; // 0..1 for the dial sweep
  gear: number;
  nitro: number; // 0..1
  nitroActive: boolean;
  lap: number;
  totalLaps: number;
  position: number;
  racerCount: number;
  stuntScore: number;
  comboLabel: string | null;
  comboTimer: number;
  drafting: boolean;
  flash: number; // 0..1 crash flash intensity
  conditions: string; // time-of-day + weather label
  ghostActive: boolean;
  ghostDelta: number; // player.progress - ghost.progress (+ ahead)
}
