import { IdempotencyConfig } from './IdempotencyConfig';

interface PersistenceLayerInterface {
  configure(config: IdempotencyConfig): void
  saveInProgress(): void
  saveSuccess(): void
  deleteRecord(): void
  getRecord(): void
}

export { PersistenceLayerInterface };
