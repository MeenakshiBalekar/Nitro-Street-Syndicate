import { create } from 'zustand';
import { BIKES } from '../game/bikes';
import { Storage } from '../util/storage';

const KEY = 'nss.save.v1';

interface Settings {
  haptics: boolean;
  sound: boolean;
  defaultCam: 'chase' | 'cockpit';
  quality: 'auto' | 'high' | 'low';
}

interface Persisted {
  currency: number;
  ownedBikes: string[];
  selectedBikeId: string;
  bestTimes: Record<string, number>;
  ghosts: Record<string, { time: number; data: number[] }>;
  settings: Settings;
  lastDailyClaim: number;
}

interface GameState extends Persisted {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  selectBike: (id: string) => void;
  buyBike: (id: string) => boolean;
  isOwned: (id: string) => boolean;
  recordResult: (r: { timeMs: number; reward: number; placement: number }) => void;
  saveGhost: (trackId: string, time: number, data: number[]) => void;
  claimDaily: () => number; // returns amount granted (0 if not ready)
  setSetting: <K extends keyof Settings>(k: K, v: Settings[K]) => void;
}

const DEFAULTS: Persisted = {
  currency: 1500,
  ownedBikes: ['striker'],
  selectedBikeId: 'striker',
  bestTimes: {},
  ghosts: {},
  settings: { haptics: true, sound: true, defaultCam: 'chase', quality: 'auto' },
  lastDailyClaim: 0,
};

const persist = (s: Persisted) =>
  Storage.setJSON(KEY, {
    currency: s.currency,
    ownedBikes: s.ownedBikes,
    selectedBikeId: s.selectedBikeId,
    bestTimes: s.bestTimes,
    ghosts: s.ghosts,
    settings: s.settings,
    lastDailyClaim: s.lastDailyClaim,
  });

export const useGameStore = create<GameState>((set, get) => ({
  ...DEFAULTS,
  hydrated: false,

  hydrate: async () => {
    const data = await Storage.getJSON<Persisted>(KEY, DEFAULTS);
    set({ ...data, hydrated: true });
  },

  selectBike: (id) => {
    if (!get().ownedBikes.includes(id)) return;
    set({ selectedBikeId: id });
    persist(get());
  },

  buyBike: (id) => {
    const st = get();
    const bike = BIKES.find((b) => b.id === id);
    if (!bike || st.ownedBikes.includes(id) || st.currency < bike.price) return false;
    set({
      currency: st.currency - bike.price,
      ownedBikes: [...st.ownedBikes, id],
      selectedBikeId: id,
    });
    persist(get());
    return true;
  },

  isOwned: (id) => get().ownedBikes.includes(id),

  recordResult: ({ timeMs, reward, placement }) => {
    const st = get();
    const track = 'coastal';
    const prev = st.bestTimes[track];
    const bestTimes =
      placement === 1 && (prev == null || timeMs < prev)
        ? { ...st.bestTimes, [track]: timeMs }
        : st.bestTimes;
    set({ currency: st.currency + reward, bestTimes });
    persist(get());
  },

  saveGhost: (trackId, time, data) => {
    const st = get();
    const prev = st.ghosts[trackId];
    if (data.length < 7) return;
    if (prev && prev.time <= time) return; // keep the faster ghost
    set({ ghosts: { ...st.ghosts, [trackId]: { time, data } } });
    persist(get());
  },

  claimDaily: () => {
    const st = get();
    const now = Date.now();
    if (now - st.lastDailyClaim < 20 * 3600 * 1000) return 0;
    const amount = 500;
    set({ currency: st.currency + amount, lastDailyClaim: now });
    persist(get());
    return amount;
  },

  setSetting: (k, v) => {
    set({ settings: { ...get().settings, [k]: v } });
    persist(get());
  },
}));
