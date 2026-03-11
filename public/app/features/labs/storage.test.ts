import { store } from '@grafana/data';

import {
  parseFeatureToggleOverrides,
  serializeFeatureToggleOverrides,
  writeFeatureToggleOverrides,
} from './storage';

describe('labs storage helpers', () => {
  it('parses valid values and keeps the latest duplicate value', () => {
    const parsed = parseFeatureToggleOverrides('alpha=true,beta=0,alpha=false');
    expect(parsed.overrides).toEqual({ alpha: false, beta: false });
    expect(parsed.invalidTokens).toEqual([]);
  });

  it('collects invalid tokens', () => {
    const parsed = parseFeatureToggleOverrides('valid=true,broken,also=maybe');
    expect(parsed.overrides).toEqual({ valid: true });
    expect(parsed.invalidTokens).toEqual(['broken', 'also=maybe']);
  });

  it('serializes entries in stable sorted order', () => {
    expect(serializeFeatureToggleOverrides({ zebra: true, alpha: false })).toBe('alpha=false,zebra=true');
  });

  it('writes an empty payload by removing localStorage key', () => {
    const deleteSpy = jest.spyOn(store, 'delete');
    const setSpy = jest.spyOn(store, 'set');

    const error = writeFeatureToggleOverrides({});
    expect(error).toBeUndefined();
    expect(deleteSpy).toHaveBeenCalled();
    expect(setSpy).not.toHaveBeenCalled();
  });
});
