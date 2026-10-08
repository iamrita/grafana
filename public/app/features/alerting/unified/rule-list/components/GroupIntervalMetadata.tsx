import { ComponentProps } from 'react';

import { Icon, Stack, Text } from '@grafana/ui';

import { formatPrometheusDuration } from '../../utils/time';

interface GroupIntervalIndicatorProps {
  seconds: number;
  iconSize?: ComponentProps<typeof Icon>['size'];
  color?: ComponentProps<typeof Text>['color'];
}

export const GroupIntervalIndicator = ({
  seconds,
  iconSize = 'xs',
  color = 'secondary',
}: GroupIntervalIndicatorProps) => {
  const durationString = formatPrometheusDuration(seconds * 1000);

  return (
    <Text variant="bodySmall" color={color}>
      <Stack direction="row" alignItems="center" gap={0.5}>
        <Icon name="clock-nine" size={iconSize} /> {durationString}
      </Stack>
    </Text>
  );
};
