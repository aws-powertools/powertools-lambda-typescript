/**
 * Statuses for an idempotency record.
 */
const IdempotencyRecordStatus = {
  INPROGRESS: 'INPROGRESS',
  COMPLETED: 'COMPLETED',
  EXPIRED: 'EXPIRED',
} as const;

export { IdempotencyRecordStatus };
