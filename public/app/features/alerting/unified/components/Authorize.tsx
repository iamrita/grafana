import { chain, filter } from 'lodash';
import { PropsWithChildren } from 'react';

import { CombinedRule } from 'app/types/unified-alerting';
import { GrafanaPromRuleDTO } from 'app/types/unified-alerting-dto';

import {
  Abilities,
  Action,
  AlertRuleAction,
  AlertingAction,
  AlertmanagerAction,
  useAlertingAbilities,
  useAllAlertRuleAbilities,
  useAllAlertmanagerAbilities,
  useAllGrafanaPromRuleAbilities,
} from '../hooks/useAbilities';

interface AuthorizeProps extends PropsWithChildren {
  actions: AlertmanagerAction[] | AlertingAction[];
}

export const Authorize = ({ actions, children }: AuthorizeProps) => {
  const alertmanagerActions = filter(actions, isAlertmanagerAction) as AlertmanagerAction[];
  const alertSourceActions = filter(actions, isAlertingAction) as AlertingAction[];

  if (alertmanagerActions.length) {
    return <AuthorizeAlertmanager actions={alertmanagerActions}>{children}</AuthorizeAlertmanager>;
  }

  if (alertSourceActions.length) {
    return <AuthorizeAlertSource actions={alertSourceActions}>{children}</AuthorizeAlertSource>;
  }

  return null;
};

interface ActionsProps<T extends Action> extends PropsWithChildren {
  actions: T[];
}

const AuthorizeAlertmanager = ({ actions, children }: ActionsProps<AlertmanagerAction>) => {
  const alertmanagerAbilties = useAllAlertmanagerAbilities();
  const allowed = actionsAllowed(alertmanagerAbilties, actions);

  if (allowed) {
    return <>{children}</>;
  } else {
    return null;
  }
};

export const AuthorizeAlertSource = ({ actions, children }: ActionsProps<AlertingAction>) => {
  const alertSourceAbilities = useAlertingAbilities();
  const allowed = actionsAllowed(alertSourceAbilities, actions);

  if (allowed) {
    return <>{children}</>;
  } else {
    return null;
  }
};

interface AuthorizeRuleProps extends PropsWithChildren {
  rule: CombinedRule;
  actions: AlertRuleAction[];
}

/** Renders children when the user can perform any of the actions on this combined rule. */
export const AuthorizeRule = ({ rule, actions, children }: AuthorizeRuleProps) => {
  const abilities = useAllAlertRuleAbilities(rule);

  if (actionsAllowed(abilities, actions)) {
    return <>{children}</>;
  }

  return null;
};

interface AuthorizeGrafanaRuleProps extends PropsWithChildren {
  rule: GrafanaPromRuleDTO;
  actions: AlertRuleAction[];
}

/** Renders children when the user can perform any of the actions on a Grafana-managed Prometheus rule. */
export const AuthorizeGrafanaRule = ({ rule, actions, children }: AuthorizeGrafanaRuleProps) => {
  const abilities = useAllGrafanaPromRuleAbilities(rule);

  if (actionsAllowed(abilities, actions)) {
    return <>{children}</>;
  }

  return null;
};

// check if some action is allowed from the abilities
function actionsAllowed<T extends Action>(abilities: Abilities<T>, actions: T[]) {
  return chain(abilities)
    .pick(actions)
    .values()
    .value()
    .some(([_supported, allowed]) => allowed === true);
}

function isAlertmanagerAction(action: AlertmanagerAction) {
  return Object.values(AlertmanagerAction).includes(action);
}

function isAlertingAction(action: AlertingAction) {
  return Object.values(AlertingAction).includes(action);
}
