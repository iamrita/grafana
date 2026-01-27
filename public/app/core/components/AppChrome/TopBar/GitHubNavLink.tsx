import { css } from '@emotion/css';
import { memo } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { Icon, useStyles2 } from '@grafana/ui';

const GITHUB_URL = 'https://github.com/grafana/grafana';

export const GitHubNavLink = memo(function GitHubNavLink() {
  const styles = useStyles2(getStyles);

  return (
    <a
      href={GITHUB_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.link}
      aria-label={t('navigation.github.aria-label', 'GitHub repository')}
      title={t('navigation.github.tooltip', 'View Grafana on GitHub')}
    >
      <Icon name="github" size="lg" />
    </a>
  );
});

const getStyles = (theme: GrafanaTheme2) => ({
  link: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: theme.spacing(theme.components.height.md),
    padding: theme.spacing(0, 0.5),
    borderRadius: theme.shape.radius.default,
    color: theme.colors.text.secondary,
    border: '1px solid transparent',

    '&:hover': {
      color: theme.colors.text.primary,
      background: theme.colors.action.hover,
    },

    '&:focus, &:focus-visible': {
      outline: `2px solid ${theme.colors.primary.main}`,
      outlineOffset: '-2px',
    },
  }),
});
