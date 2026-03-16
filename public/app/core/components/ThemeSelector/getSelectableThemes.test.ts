import { config } from '@grafana/runtime';

import { getSelectableThemes } from './getSelectableThemes';

describe('getSelectableThemes', () => {
  const originalFeatureToggles = { ...config.featureToggles };

  afterEach(() => {
    config.featureToggles = { ...originalFeatureToggles };
  });

  describe('when grafanaconThemes feature flag is disabled', () => {
    beforeEach(() => {
      config.featureToggles.grafanaconThemes = false;
    });

    it('should return only built-in themes', () => {
      const themes = getSelectableThemes();
      const themeIds = themes.map((t) => t.id);

      expect(themeIds).toContain('system');
      expect(themeIds).toContain('dark');
      expect(themeIds).toContain('light');
      expect(themeIds).not.toContain('brightpink');
      expect(themeIds).not.toContain('desertbloom');
    });
  });

  describe('when grafanaconThemes feature flag is enabled', () => {
    beforeEach(() => {
      config.featureToggles.grafanaconThemes = true;
    });

    it('should return built-in themes and extra themes including brightpink', () => {
      const themes = getSelectableThemes();
      const themeIds = themes.map((t) => t.id);

      expect(themeIds).toContain('system');
      expect(themeIds).toContain('dark');
      expect(themeIds).toContain('light');
      expect(themeIds).toContain('brightpink');
      expect(themeIds).toContain('desertbloom');
      expect(themeIds).toContain('gildedgrove');
      expect(themeIds).toContain('sapphiredusk');
      expect(themeIds).toContain('tron');
      expect(themeIds).toContain('gloom');
    });

    it('should have correct properties for the brightpink theme', () => {
      const themes = getSelectableThemes();
      const brightpinkTheme = themes.find((t) => t.id === 'brightpink');

      expect(brightpinkTheme).toBeDefined();
      expect(brightpinkTheme?.name).toBe('Bright pink');
      expect(brightpinkTheme?.isExtra).toBe(true);
    });

    it('should build a valid theme object for brightpink', () => {
      const themes = getSelectableThemes();
      const brightpinkTheme = themes.find((t) => t.id === 'brightpink');
      const builtTheme = brightpinkTheme?.build();

      expect(builtTheme).toBeDefined();
      expect(builtTheme?.colors.mode).toBe('light');
      expect(builtTheme?.colors.primary.main).toBe('#FF1493');
      expect(builtTheme?.colors.background.canvas).toBe('#FFF0F5');
    });
  });
});
