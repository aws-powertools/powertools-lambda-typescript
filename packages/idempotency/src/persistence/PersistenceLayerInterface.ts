import { IdempotencyRecord } from './IdempotencyRecord';

interface PersistenceLayerInterface {
  configure(functionName: string): void
  saveInProgress(data: unknown): Promise<void>
  saveSuccess(data: unknown, result: unknown): Promise<void>
  deleteRecord(data: unknown): Promise<void>
  getRecord(data: unknown): Promise<IdempotencyRecord>
}

export { PersistenceLayerInterface };
