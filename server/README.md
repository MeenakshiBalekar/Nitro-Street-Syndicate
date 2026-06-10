# Online relay — Nitro Street Syndicate

A tiny WebSocket relay for private 4-player rooms. It is **not** a game server: it
forwards messages within a room and tracks membership. The **host client** runs
`RaceController` and broadcasts authoritative snapshots; other clients interpolate
remote racers and send their input back to the host.

```
client ──input──▶ relay ──input──▶ host ──snapshot──▶ relay ──snapshot──▶ clients
```

## Run it

```bash
npm run relay            # ws://localhost:8787  (PORT env to override)
```

To play with friends over the internet, host this one file anywhere that runs
Node (Render / Fly.io / Railway / a small VPS) and point the app's transport at
its public `wss://` URL.

## Protocol (JSON over WebSocket)

| client → server | server → client |
| --- | --- |
| `hello{name}` | `welcome{id}` |
| `create{bikeId}` / `join{code,bikeId}` / `quick{bikeId}` | `room{code,players}` |
| `ready{ready}` | `players{players}` |
| `input{steer,throttle,brake,nitro}` (→ host) | `snapshot{snap}` |
| `snapshot{snap}` / `start{countdownMs}` (host only) | `start{countdownMs}` |
| `leave` | `left{id}` / `error{message}` |

## Status

- ✅ Relay (`server/relay.mjs`) + client transport (`src/net/WsTransport.ts`)
  implement the `NetTransport` seam in `src/net/Multiplayer.ts`.
- ✅ Verified by `npm run test:net` — boots the relay, connects two clients,
  creates/joins a room, exchanges a snapshot, and handles disconnects.
- ⏭️ Next: lobby UI (create/join by code, ready-up) + host-authoritative in-race
  sync (broadcast `RacerState` snapshots, interpolate remote bikes, reconcile the
  local player). The seam is in place so this needs no gameplay rewrites.
