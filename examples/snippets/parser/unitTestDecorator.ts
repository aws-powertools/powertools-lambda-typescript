import type { Context } from 'aws-lambda';
import { describe, expect, it } from 'vitest';
import { handler } from './decorator.js';
import type { Order } from './schema.js';

describe('Test handler', () => {
  it('should parse event successfully', async () => {
    const testEvent = {
      id: 123,
      description: 'test',
      items: [
        {
          id: 1,
          quantity: 1,
          description: 'item1',
        },
      ],
    };

    await expect(handler(testEvent, {} as Context)).resolves.toEqual(123);
  });

  it('should throw error if event is invalid', async () => {
    const testEvent = { foo: 'bar' };
    await expect(
      handler(
        testEvent as unknown as Order, // (1)!
        {} as Context
      )
    ).rejects.toThrow();
  });
});
