import { render, screen } from 'test/test-utils';

import { AccessControlAction } from 'app/types/accessControl';

import { AlertRuleAction, AlertingAction } from '../hooks/useAbilities';
import { setupMswServer } from '../mockApi';
import { getGrafanaRule, grantUserPermissions } from '../mocks';

import { Authorize, AuthorizeAlertRule, AuthorizeAlertsource } from './Authorize';

setupMswServer();

describe('Authorize', () => {
  it('renders children when the user has an alerting action', () => {
    grantUserPermissions([AccessControlAction.AlertingRuleRead]);

    render(
      <Authorize actions={[AlertingAction.ViewAlertRule]}>
        <span>visible</span>
      </Authorize>
    );

    expect(screen.getByText('visible')).toBeInTheDocument();
  });

  it('hides children when the user lacks the alerting action', () => {
    grantUserPermissions([]);

    render(
      <AuthorizeAlertsource actions={[AlertingAction.CreateAlertRule]}>
        <span>hidden</span>
      </AuthorizeAlertsource>
    );

    expect(screen.queryByText('hidden')).not.toBeInTheDocument();
  });

  it('renders children for an individual alert rule when view is allowed', async () => {
    grantUserPermissions([AccessControlAction.AlertingRuleRead]);
    const rule = getGrafanaRule();

    render(
      <AuthorizeAlertRule rule={rule} actions={[AlertRuleAction.View]}>
        <span>rule-visible</span>
      </AuthorizeAlertRule>
    );

    expect(await screen.findByText('rule-visible')).toBeInTheDocument();
  });
});
