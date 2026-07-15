import { css } from '@emotion/css';
import { useEffect, useMemo, useState } from 'react';

import { GrafanaTheme2, dateMath } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { config } from '@grafana/runtime';
import {
  Alert,
  Button,
  Checkbox,
  CollapsableSection,
  ConfirmModal,
  Divider,
  Icon,
  Link,
  LinkButton,
  LoadingPlaceholder,
  Stack,
  Text,
  useStyles2,
} from '@grafana/ui';
import { useAppNotification } from 'app/core/copy/appNotification';
import { useQueryParams } from 'app/core/hooks/useQueryParams';
import { alertSilencesApi } from 'app/features/alerting/unified/api/alertSilencesApi';
import { featureDiscoveryApi } from 'app/features/alerting/unified/api/featureDiscoveryApi';
import { MATCHER_ALERT_RULE_UID, SILENCES_POLL_INTERVAL_MS } from 'app/features/alerting/unified/utils/constants';
import { GRAFANA_RULES_SOURCE_NAME, getDatasourceAPIUid } from 'app/features/alerting/unified/utils/datasource';
import { AlertmanagerAlert, Silence, SilenceState } from 'app/plugins/datasource/alertmanager/types';

import { alertmanagerApi } from '../../api/alertmanagerApi';
import { AlertmanagerAction, useAlertmanagerAbility } from '../../hooks/useAbilities';
import { useAlertmanager } from '../../state/AlertmanagerContext';
import { parsePromQLStyleMatcherLooseSafe } from '../../utils/matchers';
import { getSilenceFiltersFromUrlParams, makeAMLink, stringifyErrorLike } from '../../utils/misc';
import { withPageErrorBoundary } from '../../withPageErrorBoundary';
import { AlertmanagerPageWrapper } from '../AlertingPageWrapper';
import { Authorize } from '../Authorize';
import { DynamicTable, DynamicTableColumnProps, DynamicTableItemProps } from '../DynamicTable';
import { GrafanaAlertmanagerWarning } from '../GrafanaAlertmanagerWarning';

import { Matchers } from './Matchers';
import { NoSilencesSplash } from './NoSilencesCTA';
import { SilenceDetails } from './SilenceDetails';
import { SilenceStateTag } from './SilenceStateTag';
import { SilencesFilter } from './SilencesFilter';

export interface SilenceTableItem extends Silence {
  silencedAlerts: AlertmanagerAlert[] | undefined;
}

type SilenceTableColumnProps = DynamicTableColumnProps<SilenceTableItem>;
type SilenceTableItemProps = DynamicTableItemProps<SilenceTableItem>;

const API_QUERY_OPTIONS = { pollingInterval: SILENCES_POLL_INTERVAL_MS, refetchOnFocus: true };
const BULK_UNSILENCE_CONCURRENCY = 5;

async function settleInBatches<T>(tasks: Array<() => Promise<T>>): Promise<Array<PromiseSettledResult<T>>> {
  if (tasks.length === 0) {
    return [];
  }

  const currentResults = await Promise.allSettled(tasks.slice(0, BULK_UNSILENCE_CONCURRENCY).map((task) => task()));
  const remainingResults = await settleInBatches(tasks.slice(BULK_UNSILENCE_CONCURRENCY));
  return [...currentResults, ...remainingResults];
}

function getSilenceCountText(count: number) {
  return count === 1
    ? t('alerting.silences-table.bulk-actions.silence-count-one', '1 silence')
    : t('alerting.silences-table.bulk-actions.silence-count-other', '{{count}} silences', { count });
}

const SilencesTable = () => {
  const { selectedAlertmanager: alertManagerSourceName = '' } = useAlertmanager();
  const [previewAlertsSupported, previewAlertsAllowed] = useAlertmanagerAbility(
    AlertmanagerAction.PreviewSilencedInstances
  );
  const canPreview = previewAlertsSupported && previewAlertsAllowed;

  const { data: alertManagerAlerts = [], isLoading: amAlertsIsLoading } =
    alertmanagerApi.endpoints.getAlertmanagerAlerts.useQuery(
      { amSourceName: alertManagerSourceName, filter: { silenced: true, active: false, inhibited: false } },
      { ...API_QUERY_OPTIONS, skip: !canPreview }
    );

  const {
    data: silences = [],
    isLoading,
    error,
  } = alertSilencesApi.endpoints.getSilences.useQuery(
    { datasourceUid: getDatasourceAPIUid(alertManagerSourceName), ruleMetadata: true, accessControl: true },
    API_QUERY_OPTIONS
  );

  const { currentData: amFeatures } = featureDiscoveryApi.useDiscoverAmFeaturesQuery(
    { amSourceName: alertManagerSourceName ?? '' },
    { skip: !alertManagerSourceName }
  );

  const mimirLazyInitError =
    stringifyErrorLike(error).includes('the Alertmanager is not configured') && amFeatures?.lazyConfigInit;

  const styles = useStyles2(getStyles);
  const [queryParams] = useQueryParams();
  const filteredSilencesNotExpired = useFilteredSilences(silences, false);
  const filteredSilencesExpired = useFilteredSilences(silences, true);

  const { silenceState: silenceStateInParams } = getSilenceFiltersFromUrlParams(queryParams);
  const showExpiredFromUrl = silenceStateInParams === SilenceState.Expired;

  const itemsNotExpired = useMemo((): SilenceTableItemProps[] => {
    const findSilencedAlerts = (id: string) => {
      return alertManagerAlerts.filter((alert) => alert.status.silencedBy.includes(id));
    };
    return filteredSilencesNotExpired.map((silence) => {
      const silencedAlerts = canPreview ? findSilencedAlerts(silence.id) : undefined;
      return {
        id: silence.id,
        data: { ...silence, silencedAlerts },
      };
    });
  }, [filteredSilencesNotExpired, alertManagerAlerts, canPreview]);

  const itemsExpired = useMemo((): SilenceTableItemProps[] => {
    const findSilencedAlerts = (id: string) => {
      return alertManagerAlerts.filter((alert) => alert.status.silencedBy.includes(id));
    };
    return filteredSilencesExpired.map((silence) => {
      const silencedAlerts = canPreview ? findSilencedAlerts(silence.id) : undefined;
      return {
        id: silence.id,
        data: { ...silence, silencedAlerts },
      };
    });
  }, [filteredSilencesExpired, alertManagerAlerts, canPreview]);

  if (isLoading || amAlertsIsLoading) {
    return <LoadingPlaceholder text={t('alerting.silences-table.text-loading-silences', 'Loading silences...')} />;
  }

  if (mimirLazyInitError) {
    return (
      <Alert
        title={t(
          'alerting.silences-table.title-the-selected-alertmanager-has-no-configuration',
          'The selected Alertmanager has no configuration'
        )}
        severity="warning"
      >
        <Trans i18nKey="silences.table.noConfig">
          Create a new contact point to create a configuration using the default values or contact your administrator to
          set up the Alertmanager.
        </Trans>
      </Alert>
    );
  }

  if (error) {
    const errMessage = stringifyErrorLike(error) || 'Unknown error.';
    return (
      <Alert
        severity="error"
        title={t('alerting.silences-table.title-error-loading-silences', 'Error loading silences')}
      >
        {errMessage}
      </Alert>
    );
  }

  return (
    <div data-testid="silences-table">
      <GrafanaAlertmanagerWarning currentAlertmanager={alertManagerSourceName} />
      {!!silences.length && (
        <Stack direction="column">
          <SilencesFilter silences={silences} />
          <Authorize actions={[AlertmanagerAction.CreateSilence]}>
            <Stack justifyContent="end">
              <LinkButton href={makeAMLink('/alerting/silence/new', alertManagerSourceName)} icon="plus">
                <Trans i18nKey="silences.table.add-silence-button">Add Silence</Trans>
              </LinkButton>
            </Stack>
          </Authorize>
          <SilenceList
            items={itemsNotExpired}
            alertManagerSourceName={alertManagerSourceName}
            dataTestId="not-expired-table"
            allowBulkActions={Boolean(config.featureToggles.alertingBulkActionsInUI)}
          />
          {itemsExpired.length > 0 && (
            <CollapsableSection
              label={t('alerting.silences-table.label-section-expired', 'Expired silences ({{numExpired}})', {
                numExpired: itemsExpired.length,
              })}
              isOpen={showExpiredFromUrl}
            >
              <div className={styles.callout}>
                <Icon className={styles.calloutIcon} name="info-circle" />
                <span>
                  <Trans i18nKey="silences.table.expired-silences">
                    Expired silences are automatically deleted after 5 days.
                  </Trans>
                </span>
              </div>
              <SilenceList
                items={itemsExpired}
                alertManagerSourceName={alertManagerSourceName}
                dataTestId="expired-table"
                allowBulkActions={false}
              />
            </CollapsableSection>
          )}
        </Stack>
      )}
      {!silences.length && <NoSilencesSplash alertManagerSourceName={alertManagerSourceName} />}
    </div>
  );
};

function SilenceList({
  items,
  alertManagerSourceName,
  dataTestId,
  allowBulkActions,
}: {
  items: SilenceTableItemProps[];
  alertManagerSourceName: string;
  dataTestId: string;
  allowBulkActions: boolean;
}) {
  const columns = useColumns(alertManagerSourceName);
  const [updateSupported, updateAllowed] = useAlertmanagerAbility(AlertmanagerAction.UpdateSilence);
  const [expireSilence] = alertSilencesApi.endpoints.expireSilence.useMutation();
  const notifyApp = useAppNotification();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isUnsilencing, setIsUnsilencing] = useState(false);
  const isGrafanaFlavoredAlertmanager = alertManagerSourceName === GRAFANA_RULES_SOURCE_NAME;

  const selectableIds = useMemo(() => {
    if (!allowBulkActions || !updateSupported) {
      return [];
    }

    return items
      .filter(({ data: silence }) =>
        isGrafanaFlavoredAlertmanager ? Boolean(silence.accessControl?.write) : updateAllowed
      )
      .map(({ data: silence }) => silence.id);
  }, [allowBulkActions, isGrafanaFlavoredAlertmanager, items, updateAllowed, updateSupported]);

  useEffect(() => {
    setSelectedIds((previous) => {
      const next = new Set(Array.from(previous).filter((id) => selectableIds.includes(id)));
      return next.size === previous.size ? previous : next;
    });
  }, [selectableIds]);

  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedIds.has(id));
  const selectionColumn = useMemo(
    (): SilenceTableColumnProps => ({
      id: 'select',
      label: t('alerting.silences-table.bulk-actions.select-column', 'Select'),
      renderCell: ({ data: silence }) => {
        if (!selectableIds.includes(silence.id)) {
          return null;
        }

        return (
          <Checkbox
            aria-label={t('alerting.silences-table.bulk-actions.select-silence', 'Select silence {{silenceId}}', {
              silenceId: silence.id,
            })}
            value={selectedIds.has(silence.id)}
            disabled={isUnsilencing}
            onChange={(event) => {
              const isSelected = event.currentTarget.checked;
              setSelectedIds((previous) => {
                const next = new Set(previous);
                isSelected ? next.add(silence.id) : next.delete(silence.id);
                return next;
              });
            }}
          />
        );
      },
      size: '72px',
    }),
    [isUnsilencing, selectableIds, selectedIds]
  );
  const displayedColumns = selectableIds.length > 0 ? [selectionColumn, ...columns] : columns;

  const onConfirmUnsilence = async () => {
    setIsUnsilencing(true);
    const ids = Array.from(selectedIds);
    const results = await settleInBatches(
      ids.map(
        (silenceId) => () =>
          expireSilence({
            datasourceUid: getDatasourceAPIUid(alertManagerSourceName),
            silenceId,
            suppressNotifications: true,
          }).unwrap()
      )
    );
    const failedIds = ids.filter((_, index) => results[index].status === 'rejected');
    const successCount = ids.length - failedIds.length;

    setSelectedIds(new Set(failedIds));
    setIsUnsilencing(false);
    setIsConfirmOpen(false);

    if (successCount > 0) {
      notifyApp.success(
        t('alerting.silences-table.bulk-actions.unsilence-success', 'Successfully unsilenced {{silenceCount}}', {
          silenceCount: getSilenceCountText(successCount),
        })
      );
    }
    if (failedIds.length > 0) {
      notifyApp.error(
        t('alerting.silences-table.bulk-actions.unsilence-error', 'Failed to unsilence {{silenceCount}}', {
          silenceCount: getSilenceCountText(failedIds.length),
        })
      );
    }
  };

  const selectedSilenceCount = getSilenceCountText(selectedIds.size);

  if (!!items.length) {
    return (
      <Stack direction="column">
        {selectableIds.length > 0 && (
          <Stack alignItems="center" justifyContent="space-between">
            <Checkbox
              aria-label={t('alerting.silences-table.bulk-actions.select-all', 'Select all silences')}
              label={t('alerting.silences-table.bulk-actions.select-all', 'Select all silences')}
              value={allSelected}
              indeterminate={selectedIds.size > 0 && !allSelected}
              disabled={isUnsilencing}
              onChange={(event) => {
                setSelectedIds(event.currentTarget.checked ? new Set(selectableIds) : new Set());
              }}
            />
            <Stack alignItems="center">
              <Text color="secondary">
                {t('alerting.silences-table.bulk-actions.selection-count', '{{silenceCount}} selected', {
                  silenceCount: selectedSilenceCount,
                })}
              </Text>
              <Button
                variant="destructive"
                icon="bell"
                disabled={selectedIds.size === 0 || isUnsilencing}
                onClick={() => setIsConfirmOpen(true)}
              >
                <Trans i18nKey="alerting.silences-table.bulk-actions.unsilence-selected">Unsilence selected</Trans>
              </Button>
            </Stack>
          </Stack>
        )}
        <DynamicTable
          pagination={{ itemsPerPage: 25 }}
          items={items}
          cols={displayedColumns}
          isExpandable
          dataTestId={dataTestId}
          renderExpandedContent={({ data }) => {
            return (
              <>
                <Divider />
                <SilenceDetails silence={data} />
              </>
            );
          }}
        />
        <ConfirmModal
          isOpen={isConfirmOpen}
          title={t('alerting.silences-table.bulk-actions.confirm-title', 'Unsilence selected silences?')}
          body={t(
            'alerting.silences-table.bulk-actions.confirm-body',
            'This will immediately expire {{silenceCount}}.',
            { silenceCount: selectedSilenceCount }
          )}
          confirmText={
            isUnsilencing
              ? t('alerting.silences-table.bulk-actions.unsilencing', 'Unsilencing...')
              : t('alerting.silences-table.bulk-actions.confirm', 'Unsilence')
          }
          confirmButtonVariant="destructive"
          onConfirm={onConfirmUnsilence}
          onDismiss={() => setIsConfirmOpen(false)}
        />
      </Stack>
    );
  } else {
    return <Trans i18nKey="silences.table.no-matching-silences">No matching silences found;</Trans>;
  }
}

const useFilteredSilences = (silences: Silence[], expired = false) => {
  const [queryParams] = useQueryParams();
  return useMemo(() => {
    const { queryString } = getSilenceFiltersFromUrlParams(queryParams);
    const silenceIdsString = queryParams?.silenceIds;
    return silences.filter((silence) => {
      if (typeof silenceIdsString === 'string') {
        const idsIncluded = silenceIdsString.split(',').includes(silence.id);
        if (!idsIncluded) {
          return false;
        }
      }
      if (queryString) {
        const matchers = parsePromQLStyleMatcherLooseSafe(queryString);
        const matchersMatch = matchers.every((matcher) =>
          silence.matchers?.some(
            ({ name, value, isEqual, isRegex }) =>
              matcher.name === name &&
              matcher.value === value &&
              matcher.isEqual === isEqual &&
              matcher.isRegex === isRegex
          )
        );
        if (!matchersMatch) {
          return false;
        }
      }
      if (expired) {
        return silence.status.state === SilenceState.Expired;
      } else {
        return silence.status.state !== SilenceState.Expired;
      }
    });
  }, [queryParams, silences, expired]);
};

const getStyles = (theme: GrafanaTheme2) => ({
  callout: css({
    backgroundColor: theme.colors.background.secondary,
    borderTop: `3px solid ${theme.colors.info.border}`,
    borderRadius: theme.shape.radius.default,
    height: '62px',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',

    '& > *': {
      marginLeft: theme.spacing(1),
    },
  }),
  calloutIcon: css({
    color: theme.colors.info.text,
  }),
});

function useColumns(alertManagerSourceName: string) {
  const [updateSupported, updateAllowed] = useAlertmanagerAbility(AlertmanagerAction.UpdateSilence);
  const [expireSilence] = alertSilencesApi.endpoints.expireSilence.useMutation();

  const isGrafanaFlavoredAlertmanager = alertManagerSourceName === GRAFANA_RULES_SOURCE_NAME;

  return useMemo((): SilenceTableColumnProps[] => {
    const handleExpireSilenceClick = (silenceId: string) => {
      expireSilence({ datasourceUid: getDatasourceAPIUid(alertManagerSourceName), silenceId });
    };
    const columns: SilenceTableColumnProps[] = [
      {
        id: 'state',
        label: t('alerting.use-columns.columns.label.state', 'State'),
        renderCell: function renderStateTag({ data: { status } }) {
          return <SilenceStateTag state={status.state} />;
        },
        size: 3,
      },
      {
        id: 'alert-rule',
        label: t('alerting.use-columns.columns.label.alert-rule-targeted', 'Alert rule targeted'),
        renderCell: function renderAlertRuleLink({ data: { metadata } }) {
          return metadata?.rule_title ? (
            <Link
              href={`/alerting/grafana/${metadata?.rule_uid}/view?returnTo=${encodeURIComponent('/alerting/silences')}`}
            >
              {metadata.rule_title}
            </Link>
          ) : (
            'None'
          );
        },
        size: 8,
      },
      {
        id: 'matchers',
        label: t('alerting.use-columns.columns.label.matching-labels', 'Matching labels'),
        renderCell: function renderMatchers({ data: { matchers } }) {
          const filteredMatchers = matchers?.filter((matcher) => matcher.name !== MATCHER_ALERT_RULE_UID) || [];
          return <Matchers matchers={filteredMatchers} />;
        },
        size: 7,
      },
      {
        id: 'alerts',
        label: t('alerting.use-columns.columns.label.alerts-silenced', 'Alerts silenced'),
        renderCell: function renderSilencedAlerts({ data: { silencedAlerts } }) {
          return (
            <span data-testid="alerts">
              {Array.isArray(silencedAlerts)
                ? silencedAlerts.length
                : // eslint-disable-next-line @grafana/i18n/no-untranslated-strings
                  '-'}
            </span>
          );
        },
        size: 2,
      },
      {
        id: 'schedule',
        label: t('alerting.use-columns.columns.label.schedule', 'Schedule'),
        renderCell: function renderSchedule({ data: { startsAt, endsAt } }) {
          const startsAtDate = dateMath.parse(startsAt);
          const endsAtDate = dateMath.parse(endsAt);
          const dateDisplayFormat = 'YYYY-MM-DD HH:mm';
          return `${startsAtDate?.format(dateDisplayFormat)} - ${endsAtDate?.format(dateDisplayFormat)}`;
        },
        size: 7,
      },
    ];
    columns.push({
      id: 'actions',
      label: t('alerting.use-columns.label.actions', 'Actions'),
      renderCell: function renderActions({ data: silence }) {
        const isExpired = silence.status.state === SilenceState.Expired;

        const canCreate = silence?.accessControl?.create;
        const canWrite = silence?.accessControl?.write;

        const canRecreate = updateSupported && isExpired && (isGrafanaFlavoredAlertmanager ? canCreate : updateAllowed);
        const canEdit = updateSupported && !isExpired && (isGrafanaFlavoredAlertmanager ? canWrite : updateAllowed);

        return (
          <Stack gap={0.5} wrap="wrap">
            <LinkButton
              title={t('alerting.use-columns.title-view', 'View')}
              size="sm"
              variant="secondary"
              icon="eye"
              href={makeAMLink(`/alerting/silence/${silence.id}/view`, alertManagerSourceName)}
            >
              <Trans i18nKey="silences.table.view-button">View</Trans>
            </LinkButton>
            {canRecreate && (
              <LinkButton
                title={t('alerting.use-columns.title-recreate', 'Recreate')}
                size="sm"
                variant="secondary"
                icon="sync"
                href={makeAMLink(`/alerting/silence/${silence.id}/edit`, alertManagerSourceName)}
              >
                <Trans i18nKey="silences.table.recreate-button">Recreate</Trans>
              </LinkButton>
            )}
            {canEdit && (
              <>
                <LinkButton
                  title={t('alerting.use-columns.title-unsilence', 'Unsilence')}
                  size="sm"
                  variant="secondary"
                  icon="bell"
                  onClick={() => handleExpireSilenceClick(silence.id)}
                >
                  <Trans i18nKey="silences.table.unsilence-button">Unsilence</Trans>
                </LinkButton>
                <LinkButton
                  title={t('alerting.use-columns.title-edit', 'Edit')}
                  size="sm"
                  variant="secondary"
                  icon="pen"
                  href={makeAMLink(`/alerting/silence/${silence.id}/edit`, alertManagerSourceName)}
                >
                  <Trans i18nKey="silences.table.edit-button">Edit</Trans>
                </LinkButton>
              </>
            )}
          </Stack>
        );
      },
      size: 5,
    });
    return columns;
  }, [alertManagerSourceName, expireSilence, isGrafanaFlavoredAlertmanager, updateAllowed, updateSupported]);
}

function SilencesTablePage() {
  return (
    <AlertmanagerPageWrapper navId="silences" accessType="instance">
      <SilencesTable />
    </AlertmanagerPageWrapper>
  );
}

export default withPageErrorBoundary(SilencesTablePage);
