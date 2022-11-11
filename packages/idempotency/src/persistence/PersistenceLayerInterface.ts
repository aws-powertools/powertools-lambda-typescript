import { IdempotencyRecord } from './IdempotencyRecord';
import type { PersistenceLayerConfigureOptions } from '../types/PersistenceLayer';

interface PersistenceLayerInterface {
  configure(options?: PersistenceLayerConfigureOptions): void
  saveInProgress(data: unknown): Promise<void>
  saveSuccess(data: unknown, result: unknown): Promise<void>
  deleteRecord(data: unknown): Promise<void>
  getRecord(data: unknown): Promise<IdempotencyRecord>
}

export { PersistenceLayerInterface };
