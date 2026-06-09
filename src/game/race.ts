import { clamp, clamp01, mod } from '../util/math';
import { AIDriver } from './ai';
import { BIKES, getBike } from './bikes';
import { input as sharedInput } from './input';
import { stepBike } from './physics';
import { COASTAL_TRACK, START_LANES, TOTAL_LAPS, TrackModel } from './track';
import { TrafficSystem } from './traffic';
import { HudSnapshot, InputState, RacePhase, RacerState } from './types';

const COUNTDOWN_MS = 3300;
const AI_NAMES = ['Rogue', 'Apex', 'Nyx'];

let nextId = 0;
function makeRacer(
  isPlayer: boolean,
  name: string,
  bikeId: string,
  lane: number,
  sStart: number,
): RacerState {
  const bike = getBike(bikeId);
  return {
    id: nextId++,
    isPlayer,
    name,
    bikeId,
    color: bike.color,
    s: sStart,
    lateral: lane,
    speed: 0,
    lap: 0,
    progress: sStart,
    nextCheckpoint: 0,
    worldX: 0,
    worldZ: 0,
    worldY: 0,
    vy: 0,
    heading: 0,
    lean: 0,
    pitch: 0,
    wheelSpin: 0,
    nitro: 0.35,
    nitroActive: false,
    airtime: 0,
    wheelieTime: 0,
    stuntScore: 0,
    placement: 1,
    finished: false,
    finishTimeMs: 0,
  };
}

export class RaceController {
  readonly track: TrackModel = COASTAL_TRACK;
  readonly racers: RacerState[] = [];
  readonly traffic: TrafficSystem;
  readonly totalLaps = TOTAL_LAPS;

  phase: RacePhase = 'countdown';
  countdownMs = COUNTDOWN_MS;
  clockMs = 0;
  comboLabel: string | null = null;
  comboTimer = 0;
  shake = 0; // transient camera-shake request (0..1), read by the view

  readonly player: RacerState;
  private ai: { racer: RacerState; driver: AIDriver }[] = [];
  private nearActive: boolean[];
  private hitCooldown = 0;

  constructor(playerBikeId: string) {
    // Pole for the player, AI fill the rest of the grid slightly behind.
    this.player = makeRacer(true, 'You', playerBikeId, START_LANES[0], 6);
    this.racers.push(this.player);

    const pool = BIKES.map((b) => b.id).filter((id) => id !== playerBikeId);
    for (let i = 0; i < 3; i++) {
      const bikeId = pool[i % pool.length] ?? BIKES[(i + 1) % BIKES.length].id;
      const r = makeRacer(false, AI_NAMES[i], bikeId, START_LANES[i + 1], 4 - i * 2);
      this.racers.push(r);
      this.ai.push({ racer: r, driver: new AIDriver(0.9 + i * 0.02, (i + 1) * 0.37) });
    }

    this.traffic = new TrafficSystem(this.track.length);
    this.nearActive = new Array(this.traffic.vehicles.length).fill(false);
    this.racers.forEach((r) => this.computeWorld(r));
    this.updatePlacements();
  }

  start(): void {
    this.phase = 'countdown';
    this.countdownMs = COUNTDOWN_MS;
  }

  private computeWorld(r: RacerState): void {
    const sm = this.track.sample(r.s);
    r.worldX = sm.x + sm.nx * r.lateral;
    r.worldZ = sm.z + sm.nz * r.lateral;
    // Mesh forward is +Z, so yaw = atan2(tangent.x, tangent.z); add steer-lean yaw.
    r.heading = Math.atan2(sm.tx, sm.tz) + r.lean * 0.25;
  }

  private wrapLaps(r: RacerState): void {
    while (r.s >= this.track.length) {
      r.s -= this.track.length;
      r.lap += 1;
      if (r.lap >= this.totalLaps && !r.finished) {
        r.finished = true;
        r.finishTimeMs = this.clockMs;
      }
    }
    r.progress = r.lap * this.track.length + r.s;
  }

  private updatePlacements(): void {
    const order = [...this.racers].sort((a, b) => {
      if (a.finished && b.finished) return a.finishTimeMs - b.finishTimeMs;
      if (a.finished) return -1;
      if (b.finished) return 1;
      return b.progress - a.progress;
    });
    order.forEach((r, i) => (r.placement = i + 1));
  }

  private setCombo(label: string): void {
    this.comboLabel = label;
    this.comboTimer = 1.7;
  }

  // Near-miss rewards + collision penalty against the traffic stream.
  private resolveTraffic(dt: number): void {
    const L = this.track.length;
    const p = this.player;
    if (this.hitCooldown > 0) this.hitCooldown -= dt;
    const v = this.traffic.vehicles;
    for (let i = 0; i < v.length; i++) {
      const car = v[i];
      let ds = mod(car.s - p.s, L);
      if (ds > L / 2) ds -= L; // signed: + ahead of player
      const latDiff = Math.abs(p.lateral - car.lane);

      const longHit = Math.abs(ds) < car.length / 2 + 1.4;
      const longNear = Math.abs(ds) < 7;
      const hitLane = latDiff < car.width / 2 + 1.1;
      const nearLane = latDiff < car.width / 2 + 2.6;

      if (longHit && hitLane && this.hitCooldown <= 0 && p.worldY < 0.5) {
        p.speed *= 0.42;
        p.nitro = clamp01(p.nitro - 0.1);
        this.hitCooldown = 0.8;
        this.shake = 1;
        this.setCombo('CRASH!');
        this.nearActive[i] = true;
      } else if (longNear && nearLane && !hitLane) {
        if (!this.nearActive[i]) {
          this.nearActive[i] = true;
          p.nitro = clamp01(p.nitro + 0.07);
          p.stuntScore += 60;
          this.setCombo('NEAR MISS +60');
        }
      } else if (!longNear) {
        this.nearActive[i] = false;
      }
    }
  }

  tick(dt: number, input: InputState = sharedInput): void {
    // Fixed-ish clamp so a long frame (tab switch, GC) can't explode the sim.
    dt = Math.min(dt, 1 / 30);

    if (this.phase === 'countdown') {
      this.countdownMs -= dt * 1000;
      if (this.countdownMs <= 0) {
        this.countdownMs = 0;
        this.phase = 'racing';
      }
      this.racers.forEach((r) => this.computeWorld(r));
      return;
    }

    if (this.phase === 'finished') {
      // Let bikes coast to a stop for a tidy results transition.
      this.racers.forEach((r) => {
        r.speed = Math.max(0, r.speed - 120 * dt);
        r.s += r.speed * dt;
        this.computeWorld(r);
      });
      return;
    }

    this.clockMs += dt * 1000;

    // Player.
    const res = stepBike(this.player, getBike(this.player.bikeId), input, this.track, dt);
    if (res.event) this.setCombo(res.event);

    // AI — rubber-band toward the player's progress to keep the pack tight.
    for (const { racer, driver } of this.ai) {
      const lead = racer.progress - this.player.progress;
      const rubber = clamp(1 - lead / 600, 0.92, 1.07);
      driver.update(racer, getBike(racer.bikeId), this.track, dt, rubber);
    }

    this.traffic.update(dt, this.player.s);
    this.resolveTraffic(dt);

    for (const r of this.racers) {
      this.wrapLaps(r);
      this.computeWorld(r);
    }
    this.updatePlacements();

    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.comboLabel = null;
    }
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 2.5);

    if (this.player.finished) {
      this.phase = 'finished';
    }
  }

  getHud(): HudSnapshot {
    const p = this.player;
    const cfg = getBike(p.bikeId);
    const ratio = clamp01(p.speed / cfg.topSpeed);
    return {
      phase: this.phase,
      countdown: Math.ceil(this.countdownMs / 1000),
      timeMs: this.clockMs,
      speed: Math.round(p.speed),
      rpm: clamp01(ratio * 0.85 + (p.nitroActive ? 0.15 : 0)),
      gear: clamp(Math.floor(ratio * 5) + 1, 1, 6),
      nitro: p.nitro,
      nitroActive: p.nitroActive,
      lap: Math.min(p.lap + 1, this.totalLaps),
      totalLaps: this.totalLaps,
      position: p.placement,
      racerCount: this.racers.length,
      stuntScore: Math.round(p.stuntScore),
      comboLabel: this.comboLabel,
      comboTimer: this.comboTimer,
    };
  }

  results(): RacerState[] {
    return [...this.racers].sort((a, b) => a.placement - b.placement);
  }
}
