import { config } from '@grafana/runtime';

import { getSelectableThemes } from './getSelectableThemes';

describe('getSelectableThemes', () => {
  const originalFeatureToggles = config.featureToggles;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    config.featureToggles = originalFeatureToggles;
  });

  describe('when grafanaconThemes is disabled', () => {
    beforeEach(() => {
      config.featureToggles = { ...originalFeatureToggles, grafanaconThemes: false };
    });

    it('should include pinkglow theme', () => {
      const themes = getSelectableThemes();
      const pinkglowTheme = themes.find((theme) => theme.id === 'pinkglow');
      expect(pinkglowTheme).toBeDefined();
      expect(pinkglowTheme?.name).toBe('Pink Glow');
    });

    it('should not include conference themes', () => {
      const themes = getSelectableThemes();
      const conferenceThemeIds = ['desertbloom', 'gildedgrove', 'sapphiredusk', 'tron', 'gloom'];
      conferenceThemeIds.forEach((themeId) => {
        const theme = themes.find((t) => t.id === themeId);
        expect(theme).toBeUndefined();
      });
    });

    it('should include built-in themes (system, dark, light)', () => {
      const themes = getSelectableThemes();
      const builtInThemeIds = ['system', 'dark', 'light'];
      builtInThemeIds.forEach((themeId) => {
        const theme = themes.find((t) => t.id === themeId);
        expect(theme).toBeDefined();
      });
    });
  });

  describe('when grafanaconThemes is enabled', () => {
    beforeEach(() => {
      config.featureToggles = { ...originalFeatureToggles, grafanaconThemes: true };
    });

    it('should include pinkglow theme', () => {
      const themes = getSelectableThemes();
      const pinkglowTheme = themes.find((theme) => theme.id === 'pinkglow');
      expect(pinkglowTheme).toBeDefined();
      expect(pinkglowTheme?.name).toBe('Pink Glow');
    });

    it('should include conference themes', () => {
      const themes = getSelectableThemes();
      const conferenceThemeIds = ['desertbloom', 'gildedgrove', 'sapphiredusk', 'tron', 'gloom'];
      conferenceThemeIds.forEach((themeId) => {
        const theme = themes.find((t) => t.id === themeId);
        expect(theme).toBeDefined();
      });
    });
  });
});
