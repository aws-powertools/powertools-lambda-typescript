const IdempotencyRecordStatus = {
  INPROGRESS: 'INPROGRESS',
  COMPLETED: 'COMPLETED',
  EXPIRED: 'EXPIRED'
} as const;

type IdempotencyRecordStatus = typeof IdempotencyRecordStatus[keyof typeof IdempotencyRecordStatus];

type IdempotencyRecordOptions = {
  idempotencyKey: string
  status: IdempotencyRecordStatus
  expiryTimestamp?: number
  inProgressExpiryTimestamp?: number
  responseData?: Record<string, unknown>
  payloadHash?: string
};

export {
  IdempotencyRecordStatus,
  IdempotencyRecordOptions
};