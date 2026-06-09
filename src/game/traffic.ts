import { mod } from '../util/math';
import { TrafficVehicle } from './types';

const LANES = [-6.5, -3, 3, 6.5];
const KINDS: TrafficVehicle['kind'][] = ['sedan', 'sedan', 'truck', 'bus'];
const COLORS = ['#C9D2E3', '#5A6B8C', '#B5453B', '#3B7AB5', '#E0A92E', '#6B6F76'];

const kindDims = (k: TrafficVehicle['kind']) => {
  switch (k) {
    case 'truck':
      return { width: 3.2, length: 11, speed: 78 };
    case 'bus':
      return { width: 3.0, length: 13, speed: 70 };
    default:
      return { width: 2.4, length: 6, speed: 92 };
  }
};

// A small pool of vehicles kept on the road ahead of the player. As the player
// overtakes one it is recycled forward, producing an endless stream to weave
// through. Same model serves near-miss detection in the race controller.
export class TrafficSystem {
  readonly vehicles: TrafficVehicle[] = [];

  constructor(
    private trackLength: number,
    count = 7,
  ) {
    for (let i = 0; i < count; i++) {
      this.vehicles.push(this.spawn(((i + 1) / count) * trackLength * 0.5, i));
    }
  }

  private spawn(s: number, i: number): TrafficVehicle {
    const kind = KINDS[Math.floor(Math.random() * KINDS.length)];
    const dims = kindDims(kind);
    return {
      active: true,
      s: mod(s, this.trackLength),
      lane: LANES[(i + Math.floor(Math.random() * LANES.length)) % LANES.length],
      kind,
      speed: dims.speed * (0.9 + Math.random() * 0.2),
      width: dims.width,
      length: dims.length,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    };
  }

  update(dt: number, playerS: number): void {
    const L = this.trackLength;
    for (let i = 0; i < this.vehicles.length; i++) {
      const v = this.vehicles[i];
      v.s = mod(v.s + v.speed * dt, L);
      // Forward gap from player to vehicle (0..L). If the vehicle is now well
      // behind the player, recycle it to somewhere ahead.
      const gap = mod(v.s - playerS, L);
      if (gap > L * 0.55 && gap < L * 0.97) {
        const ahead = playerS + 130 + Math.random() * 160;
        this.vehicles[i] = this.spawn(ahead, i);
      }
    }
  }
}
