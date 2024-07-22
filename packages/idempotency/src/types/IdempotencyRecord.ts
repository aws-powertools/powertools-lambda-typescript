import type { JSONValue } from '@aws-lambda-powertools/commons/types';
import type { IdempotencyRecordStatus } from '../constants.js';

type IdempotencyRecordStatusValue =
  (typeof IdempotencyRecordStatus)[keyof typeof IdempotencyRecordStatus];

type IdempotencyRecordOptions = {
  idempotencyKey: string;
  status: IdempotencyRecordStatusValue;
  expiryTimestamp?: number;
  inProgressExpiryTimestamp?: number;
  responseData?: JSONValue;
  payloadHash?: string;
};

export type { IdempotencyRecordStatusValue, IdempotencyRecordOptions };
