import { css } from '@emotion/css';
import { useMemo, useState } from 'react';
import { useAsync } from 'react-use';

import { GrafanaTheme2 } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import { Badge, Card, FilterInput, RadioButtonGroup, Spinner, Switch, useStyles2 } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

import { FeatureFlagDTO, FeatureFlagListResponse, StageFilter } from './types';

const LOCAL_STORAGE_KEY = 'grafana.featureToggles';

const stageOptions: Array<{ label: string; value: StageFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Experimental', value: 'experimental' },
  { label: 'Preview', value: 'preview' },
  { label: 'GA', value: 'GA' },
  { label: 'Deprecated', value: 'deprecated' },
];

function getLocalOverrides(): Record<string, boolean> {
  const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!stored) {
    return {};
  }
  return stored.split(',').reduce(
    (acc, item) => {
      const [name, value] = item.split('=');
      if (name) {
        acc[name] = value === 'true' || value === '1';
      }
      return acc;
    },
    {} as Record<string, boolean>
  );
}

function setLocalOverride(name: string, enabled: boolean) {
  const overrides = getLocalOverrides();
  overrides[name] = enabled;
  const serialized = Object.entries(overrides)
    .map(([k, v]) => `${k}=${v ? 'true' : 'false'}`)
    .join(',');
  window.localStorage.setItem(LOCAL_STORAGE_KEY, serialized);
}

function getStageBadgeColor(stage: string): 'blue' | 'orange' | 'green' | 'red' | 'purple' {
  switch (stage) {
    case 'experimental':
      return 'orange';
    case 'preview':
    case 'privatePreview':
      return 'blue';
    case 'GA':
      return 'green';
    case 'deprecated':
      return 'red';
    default:
      return 'purple';
  }
}

function LabsPage() {
  const styles = useStyles2(getStyles);
  const [stageFilter, setStageFilter] = useState<StageFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [overrides, setOverrides] = useState<Record<string, boolean>>(getLocalOverrides);

  const { loading, value: data } = useAsync(
    () => getBackendSrv().get<FeatureFlagListResponse>('/api/featuremgmt/flags'),
    []
  );

  const filteredFlags = useMemo(() => {
    if (!data?.flags) {
      return [];
    }
    return data.flags.filter((flag) => {
      if (stageFilter !== 'all' && flag.stage !== stageFilter) {
        return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return flag.name.toLowerCase().includes(q) || flag.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [data, stageFilter, searchQuery]);

  const handleToggle = (flag: FeatureFlagDTO) => {
    const currentlyEnabled = overrides[flag.name] !== undefined ? overrides[flag.name] : flag.enabled;
    const newState = !currentlyEnabled;
    setLocalOverride(flag.name, newState);
    setOverrides((prev) => ({ ...prev, [flag.name]: newState }));
  };

  const isEnabled = (flag: FeatureFlagDTO): boolean => {
    if (overrides[flag.name] !== undefined) {
      return overrides[flag.name];
    }
    return flag.enabled;
  };

  return (
    <Page navId="labs">
      <Page.Contents>
        <div className={styles.description}>
          Toggle feature flags for this browser session. Changes are stored in localStorage and take effect on page
          reload.
        </div>
        <div className={styles.actionBar}>
          <FilterInput placeholder="Search feature flags..." value={searchQuery} onChange={setSearchQuery} />
          <RadioButtonGroup options={stageOptions} value={stageFilter} onChange={setStageFilter} />
        </div>
        {loading && (
          <div className={styles.loading}>
            <Spinner />
          </div>
        )}
        {!loading && filteredFlags.length === 0 && (
          <div className={styles.empty}>No feature flags found matching your criteria.</div>
        )}
        {!loading && (
          <div className={styles.flagList}>
            {filteredFlags.map((flag) => (
              <Card key={flag.name} className={styles.card}>
                <Card.Heading>{flag.name}</Card.Heading>
                <Card.Meta>
                  <Badge text={flag.stage} color={getStageBadgeColor(flag.stage)} />
                  {flag.requiresRestart && <Badge text="Requires restart" color="orange" icon="exclamation-triangle" />}
                  {flag.requiresDevMode && <Badge text="Dev mode only" color="purple" />}
                  {flag.frontendOnly && <Badge text="Frontend only" color="blue" />}
                </Card.Meta>
                <Card.Description>{flag.description || 'No description available'}</Card.Description>
                <Card.SecondaryActions>
                  <div className={styles.toggleContainer}>
                    <Switch
                      value={isEnabled(flag)}
                      onChange={() => handleToggle(flag)}
                      aria-label={`Toggle ${flag.name}`}
                    />
                  </div>
                </Card.SecondaryActions>
              </Card>
            ))}
          </div>
        )}
      </Page.Contents>
    </Page>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  description: css({
    marginBottom: theme.spacing(2),
    color: theme.colors.text.secondary,
    fontSize: theme.typography.body.fontSize,
  }),
  actionBar: css({
    display: 'flex',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(3),
    flexWrap: 'wrap',
    alignItems: 'center',
  }),
  loading: css({
    display: 'flex',
    justifyContent: 'center',
    padding: theme.spacing(4),
  }),
  empty: css({
    padding: theme.spacing(4),
    textAlign: 'center',
    color: theme.colors.text.secondary,
  }),
  flagList: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  }),
  card: css({
    marginBottom: 0,
  }),
  toggleContainer: css({
    display: 'flex',
    alignItems: 'center',
  }),
});

export default LabsPage;
