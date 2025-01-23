import { gunzipSync, gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { ZodError, z } from 'zod';
import { ParseError } from '../../../src';
import { CloudWatchEnvelope } from '../../../src/envelopes/index.js';
import { DecompressError } from '../../../src/errors.js';
import { JSONStringified } from '../../../src/helpers.js';
import { getTestEvent } from '../schema/utils.js';

const decompressRecordToJSON = (
  data: string
): {
  logEvents: {
    message: string;
    id: string;
    timestamp: number;
  }[];
  messageType: string;
  owner: string;
  logGroup: string;
  logStream: string;
  subscriptionFilters: string[];
} => {
  const uncompressed = gunzipSync(Buffer.from(data, 'base64')).toString('utf8');

  return JSON.parse(uncompressed);
};

const compressJSONToRecord = (data: unknown): string => {
  const jsonString = JSON.stringify(data);
  return gzipSync(Buffer.from(jsonString, 'utf8')).toString('base64');
};

describe('Envelope: CloudWatch', () => {
  const baseEvent = getTestEvent<{ awslogs: { data: string } }>({
    eventsPath: 'cloudwatch',
    filename: 'base',
  });
  const data = decompressRecordToJSON(structuredClone(baseEvent).awslogs.data);
  const mockLogMessages = [
    {
      level: 'DEBUG',
      message: 'Hello from other.ts',
      sample_rate: 1,
    },
    {
      level: 'INFO',
      message: 'processing event',
      sample_rate: 1,
    },
  ];
  const JSONOnlyEvent = {
    awslogs: {
      data: compressJSONToRecord({
        ...data,
        logEvents: [
          {
            ...data.logEvents[0],
            message: JSON.stringify(mockLogMessages[0]),
          },
          {
            ...data.logEvents[1],
            message: JSON.stringify(mockLogMessages[1]),
          },
        ],
      }),
    },
  };

  describe('Method: parse', () => {
    it('throws if one of the payloads does not match the schema', () => {
      // Prepare
      const event = structuredClone(baseEvent);

      // Act & Assess
      expect(() =>
        CloudWatchEnvelope.parse(
          event,
          z
            .object({
              message: z.string(),
            })
            .strict()
        )
      ).toThrow(
        expect.objectContaining({
          message: expect.stringContaining(
            'Failed to parse CloudWatch log event at index 0'
          ),
          cause: expect.objectContaining({
            issues: [
              {
                code: 'invalid_type',
                expected: 'object',
                received: 'string',
                path: ['awslogs', 'data', 'logEvents', 0, 'message'],
                message: 'Expected object, received string',
              },
            ],
          }),
        })
      );
    });

    it('parses a CloudWatch Logs event', () => {
      // Prepare
      const event = structuredClone(JSONOnlyEvent);

      // Act
      const result = CloudWatchEnvelope.parse(
        event,
        JSONStringified(
          z.object({
            level: z.string(),
            message: z.string(),
            sample_rate: z.number(),
          })
        )
      );

      // Assess
      expect(result).toStrictEqual(mockLogMessages);
    });
  });

  describe('Method: safeParse', () => {
    it('parses a CloudWatch Logs event', () => {
      // Prepare
      const event = structuredClone(JSONOnlyEvent);

      // Act
      const result = CloudWatchEnvelope.safeParse(
        event,
        JSONStringified(
          z.object({
            level: z.string(),
            message: z.string(),
            sample_rate: z.number(),
          })
        )
      );

      // Assess
      expect(result).toStrictEqual({
        success: true,
        data: mockLogMessages,
      });
    });

    it('returns an error if the event is not a valid CloudWatch Logs event', () => {
      // Prepare
      const event = {
        awslogs: {
          data: 'invalid',
        },
      };

      // Act
      const result = CloudWatchEnvelope.safeParse(event, z.object({}));

      // Assess
      expect(result).toStrictEqual({
        success: false,
        error: new ParseError('Failed to parse CloudWatch Log envelope', {
          cause: new DecompressError(
            'Failed to decompress CloudWatch log data'
          ),
        }),
        originalEvent: event,
      });
    });

    it('returns an error if any of the messages fail to parse', () => {
      // Prepare
      const event = {
        awslogs: {
          data: compressJSONToRecord({
            ...data,
            logEvents: [
              {
                ...data.logEvents[0],
                message: 'invalid',
              },
              {
                ...data.logEvents[1],
                message: JSON.stringify(mockLogMessages[1]),
              },
            ],
          }),
        },
      };

      // Act
      const result = CloudWatchEnvelope.safeParse(
        event,
        JSONStringified(
          z.object({
            level: z.string(),
            message: z.string(),
            sample_rate: z.number(),
          })
        )
      );

      // Assess
      expect(result).toStrictEqual({
        success: false,
        error: new ParseError(
          'Failed to parse CloudWatch Log message at index 0',
          {
            cause: new ZodError([
              {
                code: 'custom',
                message: 'Invalid JSON',
                path: ['awslogs', 'data', 'logEvents', 0, 'message'],
              },
            ]),
          }
        ),
        originalEvent: event,
      });
    });

    it('returns a combined error if multiple records fail to parse', () => {
      // Prepare
      const event = structuredClone(baseEvent);

      // Act
      const result = CloudWatchEnvelope.safeParse(
        event,
        z.object({
          message: z.string(),
        })
      );

      // Assess
      expect(result).toStrictEqual({
        success: false,
        error: new ParseError(
          'Failed to parse CloudWatch Log messages at indexes 0, 1, 2',
          {
            cause: new ZodError([
              {
                code: 'invalid_type',
                expected: 'object',
                received: 'string',
                path: ['awslogs', 'data', 'logEvents', 0, 'message'],
                message: 'Expected object, received string',
              },
              {
                code: 'invalid_type',
                expected: 'object',
                received: 'string',
                path: ['awslogs', 'data', 'logEvents', 1, 'message'],
                message: 'Expected object, received string',
              },
              {
                code: 'invalid_type',
                expected: 'object',
                received: 'string',
                path: ['awslogs', 'data', 'logEvents', 2, 'message'],
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
