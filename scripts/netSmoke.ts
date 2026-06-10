/**
 * Online networking integration test (headless, no rendering).
 *
 * Boots the relay, connects two WsTransport clients, creates + joins a room,
 * then exchanges a snapshot and a start signal — proving the netcode plumbing
 * end-to-end. Run: npm run test:net
 */
import { WebSocket as NodeWebSocket } from 'ws';
// Polyfill the global WebSocket for Node (the app provides it on web / RN).
(globalThis as unknown as { WebSocket: unknown }).WebSocket ??= NodeWebSocket;

import { startRelay } from '../server/relay.mjs';
import type { NetPlayer, RaceSnapshot } from '../src/net/Multiplayer';
import { WsTransport } from '../src/net/WsTransport';

const PORT = 8799;
const URL = `ws://localhost:${PORT}`;
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

let failures = 0;
function check(cond: boolean, msg: string): void {
  console.log(`  ${cond ? '✓' : '✗'} ${msg}`);
  if (!cond) failures++;
}

async function main() {
  console.log('Booting relay + two clients...\n');
  const relay = startRelay(PORT);
  await delay(150);

  let hostPlayers: NetPlayer[] = [];
  let guestPlayers: NetPlayer[] = [];
  // Holder object so the callback assignment isn't flow-narrowed away by tsc.
  const recv: { snap: RaceSnapshot | null } = { snap: null };

  const host = new WsTransport(URL);
  await host.connect('Host');
  const hostRoom = await host.createPrivateRoom('striker', {
    onPlayersChanged: (p) => (hostPlayers = p),
  });
  check(/^[A-Z0-9]{4}$/.test(hostRoom.code), `host created room with code ${hostRoom.code}`);

  const guest = new WsTransport(URL);
  await guest.connect('Guest');
  const guestRoom = await guest.joinRoom(hostRoom.code, 'tempest', {
    onPlayersChanged: (p) => (guestPlayers = p),
    onSnapshot: (s) => {
      recv.snap = s;
    },
  });
  check(guestRoom.code === hostRoom.code, 'guest joined the same room code');

  await delay(120);
  check(hostPlayers.length === 2, `host sees 2 players (got ${hostPlayers.length})`);
  check(guestPlayers.length === 2, `guest sees 2 players (got ${guestPlayers.length})`);
  check(hostPlayers.some((p) => p.isHost && p.isLocal), 'host is flagged host + local on its side');
  check(guestPlayers.some((p) => p.isHost && !p.isLocal), 'guest sees the host as a remote host');
  check(guestPlayers.some((p) => p.bikeId === 'tempest' && p.isLocal), 'guest bike id propagated');

  // Host broadcasts a race snapshot + start; guest should receive both.
  const snap: RaceSnapshot = {
    tick: 1,
    serverTimeMs: 1000,
    racers: [{ id: 0, s: 12.5, lateral: 1.2, speed: 88, lap: 0, nitroActive: true }],
  };
  hostRoom.publishSnapshot(snap);
  await delay(120);
  check(recv.snap !== null && recv.snap.racers[0].speed === 88, 'guest received the host snapshot');

  // Guest -> host input + ready paths (relayed; smoke only — no crash, room stable).
  guestRoom.sendInputState(0.5, 1, 0, true);
  guestRoom.setReady(true);
  await delay(80);
  check(hostPlayers.length === 2 && guestPlayers.length === 2, 'room membership stable after input/ready');

  // Disconnect the guest; host should drop to 1 player.
  await guest.disconnect();
  await delay(150);
  check(hostPlayers.length === 1, `host sees 1 player after guest leaves (got ${hostPlayers.length})`);

  await host.disconnect();
  await relay.close();

  console.log('');
  if (failures === 0) console.log('✅ NET SMOKE TEST PASSED');
  else {
    console.error(`❌ NET SMOKE TEST FAILED (${failures} check(s))`);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error('NET SMOKE TEST ERROR:', e);
  process.exitCode = 1;
});
