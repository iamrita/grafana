export const FEATURE_TOGGLES_LOCAL_STORAGE_KEY = 'grafana.featureToggles';
export const RESET_FEATURE_FLAGS_PARAM = 'resetFeatureFlags';

export type FeatureToggleOverrides = Record<string, boolean>;

export function parseFeatureToggleOverrides(raw: string | null): FeatureToggleOverrides {
  if (!raw) {
    return {};
  }

  return raw.split(',').reduce<FeatureToggleOverrides>((acc, feature) => {
    const [featureName, featureValue] = feature.split('=');
    if (!featureName) {
      return acc;
    }

    acc[featureName] = featureValue === 'true' || featureValue === '1';
    return acc;
  }, {});
}

export function stringifyFeatureToggleOverrides(overrides: FeatureToggleOverrides): string {
  return Object.keys(overrides)
    .sort()
    .map((featureName) => `${featureName}=${overrides[featureName]}`)
    .join(',');
}

export function readFeatureToggleOverrides(): { overrides: FeatureToggleOverrides; error?: string } {
  try {
    const raw = window.localStorage.getItem(FEATURE_TOGGLES_LOCAL_STORAGE_KEY);
    return { overrides: parseFeatureToggleOverrides(raw) };
  } catch {
    return {
      overrides: {},
      error: 'Unable to read feature toggle overrides from local storage.',
    };
  }
}

export function writeFeatureToggleOverrides(overrides: FeatureToggleOverrides): string | undefined {
  try {
    const serialized = stringifyFeatureToggleOverrides(overrides);
    if (serialized.length === 0) {
      window.localStorage.removeItem(FEATURE_TOGGLES_LOCAL_STORAGE_KEY);
    } else {
      window.localStorage.setItem(FEATURE_TOGGLES_LOCAL_STORAGE_KEY, serialized);
    }

    return undefined;
  } catch {
    return 'Unable to save feature toggle overrides to local storage.';
  }
}

export function clearFeatureToggleOverrides(): string | undefined {
  try {
    window.localStorage.removeItem(FEATURE_TOGGLES_LOCAL_STORAGE_KEY);
    return undefined;
  } catch {
    return 'Unable to clear feature toggle overrides from local storage.';
  }
}

export function countPendingChanges(
  initialOverrides: FeatureToggleOverrides,
  currentOverrides: FeatureToggleOverrides
): number {
  const keys = new Set([...Object.keys(initialOverrides), ...Object.keys(currentOverrides)]);
  let changes = 0;

  keys.forEach((key) => {
    if (initialOverrides[key] !== currentOverrides[key]) {
      changes++;
    }
  });

  return changes;
}

export function hasResetFeatureFlagsParam(search: string): boolean {
  return new URLSearchParams(search).get(RESET_FEATURE_FLAGS_PARAM) === 'true';
}

export function removeResetFeatureFlagsParamFromCurrentUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete(RESET_FEATURE_FLAGS_PARAM);
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

/** Updates in-memory feature toggles so UI reacts without a full page reload. */
export function applyFeatureToggleToConfig(featureToggles: Record<string, boolean | undefined>, name: string, enabled: boolean) {
  featureToggles[name] = enabled;
}

/** Resets runtime config keys to server-reported defaults (after clearing local overrides). */
export function restoreFeatureTogglesFromServerState(
  featureToggles: Record<string, boolean | undefined>,
  features: Array<{ name: string; enabled: boolean }>
) {
  for (const f of features) {
    featureToggles[f.name] = f.enabled;
  }
}
