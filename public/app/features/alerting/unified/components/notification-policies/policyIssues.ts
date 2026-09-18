import { MatcherOperator, ObjectMatcher, RouteWithID } from 'app/plugins/datasource/alertmanager/types';

import { MatcherFieldValue } from '../../types/silence-form';
import { normalizeMatchers } from '../../utils/matchers';

export type PolicyIssueKind = 'contradictoryMatchers' | 'unreachable' | 'noContactPoint';

export interface PolicyIssue {
  kind: PolicyIssueKind;
}

interface DetectPolicyIssuesOptions {
  isDefaultPolicy?: boolean;
  inheritedReceiver?: string | null;
  previousSiblings?: RouteWithID[];
}

/**
 * Detects notification-policy configurations that can never fire or will drop alerts.
 * Conservative: only flags cases we can prove from matchers and routing order.
 */
export function detectPolicyIssues(route: RouteWithID, options: DetectPolicyIssuesOptions = {}): PolicyIssue[] {
  const issues: PolicyIssue[] = [];
  const matchers = normalizeMatchers(route);
  const hasChildren = Boolean(route.routes?.length);
  const contactPoint = route.receiver ?? options.inheritedReceiver ?? '';

  if (hasContradictoryMatchers(matchers)) {
    issues.push({ kind: 'contradictoryMatchers' });
  }

  if (options.previousSiblings?.some((sibling) => makesUnreachable(sibling, matchers))) {
    issues.push({ kind: 'unreachable' });
  }

  if (!options.isDefaultPolicy && !hasChildren && !contactPoint) {
    issues.push({ kind: 'noContactPoint' });
  }

  return issues;
}

export function hasContradictoryMatchers(matchers: ObjectMatcher[]): boolean {
  const byLabel = new Map<string, ObjectMatcher[]>();

  for (const matcher of matchers) {
    const [name] = matcher;
    const group = byLabel.get(name) ?? [];
    group.push(matcher);
    byLabel.set(name, group);
  }

  for (const group of byLabel.values()) {
    const equals = group.filter(([, operator]) => operator === MatcherOperator.equal);
    const notEquals = group.filter(([, operator]) => operator === MatcherOperator.notEqual);
    const uniqueEqualValues = new Set(equals.map(([, , value]) => value));

    if (uniqueEqualValues.size > 1) {
      return true;
    }

    if (equals.some(([, , value]) => notEquals.some(([, , notValue]) => notValue === value))) {
      return true;
    }
  }

  return false;
}

export function validateMatcherFields(matchers: MatcherFieldValue[]): string | true {
  const objectMatchers: ObjectMatcher[] = matchers
    .filter((matcher) => matcher.name)
    .map((matcher) => [matcher.name, matcher.operator, matcher.value]);

  if (hasContradictoryMatchers(objectMatchers)) {
    return 'These matchers contradict each other and this policy will never match.';
  }

  return true;
}

function makesUnreachable(sibling: RouteWithID, currentMatchers: ObjectMatcher[]): boolean {
  if (sibling.continue) {
    return false;
  }

  const siblingMatchers = normalizeMatchers(sibling);

  // A catch-all sibling that does not continue swallows every later sibling.
  if (siblingMatchers.length === 0) {
    return true;
  }

  return siblingMatchers.every((siblingMatcher) =>
    currentMatchers.some((currentMatcher) => matchersEqual(siblingMatcher, currentMatcher))
  );
}

function matchersEqual(left: ObjectMatcher, right: ObjectMatcher): boolean {
  return left[0] === right[0] && left[1] === right[1] && left[2] === right[2];
}
