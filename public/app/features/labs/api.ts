import { getBackendSrv } from '@grafana/runtime';

export interface FeatureToggleInfo {
  name: string;
  description: string;
  stage: string;
  owner: string;
  requiresDevMode: boolean;
  frontendOnly: boolean;
  requiresRestart: boolean;
  enabled: boolean;
}

export async function fetchFeatureToggles(): Promise<FeatureToggleInfo[]> {
  return getBackendSrv().get('/api/feature-toggles');
}
