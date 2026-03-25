import { ThemeChangedEvent } from '@grafana/runtime';

import { appEvents } from '../app_events';

import { changeTheme } from './theme';

jest.mock('./PreferencesService', () => ({
  PreferencesService: jest.fn().mockImplementation(() => ({
    patch: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('./context_srv', () => ({
  contextSrv: { isSignedIn: false },
}));

describe('changeTheme', () => {
  it('publishes ThemeChangedEvent with brightpink when that theme is selected', async () => {
    const publishSpy = jest.spyOn(appEvents, 'publish');

    await changeTheme('brightpink', true);

    expect(publishSpy).toHaveBeenCalledWith(expect.any(ThemeChangedEvent));
    const event = publishSpy.mock.calls.find((c) => c[0] instanceof ThemeChangedEvent)?.[0] as ThemeChangedEvent;
    expect(event.payload.colors.primary.main.toLowerCase()).toBe('#ff1493');

    publishSpy.mockRestore();
  });
});
