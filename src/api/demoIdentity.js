const STORAGE_KEY = 'raxshloto.demo.playerId.v1';

export async function getDemoPlayerId(runtime = globalThis.window) {
  const readOrCreate = () => {
    try {
      const storage = runtime.localStorage;
      const existing = storage.getItem(STORAGE_KEY);
      if (existing !== null) {
        if (!/^\d{40}$/.test(existing)) throw new Error('Invalid saved demo player ID');
        return existing;
      }
      // 128 random bits encoded as digits; never convert the ID to a Number.
      const words = runtime.crypto.getRandomValues(new Uint32Array(4));
      const id = Array.from(words, word => String(word).padStart(10, '0')).join('');
      storage.setItem(STORAGE_KEY, id);
      if (storage.getItem(STORAGE_KEY) !== id) throw new Error('Demo player ID was not saved');
      return id;
    } catch (cause) {
      throw Object.assign(new Error('Cannot persist demo player identity. Allow site storage and reload.'), {
        code: 'CONFIGURATION_ERROR', cause,
      });
    }
  };
  // Serialize first launches across tabs sharing this browser profile.
  if (runtime.navigator?.locks?.request) {
    return runtime.navigator.locks.request(STORAGE_KEY, readOrCreate);
  }
  return readOrCreate();
}
