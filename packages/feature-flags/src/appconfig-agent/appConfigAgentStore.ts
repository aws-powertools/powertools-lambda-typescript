import type { GenericLogger } from '@aws-lambda-powertools/commons/types';
import { getConfig } from '@aws-lambda-powertools/parameters/appconfig-agent';
import { createDocumentSource } from '../parameters-stores/createDocumentSource.js';
import { ruleEngineStore } from '../ruleEngine/index.js';
import type { Store } from '../types/index.js';

/** Configures Agent retrieval and local evaluation of a freeform Flag Document. */
type AppConfigAgentStoreOptions = {
  /** Identifies the configuration profile by name or ID. */
  name: string;
  /** Identifies the environment by name or ID. */
  environment: string;
  /** Identifies the application, defaulting to `POWERTOOLS_SERVICE_NAME`. */
  application?: string;
  /** Selects an embedded Flag Document with JMESPath. */
  envelope?: string;
  /** Sets the Agent request timeout in milliseconds. */
  timeout?: number;
  /** Logs rule engine warnings and outcomes without values. */
  logger?: GenericLogger;
};

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
    name: 'appconfig-agent',
    logger: options.logger,
    source: createDocumentSource({
      storeName: 'appconfig-agent',
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

export type { AppConfigAgentStoreOptions };
export { appConfigAgentStore };
