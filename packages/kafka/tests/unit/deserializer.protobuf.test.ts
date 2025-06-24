import type { Message } from 'protobufjs';
import { describe, expect, it } from 'vitest';
import { deserialize } from '../../src/deserializer/protobuf.js';
import { KafkaConsumerDeserializationError } from '../../src/errors.js';
import type { ProtobufMessage } from '../../src/types/types.js';
import { Product } from '../protos/product.generated.js';

describe('Protobuf deserialiser: ', () => {
  it('throws when protobuf serialise fails', () => {
    // Prepare
    const data = 'COkHEgZMYXB0b3AZUrgehes/j0A=';
    const invalidType = {} as ProtobufMessage<Message>;
    const schemaMetadata = {
      dataFormat: 'PROTOBUF',
    };

    // Act & Assess
    expect(() => deserialize(data, invalidType, schemaMetadata)).toThrow(
      KafkaConsumerDeserializationError
    );
  });

  it('returns protobuf deserialised value', () => {
    // Prepare
    const data = 'COkHEgZMYXB0b3AZUrgehes/j0A=';
    const expected = { id: 1001, name: 'Laptop', price: 999.99 };
    const schemaMetadata = {
      dataFormat: 'PROTOBUF',
    };

    // Act
    const result = deserialize(data, Product, schemaMetadata);

    // Assess
    expect(result).toEqual(expected);
  });

  it('throws if unable to parse a Confluent Schema Registry protobuf', () => {
    // Prepare
    const data = 'COkHEgZMYXB0b3AZUrgehes/j0A=';
    const schemaMetadata = {
      dataFormat: 'PROTOBUF',
      schemaId: '1',
    };

    // Act & Assess
    expect(() => deserialize(data, Product, schemaMetadata)).toThrow(
      KafkaConsumerDeserializationError
    );
  });
});
