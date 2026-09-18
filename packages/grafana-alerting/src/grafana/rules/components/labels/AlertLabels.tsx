import { css } from '@emotion/css';
import { chain } from 'lodash';
import { useMemo, useState } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { Button, Stack, Toggletip, useStyles2 } from '@grafana/ui';

import { findCommonLabels, isPrivateLabel } from '../../utils/labels';

import { AlertLabel, LabelSize } from './AlertLabel';

export interface AlertLabelsProps {
  labels: Record<string, string>;
  displayCommonLabels?: boolean;
  labelSets?: Array<Record<string, string>>;
  size?: LabelSize;
  onClick?: ([value, key]: [string | undefined, string | undefined]) => void;
  commonLabelsMode?: 'expand' | 'tooltip';
  maxItems?: number;
}

export const AlertLabels = ({
  labels,
  displayCommonLabels,
  labelSets,
  size,
  onClick,
  commonLabelsMode = 'expand',
  maxItems,
}: AlertLabelsProps) => {
  const styles = useStyles2(getStyles, size);
  const [showCommonLabels, setShowCommonLabels] = useState(false);
  const [showAllLabels, setShowAllLabels] = useState(false);

  const computedCommonLabels = useMemo(
    () => (displayCommonLabels && Array.isArray(labelSets) && labelSets.length > 1 ? findCommonLabels(labelSets) : {}),
    [displayCommonLabels, labelSets]
  );

  const labelsToShow = chain(labels)
    .toPairs()
    .reject(isPrivateLabel)
    .reject(([key]) => (showCommonLabels ? false : key in computedCommonLabels))
    .value();

  const shouldTruncateLabels = Boolean(maxItems && !showAllLabels && labelsToShow.length > maxItems);
  const visibleLabels = shouldTruncateLabels ? labelsToShow.slice(0, maxItems) : labelsToShow;
  const hiddenLabelCount = labelsToShow.length - visibleLabels.length;

  const commonLabelsCount = Object.keys(computedCommonLabels).length;
  const hasCommonLabels = commonLabelsCount > 0;
  const tooltip = t('alert-labels.button.show.tooltip', 'Show common labels');

  const commonLabelsTooltip = useMemo(
    () => (
      <Stack data-testid="common-labels-tooltip-content" role="list" direction="row" wrap="wrap" gap={1} width={48}>
        {Object.entries(computedCommonLabels).map(([label, value]) => (
          <AlertLabel key={label + value} size={size} labelKey={label} value={value} colorBy="key" role="listitem" />
        ))}
      </Stack>
    ),
    [computedCommonLabels, size]
  );

  return (
    <div className={styles.wrapper} role="list" aria-label={t('alerting.alert-labels.aria-label-labels', 'Labels')}>
      {visibleLabels.map(([label, value]) => {
        return (
          <AlertLabel
            key={label + value}
            size={size}
            labelKey={label}
            value={value}
            colorBy="key"
            onClick={onClick}
            role="listitem"
          />
        );
      })}
      {hiddenLabelCount > 0 && (
        <div role="listitem">
          <Button
            variant="secondary"
            fill="text"
            onClick={() => setShowAllLabels(true)}
            size="sm"
            tooltip={t('alerting.alert-labels.show-more-tooltip', 'Show all labels')}
            tooltipPlacement="top"
          >
            <Trans i18nKey="alerting.alert-labels.more-labels-count" count={hiddenLabelCount}>
              +{'{{count}}'} more
            </Trans>
          </Button>
        </div>
      )}
      {showAllLabels && maxItems && labelsToShow.length > maxItems && (
        <div role="listitem">
          <Button variant="secondary" fill="text" onClick={() => setShowAllLabels(false)} size="sm">
            <Trans i18nKey="alerting.alert-labels.show-fewer">Show fewer</Trans>
          </Button>
        </div>
      )}

      {!showCommonLabels && hasCommonLabels && (
        <div role="listitem">
          {commonLabelsMode === 'expand' ? (
            <Button
              variant="secondary"
              fill="text"
              onClick={() => setShowCommonLabels(true)}
              tooltip={tooltip}
              tooltipPlacement="top"
              size="sm"
            >
              <Trans i18nKey="alerting.alert-labels.common-labels-count" count={commonLabelsCount}>
                +{'{{count}}'} common labels
              </Trans>
            </Button>
          ) : (
            <Toggletip content={commonLabelsTooltip} closeButton={false} fitContent={true}>
              <Button data-testid="common-labels-tooltip-trigger" variant="secondary" fill="text" size="sm">
                <Trans i18nKey="alerting.alert-labels.common-labels-count" count={commonLabelsCount}>
                  +{'{{count}}'} common labels
                </Trans>
              </Button>
            </Toggletip>
          )}
        </div>
      )}
      {showCommonLabels && hasCommonLabels && (
        <div role="listitem">
          <Button
            variant="secondary"
            fill="text"
            onClick={() => setShowCommonLabels(false)}
            tooltipPlacement="top"
            size="sm"
          >
            <Trans i18nKey="alert-labels.button.hide">Hide common labels</Trans>
          </Button>
        </div>
      )}
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2, size?: LabelSize) => {
  return {
    wrapper: css({
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',

      gap: size === 'md' ? theme.spacing() : theme.spacing(0.5),
    }),
  };
};
