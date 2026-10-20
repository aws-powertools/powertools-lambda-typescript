import { beforeAll, describe, expect, it } from 'vitest';
import { createDeserializer } from '../../src/deserializer/avro.js';
import { KafkaConsumerDeserializationError } from '../../src/errors.js';

describe('Avro Deserializer: ', () => {
  let deserialize: Awaited<ReturnType<typeof createDeserializer>>;
  const productSchema = `{
    "type": "record",
    "name": "Product",
    "fields": [
      { "name": "id", "type": "int" },
      { "name": "name", "type": "string" },
      { "name": "price", "type": "double" }
    ]
  }`;

  beforeAll(async () => {
    deserialize = await createDeserializer();
  });

  it('returns avro deserialised value', async () => {
    // Prepare
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

    // Act & Assess
    expect(await deserialize(message, schema)).toEqual(expected);
  });

  it('throws when avro deserialiser fails', () => {
    // Prepare
    const message = '0g8MTGFwdG9wUrgehes/j0A=';
    const schema = `{
      "type": "record",
      "name": "Product",
      "fields": [
        { "name": "id", "type": "int" },
        { "name": "name", "type": "string" },
      ]
    }`; // Invalid schema, missing "price" field

    // Act & Assess
    expect(() => deserialize(message, schema)).toThrow(
      KafkaConsumerDeserializationError
    );
  });

  it('throws when avro deserialiser has not matching schema', () => {
    // Prepare
    const message = '0g8MTGFwdG9wUrgehes/j0A=';
    const schema = `{
      "type": "record",
      "name": "Product",
      "fields": [
        { "name": "productId", "type": "int" },
        { "name": "productName", "type": "string" },
        { "name": "productPrice", "type": "double" },
      ]
    }`; // Valid schema, but does not match the message content

    // Act & Assess
    expect(() => deserialize(message, schema)).toThrow(
      KafkaConsumerDeserializationError
    );
  });

  it('strips the header from a Confluent wire format message', () => {
    // Prepare
    const message = 'AAAAAAHSDwxMYXB0b3BSuB6F6z+PQA==';
    const expected = { id: 1001, name: 'Laptop', price: 999.99 };

    // Act & Assess
    expect(deserialize(message, productSchema, 'confluent')).toEqual(expected);
  });

  it('does not strip a leading zero byte when no wire format is set', () => {
    // Prepare
    const message = 'AAxMYXB0b3A=';
    const schema = `{
      "type": "record",
      "name": "Product",
      "fields": [
        { "name": "id", "type": "int" },
        { "name": "name", "type": "string" }
      ]
    }`;

    // Act & Assess
    expect(deserialize(message, schema)).toEqual({ id: 0, name: 'Laptop' });
  });

  it.each([
    { description: 'shorter than the header', message: 'AAAAAQ==' },
    { description: 'empty', message: '' },
  ])('throws when the Confluent payload is $description', ({ message }) => {
    // Act & Assess
    expect(() => deserialize(message, productSchema, 'confluent')).toThrow(
      new KafkaConsumerDeserializationError(
        'Invalid Confluent wire format: payload must contain a 5-byte header'
      )
    );
  });

  it('returns null for a header-only payload when the schema is null', () => {
    // Act & Assess
    expect(deserialize('AAAAAAE=', '"null"', 'confluent')).toBeNull();
  });

  it('throws when the Confluent magic byte is wrong', () => {
    // Prepare
    const message = 'AQAAAAHSDwxMYXB0b3BSuB6F6z+PQA==';

    // Act & Assess
    expect(() => deserialize(message, productSchema, 'confluent')).toThrow(
      new KafkaConsumerDeserializationError(
        'Invalid Confluent wire format: expected magic byte 0x00'
      )
    );
  });

  it('throws when the wire format is not supported', () => {
    // Prepare
    const message = 'AAAAAAHSDwxMYXB0b3BSuB6F6z+PQA==';

    // Act & Assess
    expect(() =>
      // @ts-expect-error - testing unsupported wire format
      deserialize(message, productSchema, 'glue')
    ).toThrow(
      new KafkaConsumerDeserializationError(
        'Unsupported Avro wire format: glue'
      )
    );
  });
});
