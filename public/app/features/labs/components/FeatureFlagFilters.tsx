import { css } from '@emotion/css';

import { GrafanaTheme2 } from '@grafana/data';
import { FilterInput, RadioButtonGroup, useStyles2 } from '@grafana/ui';

import { FeatureStage } from '../hooks/useFeatureFlags';

interface Props {
  filterStage: FeatureStage | 'all';
  onFilterStageChange: (stage: FeatureStage | 'all') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  stats: {
    total: number;
    experimental: number;
    privatePreview: number;
    preview: number;
    GA: number;
    deprecated: number;
    withOverrides: number;
  };
}

const stageOptions: Array<{ label: string; value: FeatureStage | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'Experimental', value: 'experimental' },
  { label: 'Preview', value: 'preview' },
  { label: 'GA', value: 'GA' },
  { label: 'Deprecated', value: 'deprecated' },
];

export function FeatureFlagFilters({
  filterStage,
  onFilterStageChange,
  searchQuery,
  onSearchChange,
  stats,
}: Props) {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.container}>
      <div className={styles.searchRow}>
        <FilterInput
          placeholder="Search feature flags..."
          value={searchQuery}
          onChange={onSearchChange}
          className={styles.search}
        />
        <div className={styles.statsText}>
          {stats.total} flags total
          {stats.withOverrides > 0 && ` (${stats.withOverrides} overridden)`}
        </div>
      </div>
      <div className={styles.filterRow}>
        <RadioButtonGroup
          options={stageOptions}
          value={filterStage}
          onChange={onFilterStageChange}
          size="sm"
        />
      </div>
    </div>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    container: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(2),
      marginBottom: theme.spacing(3),
    }),
    searchRow: css({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(2),
      flexWrap: 'wrap',
    }),
    search: css({
      maxWidth: 400,
      flexGrow: 1,
    }),
    statsText: css({
      color: theme.colors.text.secondary,
      fontSize: theme.typography.bodySmall.fontSize,
    }),
    filterRow: css({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(2),
    }),
  };
}
