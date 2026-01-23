import { createMonitoringLogger } from '@grafana/runtime';
import { SceneVariable, SwitchVariable } from '@grafana/scenes';
import { OptionsPaneItemDescriptor } from 'app/features/dashboard/components/PanelEditor/OptionsPaneItemDescriptor';

const logger = createMonitoringLogger('dashboard-scene.switch-variable-editor');

import { SwitchVariableForm } from '../components/SwitchVariableForm';

interface SwitchVariableEditorProps {
  variable: SwitchVariable;
  inline?: boolean;
}

export function SwitchVariableEditor({ variable, inline = false }: SwitchVariableEditorProps) {
  const { value, enabledValue, disabledValue } = variable.useState();

  const onEnabledValueChange = (newEnabledValue: string) => {
    const isCurrentlyEnabled = value === enabledValue;

    if (isCurrentlyEnabled) {
      variable.setState({ enabledValue: newEnabledValue, value: newEnabledValue });
    } else {
      variable.setState({ enabledValue: newEnabledValue });
    }
  };

  const onDisabledValueChange = (newDisabledValue: string) => {
    const isCurrentlyDisabled = value === disabledValue;

    if (isCurrentlyDisabled) {
      variable.setState({ disabledValue: newDisabledValue, value: newDisabledValue });
    } else {
      variable.setState({ disabledValue: newDisabledValue });
    }
  };

  return (
    <SwitchVariableForm
      enabledValue={enabledValue}
      disabledValue={disabledValue}
      onEnabledValueChange={onEnabledValueChange}
      onDisabledValueChange={onDisabledValueChange}
      inline={inline}
    />
  );
}

export function getSwitchVariableOptions(variable: SceneVariable): OptionsPaneItemDescriptor[] {
  if (!(variable instanceof SwitchVariable)) {
    logger.logWarning('getSwitchVariableOptions: variable is not a SwitchVariable', {
      variableType: variable.constructor.name,
    });
    return [];
  }

  return [
    new OptionsPaneItemDescriptor({
      id: `variable-${variable.state.name}-value`,
      render: () => <SwitchVariableEditor variable={variable} inline={true} />,
    }),
  ];
}
