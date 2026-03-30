import { css } from '@emotion/css';
import { useId, useMemo, useState } from 'react';

import { FeatureToggleDefinition, FeatureToggles, GrafanaTheme2 } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { config, GRAFANA_FEATURE_TOGGLES_STORAGE_KEY } from '@grafana/runtime';
import { Alert, Badge, Field, InlineSwitch, Input, RadioButtonGroup, Stack, Text, useStyles2 } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import { updateConfig } from 'app/core/config';

import { writeFeatureToggleLocalStorageMap } from './utils/featureToggleLocalStorage';

type StageFilter = 'all' | string;

const EMPTY_REGISTRY: FeatureToggleDefinition[] = [];

function getToggleValue(toggles: FeatureToggles, name: string): boolean {
  return Reflect.get(toggles, name) === true;
}

function matchesStageFilter(stage: string, filter: StageFilter): boolean {
  if (filter === 'all') {
    return true;
  }
  if (filter === 'preview-group') {
    return stage === 'preview' || stage === 'privatePreview';
  }
  return stage === filter;
}

export default function LabsPage() {
  const styles = useStyles2(getStyles);
  const idPrefix = useId();
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<StageFilter>('all');

  const registry = useMemo(
    () => config.featureToggleRegistry ?? EMPTY_REGISTRY,
    // Boot config is fixed for the session; reading once avoids unstable deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [toggleSnapshot, setToggleSnapshot] = useState(() => ({ ...config.featureToggles }));

  const stageFilterOptions = useMemo(
    () => [
      { label: t('labs.filter.all', 'All'), value: 'all' },
      { label: t('labs.filter.experimental', 'Experimental'), value: 'experimental' },
      { label: t('labs.filter.preview', 'Preview'), value: 'preview-group' },
      { label: t('labs.filter.ga', 'GA'), value: 'GA' },
      { label: t('labs.filter.deprecated', 'Deprecated'), value: 'deprecated' },
    ],
    []
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return registry.filter((def) => {
      if (!matchesStageFilter(def.stage, stageFilter)) {
        return false;
      }
      if (!q) {
        return true;
      }
      return (
        def.name.toLowerCase().includes(q) ||
        (def.description && def.description.toLowerCase().includes(q)) ||
        (def.owner && def.owner.toLowerCase().includes(q))
      );
    });
  }, [registry, search, stageFilter]);

  const onToggle = (def: FeatureToggleDefinition, enabled: boolean) => {
    if (!def.boolean) {
      return;
    }
    const toggles: FeatureToggles = { ...config.featureToggles, [def.name]: enabled };
    updateConfig({ featureToggles: toggles });

    writeFeatureToggleLocalStorageMap({ [def.name]: enabled }, GRAFANA_FEATURE_TOGGLES_STORAGE_KEY);

    config.bootData.settings.featureToggles = toggles;
    setToggleSnapshot({ ...toggles });
  };

  return (
    <Page navId="labs">
      <Page.Contents>
        <Stack direction="column" gap={2}>
          <Alert severity="info" title="">
            <Trans i18nKey="labs.info">
              Flag changes are stored in this browser (localStorage) and apply without a full page reload for
              frontend-available flags. Server-side behavior may still require a Grafana restart when noted.
            </Trans>
          </Alert>

          <Stack direction="row" wrap="wrap" gap={2} alignItems="flex-end">
            <Field noMargin label={t('labs.search', 'Search')}>
              <Input
                width={40}
                placeholder={t('labs.search-placeholder', 'Filter by name or description')}
                value={search}
                onChange={(e) => setSearch(e.currentTarget.value)}
                type="search"
              />
            </Field>
            <Field noMargin label={t('labs.stage', 'Stage')}>
              <RadioButtonGroup
                options={stageFilterOptions}
                value={stageFilter}
                onChange={setStageFilter}
                aria-label={t('labs.stage-filter', 'Filter flags by stage')}
              />
            </Field>
          </Stack>

          <div className={styles.list} role="list">
            {filtered.map((def) => {
              const checked = getToggleValue(toggleSnapshot, def.name);
              const disableToggle = !def.boolean;
              const switchId = `${idPrefix}-${def.name}`;

              return (
                <div key={def.name} className={styles.row} role="listitem">
                  <div className={styles.rowMain}>
                    <Text element="h3" variant="h5">
                      {def.name}
                    </Text>
                    <Badge
                      text={def.stage}
                      color={
                        def.stage === 'deprecated'
                          ? 'red'
                          : def.stage === 'experimental'
                            ? 'blue'
                            : def.stage === 'GA'
                              ? 'green'
                              : 'orange'
                      }
                    />
                    {def.requiresRestart && (
                      <Badge text={t('labs.requires-restart', 'Restart')} color="purple" />
                    )}
                    {def.requiresDevMode && <Badge text={t('labs.dev-only', 'Dev only')} color="orange" />}
                  </div>
                  {def.description && (
                    <Text color="secondary" variant="bodySmall">
                      {def.description}
                    </Text>
                  )}
                  {def.owner && (
                    <Text color="secondary" variant="bodySmall">
                      {t('labs.owner', 'Owner')}: {def.owner}
                    </Text>
                  )}
                  <div className={styles.switchRow}>
                    <InlineSwitch
                      id={switchId}
                      disabled={disableToggle}
                      label={def.boolean ? (checked ? t('labs.enabled', 'On') : t('labs.disabled', 'Off')) : ''}
                      showLabel={true}
                      value={checked}
                      transparent={false}
                      onChange={(ev) => onToggle(def, ev.currentTarget.checked)}
                      aria-label={t('labs.toggle-flag', 'Toggle {{name}}', { name: def.name })}
                    />
                    {disableToggle && (
                      <Text variant="bodySmall" color="secondary">
                        <Trans i18nKey="labs.non-boolean">Non-boolean flag (not toggleable here)</Trans>
                      </Text>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <Text variant="bodyMedium">
              <Trans i18nKey="labs.empty">No flags match your filters.</Trans>
            </Text>
          )}
        </Stack>
      </Page.Contents>
    </Page>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    list: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(2),
    }),
    row: css({
      border: `1px solid ${theme.colors.border.weak}`,
      borderRadius: theme.shape.borderRadius(),
      padding: theme.spacing(2),
      background: theme.colors.background.primary,
    }),
    rowMain: css({
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: theme.spacing(1),
    }),
    switchRow: css({
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: theme.spacing(2),
      marginTop: theme.spacing(1),
    }),
  };
}
