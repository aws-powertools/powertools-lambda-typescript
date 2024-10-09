import type { JSONValue } from '@aws-lambda-powertools/commons/types';
import {
  IdempotencyConfig,
  makeIdempotent,
} from '@aws-lambda-powertools/idempotency';
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';
import {
  Functions,
  PowertoolsFunctions,
} from '@aws-lambda-powertools/jmespath/functions';

const persistenceStore = new DynamoDBPersistenceLayer({
  tableName: 'idempotencyTableName',
});

class MyFancyFunctions extends PowertoolsFunctions {
  @Functions.signature({
    argumentsSpecs: [['string']],
  })
  public funcMyFancyFunction(value: string): JSONValue {
    return JSON.parse(value);
  }
}

export const handler = makeIdempotent(async () => true, {
  persistenceStore,
  config: new IdempotencyConfig({
    eventKeyJmesPath: 'my_fancy_function(body).["user", "productId"]',
    jmesPathOptions: new MyFancyFunctions(),
  }),
});
