/**
 * Test middleware parser
 *
 * @group unit/parser
 */

import middy from '@middy/core';
import { Context } from 'aws-lambda';
import { parser } from '../../src/middleware/parser.js';
import { generateMock } from '@anatine/zod-mock';
import { SqsSchema } from '../../src/schemas/index.js';
import { z, type ZodSchema } from 'zod';
import { sqsEnvelope } from '../../src/envelopes/index.js';
import { TestSchema } from './schema/utils';

describe('Middleware: parser', () => {
  type schema = z.infer<typeof TestSchema>;
  const handler = async (
    event: unknown,
    _context: Context
  ): Promise<unknown> => {
    return event;
  };

  describe(' when envelope is provided ', () => {
    const middyfiedHandler = middy(handler).use(
      parser({ schema: TestSchema, envelope: sqsEnvelope })
    );

    it('should parse request body with schema and envelope', async () => {
      const bodyMock = generateMock(TestSchema);
      parser({ schema: TestSchema, envelope: sqsEnvelope });

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
        parser({ schema: {} as ZodSchema, envelope: sqsEnvelope })
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
        parser({ schema: {} as ZodSchema, envelope: sqsEnvelope })
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
      const middyfiedHandler = middy(handler).use(
        parser({ schema: TestSchema })
      );

      expect(await middyfiedHandler(event, {} as Context)).toEqual(event);
    });

    it('should throw when the schema does not match', async () => {
      const middyfiedHandler = middy(handler).use(
        parser({ schema: TestSchema })
      );

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
