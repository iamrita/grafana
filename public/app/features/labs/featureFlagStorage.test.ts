import { getLocalOverrides, removeLocalOverride, setLocalOverride } from './featureFlagStorage';

describe('featureFlagStorage', () => {
  const LOCAL_STORAGE_KEY = 'grafana.featureToggles';

  beforeEach(() => {
    localStorage.clear();
  });

  describe('getLocalOverrides', () => {
    it('returns empty object when localStorage is empty', () => {
      expect(getLocalOverrides()).toEqual({});
    });

    it('parses single flag with value 1', () => {
      localStorage.setItem(LOCAL_STORAGE_KEY, 'testFlag=1');
      expect(getLocalOverrides()).toEqual({ testFlag: true });
    });

    it('parses single flag with value true', () => {
      localStorage.setItem(LOCAL_STORAGE_KEY, 'testFlag=true');
      expect(getLocalOverrides()).toEqual({ testFlag: true });
    });

    it('parses single flag with value 0', () => {
      localStorage.setItem(LOCAL_STORAGE_KEY, 'testFlag=0');
      expect(getLocalOverrides()).toEqual({ testFlag: false });
    });

    it('parses multiple flags', () => {
      localStorage.setItem(LOCAL_STORAGE_KEY, 'flag1=1,flag2=0,flag3=true');
      expect(getLocalOverrides()).toEqual({
        flag1: true,
        flag2: false,
        flag3: true,
      });
    });

    it('handles empty name gracefully', () => {
      localStorage.setItem(LOCAL_STORAGE_KEY, '=1,validFlag=1');
      expect(getLocalOverrides()).toEqual({ validFlag: true });
    });
  });

  describe('setLocalOverride', () => {
    it('sets a new flag to true', () => {
      setLocalOverride('newFlag', true);
      expect(localStorage.getItem(LOCAL_STORAGE_KEY)).toBe('newFlag=1');
    });

    it('sets a new flag to false', () => {
      setLocalOverride('newFlag', false);
      expect(localStorage.getItem(LOCAL_STORAGE_KEY)).toBe('newFlag=0');
    });

    it('updates existing flag value', () => {
      localStorage.setItem(LOCAL_STORAGE_KEY, 'existingFlag=1');
      setLocalOverride('existingFlag', false);
      expect(localStorage.getItem(LOCAL_STORAGE_KEY)).toBe('existingFlag=0');
    });

    it('adds to existing flags', () => {
      localStorage.setItem(LOCAL_STORAGE_KEY, 'existingFlag=1');
      setLocalOverride('newFlag', true);
      const overrides = getLocalOverrides();
      expect(overrides).toEqual({ existingFlag: true, newFlag: true });
    });
  });

  describe('removeLocalOverride', () => {
    it('removes a flag from localStorage', () => {
      localStorage.setItem(LOCAL_STORAGE_KEY, 'flag1=1,flag2=0');
      removeLocalOverride('flag1');
      expect(getLocalOverrides()).toEqual({ flag2: false });
    });

    it('removes localStorage key when last flag is removed', () => {
      localStorage.setItem(LOCAL_STORAGE_KEY, 'onlyFlag=1');
      removeLocalOverride('onlyFlag');
      expect(localStorage.getItem(LOCAL_STORAGE_KEY)).toBeNull();
    });

    it('does nothing when removing non-existent flag', () => {
      localStorage.setItem(LOCAL_STORAGE_KEY, 'existingFlag=1');
      removeLocalOverride('nonExistentFlag');
      expect(getLocalOverrides()).toEqual({ existingFlag: true });
    });
  });
});
