import { getBackendSrv } from '@grafana/runtime';
import { ResourceList } from 'app/features/apiserver/types';

export interface FeatureSpec {
  description?: string;
  stage?: string;
  codeowner?: string;
  requiresRestart?: boolean;
}

export interface FeatureResource {
  metadata: {
    name: string;
  };
  spec?: FeatureSpec;
}

export interface LabsFeature {
  name: string;
  description: string;
  stage: string;
  owner: string;
  requiresRestart: boolean;
}

interface FrontendSettingsResponse {
  featureToggles?: Record<string, boolean>;
}

const collator = new Intl.Collator();

function mapResourceList(response: ResourceList<FeatureSpec>): LabsFeature[] {
  return response.items.map((item: FeatureResource) => ({
    name: item.metadata.name,
    description: item.spec?.description ?? '',
    stage: item.spec?.stage ?? 'unknown',
    owner: item.spec?.codeowner ?? 'unknown',
    requiresRestart: Boolean(item.spec?.requiresRestart),
  }));
}

function mapFrontendSettings(response: FrontendSettingsResponse): LabsFeature[] {
  if (!response.featureToggles) {
    return [];
  }

  return Object.keys(response.featureToggles)
    .sort((a, b) => collator.compare(a, b))
    .map((name) => ({
      name,
      description: '',
      stage: 'unknown',
      owner: 'unknown',
      requiresRestart: false,
    }));
}

export async function fetchFeatureMetadata(): Promise<LabsFeature[]> {
  // `features` is a cluster-scoped resource, so it does not include namespace in the path.
  try {
    const response = await getBackendSrv().get<ResourceList<FeatureSpec>>('/apis/featuretoggle.grafana.app/v0alpha1/features');
    return mapResourceList(response);
  } catch {
    const fallback = await getBackendSrv().get<FrontendSettingsResponse>('/api/frontend/settings');
    return mapFrontendSettings(fallback);
  }
}
