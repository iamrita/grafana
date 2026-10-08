import { GRAFANA_RULES_SOURCE_NAME } from '../../utils/datasource';

import { buildNamespaceBreadcrumb } from './RuleViewer';

describe('buildNamespaceBreadcrumb', () => {
  it('nests parent folders under the current folder', () => {
    const nav = buildNamespaceBreadcrumb({
      name: JSON.stringify(['Team', 'Payments']),
      groups: [],
      rulesSource: GRAFANA_RULES_SOURCE_NAME,
    });

    expect(nav.text).toBe('Payments');
    expect(nav.parentItem?.text).toBe('Team');
    expect(nav.url).toContain('namespace');
    expect(nav.parentItem?.url).toContain('namespace');
  });

  it('returns a single item when the folder is not nested', () => {
    const nav = buildNamespaceBreadcrumb({
      name: 'Grafana',
      groups: [],
      rulesSource: GRAFANA_RULES_SOURCE_NAME,
    });

    expect(nav.text).toBe('Grafana');
    expect(nav.parentItem).toBeUndefined();
  });
});
