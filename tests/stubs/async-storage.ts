// Vitest stub — in-memory AsyncStorage so lib/i18n's persistence is inert under test.
const store = new Map<string, string>();
export default {
  async getItem(key: string) { return store.get(key) ?? null; },
  async setItem(key: string, value: string) { store.set(key, value); },
  async removeItem(key: string) { store.delete(key); },
};
