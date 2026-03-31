export interface LabsFeatureFlag {
  name: string;
  description: string;
  stage: string;
  owner: string;
  enabled: boolean;
}

interface LabsFeatureFlagResponseItem {
  name?: unknown;
  description?: unknown;
  stage?: unknown;
  owner?: unknown;
  enabled?: unknown;
}

const UNKNOWN_OWNER = 'Unknown owner';
const UNKNOWN_STAGE = 'Unknown stage';
const MISSING_DESCRIPTION = 'No description provided';

const asString = (value: unknown): string => {
  if (typeof value === 'string') {
    return value.trim();
  }

  return '';
};

const asBoolean = (value: unknown): boolean => value === true;

const isResponseItem = (value: unknown): value is LabsFeatureFlagResponseItem => {
  return Boolean(value) && typeof value === 'object';
};

const toResponseItems = (value: unknown): LabsFeatureFlagResponseItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isResponseItem);
};

const normalizeItem = (item: LabsFeatureFlagResponseItem): LabsFeatureFlag | null => {
  const name = asString(item.name);
  if (!name) {
    return null;
  }

  return {
    name,
    description: asString(item.description) || MISSING_DESCRIPTION,
    stage: asString(item.stage) || UNKNOWN_STAGE,
    owner: asString(item.owner) || UNKNOWN_OWNER,
    enabled: asBoolean(item.enabled),
  };
};

const getItems = (response: unknown): LabsFeatureFlagResponseItem[] => {
  if (!response || typeof response !== 'object') {
    return [];
  }

  return toResponseItems(Reflect.get(response, 'items'));
};

export const normalizeLabsFeatureFlags = (response: unknown): LabsFeatureFlag[] => {
  return getItems(response)
    .map((item) => normalizeItem(item))
    .filter((item): item is LabsFeatureFlag => item !== null);
};
