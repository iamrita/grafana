import { ReactElement, useMemo, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { PluginExtensionLink, PluginExtensionPoints } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { usePluginLinks } from '@grafana/runtime';
import { DataQuery } from '@grafana/schema';

import { RuleFormValues } from '../../types/rule-form';

import { ConfirmNavigationModal } from './ConfirmationNavigationModal';
import { QuerylessAppsExtensions } from './QuerylessAppExtensions';

type Props = {
  extensionsToShow: 'queryless';
  query: DataQuery;
};

const QUERYLESS_APPS = [
  'grafana-pyroscope-app',
  'grafana-lokiexplore-app',
  'grafana-exploretraces-app',
  'grafana-metricsdrilldown-app',
];

// Map data source types to compatible queryless apps
const DATASOURCE_TO_QUERYLESS_APP: Record<string, string[]> = {
  prometheus: ['grafana-metricsdrilldown-app'],
  // todo: add more data source types here
  // 'pyroscope': ['grafana-pyroscope-app'],
  // 'loki': ['grafana-lokiexplore-app'],
  // 'tempo': ['grafana-exploretraces-app'],
};

/** Values drilldown apps need when they create an alerting rule from the current editor. */
export type PluginExtensionAlertingRuleFormValues = {
  name: string;
  folder?: { title: string; uid: string };
  labels: Array<{ key: string; value: string }>;
  annotations: Array<{ key: string; value: string }>;
  condition: string | null;
  evaluateEvery?: string;
  evaluateFor?: string;
};

function definedPairs(
  pairs: Array<{ key?: string; value?: string }> | undefined
): Array<{ key: string; value: string }> {
  return (pairs ?? []).flatMap((pair) =>
    pair.key !== undefined && pair.value !== undefined ? [{ key: pair.key, value: pair.value }] : []
  );
}

export type PluginExtensionAlertingRuleContext = {
  targets: DataQuery[];
  ruleForm?: PluginExtensionAlertingRuleFormValues;
};

export function AlertingRuleQueryExtensionPoint({ extensionsToShow, query }: Props): ReactElement | null {
  const [selectedExtension, setSelectedExtension] = useState<PluginExtensionLink | undefined>();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isBasicMenuOpen, setIsBasicMenuOpen] = useState(false);
  const { control } = useFormContext<RuleFormValues>();
  const formValues = useWatch({ control });

  const context = useMemo<PluginExtensionAlertingRuleContext>(
    () => ({
      targets: [query],
      ruleForm: {
        name: formValues.name ?? '',
        folder:
          formValues.folder?.title && formValues.folder.uid
            ? { title: formValues.folder.title, uid: formValues.folder.uid }
            : undefined,
        labels: definedPairs(formValues.labels),
        annotations: definedPairs(formValues.annotations),
        condition: formValues.condition ?? null,
        evaluateEvery: formValues.evaluateEvery,
        evaluateFor: formValues.evaluateFor,
      },
    }),
    [formValues, query]
  );

  const { links } = usePluginLinks({
    extensionPointId: PluginExtensionPoints.AlertingRuleQueryEditor,
    context: context,
    limitPerPlugin: 3,
  });

  // filter the link so that the query data source matches the queryless app data source
  // we only want one link per query row editor for now
  // but we can show an array of links for more flexibility in the future
  const basicLinks = links.filter((link) => !QUERYLESS_APPS.includes(link.pluginId));

  const querylessLinks = links.filter((link) => {
    if (!QUERYLESS_APPS.includes(link.pluginId)) {
      return false;
    }

    // Get the data source type from the query
    const datasourceType = query.datasource?.type;
    if (!datasourceType) {
      return false;
    }

    // Check if this queryless app is compatible with the data source type
    const compatibleApps = DATASOURCE_TO_QUERYLESS_APP[datasourceType.toLowerCase()] || [];
    return compatibleApps.includes(link.pluginId);
  });

  return (
    <>
      {extensionsToShow === 'queryless' && (
        <QuerylessAppsExtensions
          links={querylessLinks}
          setSelectedExtension={(extension) => {
            setSelectedExtension(extension);
          }}
          setIsModalOpen={setIsModalOpen}
          isModalOpen={isModalOpen}
        />
      )}
      <QuerylessAppsExtensions
        links={basicLinks}
        label={<Trans i18nKey="alerting.rule-query-extensions.extensions">Extensions</Trans>}
        ariaLabel={t('alerting.rule-query-extensions.aria-label-extensions', 'Query extensions')}
        setSelectedExtension={(extension) => {
          setSelectedExtension(extension);
        }}
        setIsModalOpen={setIsBasicMenuOpen}
        isModalOpen={isBasicMenuOpen}
      />
      {!!selectedExtension && !!selectedExtension.path && (
        <ConfirmNavigationModal
          path={selectedExtension.path}
          title={selectedExtension.title}
          onDismiss={() => setSelectedExtension(undefined)}
        />
      )}
    </>
  );
}
