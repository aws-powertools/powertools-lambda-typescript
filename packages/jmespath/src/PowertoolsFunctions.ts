import { gunzipSync } from 'node:zlib';
import type { JSONValue } from '@aws-lambda-powertools/commons/types';
import { fromBase64 } from '@aws-lambda-powertools/commons/utils/base64';
import type { extractDataFromEnvelope } from './envelopes.js';
import { Functions } from './Functions.js';
import type { search } from './search.js';

const decoder = new TextDecoder('utf-8');

/**
 * Custom functions for the Powertools for AWS Lambda JMESPath module.
 *
 * Built-in JMESPath functions include: `powertools_json`, `powertools_base64`, `powertools_base64_gzip`
 *
 * You can use these functions to decode and/or deserialize JSON objects when using the {@link search | `search`} function.
 *
 * When using the {@link extractDataFromEnvelope | extractDataFromEnvelope} uses these functions internally.
 *
 * @example
 * ```typescript
 * import { search } from '@aws-lambda-powertools/jmespath';
 * import { PowertoolsFunctions } from '@aws-lambda-powertools/jmespath/functions';
 *
 * const data = {
 *   body: "{\"foo\": \"bar\"}"
 * };
 *
 * const result = search(
 *   'powertools_json(body)',
 *   data,
 *   { customFunctions: new PowertoolsFunctions() }
 * );
 * console.log(result); // { foo: 'bar' }
 * ```
 */
class PowertoolsFunctions extends Functions {
  @Functions.signature({
    argumentsSpecs: [['string']],
  })
  public funcPowertoolsBase64(value: string): string {
    return decoder.decode(fromBase64(value, 'base64'));
  }

  @Functions.signature({
    argumentsSpecs: [['string']],
  })
  public funcPowertoolsBase64Gzip(value: string): string {
    const encoded = fromBase64(value, 'base64');
    const uncompressed = gunzipSync(encoded);

    return uncompressed.toString();
  }

  @Functions.signature({
    argumentsSpecs: [['string']],
  })
  public funcPowertoolsJson(value: string): JSONValue {
    return JSON.parse(value);
  }
}

export { Functions } from './Functions.js';
export { PowertoolsFunctions };
