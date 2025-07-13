import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { KinesisFirehoseEnvelope } from '../../../src/envelopes/kinesis-firehose.js';
import { JSONStringified } from '../../../src/helpers/index.js';
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
                path: ['records', 0, 'data'],
                message: 'Invalid input: expected number, received string',
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
        expect.objectContaining({
          name: 'ParseError',

          message: expect.stringContaining(
            'Failed to parse Kinesis Firehose envelope'
          ),
          cause: expect.objectContaining({
            issues: [
              {
                origin: 'array',
                code: 'too_small',
                minimum: 1,
                inclusive: true,
                path: ['records'],
                message: 'Too small: expected array to have >=1 items',
              },
            ],
          }),
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
        error: expect.objectContaining({
          name: 'ParseError',
          message: expect.stringContaining(
            'Failed to parse Kinesis Firehose envelope'
          ),
          cause: expect.objectContaining({
            issues: [
              {
                expected: 'string',
                code: 'invalid_type',
                path: ['invocationId'],
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
        error: expect.objectContaining({
          name: 'ParseError',
          message: expect.stringContaining(
            'Failed to parse Kinesis Firehose record at index 1'
          ),
          cause: expect.objectContaining({
            issues: [
              {
                code: 'invalid_type',
                expected: 'string',
                path: ['records', 1, 'data', 'foo'],
                message: 'Invalid input: expected string, received undefined',
              },
            ],
          }),
        }),
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
        error: expect.objectContaining({
          name: 'ParseError',
          message: expect.stringContaining(
            'Failed to parse Kinesis Firehose records at indexes 0, 1'
          ),
          cause: expect.objectContaining({
            issues: [
              {
                code: 'invalid_type',
                expected: 'object',
                path: ['records', 0, 'data'],
                message: 'Invalid input: expected object, received string',
              },
              {
                code: 'invalid_type',
                expected: 'object',
                path: ['records', 1, 'data'],
                message: 'Invalid input: expected object, received string',
              },
            ],
          }),
        }),
        originalEvent: event,
      });
    });
  });
});
