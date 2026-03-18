export interface FeatureFlagDTO {
  name: string;
  description: string;
  stage: string;
  enabled: boolean;
  requiresDevMode?: boolean;
  frontendOnly?: boolean;
  requiresRestart?: boolean;
}

export interface FeatureFlagListResponse {
  flags: FeatureFlagDTO[];
}

export type StageFilter = 'all' | 'experimental' | 'preview' | 'GA' | 'deprecated';
