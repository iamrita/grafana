import { useMemo, useState } from 'react';

import { SelectableValue } from '@grafana/data';
import { t } from '@grafana/i18n';
import { RadioButtonGroup, Stack, Text } from '@grafana/ui';

import { FeatureFlagCard } from './FeatureFlagCard';
import { FeatureFlag, StageFilter } from './types';

interface Props {
  flags: FeatureFlag[];
  overrides: Record<string, boolean>;
  isDevelopment: boolean;
  search: string;
  setOverride: (name: string, enabled: boolean) => void;
}

export function FeatureFlagList({ flags, overrides, isDevelopment, search, setOverride }: Props) {
  const [stageFilter, setStageFilter] = useState<StageFilter>('all');
  const normalizedSearch = search.trim().toLowerCase();
  const filterOptions: Array<SelectableValue<StageFilter>> = [
    { label: t('labs.filter.all', 'All'), value: 'all' },
    { label: t('labs.filter.experimental', 'Experimental'), value: 'experimental' },
    { label: t('labs.filter.preview', 'Preview'), value: 'preview' },
    { label: t('labs.filter.ga', 'GA'), value: 'GA' },
    { label: t('labs.filter.deprecated', 'Deprecated'), value: 'deprecated' },
    { label: t('labs.filter.modified', 'Modified'), value: 'modified' },
  ];

  const filteredFlags = useMemo(
    () =>
      flags.filter((flag) => {
        if (stageFilter === 'modified' && overrides[flag.name] == null) {
          return false;
        }

        if (stageFilter !== 'all' && stageFilter !== 'modified' && flag.stage !== stageFilter) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        return (
          flag.name.toLowerCase().includes(normalizedSearch) ||
          flag.description.toLowerCase().includes(normalizedSearch) ||
          (flag.owner?.toLowerCase().includes(normalizedSearch) ?? false)
        );
      }),
    [flags, normalizedSearch, overrides, stageFilter]
  );

  return (
    <Stack direction="column" gap={2}>
      <RadioButtonGroup options={filterOptions} value={stageFilter} onChange={(value) => value && setStageFilter(value)} />

      {filteredFlags.length === 0 && (
        <Text color="secondary">{t('labs.flags.empty', 'No feature flags match your current filters.')}</Text>
      )}

      {filteredFlags.map((flag) => {
        const override = overrides[flag.name];
        const enabled = override ?? isFlagEnabledByDefault(flag.expression);
        const disabled = flag.requiresDevMode && !isDevelopment;

        return (
          <FeatureFlagCard
            key={flag.name}
            flag={flag}
            enabled={enabled}
            disabled={disabled}
            onToggle={(value) => setOverride(flag.name, value)}
          />
        );
      })}
    </Stack>
  );
}

function isFlagEnabledByDefault(expression?: string): boolean {
  return expression === 'true' || expression === '1';
}
