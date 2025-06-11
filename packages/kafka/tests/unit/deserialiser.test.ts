import type { MessageType } from '@protobuf-ts/runtime';
import { describe, expect, it } from 'vitest';
import {
  deserialiseAvro,
  deserialiseProtobuf,
} from '../../src/deserialiser.js';
import { KafkaConsumerDeserializationError } from '../../src/errors.js';
import { Product } from '../protos/product.generated.js';

describe('deserialiser: ', () => {
  it('returns avro deserialised value', () => {
    const message = '0g8MTGFwdG9wUrgehes/j0A=';
    const schema = `{
      "type": "record",
      "name": "Product",
      "fields": [
        { "name": "id", "type": "int" },
        { "name": "name", "type": "string" },
        { "name": "price", "type": "double" }
      ]
    }`;

    const expected = { id: 1001, name: 'Laptop', price: 999.99 };

    expect(deserialiseAvro(message, schema)).toEqual(expected);
  });

  it('throws when avro deserialiser fails', () => {
    const message = '0g8MTGFwdG9wUrgehes/j0A=';
    const schema = `{
      "type": "record",
      "name": "Product",
      "fields": [
        { "name": "id", "type": "int" },
        { "name": "name", "type": "string" },
      ]
    }`; // Invalid schema, missing "price" field

    expect(() => deserialiseAvro(message, schema)).toThrow(
      KafkaConsumerDeserializationError
    );
  });

  it('throws when protobuf serialise fails', () => {
    const data = 'COkHEgZMYXB0b3AZUrgehes/j0A=';
    const schema = {} as MessageType<Product>; // Using the Product type directly

    expect(() => deserialiseProtobuf(schema, data)).toThrow(
      KafkaConsumerDeserializationError
    );
  });

  it('returns protobuf deserialised value', () => {
    const data = 'COkHEgZMYXB0b3AZUrgehes/j0A=';
    const expected = { id: 1001, name: 'Laptop', price: 999.99 };

    expect(deserialiseProtobuf(Product, data)).toEqual(expected);
  });
});
