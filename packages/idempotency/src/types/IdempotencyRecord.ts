import type { JSONValue } from '@aws-lambda-powertools/commons';

const IdempotencyRecordStatus = {
  INPROGRESS: 'INPROGRESS',
  COMPLETED: 'COMPLETED',
  EXPIRED: 'EXPIRED',
} as const;

type IdempotencyRecordStatus =
  (typeof IdempotencyRecordStatus)[keyof typeof IdempotencyRecordStatus];

type IdempotencyRecordOptions = {
  idempotencyKey: string;
  status: IdempotencyRecordStatus;
  expiryTimestamp?: number;
  inProgressExpiryTimestamp?: number;
  responseData?: JSONValue;
  payloadHash?: string;
};

export { IdempotencyRecordStatus, IdempotencyRecordOptions };
