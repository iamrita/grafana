import { getConfig } from 'app/core/config';
import { contextSrv } from 'app/core/services/context_srv';
import { AccessControlAction } from 'app/types/accessControl';

import { PERMISSIONS_CONTACT_POINTS_READ } from '../components/contact-points/permissions';
import {
  PERMISSIONS_TIME_INTERVALS_MODIFY,
  PERMISSIONS_TIME_INTERVALS_READ,
} from '../components/mute-timings/permissions';
import {
  PERMISSIONS_NOTIFICATION_POLICIES_MODIFY,
  PERMISSIONS_NOTIFICATION_POLICIES_READ,
} from '../components/notification-policies/permissions';

import { GRAFANA_RULES_SOURCE_NAME, isGrafanaRulesSource } from './datasource';

type RulesSourceType = 'grafana' | 'external';

function getRulesSourceType(alertManagerSourceName: string): RulesSourceType {
  return isGrafanaRulesSource(alertManagerSourceName) ? 'grafana' : 'external';
}

export const instancesPermissions = {
  read: {
    grafana: AccessControlAction.AlertingInstanceRead,
    external: AccessControlAction.AlertingInstancesExternalRead,
  },
  create: {
    grafana: AccessControlAction.AlertingInstanceCreate,
    external: AccessControlAction.AlertingInstancesExternalWrite,
  },
  update: {
    grafana: AccessControlAction.AlertingInstanceUpdate,
    external: AccessControlAction.AlertingInstancesExternalWrite,
  },
  delete: {
    grafana: AccessControlAction.AlertingInstanceUpdate,
    external: AccessControlAction.AlertingInstancesExternalWrite,
  },
};

export const notificationsPermissions = {
  read: {
    grafana: AccessControlAction.AlertingNotificationsRead,
    external: AccessControlAction.AlertingNotificationsExternalRead,
  },
  create: {
    grafana: AccessControlAction.AlertingNotificationsWrite,
    external: AccessControlAction.AlertingNotificationsExternalWrite,
  },
  update: {
    grafana: AccessControlAction.AlertingNotificationsWrite,
    external: AccessControlAction.AlertingNotificationsExternalWrite,
  },
  delete: {
    grafana: AccessControlAction.AlertingNotificationsWrite,
    external: AccessControlAction.AlertingNotificationsExternalWrite,
  },
};

export const silencesPermissions = {
  read: {
    grafana: AccessControlAction.AlertingSilenceRead,
    external: AccessControlAction.AlertingInstanceRead,
  },
  create: {
    grafana: AccessControlAction.AlertingSilenceCreate,
    external: AccessControlAction.AlertingInstancesExternalWrite,
  },
  update: {
    grafana: AccessControlAction.AlertingSilenceUpdate,
    external: AccessControlAction.AlertingInstancesExternalWrite,
  },
};

export const provisioningPermissions = {
  read: AccessControlAction.AlertingProvisioningRead,
  readSecrets: AccessControlAction.AlertingProvisioningReadSecrets,
  write: AccessControlAction.AlertingProvisioningWrite,
};

const rulesPermissions = {
  read: {
    grafana: AccessControlAction.AlertingRuleRead,
    external: AccessControlAction.AlertingRuleExternalRead,
  },
  create: {
    grafana: AccessControlAction.AlertingRuleCreate,
    external: AccessControlAction.AlertingRuleExternalWrite,
  },
  update: {
    grafana: AccessControlAction.AlertingRuleUpdate,
    external: AccessControlAction.AlertingRuleExternalWrite,
  },
  delete: {
    grafana: AccessControlAction.AlertingRuleDelete,
    external: AccessControlAction.AlertingRuleExternalWrite,
  },
};

export function getInstancesPermissions(rulesSourceName: string) {
  const sourceType = getRulesSourceType(rulesSourceName);

  return {
    read: instancesPermissions.read[sourceType],
    create: instancesPermissions.create[sourceType],
    update: instancesPermissions.update[sourceType],
    delete: instancesPermissions.delete[sourceType],
  };
}

export interface CrudPermissionSet {
  read: AccessControlAction[];
  create: AccessControlAction[];
  update: AccessControlAction[];
  delete: AccessControlAction[];
}

const emptyCrudPermissions = (): CrudPermissionSet => ({
  read: [],
  create: [],
  update: [],
  delete: [],
});

/**
 * Grafana-flavored alertmanager checks both the legacy alert.notifications.* actions
 * and the per-resource receiver/template/route/time-interval actions. Any match grants access.
 */
export const grafanaAlertmanagerPermissionExtras: {
  contactPoints: CrudPermissionSet;
  templates: CrudPermissionSet;
  policies: CrudPermissionSet;
  timeIntervals: CrudPermissionSet;
} = {
  contactPoints: {
    read: PERMISSIONS_CONTACT_POINTS_READ,
    create: [AccessControlAction.AlertingReceiversCreate],
    update: [AccessControlAction.AlertingReceiversWrite],
    delete: [AccessControlAction.AlertingReceiversWrite],
  },
  templates: {
    read: [AccessControlAction.AlertingTemplatesRead],
    create: [AccessControlAction.AlertingTemplatesWrite],
    update: [AccessControlAction.AlertingTemplatesWrite],
    // Template delete still relies on the base notifications permission only.
    delete: [],
  },
  policies: {
    read: PERMISSIONS_NOTIFICATION_POLICIES_READ,
    create: PERMISSIONS_NOTIFICATION_POLICIES_MODIFY,
    update: PERMISSIONS_NOTIFICATION_POLICIES_MODIFY,
    delete: PERMISSIONS_NOTIFICATION_POLICIES_MODIFY,
  },
  timeIntervals: {
    read: PERMISSIONS_TIME_INTERVALS_READ,
    create: PERMISSIONS_TIME_INTERVALS_MODIFY,
    update: PERMISSIONS_TIME_INTERVALS_MODIFY,
    delete: PERMISSIONS_TIME_INTERVALS_MODIFY,
  },
};

export function getNotificationsPermissions(rulesSourceName: string) {
  const sourceType = getRulesSourceType(rulesSourceName);
  const isGrafana = sourceType === 'grafana';

  return {
    read: [notificationsPermissions.read[sourceType]],
    create: [notificationsPermissions.create[sourceType]],
    update: [notificationsPermissions.update[sourceType]],
    delete: [notificationsPermissions.delete[sourceType]],
    provisioning: provisioningPermissions,
    grafana: isGrafana
      ? grafanaAlertmanagerPermissionExtras
      : {
          contactPoints: emptyCrudPermissions(),
          templates: emptyCrudPermissions(),
          policies: emptyCrudPermissions(),
          timeIntervals: emptyCrudPermissions(),
        },
  };
}

export function getRulesPermissions(rulesSourceName: string) {
  const sourceType = getRulesSourceType(rulesSourceName);

  return {
    read: rulesPermissions.read[sourceType],
    create: rulesPermissions.create[sourceType],
    update: rulesPermissions.update[sourceType],
    delete: rulesPermissions.delete[sourceType],
  };
}

export function evaluateAccess(actions: AccessControlAction[]) {
  return () => {
    return contextSrv.evaluatePermission(actions);
  };
}

export function getRulesAccess() {
  return {
    canCreateGrafanaRules:
      contextSrv.hasPermission(AccessControlAction.FoldersRead) &&
      contextSrv.hasPermission(rulesPermissions.create.grafana),
    canCreateCloudRules:
      contextSrv.hasPermission(AccessControlAction.DataSourcesRead) &&
      contextSrv.hasPermission(rulesPermissions.create.external),
    canEditRules: (rulesSourceName: string) => {
      return contextSrv.hasPermission(getRulesPermissions(rulesSourceName).update);
    },
  };
}

export function getCreateAlertInMenuAvailability() {
  const { unifiedAlertingEnabled } = getConfig();
  const hasRuleReadPermissions = contextSrv.hasPermission(getRulesPermissions(GRAFANA_RULES_SOURCE_NAME).read);
  const hasRuleUpdatePermissions = contextSrv.hasPermission(getRulesPermissions(GRAFANA_RULES_SOURCE_NAME).update);
  const isAlertingAvailableForRead = unifiedAlertingEnabled && hasRuleReadPermissions;

  return isAlertingAvailableForRead && hasRuleUpdatePermissions;
}
