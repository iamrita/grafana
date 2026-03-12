import { css } from '@emotion/css';

import { GrafanaTheme2 } from '@grafana/data';
import { Badge, Button, Card, Switch, useStyles2 } from '@grafana/ui';

import { FeatureFlag, FeatureStage } from '../hooks/useFeatureFlags';

interface Props {
  flag: FeatureFlag;
  onToggle: (name: string, enabled: boolean) => void;
  onReset: (name: string) => void;
}

const stageBadgeColor: Record<FeatureStage, 'blue' | 'orange' | 'green' | 'red' | 'purple'> = {
  experimental: 'orange',
  privatePreview: 'purple',
  preview: 'blue',
  GA: 'green',
  deprecated: 'red',
  unknown: 'blue',
};

const stageLabels: Record<FeatureStage, string> = {
  experimental: 'Experimental',
  privatePreview: 'Private Preview',
  preview: 'Preview',
  GA: 'GA',
  deprecated: 'Deprecated',
  unknown: 'Unknown',
};

export function FeatureFlagCard({ flag, onToggle, onReset }: Props) {
  const styles = useStyles2(getStyles);

  const handleToggle = () => {
    onToggle(flag.name, !flag.currentEnabled);
  };

  return (
    <Card className={styles.card}>
      <Card.Heading className={styles.heading}>
        <div className={styles.titleRow}>
          <code className={styles.name}>{flag.name}</code>
          <div className={styles.badges}>
            <Badge text={stageLabels[flag.stage]} color={stageBadgeColor[flag.stage]} />
            {flag.requiresRestart && <Badge text="Requires restart" color="orange" icon="sync" />}
            {flag.hasOverride && <Badge text="Overridden" color="purple" />}
          </div>
        </div>
      </Card.Heading>
      <Card.Description className={styles.description}>
        {flag.description || 'No description available'}
        {flag.owner && (
          <div className={styles.owner}>
            Owner: <span className={styles.ownerValue}>{flag.owner}</span>
          </div>
        )}
      </Card.Description>
      <Card.Actions className={styles.actions}>
        <div className={styles.toggleContainer}>
          <Switch value={flag.currentEnabled} onChange={handleToggle} />
          <span className={styles.toggleLabel}>{flag.currentEnabled ? 'Enabled' : 'Disabled'}</span>
        </div>
        {flag.hasOverride && (
          <Button variant="secondary" size="sm" onClick={() => onReset(flag.name)}>
            Reset to default
          </Button>
        )}
      </Card.Actions>
    </Card>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    card: css({
      marginBottom: theme.spacing(1),
    }),
    heading: css({
      width: '100%',
    }),
    titleRow: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: theme.spacing(1),
      width: '100%',
    }),
    name: css({
      fontSize: theme.typography.body.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
      color: theme.colors.text.primary,
      backgroundColor: theme.colors.background.secondary,
      padding: `${theme.spacing(0.25)} ${theme.spacing(0.5)}`,
      borderRadius: theme.shape.radius.default,
    }),
    badges: css({
      display: 'flex',
      gap: theme.spacing(0.5),
      flexWrap: 'wrap',
    }),
    description: css({
      color: theme.colors.text.secondary,
      fontSize: theme.typography.bodySmall.fontSize,
    }),
    owner: css({
      marginTop: theme.spacing(1),
      fontSize: theme.typography.bodySmall.fontSize,
    }),
    ownerValue: css({
      color: theme.colors.text.primary,
    }),
    actions: css({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(2),
    }),
    toggleContainer: css({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1),
    }),
    toggleLabel: css({
      fontSize: theme.typography.bodySmall.fontSize,
      color: theme.colors.text.secondary,
      minWidth: 60,
    }),
  };
}
