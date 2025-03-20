import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { DynamoDBMarshalled } from '../../src/helpers/dynamodb.js';
import { JSONStringified } from '../../src/helpers/index.js';
import { AlbSchema } from '../../src/schemas/alb.js';
import {
  DynamoDBStreamRecord,
  DynamoDBStreamSchema,
} from '../../src/schemas/dynamodb.js';
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
import { getTestEvent } from './helpers/utils.js';

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

describe('Helper: JSONStringified', () => {
  it('returns a valid JSON', () => {
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

  it('throws an error if the JSON payload is invalid', () => {
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

  it('throws an error if the JSON is malformed', () => {
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

  it('parses extended AlbSchema', () => {
    // Prepare
    const testEvent = getTestEvent({
      eventsPath: 'alb',
      filename: 'base',
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

  it('parses extended SqsSchema', () => {
    // Prepare
    const testEvent = getTestEvent<SqsEvent>({
      eventsPath: 'sqs',
      filename: 'base',
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

  it('parses extended SnsSchema', () => {
    // Prepare
    const testEvent = getTestEvent<SnsEvent>({
      eventsPath: 'sns',
      filename: 'base',
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

describe('Helper: DynamoDBMarshalled', () => {
  // Prepare
  const schema = z.object({
    Message: z.string(),
    Id: z.number(),
  });

  const baseEvent = getTestEvent<DynamoDBStreamEvent>({
    eventsPath: 'dynamodb',
    filename: 'base',
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

  it('unmarshalls and validates a valid DynamoDB stream record', () => {
    // Prepare
    const event = structuredClone(baseEvent);
    event.Records[0].dynamodb.NewImage = {
      Message: {
        S: 'New item!',
      },
      Id: {
        N: '101',
      },
    };
    event.Records[1].dynamodb.NewImage = {
      Message: {
        S: 'This item has changed',
      },
      Id: {
        N: '101',
      },
    };

    // Act & Assess
    expect(extendedSchema.parse(event)).toStrictEqual({
      Records: [
        {
          ...event.Records[0],
          dynamodb: {
            NewImage: {
              Id: 101,
              Message: 'New item!',
            },
          },
        },
        {
          ...event.Records[1],
          dynamodb: {
            NewImage: {
              Id: 101,
              Message: 'This item has changed',
            },
          },
        },
      ],
    });
  });

  it('throws an error if the DynamoDB stream record cannot be unmarshalled', () => {
    // Prepare
    const event = structuredClone(baseEvent);
    event.Records[0].dynamodb.NewImage = {
      Message: {
        S: 'New item!',
      },
      Id: {
        NNN: '101', //unknown type
      },
    };
    event.Records[1].dynamodb.NewImage = {
      Message: {
        S: 'This item has changed',
      },
      Id: {
        N: '101',
      },
    };

    // Act & Assess
    expect(() => extendedSchema.parse(event)).toThrow(
      'Could not unmarshall DynamoDB stream record'
    );
  });

  it('throws a validation error if the unmarshalled record does not match the schema', () => {
    // Prepare
    const event = structuredClone(baseEvent);
    event.Records[0].dynamodb.NewImage = {
      Message: {
        S: 'New item!',
      },
      Id: {
        N: '101',
      },
    };
    event.Records[1].dynamodb.NewImage = {
      // Id is missing
      Message: {
        S: 'This item has changed',
      },
    };

    // Act & Assess
    expect(() => extendedSchema.parse(event)).toThrow();
  });
});
