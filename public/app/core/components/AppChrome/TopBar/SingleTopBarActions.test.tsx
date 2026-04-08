import { render, screen } from '@testing-library/react';
import { type ReactElement } from 'react';

import { Components } from '@grafana/e2e-selectors';
import { ScopesContextValue } from '@grafana/runtime';

import { ExtensionSidebarContext } from '../ExtensionSidebar/ExtensionSidebarProvider';

import { SingleTopBarActions } from './SingleTopBarActions';

jest.mock('app/features/scopes/selector/ScopesSelector', () => ({
  ScopesSelector: () => <div data-testid="scopes-selector-mock">Scopes</div>,
}));

const extensionSidebarDefaults = {
  isOpen: false,
  dockedComponentId: undefined as string | undefined,
  setDockedComponentId: jest.fn(),
  availableComponents: new Map(),
  extensionSidebarWidth: 240,
  setExtensionSidebarWidth: jest.fn(),
};

function renderWithExtensionSidebar(ui: ReactElement, contextOverrides?: Partial<typeof extensionSidebarDefaults>) {
  return render(
    <ExtensionSidebarContext.Provider value={{ ...extensionSidebarDefaults, ...contextOverrides }}>
      {ui}
    </ExtensionSidebarContext.Provider>
  );
}

describe('SingleTopBarActions', () => {
  it('renders the nav toolbar container', () => {
    renderWithExtensionSidebar(<SingleTopBarActions />);
    expect(screen.getByTestId(Components.NavToolbar.container)).toBeInTheDocument();
  });

  it('renders actions and breadcrumb actions when provided', () => {
    renderWithExtensionSidebar(
      <SingleTopBarActions
        breadcrumbActions={<span>Breadcrumb</span>}
        actions={<button type="button">Save</button>}
      />
    );
    expect(screen.getByText('Breadcrumb')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('renders scopes selector when scopes are enabled', () => {
    const scopes = {
      state: {
        enabled: true,
        drawerOpened: false,
        loading: false,
        readOnly: false,
        value: [],
      },
      stateObservable: {} as ScopesContextValue['stateObservable'],
      changeScopes: jest.fn(),
      setReadOnly: jest.fn(),
      setEnabled: jest.fn(),
    } satisfies ScopesContextValue;

    renderWithExtensionSidebar(<SingleTopBarActions scopes={scopes} />);
    expect(screen.getByTestId('scopes-selector-mock')).toBeInTheDocument();
  });

  it('does not render scopes selector when scopes are disabled', () => {
    const scopes = {
      state: {
        enabled: false,
        drawerOpened: false,
        loading: false,
        readOnly: false,
        value: [],
      },
      stateObservable: {} as ScopesContextValue['stateObservable'],
      changeScopes: jest.fn(),
      setReadOnly: jest.fn(),
      setEnabled: jest.fn(),
    } satisfies ScopesContextValue;

    renderWithExtensionSidebar(<SingleTopBarActions scopes={scopes} />);
    expect(screen.queryByTestId('scopes-selector-mock')).not.toBeInTheDocument();
  });

  it('applies constrained layout when extension sidebar is open', () => {
    renderWithExtensionSidebar(<SingleTopBarActions actions={<span>Act</span>} />, {
      isOpen: true,
      extensionSidebarWidth: 200,
    });
    const toolbar = screen.getByTestId(Components.NavToolbar.container);
    expect(getComputedStyle(toolbar).maxWidth).toBe('calc(100% - 200px)');
  });
});
