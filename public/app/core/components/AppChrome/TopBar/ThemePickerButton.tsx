import { css } from '@emotion/css';
import { memo } from 'react';

import { GrafanaTheme2, ThemeRegistryItem } from '@grafana/data';
import { t } from '@grafana/i18n';
import { config, reportInteraction } from '@grafana/runtime';
import { Dropdown, Menu, MenuItem, ToolbarButton, useStyles2, useTheme2 } from '@grafana/ui';
import { getSelectableThemes } from 'app/core/components/ThemeSelector/getSelectableThemes';
import { changeTheme } from 'app/core/services/theme';

export const ThemePickerButton = memo(function ThemePickerButton() {
  const currentTheme = useTheme2();
  const styles = useStyles2(getStyles);

  if (!config.featureToggles.grafanaconThemes) {
    return null;
  }

  const themes = getSelectableThemes();

  const onChangeTheme = (theme: ThemeRegistryItem) => {
    reportInteraction('grafana_preferences_theme_changed', {
      toTheme: theme.id,
      preferenceType: 'top_bar_picker',
    });
    changeTheme(theme.id, false);
  };

  const renderMenu = () => (
    <Menu>
      {themes.map((theme) => {
        const built = theme.build();
        const isSelected = currentTheme.name === theme.name;
        return (
          <MenuItem
            key={theme.id}
            label={theme.name}
            onClick={() => onChangeTheme(theme)}
            className={isSelected ? styles.selectedItem : undefined}
            icon={isSelected ? 'check' : built.isDark ? 'moon' : 'sun'}
          />
        );
      })}
    </Menu>
  );

  return (
    <Dropdown overlay={renderMenu} placement="bottom-end">
      <ToolbarButton
        iconOnly
        icon="palette"
        aria-label={t('navigation.theme-picker.aria-label', 'Change theme')}
        tooltip={t('navigation.theme-picker.tooltip', 'Change theme')}
      />
    </Dropdown>
  );
});

const getStyles = (theme: GrafanaTheme2) => ({
  selectedItem: css({
    backgroundColor: theme.colors.action.selected,
    fontWeight: theme.typography.fontWeightBold,
  }),
});
