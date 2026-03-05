import { store } from '@grafana/data';

import {
  parseFeatureToggleOverrides,
  readFeatureToggleOverrides,
  serializeFeatureToggleOverrides,
  writeFeatureToggleOverrides,
} from './storage';

describe('feature toggle local storage helpers', () => {
  it('parses local storage values into boolean overrides', () => {
    expect(parseFeatureToggleOverrides('flagA=1,flagB=0,flagC=true,flagD=false')).toEqual({
      flagA: true,
      flagB: false,
      flagC: true,
      flagD: false,
    });
  });

  it('serializes overrides to stable key order', () => {
    expect(
      serializeFeatureToggleOverrides({
        zebra: false,
        alpha: true,
      })
    ).toBe('alpha=1,zebra=0');
  });

  it('writes and reads overrides using storage key', () => {
    const state = new Map<string, string>();
    const getSpy = jest.spyOn(store, 'get').mockImplementation((key: string) => state.get(key));
    const setSpy = jest.spyOn(store, 'set').mockImplementation((key: string, value: string | number | boolean | null) => {
      state.set(key, String(value));
    });
    const deleteSpy = jest.spyOn(store, 'delete').mockImplementation((key: string) => {
      state.delete(key);
    });

    writeFeatureToggleOverrides({ alpha: true, beta: false });
    expect(readFeatureToggleOverrides()).toEqual({ alpha: true, beta: false });

    writeFeatureToggleOverrides({});
    expect(readFeatureToggleOverrides()).toEqual({});

    getSpy.mockRestore();
    setSpy.mockRestore();
    deleteSpy.mockRestore();
  });
});
