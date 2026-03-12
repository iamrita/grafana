import { css } from '@emotion/css';

import { GrafanaTheme2 } from '@grafana/data';
import { EmptyState, useStyles2 } from '@grafana/ui';

import { FeatureFlag } from '../hooks/useFeatureFlags';

import { FeatureFlagCard } from './FeatureFlagCard';

interface Props {
  flags: FeatureFlag[];
  onToggle: (name: string, enabled: boolean) => void;
  onReset: (name: string) => void;
}

export function FeatureFlagList({ flags, onToggle, onReset }: Props) {
  const styles = useStyles2(getStyles);

  if (flags.length === 0) {
    return (
      <EmptyState
        variant="not-found"
        message="No feature flags found"
        description="Try adjusting your search or filter criteria"
      />
    );
  }

  return (
    <div className={styles.list}>
      {flags.map((flag) => (
        <FeatureFlagCard key={flag.name} flag={flag} onToggle={onToggle} onReset={onReset} />
      ))}
    </div>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    list: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1),
    }),
  };
}
