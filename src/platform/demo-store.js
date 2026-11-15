// Browser-local prototype data only. No live CRM repository is accepted here.
export const DEMO_STORAGE_KEY = "bekhan-os-demo-v1";
export function createDemoWorkspace({
  seed,
  storage,
  normalize = (x) => x,
  onFailure = () => {},
}) {
  let state = structuredClone(seed),
    available = true;
  try {
    const saved = JSON.parse(storage?.getItem(DEMO_STORAGE_KEY) ?? "null");
    if (
      saved?.version === 1 &&
      Object.keys(seed)
        .filter((k) => Array.isArray(seed[k]))
        .every((k) => Array.isArray(saved[k]))
    )
      state = saved;
  } catch {
    available = false;
  }
  state = normalize(state);
  const persist = () => {
    try {
      if (!storage) throw new Error("storage-unavailable");
      storage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch {
      available = false;
      onFailure();
      return false;
    }
  };
  return {
    repository(keys) {
      const projection = {};
      for (const key of keys)
        Object.defineProperty(projection, key, {
          enumerable: true,
          get: () => state[key],
        });
      return { state: projection, save: persist };
    },
    snapshot: () => structuredClone(state),
    reset() {
      state = normalize(structuredClone(seed));
      return persist();
    },
    available: () => available,
  };
}
