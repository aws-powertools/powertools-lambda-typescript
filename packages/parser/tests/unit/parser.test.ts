/**
 * Test middelware parser
 *
 * @group unit/parser
 */

import middy from '@middy/core';
import { Context } from 'aws-lambda';
import { parser } from '../../src/middleware/parser.js';
import { generateMock } from '@anatine/zod-mock';
import { SqsSchema } from '../../src/schemas/sqs.js';
import { Envelopes } from '../../src/envelopes/SqsEnvelope.js';
import { z } from 'zod';

describe('Middleware: parser', () => {
  const schema = z.object({
    name: z.string(),
    age: z.number().min(18).max(99),
  });
  const handler = async (
    event: unknown,
    _context: Context
  ): Promise<z.infer<typeof schema> | unknown> => {
    return event;
  };

  it('should parse the event with built-in schema', async () => {
    const event = generateMock(SqsSchema);

    const handler = middy(async (event: unknown, _context: Context) => {
      return event;
    }).use(parser({ schema: SqsSchema }));
    const result = await handler(event, {} as Context);
    expect(result).toEqual(event);
  });

  it('should parse request body with schema and envelope', async () => {
    const bodyMock = generateMock(schema);

    const event = generateMock(SqsSchema, {
      stringMap: {
        body: () => JSON.stringify(bodyMock),
      },
    });

    const middyfiedHandler = middy(handler).use(
      parser({ schema: schema, envelope: Envelopes.SQS_ENVELOPE })
    );

    const result = (await middyfiedHandler(event, {} as Context)) as z.infer<
      typeof schema
    >[];
    result.forEach((item) => {
      expect(item).toEqual(bodyMock);
    });
  });
});
