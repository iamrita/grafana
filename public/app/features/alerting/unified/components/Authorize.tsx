import { chain, filter } from 'lodash';
import { PropsWithChildren } from 'react';

import { CombinedRule } from 'app/types/unified-alerting';

import {
  Abilities,
  Action,
  AlertRuleAction,
  AlertingAction,
  AlertmanagerAction,
  useAlertRuleAbilities,
  useAlertingAbilities,
  useAllAlertmanagerAbilities,
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
    return <AuthorizeAlertsource actions={alertSourceActions}>{children}</AuthorizeAlertsource>;
  }

  return null;
};

interface ActionsProps<T extends Action> extends PropsWithChildren {
  actions: T[];
}

export const AuthorizeAlertmanager = ({ actions, children }: ActionsProps<AlertmanagerAction>) => {
  const alertmanagerAbilties = useAllAlertmanagerAbilities();
  const allowed = actionsAllowed(alertmanagerAbilties, actions);

  if (allowed) {
    return <>{children}</>;
  } else {
    return null;
  }
};

export const AuthorizeAlertsource = ({ actions, children }: ActionsProps<AlertingAction>) => {
  const alertSourceAbilities = useAlertingAbilities();
  const allowed = actionsAllowed(alertSourceAbilities, actions);

  if (allowed) {
    return <>{children}</>;
  } else {
    return null;
  }
};

interface AuthorizeAlertRuleProps extends PropsWithChildren {
  rule: CombinedRule;
  actions: AlertRuleAction[];
}

export const AuthorizeAlertRule = ({ rule, actions, children }: AuthorizeAlertRuleProps) => {
  const abilities = useAlertRuleAbilities(rule, actions);
  const allowed = abilities.some(([_supported, allowed]) => allowed === true);

  return allowed ? <>{children}</> : null;
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
