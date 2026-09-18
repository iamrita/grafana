import { render, screen } from 'test/test-utils';

import { AlertmanagerProvider } from '../../state/AlertmanagerContext';
import { GRAFANA_RULES_SOURCE_NAME } from '../../utils/datasource';

import { ExternalAlertmanagerContactPointSelector } from './ContactPointSelector';

jest.mock('../contact-points/useContactPoints', () => ({
  useContactPointsWithStatus: jest.fn(),
}));

const { useContactPointsWithStatus } = jest.requireMock('../contact-points/useContactPoints') as {
  useContactPointsWithStatus: jest.Mock;
};

describe('ExternalAlertmanagerContactPointSelector', () => {
  it('shows the fetch error details and reports them to onError', () => {
    const onError = jest.fn();
    useContactPointsWithStatus.mockReturnValue({
      contactPoints: [],
      isLoading: false,
      error: new Error('alertmanager is unreachable'),
    });

    render(
      <AlertmanagerProvider accessType="notification" alertmanagerSourceName={GRAFANA_RULES_SOURCE_NAME}>
        <ExternalAlertmanagerContactPointSelector selectProps={{}} onError={onError} />
      </AlertmanagerProvider>
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Failed to fetch contact points');
    expect(screen.getByRole('alert')).toHaveTextContent('alertmanager is unreachable');
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'alertmanager is unreachable' }));
  });
});
