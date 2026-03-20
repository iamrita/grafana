import {
  FEATURE_TOGGLES_LOCAL_STORAGE_KEY,
  applyFeatureToggleToConfig,
  parseFeatureToggleOverrides,
  restoreFeatureTogglesFromServerState,
  stringifyFeatureToggleOverrides,
} from './labsUtils';

describe('labsUtils', () => {
  describe('parseFeatureToggleOverrides / stringifyFeatureToggleOverrides', () => {
    it('round-trips overrides with stable ordering', () => {
      const parsed = parseFeatureToggleOverrides('b=true,a=false');
      expect(parsed).toEqual({ b: true, a: false });
      expect(stringifyFeatureToggleOverrides(parsed)).toBe('a=false,b=true');
    });

    it('treats 1 as true', () => {
      expect(parseFeatureToggleOverrides('x=1')).toEqual({ x: true });
    });
  });

  describe('applyFeatureToggleToConfig', () => {
    it('sets a toggle on the config object', () => {
      const ft: Record<string, boolean | undefined> = {};
      applyFeatureToggleToConfig(ft, 'myFlag', true);
      expect(ft.myFlag).toBe(true);
      applyFeatureToggleToConfig(ft, 'myFlag', false);
      expect(ft.myFlag).toBe(false);
    });
  });

  describe('restoreFeatureTogglesFromServerState', () => {
    it('applies server enabled defaults for each flag', () => {
      const ft: Record<string, boolean | undefined> = { alpha: true, beta: true };
      restoreFeatureTogglesFromServerState(ft, [
        { name: 'alpha', enabled: false },
        { name: 'beta', enabled: true },
      ]);
      expect(ft.alpha).toBe(false);
      expect(ft.beta).toBe(true);
    });
  });
});

describe('FEATURE_TOGGLES_LOCAL_STORAGE_KEY', () => {
  it('matches runtime boot key', () => {
    expect(FEATURE_TOGGLES_LOCAL_STORAGE_KEY).toBe('grafana.featureToggles');
  });
});
