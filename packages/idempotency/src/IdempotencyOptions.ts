import { IdempotencyConfig } from './IdempotencyConfig';
import { PersistenceLayer } from './PersistenceLayer';

type IdempotencyOptions = {
  dataKeywordArgument: string
  config: IdempotencyConfig
  persistenceStore: PersistenceLayer
};

export { IdempotencyOptions };
