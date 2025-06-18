import type { Context } from 'aws-lambda';
import { describe, expect, it } from 'vitest';
import z from 'zod';
import { kafkaConsumer } from '../../src/consumer.js';
import {
  KafkaConsumerAvroMissingSchemaError,
  KafkaConsumerParserError,
  KafkaConsumerProtobufMissingSchemaError,
} from '../../src/errors.js';
import type { ConsumerRecords, MSKEvent } from '../../src/types.js';
import * as avroEvent from '../events/avro.json' with { type: 'json' };
import * as jsonEvent from '../events/default.json' with { type: 'json' };
import * as protobufEvent from '../events/protobuf.json' with { type: 'json' };
import { Product as ProductProto } from '../protos/product.es6.generated.js';

describe('Kafka consumer: ', () => {
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

  const jsonTestEvent = jsonEvent as unknown as MSKEvent;
  const avroTestEvent = avroEvent as unknown as MSKEvent;
  const protobufTestEvent = protobufEvent as unknown as MSKEvent;
  const context = {} as Context;
  const handler = async (
    event: ConsumerRecords<Key, Product>,
    _context: Context
  ): Promise<ConsumerRecords<Key, Product>> => event;

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
  } as const;

  it('deserializes json message', async () => {
    const consumer = kafkaConsumer<Key, Product>(handler, {
      value: { type: 'json' },
      key: { type: 'json' },
    });

    const event = await consumer(jsonTestEvent, context);
    expect(event.records[0]).toEqual({
      ...TEST_DATA.json,
      ...TEST_DATA.headers.withHeaders,
    });
  });

  it('deserializes avro message', async () => {
    const consumer = kafkaConsumer<Key, Product>(handler, {
      value: {
        type: 'avro',
        schema: TEST_DATA.avro.schema,
      },
      key: { type: 'json' },
    });

    const event = await consumer(avroTestEvent, context);
    expect(event.records[0]).toEqual({
      ...TEST_DATA.avro.data,
      ...TEST_DATA.headers.withHeaders,
    });
  });

  it('deserializes protobuf message', async () => {
    const consumer = kafkaConsumer<Key, Product>(handler, {
      value: {
        type: 'protobuf',
        schema: TEST_DATA.protobuf.schema,
      },
      key: { type: 'json' },
    });

    const event = await consumer(protobufTestEvent, context);
    expect(event.records[0]).toEqual({
      ...TEST_DATA.protobuf.data,
      ...TEST_DATA.headers.withHeaders,
    });
  });

  const testMissingSchema = async (
    type: Extract<SerializationType, 'avro' | 'protobuf'>,
    ErrorClass:
      | typeof KafkaConsumerAvroMissingSchemaError
      | typeof KafkaConsumerProtobufMissingSchemaError,
    testEvent: MSKEvent
  ): Promise<void> => {
    const consumer = kafkaConsumer<Key, Product>(handler, {
      // @ts-expect-error - testing missing schemaStr
      value: { type },
    });
    await expect(consumer(testEvent, context)).rejects.toThrow(ErrorClass);
  };

  it('throws when schemaStr not passed for avro event', async () => {
    await testMissingSchema(
      'avro',
      KafkaConsumerAvroMissingSchemaError,
      avroTestEvent
    );
  });

  it('throws when schemaStr not passed for protobuf event', async () => {
    await testMissingSchema(
      'protobuf',
      KafkaConsumerProtobufMissingSchemaError,
      protobufTestEvent
    );
  });

  it('throws if schema type is not json, avro or protobuf', async () => {
    const consumer = kafkaConsumer<Key, Product>(handler, {
      value: {
        // @ts-expect-error - testing unsupported type
        type: 'xml',
      },
    });
    await expect(consumer(jsonTestEvent, context)).rejects.toThrow();
  });

  describe('edge cases', () => {
    it('deserializes with no headers provided', async () => {
      const consumer = kafkaConsumer<Key, Product>(handler, {
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

      const event = await consumer(jsonTestEventWithoutHeaders, context);
      expect(event.records[0]).toEqual({
        ...TEST_DATA.json,
        ...TEST_DATA.headers.withoutHeaders,
      });
    });

    it('throws when zod schema validation fails', async () => {
      const invalidValue =
        'eyJpZCI6NDIsIm5hbWUiOiJpbnZhbGlkUHJvZHVjdCIsInByaWNlIjotMTAwfQ==';
      const invalidJsonEvent = {
        ...jsonTestEvent,
        records: {
          'test-topic': [
            {
              key: TEST_DATA.json.originalKey,
              value: invalidValue,
              headers: null,
            },
          ],
        },
      } as unknown as MSKEvent;

      const consumer = kafkaConsumer<Key, Product>(handler, {
        value: {
          type: 'json',
          parserSchema: valueZodSchema,
        },
        key: {
          type: 'json',
          parserSchema: keyZodSchema,
        },
      });

      await expect(consumer(invalidJsonEvent, context)).rejects.toThrow(
        KafkaConsumerParserError
      );
    });

    it('throws when non MSK event passed kafka consumer', async () => {
      const consumer = kafkaConsumer<Key, Product>(handler, {
        value: { type: 'json' },
      });
      await expect(consumer({} as MSKEvent, context)).rejects.toThrow(
        'No records found in the event'
      );
    });
  });
});
