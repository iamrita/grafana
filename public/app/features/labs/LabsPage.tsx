import { css } from '@emotion/css';
import { useMemo, useState } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { config } from '@grafana/runtime';
import {
  Alert,
  Badge,
  Card,
  FilterInput,
  InlineField,
  RadioButtonGroup,
  Switch,
  useStyles2,
  Stack,
} from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

import { featureFlagsMetadata, FeatureFlagMetadata } from './featureFlagsMetadata';

type StageFilter = 'all' | 'experimental' | 'preview' | 'privatePreview' | 'GA' | 'deprecated';

const STORAGE_KEY = 'grafana.featureToggles';

function getLocalStorageToggles(): Record<string, boolean> {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return {};
  }

  const toggles: Record<string, boolean> = {};
  const features = stored.split(',');
  for (const feature of features) {
    const [name, value] = feature.split('=');
    if (name) {
      toggles[name] = value === 'true' || value === '1';
    }
  }
  return toggles;
}

function setLocalStorageToggles(toggles: Record<string, boolean>) {
  const entries = Object.entries(toggles)
    .filter(([, value]) => value !== undefined)
    .map(([name, value]) => `${name}=${value ? '1' : '0'}`);

  if (entries.length > 0) {
    localStorage.setItem(STORAGE_KEY, entries.join(','));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function getEffectiveValue(flagName: string, localOverrides: Record<string, boolean>): boolean {
  if (flagName in localOverrides) {
    return localOverrides[flagName];
  }
  return config.featureToggles[flagName as keyof typeof config.featureToggles] ?? false;
}

function getStageBadgeColor(stage: string): 'orange' | 'blue' | 'green' | 'red' | 'purple' {
  switch (stage) {
    case 'experimental':
      return 'orange';
    case 'privatePreview':
      return 'purple';
    case 'preview':
      return 'blue';
    case 'GA':
      return 'green';
    case 'deprecated':
      return 'red';
    default:
      return 'blue';
  }
}

const stageFilterOptions = [
  { label: 'All', value: 'all' as StageFilter },
  { label: 'Experimental', value: 'experimental' as StageFilter },
  { label: 'Private Preview', value: 'privatePreview' as StageFilter },
  { label: 'Preview', value: 'preview' as StageFilter },
  { label: 'GA', value: 'GA' as StageFilter },
  { label: 'Deprecated', value: 'deprecated' as StageFilter },
];

export default function LabsPage() {
  const styles = useStyles2(getStyles);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<StageFilter>('all');
  const [localOverrides, setLocalOverrides] = useState<Record<string, boolean>>(getLocalStorageToggles);

  const filteredFlags = useMemo(() => {
    return featureFlagsMetadata.filter((flag) => {
      const matchesSearch =
        searchQuery === '' ||
        flag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        flag.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStage = stageFilter === 'all' || flag.stage === stageFilter;

      return matchesSearch && matchesStage;
    });
  }, [searchQuery, stageFilter]);

  const handleToggle = (flagName: string, newValue: boolean) => {
    const newOverrides = { ...localOverrides, [flagName]: newValue };
    setLocalOverrides(newOverrides);
    setLocalStorageToggles(newOverrides);
  };

  const handleResetAll = () => {
    setLocalOverrides({});
    localStorage.removeItem(STORAGE_KEY);
  };

  const hasOverrides = Object.keys(localOverrides).length > 0;

  return (
    <Page navId="labs">
      <Page.Contents>
        <Alert severity="info" title="Feature Flag Overrides">
          Changes to feature flags are stored in your browser&apos;s localStorage and will persist across page
          refreshes. Some flags may require a full page reload to take effect.
        </Alert>

        <div className={styles.controls}>
          <Stack gap={2} wrap="wrap" alignItems="flex-end">
            <FilterInput
              placeholder="Search feature flags..."
              value={searchQuery}
              onChange={setSearchQuery}
              width={40}
            />
            <InlineField label="Stage">
              <RadioButtonGroup options={stageFilterOptions} value={stageFilter} onChange={setStageFilter} />
            </InlineField>
            {hasOverrides && (
              <button className={styles.resetButton} onClick={handleResetAll}>
                Reset all overrides
              </button>
            )}
          </Stack>
        </div>

        <div className={styles.summary}>
          Showing {filteredFlags.length} of {featureFlagsMetadata.length} feature flags
          {hasOverrides && ` (${Object.keys(localOverrides).length} overridden)`}
        </div>

        <div className={styles.flagList}>
          {filteredFlags.map((flag) => (
            <FeatureFlagCard
              key={flag.name}
              flag={flag}
              isEnabled={getEffectiveValue(flag.name, localOverrides)}
              isOverridden={flag.name in localOverrides}
              onToggle={(value) => handleToggle(flag.name, value)}
            />
          ))}
        </div>

        {filteredFlags.length === 0 && (
          <div className={styles.noResults}>No feature flags match your search criteria.</div>
        )}
      </Page.Contents>
    </Page>
  );
}

interface FeatureFlagCardProps {
  flag: FeatureFlagMetadata;
  isEnabled: boolean;
  isOverridden: boolean;
  onToggle: (value: boolean) => void;
}

function FeatureFlagCard({ flag, isEnabled, isOverridden, onToggle }: FeatureFlagCardProps) {
  const styles = useStyles2(getStyles);

  return (
    <Card className={styles.card}>
      <Card.Heading className={styles.cardHeading}>
        <Stack gap={1} alignItems="center">
          <span>{flag.name}</span>
          <Badge text={flag.stage} color={getStageBadgeColor(flag.stage)} />
          {isOverridden && <Badge text="overridden" color="purple" />}
        </Stack>
      </Card.Heading>
      <Card.Description>{flag.description}</Card.Description>
      <Card.Meta>
        {flag.owner && <span>Owner: {flag.owner}</span>}
        {flag.frontend && <span>Frontend only</span>}
      </Card.Meta>
      <Card.Actions>
        <Switch value={isEnabled} onChange={(e) => onToggle(e.currentTarget.checked)} />
      </Card.Actions>
    </Card>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    controls: css({
      marginBottom: theme.spacing(2),
      marginTop: theme.spacing(2),
    }),
    summary: css({
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing(2),
    }),
    flagList: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1),
    }),
    card: css({
      marginBottom: theme.spacing(1),
    }),
    cardHeading: css({
      fontFamily: theme.typography.fontFamilyMonospace,
      fontSize: theme.typography.body.fontSize,
    }),
    resetButton: css({
      backgroundColor: theme.colors.error.main,
      color: theme.colors.error.contrastText,
      border: 'none',
      borderRadius: theme.shape.radius.default,
      padding: `${theme.spacing(0.5)} ${theme.spacing(1)}`,
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: theme.colors.error.shade,
      },
    }),
    noResults: css({
      textAlign: 'center',
      color: theme.colors.text.secondary,
      padding: theme.spacing(4),
    }),
  };
}
