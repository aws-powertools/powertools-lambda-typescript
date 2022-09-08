import { IdempotencyPersistenceConfig } from '../IdempotencyPersistenceConfig';
import { IdempotencyRecord } from './PersistenceLayer';

interface PersistenceLayerInterface {
  configure(config: IdempotencyPersistenceConfig): void
  saveInProgress(): Promise<void>
  saveSuccess(): Promise<void>
  deleteRecord(): Promise<void>
  getRecord(): Promise<IdempotencyRecord>
}

export { PersistenceLayerInterface };
