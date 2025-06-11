import type { Context } from 'aws-lambda';
import { describe, expect, it } from 'vitest';
import z, { ZodError } from 'zod';
import { kafkaConsumer } from '../../src/consumer.js';
import {
  KafkaConsumerAvroMissingSchemaError,
  KafkaConsumerProtobufMissingSchemaError,
} from '../../src/errors.js';
import type { ConsumerRecords } from '../../src/types.js';
import * as avroEvent from '../events/avro.json' with { type: 'json' };
import * as jsonEvent from '../events/default.json' with { type: 'json' };
import * as protobufEvent from '../events/protobuf.json' with { type: 'json' };
import { Product as ProductProto } from '../protos/product.generated.js';

describe('Kafka consumer: ', () => {
  const keyZodSchema = z.string();

  //{   "id": 12345,   "name": "product5",   "price": 45 }
  const valueZodSchema = z.object({
    id: z.number(),
    name: z.string(),
    price: z.number().positive({
      message: "Price can't be negative",
    }),
  });

  type Key = z.infer<typeof keyZodSchema>;
  type Product = z.infer<typeof valueZodSchema>;

  const handler = async (
    event: ConsumerRecords<Key, Product>,
    _context: Context
  ) => {
    return event;
  };
  it('deserializes json message', async () => {
    const consumer = kafkaConsumer<Key, Product>(handler, {
      value: {
        type: 'json',
      },
      key: {
        type: 'json',
      },
    });
    const event = await consumer(jsonEvent, {});
    const expected = {
      key: 'recordKey',
      value: { id: 12345, name: 'product5', price: 45 },
      headers: [{ headerKey: 'headerValue' }],
      originalKey: 'cmVjb3JkS2V5',
      originalValue:
        'ewogICJpZCI6IDEyMzQ1LAogICJuYW1lIjogInByb2R1Y3Q1IiwKICAicHJpY2UiOiA0NQp9',
      originalHeaders: [
        { headerKey: [104, 101, 97, 100, 101, 114, 86, 97, 108, 117, 101] },
      ],
    };
    expect(event.records[0]).toEqual(expected);
  });

  it('deserializes avro message', async () => {
    const consumer = kafkaConsumer<Key, Product>(handler, {
      value: {
        type: 'avro',
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
      key: {
        type: 'json',
      },
    });

    const event = await consumer(avroEvent, {});
    const expected = {
      key: 42,
      value: { id: 1001, name: 'Laptop', price: 999.99 },
      headers: [{ headerKey: 'headerValue' }],
      originalKey: 'NDI=',
      originalValue: '0g8MTGFwdG9wUrgehes/j0A=',
      originalHeaders: [
        { headerKey: [104, 101, 97, 100, 101, 114, 86, 97, 108, 117, 101] },
      ],
    };
    expect(event.records[0]).toEqual(expected);
  });

  it('throws when schemaStr not passed for avro event', async () => {
    const consumer = kafkaConsumer<Key, Product>(handler, {
      // @ts-expect-error - testing missing schemaStr
      value: {
        type: 'avro',
      },
    });

    await expect(consumer(avroEvent, {})).rejects.toThrow(
      KafkaConsumerAvroMissingSchemaError
    );
  });

  it('throws when schemaStr not passed for protobuf event', async () => {
    const consumer = kafkaConsumer<Key, Product>(handler, {
      // @ts-expect-error - testing missing schemaStr
      value: {
        type: 'protobuf',
      },
    });

    await expect(consumer(protobufEvent, {})).rejects.toThrow(
      KafkaConsumerProtobufMissingSchemaError
    );
  });

  it('deserializes protobuf message', async () => {
    const consumer = kafkaConsumer<Key, Product>(handler, {
      value: {
        type: 'protobuf',
        schema: ProductProto,
      },
      key: {
        type: 'json',
      },
    });

    const event = await consumer(protobufEvent, {});
    const expected = {
      key: 42,
      value: { id: 1001, name: 'Laptop', price: 999.99 },
      headers: [{ headerKey: 'headerValue' }],
      originalKey: 'NDI=',
      originalValue: 'COkHEgZMYXB0b3AZUrgehes/j0A=',
      originalHeaders: [
        { headerKey: [104, 101, 97, 100, 101, 114, 86, 97, 108, 117, 101] },
      ],
    };
    expect(event.records[0]).toEqual(expected);
  });

  it('throws if schema type is not json, avro or protobuf', async () => {
    const consumer = kafkaConsumer<Key, Product>(handler, {
      value: {
        // @ts-expect-error - testing unsupported type
        type: 'xml', // unsupported type
      },
    });
    await expect(consumer(jsonEvent, {})).rejects.toThrow();
  });

  it('deserializes to base64 string if no configuration provided', async () => {
    const consumer = kafkaConsumer<Key, Product>(handler, {
      value: {
        type: 'json',
      },
    });

    const event = await consumer(jsonEvent, {});
    const expected = {
      key: 'recordKey',
      value: { id: 12345, name: 'product5', price: 45 },
      headers: [{ headerKey: 'headerValue' }],
      originalKey: 'cmVjb3JkS2V5',
      originalValue:
        'ewogICJpZCI6IDEyMzQ1LAogICJuYW1lIjogInByb2R1Y3Q1IiwKICAicHJpY2UiOiA0NQp9',
      originalHeaders: [
        { headerKey: [104, 101, 97, 100, 101, 114, 86, 97, 108, 117, 101] },
      ],
    };
    expect(event.records[0]).toEqual(expected);
  });

  it('deserializes with no headers provided', async () => {
    const consumer = kafkaConsumer<Key, Product>(handler, {
      value: {
        type: 'json',
      },
    });

    const jsonEventWithoutHeaders = {
      ...jsonEvent,
      records: {
        'test-topic': [
          {
            key: 'cmVjb3JkS2V5',
            value:
              'ewogICJpZCI6IDEyMzQ1LAogICJuYW1lIjogInByb2R1Y3Q1IiwKICAicHJpY2UiOiA0NQp9',
            headers: null, // No headers
          },
        ],
      },
    };

    const event = await consumer(jsonEventWithoutHeaders, {});
    expect(event.records[0]).toEqual({
      key: 'recordKey',
      value: { id: 12345, name: 'product5', price: 45 },
      headers: null,
      originalKey: 'cmVjb3JkS2V5',
      originalValue:
        'ewogICJpZCI6IDEyMzQ1LAogICJuYW1lIjogInByb2R1Y3Q1IiwKICAicHJpY2UiOiA0NQp9',
      originalHeaders: null,
    });
  });

  it('validates key and value using Zod schemas for json', async () => {
    const consumer = kafkaConsumer<Key, Product>(handler, {
      value: {
        type: 'json',
        zodSchema: valueZodSchema,
      },
      key: {
        type: 'json',
        zodSchema: keyZodSchema,
      },
    });

    const event = await consumer(jsonEvent, {});
    expect(event.records[0].key).toEqual('recordKey');
    expect(event.records[0].value).toEqual({
      id: 12345,
      name: 'product5',
      price: 45,
    });
  });

  it('throws when zod schema validation fails', async () => {
    const invalidJsonEvent = {
      ...jsonEvent,
      records: {
        'test-topic': [
          {
            key: 'cmVjb3JkS2V5',
            value:
              'eyJpZCI6NDIsIm5hbWUiOiJpbnZhbGlkUHJvZHVjdCIsInByaWNlIjotMTAwfQ==', // Invalid JSON: negative price
            headers: null,
          },
        ],
      },
    };
    const consumer = kafkaConsumer<Key, Product>(handler, {
      value: {
        type: 'json',
        zodSchema: valueZodSchema,
      },
      key: {
        type: 'json',
        zodSchema: keyZodSchema,
      },
    });

    await expect(consumer(invalidJsonEvent, {})).rejects.toThrow(
      expect.objectContaining({
        issues: [
          {
            code: 'too_small',
            minimum: 0,
            type: 'number',
            inclusive: false,
            exact: false,
            message: "Price can't be negative",
            path: ['price'],
          },
        ],
      })
    );
  });
});
