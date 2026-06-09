// Shared audio contract implemented by both platform backends:
//   AudioManager.web.ts    -> Web Audio synthesis
//   AudioManager.ts        -> expo-audio (native, sample-based)
// Metro picks the right file per platform; tsc type-checks against the .ts one.

export type Sfx = 'ui' | 'countdown' | 'go' | 'crash' | 'finish' | 'nitro';

export interface IAudioManager {
  init(): void;
  setEnabled(v: boolean): void;
  /** Resume/create the audio context after a user gesture (web autoplay policy). */
  unlock(): void;
  startEngine(): void;
  stopEngine(): void;
  /** Per-frame: ratio = speed/topSpeed (0..1). */
  setEngine(ratio: number, nitro: boolean): void;
  play(sfx: Sfx): void;
}
