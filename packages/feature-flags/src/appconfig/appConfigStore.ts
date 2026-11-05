import type { GenericLogger } from '@aws-lambda-powertools/commons/types';
import { AppConfigProvider } from '@aws-lambda-powertools/parameters/appconfig';
import type {
  AppConfigDataClient,
  AppConfigDataClientConfig,
} from '@aws-sdk/client-appconfigdata';
import { createDocumentSource } from '../parameters-stores/createDocumentSource.js';
import { ruleEngineStore } from '../ruleEngine/index.js';
import type { Store } from '../types/index.js';

/** Configures retrieval and local evaluation of an AppConfig freeform Flag Document. */
type AppConfigStoreOptions = {
  /** Identifies the configuration profile by name or ID. */
  name: string;
  /** Identifies the environment by name or ID. */
  environment: string;
  /** Identifies the application, defaulting to `POWERTOOLS_SERVICE_NAME`. */
  application?: string;
  /** Selects an embedded Flag Document with JMESPath. */
  envelope?: string;
  /** Sets the Parameters cache duration in seconds. */
  maxAge?: number;
  /** Supplies the AppConfigData client instead of creating one. */
  awsSdkV3Client?: AppConfigDataClient;
  /** Configures the AppConfigData client when no client is supplied. */
  clientConfig?: AppConfigDataClientConfig;
  /** Logs rule engine warnings and outcomes without values. */
  logger?: GenericLogger;
};

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
    name: 'appconfig',
    logger: options.logger,
    source: createDocumentSource({
      storeName: 'appconfig',
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

export type { AppConfigStoreOptions };
export { appConfigStore };
