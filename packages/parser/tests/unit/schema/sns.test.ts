import { describe, expect, it } from 'vitest';
import { SnsSchema } from '../../../src/schemas/sns.js';
import type { SnsEvent } from '../../../src/types/schema.js';
import { getTestEvent } from '../helpers/utils.js';

describe('Schema: SNS', () => {
  const baseEvent = getTestEvent<SnsEvent>({
    eventsPath: 'sns',
    filename: 'base',
  });

  it('parses a SNS event', () => {
    // Prepare
    const event = structuredClone(baseEvent);

    // Act
    const result = SnsSchema.parse(event);

    // Assess
    expect(result).toStrictEqual({
      Records: [
        {
          EventSource: 'aws:sns',
          EventVersion: '1.0',
          EventSubscriptionArn:
            'arn:aws:sns:us-east-2:123456789012:ExampleTopic',
          Sns: {
            SignatureVersion: '1',
            Timestamp: '2019-01-02T12:45:07.000Z',
            Signature:
              'tcc6faL2yUC6dgZdmrwh1Y4cGa/ebXEkAi6RibDsvpi+tE/1+82j...65r==',
            SigningCertUrl:
              'https://sns.us-east-2.amazonaws.com/SimpleNotification',
            MessageId: '95df01b4-ee98-5cb9-9903-4c221d41eb5e',
            Message: 'Hello from SNS!',
            MessageAttributes: {
              Test: {
                Type: 'String',
                Value: 'TestString',
              },
              TestBinary: {
                Type: 'Binary',
                Value: 'TestBinary',
              },
            },
            Type: 'Notification',
            UnsubscribeUrl:
              'https://sns.us-east-2.amazonaws.com/?Action=Unsubscribe',
            TopicArn: 'arn:aws:sns:us-east-2:123456789012:ExampleTopic',
            Subject: 'TestInvoke',
          },
        },
      ],
    });
  });

  it('throws if the event is not a SNS event', () => {
    // Prepare
    const event = {
      Records: [],
    };

    // Act & Assess
    expect(() => SnsSchema.parse(event)).toThrow();
  });
});
