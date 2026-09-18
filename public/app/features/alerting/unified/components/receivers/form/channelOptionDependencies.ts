import { get } from 'lodash';

import { NotificationChannelSecureFields } from 'app/features/alerting/unified/types/alerting';

function isPresent(value: unknown): boolean {
  return value !== undefined && value !== null && value !== false && value !== '';
}

/**
 * Whether a `dependsOn` field is already satisfied by settings or configured secure fields.
 * Looks up top-level keys, dotted paths, and nested secure field keys such as `http_config.token`.
 */
export function isDependencySatisfied(
  dependsOn: string,
  settings: Record<string, unknown> | undefined,
  secureFields: NotificationChannelSecureFields | undefined
): boolean {
  if (!dependsOn) {
    return false;
  }

  if (secureFields?.[dependsOn]) {
    return true;
  }

  if (
    secureFields &&
    Object.entries(secureFields).some(([key, configured]) => {
      if (!configured) {
        return false;
      }
      return key === dependsOn || key.endsWith(`.${dependsOn}`);
    })
  ) {
    return true;
  }

  if (!settings) {
    return false;
  }

  if (isPresent(get(settings, dependsOn))) {
    return true;
  }

  return hasNestedSettingValue(settings, dependsOn);
}

function hasNestedSettingValue(value: unknown, key: string): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;
  if (isPresent(record[key])) {
    return true;
  }

  return Object.values(record).some((nested) => hasNestedSettingValue(nested, key));
}
