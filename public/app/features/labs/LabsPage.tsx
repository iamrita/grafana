import { css } from '@emotion/css';
import { useEffect, useMemo, useState } from 'react';

import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { t } from '@grafana/i18n';
import { Alert, Badge, Button, Input, Select, Spinner, Stack, Switch, useStyles2 } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import config from 'app/core/config';
import { useNavModel } from 'app/core/hooks/useNavModel';
import { contextSrv } from 'app/core/services/context_srv';
import { AccessControlAction } from 'app/types/accessControl';

import { fetchFeatureMetadata, LabsFeature } from './api';
import {
  readFeatureToggleOverrides,
  ToggleOverrideMap,
  writeFeatureToggleOverrides,
} from './storage';

interface FeatureWithState extends LabsFeature {
  enabled: boolean;
  isOverride: boolean;
}

const ALL_STAGES = 'all';
const stageCollator = new Intl.Collator();

const getStyles = (theme: GrafanaTheme2) => ({
  controls: css({
    marginBottom: theme.spacing(2),
  }),
  searchInput: css({
    minWidth: '320px',
  }),
  stageSelect: css({
    minWidth: '220px',
  }),
  table: css({
    width: '100%',
    borderCollapse: 'collapse',
    '& th, & td': {
      borderBottom: `1px solid ${theme.colors.border.weak}`,
      padding: theme.spacing(1),
      textAlign: 'left',
      verticalAlign: 'top',
    },
  }),
  description: css({
    color: theme.colors.text.secondary,
    marginTop: theme.spacing(0.5),
  }),
  empty: css({
    marginTop: theme.spacing(2),
    color: theme.colors.text.secondary,
  }),
});

function titleCase(value: string): string {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export default function LabsPage() {
  const styles = useStyles2(getStyles);
  const navModel = useNavModel('labs');

  const initialOverrides = readFeatureToggleOverrides();

  const [features, setFeatures] = useState<LabsFeature[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>();
  const [query, setQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState(ALL_STAGES);
  const [reloadToken, setReloadToken] = useState(0);
  const [overrideState, setOverrideState] = useState<ToggleOverrideMap>(initialOverrides.overrides);
  const [invalidTokens, setInvalidTokens] = useState<string[]>(initialOverrides.invalidTokens);
  const [storageError, setStorageError] = useState<string | undefined>(initialOverrides.storageError);

  const canWrite =
    contextSrv.isGrafanaAdmin ||
    contextSrv.hasPermission(AccessControlAction.OrgsPreferencesWrite) ||
    contextSrv.hasPermission(AccessControlAction.SettingsWrite);

  const runtimeToggles = useMemo(() => {
    const toggles: Record<string, boolean> = {};
    for (const [name, value] of Object.entries(config.featureToggles)) {
      toggles[name] = Boolean(value);
    }
    return toggles;
  }, []);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setLoadError(undefined);

    fetchFeatureMetadata()
      .then((result) => {
        if (!isMounted) {
          return;
        }
        setFeatures(result);
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }
        setLoadError(error instanceof Error ? error.message : String(error));
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [reloadToken]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== 'grafana.featureToggles') {
        return;
      }
      const latest = readFeatureToggleOverrides();
      setOverrideState(latest.overrides);
      setInvalidTokens(latest.invalidTokens);
      setStorageError(latest.storageError);
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const featuresWithState = useMemo<FeatureWithState[]>(() => {
    return features.map((feature) => {
      const hasOverride = Object.prototype.hasOwnProperty.call(overrideState, feature.name);
      const enabled = hasOverride ? overrideState[feature.name] : Boolean(runtimeToggles[feature.name]);
      return {
        ...feature,
        enabled,
        isOverride: hasOverride,
      };
    });
  }, [features, overrideState, runtimeToggles]);

  const stageOptions = useMemo<Array<SelectableValue<string>>>(() => {
    const uniqueStages = new Set(features.map((feature) => feature.stage).filter(Boolean));
    return [
      { label: t('labs.stage-filter.all', 'All stages'), value: ALL_STAGES },
      ...Array.from(uniqueStages)
        .sort((a, b) => stageCollator.compare(a, b))
        .map((stage) => ({ label: titleCase(stage), value: stage })),
    ];
  }, [features]);

  const filteredFeatures = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return featuresWithState.filter((feature) => {
      if (selectedStage !== ALL_STAGES && feature.stage !== selectedStage) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return (
        feature.name.toLowerCase().includes(normalizedQuery) ||
        feature.description.toLowerCase().includes(normalizedQuery) ||
        feature.owner.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [featuresWithState, query, selectedStage]);

  const unknownOverrides = useMemo(() => {
    const knownNames = new Set(features.map((feature) => feature.name));
    return Object.keys(overrideState).filter((name) => !knownNames.has(name));
  }, [features, overrideState]);

  const onToggle = (featureName: string, nextEnabled: boolean) => {
    setOverrideState((previous) => {
      const nextOverrides = { ...previous };
      if (nextEnabled === Boolean(runtimeToggles[featureName])) {
        delete nextOverrides[featureName];
      } else {
        nextOverrides[featureName] = nextEnabled;
      }

      const saveError = writeFeatureToggleOverrides(nextOverrides);
      setStorageError(saveError);

      Reflect.set(config.featureToggles, featureName, nextEnabled);
      return nextOverrides;
    });
  };

  return (
    <Page navModel={navModel}>
      <Page.Contents>
        <h1>{t('labs.page.title', 'Labs')}</h1>
        <p>{t('labs.page.description', 'Browse and test feature toggles in your browser session.')}</p>

        {!canWrite && (
          <Alert severity="info" title={t('labs.page.read-only-title', 'Read-only mode')}>
            {t(
              'labs.page.read-only-description',
              'You can view feature flags, but you need additional permissions to change them.'
            )}
          </Alert>
        )}

        {storageError && (
          <Alert severity="error" title={t('labs.page.storage-error-title', 'Unable to update local storage')}>
            {storageError}
          </Alert>
        )}

        {invalidTokens.length > 0 && (
          <Alert severity="warning" title={t('labs.page.invalid-localstorage-title', 'Ignored invalid local overrides')}>
            {invalidTokens.join(', ')}
          </Alert>
        )}

        {unknownOverrides.length > 0 && (
          <Alert severity="warning" title={t('labs.page.unknown-overrides-title', 'Ignored unknown local overrides')}>
            {unknownOverrides.join(', ')}
          </Alert>
        )}

        <div className={styles.controls}>
          <Stack gap={1} alignItems="center">
            <Input
              className={styles.searchInput}
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder={t('labs.page.search-placeholder', 'Search by name, description, or owner')}
              aria-label={t('labs.page.search-label', 'Search feature flags')}
            />
            <Select
              className={styles.stageSelect}
              options={stageOptions}
              value={stageOptions.find((option) => option.value === selectedStage)}
              onChange={(value) => setSelectedStage(value.value ?? ALL_STAGES)}
              aria-label={t('labs.page.stage-filter-label', 'Filter by stage')}
            />
            <Button variant="secondary" onClick={() => setReloadToken((previous) => previous + 1)}>
              {t('labs.page.reload', 'Reload')}
            </Button>
          </Stack>
        </div>

        {isLoading ? (
          <Spinner />
        ) : loadError ? (
          <Alert severity="error" title={t('labs.page.fetch-error-title', 'Failed to load feature metadata')}>
            <div>{loadError}</div>
            <Button variant="secondary" onClick={() => setReloadToken((previous) => previous + 1)}>
              {t('labs.page.retry', 'Retry')}
            </Button>
          </Alert>
        ) : filteredFeatures.length === 0 ? (
          <div className={styles.empty}>{t('labs.page.no-results', 'No feature flags match the current filters.')}</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t('labs.page.column.feature', 'Feature')}</th>
                <th>{t('labs.page.column.stage', 'Stage')}</th>
                <th>{t('labs.page.column.owner', 'Owner')}</th>
                <th>{t('labs.page.column.source', 'Source')}</th>
                <th>{t('labs.page.column.enabled', 'Enabled')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredFeatures.map((feature) => (
                <tr key={feature.name}>
                  <td>
                    <strong>{feature.name}</strong>
                    <div className={styles.description}>{feature.description || '—'}</div>
                  </td>
                  <td>
                    <Badge text={titleCase(feature.stage)} color="blue" />
                    {feature.requiresRestart && (
                      <Badge
                        text={t('labs.page.requires-restart', 'Requires restart')}
                        color="orange"
                        tooltip={t(
                          'labs.page.requires-restart-tooltip',
                          'This toggle requires a restart before the change takes effect.'
                        )}
                      />
                    )}
                  </td>
                  <td>{feature.owner || '—'}</td>
                  <td>{feature.isOverride ? t('labs.page.source.override', 'Override') : t('labs.page.source.default', 'Default')}</td>
                  <td>
                    <Switch
                      value={feature.enabled}
                      disabled={!canWrite || feature.requiresRestart}
                      onChange={() => onToggle(feature.name, !feature.enabled)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Page.Contents>
    </Page>
  );
}
