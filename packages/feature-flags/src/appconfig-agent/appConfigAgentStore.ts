import { getConfig } from '@aws-lambda-powertools/parameters/appconfig-agent';
import { StoreNames } from '../constants.js';
import { createDocumentSource } from '../parameters-stores/createDocumentSource.js';
import { ruleEngineStore } from '../ruleEngine/index.js';
import type { AppConfigAgentStoreOptions } from '../types/AppConfigAgentStore.js';
import type { Store } from '../types/index.js';

/**
 * Creates a Store that retrieves freeform Flag Documents through the AppConfig Agent.
 *
 * Install both `@aws-lambda-powertools/parameters` and
 * `@aws-lambda-powertools/jmespath` to use this sub-path. Attach the AppConfig
 * Agent Lambda extension to your function. The Agent owns caching and polling;
 * this Store evaluates the retrieved document locally without loading the SDK.
 * Known availability failures return the evaluator's fallback; configuration,
 * transform, and envelope errors propagate.
 *
 * @param {Object} options - Configure retrieval and logging
 * @param {string} options.name - Identify the configuration profile
 * @param {string} options.environment - Identify the environment
 * @param {string} options.application - Identify the application or use the service name
 * @param {string} options.envelope - Select an embedded Flag Document with JMESPath
 * @param {number} options.timeout - Set the request timeout in milliseconds
 * @param {GenericLogger} options.logger - Log rule engine outcomes without values
 * @example
 * ```typescript
 * const store = appConfigAgentStore({ application: 'my-app', environment: 'prod', name: 'features' });
 * const flags = new FeatureFlags({ store });
 * const enabled = await flags.evaluate({ name: 'checkout_v2', default: false });
 * ```
 */
const appConfigAgentStore = (options: AppConfigAgentStoreOptions): Store =>
  ruleEngineStore({
    name: StoreNames.APPCONFIG_AGENT,
    logger: options.logger,
    source: createDocumentSource({
      storeName: StoreNames.APPCONFIG_AGENT,
      envelope: options.envelope,
      retrieve: () =>
        getConfig(options.name, {
          application: options.application,
          environment: options.environment,
          timeout: options.timeout,
          transform: 'json',
          throwOnMissing: true,
        }),
    }),
  });

export { appConfigAgentStore };
