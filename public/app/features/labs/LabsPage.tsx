import { css } from '@emotion/css';
import { useState } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { Alert, Button, Input, Spinner, Stack, Text, useStyles2 } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

import { FeatureFlagList } from './FeatureFlagList';
import { useFeatureFlags } from './useFeatureFlags';

export default function LabsPage() {
  const styles = useStyles2(getStyles);
  const [search, setSearch] = useState('');
  const {
    flags,
    loading,
    error,
    overrides,
    isDevelopment,
    showSafeModeMessage,
    setShowSafeModeMessage,
    setOverride,
    clearOverrides,
  } = useFeatureFlags();

  return (
    <Page navId="labs">
      <Page.Contents>
        <Stack direction="column" gap={2}>
          <Text variant="h2">{t('labs.title', 'Labs')}</Text>
          <Text color="secondary">
            <Trans i18nKey="labs.description">
              Experiment with feature flags. Changes are stored in your browser local storage and apply without a page
              reload.
            </Trans>
          </Text>

          {showSafeModeMessage && (
            <Alert
              severity="success"
              title={t('labs.safe-mode.title', 'Safe mode reset complete')}
              onRemove={() => setShowSafeModeMessage(false)}
            >
              <Trans i18nKey="labs.safe-mode.body">All feature flag overrides were cleared.</Trans>
            </Alert>
          )}

          <Alert severity="warning" title={t('labs.warning.title', 'Use with caution')}>
            <Trans i18nKey="labs.warning.body">
              Some feature flags only affect the frontend. Flags marked as requiring restart or backend changes may not
              fully apply from this page.
            </Trans>
          </Alert>

          <div className={styles.controls}>
            <Input
              width={40}
              prefix={t('labs.search.prefix', 'Search')}
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
              placeholder={t('labs.search.placeholder', 'Filter by name, description, or owner')}
            />
            <Button variant="secondary" onClick={clearOverrides}>
              <Trans i18nKey="labs.reset-all">Reset all overrides</Trans>
            </Button>
          </div>

          {loading && <Spinner size={24} />}

          {error && (
            <Alert severity="error" title={t('labs.error.title', 'Failed to load feature flags')}>
              {error.message}
            </Alert>
          )}

          {!loading && !error && (
            <FeatureFlagList
              flags={flags}
              overrides={overrides}
              isDevelopment={isDevelopment}
              search={search}
              setOverride={setOverride}
            />
          )}
        </Stack>
      </Page.Contents>
    </Page>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  controls: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(2),
    flexWrap: 'wrap',
  }),
});
