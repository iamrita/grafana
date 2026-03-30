const STORAGE_KEY = 'grafana.featureToggles';

export function getLocalStorageOverrides(): Record<string, boolean> {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {};
  }

  const overrides: Record<string, boolean> = {};

  for (const part of raw.split(',')) {
    const trimmed = part.trim();
    if (!trimmed) {
      continue;
    }
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) {
      continue;
    }
    const name = trimmed.substring(0, eqIdx);
    const value = trimmed.substring(eqIdx + 1);
    if (!name) {
      continue;
    }
    overrides[name] = value === 'true' || value === '1';
  }

  return overrides;
}

function writeOverrides(overrides: Record<string, boolean>) {
  const entries = Object.entries(overrides);
  if (entries.length === 0) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, entries.map(([k, v]) => `${k}=${v}`).join(','));
}

export function setLocalStorageOverride(flagName: string, enabled: boolean) {
  const overrides = getLocalStorageOverrides();
  overrides[flagName] = enabled;
  writeOverrides(overrides);
}

export function removeLocalStorageOverride(flagName: string) {
  const overrides = getLocalStorageOverrides();
  delete overrides[flagName];
  writeOverrides(overrides);
}
