export interface FeatureFlag {
  name: string;
  description: string;
  stage: string;
  owner?: string;
  expression?: string;
  frontendOnly: boolean;
  requiresRestart: boolean;
  requiresDevMode: boolean;
  hideFromDocs: boolean;
}

export type StageFilter = 'all' | 'experimental' | 'preview' | 'GA' | 'deprecated' | 'modified';
