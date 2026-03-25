import { getBuiltInThemes, getThemeById } from './registry';

describe('theme registry', () => {
  describe('brightpink theme', () => {
    it('builds a dark theme with bright pink primary', () => {
      const theme = getThemeById('brightpink');
      expect(theme.isDark).toBe(true);
      expect(theme.colors.primary.main.toLowerCase()).toBe('#ff1493');
    });

    it('is listed when included in allowed extras', () => {
      const themes = getBuiltInThemes(['brightpink']);
      expect(themes.map((t) => t.id)).toContain('brightpink');
    });

    it('is not listed when not in allowed extras', () => {
      const themes = getBuiltInThemes([]);
      expect(themes.map((t) => t.id)).not.toContain('brightpink');
    });
  });
});
