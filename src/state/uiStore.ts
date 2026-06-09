import { create } from 'zustand';
import { RacerState } from '../game/types';

export type Screen = 'splash' | 'menu' | 'garage' | 'settings' | 'race' | 'results';

export interface RaceResults {
  order: RacerState[];
  playerPlacement: number;
  timeMs: number;
  reward: number;
  stuntScore: number;
  newRecord: boolean;
}

interface UIState {
  screen: Screen;
  raceBikeId: string | null;
  results: RaceResults | null;
  go: (screen: Screen) => void;
  startRace: (bikeId: string) => void;
  finishRace: (results: RaceResults) => void;
}

export const useUIStore = create<UIState>((set) => ({
  screen: 'splash',
  raceBikeId: null,
  results: null,
  go: (screen) => set({ screen }),
  startRace: (bikeId) => set({ raceBikeId: bikeId, results: null, screen: 'race' }),
  finishRace: (results) => set({ results, screen: 'results' }),
}));
