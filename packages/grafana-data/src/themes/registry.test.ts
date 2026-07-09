import { getThemeById } from './registry';

describe('theme registry', () => {
  it('registers the ocean blue extra theme', () => {
    const theme = getThemeById('oceanblue');

    expect(theme.name).toBe('Ocean blue');
    expect(theme.isDark).toBe(true);
    expect(theme.colors.primary.main).toBe('#26C6DA');
  });
});
