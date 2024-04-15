/**
 * Test built in schema envelopes for api gateway v2
 *
 * @group unit/parser/envelopes
 */

import { generateMock } from '@anatine/zod-mock';
import { TestEvents } from '../schema/utils.js';
import { DynamoDBStreamEvent } from 'aws-lambda';
import { z } from 'zod';
import { DynamoDBStreamEnvelope } from '../../../src/envelopes/index.js';
import { ParseError } from '../../../src/errors.js';

describe('DynamoDB', () => {
  const schema = z.object({
    Message: z.record(z.literal('S'), z.string()),
    Id: z.record(z.literal('N'), z.number().min(0).max(100)),
  });
  const mockOldImage = generateMock(schema);
  const mockNewImage = generateMock(schema);
  const dynamodbEvent = TestEvents.dynamoStreamEvent as DynamoDBStreamEvent;
  (dynamodbEvent.Records[0].dynamodb!.NewImage as typeof mockNewImage) =
    mockNewImage;
  (dynamodbEvent.Records[1].dynamodb!.NewImage as typeof mockNewImage) =
    mockNewImage;
  (dynamodbEvent.Records[0].dynamodb!.OldImage as typeof mockOldImage) =
    mockOldImage;
  (dynamodbEvent.Records[1].dynamodb!.OldImage as typeof mockOldImage) =
    mockOldImage;
  describe('parse', () => {
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
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      ddbEvent.Records[0].dynamodb!.NewImage.Id = 'foo';
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

      (invalidDDBEvent.Records[0].dynamodb!.NewImage as typeof mockNewImage) = {
        Id: { N: 101 },
        Message: { S: 'foo' },
      };
      (invalidDDBEvent.Records[1].dynamodb!.NewImage as typeof mockNewImage) =
        mockNewImage;
      (invalidDDBEvent.Records[0].dynamodb!.OldImage as typeof mockOldImage) =
        mockOldImage;
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

      (invalidDDBEvent.Records[0].dynamodb!.OldImage as typeof mockNewImage) = {
        Id: { N: 101 },
        Message: { S: 'foo' },
      };
      (invalidDDBEvent.Records[1].dynamodb!.NewImage as typeof mockNewImage) =
        mockNewImage;
      (invalidDDBEvent.Records[0].dynamodb!.OldImage as typeof mockOldImage) =
        mockOldImage;
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
