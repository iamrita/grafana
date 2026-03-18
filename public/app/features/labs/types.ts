export interface FeatureFlag {
  name: string;
  description: string;
  stage: 'experimental' | 'privatePreview' | 'preview' | 'GA' | 'deprecated' | 'unknown';
  enabled: boolean;
  requiresDevMode?: boolean;
  frontendOnly?: boolean;
  requiresRestart?: boolean;
}

export type StageFilter = 'all' | 'experimental' | 'preview' | 'GA' | 'deprecated';
