import { describe, expect, it } from 'vitest';
import { ZodError, z } from 'zod';
import { JSONStringified } from '../../src/helpers.js';
import { DynamoDBMarshalled } from '../../src/helpers/dynamodb.js';
import { AlbSchema } from '../../src/schemas/alb.js';
import {
  DynamoDBStreamRecord,
  DynamoDBStreamSchema,
} from '../../src/schemas/dynamodb';
import {
  SnsNotificationSchema,
  SnsRecordSchema,
} from '../../src/schemas/sns.js';
import { SqsRecordSchema, SqsSchema } from '../../src/schemas/sqs.js';
import type {
  DynamoDBStreamEvent,
  SnsEvent,
  SqsEvent,
} from '../../src/types/schema.js';
import { getTestEvent } from './schema/utils.js';

const bodySchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
});
const envelopeSchema = z.object({
  body: z.string(),
});
const basePayload = {
  id: 1,
  name: 'John Doe',
  email: 'foo@bar.baz',
};

describe('JSONStringified', () => {
  it('should return a valid JSON', () => {
    // Prepare
    const data = {
      body: JSON.stringify(structuredClone(basePayload)),
    };

    // Act
    const extendedSchema = envelopeSchema.extend({
      body: JSONStringified(bodySchema),
    });

    // Assess
    expect(extendedSchema.parse(data)).toStrictEqual({
      body: basePayload,
    });
  });

  it('should throw an error if the JSON payload is invalid', () => {
    // Prepare
    const data = {
      body: JSON.stringify({ ...basePayload, email: 'invalid' }),
    };

    // Act
    const extendedSchema = envelopeSchema.extend({
      body: JSONStringified(bodySchema),
    });

    // Assess
    expect(() => extendedSchema.parse(data)).toThrow();
  });

  it('should throw an error if the JSON is malformed', () => {
    // Prepare
    const data = {
      body: 'invalid',
    };

    // Act
    const extendedSchema = envelopeSchema.extend({
      body: JSONStringified(bodySchema),
    });

    // Assess
    expect(() => extendedSchema.parse(data)).toThrow();
  });

  it('should parse extended AlbSchema', () => {
    // Prepare
    const testEvent = getTestEvent({
      eventsPath: '.',
      filename: 'albEvent',
    });
    testEvent.body = JSON.stringify(structuredClone(basePayload));

    // Act
    const extendedSchema = AlbSchema.extend({
      body: JSONStringified(bodySchema),
    });

    // Assess
    expect(extendedSchema.parse(testEvent)).toStrictEqual({
      ...testEvent,
      body: basePayload,
    });
  });

  it('should parse extended SqsSchema', () => {
    // Prepare
    const testEvent = getTestEvent<SqsEvent>({
      eventsPath: '.',
      filename: 'sqsEvent',
    });
    const stringifiedBody = JSON.stringify(basePayload);
    testEvent.Records[0].body = stringifiedBody;
    testEvent.Records[1].body = stringifiedBody;

    // Act
    const extendedSchema = SqsSchema.extend({
      Records: z.array(
        SqsRecordSchema.extend({
          body: JSONStringified(bodySchema),
        })
      ),
    });

    // Assess
    expect(extendedSchema.parse(testEvent)).toStrictEqual({
      ...testEvent,
      Records: [
        { ...testEvent.Records[0], body: basePayload },
        { ...testEvent.Records[1], body: basePayload },
      ],
    });
  });

  it('should parse extended SnsSchema', () => {
    // Prepare
    const testEvent = getTestEvent<SnsEvent>({
      eventsPath: '.',
      filename: 'snsEvent',
    });
    testEvent.Records[0].Sns.Message = JSON.stringify(basePayload);

    // Act
    const extendedSchema = SqsSchema.extend({
      Records: z.array(
        SnsRecordSchema.extend({
          Sns: SnsNotificationSchema.extend({
            Message: JSONStringified(bodySchema),
          }),
        })
      ),
    });

    // Assess
    expect(extendedSchema.parse(testEvent)).toStrictEqual({
      ...testEvent,
      Records: [
        {
          ...testEvent.Records[0],
          Sns: { ...testEvent.Records[0].Sns, Message: basePayload },
        },
      ],
    });
  });
});

describe('DynamoDBMarshalled', () => {
  // Prepare
  const schema = z.object({
    Message: z.string(),
    Id: z.number(),
  });

  const extendedSchema = DynamoDBStreamSchema.extend({
    Records: z.array(
      DynamoDBStreamRecord.extend({
        dynamodb: z.object({
          NewImage: DynamoDBMarshalled(schema).optional(),
        }),
      })
    ),
  });

  it('should correctly unmarshall and validate a valid DynamoDB stream record', () => {
    // Prepare
    const testInput = [
      {
        Message: {
          S: 'New item!',
        },
        Id: {
          N: '101',
        },
      },
      {
        Message: {
          S: 'This item has changed',
        },
        Id: {
          N: '101',
        },
      },
    ];
    const expectedOutput = [
      {
        Id: 101,
        Message: 'New item!',
      },
      {
        Id: 101,
        Message: 'This item has changed',
      },
    ];

    const testEvent = getTestEvent<DynamoDBStreamEvent>({
      eventsPath: '.',
      filename: 'dynamoStreamEvent',
    });

    testEvent.Records[0].dynamodb.NewImage = testInput[0];
    testEvent.Records[1].dynamodb.NewImage = testInput[1];

    // Act & Assess
    expect(extendedSchema.parse(testEvent)).toStrictEqual({
      Records: [
        {
          ...testEvent.Records[0],
          dynamodb: {
            NewImage: expectedOutput[0],
          },
        },
        {
          ...testEvent.Records[1],
          dynamodb: {
            NewImage: expectedOutput[1],
          },
        },
      ],
    });
  });

  it('should throw an error if the DynamoDB stream record cannot be unmarshalled', () => {
    // Prepare
    const testInput = [
      {
        Message: {
          S: 'New item!',
        },
        Id: {
          NNN: '101', //unknown type
        },
      },
      {
        Message: {
          S: 'This item has changed',
        },
        Id: {
          N: '101',
        },
      },
    ];

    const testEvent = getTestEvent<DynamoDBStreamEvent>({
      eventsPath: '.',
      filename: 'dynamoStreamEvent',
    });

    testEvent.Records[0].dynamodb.NewImage = testInput[0];
    testEvent.Records[1].dynamodb.NewImage = testInput[1];

    // Act & Assess
    expect(() => extendedSchema.parse(testEvent)).toThrow();
  });

  it('should throw a validation error if the unmarshalled record does not match the schema', () => {
    // Prepare
    const testInput = [
      {
        Message: {
          S: 'New item!',
        },
        Id: {
          N: '101',
        },
      },
      {
        Message: {
          S: 'This item has changed',
        },
        // Id is missing
      },
    ];

    const testEvent = getTestEvent<DynamoDBStreamEvent>({
      eventsPath: '.',
      filename: 'dynamoStreamEvent',
    });

    testEvent.Records[0].dynamodb.NewImage = testInput[0];
    testEvent.Records[1].dynamodb.NewImage = testInput[1];

    // Act & Assess
    expect(() => extendedSchema.parse(testEvent)).toThrow(ZodError);
  });
});
