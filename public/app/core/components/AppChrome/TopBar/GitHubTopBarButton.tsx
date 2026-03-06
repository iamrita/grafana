import { memo } from 'react';

import { t } from '@grafana/i18n';
import { ToolbarButton } from '@grafana/ui';

const GRAFANA_GITHUB_URL = 'https://github.com/grafana/grafana';

export const GitHubTopBarButton = memo(function GitHubTopBarButton() {
  return (
    <ToolbarButton
      iconOnly
      icon="github"
      aria-label={t('navigation.github.aria-label', 'GitHub')}
      tooltip={t('navigation.github.tooltip', 'View Grafana on GitHub')}
      onClick={() => window.open(GRAFANA_GITHUB_URL, '_blank', 'noopener,noreferrer')}
    />
  );
});
