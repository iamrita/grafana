import { getBuiltInThemes, getThemeById } from './registry';

describe('theme registry', () => {
  it('registers and builds the ocean blue theme', () => {
    const theme = getThemeById('oceanblue');

    expect(theme.name).toBe('Ocean blue');
    expect(theme.colors.mode).toBe('dark');
    expect(theme.colors.primary.main).toBe('#2EC4B6');
    expect(theme.colors.background.canvas).toBe('#0A1628');
    expect(theme.colors.text.primary).toBe('#E8F4F8');
  });

  it('includes ocean blue in built-in themes when allowed', () => {
    const themes = getBuiltInThemes(['oceanblue']);
    const oceanBlue = themes.find((theme) => theme.id === 'oceanblue');

    expect(oceanBlue).toBeDefined();
    expect(oceanBlue?.isExtra).toBe(true);
    expect(oceanBlue?.name).toBe('Ocean blue');
  });

  it('excludes ocean blue from built-in themes when not allowed', () => {
    const themes = getBuiltInThemes([]);

    expect(themes.find((theme) => theme.id === 'oceanblue')).toBeUndefined();
  });
});
