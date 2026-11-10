import type { GenericLogger } from '@aws-lambda-powertools/commons/types';
import { SchemaValidationError } from '../errors.js';
import type {
  DocumentValidator,
  RuleEngineSnapshot,
} from '../types/RuleEngine.js';
import { isJSONValue } from './json.js';
import { validate } from './validate.js';

/**
 * Returns a validator that reuses the last validation while document content is unchanged.
 * The returned function keeps state between calls: the last validated document and its content key.
 * It keeps exactly one entry, and invalid documents throw without replacing it.
 * @param logger - Log validation warnings without values
 * @internal
 */
const createValidationCache = (logger?: GenericLogger): DocumentValidator => {
  let lastValidated: RuleEngineSnapshot | undefined;

  return (document) => {
    // Check before stringifying: undefined, nonfinite numbers, and non-JSON objects can otherwise collide with valid JSON.
    if (!isJSONValue(document))
      throw new SchemaValidationError('Flag Document must contain JSON');
    const key = JSON.stringify(document);
    if (lastValidated?.key === key) return lastValidated.document;
    // Validate an owned copy so neither source mutations nor concurrent retrievals change this call's rules.
    const compiled = validate(structuredClone(document), logger);
    lastValidated = { key, document: compiled };
    return compiled;
  };
};

export { createValidationCache };
