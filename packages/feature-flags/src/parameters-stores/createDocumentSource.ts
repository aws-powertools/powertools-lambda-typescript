import type { JSONValue } from '@aws-lambda-powertools/commons/types';
import { StoreUnavailableError } from '../errors.js';
import type { EnvelopeOptions } from '../types/Envelope.js';
import { isAvailabilityFailure } from './classify.js';
import { applyEnvelope } from './envelope.js';

/**
 * Creates a Flag Document source with shared availability and envelope handling.
 * @param {Object} options - Configure retrieval and document selection
 * @param {string} options.storeName - Name the Store in availability errors
 * @param {Function} options.retrieve - Retrieve JSON with missing configurations rejected
 * @param {string} options.envelope - Select an embedded Flag Document
 * @param {Function} options.envelopeSearchFn - Apply the envelope expression
 * @internal
 */
const createDocumentSource =
  ({
    storeName,
    retrieve,
    ...envelopeOptions
  }: {
    storeName: string;
    retrieve: () => Promise<JSONValue>;
  } & EnvelopeOptions): (() => Promise<JSONValue>) =>
  async () => {
    let document: JSONValue;
    try {
      document = await retrieve();
    } catch (error) {
      if (isAvailabilityFailure(error)) {
        throw new StoreUnavailableError(`${storeName} is unavailable`, {
          cause: error,
        });
      }
      throw error;
    }
    return applyEnvelope(document, envelopeOptions);
  };

export { createDocumentSource };
