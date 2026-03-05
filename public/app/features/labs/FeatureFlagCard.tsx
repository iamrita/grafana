import { css } from '@emotion/css';

import { GrafanaTheme2 } from '@grafana/data';
import { Badge, Stack, Switch, Text, useStyles2 } from '@grafana/ui';

import { FeatureFlag } from './types';

interface Props {
  flag: FeatureFlag;
  enabled: boolean;
  disabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function FeatureFlagCard({ flag, enabled, disabled, onToggle }: Props) {
  const styles = useStyles2(getStyles);
  const warnings = getWarnings(flag, disabled);

  return (
    <div className={styles.card}>
      <Stack justifyContent="space-between" alignItems="center">
        <Stack direction="column" gap={0.5}>
          <Text element="h4">{flag.name}</Text>
          <Text color="secondary">{flag.description || 'No description available'}</Text>
        </Stack>
        <Switch value={enabled} disabled={disabled} onChange={(event) => onToggle(event.currentTarget.checked)} />
      </Stack>

      <Stack gap={1} wrap="wrap">
        <Badge text={formatStage(flag.stage)} color={getStageColor(flag.stage)} />
        {flag.owner && <Badge text={flag.owner} color="blue" />}
        {warnings.map((warning) => (
          <Badge key={warning} text={warning} color="orange" />
        ))}
      </Stack>
    </div>
  );
}

function getWarnings(flag: FeatureFlag, toggleDisabled: boolean): string[] {
  const warnings: string[] = [];
  if (flag.requiresRestart) {
    warnings.push('Requires server restart');
  }
  if (!flag.frontendOnly) {
    warnings.push('Backend behavior unchanged');
  }
  if (toggleDisabled && flag.requiresDevMode) {
    warnings.push('Development mode only');
  }

  return warnings;
}

function formatStage(stage: string): string {
  switch (stage) {
    case 'experimental':
      return 'Experimental';
    case 'privatePreview':
      return 'Private preview';
    case 'preview':
      return 'Preview';
    case 'GA':
      return 'GA';
    case 'deprecated':
      return 'Deprecated';
    default:
      return 'Unknown';
  }
}

function getStageColor(stage: string) {
  switch (stage) {
    case 'experimental':
      return 'orange';
    case 'privatePreview':
    case 'preview':
      return 'blue';
    case 'GA':
      return 'green';
    case 'deprecated':
      return 'red';
    default:
      return 'darkgrey';
  }
}

const getStyles = (theme: GrafanaTheme2) => ({
  card: css({
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    padding: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.5),
  }),
});
