import { GRAFANA_ONCALL_INTEGRATION_TYPE, isInOnCallIntegrations, isOnCallReceiver } from './onCall';

describe('OnCall integration helpers', () => {
  it('uses grafana_alerting as the OnCall integration type', () => {
    expect(GRAFANA_ONCALL_INTEGRATION_TYPE).toBe('grafana_alerting');
  });

  it('detects URLs that belong to OnCall integrations', () => {
    expect(isInOnCallIntegrations('https://oncall/a', ['https://oncall/a', 'https://oncall/b'])).toBe(true);
    expect(isInOnCallIntegrations('https://other', ['https://oncall/a'])).toBe(false);
  });

  it('identifies a receiver as OnCall when it has a single matching integration', () => {
    expect(
      isOnCallReceiver(
        {
          name: 'oncall',
          grafana_managed_receiver_configs: [
            { name: 'oncall', type: 'oncall', settings: { url: 'https://oncall/a' }, disableResolveMessage: false },
          ],
        },
        [{ value: '1', display_name: 'Pager', integration_url: 'https://oncall/a' }]
      )
    ).toBe(true);
  });

  it('does not treat multi-integration or unmatched receivers as OnCall', () => {
    expect(
      isOnCallReceiver(
        {
          name: 'mixed',
          grafana_managed_receiver_configs: [
            { name: 'oncall', type: 'oncall', settings: { url: 'https://oncall/a' }, disableResolveMessage: false },
            { name: 'email', type: 'email', settings: {}, disableResolveMessage: false },
          ],
        },
        [{ value: '1', display_name: 'Pager', integration_url: 'https://oncall/a' }]
      )
    ).toBe(false);

    expect(
      isOnCallReceiver(
        {
          name: 'webhook',
          grafana_managed_receiver_configs: [
            { name: 'webhook', type: 'webhook', settings: { url: 'https://hooks/x' }, disableResolveMessage: false },
          ],
        },
        [{ value: '1', display_name: 'Pager', integration_url: 'https://oncall/a' }]
      )
    ).toBe(false);
  });
});
