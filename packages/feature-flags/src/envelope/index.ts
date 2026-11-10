import type { JSONObject } from '@aws-lambda-powertools/commons/types';
import { search as JMESPathSearch } from '@aws-lambda-powertools/jmespath';
import { PowertoolsFunctions } from '@aws-lambda-powertools/jmespath/functions';

/**
 * Searches a configuration with JMESPath and the Powertools custom functions.
 *
 * Install `@aws-lambda-powertools/jmespath` to use this optional helper.
 * @param expression - Select the embedded Flag Document
 * @param data - Supply the retrieved configuration
 * @example
 * ```typescript
 * import { appConfigAgentStore } from '@aws-lambda-powertools/feature-flags/appconfig-agent';
 * import { search } from '@aws-lambda-powertools/feature-flags/envelope';
 *
 * const store = appConfigAgentStore({
 *   application: 'my-app', environment: 'prod', name: 'features',
 *   envelope: 'powertools_json(settings).flags', envelopeSearchFn: search,
 * });
 * ```
 */
const search = (expression: string, data: unknown): unknown => {
  // Match Logger's JMESPath input boundary; the search engine checks operands at runtime.
  return JMESPathSearch(expression, data as JSONObject, {
    customFunctions: new PowertoolsFunctions(),
  });
};

export { search };
