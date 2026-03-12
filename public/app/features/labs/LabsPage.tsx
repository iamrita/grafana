import { Alert, LoadingPlaceholder, Stack } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

import { FeatureFlagFilters } from './components/FeatureFlagFilters';
import { FeatureFlagList } from './components/FeatureFlagList';
import { useFeatureFlags } from './hooks/useFeatureFlags';

function LabsPage() {
  const {
    flags,
    filterStage,
    setFilterStage,
    searchQuery,
    setSearchQuery,
    toggleFeature,
    resetFeature,
    stats,
    loading,
    error,
  } = useFeatureFlags();

  return (
    <Page navId="labs">
      <Page.Contents>
        <Stack direction="column" gap={3}>
          <Alert severity="info" title="Experimental Features">
            Toggle feature flags to enable or disable experimental features. Changes are saved to your
            browser&apos;s localStorage and will persist across page refreshes. Some features may require a
            page reload to take effect.
          </Alert>

          {loading && <LoadingPlaceholder text="Loading feature flags..." />}

          {error && (
            <Alert severity="error" title="Error loading feature flags">
              {error}
            </Alert>
          )}

          {!loading && !error && (
            <>
              <FeatureFlagFilters
                filterStage={filterStage}
                onFilterStageChange={setFilterStage}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                stats={stats}
              />

              <FeatureFlagList flags={flags} onToggle={toggleFeature} onReset={resetFeature} />
            </>
          )}
        </Stack>
      </Page.Contents>
    </Page>
  );
}

export default LabsPage;
