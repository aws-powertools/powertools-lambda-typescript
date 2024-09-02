import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import { Logger } from '@aws-lambda-powertools/logger';
import { parser } from '@aws-lambda-powertools/parser';
import { EventBridgeEnvelope } from '@aws-lambda-powertools/parser/envelopes';
import type {
  EventBridgeEvent,
  ParsedResult,
} from '@aws-lambda-powertools/parser/types';
import type { Context } from 'aws-lambda';
import { type Order, orderSchema } from './schema.js';

const logger = new Logger();

class Lambda implements LambdaInterface {
  @parser({
    schema: orderSchema,
    envelope: EventBridgeEnvelope,
    safeParse: true,
  })
  public async handler(
    event: ParsedResult<EventBridgeEvent, Order>,
    _context: Context
  ): Promise<number> {
    logger.info('Processing event', { event });
    if (event.success) {
      // ... business logic
      return event.data.id;
    }
    logger.error('Failed to parse event', { event });
    throw new Error('Failed to parse event');
  }
}

const myFunction = new Lambda();
export const handler = myFunction.handler.bind(myFunction);
