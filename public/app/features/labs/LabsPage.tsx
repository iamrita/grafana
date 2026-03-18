import { css } from '@emotion/css';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { Alert, Badge, Card, FilterInput, RadioButtonGroup, Stack, Switch, useStyles2 } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

import { getLocalOverrides, removeLocalOverride, setLocalOverride } from './featureFlagStorage';
import { FeatureFlag, StageFilter } from './types';

const stageFilterOptions = [
  { label: 'All', value: 'all' as const },
  { label: 'Experimental', value: 'experimental' as const },
  { label: 'Preview', value: 'preview' as const },
  { label: 'GA', value: 'GA' as const },
  { label: 'Deprecated', value: 'deprecated' as const },
];

function getStageBadgeColor(stage: FeatureFlag['stage']): 'blue' | 'orange' | 'green' | 'red' | 'purple' {
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

export function LabsPage() {
  const styles = useStyles2(getStyles);
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<StageFilter>('all');
  const [localOverrides, setLocalOverridesState] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setLocalOverridesState(getLocalOverrides());
  }, []);

  useEffect(() => {
    async function fetchFlags() {
      try {
        const response = await fetch('/api/featuremgmt/flags');
        if (!response.ok) {
          throw new Error(`Failed to fetch feature flags: ${response.statusText}`);
        }
        const data = await response.json();
        setFlags(data.flags);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load feature flags');
      } finally {
        setLoading(false);
      }
    }
    fetchFlags();
  }, []);

  const handleToggle = useCallback((flag: FeatureFlag) => {
    const currentOverride = localOverrides[flag.name];
    const isCurrentlyEnabled = currentOverride !== undefined ? currentOverride : flag.enabled;
    const newEnabled = !isCurrentlyEnabled;

    if (newEnabled === flag.enabled) {
      removeLocalOverride(flag.name);
      setLocalOverridesState((prev) => {
        const next = { ...prev };
        delete next[flag.name];
        return next;
      });
    } else {
      setLocalOverride(flag.name, newEnabled);
      setLocalOverridesState((prev) => ({ ...prev, [flag.name]: newEnabled }));
    }
  }, [localOverrides]);

  const filteredFlags = useMemo(() => {
    return flags.filter((flag) => {
      const matchesSearch =
        searchQuery === '' ||
        flag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        flag.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStage =
        stageFilter === 'all' ||
        flag.stage === stageFilter ||
        (stageFilter === 'preview' && flag.stage === 'privatePreview');

      return matchesSearch && matchesStage;
    });
  }, [flags, searchQuery, stageFilter]);

  const flagsRequiringRestart = useMemo(() => {
    return Object.keys(localOverrides).filter((name) => {
      const flag = flags.find((f) => f.name === name);
      return flag?.requiresRestart;
    });
  }, [flags, localOverrides]);

  return (
    <Page navId="labs">
      <Page.Contents>
        <Stack direction="column" gap={2}>
          {flagsRequiringRestart.length > 0 && (
            <Alert title="Restart required" severity="warning">
              The following feature flags require a page reload to take effect:{' '}
              {flagsRequiringRestart.join(', ')}
            </Alert>
          )}

          <div className={styles.filters}>
            <FilterInput
              placeholder="Search feature flags..."
              value={searchQuery}
              onChange={setSearchQuery}
              className={styles.searchInput}
            />
            <RadioButtonGroup
              options={stageFilterOptions}
              value={stageFilter}
              onChange={setStageFilter}
            />
          </div>

          {loading && <div>Loading feature flags...</div>}
          {error && <Alert title="Error" severity="error">{error}</Alert>}

          {!loading && !error && (
            <div className={styles.grid}>
              {filteredFlags.map((flag) => {
                const override = localOverrides[flag.name];
                const isEnabled = override !== undefined ? override : flag.enabled;
                const hasOverride = override !== undefined;

                return (
                  <Card key={flag.name} className={styles.card}>
                    <Card.Heading className={styles.cardHeading}>
                      <Stack direction="row" alignItems="center" gap={1}>
                        <span>{flag.name}</span>
                        <Badge text={flag.stage} color={getStageBadgeColor(flag.stage)} />
                        {hasOverride && <Badge text="overridden" color="orange" />}
                      </Stack>
                    </Card.Heading>
                    <Card.Description>{flag.description}</Card.Description>
                    <Card.Actions>
                      <Stack direction="row" alignItems="center" gap={1}>
                        {flag.requiresRestart && (
                          <span className={styles.restartNote}>Requires restart</span>
                        )}
                        <Switch
                          value={isEnabled}
                          onChange={() => handleToggle(flag)}
                        />
                      </Stack>
                    </Card.Actions>
                  </Card>
                );
              })}
            </div>
          )}

          {!loading && !error && filteredFlags.length === 0 && (
            <div className={styles.emptyState}>No feature flags found matching your criteria.</div>
          )}
        </Stack>
      </Page.Contents>
    </Page>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    filters: css({
      display: 'flex',
      flexDirection: 'row',
      gap: theme.spacing(2),
      alignItems: 'center',
      flexWrap: 'wrap',
    }),
    searchInput: css({
      maxWidth: '400px',
    }),
    grid: css({
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
      gap: theme.spacing(2),
    }),
    card: css({
      height: '100%',
    }),
    cardHeading: css({
      fontSize: theme.typography.body.fontSize,
    }),
    restartNote: css({
      fontSize: theme.typography.bodySmall.fontSize,
      color: theme.colors.text.secondary,
    }),
    emptyState: css({
      padding: theme.spacing(4),
      textAlign: 'center',
      color: theme.colors.text.secondary,
    }),
  };
}

export default LabsPage;
