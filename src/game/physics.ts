import { clamp, clamp01, damp } from '../util/math';
import { BikeConfig, InputState, RacerState } from './types';
import { TrackModel } from './track';

const GRAVITY = 26;
const NITRO_DRAIN_PER_SEC = 0.42;
const NITRO_REGEN_PER_SEC = 0.02;
const WHEELIE_CHARGE_PER_SEC = 0.14;
const WHEELIE_MIN_SPEED = 55;

export interface StepResult {
  event: string | null; // combo label for the HUD (player only)
  nitroBurned: boolean;
}

// Advance one racer's arcade simulation by `dt` seconds. Pure: only mutates the
// passed racer. The model is intentionally forgiving — strong traction, capped
// lean, assisted landings — per the "arcade-stable, fun over realism" brief.
export function stepBike(
  r: RacerState,
  cfg: BikeConfig,
  input: InputState,
  track: TrackModel,
  dt: number,
): StepResult {
  let event: string | null = null;

  const airborne = r.worldY > 0.01 || r.vy > 0.01;
  const offRoad = Math.abs(r.lateral) > track.halfWidth;

  // --- Nitro state ---------------------------------------------------------
  const wantNitro = input.nitro && r.nitro > 0.001 && r.speed > 18;
  r.nitroActive = wantNitro;
  const topEff = cfg.topSpeed * (wantNitro ? cfg.nitroPower : 1);

  // --- Longitudinal speed --------------------------------------------------
  const throttle = airborne ? 0 : input.throttle;
  let accel = throttle * cfg.accel * (wantNitro ? 1.7 : 1);
  // Soft approach to the (nitro-adjusted) top speed.
  accel *= clamp01(1 - r.speed / Math.max(topEff, 1));
  r.speed += accel * dt;
  r.speed -= input.brake * cfg.brake * dt;

  // Drag: gentle rolling resistance + hard pull-down above top speed + coasting.
  const overspeed = r.speed > topEff ? (r.speed - topEff) * 2.5 : 0;
  const coast = throttle < 0.05 && input.brake < 0.05 ? r.speed * 0.5 : r.speed * 0.05;
  r.speed -= (overspeed + coast) * dt;
  if (offRoad) r.speed -= r.speed * 1.4 * dt; // grass/sand scrub
  r.speed = Math.max(0, r.speed);

  if (wantNitro) {
    r.nitro = clamp01(r.nitro - NITRO_DRAIN_PER_SEC * dt);
  } else {
    r.nitro = clamp01(r.nitro + NITRO_REGEN_PER_SEC * dt);
  }

  // --- Steering / lateral --------------------------------------------------
  const speedFactor = clamp(r.speed / (cfg.topSpeed * 0.5), 0.25, 1);
  const steerAuth = airborne ? 0.25 : 1;
  r.lateral += input.steer * cfg.handling * speedFactor * steerAuth * dt;
  // Grip nudges the bike to hold its line rather than drift outward.
  r.lateral -= r.lateral * (1 - cfg.grip) * 0.6 * dt;
  const limit = track.halfWidth + 4.5;
  r.lateral = clamp(r.lateral, -limit, limit);

  // --- Distance along track ------------------------------------------------
  r.s += r.speed * dt;
  r.wheelSpin += r.speed * dt * 0.12;

  // --- Wheelie / stunt -----------------------------------------------------
  let targetPitch = 0;
  if (input.stunt && r.speed > WHEELIE_MIN_SPEED && !airborne) {
    r.wheelieTime += dt;
    targetPitch = -0.55;
    r.nitro = clamp01(r.nitro + WHEELIE_CHARGE_PER_SEC * dt);
    r.stuntScore += dt * 45;
    if (r.wheelieTime > 1.4) event = 'WHEELIE!';
  } else {
    r.wheelieTime = Math.max(0, r.wheelieTime - dt * 2);
  }

  // --- Ramps & jumps -------------------------------------------------------
  const ramp = track.rampAt(r.s);
  if (ramp && !airborne) {
    if (ramp.kind === 'boost') {
      r.speed = Math.min(topEff * 1.05, r.speed + 60 * dt);
      r.nitro = clamp01(r.nitro + 0.18 * dt);
    } else if (r.speed > 90) {
      // Launch off the ramp.
      r.vy = clamp(r.speed * 0.05, 6, 11);
      r.airtime = 0;
    }
  }

  if (airborne) {
    r.airtime += dt;
    r.worldY += r.vy * dt;
    r.vy -= GRAVITY * dt;
    targetPitch = clamp(-r.vy * 0.03, -0.4, 0.4);
    if (r.worldY <= 0) {
      // Assisted landing: snap upright, reward airtime.
      const gained = clamp01(r.airtime * 0.25);
      r.nitro = clamp01(r.nitro + gained);
      r.stuntScore += Math.round(r.airtime * 600);
      if (r.airtime > 0.5) event = 'BIG AIR +' + Math.round(r.airtime * 600);
      r.worldY = 0;
      r.vy = 0;
      r.airtime = 0;
    }
  }

  // --- Visual lean & pitch (smoothed) -------------------------------------
  const targetLean = -input.steer * cfg.lean * speedFactor;
  r.lean = damp(r.lean, targetLean, 9, dt);
  r.pitch = damp(r.pitch, targetPitch, 10, dt);

  return { event, nitroBurned: wantNitro };
}
