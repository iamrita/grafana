import { useCallback, useMemo, useReducer, useState } from 'react';
import { useAsync } from 'react-use';

import { Trans, t } from '@grafana/i18n';
import { getBackendSrv } from '@grafana/runtime';
import { Alert, Button, InteractiveTable, Switch, type CellProps, type Column } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

const LEGACY_FEATURE_TOGGLES_LS_KEY = 'grafana.featureToggles';

export interface LabsFeatureFlagDTO {
  name: string;
  description: string;
  stage: string;
  frontendOnly: boolean;
  requiresRestart: boolean;
  requiresDevMode: boolean;
  hideFromDocs: boolean;
  enabled: boolean;
  serverConfigured: boolean;
  browserOverrideAllowed: boolean;
}

interface LabsFeatureFlagsResponse {
  flags: LabsFeatureFlagDTO[];
}

function parseLocalStorageOverrides(): Record<string, boolean> {
  const raw = window.localStorage.getItem(LEGACY_FEATURE_TOGGLES_LS_KEY);
  if (!raw) {
    return {};
  }
  const out: Record<string, boolean> = {};
  for (const part of raw.split(',')) {
    const [k, v] = part.split('=');
    if (!k) {
      continue;
    }
    out[k.trim()] = v === 'true' || v === '1';
  }
  return out;
}

function writeLocalStorageOverrides(overrides: Record<string, boolean>) {
  const entries = Object.entries(overrides);
  if (entries.length === 0) {
    window.localStorage.removeItem(LEGACY_FEATURE_TOGGLES_LS_KEY);
    return;
  }
  window.localStorage.setItem(
    LEGACY_FEATURE_TOGGLES_LS_KEY,
    entries.map(([k, v]) => `${k}=${v ? 'true' : 'false'}`).join(',')
  );
}

function setBrowserOverride(flagName: string, value: boolean) {
  const next = parseLocalStorageOverrides();
  next[flagName] = value;
  writeLocalStorageOverrides(next);
}

function clearBrowserOverridesForFlags(flagNames: string[]) {
  const next = parseLocalStorageOverrides();
  for (const n of flagNames) {
    delete next[n];
  }
  writeLocalStorageOverrides(next);
}

function effectiveEnabled(serverEnabled: boolean, flagName: string): boolean {
  const o = parseLocalStorageOverrides();
  if (Object.prototype.hasOwnProperty.call(o, flagName)) {
    return o[flagName]!;
  }
  return serverEnabled;
}

export default function LabsFeatureFlagsPage() {
  const [reloadHint, setReloadHint] = useState(false);
  const [, bumpLocalState] = useReducer((n: number) => n + 1, 0);

  const { value, loading, error } = useAsync(async () => {
    return getBackendSrv().get<LabsFeatureFlagsResponse>('/api/labs/feature-flags');
  }, []);

  const flagNames = useMemo(() => (value?.flags ?? []).map((f) => f.name), [value?.flags]);

  const onToggle = useCallback((flagName: string, checked: boolean) => {
    setBrowserOverride(flagName, checked);
    bumpLocalState();
    setReloadHint(true);
  }, []);

  const onResetBrowserOverrides = useCallback(() => {
    clearBrowserOverridesForFlags(flagNames);
    bumpLocalState();
    setReloadHint(true);
  }, [flagNames]);

  const columns = useMemo<Array<Column<LabsFeatureFlagDTO>>>(
    () => [
      {
        id: 'name',
        header: t('labs.feature-flags.column-name', 'Flag'),
        cell: ({ row }: CellProps<LabsFeatureFlagDTO, void>) => row.original.name,
      },
      {
        id: 'description',
        header: t('labs.feature-flags.column-description', 'Description'),
        cell: ({ row }: CellProps<LabsFeatureFlagDTO, void>) => row.original.description,
      },
      {
        id: 'stage',
        header: t('labs.feature-flags.column-stage', 'Stage'),
        cell: ({ row }: CellProps<LabsFeatureFlagDTO, void>) => row.original.stage,
      },
      {
        id: 'server',
        header: t('labs.feature-flags.column-server', 'Server default'),
        cell: ({ row }: CellProps<LabsFeatureFlagDTO, void>) =>
          row.original.enabled ? t('labs.feature-flags.on', 'On') : t('labs.feature-flags.off', 'Off'),
      },
      {
        id: 'effective',
        header: t('labs.feature-flags.column-effective', 'Effective (this browser)'),
        cell: ({ row }: CellProps<LabsFeatureFlagDTO, void>) =>
          effectiveEnabled(row.original.enabled, row.original.name)
            ? t('labs.feature-flags.on', 'On')
            : t('labs.feature-flags.off', 'Off'),
      },
      {
        id: 'toggle',
        header: t('labs.feature-flags.column-override', 'Browser override'),
        cell: ({ row }: CellProps<LabsFeatureFlagDTO, void>) => {
          if (!row.original.browserOverrideAllowed) {
            return (
              <Trans i18nKey="labs.feature-flags.read-only-toggle">
                Read-only — change in Grafana config and restart the server.
              </Trans>
            );
          }
          return (
            <Switch
              value={effectiveEnabled(row.original.enabled, row.original.name)}
              onChange={(e) => onToggle(row.original.name, e.currentTarget.checked)}
              aria-label={t('labs.feature-flags.override-aria', 'Browser override for {{name}}', {
                name: row.original.name,
              })}
            />
          );
        },
      },
    ],
    [onToggle]
  );

  return (
    <Page navId="labs-feature-flags">
      <Page.Contents>
        <Alert title="" severity="warning">
          <Trans i18nKey="labs.feature-flags.warning-unstable">
            Labs features may be unstable or incomplete. Browser overrides apply only to your session in this browser and
            can differ from server configuration.
          </Trans>
        </Alert>

        <Alert title="" severity="info">
          <Trans i18nKey="labs.feature-flags.info-server">
            Flags that require a server restart or are not marked as safe for browser override must be changed in
            grafana.ini or environment variables, then Grafana must be restarted.
          </Trans>
        </Alert>

        {reloadHint && (
          <Alert title={t('labs.feature-flags.reload-title', 'Reload required')} severity="info">
            <Trans i18nKey="labs.feature-flags.reload-body">
              Reload the page for override changes to apply everywhere in the UI.
            </Trans>
            <div style={{ marginTop: 8 }}>
              <Button
                variant="secondary"
                onClick={() => {
                  window.location.reload();
                }}
              >
                {t('labs.feature-flags.reload-button', 'Reload now')}
              </Button>
              <Button fill="text" onClick={() => setReloadHint(false)} style={{ marginLeft: 8 }}>
                {t('labs.feature-flags.dismiss-reload', 'Dismiss')}
              </Button>
            </div>
          </Alert>
        )}

        <div style={{ marginBottom: 16 }}>
          <Button variant="secondary" onClick={onResetBrowserOverrides} disabled={!flagNames.length}>
            <Trans i18nKey="labs.feature-flags.reset-overrides">Reset Labs browser overrides</Trans>
          </Button>
        </div>

        {loading && <Trans i18nKey="labs.feature-flags.loading">Loading…</Trans>}
        {error && (
          <Alert title={t('labs.feature-flags.error-title', 'Could not load feature flags')} severity="error">
            {String(error)}
          </Alert>
        )}
        {value && value.flags.length > 0 && (
          <InteractiveTable columns={columns} data={value.flags} getRowId={(row) => row.name} />
        )}
        {value && !value.flags.length && (
          <Trans i18nKey="labs.feature-flags.empty">No curated flags are available.</Trans>
        )}
      </Page.Contents>
    </Page>
  );
}
