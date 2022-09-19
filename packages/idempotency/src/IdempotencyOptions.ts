import { PersistenceLayer } from './persistence/PersistenceLayer';

type IdempotencyOptions = {
  dataKeywordArgument: string
  persistenceStore: PersistenceLayer
};

export { IdempotencyOptions };
