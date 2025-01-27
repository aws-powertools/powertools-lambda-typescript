import { describe, expect, it } from 'vitest';
import { ZodError, z } from 'zod';
import { KinesisFirehoseEnvelope } from '../../../src/envelopes/index.js';
import { ParseError } from '../../../src/errors.js';
import { JSONStringified } from '../../../src/helpers.js';
import type {
  KinesisFireHoseEvent,
  KinesisFireHoseSqsEvent,
} from '../../../src/types/schema.js';
import { getTestEvent, omit } from '../helpers/utils.js';

const encode = (data: unknown) => Buffer.from(String(data)).toString('base64');

describe('Envelope: Kinesis Firehose', () => {
  const eventsPath = 'kinesis';
  const kinesisFirehosePutEvent = getTestEvent<KinesisFireHoseEvent>({
    eventsPath,
    filename: 'firehose-put',
  });
  const kinesisFirehoseSQSEvent = getTestEvent<KinesisFireHoseSqsEvent>({
    eventsPath,
    filename: 'firehose-sqs',
  });

  describe('Method: parse', () => {
    it('throws if one of the payloads does not match the schema', () => {
      // Prepare
      const event = structuredClone(kinesisFirehosePutEvent);

      // Act & Assess
      expect(() => KinesisFirehoseEnvelope.parse(event, z.number())).toThrow(
        expect.objectContaining({
          message: expect.stringContaining(
            'Failed to parse Kinesis Firehose record at index 0'
          ),
          cause: expect.objectContaining({
            issues: [
              {
                code: 'invalid_type',
                expected: 'number',
                received: 'string',
                path: ['records', 0, 'data'],
                message: 'Expected number, received string',
              },
            ],
          }),
        })
      );
    });

    it('parses a Kinesis Firehose event', () => {
      // Prepare
      const event = structuredClone(kinesisFirehosePutEvent);
      event.records[1].data = encode('foo');

      // Act
      const result = KinesisFirehoseEnvelope.parse(event, z.string());

      // Assess
      expect(result).toEqual(['Hello World', 'foo']);
    });

    it('parses a Kinesis Firehose event and applies the schema transformation', () => {
      // Prepare
      const event = structuredClone(kinesisFirehosePutEvent);
      event.records[0].data = encode(JSON.stringify({ Hello: 'foo' }));

      // Act
      const result = KinesisFirehoseEnvelope.parse(
        event,
        JSONStringified(z.object({ Hello: z.string() }))
      );

      // Assess
      expect(result).toStrictEqual([{ Hello: 'foo' }, { Hello: 'World' }]);
    });

    it('throws if the event is not a Kinesis Data Stream event', () => {
      // Prepare
      const event = structuredClone(kinesisFirehosePutEvent);
      event.records = [];

      // Act & Assess
      expect(() => KinesisFirehoseEnvelope.parse(event, z.string())).toThrow(
        new ParseError('Failed to parse Kinesis Firehose envelope', {
          cause: new ZodError([
            {
              code: 'too_small',
              minimum: 1,
              type: 'array',
              inclusive: true,
              exact: false,
              message: 'Array must contain at least 1 element(s)',
              path: ['records'],
            },
          ]),
        })
      );
    });
  });

  describe('Method: safeParse', () => {
    it('parses a Kinesis Firehose event with SQS data', () => {
      // Prepare
      const event = structuredClone(kinesisFirehoseSQSEvent);

      // Act
      const result = KinesisFirehoseEnvelope.safeParse(
        event,
        JSONStringified(
          z.object({
            body: z.string(),
          })
        )
      );

      // Assess
      expect(result).toEqual({
        success: true,
        data: [
          {
            body: 'Test message.',
          },
        ],
      });
    });

    it('returns an error if the event is not a Kinesis Data Stream event', () => {
      // Prepare
      const event = omit(
        ['invocationId'],
        structuredClone(kinesisFirehosePutEvent)
      );

      // Act
      const result = KinesisFirehoseEnvelope.safeParse(event, z.string());

      // Assess
      expect(result).toEqual({
        success: false,
        error: new ParseError('Failed to parse Kinesis Firehose envelope', {
          cause: new ZodError([
            {
              code: 'invalid_type',
              expected: 'string',
              received: 'undefined',
              path: ['invocationId'],
              message: 'Required',
            },
          ]),
        }),
        originalEvent: event,
      });
    });

    it('returns an error if one of the payloads does not match the schema', () => {
      // Prepare
      const event = structuredClone(kinesisFirehosePutEvent);
      event.records[0].data = encode(JSON.stringify({ foo: 'bar' }));

      // Act
      const result = KinesisFirehoseEnvelope.safeParse(
        event,
        JSONStringified(
          z.object({
            foo: z.string(),
          })
        )
      );

      // Assess
      expect(result).toEqual({
        success: false,
        error: new ParseError(
          'Failed to parse Kinesis Firehose record at index 1',
          {
            cause: new ZodError([
              {
                code: 'invalid_type',
                expected: 'string',
                received: 'undefined',
                path: ['records', 1, 'data', 'foo'],
                message: 'Required',
              },
            ]),
          }
        ),
        originalEvent: event,
      });
    });

    it('returns a combined error if multiple records fail to parse', () => {
      // Prepare
      const event = structuredClone(kinesisFirehosePutEvent);

      // Act
      const result = KinesisFirehoseEnvelope.safeParse(
        event,
        z.object({
          foo: z.string(),
        })
      );

      // Assess
      expect(result).toEqual({
        success: false,
        error: new ParseError(
          'Failed to parse Kinesis Firehose records at indexes 0, 1',
          {
            cause: new ZodError([
              {
                code: 'invalid_type',
                expected: 'object',
                received: 'string',
                path: ['records', 0, 'data'],
                message: 'Expected object, received string',
              },
              {
                code: 'invalid_type',
                expected: 'object',
                received: 'string',
                path: ['records', 1, 'data'],
                message: 'Expected object, received string',
              },
            ]),
          }
        ),
        originalEvent: event,
      });
    });
  });
});
