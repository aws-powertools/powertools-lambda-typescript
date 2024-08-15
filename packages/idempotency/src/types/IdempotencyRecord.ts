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
  idempotencyKey: string;
  status: IdempotencyRecordStatusValue;
  expiryTimestamp?: number;
  inProgressExpiryTimestamp?: number;
  responseData?: JSONValue;
  payloadHash?: string;
};

export type { IdempotencyRecordStatusValue, IdempotencyRecordOptions };
