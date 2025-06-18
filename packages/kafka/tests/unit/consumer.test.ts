import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Context } from 'aws-lambda';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  KafkaConsumerAvroMissingSchemaError,
  KafkaConsumerParserError,
  KafkaConsumerProtobufMissingSchemaError,
} from '../../src/errors.js';
import { SchemaType, kafkaConsumer } from '../../src/index.js';
import type { ConsumerRecords, MSKEvent } from '../../src/types/types.js';
import { Product as ProductProto } from '../protos/product.es6.generated.js';

describe('Kafka consumer', () => {
  // Common test setup
  const keyZodSchema = z.string();
  const valueZodSchema = z.object({
    id: z.number(),
    name: z.string(),
    price: z.number().positive({
      message: "Price can't be negative",
    }),
  });

  type Key = z.infer<typeof keyZodSchema>;
  type Product = z.infer<typeof valueZodSchema>;
  type SerializationType = 'json' | 'avro' | 'protobuf';

  const jsonTestEvent = JSON.parse(
    readFileSync(join(__dirname, '..', 'events', 'default.json'), 'utf-8')
  ) as unknown as MSKEvent;
  const avroTestEvent = JSON.parse(
    readFileSync(join(__dirname, '..', 'events', 'avro.json'), 'utf-8')
  ) as unknown as MSKEvent;
  const protobufTestEvent = JSON.parse(
    readFileSync(join(__dirname, '..', 'events', 'protobuf.json'), 'utf-8')
  ) as unknown as MSKEvent;
  const context = {} as Context;
  const baseHandler = async (
    event: ConsumerRecords<Key, Product>,
    _context: Context
  ) => event;

  // Test data constants
  const TEST_DATA = {
    json: {
      key: 'recordKey',
      value: { id: 12345, name: 'product5', price: 45 },
      originalKey: 'cmVjb3JkS2V5',
      originalValue:
        'ewogICJpZCI6IDEyMzQ1LAogICJuYW1lIjogInByb2R1Y3Q1IiwKICAicHJpY2UiOiA0NQp9',
    },
    avro: {
      data: {
        key: 42,
        value: { id: 1001, name: 'Laptop', price: 999.99 },
        originalKey: 'NDI=',
        originalValue: '0g8MTGFwdG9wUrgehes/j0A=',
      },
      schema: `{
        "type": "record",
        "name": "Product",
        "fields": [
          { "name": "id", "type": "int" },
          { "name": "name", "type": "string" },
          { "name": "price", "type": "double" }
        ]
      }`,
    },
    protobuf: {
      data: {
        key: 42,
        value: { id: 1001, name: 'Laptop', price: 999.99 },
        originalKey: 'NDI=',
        originalValue: 'COkHEgZMYXB0b3AZUrgehes/j0A=',
      },
      schema: ProductProto,
    },
    headers: {
      withHeaders: {
        headers: [{ headerKey: 'headerValue' }],
        originalHeaders: [
          { headerKey: [104, 101, 97, 100, 101, 114, 86, 97, 108, 117, 101] },
        ],
      },
      withoutHeaders: {
        headers: null,
        originalHeaders: null,
      },
    },
    otherFields: {
      topic: 'mytopic',
      partition: 0,
      offset: 15,
      timestamp: 1545084650987,
      timestampType: 'CREATE_TIME',
    },
  } as const;

  it('deserializes json message', async () => {
    // Prepare
    const handler = kafkaConsumer(baseHandler, {
      value: { type: 'json' },
      key: { type: 'json' },
    });

    // Act
    const result = (await handler(jsonTestEvent, context)) as ConsumerRecords;

    // Assess
    expect(result.records[0]).toEqual({
      ...TEST_DATA.json,
      ...TEST_DATA.headers.withHeaders,
      ...TEST_DATA.otherFields,
    });
  });

  it('deserializes avro message', async () => {
    // Prepare
    const handler = kafkaConsumer(baseHandler, {
      value: {
        type: 'avro',
        schema: TEST_DATA.avro.schema,
      },
      key: { type: 'json' },
    });

    // Act
    const result = (await handler(avroTestEvent, context)) as ConsumerRecords<
      unknown,
      Product
    >;

    // Assess
    expect(result.records[0]).toEqual({
      ...TEST_DATA.avro.data,
      ...TEST_DATA.headers.withHeaders,
      ...TEST_DATA.otherFields,
    });
  });

  it('deserializes protobuf message', async () => {
    // Prepare
    const handler = kafkaConsumer(baseHandler, {
      value: {
        type: 'protobuf',
        schema: TEST_DATA.protobuf.schema,
      },
      key: { type: 'json' },
    });

    // Act
    const event = (await handler(
      protobufTestEvent,
      context
    )) as ConsumerRecords<unknown, Product>;

    // Assess
    expect(event.records[0]).toEqual({
      ...TEST_DATA.protobuf.data,
      ...TEST_DATA.headers.withHeaders,
      ...TEST_DATA.otherFields,
    });
  });

  it.each([
    {
      type: 'avro' as Extract<SerializationType, 'avro' | 'protobuf'>,
      event: avroTestEvent,
      error: KafkaConsumerAvroMissingSchemaError,
    },
    {
      type: 'protobuf' as Extract<SerializationType, 'avro' | 'protobuf'>,
      event: protobufTestEvent,
      error: KafkaConsumerProtobufMissingSchemaError,
    },
  ])(
    'throws when schemaStr not passed for $type event',
    async ({ type, error, event }) => {
      // Prepare
      const handler = kafkaConsumer(baseHandler, {
        // @ts-expect-error - testing missing schemaStr
        value: { type },
      });

      // Act & Assess
      await expect(handler(event, context)).rejects.toThrow(error);
    }
  );

  it('throws if schema type is not json, avro or protobuf', async () => {
    // Prepare
    const handler = kafkaConsumer(baseHandler, {
      value: {
        // @ts-expect-error - testing unsupported type
        type: 'xml',
      },
    });

    // Act & Assess
    await expect(handler(jsonTestEvent, context)).rejects.toThrow();
  });

  it('deserializes with no headers provided', async () => {
    // Prepare
    const handler = kafkaConsumer(baseHandler, {
      value: { type: 'json' },
    });
    const jsonTestEventWithoutHeaders = {
      ...jsonTestEvent,
      records: {
        'test-topic': [
          {
            key: TEST_DATA.json.originalKey,
            value: TEST_DATA.json.originalValue,
            headers: null,
          },
        ],
      },
    } as unknown as MSKEvent;

    // Act
    const result = (await handler(
      jsonTestEventWithoutHeaders,
      context
    )) as ConsumerRecords;

    // Assess
    expect(result.records[0]).toEqual({
      ...TEST_DATA.json,
      ...TEST_DATA.headers.withoutHeaders,
    });
  });

  it.each([
    {
      type: 'key',
      event: {
        ...jsonTestEvent,
        records: {
          'test-topic': [
            {
              key: 'eyJpZCI6NDIsIm5hbWUiOiJpbnZhbGlkUHJvZHVjdCIsInByaWNlIjotMTAwfQ==',
              value: TEST_DATA.json.originalValue,
              headers: null,
            },
          ],
        },
      } as unknown as MSKEvent,
    },
    {
      type: 'value',
      event: {
        ...jsonTestEvent,
        records: {
          'test-topic': [
            {
              key: TEST_DATA.json.originalKey,
              value:
                'eyJpZCI6NDIsIm5hbWUiOiJpbnZhbGlkUHJvZHVjdCIsInByaWNlIjotMTAwfQ==',
              headers: null,
            },
          ],
        },
      } as unknown as MSKEvent,
    },
  ])('throws when zod schema validation fails for $type', async ({ event }) => {
    // Prepare
    const handler = kafkaConsumer(baseHandler, {
      value: {
        type: SchemaType.JSON,
        parserSchema: valueZodSchema,
      },
      key: {
        type: SchemaType.JSON,
        parserSchema: keyZodSchema,
      },
    });

    // Act & Assess
    await expect(handler(event, context)).rejects.toThrow(
      KafkaConsumerParserError
    );
  });

  it('throws when non MSK event passed kafka consumer', async () => {
    // Prepare
    const handler = kafkaConsumer(baseHandler, {
      value: { type: 'json' },
    });

    // Act & Assess
    await expect(handler({} as MSKEvent, context)).rejects.toThrow(
      'Event is not a valid MSKEvent. Expected an object with a "records" property.'
    );
  });

  it.each([
    {
      type: 'key parserSchema but no value parserSchema',
      config: {
        key: {
          type: SchemaType.JSON,
          parserSchema: keyZodSchema,
        },
        value: { type: SchemaType.JSON },
      },
    },
    {
      type: 'value parserSchema but no key parserSchema',
      config: {
        key: { type: SchemaType.JSON },
        value: {
          type: SchemaType.JSON,
          parserSchema: valueZodSchema,
        },
      },
    },
  ])('deserializes with $type', async ({ config }) => {
    // Prepare
    const handler = kafkaConsumer(baseHandler, config);
    const customEvent = {
      ...jsonTestEvent,
      records: {
        'test-topic': [
          {
            key: TEST_DATA.json.originalKey,
            value: TEST_DATA.json.originalValue,
            headers: null,
          },
        ],
      },
    } as unknown as MSKEvent;

    // Act
    const result = (await handler(customEvent, context)) as ConsumerRecords;

    // Assess
    expect(result.records[0]).toEqual({
      ...TEST_DATA.json,
      ...TEST_DATA.headers.withoutHeaders,
    });
  });
});
