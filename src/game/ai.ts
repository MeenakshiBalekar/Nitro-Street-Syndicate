import { damp, moveTowards } from '../util/math';
import { BikeConfig, RacerState } from './types';
import { TrackModel } from './track';

// Lightweight rubber-banded AI. Each driver targets a fraction of its bike's top
// speed, weaves gently between lanes, and occasionally pops a nitro burst so the
// pack stays competitive without ever feeling robotic.
export class AIDriver {
  private weaveT: number;
  private weaveLane: number;
  private burstTimer: number;
  private bursting = 0;

  constructor(public skill: number, seed: number) {
    this.weaveT = seed * 6.28;
    this.weaveLane = 3 + (seed % 1) * 3;
    this.burstTimer = 2 + seed * 4;
  }

  update(
    r: RacerState,
    cfg: BikeConfig,
    track: TrackModel,
    dt: number,
    rubberband: number,
  ): void {
    this.weaveT += dt * 0.6;
    this.burstTimer -= dt;
    if (this.burstTimer <= 0) {
      this.bursting = 0.9;
      this.burstTimer = 5 + Math.random() * 6;
    }
    if (this.bursting > 0) this.bursting -= dt;

    const boosting = this.bursting > 0;
    r.nitroActive = boosting;
    const targetSpeed =
      cfg.topSpeed * this.skill * rubberband * (boosting ? cfg.nitroPower : 1);
    r.speed = moveTowards(r.speed, targetSpeed, cfg.accel * 1.2 * dt);

    r.s += r.speed * dt;
    r.wheelSpin += r.speed * dt * 0.12;

    const targetLat = Math.sin(this.weaveT) * this.weaveLane;
    const prevLat = r.lateral;
    r.lateral = damp(r.lateral, targetLat, 2.2, dt);
    r.lean = damp(r.lean, (prevLat - r.lateral) * 6, 8, dt);
    r.pitch = damp(r.pitch, 0, 8, dt);
    r.nitro = boosting ? Math.max(0, r.nitro - dt * 0.3) : Math.min(1, r.nitro + dt * 0.05);
  }
}
