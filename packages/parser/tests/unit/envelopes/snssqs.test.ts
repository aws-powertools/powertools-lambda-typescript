import { describe, expect, it } from 'vitest';
import { ZodError, z } from 'zod';
import { SnsSqsEnvelope } from '../../../src/envelopes/snssqs.js';
import { ParseError } from '../../../src/errors.js';
import { JSONStringified } from '../../../src/helpers.js';
import type { SqsEvent } from '../../../src/types/schema.js';
import { getTestEvent } from '../schema/utils.js';

describe('Envelope: SnsSqsEnvelope', () => {
  const schema = z
    .object({
      message: z.string(),
    })
    .strict();
  const baseEvent = getTestEvent<SqsEvent>({
    eventsPath: 'sqs',
    filename: 'sns-body',
  });

  describe('Method: parse', () => {
    it('throws if one of the payloads does not match the schema', () => {
      // Prepare
      const event = structuredClone(baseEvent);

      // Act & Assess
      expect(() => SnsSqsEnvelope.parse(event, z.number())).toThrow(
        expect.objectContaining({
          message: expect.stringContaining(
            'Failed to parse SQS Record at index 0'
          ),
          cause: new ZodError([
            {
              code: 'invalid_type',
              expected: 'number',
              received: 'string',
              path: ['Records', 0, 'body'],
              message: 'Expected number, received string',
            },
          ]),
        })
      );
    });

    it('parses an SNS notification within an SQS envelope', () => {
      // Prepare
      const event = structuredClone(baseEvent);

      // Act
      const result = SnsSqsEnvelope.parse(event, JSONStringified(schema));

      // Assess
      expect(result).toStrictEqual([{ message: 'hello world' }]);
    });

    it('throws if the envelope is not a valid SQS event', () => {
      // Prepare
      const event = {
        Records: [],
      };

      // Act & Assess
      expect(() => SnsSqsEnvelope.parse(event, schema)).toThrow(
        new ParseError('Failed to parse SQS Envelope', {
          cause: new ZodError([
            {
              code: 'too_small',
              minimum: 1,
              type: 'array',
              inclusive: true,
              exact: false,
              message: 'Array must contain at least 1 element(s)',
              path: ['Records'],
            },
          ]),
        })
      );
    });

    it('throws if the SQS message is not a valid JSON string', () => {
      // Prepare
      const event = structuredClone(baseEvent);
      event.Records[0].body = 'invalid';

      // Act & Assess
      expect(() => SnsSqsEnvelope.parse(event, schema)).toThrow(
        new ParseError('Failed to parse SQS Record at index 0', {
          cause: new SyntaxError(
            `Unexpected token 'i', "invalid" is not valid JSON`
          ),
        })
      );
    });

    it('throws if the SQS message is not a valid SNS notification', () => {
      // Prepare
      const event = structuredClone(baseEvent);
      event.Records[0].body = JSON.stringify({ invalid: 'message' });

      // Act & Assess
      expect(() => SnsSqsEnvelope.parse(event, schema)).toThrow(
        new ParseError('Failed to parse SQS Record at index 0', {
          cause: new ZodError([
            {
              code: 'invalid_type',
              expected: 'string',
              received: 'undefined',
              path: ['Records', 0, 'body', 'TopicArn'],
              message: 'Required',
            },
            {
              code: 'invalid_literal',
              expected: 'Notification',
              path: ['Records', 0, 'body', 'Type'],
              message: 'Invalid literal value, expected "Notification"',
              received: undefined,
            },
            {
              code: 'invalid_type',
              expected: 'string',
              received: 'undefined',
              path: ['Records', 0, 'body', 'Message'],
              message: 'Required',
            },
            {
              code: 'invalid_type',
              expected: 'string',
              received: 'undefined',
              path: ['Records', 0, 'body', 'MessageId'],
              message: 'Required',
            },
            {
              code: 'invalid_type',
              expected: 'string',
              received: 'undefined',
              path: ['Records', 0, 'body', 'Timestamp'],
              message: 'Required',
            },
          ]),
        })
      );
    });
  });

  describe('Method: safeParse', () => {
    it('parses an SNS notification within an SQS envelope', () => {
      // TODO: Implement
      expect(1).toBe(1);
    });
  });
});
