import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TestProvider } from '../../../test/helpers/TestProvider';

import LabsPage from './LabsPage';
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

const mockGet = jest.fn().mockResolvedValue(mockResponse);

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getBackendSrv: () => ({
    get: mockGet,
  }),
}));

describe('LabsPage', () => {
  const LOCAL_STORAGE_KEY = 'grafana.featureToggles';

  beforeEach(() => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    mockGet.mockClear();
  });

  async function renderLabsPage() {
    let result: ReturnType<typeof render>;
    await act(async () => {
      result = render(
        <TestProvider>
          <LabsPage />
        </TestProvider>
      );
    });
    return result!;
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
    expect(screen.getAllByText('GA').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('deprecated').length).toBeGreaterThanOrEqual(1);
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

    await waitFor(() => {
      expect(screen.queryByText('testFeatureA')).not.toBeInTheDocument();
    });
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
