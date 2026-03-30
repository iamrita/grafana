import { store } from '@grafana/data';

import { getFeatureToggleLocalStorageMap, writeFeatureToggleLocalStorageMap } from './featureToggleLocalStorage';

describe('featureToggleLocalStorage', () => {
  const key = 'grafana.featureToggles.test';

  beforeEach(() => {
    store.delete(key);
  });

  afterEach(() => {
    store.delete(key);
  });

  it('parseFeatureToggleLocalStorage parses comma-separated pairs', () => {
    store.set(key, 'foo=true,bar=0,baz=1');
    expect(getFeatureToggleLocalStorageMap(key)).toEqual({
      foo: true,
      bar: false,
      baz: true,
    });
  });

  it('writing merges and serializes deterministically', () => {
    writeFeatureToggleLocalStorageMap({ a: true, b: false }, key);
    expect(store.get(key)).toBe('a=true,b=false');
    writeFeatureToggleLocalStorageMap({ b: true, c: false }, key);
    expect(getFeatureToggleLocalStorageMap(key)).toEqual({ a: true, b: true, c: false });
  });
});
