import { Logger } from '@aws-lambda-powertools/logger';
import { parser } from '@aws-lambda-powertools/parser/middleware';
import middy from '@middy/core';
import {
  array,
  number,
  object,
  optional,
  pipe,
  string,
  toMinValue,
} from 'valibot';

const logger = new Logger();

const orderSchema = object({
  id: pipe(number(), toMinValue(0)),
  description: string(),
  items: array(
    object({
      id: pipe(number(), toMinValue(0)),
      quantity: pipe(number(), toMinValue(1)),
      description: string(),
    })
  ),
  optionalField: optional(string()),
});

export const handler = middy()
  .use(parser({ schema: orderSchema }))
  .handler(async (event): Promise<void> => {
    for (const item of event.items) {
      // item is parsed as OrderItem
      logger.info('Processing item', { item });
    }
  });
