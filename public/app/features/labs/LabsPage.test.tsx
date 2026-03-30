import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TestProvider } from '../../../test/helpers/TestProvider';

import { FeatureToggleInfo } from './api';
import * as storage from './featureToggleStorage';

const mockToggles: FeatureToggleInfo[] = [
  {
    name: 'panelEditor',
    description: 'New panel editing experience',
    stage: 'preview',
    owner: '@grafana/dashboards',
    requiresDevMode: false,
    frontendOnly: true,
    requiresRestart: false,
    enabled: true,
  },
  {
    name: 'tracesExplore',
    description: 'Trace exploration UI improvements',
    stage: 'experimental',
    owner: '@grafana/observability-traces',
    requiresDevMode: false,
    frontendOnly: false,
    requiresRestart: true,
    enabled: false,
  },
  {
    name: 'alertingGA',
    description: 'Grafana-managed alerting GA release',
    stage: 'GA',
    owner: '@grafana/alerting',
    requiresDevMode: false,
    frontendOnly: false,
    requiresRestart: false,
    enabled: true,
  },
];

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getBackendSrv: () => ({
    get: jest.fn().mockResolvedValue(mockToggles),
  }),
  config: {
    ...jest.requireActual('@grafana/runtime').config,
    featureToggles: {} as Record<string, boolean>,
    bootData: { navTree: [], user: {} },
  },
}));

jest.mock('./featureToggleStorage', () => ({
  getLocalStorageOverrides: jest.fn().mockReturnValue({}),
  setLocalStorageOverride: jest.fn(),
  removeLocalStorageOverride: jest.fn(),
}));

function renderLabsPage() {
  const LabsPage = require('./LabsPage').default;
  return render(
    <TestProvider>
      <LabsPage />
    </TestProvider>
  );
}

describe('LabsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (storage.getLocalStorageOverrides as jest.Mock).mockReturnValue({});
  });

  it('renders the page with feature toggles', async () => {
    renderLabsPage();
    expect(await screen.findByText('panelEditor')).toBeInTheDocument();
    expect(screen.getByText('tracesExplore')).toBeInTheDocument();
    expect(screen.getByText('alertingGA')).toBeInTheDocument();
  });

  it('filters by name via search input', async () => {
    const user = userEvent.setup();
    renderLabsPage();

    await screen.findByText('panelEditor');
    const searchInput = screen.getByPlaceholderText(/search feature toggles/i);
    await user.type(searchInput, 'traces');

    expect(screen.getByText('tracesExplore')).toBeInTheDocument();
    expect(screen.queryByText('panelEditor')).not.toBeInTheDocument();
    expect(screen.queryByText('alertingGA')).not.toBeInTheDocument();
  });

  it('filters by description via search input', async () => {
    const user = userEvent.setup();
    renderLabsPage();

    await screen.findByText('panelEditor');
    const searchInput = screen.getByPlaceholderText(/search feature toggles/i);
    await user.type(searchInput, 'panel editing');

    expect(screen.getByText('panelEditor')).toBeInTheDocument();
    expect(screen.queryByText('tracesExplore')).not.toBeInTheDocument();
  });

  it('filters by stage', async () => {
    const user = userEvent.setup();
    renderLabsPage();

    await screen.findByText('panelEditor');
    const experimentalButton = screen.getByRole('radio', { name: 'Experimental' });
    await user.click(experimentalButton);

    expect(screen.getByText('tracesExplore')).toBeInTheDocument();
    expect(screen.queryByText('panelEditor')).not.toBeInTheDocument();
    expect(screen.queryByText('alertingGA')).not.toBeInTheDocument();
  });

  it('toggle switch calls setLocalStorageOverride', async () => {
    const user = userEvent.setup();
    renderLabsPage();

    await screen.findByText('panelEditor');
    const toggle = screen.getByRole('switch', { name: /toggle panelEditor/i });
    await user.click(toggle);

    expect(storage.setLocalStorageOverride).toHaveBeenCalledWith('panelEditor', false);
  });

  it('shows status message for flags with requiresRestart', async () => {
    const user = userEvent.setup();
    renderLabsPage();

    await screen.findByText('tracesExplore');
    const toggle = screen.getByRole('switch', { name: /toggle tracesExplore/i });
    await user.click(toggle);

    await waitFor(() => {
      expect(screen.getByText('Takes effect after page reload')).toBeInTheDocument();
    });
  });

  it('shows "Active" for non-restart flags after toggle', async () => {
    const user = userEvent.setup();
    renderLabsPage();

    await screen.findByText('alertingGA');
    const toggle = screen.getByRole('switch', { name: /toggle alertingGA/i });
    await user.click(toggle);

    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });
});
