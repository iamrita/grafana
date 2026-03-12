import {
  getLocalStorageOverrides,
  setFeatureToggleOverride,
  removeFeatureToggleOverride,
  clearAllOverrides,
} from './featureToggleStorage';

const STORAGE_KEY = 'grafana.featureToggles';

describe('featureToggleStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  describe('getLocalStorageOverrides', () => {
    it('should return empty object when no overrides exist', () => {
      const result = getLocalStorageOverrides();
      expect(result).toEqual({});
    });

    it('should parse overrides from localStorage', () => {
      window.localStorage.setItem(STORAGE_KEY, 'featureA=true,featureB=false,featureC=1');
      const result = getLocalStorageOverrides();
      expect(result).toEqual({
        featureA: true,
        featureB: false,
        featureC: true,
      });
    });

    it('should handle empty feature names gracefully', () => {
      window.localStorage.setItem(STORAGE_KEY, 'featureA=true,=false,featureC=1');
      const result = getLocalStorageOverrides();
      expect(result).toEqual({
        featureA: true,
        featureC: true,
      });
    });
  });

  describe('setFeatureToggleOverride', () => {
    it('should set a new override', () => {
      setFeatureToggleOverride('newFeature', true);
      expect(window.localStorage.getItem(STORAGE_KEY)).toBe('newFeature=true');
    });

    it('should update an existing override', () => {
      window.localStorage.setItem(STORAGE_KEY, 'featureA=true');
      setFeatureToggleOverride('featureA', false);
      expect(window.localStorage.getItem(STORAGE_KEY)).toBe('featureA=false');
    });

    it('should add to existing overrides', () => {
      window.localStorage.setItem(STORAGE_KEY, 'featureA=true');
      setFeatureToggleOverride('featureB', false);
      const stored = window.localStorage.getItem(STORAGE_KEY);
      expect(stored).toContain('featureA=true');
      expect(stored).toContain('featureB=false');
    });
  });

  describe('removeFeatureToggleOverride', () => {
    it('should remove an override', () => {
      window.localStorage.setItem(STORAGE_KEY, 'featureA=true,featureB=false');
      removeFeatureToggleOverride('featureA');
      expect(window.localStorage.getItem(STORAGE_KEY)).toBe('featureB=false');
    });

    it('should clear localStorage when removing the last override', () => {
      window.localStorage.setItem(STORAGE_KEY, 'featureA=true');
      removeFeatureToggleOverride('featureA');
      expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('should handle removing non-existent override gracefully', () => {
      window.localStorage.setItem(STORAGE_KEY, 'featureA=true');
      removeFeatureToggleOverride('nonExistent');
      expect(window.localStorage.getItem(STORAGE_KEY)).toBe('featureA=true');
    });
  });

  describe('clearAllOverrides', () => {
    it('should clear all overrides', () => {
      window.localStorage.setItem(STORAGE_KEY, 'featureA=true,featureB=false');
      clearAllOverrides();
      expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('should handle empty storage gracefully', () => {
      clearAllOverrides();
      expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });
});
