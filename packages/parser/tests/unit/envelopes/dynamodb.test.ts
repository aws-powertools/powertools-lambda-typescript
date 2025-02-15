import { marshall } from '@aws-sdk/util-dynamodb';
import { describe, expect, it } from 'vitest';
import { ZodError, z } from 'zod';
import { DynamoDBStreamEnvelope } from '../../../src/envelopes/dynamodb.js';
import { ParseError } from '../../../src/errors.js';
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
                message: "Unrecognized key(s) in object: 'Id'",
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
      expect(result).be.deep.equal({
        success: false,
        error: new ParseError('Failed to parse DynamoDB Stream envelope', {
          cause: new ZodError([
            {
              code: 'invalid_type',
              expected: 'object',
              received: 'undefined',
              path: ['Records', 0, 'dynamodb'],
              message: 'Required',
            },
          ]),
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
      expect(result).be.deep.equal({
        success: false,
        error: new ParseError('Failed to parse record at index 1', {
          cause: new ZodError([
            {
              code: 'invalid_type',
              expected: 'string',
              received: 'number',
              path: ['Records', 1, 'dynamodb', 'NewImage', 'Message'],
              message: 'Expected string, received number',
            },
          ]),
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
      expect(result).be.deep.equal({
        success: false,
        error: new ParseError('Failed to parse records at indexes 0, 1', {
          cause: new ZodError([
            {
              code: 'invalid_type',
              expected: 'string',
              received: 'undefined',
              path: ['Records', 0, 'dynamodb', 'NewImage', 'Message'],
              message: 'Required',
            },
            {
              code: 'invalid_type',
              expected: 'string',
              received: 'number',
              path: ['Records', 1, 'dynamodb', 'NewImage', 'Message'],
              message: 'Expected string, received number',
            },
          ]),
        }),
        originalEvent: event,
      });
    });
  });
});
