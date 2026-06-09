import { clamp, clamp01, mod } from '../util/math';
import { AIDriver } from './ai';
import { BIKES, getBike } from './bikes';
import { input as sharedInput } from './input';
import { stepBike } from './physics';
import { COASTAL_TRACK, START_LANES, TOTAL_LAPS, TrackModel } from './track';
import { TrafficSystem } from './traffic';
import { GhostPlayer, GhostRecorder, GhostState } from './ghost';
import { HudSnapshot, InputState, RacePhase, RacerState } from './types';
import { pickWorld, WorldMood } from './world';

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
  readonly world: WorldMood = pickWorld();

  phase: RacePhase = 'countdown';
  paused = false; // set by the race screen; the render loop skips ticking while true
  countdownMs = COUNTDOWN_MS;
  clockMs = 0;
  comboLabel: string | null = null;
  comboTimer = 0;
  shake = 0; // transient camera-shake request (0..1), read by the view
  flash = 0; // transient crash-flash intensity (0..1)
  drafting = false; // player currently in a slipstream

  readonly player: RacerState;
  private ai: { racer: RacerState; driver: AIDriver }[] = [];
  private nearActive: boolean[];
  private hitCooldown = 0;
  private draftLatch = false;

  // Ghost racing.
  private recorder = new GhostRecorder();
  private ghost: GhostPlayer | null = null;
  private ghostProgress = 0;
  readonly ghostState: GhostState = {
    active: false, worldX: 0, worldY: 0, worldZ: 0, heading: 0, lean: 0, pitch: 0, spin: 0,
  };

  constructor(playerBikeId: string, ghostData?: number[]) {
    // Pole for the player, AI fill the rest of the grid slightly behind.
    this.player = makeRacer(true, 'You', playerBikeId, START_LANES[0], 6);
    this.racers.push(this.player);

    if (ghostData && ghostData.length >= 7) {
      this.ghost = new GhostPlayer(ghostData);
      this.ghostState.active = true;
    }

    const pool = BIKES.map((b) => b.id).filter((id) => id !== playerBikeId);
    for (let i = 0; i < 3; i++) {
      const bikeId = pool[i % pool.length] ?? BIKES[(i + 1) % BIKES.length].id;
      const r = makeRacer(false, AI_NAMES[i], bikeId, START_LANES[i + 1], 4 - i * 2);
      this.racers.push(r);
      this.ai.push({ racer: r, driver: new AIDriver(0.86 + i * 0.02, (i + 1) * 0.37) });
    }

    this.traffic = new TrafficSystem(this.track.length);
    this.nearActive = new Array(this.traffic.vehicles.length).fill(false);
    this.racers.forEach((r) => this.computeWorld(r));
    this.updateGhost(0);
    this.updatePlacements();
  }

  // Place the ghost from its recording at race time `tMs`.
  private updateGhost(tMs: number): void {
    if (!this.ghost) return;
    const g = this.ghost.sample(tMs);
    if (!g) return;
    this.ghostProgress = g.progress;
    const sm = this.track.sample(g.progress);
    this.ghostState.worldX = sm.x + sm.nx * g.lateral;
    this.ghostState.worldZ = sm.z + sm.nz * g.lateral;
    this.ghostState.worldY = g.y;
    this.ghostState.heading = Math.atan2(sm.tx, sm.tz) + g.lean * 0.25;
    this.ghostState.lean = g.lean;
    this.ghostState.pitch = g.pitch;
    this.ghostState.spin = g.spin;
  }

  getRecording(): number[] {
    return this.recorder.data();
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
        p.speed *= 0.6;
        p.nitro = clamp01(p.nitro - 0.1);
        this.hitCooldown = 0.8;
        this.shake = 1;
        this.flash = 1;
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

  // Slipstream: tucking into the wake just behind another racer grants a draft
  // boost and a trickle of nitro — the core overtaking mechanic.
  private resolveDraft(dt: number): void {
    const L = this.track.length;
    const p = this.player;
    this.drafting = false;
    for (const r of this.racers) {
      if (r === p) continue;
      let ds = mod(r.s - p.s, L);
      if (ds > L / 2) ds -= L; // + means r is ahead of the player
      if (ds > 1.5 && ds < 16 && Math.abs(p.lateral - r.lateral) < 3.2) {
        this.drafting = true;
        const cfg = getBike(p.bikeId);
        p.speed = Math.min(cfg.topSpeed * 1.18, p.speed + 55 * dt);
        p.nitro = clamp01(p.nitro + 0.05 * dt);
        if (!this.draftLatch) {
          this.draftLatch = true;
          this.setCombo('SLIPSTREAM');
        }
        break;
      }
    }
    if (!this.drafting) this.draftLatch = false;
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

    // Player. Throttle is automatic (assist): full unless the player is braking.
    // The UI only sends steer / brake / nitro / stunt, so we derive throttle here
    // rather than trusting the caller to set it.
    const playerInput: InputState = { ...input, throttle: input.brake > 0.05 ? 0 : 1 };
    const res = stepBike(this.player, getBike(this.player.bikeId), playerInput, this.track, dt);
    if (res.event) this.setCombo(res.event);

    // AI — rubber-band toward the player's progress to keep the pack tight.
    for (const { racer, driver } of this.ai) {
      // Two-way rubber-band: leaders ease off, trailers (often the player on the
      // starter bike) get a real catch-up so the first race stays winnable.
      const lead = racer.progress - this.player.progress;
      const rubber = clamp(1 - lead / 350, 0.85, 1.12);
      driver.update(racer, getBike(racer.bikeId), this.track, dt, rubber);
    }

    this.traffic.update(dt, this.player.s);
    this.resolveTraffic(dt);
    this.resolveDraft(dt);

    for (const r of this.racers) {
      this.wrapLaps(r);
      this.computeWorld(r);
    }
    this.updatePlacements();

    // Record this run and replay the loaded ghost (visual only).
    this.recorder.record(dt, this.clockMs, this.player);
    this.updateGhost(this.clockMs);

    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.comboLabel = null;
    }
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 2.5);
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 2);

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
      drafting: this.drafting,
      flash: this.flash,
      conditions: this.world.name,
      ghostActive: !!this.ghost,
      ghostDelta: this.ghost ? p.progress - this.ghostProgress : 0,
    };
  }

  results(): RacerState[] {
    return [...this.racers].sort((a, b) => a.placement - b.placement);
  }
}
