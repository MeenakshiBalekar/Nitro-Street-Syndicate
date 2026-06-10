/**
 * Nitro Street Syndicate — minimal authoritative-host relay.
 *
 * A tiny WebSocket relay for private 4-player rooms. It does not simulate the
 * race; the HOST client runs RaceController and broadcasts snapshots, and the
 * relay just forwards messages within a room and tracks membership.
 *
 * Run locally:   node server/relay.mjs           (PORT env, default 8787)
 * Deploy:        any Node host (Render / Fly / Railway / a VPS). One file, one dep (ws).
 *
 * Protocol (JSON):
 *   client -> server: hello{name} create{bikeId} join{code,bikeId} quick{bikeId}
 *                     ready{ready} input{...} snapshot{snap} start{countdownMs} leave
 *   server -> client: welcome{id} room{code,players} players{players}
 *                     snapshot{snap} start{countdownMs} left{id} error{message}
 */
import { WebSocketServer } from 'ws';

const MAX_PLAYERS = 4;
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const randomCode = () =>
  Array.from({ length: 4 }, () => CODE_CHARS[(Math.random() * CODE_CHARS.length) | 0]).join('');

export function startRelay(port = Number(process.env.PORT) || 8787) {
  const wss = new WebSocketServer({ port });
  /** @type {Map<string, {code:string, players:Map<string, any>}>} */
  const rooms = new Map();
  let nextId = 1;

  const playerList = (room) =>
    [...room.players.values()].map((p) => ({
      id: p.id,
      name: p.name,
      bikeId: p.bikeId,
      isHost: p.isHost,
      ready: p.ready,
    }));

  const send = (ws, type, payload) => {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ type, ...payload }));
  };

  const broadcast = (room, type, payload, exceptId) => {
    for (const p of room.players.values()) {
      if (p.id !== exceptId) send(p.ws, type, payload);
    }
  };

  const broadcastPlayers = (room) => broadcast(room, 'players', { players: playerList(room) });

  const leaveRoom = (client) => {
    const room = client.room && rooms.get(client.room);
    if (!room) return;
    room.players.delete(client.id);
    client.room = null;
    if (room.players.size === 0) {
      rooms.delete(room.code);
      return;
    }
    // Promote a new host if the host left.
    if (![...room.players.values()].some((p) => p.isHost)) {
      const first = room.players.values().next().value;
      if (first) first.isHost = true;
    }
    broadcast(room, 'left', { id: client.id });
    broadcastPlayers(room);
  };

  const joinRoom = (client, room) => {
    if (room.players.size >= MAX_PLAYERS) {
      send(client.ws, 'error', { message: 'Room is full' });
      return false;
    }
    client.isHost = room.players.size === 0;
    client.room = room.code;
    room.players.set(client.id, client);
    send(client.ws, 'room', { code: room.code, players: playerList(room) });
    broadcastPlayers(room);
    return true;
  };

  wss.on('connection', (ws) => {
    const client = { id: `p${nextId++}`, ws, name: 'Rider', bikeId: 'striker', ready: false, isHost: false, room: null };
    send(ws, 'welcome', { id: client.id });

    ws.on('message', (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }
      const room = client.room && rooms.get(client.room);
      switch (msg.type) {
        case 'hello':
          if (typeof msg.name === 'string') client.name = msg.name.slice(0, 16);
          break;
        case 'create': {
          if (msg.bikeId) client.bikeId = msg.bikeId;
          let code = randomCode();
          while (rooms.has(code)) code = randomCode();
          const r = { code, players: new Map() };
          rooms.set(code, r);
          joinRoom(client, r);
          break;
        }
        case 'join': {
          if (msg.bikeId) client.bikeId = msg.bikeId;
          const r = rooms.get((msg.code || '').toUpperCase());
          if (!r) {
            send(ws, 'error', { message: 'Room not found' });
            break;
          }
          joinRoom(client, r);
          break;
        }
        case 'quick': {
          if (msg.bikeId) client.bikeId = msg.bikeId;
          let r = [...rooms.values()].find((x) => x.players.size > 0 && x.players.size < MAX_PLAYERS);
          if (!r) {
            let code = randomCode();
            while (rooms.has(code)) code = randomCode();
            r = { code, players: new Map() };
            rooms.set(code, r);
          }
          joinRoom(client, r);
          break;
        }
        case 'ready':
          client.ready = !!msg.ready;
          if (room) broadcastPlayers(room);
          break;
        case 'start':
          if (room && client.isHost) broadcast(room, 'start', { countdownMs: msg.countdownMs ?? 3300 }, client.id);
          break;
        case 'snapshot':
          if (room && client.isHost) broadcast(room, 'snapshot', { snap: msg.snap }, client.id);
          break;
        case 'input':
          // Forward player input to the host only.
          if (room) {
            const host = [...room.players.values()].find((p) => p.isHost);
            if (host) send(host.ws, 'input', { id: client.id, steer: msg.steer, throttle: msg.throttle, brake: msg.brake, nitro: msg.nitro });
          }
          break;
        case 'leave':
          leaveRoom(client);
          break;
      }
    });

    ws.on('close', () => leaveRoom(client));
    ws.on('error', () => leaveRoom(client));
  });

  wss.on('listening', () => console.log(`[relay] listening on ws://localhost:${port}`));
  return { wss, close: () => new Promise((res) => wss.close(res)) };
}

// Run directly (not when imported by the test).
if (import.meta.url === `file://${process.argv[1]}`) startRelay();
