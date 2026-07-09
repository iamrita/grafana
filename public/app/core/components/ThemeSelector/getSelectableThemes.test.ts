import { config } from '@grafana/runtime';

import { getSelectableThemes } from './getSelectableThemes';

describe('getSelectableThemes', () => {
  beforeEach(() => {
    config.featureToggles.colorblindThemes = false;
    config.featureToggles.grafanaconThemes = false;
  });

  it('should always include core themes', () => {
    const themes = getSelectableThemes();

    expect(themes.map((theme) => theme.id)).toEqual(['dark', 'light', 'system']);
  });

  it('should include colorblind themes when the feature toggle is enabled', () => {
    config.featureToggles.colorblindThemes = true;

    const themes = getSelectableThemes();

    expect(themes.map((theme) => theme.id)).toEqual(
      expect.arrayContaining([
        'dark',
        'light',
        'system',
        'deuteranopia_protanopia_dark',
        'deuteranopia_protanopia_light',
        'tritanopia_dark',
        'tritanopia_light',
      ])
    );
  });

  it('should include GrafanaCon themes when the feature toggle is enabled', () => {
    config.featureToggles.grafanaconThemes = true;

    const themes = getSelectableThemes();

    expect(themes.map((theme) => theme.id)).toEqual(
      expect.arrayContaining(['desertbloom', 'gildedgrove', 'sapphiredusk', 'tron', 'gloom'])
    );
  });
});
