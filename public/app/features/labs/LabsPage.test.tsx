import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LabsPage } from './LabsPage';

const mockFlags = {
  flags: [
    {
      name: 'testExperimental',
      description: 'An experimental feature',
      stage: 'experimental',
      enabled: false,
      requiresRestart: false,
    },
    {
      name: 'testPreview',
      description: 'A preview feature',
      stage: 'preview',
      enabled: true,
      requiresRestart: false,
    },
    {
      name: 'testGA',
      description: 'A GA feature',
      stage: 'GA',
      enabled: true,
      requiresRestart: true,
    },
    {
      name: 'testDeprecated',
      description: 'A deprecated feature',
      stage: 'deprecated',
      enabled: false,
      requiresRestart: false,
    },
  ],
};

jest.mock('app/core/components/Page/Page', () => {
  const PageComponent = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="page">{children}</div>
  );
  PageComponent.Contents = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="page-contents">{children}</div>
  );
  return { Page: PageComponent };
});

describe('LabsPage', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockFlags),
    });
  });

  it('renders feature flags after loading', async () => {
    await act(async () => {
      render(<LabsPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('testExperimental')).toBeInTheDocument();
    });

    expect(screen.getByText('An experimental feature')).toBeInTheDocument();
    expect(screen.getByText('testPreview')).toBeInTheDocument();
    expect(screen.getAllByText('testGA').length).toBeGreaterThan(0);
    expect(screen.getByText('testDeprecated')).toBeInTheDocument();
  });

  it('shows error when fetch fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      statusText: 'Internal Server Error',
    });

    await act(async () => {
      render(<LabsPage />);
    });

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch feature flags/)).toBeInTheDocument();
    });
  });

  it('filters flags by search query', async () => {
    await act(async () => {
      render(<LabsPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('testExperimental')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search feature flags...');
    await userEvent.type(searchInput, 'experimental');

    expect(screen.getByText('testExperimental')).toBeInTheDocument();
    expect(screen.queryByText('testPreview')).not.toBeInTheDocument();
    expect(screen.queryByText('testGA')).not.toBeInTheDocument();
  });

  it('filters flags by stage', async () => {
    await act(async () => {
      render(<LabsPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('testExperimental')).toBeInTheDocument();
    });

    const experimentalButton = screen.getByRole('radio', { name: 'Experimental' });
    await act(async () => {
      fireEvent.click(experimentalButton);
    });

    expect(screen.getByText('testExperimental')).toBeInTheDocument();
    expect(screen.queryByText('testPreview')).not.toBeInTheDocument();
    expect(screen.queryByText('testGA')).not.toBeInTheDocument();
  });

  it('shows empty state when no flags match filters', async () => {
    await act(async () => {
      render(<LabsPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('testExperimental')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search feature flags...');
    await userEvent.type(searchInput, 'nonexistentflag');

    expect(screen.getByText('No feature flags found matching your criteria.')).toBeInTheDocument();
  });
});
