import { config } from '@grafana/runtime';

import { getSelectableThemes } from './getSelectableThemes';

describe('getSelectableThemes', () => {
  const originalFeatureToggles = { ...config.featureToggles };

  afterEach(() => {
    config.featureToggles = { ...originalFeatureToggles };
  });

  it('should always include bright pink theme', () => {
    config.featureToggles.grafanaconThemes = false;
    const themes = getSelectableThemes();
    const themeIds = themes.map((t) => t.id);

    expect(themeIds).toContain('brightpink');
  });

  it('should include built-in themes (system, dark, light)', () => {
    config.featureToggles.grafanaconThemes = false;
    const themes = getSelectableThemes();
    const themeIds = themes.map((t) => t.id);

    expect(themeIds).toContain('system');
    expect(themeIds).toContain('dark');
    expect(themeIds).toContain('light');
  });

  it('should return 4 themes when grafanaconThemes is disabled', () => {
    config.featureToggles.grafanaconThemes = false;
    const themes = getSelectableThemes();

    expect(themes.length).toBe(4);
  });

  it('should include grafanacon themes when feature toggle is enabled', () => {
    config.featureToggles.grafanaconThemes = true;
    const themes = getSelectableThemes();
    const themeIds = themes.map((t) => t.id);

    expect(themeIds).toContain('desertbloom');
    expect(themeIds).toContain('gildedgrove');
    expect(themeIds).toContain('sapphiredusk');
    expect(themeIds).toContain('tron');
    expect(themeIds).toContain('gloom');
    expect(themeIds).toContain('brightpink');
  });

  it('should return 9 themes when grafanaconThemes is enabled', () => {
    config.featureToggles.grafanaconThemes = true;
    const themes = getSelectableThemes();

    expect(themes.length).toBe(9);
  });

  it('bright pink theme should be marked as extra theme', () => {
    config.featureToggles.grafanaconThemes = false;
    const themes = getSelectableThemes();
    const brightPinkTheme = themes.find((t) => t.id === 'brightpink');

    expect(brightPinkTheme).toBeDefined();
    expect(brightPinkTheme?.isExtra).toBe(true);
  });
});
