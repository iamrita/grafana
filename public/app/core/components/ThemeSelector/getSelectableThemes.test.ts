import { config } from '@grafana/runtime';

import { getSelectableThemes } from './getSelectableThemes';

describe('getSelectableThemes', () => {
  const originalGrafanaconThemes = config.featureToggles.grafanaconThemes;

  afterEach(() => {
    config.featureToggles.grafanaconThemes = originalGrafanaconThemes;
  });

  it('includes ocean blue when grafanaconThemes is enabled', () => {
    config.featureToggles.grafanaconThemes = true;

    const themeIds = getSelectableThemes().map((theme) => theme.id);

    expect(themeIds).toContain('oceanblue');
  });

  it('excludes ocean blue when grafanaconThemes is disabled', () => {
    config.featureToggles.grafanaconThemes = false;

    const themeIds = getSelectableThemes().map((theme) => theme.id);

    expect(themeIds).not.toContain('oceanblue');
  });
});
