import { render, screen } from 'test/test-utils';

import { setPluginLinksHook } from '@grafana/runtime';
import { DataQuery } from '@grafana/schema';

import { mockPluginLinkExtension } from '../../mocks';

import { AlertingRuleQueryExtensionPoint, getCompatibleQuerylessApps } from './AlertingRuleQueryExtensionPoint';

describe('getCompatibleQuerylessApps', () => {
  it('maps datasource types to queryless apps', () => {
    expect(getCompatibleQuerylessApps('prometheus')).toEqual(['grafana-metricsdrilldown-app']);
    expect(getCompatibleQuerylessApps('loki')).toEqual(['grafana-lokiexplore-app']);
    expect(getCompatibleQuerylessApps('tempo')).toEqual(['grafana-exploretraces-app']);
    expect(getCompatibleQuerylessApps('pyroscope')).toEqual(['grafana-pyroscope-app']);
  });

  it('returns an empty list for unknown or missing types', () => {
    expect(getCompatibleQuerylessApps()).toEqual([]);
    expect(getCompatibleQuerylessApps('graphite')).toEqual([]);
  });
});

describe('AlertingRuleQueryExtensionPoint', () => {
  it('renders basic plugin extensions that are not queryless apps', () => {
    setPluginLinksHook(() => ({
      links: [
        mockPluginLinkExtension({
          id: 'slo-link',
          pluginId: 'grafana-slo-app',
          title: 'Open SLO',
          path: '/a/grafana-slo-app',
        }),
      ],
      isLoading: false,
    }));

    const query: DataQuery = { refId: 'A', datasource: { type: 'prometheus', uid: 'prom' } };

    render(<AlertingRuleQueryExtensionPoint extensionsToShow="basic" query={query} />);

    expect(screen.getByRole('button', { name: 'Open SLO' })).toBeInTheDocument();
  });
});
