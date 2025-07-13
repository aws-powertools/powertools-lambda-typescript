import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { SqsEnvelope } from '../../../src/envelopes/sqs.js';
import { JSONStringified } from '../../../src/helpers/index.js';
import type { SqsEvent } from '../../../src/types/schema.js';
import { getTestEvent } from '../helpers/utils.js';

describe('Envelope: SqsEnvelope', () => {
  const schema = z
    .object({
      message: z.string(),
    })
    .strict();
  const baseEvent = getTestEvent<SqsEvent>({
    eventsPath: 'sqs',
    filename: 'base',
  });

  describe('Method: parse', () => {
    it('throws if one of the payloads does not match the schema', () => {
      // Prepare
      const event = structuredClone(baseEvent);

      // Act & Assess
      expect(() => SqsEnvelope.parse(event, JSONStringified(schema))).toThrow(
        expect.objectContaining({
          name: 'ParseError',
          message: expect.stringContaining(
            'Failed to parse SQS Record at index 0'
          ),
          cause: expect.objectContaining({
            issues: [
              {
                code: 'custom',
                message: expect.stringMatching(/^Invalid JSON - /),
                fatal: true,
                path: ['Records', 0, 'body'],
              },
            ],
          }),
        })
      );
    });

    it('parses an SQS event', () => {
      // Prepare
      const event = structuredClone(baseEvent);
      event.Records[0].body = JSON.stringify({ message: 'hello' });

      // Act
      const result = SqsEnvelope.parse(event, JSONStringified(schema));

      // Assess
      expect(result).toStrictEqual([{ message: 'hello' }, { message: 'foo1' }]);
    });
  });

  describe('Method: safeParse', () => {
    it('parses an SQS event', () => {
      // Prepare
      const event = structuredClone(baseEvent);
      event.Records[1].body = 'bar';

      // Act
      const result = SqsEnvelope.safeParse(event, z.string());

      // Assess
      expect(result).toStrictEqual({
        success: true,
        data: ['Test message.', 'bar'],
      });
    });

    it('returns an error if the event is not a valid SQS event', () => {
      // Prepare
      const event = {
        Records: [],
      };

      // Act
      const result = SqsEnvelope.safeParse(event, z.string());

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

    it('returns an error if any of the records fail to parse', () => {
      // Prepare
      const event = structuredClone(baseEvent);

      // Act
      const result = SqsEnvelope.safeParse(event, JSONStringified(schema));

      // Assess
      expect(result).toEqual({
        success: false,
        error: expect.objectContaining({
          message: expect.stringContaining(
            'Failed to parse SQS Record at index 0'
          ),
          cause: expect.objectContaining({
            issues: [
              {
                code: 'custom',
                message: expect.stringMatching(/^Invalid JSON - /),
                fatal: true,
                path: ['Records', 0, 'body'],
              },
            ],
          }),
        }),
        originalEvent: event,
      });
    });

    it('returns a combined error if multiple records fail to parse', () => {
      // Prepare
      const event = structuredClone(baseEvent);

      // Act
      const result = SqsEnvelope.safeParse(event, z.number());

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
                message: 'Invalid input: expected number, received string',
                path: ['Records', 0, 'body'],
              },
              {
                code: 'invalid_type',
                expected: 'number',
                message: 'Invalid input: expected number, received string',
                path: ['Records', 1, 'body'],
              },
            ],
          }),
        }),
        originalEvent: event,
      });
    });
  });
});
