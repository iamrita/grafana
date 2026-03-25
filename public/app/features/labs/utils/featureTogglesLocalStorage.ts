const LOCAL_STORAGE_KEY = 'grafana.featureToggles';

/** Matches overrideFeatureTogglesFromLocalStorage in @grafana/runtime. */
export function readFeatureTogglesFromLocalStorage(): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) {
    return out;
  }
  for (const part of raw.split(',')) {
    const [name, value] = part.split('=');
    if (!name) {
      continue;
    }
    out[name] = value === 'true' || value === '1';
  }
  return out;
}

export function setFeatureToggleInLocalStorage(name: string, enabled: boolean): void {
  const map = readFeatureTogglesFromLocalStorage();
  map[name] = enabled;
  const serialized = Object.entries(map)
    .map(([k, v]) => `${k}=${v ? 'true' : 'false'}`)
    .join(',');
  window.localStorage.setItem(LOCAL_STORAGE_KEY, serialized);
}

export const featureTogglesLocalStorageKey = LOCAL_STORAGE_KEY;
