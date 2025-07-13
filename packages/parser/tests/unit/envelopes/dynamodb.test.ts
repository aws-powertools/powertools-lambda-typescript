import { marshall } from '@aws-sdk/util-dynamodb';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { DynamoDBStreamEnvelope } from '../../../src/envelopes/dynamodb.js';
import type { DynamoDBStreamEvent } from '../../../src/types/schema.js';
import { getTestEvent } from '../helpers/utils.js';

describe('Envelope: DynamoDB Stream', () => {
  const schema = z
    .object({
      Message: z.string(),
      Id: z.number(),
    })
    .strict();
  const baseEvent = getTestEvent<DynamoDBStreamEvent>({
    eventsPath: 'dynamodb',
    filename: 'base',
  });

  describe('Method: parse', () => {
    it('throws if one of the payloads does not match the schema', () => {
      // Prepare
      const event = structuredClone(baseEvent);

      // Act & Assess
      expect(() =>
        DynamoDBStreamEnvelope.parse(
          event,
          z
            .object({
              Message: z.string(),
            })
            .strict()
        )
      ).toThrow(
        expect.objectContaining({
          message: expect.stringContaining(
            'Failed to parse DynamoDB record at index 0'
          ),
          cause: expect.objectContaining({
            issues: [
              {
                code: 'unrecognized_keys',
                keys: ['Id'],
                message: 'Unrecognized key: "Id"',
                path: ['Records', 0, 'dynamodb', 'NewImage'],
              },
            ],
          }),
        })
      );
    });

    it('parses a DynamoDB Stream event', () => {
      // Prepare
      const testEvent = structuredClone(baseEvent);

      // Act
      const result = DynamoDBStreamEnvelope.parse(testEvent, schema);

      // Assess
      expect(result[0]).toEqual({
        NewImage: {
          Message: 'New item!',
          Id: 101,
        },
      });
      expect(result[1]).toEqual({
        OldImage: {
          Message: 'New item!',
          Id: 101,
        },
        NewImage: {
          Message: 'This item has changed',
          Id: 101,
        },
      });
    });
  });

  describe('Method: safeParse', () => {
    it('parses a DynamoDB Stream event', () => {
      // Prepare
      const event = structuredClone(baseEvent);

      // Act
      const result = DynamoDBStreamEnvelope.safeParse(event, schema);

      // Assess
      expect(result).toEqual({
        success: true,
        data: [
          {
            NewImage: {
              Message: 'New item!',
              Id: 101,
            },
          },
          {
            OldImage: {
              Message: 'New item!',
              Id: 101,
            },
            NewImage: {
              Message: 'This item has changed',
              Id: 101,
            },
          },
        ],
      });
    });

    it('returns an error if the event is not a valid DynamoDB Stream event', () => {
      // Prepare
      const event = structuredClone(baseEvent);
      // @ts-expect-error - Intentionally invalid event
      event.Records[0].dynamodb = undefined;

      // Act
      const result = DynamoDBStreamEnvelope.safeParse(event, schema);

      // Assess
      expect(result).toEqual({
        success: false,
        error: expect.objectContaining({
          name: 'ParseError',
          message: expect.stringContaining(
            'Failed to parse DynamoDB Stream envelope'
          ),
          cause: expect.objectContaining({
            issues: [
              {
                code: 'invalid_type',
                expected: 'object',
                path: ['Records', 0, 'dynamodb'],
                message: 'Invalid input: expected object, received undefined',
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
      event.Records[1].dynamodb.NewImage = marshall({
        Message: 42,
        Id: 101,
      });

      // Act
      const result = DynamoDBStreamEnvelope.safeParse(event, schema);

      // Assess
      expect(result).toEqual({
        success: false,
        error: expect.objectContaining({
          name: 'ParseError',
          message: expect.stringContaining('Failed to parse record at index 1'),
          cause: expect.objectContaining({
            issues: [
              {
                code: 'invalid_type',
                expected: 'string',
                path: ['Records', 1, 'dynamodb', 'NewImage', 'Message'],
                message: 'Invalid input: expected string, received number',
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
      event.Records[0].dynamodb.NewImage = marshall({ Id: 2 });
      event.Records[1].dynamodb.NewImage = marshall({
        Message: 42,
        Id: 101,
      });

      // Act
      const result = DynamoDBStreamEnvelope.safeParse(event, schema);

      // Assess
      expect(result).toEqual({
        success: false,
        error: expect.objectContaining({
          name: 'ParseError',
          message: expect.stringContaining(
            'Failed to parse records at indexes 0, 1'
          ),
          cause: expect.objectContaining({
            issues: [
              {
                code: 'invalid_type',
                expected: 'string',
                path: ['Records', 0, 'dynamodb', 'NewImage', 'Message'],
                message: 'Invalid input: expected string, received undefined',
              },
              {
                code: 'invalid_type',
                expected: 'string',
                path: ['Records', 1, 'dynamodb', 'NewImage', 'Message'],
                message: 'Invalid input: expected string, received number',
              },
            ],
          }),
        }),
        originalEvent: event,
      });
    });
  });
});
