import { IdempotencyRecordStatus } from './IdempotencyRecordStatus';

type IdempotencyRecordOptions = {
  idempotencyKey: string
  status: IdempotencyRecordStatus
  expiryTimestamp?: number
  inProgressExpiryTimestamp?: number
  responseData?: Record<string, unknown>
  payloadHash?: string
};

export {
  IdempotencyRecordOptions
};