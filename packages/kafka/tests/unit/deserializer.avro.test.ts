import { describe, expect, it } from 'vitest';
import { deserialize } from '../../src/deserializer/avro.js';
import { KafkaConsumerDeserializationError } from '../../src/errors.js';

describe('Avro Deserializer: ', () => {
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

  it('throws when avro deserialiser fails', async () => {
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
    await expect(deserialize(message, schema)).rejects.toThrow(
      KafkaConsumerDeserializationError
    );
  });

  it('throws when avro deserialiser has not matching schema', async () => {
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
    await expect(deserialize(message, schema)).rejects.toThrow(
      KafkaConsumerDeserializationError
    );
  });
});
