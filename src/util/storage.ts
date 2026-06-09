import AsyncStorage from '@react-native-async-storage/async-storage';

// Thin, failure-tolerant JSON persistence wrapper. Never throws into game code;
// a corrupt or unavailable store simply behaves like an empty store.
export const Storage = {
  async getJSON<T>(key: string, fallback: T): Promise<T> {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (raw == null) return fallback;
      return { ...fallback, ...(JSON.parse(raw) as Partial<T>) };
    } catch {
      return fallback;
    }
  },

  async setJSON(key: string, value: unknown): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Best-effort; ignore quota / availability errors.
    }
  },
};
