import { describe, expect, it } from 'vitest';
import { ZodError, z } from 'zod';
import { ApiGatewayEnvelope } from '../../../src/envelopes/index.js';
import { ParseError } from '../../../src/errors.js';
import { JSONStringified } from '../../../src/helpers.js';
import type { APIGatewayProxyEvent } from '../../../src/types/schema.js';
import { getTestEvent, omit } from '../helpers/utils.js';

describe('Envelope: API Gateway REST', () => {
  const schema = z
    .object({
      message: z.string(),
    })
    .strict();
  const baseEvent = getTestEvent<APIGatewayProxyEvent>({
    eventsPath: 'apigw-rest',
    filename: 'no-auth',
  });

  describe('Method: parse', () => {
    it('throws if the payload does not match the schema', () => {
      // Prepare
      const event = structuredClone(baseEvent);

      // Act & Assess
      expect(() => ApiGatewayEnvelope.parse(event, schema)).toThrow(
        expect.objectContaining({
          message: expect.stringContaining('Failed to parse API Gateway body'),
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

    it('parses an API Gateway REST event with plain text', () => {
      // Prepare
      const event = structuredClone(baseEvent);
      event.body = 'hello world';

      // Act
      const result = ApiGatewayEnvelope.parse(event, z.string());

      // Assess
      expect(result).toEqual('hello world');
    });

    it('parses an API Gateway REST event with JSON-stringified body', () => {
      // Prepare
      const event = structuredClone(baseEvent);
      event.body = JSON.stringify({ message: 'hello world' });

      // Act
      const result = ApiGatewayEnvelope.parse(event, JSONStringified(schema));

      // Assess
      expect(result).toStrictEqual({ message: 'hello world' });
    });

    it('parses an API Gateway REST event with binary body', () => {
      // Prepare
      const event = structuredClone(baseEvent);
      event.body = 'aGVsbG8gd29ybGQ='; // base64 encoded 'hello world'
      // @ts-expect-error - we know the headers exist
      event.headers['content-type'] = 'application/octet-stream';
      event.isBase64Encoded = true;

      // Act
      const result = ApiGatewayEnvelope.parse(event, z.string());

      // Assess
      expect(result).toEqual('aGVsbG8gd29ybGQ=');
    });
  });

  describe('Method: safeParse', () => {
    it('parses an API Gateway REST event', () => {
      // Prepare
      const event = structuredClone(baseEvent);
      event.body = JSON.stringify({ message: 'hello world' });

      // Act
      const result = ApiGatewayEnvelope.safeParse(
        event,
        JSONStringified(schema)
      );

      // Assess
      expect(result).toEqual({
        success: true,
        data: { message: 'hello world' },
      });
    });

    it('returns an error if the event is not a valid API Gateway REST event', () => {
      // Prepare
      const event = omit(['path'], structuredClone(baseEvent));

      // Act
      const result = ApiGatewayEnvelope.safeParse(event, schema);

      // Assess
      expect(result).be.deep.equal({
        success: false,
        error: new ParseError('Failed to parse API Gateway body', {
          cause: new ZodError([
            {
              code: 'invalid_type',
              expected: 'string',
              received: 'undefined',
              path: ['path'],
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
