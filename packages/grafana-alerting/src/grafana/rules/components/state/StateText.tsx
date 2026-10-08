import { ReactNode } from 'react';

import { Trans } from '@grafana/i18n';
import { Icon, Stack, Text } from '@grafana/ui';

import { StateDot } from './StateDot';
import { Health, State } from './types';

// we're making a distinction here between the "state" of the rule and its "health".
// When the type is "recording" we only support the health property.
type CommonStateTextProps = {
  health?: Health;
  isPaused?: boolean;
};

interface AlertingStateTextProps extends CommonStateTextProps {
  type?: 'alerting';
  state?: State;
}

interface RecordingStateTextProps extends CommonStateTextProps {
  type: 'recording';
  state?: never;
}

type StateTextProps = AlertingStateTextProps | RecordingStateTextProps;

export const StateText = ({ state, health, type = 'alerting', isPaused = false }: StateTextProps) => {
  if (isPaused) {
    return <PausedText />;
  }

  let stateLabel: ReactNode;
  let color: TextColor;

  switch (state) {
    case 'normal':
      color = 'success';
      stateLabel = <Trans i18nKey="alerting.state-text.normal">Normal</Trans>;
      break;
    case 'firing':
      color = 'error';
      stateLabel = <Trans i18nKey="alerting.state-text.firing">Firing</Trans>;
      break;
    case 'pending':
      color = 'warning';
      stateLabel = <Trans i18nKey="alerting.state-text.pending">Pending</Trans>;
      break;
    case 'recovering':
      color = 'warning';
      stateLabel = <Trans i18nKey="alerting.state-text.recovering">Recovering</Trans>;
      break;
    case 'unknown':
    default:
      color = 'unknown';
      stateLabel = <Trans i18nKey="alerting.state-text.unknown">Unknown</Trans>;
      break;
  }

  // if the rule is in "error" health we don't really care about the state
  if (health === 'error') {
    color = 'error';
    stateLabel = <Trans i18nKey="alerting.state-text.error">Error</Trans>;
  }

  if (health === 'nodata') {
    color = 'warning';
    stateLabel = <Trans i18nKey="alerting.state-text.no-data">No data</Trans>;
  }

  // Recording rules report the same health values as alerting rules, including nodata.
  if (type === 'recording') {
    if (health === 'error') {
      return (
        <InnerText color="error" text={<Trans i18nKey="alerting.state-text.recording-error">Recording error</Trans>} />
      );
    }
    if (health === 'nodata') {
      return <InnerText color="warning" text={<Trans i18nKey="alerting.state-text.no-data">No data</Trans>} />;
    }
    return <InnerText color="success" text={<Trans i18nKey="alerting.state-text.recording">Recording</Trans>} />;
  }

  return <InnerText color={color} text={stateLabel} />;
};

// the generic badge component
type TextColor = 'success' | 'error' | 'warning' | 'unknown';

interface InnerTextProps {
  color: TextColor;
  text: NonNullable<ReactNode>;
}

// the inner badge component doesn't care about the semantics of "state" or "health" but just renders
// a badge in a specific text color and a dot in matching color.
// We currently don't expose this component outside of this file.
function InnerText({ color, text }: InnerTextProps) {
  const textColor = color === 'unknown' ? 'secondary' : color;

  return (
    <Stack direction="row" gap={0.5} wrap="nowrap" flex="0 0 auto" alignItems="center">
      <StateDot color={color} />
      <Text variant="bodySmall" color={textColor}>
        {text}
      </Text>
    </Stack>
  );
}

function PausedText() {
  return (
    <Text variant="bodySmall" color="warning">
      <Stack direction="row" gap={0.5} wrap="nowrap" flex="0 0 auto" alignItems="center">
        <Icon name="pause" size="xs" />
        <Trans i18nKey="alerting.paused-badge.paused">Paused</Trans>
      </Stack>
    </Text>
  );
}
