import type { Context } from 'aws-lambda';
import { BasePersistenceLayer } from '../persistence/BasePersistenceLayer';

type IdempotencyOptions = {
  dataKeywordArgument: string
  persistenceStore: BasePersistenceLayer
};

/**
 * Idempotency configuration options
 */
type IdempotencyConfigOptions = {
  /**
   * An optional JMESPath expression to extract the idempotency key from the event record
   */
  eventKeyJmesPath?: string
  /**
   * An optional JMESPath expression to extract the payload to be validated from the event record
   */
  payloadValidationJmesPath?: string
  /**
   * Throw an error if no idempotency key was found in the request, defaults to `false`
   */
  throwOnNoIdempotencyKey?: boolean
  /**
   * The number of seconds to wait before a record is expired, defaults to `3600` (1 hour)
   */
  expiresAfterSeconds?: number
  /**
   * Wheter to locally cache idempotency results, defaults to `false`
   */
  useLocalCache?: boolean
  /**
   * Number of records to keep in the local cache, defaults to `256`
   */
  maxLocalCacheSize?: number
  /**
   * Function to use for calculating hashes, defaults to `md5`
   */
  hashFunction?: string
  /**
   * AWS Lambda Context object containing information about the current invocation, function, and execution environment
   */
  lambdaContext?: Context
};

export {
  IdempotencyOptions,
  IdempotencyConfigOptions
};
