import { getSelectableThemes } from './getSelectableThemes';

describe('getSelectableThemes', () => {
  it('includes the brightpink theme option', () => {
    expect(getSelectableThemes().map((t) => t.id)).toContain('brightpink');
  });
});
