import { describe, expect, it } from 'vitest';
import type { z } from 'zod';
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
  // Typed as the schema input, so header values are the raw byte arrays
  const rawEvent = getTestEvent<z.input<typeof KafkaMskEventSchema>>({
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
          {
            topic: 'mymessage-with-unsigned',
            partition: 0,
            offset: 15,
            timestamp: 1545084650987,
            timestampType: 'CREATE_TIME',
            value: '{"key":"value"}',
            headers: [
              {
                headerKey: 'hello-world-ë',
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

  it.each([-129, 256, 1.5])(
    'returns an issue for a header byte of %s instead of throwing',
    (byte) => {
      // Prepare
      const event = structuredClone(rawEvent);
      event.records['mytopic-0'][0].headers = [{ headerKey: [byte] }];

      // Act
      const result = KafkaMskEventSchema.safeParse(event);

      // Assess
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        expect.objectContaining({
          path: ['records', 'mytopic-0', 0, 'headers', 0, 'headerKey', 0],
        }),
      ]);
    }
  );

  it('decodes a large header without exceeding the call stack', () => {
    // Prepare
    const event = structuredClone(rawEvent);
    event.records['mytopic-0'][0].headers = [
      { headerKey: new Array(200_000).fill(65) },
    ];

    // Act
    const result = KafkaMskEventSchema.parse(event);

    // Assess
    expect(result.records['mytopic-0'][0].headers).toEqual([
      { headerKey: 'A'.repeat(200_000) },
    ]);
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
          {
            topic: 'mymessage-with-unsigned',
            partition: 0,
            offset: 15,
            timestamp: 1545084650987,
            timestampType: 'CREATE_TIME',
            value: '{"key":"value"}',
            headers: [
              {
                headerKey: 'hello-world-ë',
              },
            ],
          },
        ],
      },
    });
  });

  it.each([
    { eventSource: 'aws:kafka', schema: KafkaMskEventSchema },
    { eventSource: 'SelfManagedKafka', schema: KafkaSelfManagedEventSchema },
  ])(
    'preserves the key and value schema metadata ($eventSource)',
    ({ eventSource, schema }) => {
      // Prepare
      const event = { ...structuredClone(rawEvent), eventSource };
      event.records['mytopic-0'][0].keySchemaMetadata = {
        dataFormat: 'AVRO',
        schemaId: '5678',
      };
      event.records['mytopic-0'][0].valueSchemaMetadata = {
        dataFormat: 'AVRO',
        schemaId: 'a1b2c3d4-5678-90ab-cdef-EXAMPLE11111',
      };

      // Act
      const result = schema.parse(event);

      // Assess
      expect(result.records['mytopic-0'][0]).toEqual(
        expect.objectContaining({
          keySchemaMetadata: { dataFormat: 'AVRO', schemaId: '5678' },
          valueSchemaMetadata: {
            dataFormat: 'AVRO',
            schemaId: 'a1b2c3d4-5678-90ab-cdef-EXAMPLE11111',
          },
        })
      );
    }
  );

  it('parses schema metadata without a schemaId', () => {
    // Prepare
    const event = structuredClone(rawEvent);
    event.records['mytopic-0'][0].valueSchemaMetadata = {
      dataFormat: 'PROTOBUF',
    };

    // Act
    const result = KafkaMskEventSchema.parse(event);

    // Assess
    expect(result.records['mytopic-0'][0].valueSchemaMetadata).toStrictEqual({
      dataFormat: 'PROTOBUF',
    });
  });

  it('returns an issue when the schema metadata has no dataFormat', () => {
    // Prepare
    const event = structuredClone(rawEvent);
    (
      event.records['mytopic-0'][0] as Record<string, unknown>
    ).valueSchemaMetadata = { schemaId: '1234' };

    // Act
    const result = KafkaMskEventSchema.safeParse(event);

    // Assess
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      expect.objectContaining({
        path: ['records', 'mytopic-0', 0, 'valueSchemaMetadata', 'dataFormat'],
      }),
    ]);
  });
});
