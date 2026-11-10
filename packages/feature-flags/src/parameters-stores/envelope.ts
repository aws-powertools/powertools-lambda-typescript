import type { JSONValue } from '@aws-lambda-powertools/commons/types';
import { FeatureFlagsError, SchemaValidationError } from '../errors.js';
import type { EnvelopeOptions, EnvelopeSearchFn } from '../types/Envelope.js';

/**
 * Rejects incomplete envelope options before a Store constructs its transport.
 * @param {Object} options - Supply the document selection options
 * @param {string} options.envelope - Select an embedded Flag Document
 * @param {Function} options.envelopeSearchFn - Apply the envelope expression
 * @internal
 */
const validateEnvelopeOptions = (options: {
  envelope?: string;
  envelopeSearchFn?: EnvelopeSearchFn;
}): EnvelopeOptions => {
  const { envelope, envelopeSearchFn } = options;
  if (envelope === undefined && envelopeSearchFn === undefined) return {};
  if (envelope === undefined || envelopeSearchFn === undefined) {
    throw new FeatureFlagsError(
      "Options 'envelope' and 'envelopeSearchFn' must be provided together"
    );
  }
  return { envelope, envelopeSearchFn };
};

/**
 * Selects a Flag Document without falling back after an envelope miss.
 * @param document - Supply the JSON configuration
 * @param options - Select the Flag Document with an expression and search function
 * @internal
 */
const applyEnvelope = (
  document: JSONValue,
  options: EnvelopeOptions
): JSONValue => {
  const { envelope, envelopeSearchFn } = options;
  if (envelope === undefined) return document;
  const result = envelopeSearchFn(envelope, document);
  if (result === undefined || result === null) {
    throw new SchemaValidationError(
      `Envelope '${envelope}' did not select a Flag Document`
    );
  }
  // Search functions return unknown; the rule engine validates the selected document at the JSON boundary.
  return result as JSONValue;
};

export { applyEnvelope, validateEnvelopeOptions };
