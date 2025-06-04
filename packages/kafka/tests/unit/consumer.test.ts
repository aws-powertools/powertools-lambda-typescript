import type { Context } from 'aws-lambda';
import { describe, it } from 'vitest';
import { expect } from 'vitest';
import z from 'zod';
import { kafkaConsumer } from '../../src/consumer.js';
import type { ConsumerRecords } from '../../src/types.js';
import * as event from '../events/default.json' with { type: 'json' };

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

  it('should have a valid schema type', async () => {
    const handler = async (
      records: ConsumerRecords<Key, Product>[],
      _context: Context
    ) => {
      return records;
    };

    const consumer = kafkaConsumer<Key, Product>(handler, {
      value: {
        type: 'json',
        outputObject: keyObj,
      },
      key: {
        type: 'json',
        outputObject: valueObj,
      },
    });

    const records = await consumer(event, {});
    const expected = {
      key: 'recordKey',
      value: { id: 12345, name: 'product5', price: 45 },
      originalKey: 'cmVjb3JkS2V5',
      originalValue:
        'ewogICJpZCI6IDEyMzQ1LAogICJuYW1lIjogInByb2R1Y3Q1IiwKICAicHJpY2UiOiA0NQp9',
    };
    expect(records[0]).toEqual(expected);
  });
});
