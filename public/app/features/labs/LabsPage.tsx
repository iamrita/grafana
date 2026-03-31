import { css } from '@emotion/css';
import { useEffect, useMemo, useState } from 'react';

import { SelectableValue } from '@grafana/data';
import { t } from '@grafana/i18n';
import {
  Alert,
  Badge,
  Button,
  Column,
  EmptyState,
  FilterInput,
  InlineField,
  InteractiveTable,
  Select,
  Stack,
  useStyles2,
} from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

import { getLabsFeatureFlags } from './api';
import { LabsFeatureFlag } from './types';

type LabsFlagCell = {
  row: {
    original: LabsFeatureFlag;
  };
};

const ALL_STAGES = '__all_stages__';
const stageCollator = new Intl.Collator(undefined, { sensitivity: 'base' });
const nameCollator = new Intl.Collator(undefined, { sensitivity: 'base' });

const getStageBadgeColor = (stage: string) => {
  const normalizedStage = stage.toLowerCase();

  if (normalizedStage.includes('ga') || normalizedStage.includes('general availability')) {
    return 'green';
  }

  if (normalizedStage.includes('beta') || normalizedStage.includes('public preview')) {
    return 'blue';
  }

  if (
    normalizedStage.includes('alpha') ||
    normalizedStage.includes('experimental') ||
    normalizedStage.includes('private preview')
  ) {
    return 'orange';
  }

  return 'darkgrey';
};

const getStatusBadge = (enabled: boolean) => {
  if (enabled) {
    return <Badge text={t('labs.page.status.enabled', 'Enabled')} color="green" />;
  }

  return <Badge text={t('labs.page.status.disabled', 'Disabled')} color="red" />;
};

const getColumns = (): Array<Column<LabsFeatureFlag>> => [
  {
    id: 'name',
    header: t('labs.page.column.name', 'Feature'),
    cell: ({ row: { original } }: LabsFlagCell) => original.name,
  },
  {
    id: 'description',
    header: t('labs.page.column.description', 'Description'),
    cell: ({ row: { original } }: LabsFlagCell) => original.description,
  },
  {
    id: 'stage',
    header: t('labs.page.column.stage', 'Stage'),
    cell: ({ row: { original } }: LabsFlagCell) => (
      <Badge text={original.stage} color={getStageBadgeColor(original.stage)} />
    ),
  },
  {
    id: 'owner',
    header: t('labs.page.column.owner', 'Owner'),
    cell: ({ row: { original } }: LabsFlagCell) => original.owner,
  },
  {
    id: 'enabled',
    header: t('labs.page.column.status', 'Current state'),
    cell: ({ row: { original } }: LabsFlagCell) => getStatusBadge(original.enabled),
  },
];

export default function LabsPage() {
  const styles = useStyles2(getStyles);
  const [query, setQuery] = useState('');
  const [stageFilter, setStageFilter] = useState(ALL_STAGES);
  const [flags, setFlags] = useState<LabsFeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>();

  useEffect(() => {
    let cancelled = false;

    const loadFeatureFlags = async () => {
      setLoading(true);
      setError(undefined);

      try {
        const response = await getLabsFeatureFlags();
        if (!cancelled) {
          setFlags([...response].sort((a, b) => nameCollator.compare(a.name, b.name)));
        }
      } catch (requestError) {
        if (!cancelled) {
          setFlags([]);
          setError(requestError);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadFeatureFlags();

    return () => {
      cancelled = true;
    };
  }, []);

  const stageOptions = useMemo<Array<SelectableValue<string>>>(() => {
    const uniqueStages = Array.from(new Set(flags.map((flag) => flag.stage))).sort((a, b) => stageCollator.compare(a, b));

    return [
      { label: t('labs.page.stage-filter.all', 'All stages'), value: ALL_STAGES },
      ...uniqueStages.map((stage) => ({ label: stage, value: stage })),
    ];
  }, [flags]);

  const filteredFlags = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return flags.filter((flag) => {
      if (stageFilter !== ALL_STAGES && flag.stage !== stageFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const searchableFields = [flag.name, flag.description, flag.stage, flag.owner, flag.enabled ? 'enabled' : 'disabled'];
      return searchableFields.some((field) => field.toLowerCase().includes(normalizedQuery));
    });
  }, [flags, query, stageFilter]);

  const onClearFilters = () => {
    setQuery('');
    setStageFilter(ALL_STAGES);
  };

  return (
    <Page
      navId="labs"
      subTitle={t(
        'labs.page.subtitle',
        'Read-only first pass: this page shows feature metadata and current state. Toggle controls and browser overrides are intentionally deferred.'
      )}
    >
      <Page.Contents>
        <Alert title={t('labs.page.read-only-title', 'Read-only Labs catalog')} severity="info" className={styles.readOnlyNotice}>
          {t(
            'labs.page.read-only-description',
            'This initial release is informational only. Use it to review what is enabled today; editing controls are out of scope for this phase.'
          )}
        </Alert>

        <Stack justifyContent="space-between" wrap="wrap" gap={2}>
          <InlineField grow>
            <FilterInput
              className={styles.filterInput}
              placeholder={t(
                'labs.page.search-placeholder',
                'Search by feature name, description, stage, owner, or current state'
              )}
              value={query}
              onChange={setQuery}
            />
          </InlineField>
          <InlineField label={t('labs.page.stage-filter.label', 'Stage')}>
            <Select
              options={stageOptions}
              value={stageOptions.find((option) => option.value === stageFilter)}
              onChange={(option) => setStageFilter(option.value ?? ALL_STAGES)}
              width={24}
              aria-label={t('labs.page.stage-filter.aria-label', 'Filter by stage')}
            />
          </InlineField>
        </Stack>

        {loading && (
          <div className={styles.emptyStateWrapper}>
            <EmptyState variant="not-found" message={t('labs.page.loading-message', 'Loading Labs feature flags...')} />
          </div>
        )}

        {!loading && Boolean(error) && (
          <Alert title={t('labs.page.error-title', 'Unable to load Labs feature flags')} severity="error">
            {t(
              'labs.page.error-description',
              'The Labs API request failed. Verify that the read-only Labs endpoint from phase 1 is available.'
            )}
          </Alert>
        )}

        {!loading && !error && flags.length === 0 && (
          <div className={styles.emptyStateWrapper}>
            <EmptyState variant="not-found" message={t('labs.page.empty-message', 'No Labs feature flags are available yet.')} />
          </div>
        )}

        {!loading && !error && flags.length > 0 && filteredFlags.length === 0 && (
          <div className={styles.emptyStateWrapper}>
            <EmptyState
              variant="not-found"
              message={t('labs.page.filtered-empty-message', 'No Labs feature flags match your filters.')}
              button={
                <Button variant="secondary" onClick={onClearFilters}>
                  {t('labs.page.clear-filters-button', 'Clear filters')}
                </Button>
              }
            />
          </div>
        )}

        {!loading && !error && filteredFlags.length > 0 && (
          <div className={styles.tableWrap}>
            <InteractiveTable columns={getColumns()} data={filteredFlags} getRowId={(flag) => flag.name} pageSize={20} />
          </div>
        )}
      </Page.Contents>
    </Page>
  );
}

const getStyles = () => ({
  readOnlyNotice: css({
    marginBottom: '16px',
  }),
  filterInput: css({
    maxWidth: '640px',
  }),
  emptyStateWrapper: css({
    marginTop: '16px',
  }),
  tableWrap: css({
    marginTop: '16px',
  }),
});
