export interface FeatureFlagMeta {
  name: string;
  description: string;
  stage: 'experimental' | 'preview' | 'GA' | 'deprecated';
  owner: string;
  frontend: boolean;
  requiresRestart: boolean;
  expression: string;
  enabled: boolean;
}

export interface FeatureFlagsResponse {
  flags: FeatureFlagMeta[];
}

export type StageFilter = 'all' | 'experimental' | 'preview' | 'GA' | 'deprecated';
