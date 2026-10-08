import { first } from 'lodash';
import { ReactNode } from 'react';

import { PluginExtensionLink } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { Dropdown, ToolbarButton } from '@grafana/ui';

import { AlertingRuleExtensionPointMenu } from './AlertingRuleExtensionPointMenu';

export type ExtensionDropdownProps = {
  links: PluginExtensionLink[];
  setSelectedExtension: (extension: PluginExtensionLink) => void;
  setIsModalOpen: (value: boolean) => void;
  isModalOpen: boolean;
  label?: ReactNode;
  ariaLabel?: string;
};

export function QuerylessAppsExtensions(props: ExtensionDropdownProps) {
  const { links, setSelectedExtension, setIsModalOpen, isModalOpen } = props;
  const label = props.label ?? <Trans i18nKey="explore.toolbar.add-to-queryless-extensions">Go queryless</Trans>;
  const ariaLabel = props.ariaLabel ?? t('explore.queryless-apps-extensions.aria-label-go-queryless', 'Go queryless');

  if (links.length === 0) {
    return undefined;
  }

  const menu = <AlertingRuleExtensionPointMenu extensions={links} onSelect={setSelectedExtension} />;

  if (links.length === 1) {
    const link = first(links)!;
    return (
      <ToolbarButton
        variant="canvas"
        icon={link.icon}
        aria-label={ariaLabel}
        onClick={() => setSelectedExtension(link)}
      >
        {label}
      </ToolbarButton>
    );
  }

  return (
    <Dropdown onVisibleChange={setIsModalOpen} placement="bottom-start" overlay={menu}>
      <ToolbarButton aria-label={ariaLabel} variant="canvas" isOpen={isModalOpen}>
        {label}
      </ToolbarButton>
    </Dropdown>
  );
}
