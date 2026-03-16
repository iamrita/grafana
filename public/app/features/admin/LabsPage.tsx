import { css } from '@emotion/css';
import { useMemo, useState } from 'react';
import { useAsync } from 'react-use';

import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { getBackendSrv } from '@grafana/runtime';
import {
  Alert,
  Badge,
  FilterInput,
  Icon,
  LoadingPlaceholder,
  RadioButtonGroup,
  Stack,
  Text,
  useStyles2,
} from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

import { FeatureToggleInfo, FeatureTogglesResponse, StageFilter } from './types';

export default function LabsPage() {
  const styles = useStyles2(getStyles);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<StageFilter>('all');
  const stageFilterOptions = getStageFilterOptions();
  const { loading, error, value } = useAsync(
    () => getBackendSrv().get<FeatureTogglesResponse>('/api/admin/feature-toggles'),
    []
  );

  const filteredFeatures = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const features = value?.features ?? [];

    return features.filter((feature) => {
      const matchesSearch =
        normalizedQuery.length === 0 ||
        feature.name.toLowerCase().includes(normalizedQuery) ||
        feature.description.toLowerCase().includes(normalizedQuery);

      return matchesSearch && matchesStageFilter(feature.stage, stageFilter);
    });
  }, [searchQuery, stageFilter, value?.features]);

  return (
    <Page navId="labs">
      <Page.Contents>
        <Stack direction="column" gap={2}>
          <Alert severity="info" title={t('admin.labs.info-title', 'Feature flags are read-only in this view')}>
            <Trans i18nKey="admin.labs.info-body">
              To enable or disable feature flags, use Grafana configuration, environment variables, URL parameters in
              development mode, or browser localStorage overrides.
            </Trans>
          </Alert>

          <Stack className={styles.toolbar} gap={2}>
            <FilterInput
              value={searchQuery}
              onChange={setSearchQuery}
              escapeRegex={false}
              width={36}
              placeholder={t('admin.labs.search-placeholder', 'Search by feature name or description')}
            />
            <RadioButtonGroup options={stageFilterOptions} value={stageFilter} onChange={setStageFilter} />
          </Stack>

          {loading && <LoadingPlaceholder text={t('admin.labs.loading', 'Loading feature flags...')} />}

          {error && (
            <Alert severity="error" title={t('admin.labs.error-title', 'Failed to load feature flags')}>
              {error instanceof Error
                ? error.message
                : t('admin.labs.error-body', 'Unexpected error while loading feature flags.')}
            </Alert>
          )}

          {!loading && !error && filteredFeatures.length === 0 && (
            <Text color="secondary">
              <Trans i18nKey="admin.labs.empty-state">No feature flags match your current filters.</Trans>
            </Text>
          )}

          {!loading && !error && filteredFeatures.length > 0 && (
            <div className={styles.rows}>
              {filteredFeatures.map((feature) => (
                <FeatureRow key={feature.name} feature={feature} />
              ))}
            </div>
          )}
        </Stack>
      </Page.Contents>
    </Page>
  );
}

function FeatureRow({ feature }: { feature: FeatureToggleInfo }) {
  const styles = useStyles2(getStyles);
  const stage = getStageBadgeDisplay(feature.stage);

  return (
    <div className={styles.row}>
      <div className={styles.rowMain}>
        <Stack direction="column" gap={0.5}>
          <Stack alignItems="center" gap={1}>
            <Text element="h3" weight="bold">
              {feature.name}
            </Text>
            <Badge text={stage.text} color={stage.color} icon={stage.icon} />
            {feature.requiresRestart && <Badge text={t('admin.labs.requires-restart', 'Requires restart')} color="orange" />}
            {feature.frontendOnly && <Badge text={t('admin.labs.frontend-only', 'Frontend only')} color="blue" />}
          </Stack>
          <Text color="secondary">{feature.description}</Text>
          {feature.owner && (
            <Text color="secondary" variant="bodySmall">
              {t('admin.labs.owner-prefix', 'Owner:')} {feature.owner}
            </Text>
          )}
        </Stack>
      </div>
      <Stack alignItems="center" gap={1}>
        <Icon
          className={feature.enabled ? styles.enabledIcon : styles.disabledIcon}
          name={feature.enabled ? 'check-circle' : 'times-circle'}
        />
        <Text color={feature.enabled ? 'success' : 'secondary'}>
          {feature.enabled ? t('admin.labs.status-enabled', 'Enabled') : t('admin.labs.status-disabled', 'Disabled')}
        </Text>
      </Stack>
    </div>
  );
}

function matchesStageFilter(stage: FeatureToggleInfo['stage'], filter: StageFilter): boolean {
  if (filter === 'all') {
    return true;
  }

  if (filter === 'preview') {
    return stage === 'preview' || stage === 'privatePreview';
  }

  return stage === filter;
}

function getStageBadgeDisplay(stage: FeatureToggleInfo['stage']) {
  switch (stage) {
    case 'experimental':
      return {
        text: t('admin.labs.stage.experimental', 'Experimental'),
        color: 'orange' as const,
        icon: 'exclamation-triangle' as const,
      };
    case 'privatePreview':
      return { text: t('admin.labs.stage.private-preview', 'Private preview'), color: 'blue' as const, icon: 'rocket' as const };
    case 'preview':
      return { text: t('admin.labs.stage.preview', 'Preview'), color: 'blue' as const, icon: 'rocket' as const };
    case 'GA':
      return { text: t('admin.labs.stage.ga', 'GA'), color: 'green' as const, icon: 'check' as const };
    case 'deprecated':
      return { text: t('admin.labs.stage.deprecated', 'Deprecated'), color: 'red' as const, icon: 'exclamation-circle' as const };
    default:
      return { text: t('admin.labs.stage.unknown', 'Unknown'), color: 'darkgrey' as const, icon: 'question-circle' as const };
  }
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    toolbar: css({
      alignItems: 'center',
      flexWrap: 'wrap',
    }),
    rows: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1),
    }),
    row: css({
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: theme.spacing(2),
      padding: theme.spacing(2),
      borderRadius: theme.shape.radius.default,
      border: `1px solid ${theme.colors.border.weak}`,
      background: theme.colors.background.secondary,
    }),
    rowMain: css({
      minWidth: 0,
      flex: 1,
    }),
    enabledIcon: css({
      color: theme.colors.success.main,
    }),
    disabledIcon: css({
      color: theme.colors.text.secondary,
    }),
  };
};

function getStageFilterOptions(): Array<SelectableValue<StageFilter>> {
  return [
    { label: t('admin.labs.stage-filter.all', 'All'), value: 'all' },
    { label: t('admin.labs.stage-filter.experimental', 'Experimental'), value: 'experimental' },
    { label: t('admin.labs.stage-filter.preview', 'Preview'), value: 'preview' },
    { label: t('admin.labs.stage-filter.ga', 'GA'), value: 'GA' },
    { label: t('admin.labs.stage-filter.deprecated', 'Deprecated'), value: 'deprecated' },
  ];
}
