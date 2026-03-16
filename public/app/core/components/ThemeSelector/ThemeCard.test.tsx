import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createTheme, ThemeRegistryItem } from '@grafana/data';

import { ThemeCard } from './ThemeCard';

describe('ThemeCard', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  const mockTheme: ThemeRegistryItem = {
    id: 'dark',
    name: 'Dark',
    build: createTheme,
  };

  const brightPinkTheme: ThemeRegistryItem = {
    id: 'brightpink',
    name: 'Bright Pink',
    build: () =>
      createTheme({
        colors: {
          mode: 'dark',
          primary: { main: '#FF1493' },
          background: { canvas: '#1a0a14', primary: '#2d1023' },
        },
      }),
    isExtra: true,
  };

  it('should only call onSelect once when clicking the radio button dot', async () => {
    const onSelectMock = jest.fn();

    render(<ThemeCard themeOption={mockTheme} onSelect={onSelectMock} isSelected={false} />);

    // Find the radio button input element
    const radioButtonInput = screen.getByRole('radio');

    // Click the radio button
    await user.click(radioButtonInput);

    // Check that onSelect was called only once
    expect(onSelectMock).toHaveBeenCalledTimes(1);
  });

  it('should render the Bright Pink theme option correctly', () => {
    const onSelectMock = jest.fn();

    render(<ThemeCard themeOption={brightPinkTheme} onSelect={onSelectMock} isSelected={false} />);

    expect(screen.getByText('Bright Pink')).toBeInTheDocument();
    expect(screen.getByRole('radio')).not.toBeChecked();
  });

  it('should select the Bright Pink theme when clicked', async () => {
    const onSelectMock = jest.fn();

    render(<ThemeCard themeOption={brightPinkTheme} onSelect={onSelectMock} isSelected={false} />);

    const radioButtonInput = screen.getByRole('radio');
    await user.click(radioButtonInput);

    expect(onSelectMock).toHaveBeenCalledTimes(1);
  });

  it('should render the Bright Pink theme as selected when isSelected is true', () => {
    const onSelectMock = jest.fn();

    render(<ThemeCard themeOption={brightPinkTheme} onSelect={onSelectMock} isSelected={true} />);

    expect(screen.getByText('Bright Pink')).toBeInTheDocument();
    expect(screen.getByRole('radio')).toBeChecked();
  });
});
