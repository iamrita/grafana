import { ComponentProps } from 'react';

import { Icon, Stack, Text } from '@grafana/ui';

import { formatPrometheusDuration } from '../../utils/time';

interface GroupIntervalIndicatorProps {
  seconds: number;
  iconSize?: ComponentProps<typeof Icon>['size'];
  color?: ComponentProps<typeof Text>['color'];
  variant?: ComponentProps<typeof Text>['variant'];
}

export const GroupIntervalIndicator = ({
  seconds,
  iconSize = 'xs',
  color = 'secondary',
  variant = 'bodySmall',
}: GroupIntervalIndicatorProps) => {
  const durationString = formatPrometheusDuration(seconds * 1000);

  return (
    <Text variant={variant} color={color}>
      <Stack direction="row" alignItems="center" gap={0.5}>
        <Icon name="clock-nine" size={iconSize} /> {durationString}
      </Stack>
    </Text>
  );
};
