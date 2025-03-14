import type { JSONValue } from '@aws-lambda-powertools/commons/types';
import type { IdempotencyRecordStatus } from '../constants.js';

/**
 * The status of an IdempotencyRecord
 */
type IdempotencyRecordStatusValue =
  (typeof IdempotencyRecordStatus)[keyof typeof IdempotencyRecordStatus];

/**
 * Options for creating a new IdempotencyRecord
 */
type IdempotencyRecordOptions = {
  /**
   * The idempotency key of the record that is used to identify the record.
   */
  idempotencyKey: string;
  /**
   * An optional sort key that can be used with the {@link DynamoDBPersistenceLayer | `DynamoDBPersistenceLayer`}.
   */
  sortKey?: string;
  /**
   * The idempotency record status can be COMPLETED, IN_PROGRESS or EXPIRED.
   * We check the status during idempotency processing to make sure we don't process an expired record and handle concurrent requests.
   * {@link constants.IdempotencyRecordStatusValue | IdempotencyRecordStatusValue}
   */
  status: IdempotencyRecordStatusValue;
  /**
   * The expiry timestamp of the record in milliseconds UTC.
   */
  expiryTimestamp?: number;
  /**
   * The expiry timestamp of the in progress record in milliseconds UTC.
   */
  inProgressExpiryTimestamp?: number;
  /**
   * The response data of the request, this will be returned if the payload hash matches.
   */
  responseData?: JSONValue;
  /**
   * The hash of the payload of the request, used for comparing requests.
   */
  payloadHash?: string;
};

export type { IdempotencyRecordStatusValue, IdempotencyRecordOptions };
