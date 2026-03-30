import { store } from '@grafana/data';
import { GRAFANA_FEATURE_TOGGLES_STORAGE_KEY } from '@grafana/runtime';

const TRUE_VALUES = new Set(['true', '1']);

export function parseFeatureToggleLocalStorage(raw: string | null): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  if (!raw) {
    return out;
  }
  for (const part of raw.split(',')) {
    const [name, value] = part.split('=');
    if (!name) {
      continue;
    }
    out[name.trim()] = TRUE_VALUES.has((value ?? '').trim());
  }
  return out;
}

export function serializeFeatureToggleLocalStorage(toggles: Record<string, boolean>): string {
  return Object.keys(toggles)
    .sort()
    .map((k) => `${k}=${toggles[k] ? 'true' : 'false'}`)
    .join(',');
}

export function getFeatureToggleLocalStorageMap(
  key: string = GRAFANA_FEATURE_TOGGLES_STORAGE_KEY
): Record<string, boolean> {
  return parseFeatureToggleLocalStorage(store.get(key));
}

export function writeFeatureToggleLocalStorageMap(
  toggles: Record<string, boolean>,
  key: string = GRAFANA_FEATURE_TOGGLES_STORAGE_KEY
): void {
  const merged = { ...getFeatureToggleLocalStorageMap(key), ...toggles };
  store.set(key, serializeFeatureToggleLocalStorage(merged));
}
