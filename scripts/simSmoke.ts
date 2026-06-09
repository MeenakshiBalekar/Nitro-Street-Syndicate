/**
 * Headless simulation smoke test.
 *
 * The entire race core (src/game/*) is pure TypeScript with no three.js / React
 * Native imports, so we can run a full race in Node — no GPU, no browser — and
 * assert the simulation is sane. This is the fast, CI-friendly way to "test"
 * gameplay logic without a device.
 *
 * Run: npm run test:sim
 */
import { RaceController } from '../src/game/race';
import type { InputState } from '../src/game/types';

let failures = 0;
function check(cond: boolean, msg: string): void {
  if (cond) {
    console.log('  ✓ ' + msg);
  } else {
    console.error('  ✗ ' + msg);
    failures++;
  }
}

console.log('Simulating a full race (player = Striker vs 3 AI)...\n');

const c = new RaceController('striker');
c.start();

// Deliberately leave throttle at 0: the player bike must move via the auto-throttle
// assist inside RaceController.tick. This guards the "my bike won't move" bug.
const input: InputState = { steer: 0, throttle: 0, brake: 0, nitro: false, stunt: false };
const dt = 1 / 60;
const maxSeconds = 240;
let simSeconds = 0;
let frame = 0;
let finiteEveryTick = true;

while (c.phase !== 'finished' && simSeconds < maxSeconds) {
  // Exercise the nitro and stunt code paths in bursts.
  input.nitro = frame % 600 < 130;
  input.stunt = frame % 900 < 90;
  input.steer = Math.sin(frame / 240) * 0.25; // gentle weaving

  c.tick(dt, input);

  if (!Number.isFinite(c.player.worldX) || !Number.isFinite(c.player.s) || !Number.isFinite(c.player.speed)) {
    finiteEveryTick = false;
  }
  simSeconds += dt;
  frame++;
}

console.log(`Race ended after ~${simSeconds.toFixed(1)}s of simulated time (phase=${c.phase})\n`);

check(finiteEveryTick, 'player state stayed finite (no NaN) every tick');
check(c.phase === 'finished', 'race reached the finished state');
check(c.player.finished, 'player crossed the finish line');
check(c.player.finishTimeMs > 0, 'player has a positive finish time');
check(c.player.lap >= c.totalLaps, `player completed all ${c.totalLaps} laps`);
check(c.player.speed > 50, 'player built up race speed');

const results = c.results();
const places = results.map((r) => r.placement).sort((a, b) => a - b);
check(results.length === 4, 'four racers classified');
check(JSON.stringify(places) === '[1,2,3,4]', 'placements are unique 1..4');
check(
  results.every((r) => Number.isFinite(r.worldX) && Number.isFinite(r.worldZ)),
  'all racer world positions are finite',
);

console.log('\nFinal standings:');
for (const r of results) {
  const who = r.isPlayer ? 'YOU' : r.name;
  const time = r.finished ? (r.finishTimeMs / 1000).toFixed(2) + 's' : `lap ${r.lap + 1} (DNF)`;
  console.log(`  ${r.placement}. ${who.padEnd(6)} ${r.bikeId.padEnd(9)} ${time}`);
}

// --- Ghost record -> replay round-trip --------------------------------------
const recording = c.getRecording();
check(recording.length >= 7, 'ghost recording captured frames');
const replay = new RaceController('striker', recording);
replay.start();
const idle: InputState = { steer: 0, throttle: 0, brake: 0, nitro: false, stunt: false };
for (let i = 0; i < 600; i++) replay.tick(1 / 60, idle);
check(replay.ghostState.active, 'ghost is active when a recording is supplied');
check(
  Number.isFinite(replay.ghostState.worldX) && Number.isFinite(replay.ghostState.worldZ),
  'replayed ghost world position is finite',
);

console.log('');
if (failures === 0) {
  console.log('✅ SIM SMOKE TEST PASSED');
} else {
  console.error(`❌ SIM SMOKE TEST FAILED (${failures} check(s))`);
  process.exitCode = 1;
}
