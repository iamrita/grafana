import type {
  AppPluginConfig,
  PluginExtensionAddedLinkConfig,
  PluginExtensionExposedComponentConfig,
  PluginExtensionAddedComponentConfig,
} from '@grafana/data';
import { createMonitoringLogger } from '@grafana/runtime';
import { contextSrv } from 'app/core/services/context_srv';
import { getPluginSettings } from 'app/features/plugins/pluginSettings';

import { pluginImporter } from './importer/pluginImporter';

const logger = createMonitoringLogger('plugins.pluginPreloader');

export type PluginPreloadResult = {
  pluginId: string;
  error?: unknown;
  exposedComponentConfigs: PluginExtensionExposedComponentConfig[];
  addedComponentConfigs?: PluginExtensionAddedComponentConfig[];
  addedLinkConfigs?: PluginExtensionAddedLinkConfig[];
};

const preloadPromises = new Map<string, Promise<void>>();

export const clearPreloadedPluginsCache = () => {
  preloadPromises.clear();
};

export async function preloadPlugins(apps: AppPluginConfig[] = []) {
  // Create preload promises for each app, reusing existing promises if already loading
  const promises = apps.map((app) => {
    if (!preloadPromises.has(app.id)) {
      preloadPromises.set(app.id, preload(app));
    }
    return preloadPromises.get(app.id)!;
  });

  await Promise.all(promises);
}

async function preload(config: AppPluginConfig): Promise<void> {
  const showErrorAlert = contextSrv.user.orgRole !== '';

  try {
    const meta = await getPluginSettings(config.id, { showErrorAlert });
    await pluginImporter.importApp(meta);
  } catch (error) {
    if (!showErrorAlert) {
      return;
    }

    logger.logError(new Error(`Failed to preload plugin: ${config.path}`), {
      pluginPath: config.path,
      pluginVersion: config.version ?? '',
      error: String(error),
    });
  }
}
