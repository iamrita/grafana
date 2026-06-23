import { NewThemeOptionsSchema } from '../createTheme';
import emberDark from './ember_dark.json';
import emberLight from './ember_light.json';

describe('ember theme definitions', () => {
  it('validates ember-light and ember-dark definitions', () => {
    const lightResult = NewThemeOptionsSchema.safeParse(emberLight);
    const darkResult = NewThemeOptionsSchema.safeParse(emberDark);

    expect(lightResult.success).toBe(true);
    expect(darkResult.success).toBe(true);
  });
});
