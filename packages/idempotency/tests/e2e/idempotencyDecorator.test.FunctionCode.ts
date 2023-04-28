import { LambdaInterface } from '@aws-lambda-powertools/commons';
import { DynamoDBPersistenceLayer } from '../../src/persistence';
import { idempotent } from '../../src/idempotentDecorator';
import { Context } from 'aws-lambda';
import { Logger } from '../../../logger';

const IDEMPOTENCY_TABLE_NAME = process.env.IDEMPOTENCY_TABLE_NAME;
const dynamoDBPersistenceLayer = new DynamoDBPersistenceLayer({
  tableName: IDEMPOTENCY_TABLE_NAME,
});

interface TestEvent {
  username: string
}

const logger = new Logger();

class Lambda implements LambdaInterface {
  @idempotent({ persistenceStore: dynamoDBPersistenceLayer })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  public async handler(_event: TestEvent, _context: Context): Promise<string> {
    logger.info(JSON.stringify(_event));

    return 'Hello World ' + _event.username;
  }
}

export const handlerClass = new Lambda();
export const handler = handlerClass.handler.bind(handlerClass);