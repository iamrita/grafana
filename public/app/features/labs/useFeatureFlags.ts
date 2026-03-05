import { useCallback, useMemo, useState } from 'react';
import { useAsync } from 'react-use';

import { store } from '@grafana/data';
import { config, getBackendSrv } from '@grafana/runtime';

import {
  getFeatureTogglesStorageKey,
  getSafeModeResetStorageKey,
  readFeatureToggleOverrides,
  writeFeatureToggleOverrides,
} from './storage';
import { FeatureFlag } from './types';

export function useFeatureFlags() {
  const [overrides, setOverrides] = useState<Record<string, boolean>>(() => readFeatureToggleOverrides());
  const [showSafeModeMessage, setShowSafeModeMessage] = useState<boolean>(() => {
    const marker = window.sessionStorage.getItem(getSafeModeResetStorageKey()) === '1';
    if (marker) {
      window.sessionStorage.removeItem(getSafeModeResetStorageKey());
    }
    return marker;
  });

  const { loading, value, error } = useAsync(async () => {
    return getBackendSrv().get<FeatureFlag[]>('/api/featuremgmt/v1/flags');
  }, []);

  const setOverride = useCallback((featureName: string, enabled: boolean) => {
    setOverrides((current) => {
      const next = { ...current, [featureName]: enabled };
      writeFeatureToggleOverrides(next);
      return next;
    });
  }, []);

  const clearOverrides = useCallback(() => {
    setOverrides({});
    store.delete(getFeatureTogglesStorageKey());
  }, []);

  const isDevelopment = config.buildInfo.env === 'development';

  const flags = useMemo(() => value ?? [], [value]);

  return {
    flags,
    loading,
    error,
    overrides,
    isDevelopment,
    showSafeModeMessage,
    setShowSafeModeMessage,
    setOverride,
    clearOverrides,
  };
}
