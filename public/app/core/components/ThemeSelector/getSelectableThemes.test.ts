import { config } from '@grafana/runtime';

import { getSelectableThemes } from './getSelectableThemes';

describe('getSelectableThemes', () => {
  const originalFeatureToggles = { ...config.featureToggles };

  afterEach(() => {
    config.featureToggles = { ...originalFeatureToggles };
  });

  it('should not include extra themes when grafanaconThemes feature toggle is disabled', () => {
    config.featureToggles.grafanaconThemes = false;

    const themes = getSelectableThemes();
    const themeIds = themes.map((t) => t.id);

    expect(themeIds).not.toContain('brightpink');
    expect(themeIds).not.toContain('desertbloom');
    expect(themeIds).not.toContain('gildedgrove');
  });

  it('should include brightpink theme when grafanaconThemes feature toggle is enabled', () => {
    config.featureToggles.grafanaconThemes = true;

    const themes = getSelectableThemes();
    const themeIds = themes.map((t) => t.id);

    expect(themeIds).toContain('brightpink');
  });

  it('should include all extra themes when grafanaconThemes feature toggle is enabled', () => {
    config.featureToggles.grafanaconThemes = true;

    const themes = getSelectableThemes();
    const themeIds = themes.map((t) => t.id);

    expect(themeIds).toContain('brightpink');
    expect(themeIds).toContain('desertbloom');
    expect(themeIds).toContain('gildedgrove');
    expect(themeIds).toContain('sapphiredusk');
    expect(themeIds).toContain('tron');
    expect(themeIds).toContain('gloom');
  });

  it('should always include built-in themes', () => {
    config.featureToggles.grafanaconThemes = false;

    const themes = getSelectableThemes();
    const themeIds = themes.map((t) => t.id);

    expect(themeIds).toContain('dark');
    expect(themeIds).toContain('light');
    expect(themeIds).toContain('system');
  });
});
