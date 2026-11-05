import type { JSONValue } from '@aws-lambda-powertools/commons/types';
import { search } from '@aws-lambda-powertools/jmespath';
import { SchemaValidationError } from '../errors.js';

/**
 * Selects a Flag Document without falling back after an envelope miss.
 * @param document - Supply the JSON configuration
 * @param envelope - Select the Flag Document with a JMESPath expression
 * @internal
 */
const applyEnvelope = (document: JSONValue, envelope?: string): JSONValue => {
  if (envelope === undefined) return document;
  const result = search(envelope, document);
  if (result === undefined || result === null) {
    throw new SchemaValidationError(
      `Envelope '${envelope}' did not select a Flag Document`
    );
  }
  // Built-in JMESPath functions operate on JSON; the rule engine validates the selected document.
  return result as JSONValue;
};

export { applyEnvelope };
