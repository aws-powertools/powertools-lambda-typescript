import { IdempotencyConfig } from '../IdempotencyConfig';

type BasePersistenceLayerOptions = {
  config: IdempotencyConfig
  functionName?: string
};

export { 
  BasePersistenceLayerOptions,
};