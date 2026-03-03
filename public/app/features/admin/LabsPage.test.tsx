import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TestProvider } from '../../../test/helpers/TestProvider';

import LabsPage from './LabsPage';
import { FeatureTogglesResponse } from './types';

const mockGet = jest.fn();

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getBackendSrv: () => ({ get: mockGet }),
}));

const response: FeatureTogglesResponse = {
  features: [
    {
      name: 'newDashboardWorkflow',
      description: 'Enable new dashboard edit workflow',
      stage: 'experimental',
      owner: '@grafana/dashboards-squad',
      enabled: false,
    },
    {
      name: 'queryServiceFromUI',
      description: 'Allow querying service from UI paths',
      stage: 'preview',
      owner: '@grafana/search-squad',
      enabled: true,
    },
    {
      name: 'privatePreviewFeature',
      description: 'A private preview capability',
      stage: 'privatePreview',
      owner: '@grafana/preview-squad',
      enabled: false,
    },
    {
      name: 'legacyMode',
      description: 'Legacy mode support and migration warnings',
      stage: 'deprecated',
      owner: '@grafana/migrations-squad',
      enabled: true,
      requiresRestart: true,
    },
  ],
};

const renderPage = () =>
  render(
    <TestProvider>
      <LabsPage />
    </TestProvider>
  );

describe('LabsPage', () => {
  beforeEach(() => {
    mockGet.mockResolvedValue(response);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders feature flags with stage and enabled status', async () => {
    renderPage();

    expect(await screen.findByText('newDashboardWorkflow')).toBeInTheDocument();
    expect(screen.getByText('queryServiceFromUI')).toBeInTheDocument();
    expect(screen.getByText('legacyMode')).toBeInTheDocument();
    expect(screen.getByText('Requires restart')).toBeInTheDocument();
    expect(screen.getAllByText('Enabled')).toHaveLength(2);
    expect(screen.getAllByText('Disabled')).toHaveLength(2);
  });

  it('filters by search query using name and description', async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('newDashboardWorkflow');

    const search = screen.getByPlaceholderText('Search by feature name or description');
    await user.type(search, 'migration');

    expect(screen.getByText('legacyMode')).toBeInTheDocument();
    expect(screen.queryByText('newDashboardWorkflow')).not.toBeInTheDocument();
    expect(screen.queryByText('queryServiceFromUI')).not.toBeInTheDocument();
  });

  it('filters by stage and treats private preview as preview', async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('newDashboardWorkflow');

    await user.click(screen.getByRole('radio', { name: 'Preview' }));

    expect(screen.getByText('queryServiceFromUI')).toBeInTheDocument();
    expect(screen.getByText('privatePreviewFeature')).toBeInTheDocument();
    expect(screen.queryByText('newDashboardWorkflow')).not.toBeInTheDocument();
    expect(screen.queryByText('legacyMode')).not.toBeInTheDocument();
  });

  it('shows an error message when loading fails', async () => {
    mockGet.mockRejectedValueOnce(new Error('failed to load'));
    renderPage();

    expect(await screen.findByText('Failed to load feature flags')).toBeInTheDocument();
    expect(screen.getByText('failed to load')).toBeInTheDocument();
  });
});
