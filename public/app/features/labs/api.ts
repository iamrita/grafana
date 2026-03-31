import { getBackendSrv } from '@grafana/runtime';

import { type LabsFeatureFlag, normalizeLabsFeatureFlags } from './types';

const LABS_ENDPOINT = '/api/labs';

export async function getLabsFeatureFlags(): Promise<LabsFeatureFlag[]> {
  const response = await getBackendSrv().get(LABS_ENDPOINT);
  return normalizeLabsFeatureFlags(response);
}
