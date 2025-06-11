import type { Context } from 'aws-lambda';
import { describe, expect, it } from 'vitest';
import z from 'zod';
import { kafkaConsumer } from '../../src/consumer.js';
import {
  KafkaConsumerAvroMissingSchemaError,
  KafkaConsumerProtobufMissingSchemaError,
} from '../../src/errors.js';
import type { ConsumerRecords } from '../../src/types.js';
import * as avroEvent from '../events/avro.json' with { type: 'json' };
import * as jsonEvent from '../events/default.json' with { type: 'json' };
import * as protobufEvent from '../events/protobuf.json' with { type: 'json' };
import { Product } from '../protos/product.generated.js';

describe('Kafka consumer: ', () => {
  //{   "id": 12345,   "name": "product5",   "price": 45 }
  const keyObj = z.object({
    key: z.string(),
  });

  const valueObj = z.object({
    value: z.object({
      id: z.number(),
      name: z.string(),
      price: z.number(),
    }),
  });

  type Key = z.infer<typeof keyObj>;
  type Product = z.infer<typeof valueObj>;

  const handler = async (
    records: ConsumerRecords<Key, Product>,
    _context: Context
  ) => {
    return records;
  };
  it('should deserialise json message', async () => {
    const consumer = kafkaConsumer<Key, Product>(handler, {
      value: {
        type: 'json',
      },
      key: {
        type: 'json',
      },
    });

    const records = await consumer(jsonEvent, {});
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
    expect(records[0]).toEqual(expected);
  });

  it('should deserialise avro message', async () => {
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
        outputSerializer: valueObj,
      },
      key: {
        type: 'json',
      },
    });

    const records = await consumer(avroEvent, {});
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
    expect(records[0]).toEqual(expected);
  });

  it('throws when schemaStr not passed for avro event', async () => {
    const consumer = kafkaConsumer<Key, Product>(handler, {
      // @ts-expect-error - testing missing schemaStr
      value: {
        type: 'avro',
        outputSerializer: valueObj,
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

  it('should deserialise protobuf message', async () => {
    const consumer = kafkaConsumer<Key, Product>(handler, {
      value: {
        type: 'protobuf',
        schema: Product,
      },
      key: {
        type: 'json',
      },
    });

    const records = await consumer(protobufEvent, {});
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
    expect(records[0]).toEqual(expected);
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

  it('deserialises to base64 string if no configuration provided', async () => {
    const consumer = kafkaConsumer<Key, Product>(handler, {
      value: {
        type: 'json',
      },
    });

    const records = await consumer(jsonEvent, {});
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
    expect(records[0]).toEqual(expected);
  });

  it('deserialises with no headers provided', () => {
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

    const records = consumer(jsonEventWithoutHeaders, {});
    expect(records).resolves.toEqual([
      {
        key: 'recordKey',
        value: { id: 12345, name: 'product5', price: 45 },
        headers: null,
        originalKey: 'cmVjb3JkS2V5',
        originalValue:
          'ewogICJpZCI6IDEyMzQ1LAogICJuYW1lIjogInByb2R1Y3Q1IiwKICAicHJpY2UiOiA0NQp9',
        originalHeaders: null,
      },
    ]);
  });
});
