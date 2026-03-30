import { config } from '@grafana/runtime';

import { getSelectableThemes } from './getSelectableThemes';

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  config: {
    ...jest.requireActual('@grafana/runtime').config,
    featureToggles: {
      ...jest.requireActual('@grafana/runtime').config.featureToggles,
      colorblindThemes: false,
      grafanaconThemes: false,
    },
  },
}));

describe('getSelectableThemes', () => {
  it('always exposes the brightpink theme without feature toggles', () => {
    expect(config.featureToggles.colorblindThemes).toBe(false);
    expect(config.featureToggles.grafanaconThemes).toBe(false);

    const themes = getSelectableThemes();
    const ids = themes.map((t) => t.id);

    expect(ids).toContain('brightpink');
    expect(ids).toContain('dark');
    expect(ids).toContain('light');
    expect(ids).not.toContain('desertbloom');
  });
});
