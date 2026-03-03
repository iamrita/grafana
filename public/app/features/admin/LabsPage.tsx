import { css, cx } from '@emotion/css';
import { useMemo, useState } from 'react';
import { useAsync, useMount } from 'react-use';

import { GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { getBackendSrv } from '@grafana/runtime';
import { Alert, Button, Field, Input, RadioButtonGroup, Stack, Switch, Text, Tooltip, useStyles2 } from '@grafana/ui';
import config from 'app/core/config';
import { Page } from 'app/core/components/Page/Page';

import {
  FeatureToggleOverrides,
  clearFeatureToggleOverrides,
  countPendingChanges,
  hasResetFeatureFlagsParam,
  readFeatureToggleOverrides,
  removeResetFeatureFlagsParamFromCurrentUrl,
  writeFeatureToggleOverrides,
} from './labsUtils';

type StageFilter = 'all' | 'experimental' | 'preview' | 'ga' | 'deprecated';

export interface LabsFeature {
  name: string;
  description: string;
  stage: string;
  owner: string;
  enabled: boolean;
  frontendOnly: boolean;
  requiresRestart: boolean;
  requiresDevMode: boolean;
}

interface StageOption {
  value: StageFilter;
  label: string;
}

const stageOptions: StageOption[] = [
  { value: 'all', label: t('admin.labs.filter.all', 'All') },
  { value: 'experimental', label: t('admin.labs.filter.experimental', 'Experimental') },
  { value: 'preview', label: t('admin.labs.filter.preview', 'Preview') },
  { value: 'ga', label: t('admin.labs.filter.ga', 'GA') },
  { value: 'deprecated', label: t('admin.labs.filter.deprecated', 'Deprecated') },
];

function getStyles(theme: GrafanaTheme2) {
  return {
    controls: css({
      marginBottom: theme.spacing(2),
    }),
    list: css({
      display: 'grid',
      gap: theme.spacing(1),
    }),
    row: css({
      border: `1px solid ${theme.colors.border.weak}`,
      borderRadius: theme.shape.radius.default,
      padding: theme.spacing(1.5),
    }),
    rowHeader: css({
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: theme.spacing(1),
    }),
    name: css({
      fontWeight: theme.typography.fontWeightMedium,
      marginBottom: theme.spacing(0.5),
    }),
    description: css({
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing(1),
    }),
    stageBadge: css({
      borderRadius: theme.shape.radius.pill,
      fontSize: theme.typography.bodySmall.fontSize,
      padding: `${theme.spacing(0.25)} ${theme.spacing(1)}`,
      textTransform: 'uppercase',
    }),
    stageExperimental: css({
      background: theme.colors.warning.transparent,
      color: theme.colors.warning.text,
    }),
    stagePreview: css({
      background: theme.colors.info.transparent,
      color: theme.colors.info.text,
    }),
    stageGA: css({
      background: theme.colors.success.transparent,
      color: theme.colors.success.text,
    }),
    stageDeprecated: css({
      background: theme.colors.background.secondary,
      color: theme.colors.text.secondary,
    }),
    warningBadge: css({
      borderRadius: theme.shape.radius.pill,
      border: `1px solid ${theme.colors.warning.border}`,
      color: theme.colors.warning.text,
      fontSize: theme.typography.bodySmall.fontSize,
      padding: `${theme.spacing(0.25)} ${theme.spacing(0.75)}`,
    }),
    toggleSection: css({
      marginTop: theme.spacing(1),
    }),
  };
}

function normalizeStage(stage: string): StageFilter {
  const normalized = stage.toLowerCase();
  if (normalized.includes('deprecated')) {
    return 'deprecated';
  }
  if (normalized.includes('preview')) {
    return 'preview';
  }
  if (normalized === 'ga' || normalized.includes('general')) {
    return 'ga';
  }
  if (normalized.includes('experimental')) {
    return 'experimental';
  }
  return 'experimental';
}

export function filterLabsFeatures(features: LabsFeature[], query: string, stage: StageFilter, isDevEnv: boolean) {
  const normalizedQuery = query.trim().toLowerCase();
  return features.filter((feature) => {
    if (!isDevEnv && feature.requiresDevMode) {
      return false;
    }

    if (stage !== 'all' && normalizeStage(feature.stage) !== stage) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    return (
      feature.name.toLowerCase().includes(normalizedQuery) || feature.description.toLowerCase().includes(normalizedQuery)
    );
  });
}

export default function LabsPage() {
  const styles = useStyles2(getStyles);
  const isDevEnv = config.buildInfo.env === 'development';
  const [stageFilter, setStageFilter] = useState<StageFilter>('all');
  const [query, setQuery] = useState('');
  const [initialOverrides, setInitialOverrides] = useState<FeatureToggleOverrides>({});
  const [overrides, setOverrides] = useState<FeatureToggleOverrides>({});
  const [storageError, setStorageError] = useState<string>();

  useMount(() => {
    if (hasResetFeatureFlagsParam(window.location.search)) {
      const resetError = clearFeatureToggleOverrides();
      removeResetFeatureFlagsParamFromCurrentUrl();
      if (resetError) {
        setStorageError(resetError);
      }
    }

    const result = readFeatureToggleOverrides();
    setInitialOverrides(result.overrides);
    setOverrides(result.overrides);
    setStorageError(result.error);
  });

  const { loading, value: features = [], error } = useAsync(
    () => getBackendSrv().get<LabsFeature[]>('/api/admin/labs/features'),
    []
  );

  const pendingChanges = useMemo(() => countPendingChanges(initialOverrides, overrides), [initialOverrides, overrides]);

  const filteredFeatures = useMemo(
    () => filterLabsFeatures(features, query, stageFilter, isDevEnv),
    [features, query, stageFilter, isDevEnv]
  );

  const onToggle = (feature: LabsFeature, checked: boolean) => {
    const nextOverrides = { ...overrides, [feature.name]: checked };
    const writeError = writeFeatureToggleOverrides(nextOverrides);
    setOverrides(nextOverrides);
    setStorageError(writeError);
  };

  const onReset = () => {
    const resetError = clearFeatureToggleOverrides();
    setOverrides({});
    setStorageError(resetError);
  };

  return (
    <Page navId="labs">
      <Page.Contents>
        <Stack direction="column" gap={2}>
          <Text color="secondary">
            {t(
              'admin.labs.description',
              'Use Labs to explore and override feature flags in your browser. Changes are per-user and stored in local storage.'
            )}
          </Text>

          {storageError && (
            <Alert severity="warning" title={t('admin.labs.local-storage-error-title', 'Local storage issue')}>
              {storageError}
            </Alert>
          )}

          {pendingChanges > 0 && (
            <Alert severity="info" title={t('admin.labs.pending-title', 'Pending feature flag changes')}>
              {t(
                'admin.labs.pending-description',
                '{{count}} changes are saved in local storage. Reload the page to apply them.',
                { count: pendingChanges }
              )}
            </Alert>
          )}

          <div className={styles.controls}>
            <Stack alignItems="flex-end" justifyContent="space-between" wrap="wrap" gap={2}>
              <Stack direction="column" gap={1}>
                <Field label={t('admin.labs.search-label', 'Search')}>
                  <Input
                    width={48}
                    placeholder={t('admin.labs.search-placeholder', 'Filter by name or description')}
                    value={query}
                    onChange={(event) => setQuery(event.currentTarget.value)}
                  />
                </Field>
                <Field label={t('admin.labs.stage-filter-label', 'Stage')}>
                  <RadioButtonGroup
                    options={stageOptions}
                    value={stageFilter}
                    onChange={(value) => setStageFilter(value as StageFilter)}
                  />
                </Field>
              </Stack>
              <Button variant="secondary" onClick={onReset}>
                {t('admin.labs.reset', 'Reset to defaults')}
              </Button>
            </Stack>
          </div>

          {error && (
            <Alert severity="error" title={t('admin.labs.load-error-title', 'Failed to load feature flags')}>
              {t('admin.labs.load-error-description', 'Refresh the page and try again.')}
            </Alert>
          )}

          {loading && <Text>{t('admin.labs.loading', 'Loading feature flags...')}</Text>}

          {!loading && !error && (
            <div className={styles.list}>
              {filteredFeatures.map((feature) => {
                const stage = normalizeStage(feature.stage);
                const isReadonly = !feature.frontendOnly;
                const currentValue = overrides[feature.name] ?? feature.enabled;

                return (
                  <div key={feature.name} className={styles.row}>
                    <Stack direction="row" className={styles.rowHeader}>
                      <div>
                        <div className={styles.name}>{feature.name}</div>
                        <div className={styles.description}>{feature.description}</div>
                      </div>
                      <Stack direction="row" gap={1}>
                        <span
                          className={cx(styles.stageBadge, {
                            [styles.stageExperimental]: stage === 'experimental',
                            [styles.stagePreview]: stage === 'preview',
                            [styles.stageGA]: stage === 'ga',
                            [styles.stageDeprecated]: stage === 'deprecated',
                          })}
                        >
                          {feature.stage}
                        </span>
                        {feature.requiresRestart && (
                          <span className={styles.warningBadge}>{t('admin.labs.requires-restart', 'Requires restart')}</span>
                        )}
                        {feature.requiresDevMode && (
                          <span className={styles.warningBadge}>{t('admin.labs.dev-only', 'Dev mode')}</span>
                        )}
                      </Stack>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" className={styles.toggleSection} wrap="wrap" gap={1}>
                      <Text color="secondary">
                        {feature.owner
                          ? t('admin.labs.owner', 'Owner: {{owner}}', { owner: feature.owner })
                          : t('admin.labs.owner-unknown', 'Owner: Unspecified')}
                      </Text>
                      {isReadonly ? (
                        <Tooltip
                          placement="top"
                          content={t(
                            'admin.labs.readonly-tooltip',
                            'This flag requires server configuration and cannot be changed from the browser.'
                          )}
                        >
                          <div>
                            <Switch
                              id={`feature-toggle-${feature.name}`}
                              value={currentValue}
                              disabled={true}
                              label={t('admin.labs.enabled', 'Enabled')}
                            />
                          </div>
                        </Tooltip>
                      ) : (
                        <Switch
                          id={`feature-toggle-${feature.name}`}
                          value={currentValue}
                          label={t('admin.labs.enabled', 'Enabled')}
                          onChange={(event) => onToggle(feature, event.currentTarget.checked)}
                        />
                      )}
                    </Stack>
                  </div>
                );
              })}
            </div>
          )}
        </Stack>
      </Page.Contents>
    </Page>
  );
}
