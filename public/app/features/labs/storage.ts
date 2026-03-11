import { store } from '@grafana/data';

export const FEATURE_TOGGLES_STORAGE_KEY = 'grafana.featureToggles';

export type ToggleOverrideMap = Record<string, boolean>;

export interface ParsedOverridesResult {
  overrides: ToggleOverrideMap;
  invalidTokens: string[];
}

export interface ReadOverridesResult extends ParsedOverridesResult {
  storageError?: string;
}

function parseToggleValue(value: string): boolean | undefined {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1') {
    return true;
  }
  if (normalized === 'false' || normalized === '0') {
    return false;
  }
  return undefined;
}

export function parseFeatureToggleOverrides(rawValue: string | null): ParsedOverridesResult {
  if (!rawValue || rawValue.trim().length === 0) {
    return { overrides: {}, invalidTokens: [] };
  }

  const overrides: ToggleOverrideMap = {};
  const invalidTokens: string[] = [];

  for (const token of rawValue.split(',')) {
    const trimmedToken = token.trim();
    if (!trimmedToken) {
      continue;
    }

    const separatorIndex = trimmedToken.indexOf('=');
    if (separatorIndex <= 0 || separatorIndex === trimmedToken.length - 1) {
      invalidTokens.push(trimmedToken);
      continue;
    }

    const name = trimmedToken.slice(0, separatorIndex).trim();
    const value = parseToggleValue(trimmedToken.slice(separatorIndex + 1));
    if (!name || value === undefined) {
      invalidTokens.push(trimmedToken);
      continue;
    }

    // Last value wins if duplicates appear.
    overrides[name] = value;
  }

  return { overrides, invalidTokens };
}

export function serializeFeatureToggleOverrides(overrides: ToggleOverrideMap): string {
  const collator = new Intl.Collator();
  const serializedEntries = Object.keys(overrides)
    .sort((a, b) => collator.compare(a, b))
    .map((name) => `${name}=${overrides[name] ? 'true' : 'false'}`);

  return serializedEntries.join(',');
}

export function readFeatureToggleOverrides(): ReadOverridesResult {
  try {
    return parseFeatureToggleOverrides(store.get(FEATURE_TOGGLES_STORAGE_KEY));
  } catch (error) {
    return {
      overrides: {},
      invalidTokens: [],
      storageError: error instanceof Error ? error.message : String(error),
    };
  }
}

export function writeFeatureToggleOverrides(overrides: ToggleOverrideMap): string | undefined {
  try {
    const serialized = serializeFeatureToggleOverrides(overrides);
    if (serialized.length === 0) {
      store.delete(FEATURE_TOGGLES_STORAGE_KEY);
    } else {
      store.set(FEATURE_TOGGLES_STORAGE_KEY, serialized);
    }
    return undefined;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}
