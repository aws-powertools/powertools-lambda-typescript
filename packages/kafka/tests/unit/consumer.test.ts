import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Context } from 'aws-lambda';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { kafkaConsumer } from '../../src/consumer.js';
import {
  KafkaConsumerAvroMissingSchemaError,
  KafkaConsumerParserError,
  KafkaConsumerProtobufMissingSchemaError,
} from '../../src/errors.js';
import type { ConsumerRecords, MSKEvent } from '../../src/types/types.js';
import { Product as ProductProto } from '../protos/product.es6.generated.js';

describe('Kafka consumer: ', () => {
  const keyZodSchema = z.string();

  const valueZodSchema = z.object({
    id: z.number(),
    name: z.string(),
    price: z.number().positive({
      message: "Price can't be negative",
    }),
  });

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

  type Key = z.infer<typeof keyZodSchema>;
  type Product = z.infer<typeof valueZodSchema>;

  const handler = async (
    event: ConsumerRecords<Key, Product>,
    _context: Context
  ): Promise<ConsumerRecords<Key, Product>> => {
    return event;
  };
  it('deserializes json message', async () => {
    // Prepare
    const consumer = kafkaConsumer<Key, Product>(handler, {
      value: {
        type: 'json',
      },
      key: {
        type: 'json',
      },
    });
    // Act
    const event = await consumer(jsonTestEvent, context);
    // Assess
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
    // Prepare
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

    // Act
    const event = await consumer(avroTestEvent, context);
    // Assess
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
    // Prepare
    const consumer = kafkaConsumer<Key, Product>(handler, {
      // @ts-expect-error - testing missing schemaStr
      value: {
        type: 'avro',
      },
    });

    // Act & Assess
    await expect(consumer(avroTestEvent, context)).rejects.toThrow(
      KafkaConsumerAvroMissingSchemaError
    );
  });

  it('throws when schemaStr not passed for protobuf event', async () => {
    // Prepare
    const consumer = kafkaConsumer<Key, Product>(handler, {
      // @ts-expect-error - testing missing schemaStr
      value: {
        type: 'protobuf',
      },
    });

    // Act & Assess
    await expect(consumer(protobufTestEvent, context)).rejects.toThrow(
      KafkaConsumerProtobufMissingSchemaError
    );
  });

  it('deserializes protobuf message', async () => {
    // Prepare
    const consumer = kafkaConsumer<Key, Product>(handler, {
      value: {
        type: 'protobuf',
        schema: ProductProto,
      },
      key: {
        type: 'json',
      },
    });

    // Act
    const event = await consumer(protobufTestEvent, context);
    // Assess
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
    // Prepare
    const consumer = kafkaConsumer<Key, Product>(handler, {
      value: {
        // @ts-expect-error - testing unsupported type
        type: 'xml', // unsupported type
      },
    });
    // Act & Assess
    await expect(consumer(jsonTestEvent, context)).rejects.toThrow();
  });

  it('deserializes to base64 string if no configuration provided', async () => {
    // Prepare
    const consumer = kafkaConsumer<Key, Product>(handler, {
      value: {
        type: 'json',
      },
    });

    // Act
    const event = await consumer(jsonTestEvent, context);
    // Assess
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
    // Prepare
    const consumer = kafkaConsumer<Key, Product>(handler, {
      value: {
        type: 'json',
      },
    });

    const jsonTestEventWithoutHeaders = {
      ...jsonTestEvent,
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
    } as unknown as MSKEvent;

    // Act
    const event = await consumer(jsonTestEventWithoutHeaders, context);
    // Assess
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
    // Prepare
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

    // Act
    const event = await consumer(jsonTestEvent, context);
    // Assess
    expect(event.records[0].key).toEqual('recordKey');
    expect(event.records[0].value).toEqual({
      id: 12345,
      name: 'product5',
      price: 45,
    });
  });

  it('throws when zod schema validation fails', async () => {
    // Prepare
    const invalidJsonEvent = {
      ...jsonTestEvent,
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

    // Act & Assess
    await expect(consumer(invalidJsonEvent, context)).rejects.toThrow(
      KafkaConsumerParserError
    );
  });

  it('throws when non MSK event passed kafka consumer', async () => {
    // Prepare
    const nonMskEvent = {
      foo: 'bar',
    } as unknown as MSKEvent;

    const consumer = kafkaConsumer<Key, Product>(handler, {
      value: {
        type: 'json',
      },
    });
    // Act & Assess
    await expect(consumer(nonMskEvent, context)).rejects.toThrow(
      'Event is not a valid MSKEvent. Expected an object with a "records" property.'
    );
  });
});
