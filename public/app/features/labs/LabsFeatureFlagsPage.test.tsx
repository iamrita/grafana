import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { getBackendSrv } from '@grafana/runtime';
import { render } from 'test/test-utils';

import LabsFeatureFlagsPage from './LabsFeatureFlagsPage';

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getBackendSrv: jest.fn(),
}));

const mockGet = getBackendSrv as jest.MockedFunction<typeof getBackendSrv>;

describe('LabsFeatureFlagsPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockGet.mockReturnValue({
      get: jest.fn().mockResolvedValue({
        flags: [
          {
            name: 'publicDashboardsScene',
            description: 'Test flag',
            stage: 'GA',
            frontendOnly: true,
            requiresRestart: false,
            requiresDevMode: false,
            hideFromDocs: false,
            enabled: true,
            serverConfigured: false,
            browserOverrideAllowed: true,
          },
        ],
      }),
    } as unknown as ReturnType<typeof getBackendSrv>);
  });

  it('renders flags and toggles browser override in localStorage', async () => {
    render(<LabsFeatureFlagsPage />);

    await waitFor(() => expect(screen.getByText('publicDashboardsScene')).toBeInTheDocument());

    const toggle = screen.getByRole('switch', { name: /Browser override for publicDashboardsScene/i });
    await userEvent.click(toggle);

    expect(window.localStorage.getItem('grafana.featureToggles')).toContain('publicDashboardsScene=false');
  });
});
