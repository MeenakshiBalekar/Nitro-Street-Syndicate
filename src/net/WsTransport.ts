import { NetPlayer, NetTransport, RaceSnapshot, RoomEvents, RoomHandle } from './Multiplayer';

interface ServerPlayer {
  id: string;
  name: string;
  bikeId: string;
  isHost: boolean;
  ready: boolean;
}

// Concrete WebSocket transport for the relay in server/relay.mjs. Implements the
// same NetTransport seam the rest of the app already targets, so wiring the
// lobby/race to it requires no gameplay changes. Uses the global WebSocket
// (browser, React Native, and Node 22+).
export class WsTransport implements NetTransport {
  private ws: WebSocket | null = null;
  private localId = '';
  private welcome: (() => void) | null = null;
  private pending: { resolve: (h: RoomHandle) => void; reject: (e: Error) => void; events: RoomEvents } | null = null;
  private room: { events: RoomEvents; handle: RoomHandle } | null = null;

  constructor(private url: string) {}

  connect(displayName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const WS = globalThis.WebSocket;
      if (!WS) return reject(new Error('WebSocket is unavailable in this environment'));
      const ws = new WS(this.url);
      this.ws = ws;
      const timer = setTimeout(() => reject(new Error('connect timeout')), 8000);
      this.welcome = () => {
        clearTimeout(timer);
        this.send('hello', { name: displayName });
        resolve();
      };
      ws.onmessage = (e: MessageEvent) => this.onMessage(e);
      ws.onerror = () => {
        clearTimeout(timer);
        reject(new Error('WebSocket connection failed'));
      };
    });
  }

  createPrivateRoom(bikeId: string, events: RoomEvents): Promise<RoomHandle> {
    return this.openRoom('create', { bikeId }, events);
  }

  joinRoom(code: string, bikeId: string, events: RoomEvents): Promise<RoomHandle> {
    return this.openRoom('join', { code: code.toUpperCase(), bikeId }, events);
  }

  quickMatch(bikeId: string, events: RoomEvents): Promise<RoomHandle> {
    return this.openRoom('quick', { bikeId }, events);
  }

  async disconnect(): Promise<void> {
    try {
      this.ws?.close();
    } catch {
      /* ignore */
    }
    this.ws = null;
    this.room = null;
  }

  // --- internals -------------------------------------------------------------

  private openRoom(type: string, payload: Record<string, unknown>, events: RoomEvents): Promise<RoomHandle> {
    return new Promise((resolve, reject) => {
      if (!this.ws) return reject(new Error('not connected'));
      this.pending = { resolve, reject, events };
      this.send(type, payload);
    });
  }

  private send(type: string, payload: Record<string, unknown>): void {
    const ws = this.ws;
    if (ws && ws.readyState === ws.OPEN) ws.send(JSON.stringify({ type, ...payload }));
  }

  private mapPlayers(list: ServerPlayer[]): NetPlayer[] {
    return list.map((p) => ({
      id: p.id,
      name: p.name,
      bikeId: p.bikeId,
      isHost: p.isHost,
      isLocal: p.id === this.localId,
    }));
  }

  private makeHandle(code: string): RoomHandle {
    const self = this;
    return {
      code,
      players: [],
      setReady(ready: boolean) {
        self.send('ready', { ready });
      },
      sendInputState(steer: number, throttle: number, brake: number, nitro: boolean) {
        self.send('input', { steer, throttle, brake, nitro });
      },
      publishSnapshot(snap: RaceSnapshot) {
        self.send('snapshot', { snap });
      },
      async leave() {
        self.send('leave', {});
        self.room = null;
      },
    };
  }

  private applyPlayers(handle: RoomHandle, list: ServerPlayer[], events: RoomEvents): void {
    const mapped = this.mapPlayers(list);
    handle.players.splice(0, handle.players.length, ...mapped);
    events.onPlayersChanged?.(mapped);
  }

  private onMessage(e: MessageEvent): void {
    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(typeof e.data === 'string' ? e.data : String(e.data));
    } catch {
      return;
    }
    switch (msg.type) {
      case 'welcome':
        this.localId = String(msg.id);
        this.welcome?.();
        this.welcome = null;
        break;
      case 'room': {
        const code = String(msg.code);
        const handle = this.makeHandle(code);
        const events = this.pending?.events ?? this.room?.events ?? {};
        this.room = { events, handle };
        this.applyPlayers(handle, (msg.players as ServerPlayer[]) ?? [], events);
        this.pending?.resolve(handle);
        this.pending = null;
        break;
      }
      case 'players':
        if (this.room) this.applyPlayers(this.room.handle, (msg.players as ServerPlayer[]) ?? [], this.room.events);
        break;
      case 'snapshot':
        this.room?.events.onSnapshot?.(msg.snap as RaceSnapshot);
        break;
      case 'start':
        this.room?.events.onStart?.(Number(msg.countdownMs) || 3300);
        break;
      case 'left':
        this.room?.events.onPlayerLeft?.(String(msg.id));
        break;
      case 'error':
        this.pending?.reject(new Error(String(msg.message)));
        this.pending = null;
        break;
    }
  }
}
