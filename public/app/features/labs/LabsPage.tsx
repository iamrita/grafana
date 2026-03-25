import { css } from '@emotion/css';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { GrafanaTheme2, PageLayoutType, SelectableValue } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { t, Trans } from '@grafana/i18n';
import { getBackendSrv } from '@grafana/runtime';
import {
  Alert,
  EmptyState,
  FilterInput,
  InlineSwitch,
  LoadingPlaceholder,
  RadioButtonGroup,
  Stack,
  useStyles2,
} from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import config from 'app/core/config';

import {
  readFeatureTogglesFromLocalStorage,
  setFeatureToggleInLocalStorage,
} from './utils/featureTogglesLocalStorage';

export interface LabsFeatureFlagDTO {
  name: string;
  description: string;
  stage: string;
  owner?: string;
  enabled: boolean;
  frontendOnly: boolean;
  requiresRestart: boolean;
  warning?: string;
}

type StageFilter = 'all' | 'experimental' | 'preview' | 'ga' | 'deprecated';

const API_URL = '/api/featuremgmt/flags';

function normalizeStage(stage: string): string {
  return stage.trim().toLowerCase();
}

function matchesStageFilter(stage: string, filter: StageFilter): boolean {
  const s = normalizeStage(stage);
  switch (filter) {
    case 'all':
      return true;
    case 'experimental':
      return s === 'experimental';
    case 'preview':
      return s === 'preview' || s === 'privatepreview';
    case 'ga':
      return s === 'ga' || s === 'general availability';
    case 'deprecated':
      return s === 'deprecated';
    default:
      return true;
  }
}

function getEffectiveEnabled(flag: LabsFeatureFlagDTO, overrides: Record<string, boolean>): boolean {
  if (flag.name in overrides) {
    return overrides[flag.name]!;
  }
  return flag.enabled;
}

function applyRuntimeToggle(name: string, enabled: boolean): void {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  (config.featureToggles as Record<string, boolean>)[name] = enabled;
  if (config.bootData?.settings?.featureToggles) {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    (config.bootData.settings.featureToggles as Record<string, boolean>)[name] = enabled;
  }
}

const getStyles = (theme: GrafanaTheme2) => ({
  toolbar: css({
    paddingBottom: theme.spacing(2),
    marginBottom: theme.spacing(2),
    borderBottom: `1px solid ${theme.colors.border.weak}`,
  }),
  row: css({
    padding: theme.spacing(1.5, 0),
    borderBottom: `1px solid ${theme.colors.border.weak}`,
    ':last-of-type': {
      borderBottom: 'none',
    },
  }),
  meta: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
    marginTop: theme.spacing(0.5),
  }),
  badgeRow: css({
    marginTop: theme.spacing(0.5),
    gap: theme.spacing(1),
  }),
});

export default function LabsPage() {
  const styles = useStyles2(getStyles);
  const [flags, setFlags] = useState<LabsFeatureFlagDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<StageFilter>('all');
  const [localOverrides, setLocalOverrides] = useState<Record<string, boolean>>(() =>
    readFeatureTogglesFromLocalStorage()
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await getBackendSrv().get<{ flags: LabsFeatureFlagDTO[] }>(API_URL);
        if (!cancelled) {
          setFlags(res.flags ?? []);
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : t('labs.load-error', 'Failed to load feature flags'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const stageOptions: Array<SelectableValue<StageFilter>> = useMemo(
    () => [
      { value: 'all', label: t('labs.stage.all', 'All') },
      { value: 'experimental', label: t('labs.stage.experimental', 'Experimental') },
      { value: 'preview', label: t('labs.stage.preview', 'Preview') },
      { value: 'ga', label: t('labs.stage.ga', 'GA') },
      { value: 'deprecated', label: t('labs.stage.deprecated', 'Deprecated') },
    ],
    []
  );

  const filteredFlags = useMemo(() => {
    const q = search.trim().toLowerCase();
    return flags.filter((f) => {
      if (!matchesStageFilter(f.stage, stageFilter)) {
        return false;
      }
      if (!q) {
        return true;
      }
      return (
        f.name.toLowerCase().includes(q) || (f.description && f.description.toLowerCase().includes(q))
      );
    });
  }, [flags, search, stageFilter]);

  const onToggle = useCallback((flag: LabsFeatureFlagDTO, checked: boolean) => {
    setFeatureToggleInLocalStorage(flag.name, checked);
    applyRuntimeToggle(flag.name, checked);
    setLocalOverrides(readFeatureTogglesFromLocalStorage());
  }, []);

  return (
    <Page navId="labs" layout={PageLayoutType.Standard}>
      <Page.Contents>
        <Stack data-testid={selectors.pages.Labs.container} direction="column" gap={2}>
          <Alert
            severity="info"
            title={t('labs.browser-only.title', 'Browser-only overrides')}
          >
            <Trans i18nKey="labs.browser-only.body">
              Toggles here update <code>localStorage</code> and the current session. They do not change server
              configuration. Some flags need a full page reload or server restart to take effect.
            </Trans>
          </Alert>

          <div className={styles.toolbar}>
            <Stack direction="row" gap={2} wrap="wrap" alignItems="center">
              <FilterInput
                placeholder={t('labs.search.placeholder', 'Search by name or description')}
                width={40}
                value={search}
                onChange={(v) => setSearch(v)}
                data-testid={selectors.pages.Labs.search}
              />
              <RadioButtonGroup options={stageOptions} value={stageFilter} onChange={setStageFilter} />
            </Stack>
          </div>

          {loading && <LoadingPlaceholder text={t('labs.loading', 'Loading feature flags…')} />}
          {loadError && !loading && (
            <Alert severity="error" title={t('labs.error.title', 'Could not load Labs')}>
              {loadError}
            </Alert>
          )}
          {!loading && !loadError && filteredFlags.length === 0 && (
            <EmptyState variant="not-found" message={t('labs.empty', 'No feature flags match your filters')} />
          )}
          {!loading &&
            !loadError &&
            filteredFlags.map((flag) => {
              const effective = getEffectiveEnabled(flag, localOverrides);
              const switchLabel = t('labs.toggle-label', 'Enable {{name}}', { name: flag.name });
              return (
                <div
                  key={flag.name}
                  className={styles.row}
                  data-testid={selectors.pages.Labs.flagRow(flag.name)}
                >
                  <Stack justifyContent="space-between" alignItems="flex-start">
                    <div>
                      <Stack direction="row" gap={1} alignItems="baseline" wrap="wrap">
                        <strong>{flag.name}</strong>
                        <span className={styles.meta}>{flag.stage}</span>
                      </Stack>
                      {flag.description && <div className={styles.meta}>{flag.description}</div>}
                      {flag.owner && (
                        <div className={styles.meta}>
                          {t('labs.owner', 'Owner: {{owner}}', { owner: flag.owner })}
                        </div>
                      )}
                      <Stack direction="row" className={styles.badgeRow} wrap="wrap">
                        {flag.frontendOnly && (
                          <span className={styles.meta}>{t('labs.badge.frontend', 'Frontend')}</span>
                        )}
                        {flag.requiresRestart && (
                          <span className={styles.meta}>{t('labs.badge.restart', 'Requires restart')}</span>
                        )}
                        {flag.name in localOverrides && (
                          <span className={styles.meta}>{t('labs.badge.overridden', 'Overridden in browser')}</span>
                        )}
                      </Stack>
                      {flag.warning && (
                        <Alert
                          severity="warning"
                          title={t('labs.warning.title', 'Limited effect')}
                          className={css({ marginTop: 8 })}
                        >
                          {flag.warning}
                        </Alert>
                      )}
                    </div>
                    <InlineSwitch
                      showLabel
                      aria-label={switchLabel}
                      label={t('labs.enabled', 'Enabled')}
                      value={effective}
                      onChange={(e) => onToggle(flag, e.currentTarget.checked)}
                    />
                  </Stack>
                </div>
              );
            })}
        </Stack>
      </Page.Contents>
    </Page>
  );
}
