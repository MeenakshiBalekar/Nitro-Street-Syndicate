# Nitro Street Syndicate

A premium 3D arcade bike-racing game for mobile + web — coastal-highway circuit, four
distinct bikes, nitro, wheelies, jumps, traffic to weave through, near-miss boost charging,
chase/cockpit cameras, and a full menu → garage → race → results loop.

Built with **Expo SDK 56 · React Native 0.85 · three.js + react-three-fiber** so a single
codebase runs on **iOS, Android, and the web**. This repo is the **Phase 1 vertical slice**:
a stable, polished, single-player-vs-AI core that is architected to grow toward the larger
online/open-world vision (see the roadmap below).

---

## Run it

```bash
npm install
npm run web      # opens in a browser (fastest way to see it)
npm run ios      # or: npm run android  (Expo Go / dev build on a device)
```

> Real 3D on a phone runs best on a physical device (simulators are weak at WebGL/EXGL).
> The web build is the quickest preview.

Type-check / bundle:

```bash
npm run typecheck            # tsc --noEmit
npx expo export -p web       # produces dist/ (verified building)
```

## Controls

| Action | Touch | Web keyboard |
| --- | --- | --- |
| Steer | drag the left pad | ◀ ▶ / A D |
| Brake | hold **BRAKE** | ▼ / S |
| Nitro | hold **NITRO** | Space |
| Wheelie / stunt | hold **STUNT** | Shift |
| Camera (chase ↔ cockpit) | tap **CAM** | C |
| Pause | tap **II** | Esc / P |

Throttle is **automatic** while racing — you focus on steering, braking, nitro, and stunts.

## How it plays

- **Charge nitro** by drifting close to traffic (near-miss), holding wheelies, and landing
  jumps off the orange ramps. Blue bands are instant boost pads.
- **3 rubber-banded AI rivals** keep the pack tight; placement is live in the top-center HUD.
- Finish 3 laps, bank credits based on placement + stunt score, then **rematch** or head to
  the **garage** to unlock the Tempest (speed), Gripster (cornering), or Voltage (nitro) bikes.

---

## Architecture

Clean separation of concerns — pure simulation, rendering, state, and UI never bleed into
each other. The folder layout mirrors the system breakdown from the design brief.

```
src/
  game/        Pure, engine-agnostic simulation (no three.js / RN imports)
    types.ts       Shared data contracts
    bikes.ts       4 bike configs (data, not logic — the "ScriptableObject" layer)
    track.ts       Catmull-Rom coastal circuit, checkpoints, ramps, start grid
    physics.ts     Arcade bike step: speed, steering, nitro, wheelie, jumps
    ai.ts          Rubber-banded AI drivers
    traffic.ts     Pooled, recycled traffic stream
    race.ts        RaceController — orchestrates laps, placement, near-miss, finish
    input.ts       Shared input singleton (touch + keyboard write here)
  three/       Rendering only — reads simulation state
    RaceCanvas.tsx   <Canvas>, lights, fog, sky
    RaceScene.tsx    The single game loop (useFrame): tick → sync meshes → camera → HUD
    Bike3D / Track3D / Traffic3D / Environment3D
  state/       zustand stores
    gameStore.ts   Persisted progression (currency, unlocks, best times, settings)
    uiStore.ts     Screen navigation + race results
    hudStore.ts    Throttled HUD snapshot (~15 Hz, off the physics hot path)
  ui/          Screens (splash/menu/garage/settings/race/results) + HUD widgets
  net/         Multiplayer.ts — transport interface seam (online is stubbed; see below)
  audio/       AudioManager.ts — engine/SFX hooks (stub; no bundled audio yet)
  theme/ util/ Palette, typography, math helpers, storage wrapper
```

**Key design choices**

- **Track-relative simulation** (`distance-along` + `lateral offset`) instead of free rigid-body
  physics. This is what makes the bikes arcade-stable: they can't flip or fly off the road, laps
  and placement are trivial to compute, and traffic/AI share the same cheap model.
- **One authoritative game loop** in `RaceScene` ticks the simulation, then pushes transforms
  into the meshes via imperative `sync()` handles — deterministic, no per-frame React renders.
- **HUD is decoupled**: the loop publishes a throttled snapshot to `hudStore`, so HUD widgets
  re-render cheaply, never at physics rate.

---

## Status — honest scope

✅ **Implemented & verified (compiles + web bundle builds):** splash, main menu, garage with
buy/equip, settings, single-player race vs AI, countdown, 3-lap/placement, nitro, wheelie,
ramps/jumps, traffic + near-miss + collisions, chase/cockpit camera, speed-FOV + crash shake,
HUD (minimap, speed cluster, lap/time/position, combos), pause/resume/restart, results +
rematch, currency rewards, unlock progression, daily bonus, persistent save.

🟡 **Stubbed on purpose (architecture seam present):**

- **Online 4-player** — `src/net/Multiplayer.ts` defines the transport interface; the race is
  built host-authoritative so a real backend (Photon / Colyseus / Nakama / WS relay) drops in
  without touching gameplay. The menu's **ONLINE** button explains this.
- **Audio** — `src/audio/AudioManager.ts` is a safe no-op; wire it to `expo-av` + sound files.

The 3D world uses **procedural primitives** (no external model/texture assets), which keeps the
bundle lean and the project 100% buildable from source.

---

## Roadmap (phased, per the design brief)

- **Phase 1 — Core (this repo):** stable race loop, premium HUD, 4 bikes, nitro/stunts, traffic.
- **Phase 2 — Premium feel:** engine audio (pitch-by-speed), nitro/skid VFX, speed lines,
  slipstream, richer crash feedback, UI transitions, more reward depth.
- **Phase 3 — Wow:** online 4-player rooms + matchmaking, ghost racing, replay clips, day/night
  & weather, custom skins/decals, ranked leaderboards, and a short free-roam map.

## License

MIT — see [LICENSE](./LICENSE).
