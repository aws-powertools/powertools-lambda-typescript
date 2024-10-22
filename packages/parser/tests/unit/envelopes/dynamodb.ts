import { marshall } from '@aws-sdk/util-dynamodb';
import type { AttributeValue } from 'aws-lambda';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { DynamoDBStreamEnvelope } from '../../../src/envelopes/index.js';
import { ParseError } from '../../../src/errors.js';
import type { DynamoDBStreamEvent } from '../../../src/types/schema.js';
import { getTestEvent } from '../helpers/utils.js';

describe('DynamoDB', () => {
  const testSchema = z.object({
    name: z.string(),
    age: z.number(),
  });
  const mockOldImage = {
    name: 'John',
    age: 18,
  };
  const mockNewImage = {
    name: 'Jane',
    age: 21,
  };
  const baseEvent = getTestEvent<DynamoDBStreamEvent>({
    eventsPath: 'dynamodb',
    filename: 'base',
  });
  baseEvent.Records[0].dynamodb.OldImage = mockOldImage;
  baseEvent.Records[1].dynamodb.OldImage = mockOldImage;
  baseEvent.Records[0].dynamodb.NewImage = mockNewImage;
  baseEvent.Records[1].dynamodb.NewImage = mockNewImage;

  describe('Method: parse', () => {
    it('parses a DynamoDB Stream event', () => {});
    it('parse should parse dynamodb envelope', () => {
      const parsed = DynamoDBStreamEnvelope.parse(dynamodbEvent, schema);
      expect(parsed[0]).toEqual({
        OldImage: mockOldImage,
        NewImage: mockNewImage,
      });
      expect(parsed[1]).toEqual({
        OldImage: mockOldImage,
        NewImage: mockNewImage,
      });
    });
    it('parse should throw error if envelope invalid', () => {
      expect(() =>
        DynamoDBStreamEnvelope.parse({ foo: 'bar' }, schema)
      ).toThrow();
    });
    it('parse should throw error if new or old image is invalid', () => {
      const ddbEvent = TestEvents.dynamoStreamEvent as DynamoDBStreamEvent;
      // biome-ignore lint/style/noNonNullAssertion: it is ensured that this event has these properties
      ddbEvent.Records[0].dynamodb!.NewImage!.Id = 'foo' as AttributeValue;
      expect(() => DynamoDBStreamEnvelope.parse(ddbEvent, schema)).toThrow();
    });
  });

  describe('safeParse', () => {
    it('safeParse should parse dynamodb envelope', () => {
      const parsed = DynamoDBStreamEnvelope.safeParse(dynamodbEvent, schema);
      expect(parsed.success).toBe(true);
      expect(parsed).toEqual({
        success: true,
        data: [
          {
            OldImage: mockOldImage,
            NewImage: mockNewImage,
          },
          {
            OldImage: mockOldImage,
            NewImage: mockNewImage,
          },
        ],
      });
    });
    it('safeParse should return error if NewImage is invalid', () => {
      const invalidDDBEvent =
        TestEvents.dynamoStreamEvent as DynamoDBStreamEvent;

      // biome-ignore lint/style/noNonNullAssertion: it is ensured that this event has these properties
      (invalidDDBEvent.Records[0].dynamodb!.NewImage as typeof mockNewImage) = {
        Id: { N: 101 },
        Message: { S: 'foo' },
      };
      // biome-ignore lint/style/noNonNullAssertion: it is ensured that this event has these properties
      (invalidDDBEvent.Records[1].dynamodb!.NewImage as typeof mockNewImage) =
        mockNewImage;
      // biome-ignore lint/style/noNonNullAssertion: it is ensured that this event has these properties
      (invalidDDBEvent.Records[0].dynamodb!.OldImage as typeof mockOldImage) =
        mockOldImage;
      // biome-ignore lint/style/noNonNullAssertion: it is ensured that this event has these properties
      (invalidDDBEvent.Records[1].dynamodb!.OldImage as typeof mockOldImage) =
        mockOldImage;

      const parsed = DynamoDBStreamEnvelope.safeParse(invalidDDBEvent, schema);
      expect(parsed).toEqual({
        success: false,
        error: expect.any(ParseError),
        originalEvent: invalidDDBEvent,
      });
    });

    it('safeParse should return error if OldImage is invalid', () => {
      const invalidDDBEvent =
        TestEvents.dynamoStreamEvent as DynamoDBStreamEvent;

      // biome-ignore lint/style/noNonNullAssertion: it is ensured that this event has these properties
      (invalidDDBEvent.Records[0].dynamodb!.OldImage as typeof mockNewImage) = {
        Id: { N: 101 },
        Message: { S: 'foo' },
      };
      // biome-ignore lint/style/noNonNullAssertion: it is ensured that this event has these properties
      (invalidDDBEvent.Records[1].dynamodb!.NewImage as typeof mockNewImage) =
        mockNewImage;
      // biome-ignore lint/style/noNonNullAssertion: it is ensured that this event has these properties
      (invalidDDBEvent.Records[0].dynamodb!.OldImage as typeof mockOldImage) =
        mockOldImage;
      // biome-ignore lint/style/noNonNullAssertion: it is ensured that this event has these properties
      (invalidDDBEvent.Records[0].dynamodb!.NewImage as typeof mockNewImage) =
        mockNewImage;

      const parsed = DynamoDBStreamEnvelope.safeParse(invalidDDBEvent, schema);
      expect(parsed).toEqual({
        success: false,
        error: expect.any(ParseError),
        originalEvent: invalidDDBEvent,
      });
    });

    it('safeParse should return error if envelope is invalid', () => {
      const parsed = DynamoDBStreamEnvelope.safeParse({ foo: 'bar' }, schema);
      expect(parsed).toEqual({
        success: false,
        error: expect.any(ParseError),
        originalEvent: { foo: 'bar' },
      });
    });
  });
});
