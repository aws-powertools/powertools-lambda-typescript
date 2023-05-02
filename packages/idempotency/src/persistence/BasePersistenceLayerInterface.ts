import { IdempotencyRecord } from './IdempotencyRecord';
import type { BasePersistenceLayerOptions } from '../types/BasePersistenceLayer';

interface BasePersistenceLayerInterface {
  configure(options?: BasePersistenceLayerOptions): void;
  isPayloadValidationEnabled(): boolean;
  saveInProgress(data: unknown): Promise<void>;
  saveSuccess(data: unknown, result: unknown): Promise<void>;
  deleteRecord(data: unknown): Promise<void>;
  getRecord(data: unknown): Promise<IdempotencyRecord>;
}

export { BasePersistenceLayerInterface };
