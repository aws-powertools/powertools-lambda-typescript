/**
 * Test built in schema envelopes for api gateway v2
 *
 * @group unit/parser/envelopes
 */

import { generateMock } from '@anatine/zod-mock';
import { TestEvents } from '../schema/utils.js';
import { DynamoDBStreamEvent } from 'aws-lambda';
import { z } from 'zod';
import { Envelopes } from '../../../src/envelopes/Envelopes.js';

describe('DynamoDB', () => {
  const schema = z.object({
    Message: z.record(z.literal('S'), z.string()),
    Id: z.record(z.literal('N'), z.number().min(0).max(100)),
  });

  const envelope = Envelopes.DYNAMO_DB_STREAM_ENVELOPE;
  it('should parse dynamodb envelope', () => {
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

    const parsed = envelope.parse(dynamodbEvent, schema);
    expect(parsed[0]).toEqual({
      OldImage: mockOldImage,
      NewImage: mockNewImage,
    });
    expect(parsed[1]).toEqual({
      OldImage: mockOldImage,
      NewImage: mockNewImage,
    });
  });
});
