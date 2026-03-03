import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import config from 'app/core/config';

import LabsPage, { LabsFeature } from './LabsPage';
import { FEATURE_TOGGLES_LOCAL_STORAGE_KEY } from './labsUtils';

const mockGet = jest.fn();

jest.mock('@grafana/runtime', () => ({
  getBackendSrv: () => ({
    get: mockGet,
  }),
}));

jest.mock('app/core/config', () => ({
  __esModule: true,
  default: {
    buildInfo: { env: 'development' },
  },
}));

jest.mock('app/core/services/context_srv', () => ({
  contextSrv: {
    hasPermission: () => true,
    evaluatePermission: () => true,
    isGrafanaAdmin: true,
  },
}));

jest.mock('app/core/components/Page/Page', () => {
  const React = require('react');
  const Page = ({ children }: { children: React.ReactNode }) => React.createElement('div', null, children);
  Page.Contents = ({ children }: { children: React.ReactNode }) => React.createElement('div', null, children);
  return { Page };
});

const mockFeatures: LabsFeature[] = [
  {
    name: 'frontendFeature',
    description: 'Frontend only flag',
    stage: 'experimental',
    owner: '@grafana/frontend',
    enabled: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: false,
  },
  {
    name: 'backendFeature',
    description: 'Backend controlled flag',
    stage: 'preview',
    owner: '@grafana/backend',
    enabled: true,
    frontendOnly: false,
    requiresRestart: true,
    requiresDevMode: false,
  },
  {
    name: 'devOnlyFeature',
    description: 'Hidden outside dev',
    stage: 'GA',
    owner: '@grafana/core',
    enabled: false,
    frontendOnly: true,
    requiresRestart: false,
    requiresDevMode: true,
  },
];

describe('LabsPage', () => {
  const originalEnv = config.buildInfo.env;

  beforeEach(() => {
    mockGet.mockResolvedValue(mockFeatures);
    window.localStorage.clear();
    window.history.replaceState({}, '', '/admin/labs');
    config.buildInfo.env = 'development';
  });

  afterEach(() => {
    config.buildInfo.env = originalEnv;
    jest.clearAllMocks();
  });

  it('toggles frontend feature and persists overrides in local storage', async () => {
    render(<LabsPage />);

    await screen.findByText('frontendFeature');

    fireEvent.click(screen.getAllByLabelText('Enabled')[0]);

    await waitFor(() => {
      expect(window.localStorage.getItem(FEATURE_TOGGLES_LOCAL_STORAGE_KEY)).toContain('frontendFeature=true');
    });
  });

  it('shows backend-only feature toggle as disabled', async () => {
    render(<LabsPage />);

    await screen.findByText('backendFeature');
    const backendSwitchInput = document.getElementById('feature-toggle-backendFeature');
    expect(backendSwitchInput).toBeDisabled();
  });

  it('filters by search and stage', async () => {
    render(<LabsPage />);
    await screen.findByText('frontendFeature');

    fireEvent.change(screen.getByPlaceholderText('Filter by name or description'), {
      target: { value: 'backend' },
    });

    expect(screen.queryByText('frontendFeature')).not.toBeInTheDocument();
    expect(screen.getByText('backendFeature')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Filter by name or description'), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByRole('radio', { name: 'GA' }));

    expect(screen.getByText('devOnlyFeature')).toBeInTheDocument();
    expect(screen.queryByText('frontendFeature')).not.toBeInTheDocument();
  });

  it('hides dev-only flags in production', async () => {
    config.buildInfo.env = 'production';
    render(<LabsPage />);

    await screen.findByText('frontendFeature');
    expect(screen.queryByText('devOnlyFeature')).not.toBeInTheDocument();
  });

  it('handles resetFeatureFlags query param by clearing local storage', async () => {
    window.localStorage.setItem(FEATURE_TOGGLES_LOCAL_STORAGE_KEY, 'frontendFeature=true');
    window.history.replaceState({}, '', '/admin/labs?resetFeatureFlags=true');

    render(<LabsPage />);
    await screen.findByText('frontendFeature');

    expect(window.localStorage.getItem(FEATURE_TOGGLES_LOCAL_STORAGE_KEY)).toBeNull();
    expect(window.location.search).toBe('');
  });
});
