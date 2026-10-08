import { render, screen } from 'test/test-utils';

import { AccessControlAction } from 'app/types/accessControl';

import { AlertingAction } from '../hooks/useAbilities';
import { grantUserPermissions } from '../mocks';

import { AuthorizeAlertSource } from './Authorize';

describe('AuthorizeAlertSource', () => {
  it('renders children when the user can perform the action', () => {
    grantUserPermissions([AccessControlAction.AlertingRuleRead]);

    render(
      <AuthorizeAlertSource actions={[AlertingAction.ViewAlertRule]}>
        <span>visible</span>
      </AuthorizeAlertSource>
    );

    expect(screen.getByText('visible')).toBeInTheDocument();
  });

  it('renders nothing when the user lacks the action', () => {
    grantUserPermissions([]);

    render(
      <AuthorizeAlertSource actions={[AlertingAction.ViewAlertRule]}>
        <span>visible</span>
      </AuthorizeAlertSource>
    );

    expect(screen.queryByText('visible')).not.toBeInTheDocument();
  });
});
