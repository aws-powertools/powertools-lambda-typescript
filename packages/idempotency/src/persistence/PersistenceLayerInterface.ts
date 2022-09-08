import { IdempotencyConfig } from '../IdempotencyConfig';
import { IdempotencyRecord } from './PersistenceLayer';

interface PersistenceLayerInterface {
  configure(config: IdempotencyConfig): void
  saveInProgress(): Promise<void>
  saveSuccess(): Promise<void>
  deleteRecord(): Promise<void>
  getRecord(): Promise<IdempotencyRecord>
}

export { PersistenceLayerInterface };
