import { getContrastRatio } from './colorManipulator';
import { getBuiltInThemes, getThemeById } from './registry';
import oceanblue from './themeDefinitions/oceanblue.json';

describe('theme registry', () => {
  describe('oceanblue', () => {
    it('is registered as an extra theme', () => {
      const themes = getBuiltInThemes(['oceanblue']);
      const theme = themes.find((t) => t.id === 'oceanblue');

      expect(theme).toBeDefined();
      expect(theme?.name).toBe('Ocean blue');
      expect(theme?.isExtra).toBe(true);
    });

    it('is hidden unless explicitly allowed', () => {
      const ids = getBuiltInThemes([]).map((t) => t.id);

      expect(ids).toEqual(['dark', 'light', 'system']);
      expect(ids).not.toContain('oceanblue');
    });

    it('builds a dark theme from the definition', () => {
      const theme = getThemeById('oceanblue');

      expect(theme.name).toBe('Ocean blue');
      expect(theme.isDark).toBe(true);
      expect(theme.colors.mode).toBe('dark');
      expect(theme.colors.primary.main).toBe(oceanblue.colors.primary.main);
      expect(theme.colors.background.primary).toBe(oceanblue.colors.background.primary);
    });

    it('meets WCAG AA contrast for text and interactive elements', () => {
      const { colors } = getThemeById('oceanblue');
      const backgrounds = [colors.background.canvas, colors.background.primary, colors.background.secondary];

      for (const bg of backgrounds) {
        expect(getContrastRatio(colors.text.primary, bg)).toBeGreaterThanOrEqual(4.5);
        expect(getContrastRatio(colors.text.secondary, bg)).toBeGreaterThanOrEqual(4.5);
        expect(getContrastRatio(colors.text.link, bg)).toBeGreaterThanOrEqual(4.5);
        expect(getContrastRatio(colors.primary.text, bg)).toBeGreaterThanOrEqual(4.5);
      }

      expect(getContrastRatio(colors.primary.contrastText, colors.primary.main)).toBeGreaterThanOrEqual(4.5);
      expect(getContrastRatio(colors.secondary.text, colors.secondary.main)).toBeGreaterThanOrEqual(4.5);
    });
  });

  it('falls back to dark for unknown theme ids', () => {
    const theme = getThemeById('does-not-exist');

    expect(theme.name).toBe('Dark');
    expect(theme.isDark).toBe(true);
  });
});
