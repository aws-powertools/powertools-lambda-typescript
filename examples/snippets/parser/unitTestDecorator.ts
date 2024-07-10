import { orderSchema } from 'examples/snippets/parser/schema';
import { Context } from 'aws-lambda';
import { handler } from 'examples/snippets/parser/decorator';
import { z } from 'zod';

describe('Test handler', () => {
  type Order = z.infer<typeof orderSchema>;

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

    await expect(handler(testEvent, {} as Context)).resolves.not.toThrow();
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
