import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import LabsPage, { LabsFeature } from './LabsPage';
import { FEATURE_TOGGLES_LOCAL_STORAGE_KEY } from './labsUtils';

/* eslint-disable no-var */
var mockGet: jest.Mock;
var mockRuntimeConfig: { buildInfo: { env: string }; featureToggles: Record<string, boolean | undefined> };

jest.mock('@grafana/runtime', () => {
  mockGet = jest.fn();
  mockRuntimeConfig = { buildInfo: { env: 'development' }, featureToggles: {} };
  return {
    getBackendSrv: () => ({
      get: mockGet,
    }),
    config: mockRuntimeConfig,
  };
});
/* eslint-enable no-var */

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
    requiresRestart: false,
    requiresDevMode: false,
  },
  {
    name: 'restartFeature',
    description: 'Needs server restart',
    stage: 'deprecated',
    owner: '@grafana/backend',
    enabled: false,
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
  beforeEach(() => {
    mockGet.mockResolvedValue(mockFeatures);
    window.localStorage.clear();
    window.history.replaceState({}, '', '/admin/labs');
    mockRuntimeConfig.buildInfo.env = 'development';
    mockRuntimeConfig.featureToggles = {};
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('toggles frontend feature and persists overrides in local storage', async () => {
    render(<LabsPage />);

    await screen.findByText('frontendFeature');

    fireEvent.click(screen.getAllByLabelText('Enabled')[0]);

    await waitFor(() => {
      expect(window.localStorage.getItem(FEATURE_TOGGLES_LOCAL_STORAGE_KEY)).toContain('frontendFeature=true');
      expect(mockRuntimeConfig.featureToggles.frontendFeature).toBe(true);
    });
  });

  it('allows toggling backend feature when restart is not required', async () => {
    render(<LabsPage />);

    await screen.findByText('backendFeature');
    const backendSwitchInput = document.getElementById('feature-toggle-backendFeature');
    expect(backendSwitchInput).not.toBeDisabled();
  });

  it('disables toggle when the flag requires a restart', async () => {
    render(<LabsPage />);

    await screen.findByText('restartFeature');
    const restartInput = document.getElementById('feature-toggle-restartFeature');
    expect(restartInput).toBeDisabled();
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
    mockRuntimeConfig.buildInfo.env = 'production';
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
