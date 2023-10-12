import type { Context } from 'aws-lambda';
import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import { idempotent } from '../../src/idempotencyDecorator';
import { Logger } from '@aws-lambda-powertools/logger';
import { DynamoDBPersistenceLayer } from '../../src/persistence/DynamoDBPersistenceLayer.js';
import { IdempotencyConfig } from '../../src/IdempotencyConfig.js';

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
  @idempotent({ persistenceStore: dynamoDBPersistenceLayer })
  public async handler(
    _event: Record<string, unknown>,
    _context: Context
  ): Promise<string> {
    logger.info(`Got test event: ${JSON.stringify(_event)}`);
    // sleep to enforce error with parallel execution
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return 'Hello World';
  }

  @idempotent({
    persistenceStore: dynamoDBPersistenceLayerCustomized,
    config: config,
  })
  public async handlerCustomized(
    event: { foo: string },
    context: Context
  ): Promise<string> {
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
  public async handlerExpired(
    event: { foo: string; invocation: number },
    context: Context
  ): Promise<{ foo: string; invocation: number }> {
    logger.addContext(context);

    logger.info('Processed event', { details: event.foo });

    return {
      foo: event.foo,
      invocation: event.invocation,
    };
  }

  @idempotent({ persistenceStore: dynamoDBPersistenceLayer })
  public async handlerParallel(
    event: { foo: string },
    context: Context
  ): Promise<string> {
    logger.addContext(context);

    await new Promise((resolve) => setTimeout(resolve, 1500));

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
  ): Promise<{ foo: string; invocation: number }> {
    logger.addContext(context);

    if (event.invocation === 0) {
      await new Promise((resolve) => setTimeout(resolve, 4000));
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
  public async handler(
    event: { id: string },
    _context: Context
  ): Promise<string> {
    config.registerLambdaContext(_context);
    await this.process(event.id, 'bar');

    return 'Hello World Keyword Argument';
  }

  @idempotent({
    persistenceStore: dynamoDBPersistenceLayer,
    config: config,
    dataIndexArgument: 1,
  })
  public async process(id: string, foo: string): Promise<string> {
    logger.info('Got test event', { id, foo });

    return 'idempotent result: ' + foo;
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
