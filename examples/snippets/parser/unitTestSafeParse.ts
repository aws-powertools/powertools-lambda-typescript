import type { Order } from './schema.js';
import type { Context } from 'aws-lambda';
import { handler } from './safeParseDecorator.js';
import {
  ParsedResult,
  EventBridgeEvent,
} from '@aws-lambda-powertools/parser/types';

describe('Test handler', () => {
  it('should parse event successfully', async () => {
    const testEvent = {
      version: '0',
      id: '6a7e8feb-b491-4cf7-a9f1-bf3703467718',
      'detail-type': 'OrderPurchased',
      source: 'OrderService',
      account: '111122223333',
      time: '2020-10-22T18:43:48Z',
      region: 'us-west-1',
      resources: ['some_additional'],
      detail: {
        id: 10876546789,
        description: 'My order',
        items: [
          {
            id: 1015938732,
            quantity: 1,
            description: 'item xpto',
          },
        ],
      },
    };

    await expect(
      handler(
        testEvent as unknown as ParsedResult<EventBridgeEvent, Order>, // (1)!
        {} as Context
      )
    ).resolves.toEqual(10876546789);
  });

  it('should throw error if event is invalid', async () => {
    const testEvent = { foo: 'bar' };
    await expect(
      handler(
        testEvent as unknown as ParsedResult<EventBridgeEvent, Order>,
        {} as Context
      )
    ).rejects.toThrow();
  });
});
