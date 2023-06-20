import type { Context } from 'aws-lambda';
import { LambdaInterface } from '@aws-lambda-powertools/commons';
import { idempotentFunction, idempotentLambdaHandler } from '../../src';
import { Logger } from '../../../logger';
import { DynamoDBPersistenceLayer } from '../../src/persistence/DynamoDBPersistenceLayer';
import { IdempotencyConfig } from '../../src/';

const IDEMPOTENCY_TABLE_NAME =
  process.env.IDEMPOTENCY_TABLE_NAME || 'table_name';
const dynamoDBPersistenceLayer = new DynamoDBPersistenceLayer({
  tableName: IDEMPOTENCY_TABLE_NAME,
});

const ddbPersistenceLayerCustomized = new DynamoDBPersistenceLayer({
  tableName: IDEMPOTENCY_TABLE_NAME,
  dataAttr: 'dataattr',
  keyAttr: 'customId',
  expiryAttr: 'expiryattr',
  statusAttr: 'statusattr',
  inProgressExpiryAttr: 'inprogressexpiryattr',
  staticPkValue: 'staticpkvalue',
  validationKeyAttr: 'validationkeyattr',
});

interface TestEvent {
  [key: string]: string;
}

interface EventRecords {
  records: Record<string, unknown>[];
}

class DefaultLambda implements LambdaInterface {
  @idempotentLambdaHandler({ persistenceStore: dynamoDBPersistenceLayer })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  public async handler(_event: Record, _context: Context): Promise<string> {
    logger.info(`Got test event: ${JSON.stringify(_event)}`);
    // sleep to enforce error with parallel execution
    await new Promise((resolve) => setTimeout(resolve, 3000));

    return 'Hello World';
  }

  @idempotentLambdaHandler({ persistenceStore: ddbPersistenceLayerCustomized })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  public async handlerCustomized(
    _event: TestEvent,
    _context: Context
  ): Promise<string> {
    logger.info(`Got test event customized: ${JSON.stringify(_event)}`);
    // sleep for 5 seconds

    return 'Hello World Customized';
  }

  @idempotentLambdaHandler({ persistenceStore: dynamoDBPersistenceLayer })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  public async handlerFails(
    _event: TestEvent,
    _context: Context
  ): Promise<string> {
    logger.info(`Got test event: ${JSON.stringify(_event)}`);

    throw new Error('Failed');
  }

  @idempotentLambdaHandler({
    persistenceStore: dynamoDBPersistenceLayer,
    config: new IdempotencyConfig({
      eventKeyJmesPath: 'idempotencyKey',
      throwOnNoIdempotencyKey: false,
    }),
  })
  public async handlerWithOptionalIdempoitencyKey(
    _event: TestEvent,
    _context: Context
  ): Promise<string> {
    logger.info(`Got test event: ${JSON.stringify(_event)}`);

    return 'This should not be stored in DynamoDB';
  }
}

const defaultLambda = new DefaultLambda();
export const handler = defaultLambda.handler.bind(defaultLambda);
export const handlerCustomized =
  defaultLambda.handlerCustomized.bind(defaultLambda);
export const handlerFails = defaultLambda.handlerFails.bind(defaultLambda);

export const handlerWithOptionalIdempoitencyKey =
  defaultLambda.handlerWithOptionalIdempoitencyKey.bind(defaultLambda);

const logger = new Logger();

class LambdaWithKeywordArgument implements LambdaInterface {
  public async handler(
    _event: EventRecords,
    _context: Context
  ): Promise<string> {
    logger.info(`Got test event: ${JSON.stringify(_event)}`);
    for (const record of _event.records) {
      logger.info(`Processing event: ${JSON.stringify(record)}`);
      await this.process(record);
    }

    return 'Hello World Keyword Argument';
  }

  @idempotentFunction({
    persistenceStore: dynamoDBPersistenceLayer,
    dataKeywordArgument: 'foo',
  })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  public async process(record: Record<string, unknown>): string {
    logger.info(`Processing inside: ${JSON.stringify(record)}`);

    return 'idempotent result: ' + record.foo;
  }
}

const lambdaWithKeywordArg = new LambdaWithKeywordArgument();
export const handlerWithKeywordArgument =
  lambdaWithKeywordArg.handler.bind(lambdaWithKeywordArg);
