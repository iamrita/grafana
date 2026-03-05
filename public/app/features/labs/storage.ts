import { store } from '@grafana/data';

const featureTogglesStorageKey = 'grafana.featureToggles';
const safeModeResetStorageKey = 'grafana.featureToggles.safeModeReset';

export function getFeatureTogglesStorageKey() {
  return featureTogglesStorageKey;
}

export function getSafeModeResetStorageKey() {
  return safeModeResetStorageKey;
}

export function parseFeatureToggleOverrides(value: string | null): Record<string, boolean> {
  if (!value) {
    return {};
  }

  return value
    .split(',')
    .map((raw) => raw.trim())
    .filter(Boolean)
    .reduce<Record<string, boolean>>((acc, pair) => {
      const [name, rawValue] = pair.split('=');
      if (!name || rawValue == null) {
        return acc;
      }

      acc[name] = rawValue === 'true' || rawValue === '1';
      return acc;
    }, {});
}

export function serializeFeatureToggleOverrides(overrides: Record<string, boolean>): string {
  return Object.entries(overrides)
    .sort(([a], [b]) => {
      if (a < b) {
        return -1;
      }
      if (a > b) {
        return 1;
      }
      return 0;
    })
    .map(([name, enabled]) => `${name}=${enabled ? '1' : '0'}`)
    .join(',');
}

export function readFeatureToggleOverrides(): Record<string, boolean> {
  return parseFeatureToggleOverrides(store.get(featureTogglesStorageKey));
}

export function writeFeatureToggleOverrides(overrides: Record<string, boolean>): void {
  const serialized = serializeFeatureToggleOverrides(overrides);
  if (!serialized) {
    store.delete(featureTogglesStorageKey);
    return;
  }

  store.set(featureTogglesStorageKey, serialized);
}
