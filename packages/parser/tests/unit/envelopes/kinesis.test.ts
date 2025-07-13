import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { KinesisEnvelope } from '../../../src/envelopes/kinesis.js';
import type { KinesisDataStreamEvent } from '../../../src/types/schema.js';
import { getTestEvent } from '../helpers/utils.js';

const encode = (data: unknown) => Buffer.from(String(data)).toString('base64');

describe('Envelope: Kinesis', () => {
  const eventsPath = 'kinesis';
  const kinesisStreamEvent = getTestEvent<KinesisDataStreamEvent>({
    eventsPath,
    filename: 'stream',
  });

  describe('Method: parse', () => {
    it('throws if one of the payloads does not match the schema', () => {
      // Prepare
      const event = structuredClone(kinesisStreamEvent);

      // Act & Assess
      expect(() => KinesisEnvelope.parse(event, z.number())).toThrow(
        expect.objectContaining({
          message: expect.stringContaining(
            'Failed to parse Kinesis Data Stream record at index 0'
          ),
          cause: expect.objectContaining({
            issues: [
              {
                code: 'invalid_type',
                expected: 'number',
                path: ['Records', 0, 'kinesis', 'data'],
                message: 'Invalid input: expected number, received string',
              },
            ],
          }),
        })
      );
    });

    it('parses a Kinesis Data Stream event', () => {
      // Prepare
      const event = structuredClone(kinesisStreamEvent);

      // Act
      const result = KinesisEnvelope.parse(event, z.string());

      // Assess
      expect(result).toEqual([
        'Hello, this is a test.',
        'This is only a test.',
      ]);
    });

    it('throws if the event is not a Kinesis Data Stream event', () => {
      // Prepare
      const event = {
        Records: [],
      };

      // Act & Assess
      expect(() => KinesisEnvelope.parse(event, z.string())).toThrow(
        expect.objectContaining({
          name: 'ParseError',
          message: expect.stringContaining(
            'Failed to parse Kinesis Data Stream envelope'
          ),
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
  });

  describe('Method: safeParse', () => {
    it('parses a Kinesis Data Stream event', () => {
      // Prepare
      const event = structuredClone(kinesisStreamEvent);

      // Act
      const result = KinesisEnvelope.safeParse(event, z.string());

      // Assess
      expect(result).toEqual({
        success: true,
        data: ['Hello, this is a test.', 'This is only a test.'],
      });
    });

    it('returns an error if the event is not a Kinesis Data Stream event', () => {
      // Prepare
      const event = {
        Records: [],
      };

      // Act
      const result = KinesisEnvelope.safeParse(event, z.string());

      // Assess
      expect(result).toEqual({
        success: false,
        error: expect.objectContaining({
          name: 'ParseError',
          message: expect.stringContaining(
            'Failed to parse Kinesis Data Stream envelope'
          ),
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

    it('returns an error if one of the payloads does not match the schema', () => {
      // Prepare
      const event = structuredClone(kinesisStreamEvent);
      event.Records[0].kinesis.data = encode(JSON.stringify({ foo: 'bar' }));

      // Act
      const result = KinesisEnvelope.safeParse(
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
            'Failed to parse Kinesis Data Stream record at index 1'
          ),
          cause: expect.objectContaining({
            issues: [
              {
                code: 'invalid_type',
                expected: 'object',
                path: ['Records', 1, 'kinesis', 'data'],
                message: 'Invalid input: expected object, received string',
              },
            ],
          }),
        }),
        originalEvent: event,
      });
    });

    it('returns a combined error if multiple records fail to parse', () => {
      // Prepare
      const event = structuredClone(kinesisStreamEvent);

      // Act
      const result = KinesisEnvelope.safeParse(
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
            'Failed to parse Kinesis Data Stream records at indexes 0, 1'
          ),
          cause: expect.objectContaining({
            issues: [
              {
                code: 'invalid_type',
                expected: 'object',
                path: ['Records', 0, 'kinesis', 'data'],
                message: 'Invalid input: expected object, received string',
              },
              {
                code: 'invalid_type',
                expected: 'object',
                path: ['Records', 1, 'kinesis', 'data'],
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
