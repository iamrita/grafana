import { ReactElement, useState } from 'react';

import { PluginExtensionLink, PluginExtensionPoints } from '@grafana/data';
import { usePluginLinks } from '@grafana/runtime';
import { DataQuery } from '@grafana/schema';
import { ToolbarButton } from '@grafana/ui';

import { ConfirmNavigationModal } from './ConfirmationNavigationModal';
import { QuerylessAppsExtensions } from './QuerylessAppExtensions';

type Props = {
  extensionsToShow: 'queryless' | 'basic';
  query: DataQuery;
};

const QUERYLESS_APPS = [
  'grafana-pyroscope-app',
  'grafana-lokiexplore-app',
  'grafana-exploretraces-app',
  'grafana-metricsdrilldown-app',
];

const DATASOURCE_TO_QUERYLESS_APP: Record<string, string[]> = {
  prometheus: ['grafana-metricsdrilldown-app'],
  'grafana-prometheus-datasource': ['grafana-metricsdrilldown-app'],
  pyroscope: ['grafana-pyroscope-app'],
  'grafana-pyroscope-datasource': ['grafana-pyroscope-app'],
  loki: ['grafana-lokiexplore-app'],
  tempo: ['grafana-exploretraces-app'],
};

export type PluginExtensionAlertingRuleContext = {
  targets: DataQuery[];
};

export function getCompatibleQuerylessApps(datasourceType?: string): string[] {
  if (!datasourceType) {
    return [];
  }

  return DATASOURCE_TO_QUERYLESS_APP[datasourceType.toLowerCase()] ?? [];
}

export function AlertingRuleQueryExtensionPoint({ extensionsToShow, query }: Props): ReactElement | null {
  const [selectedExtension, setSelectedExtension] = useState<PluginExtensionLink | undefined>();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const context: PluginExtensionAlertingRuleContext = {
    targets: [query],
  };

  const { links } = usePluginLinks({
    extensionPointId: PluginExtensionPoints.AlertingRuleQueryEditor,
    context: context,
    limitPerPlugin: 3,
  });

  const compatibleApps = getCompatibleQuerylessApps(query.datasource?.type);
  const querylessLinks = links.filter(
    (link) => QUERYLESS_APPS.includes(link.pluginId) && compatibleApps.includes(link.pluginId)
  );
  const basicLinks = links.filter((link) => !QUERYLESS_APPS.includes(link.pluginId));

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
      {extensionsToShow === 'basic' &&
        basicLinks.map((link) => (
          <ToolbarButton
            key={link.id}
            variant="canvas"
            icon={link.icon}
            onClick={() => {
              if (link.path) {
                setSelectedExtension(link);
                return;
              }
              link.onClick?.();
            }}
          >
            {link.title}
          </ToolbarButton>
        ))}
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
