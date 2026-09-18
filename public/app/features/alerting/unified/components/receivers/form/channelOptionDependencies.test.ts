import { isDependencySatisfied } from './channelOptionDependencies';

describe('isDependencySatisfied', () => {
  it('returns false when dependsOn is empty', () => {
    expect(isDependencySatisfied('', { url: 'https://example.com' }, {})).toBe(false);
  });

  it('finds a top-level setting', () => {
    expect(isDependencySatisfied('url', { url: 'https://example.com' }, {})).toBe(true);
  });

  it('treats empty string settings as missing', () => {
    expect(isDependencySatisfied('url', { url: '' }, {})).toBe(false);
  });

  it('finds a top-level configured secure field', () => {
    expect(isDependencySatisfied('token', {}, { token: true })).toBe(true);
  });

  it('finds a nested setting via dotted path', () => {
    expect(isDependencySatisfied('http_config.token', { http_config: { token: 'abc' } }, {})).toBe(true);
  });

  it('finds a nested setting by sibling property name', () => {
    expect(isDependencySatisfied('token', { http_config: { token: 'abc' } }, {})).toBe(true);
  });

  it('finds a nested secure field key', () => {
    expect(isDependencySatisfied('token', {}, { 'http_config.token': true })).toBe(true);
  });

  it('finds a deeply nested secure field key', () => {
    expect(isDependencySatisfied('client_secret', {}, { 'http_config.oauth2.client_secret': true })).toBe(true);
  });

  it('ignores unconfigured nested secure fields', () => {
    expect(isDependencySatisfied('token', {}, { 'http_config.token': '' })).toBe(false);
  });

  it('returns false when neither settings nor secure fields contain the dependency', () => {
    expect(isDependencySatisfied('token', { url: 'https://example.com' }, { url: true })).toBe(false);
  });
});
