import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FeatureFlagDTO, FeatureFlagListResponse } from './types';

const mockFlags: FeatureFlagDTO[] = [
  {
    name: 'testFeatureA',
    description: 'A test feature flag',
    stage: 'experimental',
    enabled: false,
    requiresDevMode: false,
    frontendOnly: true,
  },
  {
    name: 'testFeatureB',
    description: 'Another test feature flag',
    stage: 'GA',
    enabled: true,
    requiresDevMode: false,
    frontendOnly: false,
  },
  {
    name: 'testFeatureC',
    description: 'Deprecated feature',
    stage: 'deprecated',
    enabled: false,
  },
];

const mockResponse: FeatureFlagListResponse = { flags: mockFlags };

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getBackendSrv: () => ({
    get: jest.fn().mockResolvedValue(mockResponse),
  }),
}));

describe('LabsPage', () => {
  const LOCAL_STORAGE_KEY = 'grafana.featureToggles';

  beforeEach(() => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  });

  // Lazy import to ensure mock is set up before module is loaded
  async function renderLabsPage() {
    const { default: LabsPage } = await import('./LabsPage');
    return render(<LabsPage />);
  }

  it('should render feature flags', async () => {
    await renderLabsPage();
    expect(await screen.findByText('testFeatureA')).toBeInTheDocument();
    expect(screen.getByText('testFeatureB')).toBeInTheDocument();
    expect(screen.getByText('testFeatureC')).toBeInTheDocument();
  });

  it('should display flag descriptions', async () => {
    await renderLabsPage();
    expect(await screen.findByText('A test feature flag')).toBeInTheDocument();
    expect(screen.getByText('Another test feature flag')).toBeInTheDocument();
  });

  it('should display stage badges', async () => {
    await renderLabsPage();
    expect(await screen.findByText('experimental')).toBeInTheDocument();
    expect(screen.getByText('GA')).toBeInTheDocument();
    expect(screen.getByText('deprecated')).toBeInTheDocument();
  });

  it('should toggle a feature flag and persist in localStorage', async () => {
    const user = userEvent.setup();
    await renderLabsPage();

    const toggleA = await screen.findByLabelText('Toggle testFeatureA');
    await user.click(toggleA);

    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    expect(stored).toContain('testFeatureA=true');
  });

  it('should filter flags by search query', async () => {
    const user = userEvent.setup();
    await renderLabsPage();

    await screen.findByText('testFeatureA');

    const searchInput = screen.getByPlaceholderText('Search feature flags...');
    await user.type(searchInput, 'Deprecated');

    expect(screen.queryByText('testFeatureA')).not.toBeInTheDocument();
    expect(screen.getByText('testFeatureC')).toBeInTheDocument();
  });

  it('should filter flags by stage', async () => {
    const user = userEvent.setup();
    await renderLabsPage();

    await screen.findByText('testFeatureA');

    const gaButton = screen.getByRole('radio', { name: 'GA' });
    await user.click(gaButton);

    await waitFor(() => {
      expect(screen.queryByText('testFeatureA')).not.toBeInTheDocument();
    });
    expect(screen.getByText('testFeatureB')).toBeInTheDocument();
    expect(screen.queryByText('testFeatureC')).not.toBeInTheDocument();
  });
});
