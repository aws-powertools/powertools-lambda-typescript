import { describe, expect, it } from 'vitest';
import {
  KafkaMskEventSchema,
  KafkaSelfManagedEventSchema,
} from '../../../src/schemas/kafka.js';
import type {
  KafkaMskEvent,
  KafkaSelfManagedEvent,
} from '../../../src/types/schema.js';
import { getTestEvent, omit } from '../helpers/utils.js';

describe('Schema: Kafka', () => {
  const baseEvent = getTestEvent<KafkaMskEvent>({
    eventsPath: 'kafka',
    filename: 'base',
  });

  it('parses a Kafka MSK event', () => {
    // Prepare
    const event = structuredClone(baseEvent);

    // Act
    const result = KafkaMskEventSchema.parse(event);

    // Assess
    expect(result).toStrictEqual({
      eventSource: 'aws:kafka',
      eventSourceArn:
        'arn:aws:kafka:us-east-1:0123456789019:cluster/SalesCluster/abcd1234-abcd-cafe-abab-9876543210ab-4',
      bootstrapServers: [
        'b-2.demo-cluster-1.a1bcde.c1.kafka.us-east-1.amazonaws.com:9092',
        'b-1.demo-cluster-1.a1bcde.c1.kafka.us-east-1.amazonaws.com:9092',
      ],
      records: {
        'mytopic-0': [
          {
            topic: 'mytopic',
            partition: 0,
            offset: 15,
            timestamp: 1545084650987,
            timestampType: 'CREATE_TIME',
            key: 'recordKey',
            value: `{"key":"value"}`,
            headers: [
              {
                headerKey: 'headerValue',
              },
            ],
          },
        ],
      },
    });
  });

  it('throws if the event is not a Kafka MSK event', () => {
    // Prepare
    const event = structuredClone(baseEvent);
    event.records['mytopic-0'] = [];

    // Act & Assess
    expect(() => KafkaMskEventSchema.parse(event)).toThrow();
  });

  it('parses a Kafka self-managed event', () => {
    // Prepare
    const event = omit(
      ['eventSourceArn', 'bootstrapServers'],
      structuredClone(baseEvent)
    );
    (event as unknown as KafkaSelfManagedEvent).eventSource =
      'SelfManagedKafka';

    // Act
    const result = KafkaSelfManagedEventSchema.parse(event);

    // Assess
    expect(result).toStrictEqual({
      eventSource: 'SelfManagedKafka',
      records: {
        'mytopic-0': [
          {
            topic: 'mytopic',
            partition: 0,
            offset: 15,
            timestamp: 1545084650987,
            timestampType: 'CREATE_TIME',
            key: 'recordKey',
            value: `{"key":"value"}`,
            headers: [
              {
                headerKey: 'headerValue',
              },
            ],
          },
        ],
      },
    });
  });
});
