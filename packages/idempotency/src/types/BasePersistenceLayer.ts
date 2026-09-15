import type { IdempotencyConfig } from '../IdempotencyConfig.js';
import type { IdempotencyRecord } from '../persistence/IdempotencyRecord.js';

type BasePersistenceLayerOptions = {
  config: IdempotencyConfig;
  functionName?: string;
  keyPrefix?: string;
};

/**
 * The idempotency key and payload hash that identify the record of an operation.
 *
 * It is resolved from the payload before the operation starts, so completion and cleanup
 * target the same record even if the payload is mutated while the operation runs.
 */
type IdempotencyRecordIdentity = Pick<
  IdempotencyRecord,
  'idempotencyKey' | 'payloadHash'
>;

interface BasePersistenceLayerInterface {
  configure(options?: BasePersistenceLayerOptions): void;
  isPayloadValidationEnabled(): boolean;
  saveInProgress(
    data: unknown,
    remainingTimeInMillis?: number,
    identity?: IdempotencyRecordIdentity
  ): Promise<void>;
  saveSuccess(
    data: unknown,
    result: unknown,
    identity?: IdempotencyRecordIdentity
  ): Promise<void>;
  deleteRecord(
    data: unknown,
    identity?: IdempotencyRecordIdentity
  ): Promise<void>;
  getRecord(data: unknown): Promise<IdempotencyRecord>;
}

/**
 * Base attributes used by the persistence layer i.e. DynamoDB, Redis, etc.
 *
 * @interface
 * @property {string} [expiryAttr] - The attribute name for expiry timestamp. Defaults to 'expiration'.
 * @property {string} [inProgressExpiryAttr] - The attribute name for in-progress expiry timestamp. Defaults to 'in_progress_expiration'.
 * @property {string} [statusAttr] - The attribute name for status. Defaults to 'status'.
 * @property {string} [dataAttr] - The attribute name for response data. Defaults to 'data'.
 * @property {string} [validationKeyAttr] - The attribute name for hashed representation of the parts of the event used for validation. Defaults to 'validation'.
 */
interface BasePersistenceAttributes {
  expiryAttr?: string;
  inProgressExpiryAttr?: string;
  statusAttr?: string;
  dataAttr?: string;
  validationKeyAttr?: string;
}

export type {
  BasePersistenceAttributes,
  BasePersistenceLayerInterface,
  BasePersistenceLayerOptions,
  IdempotencyRecordIdentity,
};
