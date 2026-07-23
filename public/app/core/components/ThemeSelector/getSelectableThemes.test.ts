import type { FeatureToggles } from '@grafana/data';
import { config } from '@grafana/runtime';

import { getSelectableThemes } from './getSelectableThemes';

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  config: {
    featureToggles: {} as Partial<FeatureToggles>,
  },
}));

describe('getSelectableThemes', () => {
  beforeEach(() => {
    config.featureToggles = {};
  });

  it('includes ocean blue when grafanaconThemes is enabled', () => {
    config.featureToggles.grafanaconThemes = true;

    const themes = getSelectableThemes();

    expect(themes.some((theme) => theme.id === 'oceanblue')).toBe(true);
  });

  it('excludes ocean blue when grafanaconThemes is disabled', () => {
    config.featureToggles.grafanaconThemes = false;

    const themes = getSelectableThemes();

    expect(themes.some((theme) => theme.id === 'oceanblue')).toBe(false);
  });
});
