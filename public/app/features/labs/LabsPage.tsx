import { css } from '@emotion/css';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { config } from '@grafana/runtime';
import {
  Badge,
  BadgeColor,
  FilterInput,
  InlineSwitch,
  RadioButtonGroup,
  Spinner,
  Stack,
  Text,
  useStyles2,
} from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

import { FeatureToggleInfo, fetchFeatureToggles } from './api';
import { getLocalStorageOverrides, removeLocalStorageOverride, setLocalStorageOverride } from './featureToggleStorage';

type StageFilter = 'all' | 'experimental' | 'preview' | 'GA' | 'deprecated';

const STAGE_FILTER_OPTIONS = [
  { label: 'All', value: 'all' as StageFilter },
  { label: 'Experimental', value: 'experimental' as StageFilter },
  { label: 'Preview', value: 'preview' as StageFilter },
  { label: 'GA', value: 'GA' as StageFilter },
  { label: 'Deprecated', value: 'deprecated' as StageFilter },
];

function stageBadgeColor(stage: string): BadgeColor {
  switch (stage.toLowerCase()) {
    case 'experimental':
      return 'orange';
    case 'preview':
      return 'blue';
    case 'ga':
    case 'generalavailability':
      return 'green';
    case 'deprecated':
      return 'red';
    default:
      return 'purple';
  }
}

export default function LabsPage() {
  const styles = useStyles2(getStyles);
  const [toggles, setToggles] = useState<FeatureToggleInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<StageFilter>('all');
  const [overrides, setOverrides] = useState<Record<string, boolean>>(getLocalStorageOverrides);
  const [statusMessages, setStatusMessages] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    fetchFeatureToggles()
      .then((data) => {
        if (!cancelled) {
          setToggles(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message ?? 'Failed to load feature toggles');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleToggle = useCallback(
    (flag: FeatureToggleInfo) => {
      const currentValue = overrides[flag.name] ?? flag.enabled;
      const newValue = !currentValue;

      setLocalStorageOverride(flag.name, newValue);

      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      (config.featureToggles as Record<string, boolean>)[flag.name] = newValue;

      setOverrides((prev) => ({ ...prev, [flag.name]: newValue }));
      setStatusMessages((prev) => ({
        ...prev,
        [flag.name]: flag.requiresRestart ? 'Takes effect after page reload' : 'Active',
      }));
    },
    [overrides]
  );

  const handleReset = useCallback((flag: FeatureToggleInfo) => {
    removeLocalStorageOverride(flag.name);

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    (config.featureToggles as Record<string, boolean>)[flag.name] = flag.enabled;

    setOverrides((prev) => {
      const next = { ...prev };
      delete next[flag.name];
      return next;
    });
    setStatusMessages((prev) => {
      const next = { ...prev };
      delete next[flag.name];
      return next;
    });
  }, []);

  const filtered = useMemo(() => {
    let list = toggles;
    if (stageFilter !== 'all') {
      list = list.filter((t) => t.stage.toLowerCase() === stageFilter.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    }
    return list;
  }, [toggles, stageFilter, search]);

  return (
    <Page navId="labs">
      <Page.Contents>
        <div className={styles.toolbar}>
          <FilterInput
            placeholder="Search feature toggles by name or description…"
            value={search}
            onChange={setSearch}
            escapeRegex={false}
          />
          <RadioButtonGroup options={STAGE_FILTER_OPTIONS} value={stageFilter} onChange={setStageFilter} />
        </div>

        {loading && (
          <Stack justifyContent="center" alignItems="center">
            <Spinner size="xl" />
          </Stack>
        )}

        {error && (
          <Text color="error" element="p">
            {error}
          </Text>
        )}

        {!loading && !error && filtered.length === 0 && (
          <Text color="secondary" element="p">
            No feature toggles match your filters.
          </Text>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className={styles.list}>
            {filtered.map((flag) => {
              const isOverridden = flag.name in overrides;
              const effectiveValue = isOverridden ? overrides[flag.name] : flag.enabled;
              const statusMsg = statusMessages[flag.name];

              return (
                <div key={flag.name} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <Stack alignItems="center" gap={1}>
                      <Text element="span" weight="bold">
                        {flag.name}
                      </Text>
                      <Badge text={flag.stage} color={stageBadgeColor(flag.stage)} />
                      {isOverridden && <Badge text="Overridden" color="purple" />}
                    </Stack>
                    <Stack alignItems="center" gap={1}>
                      {statusMsg && (
                        <Text element="span" color="secondary" variant="bodySmall">
                          {statusMsg}
                        </Text>
                      )}
                      {isOverridden && (
                        <button className={styles.resetButton} onClick={() => handleReset(flag)}>
                          Reset
                        </button>
                      )}
                      <InlineSwitch
                        showLabel={false}
                        label={`Toggle ${flag.name}`}
                        value={effectiveValue}
                        onChange={() => handleToggle(flag)}
                      />
                    </Stack>
                  </div>
                  {flag.description && (
                    <Text element="p" color="secondary" variant="bodySmall">
                      {flag.description}
                    </Text>
                  )}
                  {flag.owner && (
                    <Text element="span" color="secondary" variant="bodySmall" italic>
                      Owner: {flag.owner}
                    </Text>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Page.Contents>
    </Page>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  toolbar: css({
    display: 'flex',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(3),
    flexWrap: 'wrap',
    alignItems: 'center',
  }),
  list: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  }),
  card: css({
    background: theme.colors.background.secondary,
    borderRadius: theme.shape.radius.default,
    padding: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
  }),
  cardHeader: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
  }),
  resetButton: css({
    background: 'none',
    border: 'none',
    color: theme.colors.text.link,
    cursor: 'pointer',
    padding: 0,
    fontSize: theme.typography.bodySmall.fontSize,
    '&:hover': {
      textDecoration: 'underline',
    },
  }),
});
