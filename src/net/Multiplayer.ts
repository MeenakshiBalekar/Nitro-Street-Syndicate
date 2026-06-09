// Networking seam. The vertical slice runs the race fully offline against AI,
// but all online flow goes through this interface so a real transport (Photon,
// Colyseus, Nakama, custom WebSocket relay, ...) can be dropped in later without
// touching gameplay code. Keep the race simulation host-authoritative: only the
// host advances RaceController and broadcasts RacerState snapshots; clients
// interpolate remote racers and reconcile the local player.

import { RacerState } from '../game/types';

export interface NetPlayer {
  id: string;
  name: string;
  bikeId: string;
  isHost: boolean;
  isLocal: boolean;
}

export interface RaceSnapshot {
  tick: number;
  serverTimeMs: number;
  racers: Pick<RacerState, 'id' | 's' | 'lateral' | 'speed' | 'lap' | 'nitroActive'>[];
}

export interface RoomEvents {
  onPlayersChanged?: (players: NetPlayer[]) => void;
  onSnapshot?: (snap: RaceSnapshot) => void;
  onStart?: (countdownMs: number) => void;
  onPlayerLeft?: (id: string) => void;
}

export interface RoomHandle {
  readonly code: string;
  readonly players: NetPlayer[];
  setReady(ready: boolean): void;
  sendInputState(steer: number, throttle: number, brake: number, nitro: boolean): void;
  /** Host only: publish the authoritative snapshot for this tick. */
  publishSnapshot(snap: RaceSnapshot): void;
  leave(): Promise<void>;
}

export interface NetTransport {
  connect(displayName: string): Promise<void>;
  createPrivateRoom(bikeId: string, events: RoomEvents): Promise<RoomHandle>;
  joinRoom(code: string, bikeId: string, events: RoomEvents): Promise<RoomHandle>;
  quickMatch(bikeId: string, events: RoomEvents): Promise<RoomHandle>;
  disconnect(): Promise<void>;
}

// Placeholder transport so the app compiles and the menu can explain the seam.
// Swap this for a concrete implementation to go live.
export class StubTransport implements NetTransport {
  async connect(): Promise<void> {
    throw new Error('Online play is stubbed in the vertical slice. Implement NetTransport to enable rooms.');
  }
  async createPrivateRoom(): Promise<RoomHandle> {
    throw new Error('not_implemented');
  }
  async joinRoom(): Promise<RoomHandle> {
    throw new Error('not_implemented');
  }
  async quickMatch(): Promise<RoomHandle> {
    throw new Error('not_implemented');
  }
  async disconnect(): Promise<void> {
    /* no-op */
  }
}
