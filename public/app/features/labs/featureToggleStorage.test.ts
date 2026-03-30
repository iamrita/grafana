import { getLocalStorageOverrides, removeLocalStorageOverride, setLocalStorageOverride } from './featureToggleStorage';

const STORAGE_KEY = 'grafana.featureToggles';

describe('featureToggleStorage', () => {
  let getItemSpy: jest.SpyInstance;
  let setItemSpy: jest.SpyInstance;
  let removeItemSpy: jest.SpyInstance;

  beforeEach(() => {
    getItemSpy = jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    setItemSpy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
    removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getLocalStorageOverrides', () => {
    it('returns empty object when localStorage is empty', () => {
      expect(getLocalStorageOverrides()).toEqual({});
    });

    it('parses comma-separated key=value pairs', () => {
      getItemSpy.mockReturnValue('featureA=true,featureB=false');
      expect(getLocalStorageOverrides()).toEqual({
        featureA: true,
        featureB: false,
      });
    });

    it('treats "1" as true', () => {
      getItemSpy.mockReturnValue('featureA=1');
      expect(getLocalStorageOverrides()).toEqual({ featureA: true });
    });

    it('treats values other than "true" and "1" as false', () => {
      getItemSpy.mockReturnValue('featureA=0,featureB=no');
      expect(getLocalStorageOverrides()).toEqual({
        featureA: false,
        featureB: false,
      });
    });

    it('handles single flag', () => {
      getItemSpy.mockReturnValue('onlyFlag=true');
      expect(getLocalStorageOverrides()).toEqual({ onlyFlag: true });
    });

    it('skips empty segments from trailing commas', () => {
      getItemSpy.mockReturnValue('flagA=true,,flagB=false,');
      expect(getLocalStorageOverrides()).toEqual({
        flagA: true,
        flagB: false,
      });
    });

    it('skips entries without = separator', () => {
      getItemSpy.mockReturnValue('flagA=true,malformed,flagB=false');
      expect(getLocalStorageOverrides()).toEqual({
        flagA: true,
        flagB: false,
      });
    });

    it('skips entries with empty key', () => {
      getItemSpy.mockReturnValue('=true,flagA=false');
      expect(getLocalStorageOverrides()).toEqual({ flagA: false });
    });
  });

  describe('setLocalStorageOverride', () => {
    it('writes a new flag when localStorage is empty', () => {
      getItemSpy.mockReturnValue(null);
      setLocalStorageOverride('newFlag', true);
      expect(setItemSpy).toHaveBeenCalledWith(STORAGE_KEY, 'newFlag=true');
    });

    it('appends to existing flags', () => {
      getItemSpy.mockReturnValue('existing=true');
      setLocalStorageOverride('another', false);
      const written = setItemSpy.mock.calls[0][1] as string;
      expect(written).toContain('existing=true');
      expect(written).toContain('another=false');
    });

    it('updates an existing flag without losing others', () => {
      getItemSpy.mockReturnValue('flagA=true,flagB=false');
      setLocalStorageOverride('flagA', false);
      const written = setItemSpy.mock.calls[0][1] as string;
      expect(written).toContain('flagA=false');
      expect(written).toContain('flagB=false');
    });
  });

  describe('removeLocalStorageOverride', () => {
    it('removes one flag and keeps others', () => {
      getItemSpy.mockReturnValue('flagA=true,flagB=false');
      removeLocalStorageOverride('flagA');
      expect(setItemSpy).toHaveBeenCalledWith(STORAGE_KEY, 'flagB=false');
    });

    it('calls removeItem when last flag is removed', () => {
      getItemSpy.mockReturnValue('onlyFlag=true');
      removeLocalStorageOverride('onlyFlag');
      expect(removeItemSpy).toHaveBeenCalledWith(STORAGE_KEY);
    });

    it('is a no-op when flag does not exist', () => {
      getItemSpy.mockReturnValue('other=true');
      removeLocalStorageOverride('nonexistent');
      const written = setItemSpy.mock.calls[0][1] as string;
      expect(written).toContain('other=true');
    });
  });
});
