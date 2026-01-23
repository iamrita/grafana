import { NavModel, NavModelItem } from '@grafana/data';
import { logError } from '@grafana/runtime';

export function getExceptionNav(error: unknown): NavModel {
  logError(error instanceof Error ? error : new Error(String(error)), { context: 'navigation.getExceptionNav' });
  return getWarningNav('Exception thrown', 'See console for details');
}

export function getNotFoundNav(): NavModel {
  return getWarningNav('Page not found', '404 Error');
}

export function getWarningNav(text: string, subTitle?: string): NavModel {
  const node: NavModelItem = {
    text,
    subTitle,
    icon: 'exclamation-triangle',
  };
  return {
    node: node,
    main: node,
  };
}
