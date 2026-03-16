import { getBuiltInThemes, getThemeById } from './registry';

describe('Theme Registry', () => {
  describe('getThemeById', () => {
    it('should return the dark theme when requested', () => {
      const theme = getThemeById('dark');
      expect(theme.isDark).toBe(true);
      expect(theme.isLight).toBe(false);
    });

    it('should return the light theme when requested', () => {
      const theme = getThemeById('light');
      expect(theme.isLight).toBe(true);
      expect(theme.isDark).toBe(false);
    });

    it('should return the bright pink theme when requested', () => {
      const theme = getThemeById('brightpink');
      expect(theme.name).toBe('Bright pink');
      expect(theme.isLight).toBe(true);
      expect(theme.colors.primary.main).toBe('#FF1493');
    });

    it('should fall back to dark theme for unknown theme id', () => {
      const theme = getThemeById('nonexistent');
      expect(theme.isDark).toBe(true);
    });
  });

  describe('getBuiltInThemes', () => {
    it('should return built-in themes (system, dark, light) when no extras are allowed', () => {
      const themes = getBuiltInThemes([]);
      const themeIds = themes.map((t) => t.id);
      expect(themeIds).toContain('system');
      expect(themeIds).toContain('dark');
      expect(themeIds).toContain('light');
      expect(themes.length).toBe(3);
    });

    it('should include bright pink theme when it is in allowed extras', () => {
      const themes = getBuiltInThemes(['brightpink']);
      const themeIds = themes.map((t) => t.id);
      expect(themeIds).toContain('brightpink');
      expect(themes.length).toBe(4);
    });

    it('should include multiple extra themes when allowed', () => {
      const themes = getBuiltInThemes(['brightpink', 'synthwave', 'desertbloom']);
      const themeIds = themes.map((t) => t.id);
      expect(themeIds).toContain('brightpink');
      expect(themeIds).toContain('synthwave');
      expect(themeIds).toContain('desertbloom');
      expect(themes.length).toBe(6);
    });

    it('should sort built-in themes before extra themes', () => {
      const themes = getBuiltInThemes(['brightpink']);
      const builtInIds = ['system', 'dark', 'light'];
      const builtInThemes = themes.filter((t) => builtInIds.includes(t.id));
      const extraThemes = themes.filter((t) => !builtInIds.includes(t.id));

      builtInThemes.forEach((theme) => {
        const builtInIndex = themes.indexOf(theme);
        extraThemes.forEach((extraTheme) => {
          const extraIndex = themes.indexOf(extraTheme);
          expect(builtInIndex).toBeLessThan(extraIndex);
        });
      });
    });
  });
});
