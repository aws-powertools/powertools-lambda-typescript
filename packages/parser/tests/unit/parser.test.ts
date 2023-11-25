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
import { z, ZodSchema } from 'zod';

describe('Middleware: parser', () => {
  const schema = z.object({
    name: z.string(),
    age: z.number().min(18).max(99),
  });
  type schema = z.infer<typeof schema>;
  const handler = async (
    event: schema | unknown,
    _context: Context
  ): Promise<schema | unknown> => {
    return event;
  };

  describe(' when envelope is provided ', () => {
    const middyfiedHandler = middy(handler).use(
      parser({ schema: schema, envelope: Envelopes.SQS_ENVELOPE })
    );

    it('should parse request body with schema and envelope', async () => {
      const bodyMock = generateMock(schema);

      const event = generateMock(SqsSchema, {
        stringMap: {
          body: () => JSON.stringify(bodyMock),
        },
      });

      const result = (await middyfiedHandler(event, {} as Context)) as schema[];
      result.forEach((item) => {
        expect(item).toEqual(bodyMock);
      });
    });

    it('should throw when envelope does not match', async () => {
      await expect(async () => {
        await middyfiedHandler({ name: 'John', age: 18 }, {} as Context);
      }).rejects.toThrowError();
    });

    it('should throw when schema does not match', async () => {
      const event = generateMock(SqsSchema, {
        stringMap: {
          body: () => '42',
        },
      });

      await expect(middyfiedHandler(event, {} as Context)).rejects.toThrow();
    });
    it('should throw when provided schema is invalid', async () => {
      const middyfiedHandler = middy(handler).use(
        parser({ schema: {} as ZodSchema, envelope: Envelopes.SQS_ENVELOPE })
      );

      await expect(middyfiedHandler(42, {} as Context)).rejects.toThrowError();
    });
    it('should throw when envelope is correct but schema is invalid', async () => {
      const event = generateMock(SqsSchema, {
        stringMap: {
          body: () => JSON.stringify({ name: 'John', foo: 'bar' }),
        },
      });

      const middyfiedHandler = middy(handler).use(
        parser({ schema: {} as ZodSchema, envelope: Envelopes.SQS_ENVELOPE })
      );

      await expect(
        middyfiedHandler(event, {} as Context)
      ).rejects.toThrowError();
    });
  });

  describe(' when envelope is not provided', () => {
    it('should parse the event with built-in schema', async () => {
      const event = generateMock(SqsSchema);

      const middyfiedHandler = middy(handler).use(
        parser({ schema: SqsSchema })
      );

      expect(await middyfiedHandler(event, {} as Context)).toEqual(event);
    });

    it('should parse custom event', async () => {
      const event = { name: 'John', age: 18 };
      const middyfiedHandler = middy(handler).use(parser({ schema }));

      expect(await middyfiedHandler(event, {} as Context)).toEqual(event);
    });

    it('should throw when the schema does not match', async () => {
      const middyfiedHandler = middy(handler).use(parser({ schema }));

      await expect(middyfiedHandler(42, {} as Context)).rejects.toThrow();
    });

    it('should throw when provided schema is invalid', async () => {
      const middyfiedHandler = middy(handler).use(
        parser({ schema: {} as ZodSchema })
      );

      await expect(
        middyfiedHandler({ foo: 'bar' }, {} as Context)
      ).rejects.toThrowError();
    });
  });
});
