export interface FeatureToggleInfo {
  name: string;
  description: string;
  stage: 'experimental' | 'privatePreview' | 'preview' | 'GA' | 'deprecated' | 'unknown';
  owner?: string;
  requiresRestart?: boolean;
  frontendOnly?: boolean;
  enabled: boolean;
}

export interface FeatureTogglesResponse {
  features: FeatureToggleInfo[];
}

export type StageFilter = 'all' | 'experimental' | 'preview' | 'GA' | 'deprecated';
