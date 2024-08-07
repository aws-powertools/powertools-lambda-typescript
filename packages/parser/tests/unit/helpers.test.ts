import { z } from 'zod';
import { JSONStringified } from '../../src/helpers.js';
import {
  AlbSchema,
  SnsNotificationSchema,
  SnsRecordSchema,
  SqsRecordSchema,
  SqsSchema,
} from '../../src/schemas';
import type { SnsEvent, SqsEvent } from '../../src/types';
import { getTestEvent } from './schema/utils';

describe('JSONStringified', () => {
  const schema = z.object({
    id: z.number(),
    name: z.string(),
    email: z.string().email(),
  });
  const baseSchema = z.object({
    body: z.string(),
  });
  it('should return a valid JSON', () => {
    const data = {
      body: JSON.stringify({
        id: 1,
        name: 'John Doe',
        email: 'foo@example.com',
      }),
    };

    const extendedSchema = baseSchema.extend({
      body: JSONStringified(schema),
    });

    const result = extendedSchema.parse(data);
    expect(result).toEqual({
      body: { id: 1, name: 'John Doe', email: 'foo@example.com' },
    });
  });

  it('should throw an error if the JSON payload is invalid', () => {
    const data = {
      body: JSON.stringify({
        id: 1,
        name: 'John Doe',
        email: 'foo',
      }),
    };

    const extendedSchema = baseSchema.extend({
      body: JSONStringified(schema),
    });

    expect(() => extendedSchema.parse(data)).toThrow();
  });

  it('should throw an error if the JSON is malformed', () => {
    const data = {
      body: 'invalid',
    };

    const extendedSchema = baseSchema.extend({
      body: JSONStringified(schema),
    });

    expect(() => extendedSchema.parse(data)).toThrow();
  });

  describe('should parse common built-in schemas', () => {
    const customSchema = z.object({
      id: z.number(),
      name: z.string(),
      email: z.string().email(),
    });

    const payload = {
      id: 1,
      name: 'John Doe',
      email: 'foo@bar.baz',
    };

    it('should parse extended AlbSchema', () => {
      const extendedSchema = AlbSchema.extend({
        body: JSONStringified(customSchema),
      });

      const testEvent = getTestEvent({
        eventsPath: '.',
        filename: 'albEvent',
      });
      testEvent.body = JSON.stringify(payload);

      const result = extendedSchema.parse(testEvent);
      expect(result).toEqual({
        ...testEvent,
        body: payload,
      });
    });

    it('should parse extended SqsSchema', () => {
      const extendedSchema = SqsSchema.extend({
        Records: z.array(
          SqsRecordSchema.extend({
            body: JSONStringified(customSchema),
          })
        ),
      });

      const testEvent = getTestEvent<SqsEvent>({
        eventsPath: '.',
        filename: 'sqsEvent',
      });
      testEvent.Records[0].body = JSON.stringify(payload);
      testEvent.Records[1].body = JSON.stringify(payload);

      const result = extendedSchema.parse(testEvent);
      expect(result).toEqual({
        ...testEvent,
        Records: [
          { ...testEvent.Records[0], body: payload },
          { ...testEvent.Records[1], body: payload },
        ],
      });
    });

    it('should parse extended SnsSchema', () => {
      const extendedSchema = SqsSchema.extend({
        Records: z.array(
          SnsRecordSchema.extend({
            Sns: SnsNotificationSchema.extend({
              Message: JSONStringified(customSchema),
            }),
          })
        ),
      });

      const testEvent = getTestEvent<SnsEvent>({
        eventsPath: '.',
        filename: 'snsEvent',
      });
      testEvent.Records[0].Sns.Message = JSON.stringify(payload);

      const result = extendedSchema.parse(testEvent);
      expect(result).toEqual({
        ...testEvent,
        Records: [
          {
            ...testEvent.Records[0],
            Sns: { ...testEvent.Records[0].Sns, Message: payload },
          },
        ],
      });
    });
  });
});
