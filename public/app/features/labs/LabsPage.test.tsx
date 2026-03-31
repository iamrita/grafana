import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from 'test/test-utils';

import LabsPage from './LabsPage';
import { fetchFeatureToggles, FeatureToggleInfo } from './api';

jest.mock('./api', () => ({
  fetchFeatureToggles: jest.fn(),
}));

const mockFeatureToggles: FeatureToggleInfo[] = [
  {
    name: 'alphaPreview',
    description: 'Preview rollout for alpha dashboard experiences',
    stage: 'preview',
    owner: '@grafana/dashboards',
    requiresDevMode: false,
    frontendOnly: true,
    requiresRestart: false,
    enabled: true,
  },
  {
    name: 'betaGA',
    description: 'General availability for beta workflows',
    stage: 'GA',
    owner: '@grafana/core',
    requiresDevMode: false,
    frontendOnly: false,
    requiresRestart: false,
    enabled: false,
  },
  {
    name: 'legacyMode',
    description: 'Legacy behavior pending deprecation',
    stage: 'deprecated',
    owner: '@grafana/platform',
    requiresDevMode: false,
    frontendOnly: false,
    requiresRestart: true,
    enabled: false,
  },
];

const mockedFetchFeatureToggles = jest.mocked(fetchFeatureToggles);

function renderLabsPage() {
  return render(<LabsPage />);
}

describe('LabsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  it('loads and renders feature toggles from the API', async () => {
    mockedFetchFeatureToggles.mockResolvedValue(mockFeatureToggles);

    renderLabsPage();

    await waitFor(() => expect(mockedFetchFeatureToggles).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('alphaPreview')).toBeInTheDocument();
    expect(screen.getByText('betaGA')).toBeInTheDocument();
    expect(screen.getByText('legacyMode')).toBeInTheDocument();
  });

  it('shows an error when loading toggles fails', async () => {
    mockedFetchFeatureToggles.mockRejectedValue(new Error('Unable to load labs metadata'));

    renderLabsPage();

    expect(await screen.findByText('Unable to load labs metadata')).toBeInTheDocument();
  });

  it('shows empty state when the API returns no toggles', async () => {
    mockedFetchFeatureToggles.mockResolvedValue([]);

    renderLabsPage();

    expect(await screen.findByText('No feature toggles match your filters.')).toBeInTheDocument();
  });

  it('filters toggles by stage on the client', async () => {
    const user = userEvent.setup();
    mockedFetchFeatureToggles.mockResolvedValue(mockFeatureToggles);

    renderLabsPage();

    await screen.findByText('alphaPreview');
    await user.click(screen.getByRole('radio', { name: 'Deprecated' }));

    expect(screen.getByText('legacyMode')).toBeInTheDocument();
    expect(screen.queryByText('alphaPreview')).not.toBeInTheDocument();
    expect(screen.queryByText('betaGA')).not.toBeInTheDocument();
  });

  it('filters toggles by search query against name and description', async () => {
    const user = userEvent.setup();
    mockedFetchFeatureToggles.mockResolvedValue(mockFeatureToggles);

    renderLabsPage();

    await screen.findByText('alphaPreview');
    await user.type(screen.getByPlaceholderText(/search feature toggles by name or description/i), 'general availability');

    expect(screen.getByText('betaGA')).toBeInTheDocument();
    expect(screen.queryByText('alphaPreview')).not.toBeInTheDocument();
    expect(screen.queryByText('legacyMode')).not.toBeInTheDocument();
  });

  it('shows empty state when filters remove all toggles', async () => {
    const user = userEvent.setup();
    mockedFetchFeatureToggles.mockResolvedValue(mockFeatureToggles);

    renderLabsPage();

    await screen.findByText('alphaPreview');
    await user.type(screen.getByPlaceholderText(/search feature toggles by name or description/i), 'no-match-query');

    expect(await screen.findByText('No feature toggles match your filters.')).toBeInTheDocument();
  });
});
