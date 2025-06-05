import { describe, expect, it } from 'vitest';
import {
  deserialiseAvro,
  deserialiseProtobuf,
} from '../../src/deserialiser.js';
import { KafkaConsumerDeserializationError } from '../../src/errors.js';

describe('deserialiser: ', () => {
  it('returns avro deserialised value', () => {
    const message = '0g8MTGFwdG9wUrgehes/j0A=';
    const schemaStr = `{
      "type": "record",
      "name": "Product",
      "fields": [
        { "name": "id", "type": "int" },
        { "name": "name", "type": "string" },
        { "name": "price", "type": "double" }
      ]
    }`;

    const expected = { id: 1001, name: 'Laptop', price: 999.99 };

    expect(deserialiseAvro(message, schemaStr)).toEqual(expected);
  });

  it('throws when avro deserialiser fails', () => {
    const message = '0g8MTGFwdG9wUrgehes/j0A=';
    const schemaStr = `{
      "type": "record",
      "name": "Product",
      "fields": [
        { "name": "id", "type": "int" },
        { "name": "name", "type": "string" },
      ]
    }`; // Invalid schema, missing "price" field

    expect(() => deserialiseAvro(message, schemaStr)).toThrow(
      KafkaConsumerDeserializationError
    );
  });

  it('throws when protobuf serialise fails', () => {
    const data = 'COkHEgZMYXB0b3AZUrgehes/j0A=';
    const messageName = 'Product';
    const schemaStr = `syntax = "proto3"`;

    expect(() => deserialiseProtobuf(schemaStr, messageName, data)).toThrow(
      KafkaConsumerDeserializationError
    );
  });

  it('returns protobuf deserialised value', () => {
    const data = 'COkHEgZMYXB0b3AZUrgehes/j0A=';
    const messageName = 'Product';
    const schemaStr = `syntax = "proto3";
      message Product {
        int32 id = 1;
        string name = 2;
        double price = 3;
      }`;

    const expected = { id: 1001, name: 'Laptop', price: 999.99 };

    expect(deserialiseProtobuf(schemaStr, messageName, data)).toEqual(expected);
  });
});
