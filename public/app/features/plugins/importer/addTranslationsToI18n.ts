import { addResourceBundle } from '@grafana/i18n/internal';
import { createMonitoringLogger } from '@grafana/runtime';

import { SystemJS } from '../loader/systemjs';
import { resolveModulePath } from '../loader/utils';

const logger = createMonitoringLogger('plugins.importer.translations');

interface AddTranslationsToI18nOptions {
  resolvedLanguage: string;
  fallbackLanguage: string;
  pluginId: string;
  translations: Record<string, string>;
}

export async function addTranslationsToI18n({
  resolvedLanguage,
  fallbackLanguage,
  pluginId,
  translations,
}: AddTranslationsToI18nOptions): Promise<void> {
  const resolvedPath = translations[resolvedLanguage];
  const fallbackPath = translations[fallbackLanguage];
  const path = resolvedPath ?? fallbackPath;

  if (!path) {
    logger.logWarning('Could not find any translation for plugin', { pluginId, resolvedLanguage, fallbackLanguage });
    return;
  }

  try {
    const module = await SystemJS.import(resolveModulePath(path));
    if (!module.default) {
      logger.logWarning('Could not find default export for plugin', {
        pluginId,
        resolvedLanguage,
        fallbackLanguage,
        path,
      });
      return;
    }

    const language = resolvedPath ? resolvedLanguage : fallbackLanguage;
    addResourceBundle(language, pluginId, module.default);
  } catch (error) {
    logger.logWarning('Could not load translation for plugin', {
      pluginId,
      resolvedLanguage,
      fallbackLanguage,
      error: String(error),
      path,
    });
  }
}
