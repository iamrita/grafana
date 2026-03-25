import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { FeatureToggles } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import config from 'app/core/config';
import { TestProvider } from 'test/helpers/TestProvider';

import LabsPage, { type LabsFeatureFlagDTO } from './LabsPage';
import { setFeatureToggleInLocalStorage } from './utils/featureTogglesLocalStorage';

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getBackendSrv: jest.fn(),
}));

const mockFlags: LabsFeatureFlagDTO[] = [
  {
    name: 'alphaFeature',
    description: 'Alpha testing',
    stage: 'experimental',
    owner: '@grafana/team',
    enabled: false,
    frontendOnly: true,
    requiresRestart: false,
  },
  {
    name: 'betaFeature',
    description: 'Beta rollouts',
    stage: 'preview',
    enabled: true,
    frontendOnly: false,
    requiresRestart: false,
    warning: 'Server-evaluated',
  },
  {
    name: 'oldFeature',
    description: 'Legacy path',
    stage: 'deprecated',
    enabled: false,
    frontendOnly: true,
    requiresRestart: true,
    warning: 'Restart',
  },
];

describe('LabsPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.mocked(getBackendSrv).mockReturnValue({
      get: jest.fn().mockResolvedValue({ flags: mockFlags }),
    } as unknown as ReturnType<typeof getBackendSrv>);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  function renderPage() {
    return render(
      <TestProvider>
        <LabsPage />
      </TestProvider>
    );
  }

  it('renders flags from API', async () => {
    renderPage();
    expect(await screen.findByText('alphaFeature')).toBeInTheDocument();
    expect(screen.getByText('betaFeature')).toBeInTheDocument();
  });

  it('filters by search', async () => {
    renderPage();
    await screen.findByText('alphaFeature');
    const search = screen.getByPlaceholderText(/Search by name/i);
    await userEvent.type(search, 'beta');
    await waitFor(() => {
      expect(screen.queryByText('alphaFeature')).not.toBeInTheDocument();
      expect(screen.getByText('betaFeature')).toBeInTheDocument();
    });
  });

  it('filters by deprecated stage', async () => {
    renderPage();
    await screen.findByText('alphaFeature');
    await userEvent.click(screen.getByRole('radio', { name: /Deprecated/i }));
    await waitFor(() => {
      expect(screen.getByText('oldFeature')).toBeInTheDocument();
      expect(screen.queryByText('alphaFeature')).not.toBeInTheDocument();
    });
  });

  it('persists toggle to localStorage and updates config', async () => {
    renderPage();
    await screen.findByText('alphaFeature');
    const switches = screen.getAllByRole('switch');
    const alphaSwitch = switches[0];
    await userEvent.click(alphaSwitch);
    expect(window.localStorage.getItem('grafana.featureToggles')).toContain('alphaFeature=true');
    expect(
      (config.featureToggles as FeatureToggles & Record<string, boolean>)['alphaFeature']
    ).toBe(true);
  });

  it('shows effective state from localStorage overrides', async () => {
    setFeatureToggleInLocalStorage('alphaFeature', true);
    renderPage();
    await screen.findByText('alphaFeature');
    const switches = screen.getAllByRole('switch');
    expect(switches[0]).toBeChecked();
  });
});
