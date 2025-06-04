import type { Context } from 'aws-lambda';
import { describe, it } from 'vitest';
import { expect } from 'vitest';
import z from 'zod';
import { kafkaConsumer } from '../../src/consumer.js';
import type { ConsumerRecords } from '../../src/types.js';
import * as avroEvent from '../events/avro.json' with { type: 'json' };
import * as jsonEvent from '../events/default.json' with { type: 'json' };

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
    records: ConsumerRecords<Key, Product>[],
    _context: Context
  ) => {
    return records;
  };
  it('should deserialise json message', async () => {
    const consumer = kafkaConsumer<Key, Product>(handler, {
      value: {
        type: 'json',
        outputObject: valueObj,
      },
      key: {
        type: 'json',
        outputObject: keyObj,
      },
    });

    const records = await consumer(jsonEvent, {});
    const expected = {
      key: 'recordKey',
      value: { id: 12345, name: 'product5', price: 45 },
      originalKey: 'cmVjb3JkS2V5',
      originalValue:
        'ewogICJpZCI6IDEyMzQ1LAogICJuYW1lIjogInByb2R1Y3Q1IiwKICAicHJpY2UiOiA0NQp9',
    };
    expect(records[0]).toEqual(expected);
  });

  it('should deserialise avro message', async () => {
    const consumer = kafkaConsumer<Key, Product>(handler, {
      value: {
        type: 'avro',
        schemaStr: `{
          "type": "record",
          "name": "Product",
          "fields": [
            { "name": "id", "type": "int" },
            { "name": "name", "type": "string" },
            { "name": "price", "type": "double" }
          ]
        }`,
        outputObject: valueObj,
      },
      key: {
        type: 'json',
        outputObject: keyObj,
      },
    });

    const records = await consumer(avroEvent, {});
    const expected = {
      key: 42,
      value: { id: 1001, name: 'Laptop', price: 999.99 },
      originalKey: 'NDI=',
      originalValue: '0g8MTGFwdG9wUrgehes/j0A=',
    };
    expect(records[0]).toEqual(expected);
  });
});
