import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { SnsSqsEnvelope } from '../../../src/envelopes/sns-sqs.js';
import { JSONStringified } from '../../../src/helpers/index.js';
import type { SqsEvent } from '../../../src/types/schema.js';
import { getTestEvent } from '../helpers/utils.js';

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
          cause: expect.objectContaining({
            issues: [
              {
                code: 'invalid_type',
                expected: 'number',
                path: ['Records', 0, 'body'],
                message: 'Invalid input: expected number, received string',
              },
            ],
          }),
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
        expect.objectContaining({
          name: 'ParseError',
          message: expect.stringContaining('Failed to parse SQS Envelope'),
          cause: expect.objectContaining({
            issues: [
              {
                origin: 'array',
                code: 'too_small',
                minimum: 1,
                inclusive: true,
                path: ['Records'],
                message: 'Too small: expected array to have >=1 items',
              },
            ],
          }),
        })
      );
    });

    it('throws if the SQS message is not a valid JSON string', () => {
      // Prepare
      const event = structuredClone(baseEvent);
      event.Records[0].body = 'invalid';

      // Act & Assess
      expect(() => SnsSqsEnvelope.parse(event, schema)).toThrow(
        expect.objectContaining({
          name: 'ParseError',
          message: expect.stringContaining(
            'Failed to parse SQS Record at index 0'
          ),
          cause: expect.objectContaining({
            issues: [
              {
                code: 'custom',
                input: 'invalid',
                message: expect.stringMatching(/^Invalid JSON - /),
                path: ['Records', 0, 'body'],
              },
            ],
          }),
        })
      );
    });

    it('throws if the SQS message is not a valid SNS notification', () => {
      // Prepare
      const event = structuredClone(baseEvent);
      event.Records[0].body = JSON.stringify({ invalid: 'message' });

      // Act & Assess
      expect(() => SnsSqsEnvelope.parse(event, schema)).toThrow(
        expect.objectContaining({
          name: 'ParseError',
          message: expect.stringContaining(
            'Failed to parse SQS Record at index 0'
          ),
          cause: expect.objectContaining({
            issues: [
              {
                code: 'invalid_type',
                expected: 'string',
                path: ['Records', 0, 'body', 'TopicArn'],
                message: 'Invalid input: expected string, received undefined',
              },
              {
                code: 'invalid_value',
                values: ['Notification'],
                path: ['Records', 0, 'body', 'Type'],
                message: 'Invalid input: expected "Notification"',
              },
              {
                code: 'invalid_type',
                expected: 'string',
                path: ['Records', 0, 'body', 'Message'],
                message: 'Invalid input: expected string, received undefined',
              },
              {
                code: 'invalid_type',
                expected: 'string',
                path: ['Records', 0, 'body', 'MessageId'],
                message: 'Invalid input: expected string, received undefined',
              },
              {
                code: 'invalid_type',
                expected: 'string',
                path: ['Records', 0, 'body', 'Timestamp'],
                message: 'Invalid input: expected string, received undefined',
              },
            ],
          }),
        })
      );
    });
  });

  describe('Method: safeParse', () => {
    it('parses an SNS notification within an SQS envelope', () => {
      // Prepare
      const event = structuredClone(baseEvent);

      // Act
      const result = SnsSqsEnvelope.safeParse(event, JSONStringified(schema));

      // Assess
      expect(result).toStrictEqual({
        success: true,
        data: [{ message: 'hello world' }],
      });
    });

    it('returns an error if the envelope is not a valid SQS event', () => {
      // Prepare
      const event = {
        Records: [],
      };

      // Act
      const result = SnsSqsEnvelope.safeParse(event, schema);

      // Assess
      expect(result).toEqual({
        success: false,
        error: expect.objectContaining({
          name: 'ParseError',
          message: expect.stringContaining('Failed to parse SQS envelope'),
          cause: expect.objectContaining({
            issues: [
              {
                origin: 'array',
                code: 'too_small',
                minimum: 1,
                inclusive: true,
                path: ['Records'],
                message: 'Too small: expected array to have >=1 items',
              },
            ],
          }),
        }),
        originalEvent: event,
      });
    });

    it('returns an error if the SQS message is not a valid JSON string', () => {
      // Prepare
      const event = structuredClone(baseEvent);
      event.Records[0].body = 'invalid';

      // Act
      const result = SnsSqsEnvelope.safeParse(event, schema);

      // Assess
      expect(result).toEqual({
        success: false,
        error: expect.objectContaining({
          name: 'ParseError',
          message: expect.stringContaining(
            'Failed to parse SQS Record at index 0'
          ),
          cause: expect.objectContaining({
            issues: [
              {
                code: 'custom',
                input: 'invalid',
                message: expect.stringMatching(/^Invalid JSON - /),
                path: ['Records', 0, 'body'],
              },
            ],
          }),
        }),
        originalEvent: event,
      });
    });

    it('returns an error if the SQS message is not a valid SNS notification', () => {
      // Prepare
      const event = structuredClone(baseEvent);
      event.Records[0].body = JSON.stringify({ invalid: 'message' });

      // Act
      const result = SnsSqsEnvelope.safeParse(event, schema);

      // Assess
      expect(result).toEqual({
        success: false,

        error: expect.objectContaining({
          name: 'ParseError',
          message: expect.stringContaining(
            'Failed to parse SQS Record at index 0'
          ),
          cause: expect.objectContaining({
            issues: [
              {
                code: 'invalid_type',
                expected: 'string',
                path: ['Records', 0, 'body', 'TopicArn'],
                message: 'Invalid input: expected string, received undefined',
              },
              {
                code: 'invalid_value',
                values: ['Notification'],
                path: ['Records', 0, 'body', 'Type'],
                message: 'Invalid input: expected "Notification"',
              },
              {
                code: 'invalid_type',
                expected: 'string',
                path: ['Records', 0, 'body', 'Message'],
                message: 'Invalid input: expected string, received undefined',
              },
              {
                code: 'invalid_type',
                expected: 'string',
                path: ['Records', 0, 'body', 'MessageId'],
                message: 'Invalid input: expected string, received undefined',
              },
              {
                code: 'invalid_type',
                expected: 'string',
                path: ['Records', 0, 'body', 'Timestamp'],
                message: 'Invalid input: expected string, received undefined',
              },
            ],
          }),
        }),
        originalEvent: event,
      });
    });

    it('returns an error if one of the payloads does not match the schema', () => {
      // Prepare
      const event = structuredClone(baseEvent);
      event.Records[1] = structuredClone(event.Records[0]);
      const parsedBody = JSON.parse(event.Records[0].body);
      const invalidSNSNotification = {
        ...parsedBody,
        Message: 'hello',
      };
      event.Records[1].body = JSON.stringify(invalidSNSNotification, null, 2);

      // Act
      const result = SnsSqsEnvelope.safeParse(event, JSONStringified(schema));

      // Assess
      expect(result).toEqual({
        success: false,
        error: expect.objectContaining({
          name: 'ParseError',
          message: expect.stringContaining(
            'Failed to parse SQS Record at index 1'
          ),
          cause: expect.objectContaining({
            issues: [
              {
                code: 'custom',
                message: expect.stringMatching(/^Invalid JSON - /),
                fatal: true,
                path: ['Records', 1, 'body'],
              },
            ],
          }),
        }),
        originalEvent: event,
      });
    });

    it('returns a combined error if multiple payloads do not match the schema', () => {
      // Prepare
      const event = structuredClone(baseEvent);
      event.Records[1] = structuredClone(event.Records[0]);
      const parsedBody = JSON.parse(event.Records[0].body);
      event.Records[0].body = JSON.stringify(
        {
          ...parsedBody,
          Message: 'hello',
        },
        null,
        2
      );
      event.Records[1].body = JSON.stringify(
        {
          ...parsedBody,
          Message: 'world',
        },
        null,
        2
      );

      // Act
      const result = SnsSqsEnvelope.safeParse(event, z.number());

      // Assess
      expect(result).toEqual({
        success: false,
        error: expect.objectContaining({
          name: 'ParseError',
          message: expect.stringContaining(
            'Failed to parse SQS Records at indexes 0, 1'
          ),
          cause: expect.objectContaining({
            issues: [
              {
                code: 'invalid_type',
                expected: 'number',
                path: ['Records', 0, 'body'],
                message: 'Invalid input: expected number, received string',
              },
              {
                code: 'invalid_type',
                expected: 'number',
                path: ['Records', 1, 'body'],
                message: 'Invalid input: expected number, received string',
              },
            ],
          }),
        }),
        originalEvent: event,
      });
    });
  });
});
