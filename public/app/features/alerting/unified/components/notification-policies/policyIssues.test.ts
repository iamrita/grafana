import { MatcherOperator, RouteWithID } from 'app/plugins/datasource/alertmanager/types';

import { MatcherFieldValue } from '../../types/silence-form';

import { detectPolicyIssues, hasContradictoryMatchers, validateMatcherFields } from './policyIssues';

const eq = MatcherOperator.equal;
const neq = MatcherOperator.notEqual;

describe('hasContradictoryMatchers', () => {
  it('returns false for an empty matcher list', () => {
    expect(hasContradictoryMatchers([])).toBe(false);
  });

  it('returns false for compatible matchers on different labels', () => {
    expect(
      hasContradictoryMatchers([
        ['team', eq, 'ops'],
        ['region', eq, 'emea'],
      ])
    ).toBe(false);
  });

  it('returns true when the same label has two different equality values', () => {
    expect(
      hasContradictoryMatchers([
        ['team', eq, 'ops'],
        ['team', eq, 'platform'],
      ])
    ).toBe(true);
  });

  it('returns true when a label is both equal and not-equal to the same value', () => {
    expect(
      hasContradictoryMatchers([
        ['team', eq, 'ops'],
        ['team', neq, 'ops'],
      ])
    ).toBe(true);
  });

  it('returns false when not-equal uses a different value than equal', () => {
    expect(
      hasContradictoryMatchers([
        ['team', eq, 'ops'],
        ['team', neq, 'platform'],
      ])
    ).toBe(false);
  });
});

describe('detectPolicyIssues', () => {
  it('flags contradictory matchers', () => {
    const route: RouteWithID = {
      id: '1',
      receiver: 'email',
      object_matchers: [
        ['team', eq, 'ops'],
        ['team', eq, 'platform'],
      ],
    };

    expect(detectPolicyIssues(route)).toEqual([{ kind: 'contradictoryMatchers' }]);
  });

  it('flags a leaf policy with no contact point', () => {
    const route: RouteWithID = {
      id: '1',
      object_matchers: [['team', eq, 'ops']],
    };

    expect(detectPolicyIssues(route)).toEqual([{ kind: 'noContactPoint' }]);
  });

  it('does not flag a leaf that inherits a contact point', () => {
    const route: RouteWithID = {
      id: '1',
      object_matchers: [['team', eq, 'ops']],
    };

    expect(detectPolicyIssues(route, { inheritedReceiver: 'email' })).toEqual([]);
  });

  it('does not flag the default policy for a missing contact point', () => {
    const route: RouteWithID = { id: '0' };

    expect(detectPolicyIssues(route, { isDefaultPolicy: true })).toEqual([]);
  });

  it('flags a sibling that is shadowed by an earlier catch-all that does not continue', () => {
    const current: RouteWithID = {
      id: '2',
      receiver: 'pager',
      object_matchers: [['team', eq, 'ops']],
    };
    const previous: RouteWithID = { id: '1', receiver: 'email' };

    expect(detectPolicyIssues(current, { previousSiblings: [previous] })).toEqual([{ kind: 'unreachable' }]);
  });

  it('flags a more specific sibling that is shadowed by an earlier exact match that does not continue', () => {
    const current: RouteWithID = {
      id: '2',
      receiver: 'pager',
      object_matchers: [
        ['team', eq, 'ops'],
        ['region', eq, 'emea'],
      ],
    };
    const previous: RouteWithID = {
      id: '1',
      receiver: 'email',
      object_matchers: [['team', eq, 'ops']],
    };

    expect(detectPolicyIssues(current, { previousSiblings: [previous] })).toEqual([{ kind: 'unreachable' }]);
  });

  it('does not flag a sibling when the earlier route continues matching', () => {
    const current: RouteWithID = {
      id: '2',
      receiver: 'pager',
      object_matchers: [['team', eq, 'ops']],
    };
    const previous: RouteWithID = {
      id: '1',
      continue: true,
      receiver: 'email',
      object_matchers: [['team', eq, 'ops']],
    };

    expect(detectPolicyIssues(current, { previousSiblings: [previous] })).toEqual([]);
  });
});

describe('validateMatcherFields', () => {
  it('ignores incomplete matchers without a name', () => {
    const matchers: MatcherFieldValue[] = [
      { name: '', operator: eq, value: '' },
      { name: 'team', operator: eq, value: 'ops' },
    ];

    expect(validateMatcherFields(matchers)).toBe(true);
  });

  it('returns an error message for contradictory matchers', () => {
    const matchers: MatcherFieldValue[] = [
      { name: 'team', operator: eq, value: 'ops' },
      { name: 'team', operator: eq, value: 'platform' },
    ];

    expect(validateMatcherFields(matchers)).toEqual(
      'These matchers contradict each other and this policy will never match.'
    );
  });
});
