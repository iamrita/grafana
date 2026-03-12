import { useMemo, useState, useCallback, useEffect } from 'react';

import { config, getBackendSrv } from '@grafana/runtime';

import {
  getLocalStorageOverrides,
  setFeatureToggleOverride,
  removeFeatureToggleOverride,
} from '../utils/featureToggleStorage';

export type FeatureStage = 'experimental' | 'privatePreview' | 'preview' | 'GA' | 'deprecated' | 'unknown';

export interface FeatureFlag {
  name: string;
  description: string;
  stage: FeatureStage;
  owner: string;
  defaultEnabled: boolean;
  currentEnabled: boolean;
  hasOverride: boolean;
  requiresRestart: boolean;
  requiresDevMode: boolean;
  frontendOnly: boolean;
  hideFromDocs: boolean;
}

interface FeatureToggleItem {
  metadata: {
    name: string;
    creationTimestamp?: string;
    deletionTimestamp?: string;
  };
  spec: {
    description?: string;
    stage?: string;
    codeowner?: string;
    expression?: string;
    requiresRestart?: boolean;
    requiresDevMode?: boolean;
    frontend?: boolean;
    hideFromDocs?: boolean;
  };
}

interface FeatureToggleData {
  items: FeatureToggleItem[];
}

function normalizeStage(stage: string | undefined): FeatureStage {
  if (!stage) {
    return 'unknown';
  }
  const lower = stage.toLowerCase();
  if (lower === 'experimental') {
    return 'experimental';
  }
  if (lower === 'privatepreview') {
    return 'privatePreview';
  }
  if (lower === 'preview' || lower === 'publicpreview') {
    return 'preview';
  }
  if (lower === 'ga' || lower === 'generalavailability') {
    return 'GA';
  }
  if (lower === 'deprecated') {
    return 'deprecated';
  }
  return 'unknown';
}

export function useFeatureFlags() {
  const [overrides, setOverrides] = useState(() => getLocalStorageOverrides());
  const [filterStage, setFilterStage] = useState<FeatureStage | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [featureData, setFeatureData] = useState<FeatureToggleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeatureToggles = async () => {
      try {
        setLoading(true);
        const data = await getBackendSrv().get<FeatureToggleData>('/api/admin/feature-toggles');
        setFeatureData(data);
        setError(null);
      } catch (err) {
        setError('Failed to load feature toggles');
        console.error('Failed to load feature toggles:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatureToggles();
  }, []);

  const allFlags = useMemo(() => {
    if (!featureData) {
      return [];
    }

    const currentToggles = config.featureToggles as Record<string, boolean>;
    const localOverrides = overrides;

    return featureData.items
      .filter((item) => !item.metadata.deletionTimestamp)
      .map((item): FeatureFlag => {
        const name = item.metadata.name;
        const defaultEnabled = item.spec.expression === 'true';
        const hasOverride = name in localOverrides;
        const currentEnabled = hasOverride ? localOverrides[name] : (currentToggles[name] ?? defaultEnabled);

        return {
          name,
          description: item.spec.description || '',
          stage: normalizeStage(item.spec.stage),
          owner: item.spec.codeowner || '',
          defaultEnabled,
          currentEnabled,
          hasOverride,
          requiresRestart: item.spec.requiresRestart || false,
          requiresDevMode: item.spec.requiresDevMode || false,
          frontendOnly: item.spec.frontend || false,
          hideFromDocs: item.spec.hideFromDocs || false,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [featureData, overrides]);

  const filteredFlags = useMemo(() => {
    return allFlags.filter((flag) => {
      if (filterStage !== 'all' && flag.stage !== filterStage) {
        return false;
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          flag.name.toLowerCase().includes(query) ||
          flag.description.toLowerCase().includes(query) ||
          flag.owner.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [allFlags, filterStage, searchQuery]);

  const toggleFeature = useCallback((name: string, enabled: boolean) => {
    setFeatureToggleOverride(name, enabled);
    setOverrides(getLocalStorageOverrides());
  }, []);

  const resetFeature = useCallback((name: string) => {
    removeFeatureToggleOverride(name);
    setOverrides(getLocalStorageOverrides());
  }, []);

  const stats = useMemo(() => {
    const counts = {
      total: allFlags.length,
      experimental: 0,
      privatePreview: 0,
      preview: 0,
      GA: 0,
      deprecated: 0,
      unknown: 0,
      withOverrides: 0,
    };

    for (const flag of allFlags) {
      counts[flag.stage]++;
      if (flag.hasOverride) {
        counts.withOverrides++;
      }
    }

    return counts;
  }, [allFlags]);

  return {
    flags: filteredFlags,
    allFlags,
    filterStage,
    setFilterStage,
    searchQuery,
    setSearchQuery,
    toggleFeature,
    resetFeature,
    stats,
    loading,
    error,
  };
}
