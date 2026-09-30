import { config } from '@grafana/runtime';

import { getSelectableThemes } from './getSelectableThemes';

describe('getSelectableThemes', () => {
  const originalToggles = { ...config.featureToggles };

  afterEach(() => {
    config.featureToggles = { ...originalToggles };
  });

  it('always returns the built-in themes', () => {
    config.featureToggles = { ...originalToggles, grafanaconThemes: false, colorblindThemes: false };

    const ids = getSelectableThemes().map((t) => t.id);

    expect(ids).toEqual(['dark', 'light', 'system']);
  });

  it('exposes oceanblue when grafanaconThemes is enabled', () => {
    config.featureToggles = { ...originalToggles, grafanaconThemes: true };

    const themes = getSelectableThemes();
    const oceanblue = themes.find((t) => t.id === 'oceanblue');

    expect(oceanblue).toBeDefined();
    expect(oceanblue?.name).toBe('Ocean blue');
    expect(oceanblue?.isExtra).toBe(true);
  });

  it('hides oceanblue when grafanaconThemes is disabled', () => {
    config.featureToggles = { ...originalToggles, grafanaconThemes: false, colorblindThemes: true };

    const ids = getSelectableThemes().map((t) => t.id);

    expect(ids).not.toContain('oceanblue');
    expect(ids).toContain('tritanopia_dark');
  });

  it('lists built-in themes before extra themes', () => {
    config.featureToggles = { ...originalToggles, grafanaconThemes: true };

    const themes = getSelectableThemes();
    const firstExtra = themes.findIndex((t) => t.isExtra);

    expect(themes.slice(0, firstExtra).every((t) => !t.isExtra)).toBe(true);
    expect(themes.slice(firstExtra).every((t) => t.isExtra)).toBe(true);
  });
});
