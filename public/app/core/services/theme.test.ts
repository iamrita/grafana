import { createTheme } from '@grafana/data';
import { config } from '@grafana/runtime';

import { appEvents } from '../app_events';
import { contextSrv } from '../services/context_srv';

import { PreferencesService } from './PreferencesService';
import {
  changeTheme,
  getUserThemePreference,
  initSystemThemeListener,
  isSystemThemePreference,
  resetSystemThemeListenerForTests,
} from './theme';

jest.mock('../app_events', () => ({
  appEvents: {
    publish: jest.fn(),
  },
}));

jest.mock('../services/context_srv', () => ({
  contextSrv: {
    isSignedIn: true,
  },
}));

jest.mock('./PreferencesService', () => ({
  PreferencesService: jest.fn().mockImplementation(() => ({
    patch: jest.fn().mockResolvedValue({}),
  })),
}));

describe('theme service', () => {
  const patchMock = jest.fn().mockResolvedValue({});
  const mediaQueryListeners: Array<() => void> = [];
  let matchMediaMatches = false;

  beforeEach(() => {
    jest.clearAllMocks();
    resetSystemThemeListenerForTests();
    mediaQueryListeners.length = 0;
    matchMediaMatches = false;

    config.theme2 = createTheme({ colors: { mode: 'dark' } });
    config.bootData.user.theme = 'dark';
    config.bootData.user.lightTheme = false;
    config.bootData.assets = {
      dark: '/build/grafana.dark.css',
      light: '/build/grafana.light.css',
    };

    (PreferencesService as jest.Mock).mockImplementation(() => ({
      patch: patchMock,
    }));

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: jest.fn().mockImplementation(() => ({
        get matches() {
          return matchMediaMatches;
        },
        addEventListener: (_event: string, listener: () => void) => {
          mediaQueryListeners.push(listener);
        },
      })),
    });

    document.head.innerHTML = '';
    document.body.innerHTML = '';
  });

  it('should publish theme changed event and persist preference', async () => {
    await changeTheme('light');

    expect(appEvents.publish).toHaveBeenCalledTimes(1);
    expect(config.bootData.user.theme).toBe('light');
    expect(config.bootData.user.lightTheme).toBe(true);
    expect(patchMock).toHaveBeenCalledWith({ theme: 'light' });
  });

  it('should not persist when runtimeOnly is true', async () => {
    await changeTheme('light', true);

    expect(appEvents.publish).toHaveBeenCalled();
    expect(config.bootData.user.theme).toBe('dark');
    expect(patchMock).not.toHaveBeenCalled();
  });

  it('should not persist for signed out users', async () => {
    contextSrv.isSignedIn = false;

    await changeTheme('light');

    expect(config.bootData.user.theme).toBe('light');
    expect(patchMock).not.toHaveBeenCalled();

    contextSrv.isSignedIn = true;
  });

  it('should react to system theme changes when system preference is selected', async () => {
    config.bootData.user.theme = 'system';
    matchMediaMatches = true;

    initSystemThemeListener();
    initSystemThemeListener();

    expect(mediaQueryListeners).toHaveLength(1);

    matchMediaMatches = false;
    mediaQueryListeners[0]();

    expect(appEvents.publish).toHaveBeenCalled();
    expect(config.bootData.user.theme).toBe('system');
    expect(patchMock).not.toHaveBeenCalled();
  });

  it('should ignore system theme changes when a fixed theme is selected', async () => {
    config.bootData.user.theme = 'dark';

    initSystemThemeListener();
    matchMediaMatches = !matchMediaMatches;
    mediaQueryListeners[0]();

    expect(appEvents.publish).not.toHaveBeenCalled();
  });

  it('should expose the current user theme preference', () => {
    config.bootData.user.theme = 'system';

    expect(getUserThemePreference()).toBe('system');
    expect(isSystemThemePreference()).toBe(true);
  });
});
