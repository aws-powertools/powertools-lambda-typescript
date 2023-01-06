import { AppConfigProvider, DEFAULT_PROVIDERS } from './AppConfigProvider';
import type { GetAppConfigCombinedInterface } from '../types/AppConfigProvider';

/**
 * Gets the AppConfig data for the specified name.
 *
 * @param {string} name - The configuration profile ID or the configuration profile name.
 * @param {GetAppConfigCombinedInterface} options - Options for the AppConfigProvider and the get method.
 * @returns {Promise<undefined | string | Uint8Array | Record<string, unknown>>} A promise that resolves to the AppConfig data or undefined if not found.
 */
const getAppConfig = (
  name: string,
  options: GetAppConfigCombinedInterface
): Promise<undefined | string | Uint8Array | Record<string, unknown>> => {
  if (!DEFAULT_PROVIDERS.hasOwnProperty('appconfig')) {
    DEFAULT_PROVIDERS.appconfig = new AppConfigProvider(options);
  }

  return DEFAULT_PROVIDERS.appconfig.get(name, options);
};

export { getAppConfig };
