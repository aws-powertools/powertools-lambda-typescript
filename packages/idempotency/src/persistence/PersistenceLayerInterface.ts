import { IdempotencyRecord } from './PersistenceLayer';

interface PersistenceLayerInterface {
  configure(functionName: string): void
  saveInProgress(): Promise<void>
  saveSuccess(): Promise<void>
  deleteRecord(): Promise<void>
  getRecord(): Promise<IdempotencyRecord>
}

export { PersistenceLayerInterface };
