import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { LambdaFunctionUrlEnvelope } from '../../../src/envelopes/lambda.js';
import { JSONStringified } from '../../../src/helpers/index.js';
import type { LambdaFunctionUrlEvent } from '../../../src/types/schema.js';
import { getTestEvent, omit } from '../helpers/utils.js';

describe('Envelope: Lambda function URL', () => {
  const schema = z
    .object({
      message: z.string(),
    })
    .strict();

  const baseEvent = getTestEvent<LambdaFunctionUrlEvent>({
    eventsPath: 'lambda',
    filename: 'base',
  });

  describe('Method: parse', () => {
    it('throws if the payload does not match the schema', () => {
      // Prepare
      const event = structuredClone(baseEvent);

      // Act & Assess
      expect(() => LambdaFunctionUrlEnvelope.parse(event, schema)).toThrow(
        expect.objectContaining({
          name: 'ParseError',
          message: expect.stringContaining(
            'Failed to parse Lambda function URL body'
          ),
          cause: expect.objectContaining({
            issues: [
              {
                code: 'invalid_type',
                expected: 'object',
                path: ['body'],
                message: 'Invalid input: expected object, received null',
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

  describe('Method: safeParse', () => {
    it('parses Lambda function URL event', () => {
      // Prepare
      const event = structuredClone(baseEvent);
      event.body = JSON.stringify({ message: 'hello world' });

      // Act
      const result = LambdaFunctionUrlEnvelope.safeParse(
        event,
        JSONStringified(schema)
      );

      // Assess
      expect(result).toEqual({
        success: true,
        data: { message: 'hello world' },
      });
    });

    it('returns an error when the event is not valid', () => {
      // Prepare
      const event = omit(['rawPath'], structuredClone(baseEvent));

      // Act
      const result = LambdaFunctionUrlEnvelope.safeParse(event, schema);

      // Assess
      expect(result).toEqual({
        success: false,
        error: expect.objectContaining({
          name: 'ParseError',
          message: expect.stringContaining(
            'Failed to parse Lambda function URL body'
          ),
          cause: expect.objectContaining({
            issues: [
              {
                code: 'invalid_type',
                expected: 'string',
                path: ['rawPath'],
                message: 'Invalid input: expected string, received undefined',
              },
              {
                code: 'invalid_type',
                expected: 'object',
                path: ['body'],
                message: 'Invalid input: expected object, received null',
              },
            ],
          }),
        }),
        originalEvent: event,
      });
    });
  });
});
