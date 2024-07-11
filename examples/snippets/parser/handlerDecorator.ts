import type { Context } from 'aws-lambda';
import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import { parser } from '@aws-lambda-powertools/parser';
import { Logger } from '@aws-lambda-powertools/logger';
import { orderSchema, type Order } from './schema.js';

const logger = new Logger();

class Lambda implements LambdaInterface {
  @parser({ schema: orderSchema })
  public async handler(event: Order, _context: Context): Promise<number> {
    logger.info('Processing event', { event });

    // ... business logic
    return event.id;
  }
}

const myFunction = new Lambda();
export const handler = myFunction.handler.bind(myFunction);
