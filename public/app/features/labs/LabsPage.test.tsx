import { screen, render } from 'test/test-utils';

import { store } from '@grafana/data';
import config from 'app/core/config';
import { contextSrv } from 'app/core/services/context_srv';

import LabsPage from './LabsPage';
import { fetchFeatureMetadata } from './api';

jest.mock('./api', () => ({
  fetchFeatureMetadata: jest.fn(),
}));

const mockedFetchFeatureMetadata = fetchFeatureMetadata as jest.MockedFunction<typeof fetchFeatureMetadata>;

describe('LabsPage', () => {
  beforeEach(() => {
    mockedFetchFeatureMetadata.mockResolvedValue([
      {
        name: 'alphaToggle',
        description: 'Alpha test feature',
        stage: 'experimental',
        owner: 'team-a',
        requiresRestart: false,
      },
      {
        name: 'restartToggle',
        description: 'Needs restart',
        stage: 'public_preview',
        owner: 'team-b',
        requiresRestart: true,
      },
    ]);
    config.featureToggles = {};
    jest.spyOn(contextSrv, 'hasPermission').mockReturnValue(true);
    jest.spyOn(store, 'get').mockReturnValue(null);
    jest.spyOn(store, 'set').mockImplementation(() => undefined);
    jest.spyOn(store, 'delete').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders fetched feature flags', async () => {
    render(<LabsPage />, {
      preloadedState: {
        navIndex: { labs: { id: 'labs', text: 'Labs' } },
      },
    });

    expect(await screen.findByText('alphaToggle')).toBeInTheDocument();
    expect(screen.getByText('Alpha test feature')).toBeInTheDocument();
  });

  it('filters rows with the search input', async () => {
    const { user } = render(<LabsPage />, {
      preloadedState: {
        navIndex: { labs: { id: 'labs', text: 'Labs' } },
      },
    });

    const search = await screen.findByPlaceholderText('Search by name, description, or owner');
    await user.type(search, 'restart');

    expect(screen.queryByText('alphaToggle')).not.toBeInTheDocument();
    expect(screen.getByText('restartToggle')).toBeInTheDocument();
  });

  it('disables toggles in read-only mode', async () => {
    jest.spyOn(contextSrv, 'hasPermission').mockReturnValue(false);

    render(<LabsPage />, {
      preloadedState: {
        navIndex: { labs: { id: 'labs', text: 'Labs' } },
      },
    });

    const switches = await screen.findAllByRole('switch');
    expect(switches[0]).toBeDisabled();
    expect(screen.getByText('Read-only mode')).toBeInTheDocument();
  });

  it('writes to localStorage when toggling a writable flag', async () => {
    const setItemSpy = jest.spyOn(store, 'set');
    const { user } = render(<LabsPage />, {
      preloadedState: {
        navIndex: { labs: { id: 'labs', text: 'Labs' } },
      },
    });

    const switches = await screen.findAllByRole('switch');
    await user.click(switches[0]);

    expect(setItemSpy).toHaveBeenCalled();
  });
});
