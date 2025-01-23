import { describe, expect, it } from 'vitest';
import { ZodError, z } from 'zod';
import { ParseError } from '../../../src';
import { LambdaFunctionUrlEnvelope } from '../../../src/envelopes/index.js';
import { JSONStringified } from '../../../src/helpers';
import type { LambdaFunctionUrlEvent } from '../../../src/types';
import { getTestEvent, omit } from '../schema/utils.js';

describe('Lambda Functions Url ', () => {
  const schema = z
    .object({
      message: z.string(),
    })
    .strict();

  const baseEvent = getTestEvent<LambdaFunctionUrlEvent>({
    eventsPath: 'lambda',
    filename: 'base',
  });

  describe('parse', () => {
    it('should throw if the payload does not match the schema', () => {
      // Prepare
      const event = structuredClone(baseEvent);

      // Act & Assess
      expect(() => LambdaFunctionUrlEnvelope.parse(event, schema)).toThrow(
        expect.objectContaining({
          message: expect.stringContaining(
            'Failed to parse Lambda function URL body'
          ),
          cause: expect.objectContaining({
            issues: [
              {
                code: 'invalid_type',
                expected: 'object',
                received: 'null',
                path: ['body'],
                message: 'Expected object, received null',
              },
            ],
          }),
        })
      );
    });

    it('parses a Lambda function URL event with plain text', () => {
      // Prepare
      const event = structuredClone(baseEvent);
      event.body = 'hello world';

      // Act
      const result = LambdaFunctionUrlEnvelope.parse(event, z.string());

      // Assess
      expect(result).toEqual('hello world');
    });

    it('parses a Lambda function URL event with JSON-stringified body', () => {
      // Prepare
      const event = structuredClone(baseEvent);
      event.body = JSON.stringify({ message: 'hello world' });

      // Act
      const result = LambdaFunctionUrlEnvelope.parse(
        event,
        JSONStringified(schema)
      );

      // Assess
      expect(result).toEqual({ message: 'hello world' });
    });

    it('parses a Lambda function URL event with binary body', () => {
      // Prepare
      const event = structuredClone(baseEvent);
      event.body = Buffer.from('hello world').toString('base64');
      event.headers['content-type'] = 'application/octet-stream';
      event.isBase64Encoded = true;

      // Act
      const result = LambdaFunctionUrlEnvelope.parse(event, z.string());

      // Assess
      expect(result).toEqual('aGVsbG8gd29ybGQ=');
    });
  });
  describe('safeParse', () => {
    it('should parse Lambda function URL event', () => {
      const event = structuredClone(baseEvent);
      event.body = JSON.stringify({ message: 'hello world' });

      const result = LambdaFunctionUrlEnvelope.safeParse(
        event,
        JSONStringified(schema)
      );

      expect(result).toEqual({
        success: true,
        data: { message: 'hello world' },
      });
    });

    it('should return error with original event if Lambda function URL event is not valid', () => {
      const event = omit(['rawPath'], structuredClone(baseEvent));

      const result = LambdaFunctionUrlEnvelope.safeParse(event, schema);

      expect(result).toEqual({
        success: false,
        error: new ParseError('Failed to parse Lambda function URL body', {
          cause: new ZodError([
            {
              code: 'invalid_type',
              expected: 'string',
              received: 'undefined',
              path: ['rawPath'],
              message: 'Required',
            },
            {
              code: 'invalid_type',
              expected: 'object',
              received: 'null',
              path: ['body'],
              message: 'Expected object, received null',
            },
          ]),
        }),
        originalEvent: event,
      });
    });
  });
});
