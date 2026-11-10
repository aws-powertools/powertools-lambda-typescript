import { AppConfigProvider } from '@aws-lambda-powertools/parameters/appconfig';
import { StoreNames } from '../constants.js';
import { createDocumentSource } from '../parameters-stores/createDocumentSource.js';
import { ruleEngineStore } from '../ruleEngine/index.js';
import type { AppConfigStoreOptions } from '../types/AppConfigStore.js';
import type { Store } from '../types/index.js';

/**
 * Creates a Store that retrieves and evaluates AppConfig freeform Flag Documents.
 *
 * Install both `@aws-lambda-powertools/parameters` and
 * `@aws-lambda-powertools/jmespath` to use this sub-path. Parameters also requires
 * `@aws-sdk/client-appconfigdata`. One provider per Store owns retrieval caching.
 * Known availability failures return the evaluator's fallback; configuration,
 * transform, and envelope errors propagate.
 *
 * @param {Object} options - Configure retrieval and logging
 * @param {string} options.name - Identify the configuration profile
 * @param {string} options.environment - Identify the environment
 * @param {string} options.application - Identify the application or use the service name
 * @param {string} options.envelope - Select an embedded Flag Document with JMESPath
 * @param {number} options.maxAge - Set the Parameters cache duration in seconds
 * @param {AppConfigDataClient} options.awsSdkV3Client - Supply an AppConfigData client
 * @param {AppConfigDataClientConfig} options.clientConfig - Configure a new AppConfigData client
 * @param {GenericLogger} options.logger - Log rule engine outcomes without values
 * @example
 * ```typescript
 * const store = appConfigStore({ application: 'my-app', environment: 'prod', name: 'features' });
 * const flags = new FeatureFlags({ store });
 * const enabled = await flags.evaluate({ name: 'checkout_v2', default: false });
 * ```
 */
const appConfigStore = (options: AppConfigStoreOptions): Store => {
  const provider = new AppConfigProvider({
    application: options.application,
    environment: options.environment,
    ...(options.awsSdkV3Client
      ? { awsSdkV3Client: options.awsSdkV3Client }
      : { clientConfig: options.clientConfig }),
  });
  return ruleEngineStore({
    name: StoreNames.APPCONFIG,
    logger: options.logger,
    source: createDocumentSource({
      storeName: StoreNames.APPCONFIG,
      envelope: options.envelope,
      retrieve: () =>
        provider.get(options.name, {
          transform: 'json',
          maxAge: options.maxAge,
          throwOnMissing: true,
        }),
    }),
  });
};

export { appConfigStore };
