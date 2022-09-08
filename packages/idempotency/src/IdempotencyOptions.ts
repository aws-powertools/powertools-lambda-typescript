import { IdempotencyPersistenceConfig } from './IdempotencyPersistenceConfig';
import { PersistenceLayer } from './persistence/PersistenceLayer';

type IdempotencyOptions = {
  dataKeywordArgument: string
  config: IdempotencyPersistenceConfig
  persistenceStore: PersistenceLayer
};

export { IdempotencyOptions };
