import { getConfig } from '@aws-lambda-powertools/parameters/appconfig-agent';
import { StoreNames } from '../constants.js';
import { createDocumentSource } from '../parameters-stores/createDocumentSource.js';
import { validateEnvelopeOptions } from '../parameters-stores/envelope.js';
import { ruleEngineStore } from '../ruleEngine/index.js';
import type { AppConfigAgentStoreOptions } from '../types/AppConfigAgentStore.js';
import type { Store } from '../types/index.js';

/**
 * Creates a Store that retrieves freeform Flag Documents through the AppConfig Agent.
 *
 * Install `@aws-lambda-powertools/parameters` to use this sub-path. Attach the AppConfig
 * Agent Lambda extension to your function. The Agent owns caching and polling;
 * this Store evaluates the retrieved document locally without loading the SDK.
 * Supply both `envelope` and `envelopeSearchFn` to select an embedded document.
 * Known availability failures return the evaluator's fallback; configuration,
 * transform, and envelope errors propagate.
 *
 * @param {Object} options - Configure retrieval and logging
 * @param {string} options.name - Identify the configuration profile
 * @param {string} options.environment - Identify the environment
 * @param {string} options.application - Identify the application or use the service name
 * @param {string} options.envelope - Select an embedded Flag Document
 * @param {Function} options.envelopeSearchFn - Apply the envelope expression
 * @param {number} options.timeout - Set the request timeout in milliseconds
 * @param {GenericLogger} options.logger - Log rule engine outcomes without values
 * @example
 * ```typescript
 * import { FeatureFlags } from '@aws-lambda-powertools/feature-flags';
 * import { appConfigAgentStore } from '@aws-lambda-powertools/feature-flags/appconfig-agent';
 * import { search } from '@aws-lambda-powertools/feature-flags/envelope';
 *
 * const store = appConfigAgentStore({
 *   application: 'my-app', environment: 'prod', name: 'features',
 *   envelope: 'settings.flags', envelopeSearchFn: search,
 * });
 * const flags = new FeatureFlags({ store });
 * const enabled = await flags.evaluate({ name: 'checkout_v2', default: false });
 * ```
 */
const appConfigAgentStore = (options: AppConfigAgentStoreOptions): Store => {
  const envelopeOptions = validateEnvelopeOptions(options);
  return ruleEngineStore({
    name: StoreNames.APPCONFIG_AGENT,
    logger: options.logger,
    source: createDocumentSource({
      storeName: StoreNames.APPCONFIG_AGENT,
      ...envelopeOptions,
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
};

export { appConfigAgentStore };
