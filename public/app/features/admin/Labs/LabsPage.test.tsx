import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestProvider } from 'test/helpers/TestProvider';

import { store } from '@grafana/data';

import LabsPage from './LabsPage';
import { FeatureFlagsResponse } from './types';

const mockFlags: FeatureFlagsResponse = {
  flags: [
    {
      name: 'alphaFeature',
      description: 'Alpha feature description',
      stage: 'experimental',
      owner: '@grafana/test-squad',
      frontend: true,
      requiresRestart: false,
      expression: 'false',
      enabled: false,
    },
    {
      name: 'betaFeature',
      description: 'Beta feature with reload requirement',
      stage: 'preview',
      owner: '@grafana/another-squad',
      frontend: true,
      requiresRestart: true,
      expression: 'true',
      enabled: true,
    },
    {
      name: 'gammaFeature',
      description: 'A stable feature',
      stage: 'GA',
      owner: '@grafana/ga-squad',
      frontend: true,
      requiresRestart: false,
      expression: 'true',
      enabled: true,
    },
  ],
};

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getBackendSrv: () => ({
    get: jest.fn().mockResolvedValue(mockFlags),
  }),
}));

jest.mock('app/core/components/Page/Page', () => {
  const Page = ({ children }: { children: React.ReactNode }) => <div data-testid="page">{children}</div>;
  Page.Contents = ({ children }: { children: React.ReactNode }) => <div data-testid="page-contents">{children}</div>;
  return { Page };
});

describe('LabsPage', () => {
  beforeEach(() => {
    store.delete('grafana.featureToggles');
  });

  it('should render feature flags after loading', async () => {
    render(
      <TestProvider>
        <LabsPage />
      </TestProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('alphaFeature')).toBeInTheDocument();
    });

    expect(screen.getByText('betaFeature')).toBeInTheDocument();
    expect(screen.getByText('gammaFeature')).toBeInTheDocument();
  });

  it('should show flag descriptions', async () => {
    render(
      <TestProvider>
        <LabsPage />
      </TestProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Alpha feature description')).toBeInTheDocument();
    });
  });

  it('should show stage badges', async () => {
    render(
      <TestProvider>
        <LabsPage />
      </TestProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('experimental')).toBeInTheDocument();
    });

    expect(screen.getByText('preview')).toBeInTheDocument();
  });

  it('should filter flags by search query', async () => {
    const user = userEvent.setup();

    render(
      <TestProvider>
        <LabsPage />
      </TestProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('alphaFeature')).toBeInTheDocument();
    });

    const searchInput = screen.getByRole('textbox');
    await user.type(searchInput, 'gamma');

    expect(screen.queryByText('alphaFeature')).not.toBeInTheDocument();
    expect(screen.queryByText('betaFeature')).not.toBeInTheDocument();
    expect(screen.getByText('gammaFeature')).toBeInTheDocument();
  });

  it('should filter flags by stage', async () => {
    const user = userEvent.setup();

    render(
      <TestProvider>
        <LabsPage />
      </TestProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('alphaFeature')).toBeInTheDocument();
    });

    const experimentalButton = screen.getByRole('radio', { name: /experimental/i });
    await user.click(experimentalButton);

    expect(screen.getByText('alphaFeature')).toBeInTheDocument();
    expect(screen.queryByText('betaFeature')).not.toBeInTheDocument();
    expect(screen.queryByText('gammaFeature')).not.toBeInTheDocument();
  });

  it('should toggle a flag and save to localStorage', async () => {
    const user = userEvent.setup();

    render(
      <TestProvider>
        <LabsPage />
      </TestProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('alphaFeature')).toBeInTheDocument();
    });

    // Find alphaFeature card and its switch
    const alphaCard = screen.getByText('alphaFeature').closest('[data-testid="page-contents"]');
    expect(alphaCard).toBeInTheDocument();

    // Find the first switch (alphaFeature is sorted first alphabetically)
    const switches = screen.getAllByRole('switch');
    expect(switches.length).toBe(3);

    // alphaFeature should be disabled (first switch, first in alphabetical order)
    const alphaSwitch = switches[0];
    await user.click(alphaSwitch);

    const storedValue = store.get('grafana.featureToggles');
    expect(storedValue).toContain('alphaFeature=1');
  });

  it('should show overridden badge when flag is overridden', async () => {
    const user = userEvent.setup();

    render(
      <TestProvider>
        <LabsPage />
      </TestProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('alphaFeature')).toBeInTheDocument();
    });

    const switches = screen.getAllByRole('switch');
    await user.click(switches[0]);

    await waitFor(() => {
      expect(screen.getByText('overridden')).toBeInTheDocument();
    });
  });

  it('should handle reset all overrides', async () => {
    const user = userEvent.setup();

    // Pre-set some overrides
    store.set('grafana.featureToggles', 'alphaFeature=1');

    render(
      <TestProvider>
        <LabsPage />
      </TestProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('alphaFeature')).toBeInTheDocument();
    });

    // Should show overridden badge due to preset override
    await waitFor(() => {
      expect(screen.getByText('overridden')).toBeInTheDocument();
    });

    // Click reset button
    const resetButtons = screen.getAllByRole('button');
    const resetButton = resetButtons.find((btn) => btn.textContent?.includes('Reset'));
    expect(resetButton).toBeInTheDocument();

    if (resetButton) {
      await user.click(resetButton);

      await waitFor(() => {
        const storedValue = store.get('grafana.featureToggles');
        expect(storedValue).toBeUndefined();
      });
    }
  });

  it('should show requires reload badge for appropriate flags', async () => {
    render(
      <TestProvider>
        <LabsPage />
      </TestProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('betaFeature')).toBeInTheDocument();
    });

    // betaFeature has requiresRestart: true
    expect(screen.getByText(/requires reload/i)).toBeInTheDocument();
  });
});
