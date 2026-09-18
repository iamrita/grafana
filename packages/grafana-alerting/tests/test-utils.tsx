/**
 * Package-local test helpers. Prefer `@grafana/test-utils` when a shared primitive already exists.
 */
import { type RenderOptions, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { getDefaultWrapper, store } from './provider';

import '@testing-library/jest-dom';

/**
 * Combobox measures layout via getBoundingClientRect. jsdom reports 0x0 by default,
 * which hides the option list, so tests that open a Combobox need this stub.
 */
export const mockComboboxLayout = () => {
  const mockGetBoundingClientRect = jest.fn(() => ({
    width: 120,
    height: 120,
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  }));

  Object.defineProperty(Element.prototype, 'getBoundingClientRect', {
    configurable: true,
    value: mockGetBoundingClientRect,
  });

  return mockGetBoundingClientRect;
};

/**
 * Extended [@testing-library/react render](https://testing-library.com/docs/react-testing-library/api/#render)
 * method which wraps the passed element in all of the necessary Providers,
 * so it can render correctly in the context of the application
 */
const customRender = (
  ui: React.ReactNode,
  renderOptions: RenderOptions = {}
): {
  renderResult: ReturnType<typeof render>;
  user: ReturnType<typeof userEvent.setup>;
  store: typeof store;
} => {
  const user = userEvent.setup();
  const Providers = renderOptions.wrapper || getDefaultWrapper();

  return {
    renderResult: render(ui, { wrapper: Providers, ...renderOptions }),
    user,
    store,
  };
};

export * from '@testing-library/react';
export { customRender as render, userEvent };
