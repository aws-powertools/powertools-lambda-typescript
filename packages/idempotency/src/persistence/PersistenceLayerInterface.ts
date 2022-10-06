import { IdempotencyRecord } from './PersistenceLayer';

interface PersistenceLayerInterface {
  configure(functionName: string): void
  saveInProgress(data: unknown): Promise<void>
  saveSuccess(data: unknown): Promise<void>
  deleteRecord(): Promise<void>
  getRecord(): Promise<IdempotencyRecord>
}

export { PersistenceLayerInterface };
