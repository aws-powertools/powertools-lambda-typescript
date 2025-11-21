import { setTimeout } from 'node:timers/promises';
import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import { Logger } from '@aws-lambda-powertools/logger';
import type { Context } from 'aws-lambda';
import { IdempotencyConfig } from '../../src/IdempotencyConfig.js';
import { idempotent } from '../../src/idempotencyDecorator.js';
import { DynamoDBPersistenceLayer } from '../../src/persistence/DynamoDBPersistenceLayer.js';

const IDEMPOTENCY_TABLE_NAME =
  process.env.IDEMPOTENCY_TABLE_NAME || 'table_name';
const dynamoDBPersistenceLayer = new DynamoDBPersistenceLayer({
  tableName: IDEMPOTENCY_TABLE_NAME,
});

const dynamoDBPersistenceLayerCustomized = new DynamoDBPersistenceLayer({
  tableName: IDEMPOTENCY_TABLE_NAME,
  dataAttr: 'dataAttr',
  keyAttr: 'customId',
  expiryAttr: 'expiryAttr',
  statusAttr: 'statusAttr',
  inProgressExpiryAttr: 'inProgressExpiryAttr',
  staticPkValue: 'staticPkValue',
  validationKeyAttr: 'validationKeyAttr',
});

const config = new IdempotencyConfig({});

class DefaultLambda implements LambdaInterface {
  private readonly message = 'Got test event:';

  @idempotent({ persistenceStore: dynamoDBPersistenceLayer })
  public async handler(
    _event: Record<string, unknown>,
    _context: Context
  ): Promise<void> {
    logger.info(`${this.message} ${JSON.stringify(_event)}`);
    // sleep to enforce error with parallel execution
    await setTimeout(1000);
  }

  @idempotent({
    persistenceStore: dynamoDBPersistenceLayerCustomized,
    config: config,
  })
  public handlerCustomized(event: { foo: string }, context: Context) {
    config.registerLambdaContext(context);
    logger.info('Processed event', { details: event.foo });

    return event.foo;
  }

  @idempotent({
    persistenceStore: dynamoDBPersistenceLayer,
    config: new IdempotencyConfig({
      useLocalCache: false,
      expiresAfterSeconds: 1,
      eventKeyJmesPath: 'foo',
    }),
  })
  public handlerExpired(
    event: { foo: string; invocation: number },
    context: Context
  ) {
    logger.addContext(context);

    logger.info('Processed event', { details: event.foo });

    return {
      foo: event.foo,
      invocation: event.invocation,
    };
  }

  @idempotent({ persistenceStore: dynamoDBPersistenceLayer })
  public async handlerParallel(event: { foo: string }, context: Context) {
    logger.addContext(context);

    await setTimeout(1500);

    logger.info('Processed event', { details: event.foo });

    return event.foo;
  }

  @idempotent({
    persistenceStore: dynamoDBPersistenceLayer,
    config: new IdempotencyConfig({
      eventKeyJmesPath: 'foo',
    }),
  })
  public async handlerTimeout(
    event: { foo: string; invocation: number },
    context: Context
  ) {
    logger.addContext(context);

    if (event.invocation === 0) {
      await setTimeout(4000);
    }

    logger.info('Processed event', {
      details: event.foo,
    });

    return {
      foo: event.foo,
      invocation: event.invocation,
    };
  }
}

const defaultLambda = new DefaultLambda();
const handler = defaultLambda.handler.bind(defaultLambda);
const handlerParallel = defaultLambda.handlerParallel.bind(defaultLambda);

const handlerCustomized = defaultLambda.handlerCustomized.bind(defaultLambda);

const handlerTimeout = defaultLambda.handlerTimeout.bind(defaultLambda);

const handlerExpired = defaultLambda.handlerExpired.bind(defaultLambda);

const logger = new Logger();

class LambdaWithKeywordArgument implements LambdaInterface {
  public async handler(event: { id: string }, context: Context) {
    config.registerLambdaContext(context);
    await this.process(event.id, 'bar');

    return 'Hello World Keyword Argument';
  }

  @idempotent({
    persistenceStore: dynamoDBPersistenceLayer,
    config: config,
    dataIndexArgument: 1,
  })
  public async process(id: string, foo: string) {
    await setTimeout(1);
    logger.info('Got test event', { id, foo });

    return `idempotent result: ${foo}`;
  }
}

const handlerDataIndexArgument = new LambdaWithKeywordArgument();
const handlerWithKeywordArgument = handlerDataIndexArgument.handler.bind(
  handlerDataIndexArgument
);

export {
  handler,
  handlerCustomized,
  handlerExpired,
  handlerWithKeywordArgument,
  handlerTimeout,
  handlerParallel,
};
