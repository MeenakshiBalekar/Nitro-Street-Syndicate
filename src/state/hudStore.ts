import { create } from 'zustand';
import { HudSnapshot } from '../game/types';

// Decoupled from the simulation: the game loop pushes a snapshot here at a
// throttled rate (~12 Hz) so HUD widgets re-render cheaply, never per physics
// step. Selecting individual primitive fields keeps re-renders minimal.
export const EMPTY_HUD: HudSnapshot = {
  phase: 'countdown',
  countdown: 3,
  timeMs: 0,
  speed: 0,
  rpm: 0,
  gear: 1,
  nitro: 0,
  nitroActive: false,
  lap: 1,
  totalLaps: 3,
  position: 1,
  racerCount: 4,
  stuntScore: 0,
  comboLabel: null,
  comboTimer: 0,
  drafting: false,
  flash: 0,
};

interface HudState extends HudSnapshot {
  setHud: (s: HudSnapshot) => void;
  camMode: 'chase' | 'cockpit';
  setCamMode: (m: 'chase' | 'cockpit') => void;
}

export const useHudStore = create<HudState>((set) => ({
  ...EMPTY_HUD,
  camMode: 'chase',
  setHud: (s) => set(s),
  setCamMode: (camMode) => set({ camMode }),
}));
