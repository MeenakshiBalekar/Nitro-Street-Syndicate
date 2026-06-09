# Agent notes — Nitro Street Syndicate

Stack: **Expo SDK 56 · React Native 0.85 · React 19 · three.js + react-three-fiber v9 · zustand**.
Expo changes fast — verify APIs against the current versioned docs
(https://docs.expo.dev/versions/v56.0.0/) before adding Expo packages.

Conventions:

- Keep `src/game/*` pure (no `three`/`react-native` imports) — it's the simulation contract.
- Rendering reads simulation state; the **single** `useFrame` loop lives in
  `src/three/RaceScene.tsx`. Don't add competing per-frame loops — drive meshes via the
  imperative `sync()` handles so ordering stays deterministic.
- High-frequency values go through refs/singletons (`src/game/input.ts`), not React state.
  HUD reads a throttled snapshot from `src/state/hudStore.ts`.
- 3D is built from primitives (no bundled model/texture assets) to stay buildable from source.
- `npm run typecheck` and `npx expo export -p web` should both stay green.
