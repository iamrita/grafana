import { css } from '@emotion/css';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { GrafanaTheme2, store } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { getBackendSrv } from '@grafana/runtime';
import {
  Alert,
  Badge,
  Button,
  Card,
  FilterInput,
  Icon,
  InlineSwitch,
  RadioButtonGroup,
  Stack,
  useStyles2,
} from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

import { FeatureFlagMeta, FeatureFlagsResponse, StageFilter } from './types';

const LOCALSTORAGE_KEY = 'grafana.featureToggles';

const stageOptions: Array<{ label: string; value: StageFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Experimental', value: 'experimental' },
  { label: 'Preview', value: 'preview' },
  { label: 'GA', value: 'GA' },
  { label: 'Deprecated', value: 'deprecated' },
];

function getLocalStorageOverrides(): Record<string, boolean> {
  const stored = store.get(LOCALSTORAGE_KEY);
  if (!stored) {
    return {};
  }
  const overrides: Record<string, boolean> = {};
  const features = stored.split(',');
  for (const feature of features) {
    const [name, value] = feature.split('=');
    if (name) {
      overrides[name] = value === 'true' || value === '1';
    }
  }
  return overrides;
}

function setLocalStorageOverrides(overrides: Record<string, boolean>): void {
  const entries = Object.entries(overrides)
    .filter(([_, value]) => value !== undefined)
    .map(([name, value]) => `${name}=${value ? '1' : '0'}`);

  if (entries.length === 0) {
    store.delete(LOCALSTORAGE_KEY);
  } else {
    store.set(LOCALSTORAGE_KEY, entries.join(','));
  }
  window.dispatchEvent(new StorageEvent('storage', { key: LOCALSTORAGE_KEY }));
}

function LabsPage() {
  const styles = useStyles2(getStyles);
  const [flags, setFlags] = useState<FeatureFlagMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<StageFilter>('all');
  const [localOverrides, setLocalOverrides] = useState<Record<string, boolean>>(getLocalStorageOverrides());
  const [pendingReload, setPendingReload] = useState(false);

  useEffect(() => {
    const fetchFlags = async () => {
      try {
        const response = await getBackendSrv().get<FeatureFlagsResponse>('/api/featuremgmt/v1/flags');
        setFlags(response.flags || []);
      } catch (err) {
        setError(t('admin.labs.error-loading', 'Failed to load feature flags'));
        console.error('Failed to load feature flags:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFlags();
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LOCALSTORAGE_KEY) {
        setLocalOverrides(getLocalStorageOverrides());
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleToggle = useCallback(
    (flagName: string, currentEnabled: boolean, requiresRestart: boolean) => {
      const newOverrides = { ...localOverrides, [flagName]: !currentEnabled };
      setLocalOverrides(newOverrides);
      setLocalStorageOverrides(newOverrides);
      if (requiresRestart) {
        setPendingReload(true);
      }
    },
    [localOverrides]
  );

  const handleResetAll = useCallback(() => {
    setLocalOverrides({});
    setLocalStorageOverrides({});
    setPendingReload(false);
  }, []);

  const handleReload = useCallback(() => {
    window.location.reload();
  }, []);

  const getEffectiveEnabled = useCallback(
    (flag: FeatureFlagMeta): boolean => {
      if (localOverrides[flag.name] !== undefined) {
        return localOverrides[flag.name];
      }
      return flag.enabled;
    },
    [localOverrides]
  );

  const filteredFlags = useMemo(() => {
    // eslint-disable-next-line no-restricted-syntax
    const collator = new Intl.Collator();
    return flags
      .filter((flag) => {
        if (stageFilter !== 'all' && flag.stage !== stageFilter) {
          return false;
        }
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return flag.name.toLowerCase().includes(query) || flag.description.toLowerCase().includes(query);
        }
        return true;
      })
      .sort((a, b) => collator.compare(a.name, b.name));
  }, [flags, searchQuery, stageFilter]);

  const hasOverrides = Object.keys(localOverrides).length > 0;

  const getStageBadgeColor = (stage: string): 'blue' | 'orange' | 'green' | 'red' => {
    switch (stage) {
      case 'experimental':
        return 'orange';
      case 'preview':
        return 'blue';
      case 'GA':
        return 'green';
      case 'deprecated':
        return 'red';
      default:
        return 'blue';
    }
  };

  if (loading) {
    return (
      <Page navId="labs">
        <Page.Contents>
          <div>
            <Trans i18nKey="admin.labs.loading">Loading feature flags...</Trans>
          </div>
        </Page.Contents>
      </Page>
    );
  }

  if (error) {
    return (
      <Page navId="labs">
        <Page.Contents>
          <Alert severity="error" title={t('admin.labs.error-title', 'Error loading feature flags')}>
            {error}
          </Alert>
        </Page.Contents>
      </Page>
    );
  }

  return (
    <Page navId="labs">
      <Page.Contents>
        <Alert severity="info" title={t('admin.labs.info-title', 'Experimental Features')}>
          <Trans i18nKey="admin.labs.info-description">
            These are frontend-only feature flags that can be toggled without restarting Grafana. Changes are stored in
            your browser&apos;s localStorage and apply only to this browser session. Some flags may require a page
            reload to take effect.
          </Trans>
        </Alert>

        {pendingReload && (
          <Alert
            severity="warning"
            title={t('admin.labs.reload-required-title', 'Reload required')}
            className={styles.reloadAlert}
          >
            <Stack direction="row" alignItems="center" gap={2}>
              <span>
                <Trans i18nKey="admin.labs.reload-required-message">
                  Some changes require a page reload to take effect.
                </Trans>
              </span>
              <Button variant="primary" size="sm" onClick={handleReload}>
                <Trans i18nKey="admin.labs.reload-now">Reload now</Trans>
              </Button>
            </Stack>
          </Alert>
        )}

        <div className={styles.controls}>
          <Stack direction="row" gap={2} alignItems="flex-end" wrap="wrap">
            <FilterInput
              placeholder={t('admin.labs.search-placeholder', 'Search flags by name or description...')}
              value={searchQuery}
              onChange={setSearchQuery}
              className={styles.searchInput}
            />
            <RadioButtonGroup
              options={stageOptions}
              value={stageFilter}
              onChange={(v) => setStageFilter(v)}
              size="sm"
            />
            {hasOverrides && (
              <Button variant="secondary" size="sm" onClick={handleResetAll} icon="times">
                <Trans i18nKey="admin.labs.reset-all">Reset all overrides</Trans>
              </Button>
            )}
          </Stack>
        </div>

        <div className={styles.flagCount}>
          <Trans
            i18nKey="admin.labs.flag-count"
            values={{ filtered: filteredFlags.length, total: flags.length, overridden: Object.keys(localOverrides).length }}
          >
            {'Showing {{ filtered }} of {{ total }} flags'}
            {hasOverrides && ' ({{ overridden }} overridden)'}
          </Trans>
        </div>

        <div className={styles.flagList}>
          {filteredFlags.map((flag) => {
            const effectiveEnabled = getEffectiveEnabled(flag);
            const isOverridden = localOverrides[flag.name] !== undefined;

            return (
              <Card key={flag.name} className={styles.flagCard} noMargin>
                <Card.Heading>
                  <Stack direction="row" gap={1} alignItems="center">
                    <span>{flag.name}</span>
                    <Badge text={flag.stage} color={getStageBadgeColor(flag.stage)} />
                    {flag.requiresRestart && (
                      <Badge
                        text={t('admin.labs.requires-reload', 'requires reload')}
                        color="orange"
                        icon="sync"
                        tooltip={t('admin.labs.requires-reload-tooltip', 'Changes require page reload')}
                      />
                    )}
                    {isOverridden && (
                      <Badge text={t('admin.labs.overridden', 'overridden')} color="purple" icon="edit" />
                    )}
                  </Stack>
                </Card.Heading>
                <Card.Description>
                  {flag.description || t('admin.labs.no-description', 'No description available')}
                </Card.Description>
                <Card.Meta>
                  {flag.owner && (
                    <span>
                      <Icon name="user" size="sm" /> {flag.owner}
                    </span>
                  )}
                  <span>
                    <Trans i18nKey="admin.labs.default-value">Default:</Trans>{' '}
                    {flag.expression === 'true'
                      ? t('admin.labs.enabled', 'enabled')
                      : t('admin.labs.disabled', 'disabled')}
                  </span>
                </Card.Meta>
                <Card.Actions>
                  <InlineSwitch
                    label={
                      effectiveEnabled ? t('admin.labs.switch-enabled', 'Enabled') : t('admin.labs.switch-disabled', 'Disabled')
                    }
                    showLabel={true}
                    value={effectiveEnabled}
                    onChange={() => handleToggle(flag.name, effectiveEnabled, flag.requiresRestart)}
                  />
                </Card.Actions>
              </Card>
            );
          })}
        </div>

        {filteredFlags.length === 0 && (
          <div className={styles.noResults}>
            <Icon name="search" size="xl" />
            <p>
              <Trans i18nKey="admin.labs.no-results">No feature flags match your search criteria</Trans>
            </p>
          </div>
        )}
      </Page.Contents>
    </Page>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  controls: css({
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  }),
  searchInput: css({
    minWidth: '300px',
  }),
  flagCount: css({
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing(2),
    fontSize: theme.typography.bodySmall.fontSize,
  }),
  flagList: css({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
    gap: theme.spacing(2),
  }),
  flagCard: css({
    marginBottom: 0,
  }),
  reloadAlert: css({
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  }),
  noResults: css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(8),
    color: theme.colors.text.secondary,
    '& p': {
      marginTop: theme.spacing(2),
    },
  }),
});

export default LabsPage;
