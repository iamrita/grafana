const STORAGE_KEY = 'grafana.featureToggles';

export interface ToggleOverrides {
  [key: string]: boolean;
}

export function getLocalStorageOverrides(): ToggleOverrides {
  const value = window.localStorage.getItem(STORAGE_KEY);
  if (!value) {
    return {};
  }

  const overrides: ToggleOverrides = {};
  const features = value.split(',');
  for (const feature of features) {
    const [name, val] = feature.split('=');
    if (name) {
      overrides[name] = val === 'true' || val === '1';
    }
  }
  return overrides;
}

export function setFeatureToggleOverride(name: string, enabled: boolean): void {
  const overrides = getLocalStorageOverrides();
  overrides[name] = enabled;
  saveOverrides(overrides);
}

export function removeFeatureToggleOverride(name: string): void {
  const overrides = getLocalStorageOverrides();
  delete overrides[name];
  saveOverrides(overrides);
}

export function clearAllOverrides(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}

function saveOverrides(overrides: ToggleOverrides): void {
  const entries = Object.entries(overrides)
    .filter(([_, value]) => value !== undefined)
    .map(([name, value]) => `${name}=${value}`);

  if (entries.length === 0) {
    window.localStorage.removeItem(STORAGE_KEY);
  } else {
    window.localStorage.setItem(STORAGE_KEY, entries.join(','));
  }
}
